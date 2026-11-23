import { ComputedRoom, FloorProject, RoomOverride, WallEdge, WallNode } from '../types/planner';

export function polygonAreaSigned(pts: { x: number; y: number }[]): number {
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return sum / 2;
}

export function polygonCentroid(pts: { x: number; y: number }[]): { x: number; y: number } {
  let cx = 0;
  let cy = 0;
  pts.forEach((p) => {
    cx += p.x;
    cy += p.y;
  });
  return { x: cx / Math.max(1, pts.length), y: cy / Math.max(1, pts.length) };
}

export function pointInPolygon(x: number, y: number, poly: { x: number; y: number }[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi + 1e-9) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

export function distPointToSeg(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  if (len2 < 1e-8) return { dist: Math.hypot(px - x1, py - y1), t: 0 };
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / len2));
  return { dist: Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy)), t };
}

/**
 * Extracts minimal closed rooms (planar faces) from connected wall nodes and edges.
 */
export function computeRoomsFromGraph(
  nodes: WallNode[],
  walls: WallEdge[],
  overrides: Record<string, RoomOverride>
): ComputedRoom[] {
  const nodeMap = new Map<string, WallNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  interface HalfEdge {
    id: string;
    from: string;
    to: string;
    angle: number;
  }

  const adj = new Map<string, HalfEdge[]>();
  nodes.forEach((n) => adj.set(n.id, []));

  walls.forEach((w) => {
    const a = nodeMap.get(w.startId);
    const b = nodeMap.get(w.endId);
    if (!a || !b || a.id === b.id) return;
    adj.get(a.id)?.push({
      id: `${w.id}:f`,
      from: a.id,
      to: b.id,
      angle: Math.atan2(b.y - a.y, b.x - a.x),
    });
    adj.get(b.id)?.push({
      id: `${w.id}:b`,
      from: b.id,
      to: a.id,
      angle: Math.atan2(a.y - b.y, a.x - b.x),
    });
  });

  // Sort outgoing half-edges counter-clockwise by angle
  adj.forEach((list) => list.sort((e1, e2) => e1.angle - e2.angle));

  const visited = new Set<string>();
  const rawFaces: { nodeIds: string[]; pts: { x: number; y: number }[]; signedArea: number }[] = [];

  adj.forEach((list) => {
    for (const startEdge of list) {
      if (visited.has(startEdge.id)) continue;
      const cycleIds: string[] = [];
      let cur: HalfEdge | undefined = startEdge;
      let guard = 0;

      while (cur && !visited.has(cur.id) && guard < 60) {
        visited.add(cur.id);
        cycleIds.push(cur.from);
        const nextNodeList: HalfEdge[] = adj.get(cur.to) || [];
        if (nextNodeList.length === 0) {
          cur = undefined;
          break;
        }
        // Reverse angle from cur.to back to cur.from
        const revAngle = Math.atan2(
          (nodeMap.get(cur.from)?.y ?? 0) - (nodeMap.get(cur.to)?.y ?? 0),
          (nodeMap.get(cur.from)?.x ?? 0) - (nodeMap.get(cur.to)?.x ?? 0)
        );
        // Find twin index in nextNodeList (closest to revAngle)
        let twinIdx = 0;
        let bestDiff = Infinity;
        nextNodeList.forEach((cand: HalfEdge, i: number) => {
          const diff = Math.abs(Math.atan2(Math.sin(cand.angle - revAngle), Math.cos(cand.angle - revAngle)));
          if (diff < bestDiff) {
            bestDiff = diff;
            twinIdx = i;
          }
        });
        // Step to previous edge in CCW order (turn right / interior minimal face)
        const nextIdx = (twinIdx - 1 + nextNodeList.length) % nextNodeList.length;
        cur = nextNodeList[nextIdx];
        if (cur && cur.id === startEdge.id) break;
        guard++;
      }

      if (cur && cur.id === startEdge.id && cycleIds.length >= 3) {
        const pts = cycleIds
          .map((id) => nodeMap.get(id))
          .filter((n): n is WallNode => Boolean(n))
          .map((n) => ({ x: n.x, y: n.y }));
        const signedArea = polygonAreaSigned(pts);
        // Positive signed area in Y-down screen coords corresponds to CW/interior face
        if (signedArea > 0.35) {
          rawFaces.push({ nodeIds: cycleIds, pts, signedArea });
        }
      }
    }
  });

  // Deduplicate by sorted unique node IDs
  const seenKeys = new Set<string>();
  const rooms: ComputedRoom[] = [];
  rawFaces.forEach((f, idx) => {
    const key = [...new Set(f.nodeIds)].sort().join('|');
    if (seenKeys.has(key)) return;
    seenKeys.add(key);
    const ov = overrides[key];
    const centroid = polygonCentroid(f.pts);
    const areaSqm = Math.abs(f.signedArea);
    rooms.push({
      key,
      name: ov?.name || (areaSqm > 20 ? '거실' : `방 ${idx + 1}`),
      polygon: f.pts,
      areaSqm,
      centroid,
      floorMaterialId: ov?.floorMaterialId || (areaSqm > 18 ? 'tl-yun-cream600' : 'fl-dongwha-max-essence'),
      ceilingType: ov?.ceilingType || (areaSqm > 18 ? 'well_cove' : 'flat'),
      coveLightOn: ov?.coveLightOn ?? (areaSqm > 18),
    });
  });

  return rooms;
}

export function projectBounds(proj: FloorProject) {
  if (proj.nodes.length === 0) return { minX: 0, minY: 0, maxX: 12, maxY: 10 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  proj.nodes.forEach((n) => {
    if (n.x < minX) minX = n.x;
    if (n.y < minY) minY = n.y;
    if (n.x > maxX) maxX = n.x;
    if (n.y > maxY) maxY = n.y;
  });
  return { minX, minY, maxX, maxY };
}
