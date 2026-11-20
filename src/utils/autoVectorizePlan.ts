import { OpeningItem, ProjectData, RoomKind, RoomZone, WallSegment } from '../types/studio';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = src;
  });
}

function rgbToHsv(r: number, g: number, b: number) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  return { h, s, v };
}

function guessRoomKind(
  avgR: number,
  avgG: number,
  avgB: number,
  areaSqm: number,
  isLargest: boolean
): { kind: RoomKind; name: string; floorMaterialId: string } {
  const { h, s, v } = rgbToHsv(avgR, avgG, avgB);

  if (s > 0.06 && h >= 175 && h <= 240) {
    return { kind: 'bath', name: '욕실', floorMaterialId: 'fl-warm-concrete' };
  }
  if (s < 0.09 && v < 0.92) {
    if (areaSqm < 4.5) {
      return { kind: 'entrance', name: '현관', floorMaterialId: 'fl-warm-concrete' };
    }
    return { kind: 'balcony', name: '발코니', floorMaterialId: 'fl-warm-concrete' };
  }
  if (isLargest) {
    return { kind: 'living', name: '거실', floorMaterialId: 'fl-cream-porcelain' };
  }
  if (areaSqm >= 10) {
    return { kind: 'master', name: '안방', floorMaterialId: 'fl-natural-oak' };
  }
  if (areaSqm >= 5.5) {
    return { kind: 'bedroom', name: '침실', floorMaterialId: 'fl-natural-oak' };
  }
  if (areaSqm >= 2.5) {
    return { kind: 'dress', name: '팬트리/드레스룸', floorMaterialId: 'fl-white-oak' };
  }
  return { kind: 'balcony', name: '발코니', floorMaterialId: 'fl-warm-concrete' };
}

export async function autoVectorizeFloorPlan(
  imageSrc: string,
  cropNorm?: { x: number; y: number; w: number; h: number }
): Promise<Partial<ProjectData>> {
  const img = await loadImg(imageSrc);
  const natW = img.naturalWidth || 800;
  const natH = img.naturalHeight || 600;

  const sx = cropNorm ? Math.round(cropNorm.x * natW) : 0;
  const sy = cropNorm ? Math.round(cropNorm.y * natH) : 0;
  const sw = cropNorm ? Math.max(40, Math.round(cropNorm.w * natW)) : natW;
  const sh = cropNorm ? Math.max(40, Math.round(cropNorm.h * natH)) : natH;

  const maxDim = 320;
  const scale = Math.min(maxDim / sw, maxDim / sh);
  const gw = Math.max(80, Math.round(sw * scale));
  const gh = Math.max(80, Math.round(sh * scale));

  const canvas = document.createElement('canvas');
  canvas.width = gw;
  canvas.height = gh;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, gw, gh);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, gw, gh);

  const { data } = ctx.getImageData(0, 0, gw, gh);

  // 1) Detect dark wall pixels
  const rawWall = new Uint8Array(gw * gh);
  for (let i = 0; i < gw * gh; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const { s, v } = rgbToHsv(r, g, b);
    if (v < 0.45 && s < 0.25) {
      rawWall[i] = 1;
    }
  }

  // Filter out 1px isolated text/furniture dots (keep pixels with >=2 wall neighbors)
  const wallMask = new Uint8Array(gw * gh);
  for (let y = 1; y < gh - 1; y++) {
    for (let x = 1; x < gw - 1; x++) {
      const idx = y * gw + x;
      if (!rawWall[idx]) continue;
      const nb =
        rawWall[idx - 1] +
        rawWall[idx + 1] +
        rawWall[idx - gw] +
        rawWall[idx + gw];
      if (nb >= 2) wallMask[idx] = 1;
    }
  }

  // 2) Dilate wallMask by radius 3px to close door gaps for accurate room separation
  const closedMask = new Uint8Array(gw * gh);
  const rad = 3;
  for (let y = rad; y < gh - rad; y++) {
    for (let x = rad; x < gw - rad; x++) {
      const idx = y * gw + x;
      if (!wallMask[idx]) continue;
      for (let dy = -rad; dy <= rad; dy++) {
        for (let dx = -rad; dx <= rad; dx++) {
          closedMask[(y + dy) * gw + (x + dx)] = 1;
        }
      }
    }
  }

  // 3) Flood-fill exterior white background
  const visited = new Uint8Array(gw * gh);
  const queue = new Int32Array(gw * gh);
  let head = 0;
  let tail = 0;

  const isWhite = (idx: number) => {
    return data[idx * 4] > 228 && data[idx * 4 + 1] > 228 && data[idx * 4 + 2] > 228;
  };

  for (let x = 0; x < gw; x++) {
    if (isWhite(x) && !closedMask[x]) { visited[x] = 1; queue[tail++] = x; }
    const b = (gh - 1) * gw + x;
    if (isWhite(b) && !closedMask[b]) { visited[b] = 1; queue[tail++] = b; }
  }
  for (let y = 0; y < gh; y++) {
    const l = y * gw;
    if (isWhite(l) && !closedMask[l] && !visited[l]) { visited[l] = 1; queue[tail++] = l; }
    const r = y * gw + (gw - 1);
    if (isWhite(r) && !closedMask[r] && !visited[r]) { visited[r] = 1; queue[tail++] = r; }
  }

  while (head < tail) {
    const cur = queue[head++];
    const cx = cur % gw;
    const cy = (cur / gw) | 0;
    const nbs = [
      cx > 0 ? cur - 1 : -1,
      cx < gw - 1 ? cur + 1 : -1,
      cy > 0 ? cur - gw : -1,
      cy < gh - 1 ? cur + gw : -1,
    ];
    for (const nb of nbs) {
      if (nb >= 0 && !visited[nb] && !closedMask[nb] && isWhite(nb)) {
        visited[nb] = 1;
        queue[tail++] = nb;
      }
    }
  }

  // 4) Extract enclosed room regions
  interface RawRegion {
    rect: Rect;
    pxCount: number;
    avgR: number;
    avgG: number;
    avgB: number;
  }
  const regions: RawRegion[] = [];
  const minRoomPx = Math.max(70, Math.round(gw * gh * 0.0035));

  for (let y = 1; y < gh - 1; y++) {
    for (let x = 1; x < gw - 1; x++) {
      const start = y * gw + x;
      if (visited[start] || closedMask[start]) continue;
      head = 0;
      tail = 0;
      visited[start] = 1;
      queue[tail++] = start;

      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let sumR = 0;
      let sumG = 0;
      let sumB = 0;

      while (head < tail) {
        const cur = queue[head++];
        const cx = cur % gw;
        const cy = (cur / gw) | 0;
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy;
        if (cy > maxY) maxY = cy;
        sumR += data[cur * 4];
        sumG += data[cur * 4 + 1];
        sumB += data[cur * 4 + 2];

        const nbs = [
          cx > 0 ? cur - 1 : -1,
          cx < gw - 1 ? cur + 1 : -1,
          cy > 0 ? cur - gw : -1,
          cy < gh - 1 ? cur + gw : -1,
        ];
        for (const nb of nbs) {
          if (nb >= 0 && !visited[nb] && !closedMask[nb]) {
            visited[nb] = 1;
            queue[tail++] = nb;
          }
        }
      }

      const rw = maxX - minX + 1;
      const rh = maxY - minY + 1;
      if (tail >= minRoomPx && rw >= 8 && rh >= 8 && rw < gw * 0.9 && rh < gh * 0.9) {
        regions.push({
          rect: { x: minX, y: minY, w: rw, h: rh },
          pxCount: tail,
          avgR: sumR / tail,
          avgG: sumG / tail,
          avgB: sumB / tail,
        });
      }
    }
  }

  // 5) Extract strictly Horizontal & Vertical wall centerlines
  interface HSeg { y: number; x1: number; x2: number }
  interface VSeg { x: number; y1: number; y2: number }
  const hRuns: HSeg[] = [];
  const vRuns: VSeg[] = [];
  const minRunPx = Math.max(12, Math.round(Math.min(gw, gh) * 0.055));

  for (let y = 0; y < gh; y++) {
    let rs = -1;
    for (let x = 0; x <= gw; x++) {
      const isW = x < gw && wallMask[y * gw + x] === 1;
      if (isW && rs < 0) rs = x;
      else if (!isW && rs >= 0) {
        if (x - rs >= minRunPx) hRuns.push({ y, x1: rs, x2: x - 1 });
        rs = -1;
      }
    }
  }

  for (let x = 0; x < gw; x++) {
    let rs = -1;
    for (let y = 0; y <= gh; y++) {
      const isW = y < gh && wallMask[y * gw + x] === 1;
      if (isW && rs < 0) rs = y;
      else if (!isW && rs >= 0) {
        if (y - rs >= minRunPx) vRuns.push({ x, y1: rs, y2: y - 1 });
        rs = -1;
      }
    }
  }

  // Merge parallel adjacent runs into single orthogonal centerlines
  const mergedH: HSeg[] = [];
  hRuns.sort((a, b) => a.y - b.y || a.x1 - b.x1);
  const hClusters: { ys: number[]; x1: number; x2: number }[] = [];
  for (const s of hRuns) {
    const m = hClusters.find(
      (c) => Math.abs(c.ys[c.ys.length - 1] - s.y) <= 3 && !(s.x2 < c.x1 - 5 || s.x1 > c.x2 + 5)
    );
    if (m) {
      m.ys.push(s.y);
      m.x1 = Math.min(m.x1, s.x1);
      m.x2 = Math.max(m.x2, s.x2);
    } else {
      hClusters.push({ ys: [s.y], x1: s.x1, x2: s.x2 });
    }
  }
  hClusters.forEach((c) => {
    mergedH.push({ y: c.ys.reduce((a, b) => a + b, 0) / c.ys.length, x1: c.x1, x2: c.x2 });
  });

  const mergedV: VSeg[] = [];
  vRuns.sort((a, b) => a.x - b.x || a.y1 - b.y1);
  const vClusters: { xs: number[]; y1: number; y2: number }[] = [];
  for (const s of vRuns) {
    const m = vClusters.find(
      (c) => Math.abs(c.xs[c.xs.length - 1] - s.x) <= 3 && !(s.y2 < c.y1 - 5 || s.y1 > c.y2 + 5)
    );
    if (m) {
      m.xs.push(s.x);
      m.y1 = Math.min(m.y1, s.y1);
      m.y2 = Math.max(m.y2, s.y2);
    } else {
      vClusters.push({ xs: [s.x], y1: s.y1, y2: s.y2 });
    }
  }
  vClusters.forEach((c) => {
    mergedV.push({ x: c.xs.reduce((a, b) => a + b, 0) / c.xs.length, y1: c.y1, y2: c.y2 });
  });

  // Map grid -> meters
  const worldW = 14.0;
  const worldD = Math.round(((worldW * gh) / gw) * 100) / 100;
  const mx = worldW / gw;
  const my = worldD / gh;
  const snapM = (v: number) => Math.round(v * 20) / 20;

  // Convert to world coordinates while STRICTLY preserving horizontal (y1===y2) & vertical (x1===x2)
  const hWorld = mergedH
    .map((h) => ({
      y: snapM(h.y * my),
      x1: snapM(h.x1 * mx),
      x2: snapM(h.x2 * mx),
    }))
    .filter((h) => h.x2 - h.x1 >= 0.45);

  const vWorld = mergedV
    .map((v) => ({
      x: snapM(v.x * mx),
      y1: snapM(v.y1 * my),
      y2: snapM(v.y2 * my),
    }))
    .filter((v) => v.y2 - v.y1 >= 0.45);

  // Axis-preserving corner snap: snap horizontal endpoints to nearby vertical X, vertical endpoints to nearby horizontal Y
  for (const h of hWorld) {
    for (const v of vWorld) {
      if (h.y >= v.y1 - 0.3 && h.y <= v.y2 + 0.3) {
        if (Math.abs(h.x1 - v.x) < 0.28) h.x1 = v.x;
        if (Math.abs(h.x2 - v.x) < 0.28) h.x2 = v.x;
      }
      if (v.x >= h.x1 - 0.3 && v.x <= h.x2 + 0.3) {
        if (Math.abs(v.y1 - h.y) < 0.28) v.y1 = h.y;
        if (Math.abs(v.y2 - h.y) < 0.28) v.y2 = h.y;
      }
    }
  }

  const walls: WallSegment[] = [
    ...hWorld.map((h, i) => ({
      id: `vwh-${Date.now()}-${i}`,
      x1: h.x1,
      y1: h.y,
      x2: h.x2,
      y2: h.y,
      thickness: 0.16,
      height: 2.45,
      isExterior: false,
      frontMaterialId: 'wl-diamang-stucco',
      backMaterialId: 'wl-diamang-stucco',
    })),
    ...vWorld.map((v, i) => ({
      id: `vwv-${Date.now()}-${i}`,
      x1: v.x,
      y1: v.y1,
      x2: v.x,
      y2: v.y2,
      thickness: 0.16,
      height: 2.45,
      isExterior: false,
      frontMaterialId: 'wl-diamang-stucco',
      backMaterialId: 'wl-diamang-stucco',
    })),
  ];

  // Build rooms
  regions.sort((a, b) => b.pxCount - a.pxCount);
  let bedCount = 1;
  let bathCount = 1;

  const rooms: RoomZone[] = regions.slice(0, 14).map((reg, idx) => {
    const x1 = snapM(Math.max(0, reg.rect.x - rad) * mx);
    const y1 = snapM(Math.max(0, reg.rect.y - rad) * my);
    const x2 = snapM(Math.min(gw, reg.rect.x + reg.rect.w + rad) * mx);
    const y2 = snapM(Math.min(gh, reg.rect.y + reg.rect.h + rad) * my);
    const areaSqm = Math.max(0.5, (x2 - x1) * (y2 - y1));
    const guess = guessRoomKind(reg.avgR, reg.avgG, reg.avgB, areaSqm, idx === 0);

    let name = guess.name;
    if (guess.kind === 'bedroom') {
      bedCount += 1;
      name = `침실${bedCount}`;
    } else if (guess.kind === 'bath') {
      name = bathCount === 1 ? '공용욕실' : `욕실${bathCount}`;
      bathCount += 1;
    }

    return {
      id: `vrm-${Date.now()}-${idx}`,
      name,
      kind: guess.kind,
      polygon: [
        { x: x1, y: y1 },
        { x: x2, y: y1 },
        { x: x2, y: y2 },
        { x: x1, y: y2 },
      ],
      floorMaterialId: guess.floorMaterialId,
      ceilingType: guess.kind === 'living' ? 'well_cove' : 'flat',
      ceilingMaterialId: 'cl-matte-white',
      coveLightOn: guess.kind === 'living',
      coveKelvin: '3000K',
    };
  });

  const openings: OpeningItem[] = [];
  const sortedByLen = [...walls].sort(
    (a, b) => Math.hypot(b.x2 - b.x1, b.y2 - b.y1) - Math.hypot(a.x2 - a.x1, a.y2 - a.y1)
  );
  if (sortedByLen[0]) {
    openings.push({
      id: `vop-${Date.now()}-1`,
      wallId: sortedByLen[0].id,
      kind: 'window_blind',
      offset: 0.5,
      width: Math.min(2.6, Math.hypot(sortedByLen[0].x2 - sortedByLen[0].x1, sortedByLen[0].y2 - sortedByLen[0].y1) * 0.45),
      height: 1.8,
      sillHeight: 0.3,
      frameMaterialId: 'fm-walnut-wood',
      hasBlind: true,
    });
  }

  return {
    width: worldW,
    depth: worldD,
    underlayWidthM: worldW,
    underlayDepthM: worldD,
    rooms,
    walls,
    openings,
    objects: [],
  };
}
