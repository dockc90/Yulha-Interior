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

  // Cool blue/cyan -> Bathroom
  if (s > 0.08 && h >= 175 && h <= 240) {
    return { kind: 'bath', name: '욕실', floorMaterialId: 'fl-warm-concrete' };
  }
  // Low saturation gray -> Entrance or Balcony
  if (s < 0.1 && v < 0.9) {
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
  if (areaSqm >= 6) {
    return { kind: 'bedroom', name: '침실', floorMaterialId: 'fl-natural-oak' };
  }
  if (areaSqm >= 3.2) {
    return { kind: 'dress', name: '드레스룸/팬트리', floorMaterialId: 'fl-white-oak' };
  }
  return { kind: 'balcony', name: '다용도/발코니', floorMaterialId: 'fl-warm-concrete' };
}

/**
 * Rasterizes a floor plan image (or cropped normalized region) into editable 2D walls, rooms, and openings.
 */
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

  // Working grid resolution (max 320px on longest axis)
  const maxDim = 300;
  const scale = Math.min(maxDim / sw, maxDim / sh);
  const gw = Math.max(60, Math.round(sw * scale));
  const gh = Math.max(60, Math.round(sh * scale));

  const canvas = document.createElement('canvas');
  canvas.width = gw;
  canvas.height = gh;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, gw, gh);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, gw, gh);

  const { data } = ctx.getImageData(0, 0, gw, gh);

  // 1) Classify dark wall pixels (black/dark-gray low saturation)
  const wallMask = new Uint8Array(gw * gh);
  for (let i = 0; i < gw * gh; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const { s, v } = rgbToHsv(r, g, b);
    // Wall pixels: dark & neutral
    if (v < 0.48 && s < 0.28) {
      wallMask[i] = 1;
    }
  }

  // Dilate wall mask by 1px to seal tiny door/window gaps for room flood-fill
  const sealedMask = new Uint8Array(gw * gh);
  for (let y = 1; y < gh - 1; y++) {
    for (let x = 1; x < gw - 1; x++) {
      const idx = y * gw + x;
      if (
        wallMask[idx] ||
        wallMask[idx - 1] ||
        wallMask[idx + 1] ||
        wallMask[idx - gw] ||
        wallMask[idx + gw]
      ) {
        sealedMask[idx] = 1;
      }
    }
  }

  // 2) Mark outside background using flood fill from image borders
  const visited = new Uint8Array(gw * gh);
  const queue = new Int32Array(gw * gh);
  let head = 0;
  let tail = 0;

  const isBorderWhite = (idx: number) => {
    const r = data[idx * 4];
    const g = data[idx * 4 + 1];
    const b = data[idx * 4 + 2];
    return r > 230 && g > 230 && b > 230 && !sealedMask[idx];
  };

  for (let x = 0; x < gw; x++) {
    const top = x;
    const bot = (gh - 1) * gw + x;
    if (isBorderWhite(top) && !visited[top]) {
      visited[top] = 1;
      queue[tail++] = top;
    }
    if (isBorderWhite(bot) && !visited[bot]) {
      visited[bot] = 1;
      queue[tail++] = bot;
    }
  }
  for (let y = 0; y < gh; y++) {
    const left = y * gw;
    const right = y * gw + (gw - 1);
    if (isBorderWhite(left) && !visited[left]) {
      visited[left] = 1;
      queue[tail++] = left;
    }
    if (isBorderWhite(right) && !visited[right]) {
      visited[right] = 1;
      queue[tail++] = right;
    }
  }

  while (head < tail) {
    const cur = queue[head++];
    const cx = cur % gw;
    const cy = (cur / gw) | 0;
    const neighbors = [
      cx > 0 ? cur - 1 : -1,
      cx < gw - 1 ? cur + 1 : -1,
      cy > 0 ? cur - gw : -1,
      cy < gh - 1 ? cur + gw : -1,
    ];
    for (const nb of neighbors) {
      if (nb >= 0 && !visited[nb] && !sealedMask[nb]) {
        const r = data[nb * 4];
        const g = data[nb * 4 + 1];
        const b = data[nb * 4 + 2];
        // Flood through white exterior background
        if (r > 225 && g > 225 && b > 225) {
          visited[nb] = 1;
          queue[tail++] = nb;
        }
      }
    }
  }

  // 3) Extract enclosed room regions
  interface RawRegion {
    rect: Rect;
    pxCount: number;
    avgR: number;
    avgG: number;
    avgB: number;
  }
  const regions: RawRegion[] = [];
  const minRoomPx = Math.max(80, Math.round(gw * gh * 0.004));

  for (let y = 1; y < gh - 1; y++) {
    for (let x = 1; x < gw - 1; x++) {
      const start = y * gw + x;
      if (visited[start] || sealedMask[start]) continue;

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

        const neighbors = [
          cx > 0 ? cur - 1 : -1,
          cx < gw - 1 ? cur + 1 : -1,
          cy > 0 ? cur - gw : -1,
          cy < gh - 1 ? cur + gw : -1,
        ];
        for (const nb of neighbors) {
          if (nb >= 0 && !visited[nb] && !sealedMask[nb]) {
            visited[nb] = 1;
            queue[tail++] = nb;
          }
        }
      }

      const rw = maxX - minX + 1;
      const rh = maxY - minY + 1;
      if (tail >= minRoomPx && rw >= 8 && rh >= 8 && rw < gw * 0.92 && rh < gh * 0.92) {
        const avgR = sumR / tail;
        const avgG = sumG / tail;
        const avgB = sumB / tail;
        // Skip pure blue banner headers (e.g. "84B" blue box) or pure white gaps
        const { h, s } = rgbToHsv(avgR, avgG, avgB);
        if (s > 0.45 && h > 180 && h < 235) continue;
        regions.push({
          rect: { x: minX, y: minY, w: rw, h: rh },
          pxCount: tail,
          avgR,
          avgG,
          avgB,
        });
      }
    }
  }

  // 4) Extract horizontal & vertical wall segments from wallMask
  interface Seg {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  }
  const hSegs: Seg[] = [];
  const vSegs: Seg[] = [];
  const minWallPx = Math.max(10, Math.round(Math.min(gw, gh) * 0.05));

  for (let y = 0; y < gh; y++) {
    let runStart = -1;
    for (let x = 0; x <= gw; x++) {
      const isW = x < gw && wallMask[y * gw + x] === 1;
      if (isW && runStart < 0) runStart = x;
      else if (!isW && runStart >= 0) {
        if (x - runStart >= minWallPx) {
          hSegs.push({ x1: runStart, y1: y, x2: x - 1, y2: y });
        }
        runStart = -1;
      }
    }
  }

  for (let x = 0; x < gw; x++) {
    let runStart = -1;
    for (let y = 0; y <= gh; y++) {
      const isW = y < gh && wallMask[y * gw + x] === 1;
      if (isW && runStart < 0) runStart = y;
      else if (!isW && runStart >= 0) {
        if (y - runStart >= minWallPx) {
          vSegs.push({ x1: x, y1: runStart, x2: x, y2: y - 1 });
        }
        runStart = -1;
      }
    }
  }

  // Cluster adjacent parallel scanline runs into clean centerlines
  const mergeH = (segs: Seg[]): Seg[] => {
    const sorted = [...segs].sort((a, b) => a.y1 - b.y1 || a.x1 - b.x1);
    const out: { ys: number[]; x1: number; x2: number }[] = [];
    for (const s of sorted) {
      const match = out.find(
        (g) =>
          Math.abs(g.ys[g.ys.length - 1] - s.y1) <= 3 &&
          !(s.x2 < g.x1 - 4 || s.x1 > g.x2 + 4)
      );
      if (match) {
        match.ys.push(s.y1);
        match.x1 = Math.min(match.x1, s.x1);
        match.x2 = Math.max(match.x2, s.x2);
      } else {
        out.push({ ys: [s.y1], x1: s.x1, x2: s.x2 });
      }
    }
    return out.map((g) => {
      const avgY = g.ys.reduce((a, b) => a + b, 0) / g.ys.length;
      return { x1: g.x1, y1: avgY, x2: g.x2, y2: avgY };
    });
  };

  const mergeV = (segs: Seg[]): Seg[] => {
    const sorted = [...segs].sort((a, b) => a.x1 - b.x1 || a.y1 - b.y1);
    const out: { xs: number[]; y1: number; y2: number }[] = [];
    for (const s of sorted) {
      const match = out.find(
        (g) =>
          Math.abs(g.xs[g.xs.length - 1] - s.x1) <= 3 &&
          !(s.y2 < g.y1 - 4 || s.y1 > g.y2 + 4)
      );
      if (match) {
        match.xs.push(s.x1);
        match.y1 = Math.min(match.y1, s.y1);
        match.y2 = Math.max(match.y2, s.y2);
      } else {
        out.push({ xs: [s.x1], y1: s.y1, y2: s.y2 });
      }
    }
    return out.map((g) => {
      const avgX = g.xs.reduce((a, b) => a + b, 0) / g.xs.length;
      return { x1: avgX, y1: g.y1, x2: avgX, y2: g.y2 };
    });
  };

  const mergedWalls = [...mergeH(hSegs), ...mergeV(vSegs)];

  // Map grid coordinates to meters (default width 14m, keeping aspect ratio)
  const worldW = 14.0;
  const worldD = Math.round(((worldW * gh) / gw) * 100) / 100;
  const mPerGx = worldW / gw;
  const mPerGy = worldD / gh;

  const snapM = (v: number) => Math.round(v * 20) / 20; // 50mm snap

  const walls: WallSegment[] = mergedWalls.map((s, idx) => ({
    id: `vw-${Date.now()}-${idx}`,
    x1: snapM(s.x1 * mPerGx),
    y1: snapM(s.y1 * mPerGy),
    x2: snapM(s.x2 * mPerGx),
    y2: snapM(s.y2 * mPerGy),
    thickness: 0.16,
    height: 2.45,
    isExterior: false,
    frontMaterialId: 'wl-diamang-stucco',
    backMaterialId: 'wl-diamang-stucco',
  }));

  // Sort regions largest first so living room gets detected accurately
  regions.sort((a, b) => b.pxCount - a.pxCount);
  let bedCount = 1;
  let bathCount = 1;

  const rooms: RoomZone[] = regions.slice(0, 14).map((reg, idx) => {
    const x1 = snapM(reg.rect.x * mPerGx);
    const y1 = snapM(reg.rect.y * mPerGy);
    const x2 = snapM((reg.rect.x + reg.rect.w) * mPerGx);
    const y2 = snapM((reg.rect.y + reg.rect.h) * mPerGy);
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

  // Auto-add basic windows on longest outer walls
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
