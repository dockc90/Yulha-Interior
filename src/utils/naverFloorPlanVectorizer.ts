import {
  FloorPlanTemplate,
  FurnitureItem,
  LightFixture,
  Opening,
  Room,
  RoomType,
  Wall,
} from '../types/interior';

type Point2D = { x: number; y: number };

export interface NaverVectorizeOptions {
  complexId?: string;
  complexName?: string;
  district?: string;
  typeName?: string;
  targetAreaSqm?: number; // 실사용/전용 기반 바닥면적(㎡)
  wallLumaThreshold?: number; // 벽체 검정 임계값 (기본 85)
  rotationDeg?: 0 | 90 | 180 | 270;
}

export interface NaverVectorizeResult {
  plan: FloorPlanTemplate;
  croppedSourceDataUrl: string; // 크롭된 원본 평면도 이미지
  debugOverlayDataUrl: string; // 원본 이미지 위에 추출된 벽/방/문 오버레이
  stats: {
    wallCount: number;
    roomCount: number;
    doorCount: number;
    windowCount: number;
    fixtureCount: number;
    detectedAreaSqm: number;
  };
}

interface RawSegment {
  orientation: 'H' | 'V';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thicknessPx: number;
}

const wpDefault = 'wp-lx-diamang-white';
const wpWarm = 'wp-lx-besti-linen';
const flLiving = 'fl-dongwha-sahara-wide';
const flRoom = 'fl-kujung-natural-oak';
const flTile = 'fl-porcelain-concrete';
const fmWhite = 'fm-hyundai-milkwhite';
const fmCharcoal = 'fm-hyundai-charcoal';

function snap05(v: number): number {
  return Math.round(v * 20) / 20;
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지를 불러올 수 없습니다.'));
    img.src = url;
  });
}

/**
 * 네이버 부동산 2D 평면도 전용 직교 CV 벡터화 엔진
 * - 1) UI/치수선/여백 자동 크롭 (실내 바닥 컬러 최대 연결 요소 기준)
 * - 2) 검정 실선 벽체 수평/수직 런랭스 추출 + 0.05m 그리드 스냅 + T/L 접합
 * - 3) 임시 개구부 브릿지 후 Flood-Fill 방 분할 및 네이버 팔레트 기반 실 용도 분류
 * - 4) 문 호(Arc) 픽셀 방향 분석을 통한 여닫이 방향/창호/현관문 추출
 * - 5) 욕실 위생도기(변기/세면대/욕조) 및 주방 싱크대 위치 추출
 */
export async function vectorizeNaver2DImage(
  imageUrl: string,
  options: NaverVectorizeOptions = {}
): Promise<NaverVectorizeResult> {
  const img = await loadImage(imageUrl);
  const rot = options.rotationDeg ?? 0;
  const wallLumaThresh = options.wallLumaThreshold ?? 112;
  const targetAreaSqm = options.targetAreaSqm ?? 72;

  // 1. 회전 적용 및 최대 1200px 리사이즈 (얇은 내벽 보존)
  const srcW = rot === 90 || rot === 270 ? img.height : img.width;
  const srcH = rot === 90 || rot === 270 ? img.width : img.height;
  const maxDim = 1200;
  const resizeScale = Math.min(1, maxDim / Math.max(srcW, srcH));
  const fullW = Math.max(120, Math.round(srcW * resizeScale));
  const fullH = Math.max(120, Math.round(srcH * resizeScale));

  const fullCanvas = document.createElement('canvas');
  fullCanvas.width = fullW;
  fullCanvas.height = fullH;
  const fullCtx = fullCanvas.getContext('2d');
  if (!fullCtx) throw new Error('Canvas 2D 컨텍스트를 생성할 수 없습니다.');

  fullCtx.fillStyle = '#ffffff';
  fullCtx.fillRect(0, 0, fullW, fullH);
  fullCtx.save();
  fullCtx.translate(fullW / 2, fullH / 2);
  fullCtx.rotate((rot * Math.PI) / 180);
  const drawW = img.width * resizeScale;
  const drawH = img.height * resizeScale;
  fullCtx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
  fullCtx.restore();

  const fullData = fullCtx.getImageData(0, 0, fullW, fullH).data;

  // 2. 실내 바닥 컬러 기반 메인 평면도 영역 자동 크롭 (네이버 UI/치수선/버튼 제거)
  const cell = 4;
  const gw = Math.ceil(fullW / cell);
  const gh = Math.ceil(fullH / cell);
  const gridFloor = new Uint8Array(gw * gh);

  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      let floorHits = 0;
      for (let dy = 0; dy < cell; dy++) {
        const py = gy * cell + dy;
        if (py >= fullH) continue;
        for (let dx = 0; dx < cell; dx++) {
          const px = gx * cell + dx;
          if (px >= fullW) continue;
          const idx = (py * fullW + px) * 4;
          const r = fullData[idx];
          const g = fullData[idx + 1];
          const b = fullData[idx + 2];
          const luma = 0.299 * r + 0.587 * g + 0.114 * b;
          const isWarmFloor = r - b > 14 && luma > 125 && luma < 248;
          const isBathCyan = b - r > 6 && luma > 185 && luma < 250;
          if (isWarmFloor || isBathCyan) floorHits++;
        }
      }
      if (floorHits >= 3) gridFloor[gy * gw + gx] = 1;
    }
  }

  // Dilate gridFloor by 2 cells so rooms separated by walls connect into 1 apartment component
  const dilated = new Uint8Array(gw * gh);
  for (let gy = 0; gy < gh; gy++) {
    for (let gx = 0; gx < gw; gx++) {
      if (!gridFloor[gy * gw + gx]) continue;
      for (let oy = -2; oy <= 2; oy++) {
        const ny = gy + oy;
        if (ny < 0 || ny >= gh) continue;
        for (let ox = -2; ox <= 2; ox++) {
          const nx = gx + ox;
          if (nx >= 0 && nx < gw) dilated[ny * gw + nx] = 1;
        }
      }
    }
  }

  const visitedGrid = new Uint8Array(gw * gh);
  let bestComp: number[] = [];
  const queue = new Int32Array(gw * gh);
  for (let i = 0; i < gw * gh; i++) {
    if (!dilated[i] || visitedGrid[i]) continue;
    let head = 0;
    let tail = 0;
    queue[tail++] = i;
    visitedGrid[i] = 1;
    const comp: number[] = [];
    while (head < tail) {
      const cur = queue[head++];
      comp.push(cur);
      const cx = cur % gw;
      const cy = Math.floor(cur / gw);
      const neighbors = [
        cx > 0 ? cur - 1 : -1,
        cx + 1 < gw ? cur + 1 : -1,
        cy > 0 ? cur - gw : -1,
        cy + 1 < gh ? cur + gw : -1,
      ];
      for (const n of neighbors) {
        if (n >= 0 && dilated[n] && !visitedGrid[n]) {
          visitedGrid[n] = 1;
          queue[tail++] = n;
        }
      }
    }
    if (comp.length > bestComp.length) bestComp = comp;
  }

  let cropX = 0;
  let cropY = 0;
  let cropW = fullW;
  let cropH = fullH;

  if (bestComp.length > 20) {
    let minGx = gw;
    let maxGx = 0;
    let minGy = gh;
    let maxGy = 0;
    for (const idx of bestComp) {
      const gx = idx % gw;
      const gy = Math.floor(idx / gw);
      if (gx < minGx) minGx = gx;
      if (gx > maxGx) maxGx = gx;
      if (gy < minGy) minGy = gy;
      if (gy > maxGy) maxGy = gy;
    }
    const padPx = 40;
    cropX = Math.max(0, minGx * cell - padPx);
    cropY = Math.max(0, minGy * cell - padPx);
    const cropX2 = Math.min(fullW, (maxGx + 1) * cell + padPx);
    const cropY2 = Math.min(fullH, (maxGy + 1) * cell + padPx);
    cropW = Math.max(80, cropX2 - cropX);
    cropH = Math.max(80, cropY2 - cropY);
  }

  // Extract cropped pixel buffer
  const data = fullCtx.getImageData(cropX, cropY, cropW, cropH).data;
  const N = cropW * cropH;
  const lumaArr = new Uint8Array(N);
  const rawDark = new Uint8Array(N);

  for (let i = 0; i < N; i++) {
    const p = i * 4;
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    const luma = Math.round(0.299 * r + 0.587 * g + 0.114 * b);
    lumaArr[i] = luma;
    // JPEG 크로마 번짐(오렌지 바닥 인접 벽체)을 허용하기 위해 채도 제한 없이 휘도 기준으로 벽체 검출
    if (luma < wallLumaThresh) {
      rawDark[i] = 1;
    }
  }

  // 3. 정교한 벽체 마스크 생성
  // - 검정 실선 벽체(두께 2px 이상)는 100% 보존
  // - 창호의 얇은 이중선(사이에 밝은 유리/흰색 틈이 있는 경우)은 벽체에서 제외해 창문 개구부로 자동 인식되도록 함
  const wallMask = new Uint8Array(N);
  const minRunPx = Math.max(12, Math.round(Math.min(cropW, cropH) * 0.022));

  // Horizontal run filter (check perpendicular thickness: solid wall >= 2px without bright hollow core)
  for (let y = 0; y < cropH; y++) {
    let runStart = -1;
    let gap = 0;
    for (let x = 0; x <= cropW; x++) {
      const dark = x < cropW ? rawDark[y * cropW + x] : 0;
      if (dark) {
        if (runStart === -1) runStart = x;
        gap = 0;
      } else if (runStart !== -1) {
        gap++;
        if (gap > 1 || x === cropW) {
          const endX = x - gap;
          if (endX - runStart >= minRunPx) {
            // Check how many pixels in this run have a solid dark neighbor above or below
            let thickCount = 0;
            for (let rx = runStart; rx < endX; rx++) {
              const up = y > 0 ? rawDark[(y - 1) * cropW + rx] : 0;
              const dn = y + 1 < cropH ? rawDark[(y + 1) * cropW + rx] : 0;
              if (up || dn) thickCount++;
            }
            if (thickCount >= (endX - runStart) * 0.55) {
              for (let rx = runStart; rx < endX; rx++) {
                if (rawDark[y * cropW + rx]) wallMask[y * cropW + rx] = 1;
              }
            }
          }
          runStart = -1;
          gap = 0;
        }
      }
    }
  }

  // Vertical run filter
  for (let x = 0; x < cropW; x++) {
    let runStart = -1;
    let gap = 0;
    for (let y = 0; y <= cropH; y++) {
      const dark = y < cropH ? rawDark[y * cropW + x] : 0;
      if (dark) {
        if (runStart === -1) runStart = y;
        gap = 0;
      } else if (runStart !== -1) {
        gap++;
        if (gap > 1 || y === cropH) {
          const endY = y - gap;
          if (endY - runStart >= minRunPx) {
            let thickCount = 0;
            for (let ry = runStart; ry < endY; ry++) {
              const lf = x > 0 ? rawDark[ry * cropW + (x - 1)] : 0;
              const rt = x + 1 < cropW ? rawDark[ry * cropW + (x + 1)] : 0;
              if (lf || rt) thickCount++;
            }
            if (thickCount >= (endY - runStart) * 0.55) {
              for (let ry = runStart; ry < endY; ry++) {
                if (rawDark[ry * cropW + x]) wallMask[ry * cropW + x] = 1;
              }
            }
          }
          runStart = -1;
          gap = 0;
        }
      }
    }
  }

  // 4. 바닥 면적 기반 실제 미터 스케일 계산 (metersPerPixel)
  let interiorPx = 0;
  for (let i = 0; i < N; i++) {
    const p = i * 4;
    const r = data[p];
    const g = data[p + 1];
    const b = data[p + 2];
    const luma = lumaArr[i];
    if (wallMask[i]) continue;
    const isFloor =
      (r - b > 12 && luma > 120 && luma < 248) ||
      (b - r > 5 && luma > 180 && luma < 250);
    if (isFloor) interiorPx++;
  }
  const safeInteriorPx = Math.max(cropW * cropH * 0.28, interiorPx);
  const mPerPx = Math.sqrt(targetAreaSqm / safeInteriorPx);
  const pxPerM = 1 / mPerPx;

  // 5. 수평/수직 벽체 세그먼트 추출 및 병합
  const rawSegments: RawSegment[] = [];

  // Horizontal wall bands
  interface RowRun { y: number; x1: number; x2: number; used: boolean }
  const hRuns: RowRun[] = [];
  for (let y = 0; y < cropH; y++) {
    let s = -1;
    for (let x = 0; x <= cropW; x++) {
      const v = x < cropW ? wallMask[y * cropW + x] : 0;
      if (v && s === -1) s = x;
      else if (!v && s !== -1) {
        if (x - s >= minRunPx) hRuns.push({ y, x1: s, x2: x, used: false });
        s = -1;
      }
    }
  }
  for (let i = 0; i < hRuns.length; i++) {
    if (hRuns[i].used) continue;
    hRuns[i].used = true;
    let minX = hRuns[i].x1;
    let maxX = hRuns[i].x2;
    let minY = hRuns[i].y;
    let maxY = hRuns[i].y;
    let changed = true;
    while (changed) {
      changed = false;
      for (let j = i + 1; j < hRuns.length; j++) {
        if (hRuns[j].used) continue;
        if (hRuns[j].y <= maxY + 2 && hRuns[j].y >= minY - 2) {
          const overlap = Math.min(maxX, hRuns[j].x2) - Math.max(minX, hRuns[j].x1);
          if (overlap >= 6) {
            hRuns[j].used = true;
            minX = Math.min(minX, hRuns[j].x1);
            maxX = Math.max(maxX, hRuns[j].x2);
            maxY = Math.max(maxY, hRuns[j].y);
            minY = Math.min(minY, hRuns[j].y);
            changed = true;
          }
        }
      }
    }
    const thick = maxY - minY + 1;
    if (maxX - minX >= minRunPx && thick <= Math.round(pxPerM * 0.45)) {
      const ym = (minY + maxY) / 2;
      rawSegments.push({ orientation: 'H', x1: minX, y1: ym, x2: maxX, y2: ym, thicknessPx: thick });
    }
  }

  // Vertical wall bands
  interface ColRun { x: number; y1: number; y2: number; used: boolean }
  const vRuns: ColRun[] = [];
  for (let x = 0; x < cropW; x++) {
    let s = -1;
    for (let y = 0; y <= cropH; y++) {
      const v = y < cropH ? wallMask[y * cropW + x] : 0;
      if (v && s === -1) s = y;
      else if (!v && s !== -1) {
        if (y - s >= minRunPx) vRuns.push({ x, y1: s, y2: y, used: false });
        s = -1;
      }
    }
  }
  for (let i = 0; i < vRuns.length; i++) {
    if (vRuns[i].used) continue;
    vRuns[i].used = true;
    let minY = vRuns[i].y1;
    let maxY = vRuns[i].y2;
    let minX = vRuns[i].x;
    let maxX = vRuns[i].x;
    let changed = true;
    while (changed) {
      changed = false;
      for (let j = i + 1; j < vRuns.length; j++) {
        if (vRuns[j].used) continue;
        if (vRuns[j].x <= maxX + 2 && vRuns[j].x >= minX - 2) {
          const overlap = Math.min(maxY, vRuns[j].y2) - Math.max(minY, vRuns[j].y1);
          if (overlap >= 6) {
            vRuns[j].used = true;
            minY = Math.min(minY, vRuns[j].y1);
            maxY = Math.max(maxY, vRuns[j].y2);
            maxX = Math.max(maxX, vRuns[j].x);
            minX = Math.min(minX, vRuns[j].x);
            changed = true;
          }
        }
      }
    }
    const thick = maxX - minX + 1;
    if (maxY - minY >= minRunPx && thick <= Math.round(pxPerM * 0.45)) {
      const xm = (minX + maxX) / 2;
      rawSegments.push({ orientation: 'V', x1: xm, y1: minY, x2: xm, y2: maxY, thicknessPx: thick });
    }
  }

  // Convert to meters & merge collinear segments
  interface MWall {
    id: string;
    ori: 'H' | 'V';
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    thickness: number;
    isExterior: boolean;
    openings: Opening[];
  }

  const hWallsM = rawSegments
    .filter((s) => s.orientation === 'H')
    .map((s) => ({
      y: snap05(s.y1 * mPerPx),
      x1: snap05(s.x1 * mPerPx),
      x2: snap05(s.x2 * mPerPx),
      thickPx: s.thicknessPx,
    }))
    .filter((w) => w.x2 - w.x1 >= 0.35)
    .sort((a, b) => a.y - b.y || a.x1 - b.x1);

  const mergedH: typeof hWallsM = [];
  for (const w of hWallsM) {
    const prev = mergedH.find(
      (m) => Math.abs(m.y - w.y) <= 0.14 && w.x1 <= m.x2 + 0.18 && w.x2 >= m.x1 - 0.18
    );
    if (prev) {
      prev.x1 = Math.min(prev.x1, w.x1);
      prev.x2 = Math.max(prev.x2, w.x2);
      prev.thickPx = Math.max(prev.thickPx, w.thickPx);
    } else {
      mergedH.push({ ...w });
    }
  }

  const vWallsM = rawSegments
    .filter((s) => s.orientation === 'V')
    .map((s) => ({
      x: snap05(s.x1 * mPerPx),
      y1: snap05(s.y1 * mPerPx),
      y2: snap05(s.y2 * mPerPx),
      thickPx: s.thicknessPx,
    }))
    .filter((w) => w.y2 - w.y1 >= 0.35)
    .sort((a, b) => a.x - b.x || a.y1 - b.y1);

  const mergedV: typeof vWallsM = [];
  for (const w of vWallsM) {
    const prev = mergedV.find(
      (m) => Math.abs(m.x - w.x) <= 0.14 && w.y1 <= m.y2 + 0.18 && w.y2 >= m.y1 - 0.18
    );
    if (prev) {
      prev.y1 = Math.min(prev.y1, w.y1);
      prev.y2 = Math.max(prev.y2, w.y2);
      prev.thickPx = Math.max(prev.thickPx, w.thickPx);
    } else {
      mergedV.push({ ...w });
    }
  }

  // Snap T/L junctions within 0.18m
  for (const h of mergedH) {
    for (const v of mergedV) {
      if (v.y1 - 0.18 <= h.y && h.y <= v.y2 + 0.18) {
        if (Math.abs(h.x1 - v.x) <= 0.18) h.x1 = v.x;
        if (Math.abs(h.x2 - v.x) <= 0.18) h.x2 = v.x;
      }
      if (h.x1 - 0.18 <= v.x && v.x <= h.x2 + 0.18) {
        if (Math.abs(v.y1 - h.y) <= 0.18) v.y1 = h.y;
        if (Math.abs(v.y2 - h.y) <= 0.18) v.y2 = h.y;
      }
    }
  }

  // 6. Flood-fill 방 분할 (개구부 브릿지 포함 임시 마스크 생성)
  const splitMask = new Uint8Array(wallMask);
  const drawSplitLine = (x1m: number, y1m: number, x2m: number, y2m: number) => {
    const px1 = Math.max(0, Math.min(cropW - 1, Math.round(x1m * pxPerM)));
    const py1 = Math.max(0, Math.min(cropH - 1, Math.round(y1m * pxPerM)));
    const px2 = Math.max(0, Math.min(cropW - 1, Math.round(x2m * pxPerM)));
    const py2 = Math.max(0, Math.min(cropH - 1, Math.round(y2m * pxPerM)));
    const steps = Math.max(Math.abs(px2 - px1), Math.abs(py2 - py1), 1);
    for (let s = 0; s <= steps; s++) {
      const px = Math.round(px1 + ((px2 - px1) * s) / steps);
      const py = Math.round(py1 + ((py2 - py1) * s) / steps);
      for (let oy = -1; oy <= 1; oy++) {
        for (let ox = -1; ox <= 1; ox++) {
          const nx = px + ox;
          const ny = py + oy;
          if (nx >= 0 && nx < cropW && ny >= 0 && ny < cropH) {
            splitMask[ny * cropW + nx] = 1;
          }
        }
      }
    }
  };

  mergedH.forEach((h) => drawSplitLine(h.x1, h.y, h.x2, h.y));
  mergedV.forEach((v) => drawSplitLine(v.x, v.y1, v.x, v.y2));

  // Bridge door/window gaps between collinear walls AND corner wall-to-perpendicular-wall gaps
  const gapBridges: Array<{ ori: 'H' | 'V'; x1: number; y1: number; x2: number; y2: number }> = [];
  const hasHSegmentCovering = (y: number, xStart: number, xEnd: number) =>
    mergedH.some(
      (m) => Math.abs(m.y - y) <= 0.16 && Math.min(m.x2, xEnd) - Math.max(m.x1, xStart) > 0.2
    ) ||
    gapBridges.some(
      (g) => g.ori === 'H' && Math.abs(g.y1 - y) <= 0.16 && Math.min(g.x2, xEnd) - Math.max(g.x1, xStart) > 0.2
    );
  const hasVSegmentCovering = (x: number, yStart: number, yEnd: number) =>
    mergedV.some(
      (m) => Math.abs(m.x - x) <= 0.16 && Math.min(m.y2, yEnd) - Math.max(m.y1, yStart) > 0.2
    ) ||
    gapBridges.some(
      (g) => g.ori === 'V' && Math.abs(g.x1 - x) <= 0.16 && Math.min(g.y2, yEnd) - Math.max(g.y1, yStart) > 0.2
    );

  for (let i = 0; i < mergedH.length; i++) {
    for (let j = i + 1; j < mergedH.length; j++) {
      if (Math.abs(mergedH[i].y - mergedH[j].y) <= 0.14) {
        const a = mergedH[i].x1 < mergedH[j].x1 ? mergedH[i] : mergedH[j];
        const b = mergedH[i].x1 < mergedH[j].x1 ? mergedH[j] : mergedH[i];
        const gap = b.x1 - a.x2;
        if (gap > 0.18 && gap <= 3.6 && !hasHSegmentCovering(a.y, a.x2, b.x1)) {
          gapBridges.push({ ori: 'H', x1: a.x2, y1: a.y, x2: b.x1, y2: a.y });
          drawSplitLine(a.x2, a.y, b.x1, a.y);
        }
      }
    }
  }
  for (let i = 0; i < mergedV.length; i++) {
    for (let j = i + 1; j < mergedV.length; j++) {
      if (Math.abs(mergedV[i].x - mergedV[j].x) <= 0.14) {
        const a = mergedV[i].y1 < mergedV[j].y1 ? mergedV[i] : mergedV[j];
        const b = mergedV[i].y1 < mergedV[j].y1 ? mergedV[j] : mergedV[i];
        const gap = b.y1 - a.y2;
        if (gap > 0.18 && gap <= 3.6 && !hasVSegmentCovering(a.x, a.y2, b.y1)) {
          gapBridges.push({ ori: 'V', x1: a.x, y1: a.y2, x2: a.x, y2: b.y1 });
          drawSplitLine(a.x, a.y2, a.x, b.y1);
        }
      }
    }
  }

  // Corner door/window gaps: wall end -> perpendicular wall within 0.55..1.4m
  // Only bridge if there is a clear door-arc or exterior window signature along the gap!
  const hasDoorArcOrWindowOnH = (y: number, x1: number, x2: number) => {
    const py = Math.round(y * pxPerM);
    const px1 = Math.max(0, Math.round(x1 * pxPerM));
    const px2 = Math.min(cropW - 1, Math.round(x2 * pxPerM));
    let arcHits = 0;
    const band = Math.round(0.55 * pxPerM);
    for (let yy = Math.max(0, py - band); yy <= Math.min(cropH - 1, py + band); yy++) {
      if (Math.abs(yy - py) < 4) continue;
      for (let xx = px1 + 2; xx < px2 - 2; xx++) {
        const idx = yy * cropW + xx;
        if (!wallMask[idx] && lumaArr[idx] < 145) arcHits++;
      }
    }
    return arcHits >= 18;
  };
  const hasDoorArcOrWindowOnV = (x: number, y1: number, y2: number) => {
    const px = Math.round(x * pxPerM);
    const py1 = Math.max(0, Math.round(y1 * pxPerM));
    const py2 = Math.min(cropH - 1, Math.round(y2 * pxPerM));
    let arcHits = 0;
    const band = Math.round(0.55 * pxPerM);
    for (let xx = Math.max(0, px - band); xx <= Math.min(cropW - 1, px + band); xx++) {
      if (Math.abs(xx - px) < 4) continue;
      for (let yy = py1 + 2; yy < py2 - 2; yy++) {
        const idx = yy * cropW + xx;
        if (!wallMask[idx] && lumaArr[idx] < 145) arcHits++;
      }
    }
    return arcHits >= 18;
  };

  for (const h of mergedH) {
    for (const v of mergedV) {
      if (v.y1 - 0.16 <= h.y && h.y <= v.y2 + 0.16) {
        const gapR = v.x - h.x2;
        if (gapR >= 0.42 && gapR <= 1.25 && !hasHSegmentCovering(h.y, h.x2, v.x) && hasDoorArcOrWindowOnH(h.y, h.x2, v.x)) {
          gapBridges.push({ ori: 'H', x1: h.x2, y1: h.y, x2: v.x, y2: h.y });
          drawSplitLine(h.x2, h.y, v.x, h.y);
        }
        const gapL = h.x1 - v.x;
        if (gapL >= 0.42 && gapL <= 1.25 && !hasHSegmentCovering(h.y, v.x, h.x1) && hasDoorArcOrWindowOnH(h.y, v.x, h.x1)) {
          gapBridges.push({ ori: 'H', x1: v.x, y1: h.y, x2: h.x1, y2: h.y });
          drawSplitLine(v.x, h.y, h.x1, h.y);
        }
      }
    }
  }
  for (const v of mergedV) {
    for (const h of mergedH) {
      if (h.x1 - 0.16 <= v.x && v.x <= h.x2 + 0.16) {
        const gapB = h.y - v.y2;
        if (gapB >= 0.42 && gapB <= 1.25 && !hasVSegmentCovering(v.x, v.y2, h.y) && hasDoorArcOrWindowOnV(v.x, v.y2, h.y)) {
          gapBridges.push({ ori: 'V', x1: v.x, y1: v.y2, x2: v.x, y2: h.y });
          drawSplitLine(v.x, v.y2, v.x, h.y);
        }
        const gapT = v.y1 - h.y;
        if (gapT >= 0.42 && gapT <= 1.25 && !hasVSegmentCovering(v.x, h.y, v.y1) && hasDoorArcOrWindowOnV(v.x, h.y, v.y1)) {
          gapBridges.push({ ori: 'V', x1: v.x, y1: h.y, x2: v.x, y2: v.y1 });
          drawSplitLine(v.x, h.y, v.x, v.y1);
        }
      }
    }
  }

  // Mark exterior (outside) pixels via BFS from border
  const outsideMask = new Uint8Array(N);
  const bfsQueue = new Int32Array(N);
  let qHead = 0;
  let qTail = 0;
  for (let x = 0; x < cropW; x++) {
    if (!splitMask[x]) {
      outsideMask[x] = 1;
      bfsQueue[qTail++] = x;
    }
    const bot = (cropH - 1) * cropW + x;
    if (!splitMask[bot] && !outsideMask[bot]) {
      outsideMask[bot] = 1;
      bfsQueue[qTail++] = bot;
    }
  }
  for (let y = 0; y < cropH; y++) {
    const lf = y * cropW;
    if (!splitMask[lf] && !outsideMask[lf]) {
      outsideMask[lf] = 1;
      bfsQueue[qTail++] = lf;
    }
    const rt = y * cropW + (cropW - 1);
    if (!splitMask[rt] && !outsideMask[rt]) {
      outsideMask[rt] = 1;
      bfsQueue[qTail++] = rt;
    }
  }
  while (qHead < qTail) {
    const cur = bfsQueue[qHead++];
    const cx = cur % cropW;
    const cy = Math.floor(cur / cropW);
    if (cx > 0 && !splitMask[cur - 1] && !outsideMask[cur - 1]) {
      outsideMask[cur - 1] = 1;
      bfsQueue[qTail++] = cur - 1;
    }
    if (cx + 1 < cropW && !splitMask[cur + 1] && !outsideMask[cur + 1]) {
      outsideMask[cur + 1] = 1;
      bfsQueue[qTail++] = cur + 1;
    }
    if (cy > 0 && !splitMask[cur - cropW] && !outsideMask[cur - cropW]) {
      outsideMask[cur - cropW] = 1;
      bfsQueue[qTail++] = cur - cropW;
    }
    if (cy + 1 < cropH && !splitMask[cur + cropW] && !outsideMask[cur + cropW]) {
      outsideMask[cur + cropW] = 1;
      bfsQueue[qTail++] = cur + cropW;
    }
  }

  // Extract interior room connected components
  const roomIdMap = new Int32Array(N).fill(-1);
  interface RawRoomComp {
    id: number;
    pixelCount: number;
    areaSqm: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    avgR: number;
    avgG: number;
    avgB: number;
    avgLuma: number;
    touchesOutside: boolean;
    pixels: number[];
  }
  const rawRooms: RawRoomComp[] = [];

  for (let i = 0; i < N; i++) {
    if (splitMask[i] || outsideMask[i] || roomIdMap[i] !== -1) continue;
    let head = 0;
    let tail = 0;
    bfsQueue[tail++] = i;
    roomIdMap[i] = rawRooms.length;
    let sumR = 0;
    let sumG = 0;
    let sumB = 0;
    let sumL = 0;
    let minX = cropW;
    let maxX = 0;
    let minY = cropH;
    let maxY = 0;
    let touchesOutside = false;
    const pixels: number[] = [];

    while (head < tail) {
      const cur = bfsQueue[head++];
      pixels.push(cur);
      const cx = cur % cropW;
      const cy = Math.floor(cur / cropW);
      if (cx < minX) minX = cx;
      if (cx > maxX) maxX = cx;
      if (cy < minY) minY = cy;
      if (cy > maxY) maxY = cy;
      const p = cur * 4;
      sumR += data[p];
      sumG += data[p + 1];
      sumB += data[p + 2];
      sumL += lumaArr[cur];

      const nbs = [
        cx > 0 ? cur - 1 : -1,
        cx + 1 < cropW ? cur + 1 : -1,
        cy > 0 ? cur - cropW : -1,
        cy + 1 < cropH ? cur + cropW : -1,
      ];
      for (const n of nbs) {
        if (n < 0) continue;
        if (outsideMask[n]) touchesOutside = true;
        if (!splitMask[n] && !outsideMask[n] && roomIdMap[n] === -1) {
          roomIdMap[n] = rawRooms.length;
          bfsQueue[tail++] = n;
        }
      }
    }

    const areaSqm = pixels.length * mPerPx * mPerPx;
    if (areaSqm >= 0.75) {
      rawRooms.push({
        id: rawRooms.length,
        pixelCount: pixels.length,
        areaSqm,
        minX,
        maxX,
        minY,
        maxY,
        avgR: sumR / pixels.length,
        avgG: sumG / pixels.length,
        avgB: sumB / pixels.length,
        avgLuma: sumL / pixels.length,
        touchesOutside,
        pixels,
      });
    }
  }

  // Classify each room by Naver color palette & relative area
  const rooms: Room[] = [];
  const bathComps = rawRooms.filter((r) => r.avgB - r.avgR > 4 && r.avgLuma > 175 && r.areaSqm < 9);
  const warmComps = [...rawRooms]
    .filter((r) => !bathComps.includes(r) && r.avgR - r.avgB >= 12)
    .sort((a, b) => b.areaSqm - a.areaSqm);

  // Largest warm-wood room = 거실, next largest warm bedroom = 침실1(안방)
  const livingComp = warmComps[0] || null;
  const bedroomCandidates = warmComps.filter((r) => r !== livingComp && r.areaSqm >= 4.8);
  const masterComp = bedroomCandidates[0] || null;

  let bedIdx = 2;
  let bathCount = 0;
  let entranceAssigned = false;

  rawRooms.forEach((rc, idx) => {
    const x1 = snap05(rc.minX * mPerPx);
    const y1 = snap05(rc.minY * mPerPx);
    const x2 = snap05(rc.maxX * mPerPx);
    const y2 = snap05(rc.maxY * mPerPx);
    const bboxPx = Math.max(1, (rc.maxX - rc.minX + 1) * (rc.maxY - rc.minY + 1));
    const fillRatio = rc.pixelCount / bboxPx;

    let polygon: Point2D[] = [
      { x: x1, y: y1 },
      { x: x2, y: y1 },
      { x: x2, y: y2 },
      { x: x1, y: y2 },
    ];

    // L자형/비정형 방은 90° 직교 계단식 윤곽 폴리곤으로 추출해 대각선 빗금 방지
    if (fillRatio < 0.8) {
      const stepPx = Math.max(4, Math.round(pxPerM * 0.2));
      const leftPts: Point2D[] = [];
      const rightPts: Point2D[] = [];
      let prevLx: number | null = null;
      let prevRx: number | null = null;
      for (let py = rc.minY; py <= rc.maxY; py += stepPx) {
        let rowMinX = cropW;
        let rowMaxX = -1;
        for (let px = rc.minX; px <= rc.maxX; px++) {
          if (roomIdMap[py * cropW + px] === rc.id) {
            if (px < rowMinX) rowMinX = px;
            if (px > rowMaxX) rowMaxX = px;
          }
        }
        if (rowMaxX >= rowMinX) {
          const ym = snap05(py * mPerPx);
          const lx = snap05(rowMinX * mPerPx);
          const rx = snap05(rowMaxX * mPerPx);
          if (prevLx !== null && Math.abs(lx - prevLx) > 0.15) {
            leftPts.push({ x: prevLx, y: ym });
          }
          if (prevRx !== null && Math.abs(rx - prevRx) > 0.15) {
            rightPts.push({ x: prevRx, y: ym });
          }
          leftPts.push({ x: lx, y: ym });
          rightPts.push({ x: rx, y: ym });
          prevLx = lx;
          prevRx = rx;
        }
      }
      if (leftPts.length >= 2) {
        polygon = [...leftPts, ...rightPts.reverse()];
      }
    }

    let type: RoomType = 'bedroom';
    let name = '침실';
    let floorMaterialId = flRoom;

    const rMinusB = rc.avgR - rc.avgB;
    const bMinusR = rc.avgB - rc.avgR;

    if (bMinusR > 4 && rc.avgLuma > 175 && rc.areaSqm < 9) {
      type = 'bath';
      floorMaterialId = flTile;
      bathCount++;
      name = bathCount === 1 ? '공용욕실' : '부부욕실';
    } else if (rc === livingComp) {
      type = 'living';
      name = '거실 / 주방';
      floorMaterialId = flLiving;
    } else if (rc === masterComp) {
      type = 'master';
      name = '침실1 (안방)';
      floorMaterialId = flRoom;
    } else if (rMinusB < 14 && rc.avgLuma > 175) {
      if (!entranceAssigned && rc.areaSqm >= 1.2 && rc.areaSqm < 4.8 && rc.minY < cropH * 0.55) {
        type = 'entrance';
        name = '현관';
        entranceAssigned = true;
      } else if (rc.touchesOutside) {
        type = 'balcony';
        name = '발코니';
      } else {
        type = 'alpha';
        name = '팬트리';
      }
      floorMaterialId = flTile;
    } else if (rc.areaSqm < 4.8) {
      type = 'dress';
      name = '드레스룸';
      floorMaterialId = flRoom;
    } else {
      type = 'bedroom';
      name = `침실${bedIdx++}`;
      floorMaterialId = flRoom;
    }

    rooms.push({
      id: `nv-room-${idx + 1}`,
      name,
      type,
      polygon,
      floorMaterialId,
      floorDirection: 'horizontal',
      ceilingType: type === 'living' ? 'well_rect' : 'flat',
      ceilingMaterialId: type === 'master' ? 'cl-warm-ivory' : 'cl-white-silk',
      indirectLightColor: type === 'bath' || type === 'master' ? '3000K' : '4000K',
      indirectLightOn: type === 'living' || type === 'master',
    });
  });

  // 7. 벽체 + 개구부(창문/문/현관문/열림방향) 생성
  const walls: Wall[] = [];
  const H = 2.4;
  let doorCount = 0;
  let windowCount = 0;

  const isOutsideAtM = (xm: number, ym: number) => {
    const px = Math.round(xm * pxPerM);
    const py = Math.round(ym * pxPerM);
    if (px < 0 || px >= cropW || py < 0 || py >= cropH) return true;
    return outsideMask[py * cropW + px] === 1;
  };

  // Ray-cast perpendicular door leaf from (xm, ym) in direction (dirX, dirY) for 0.52m
  const measureDoorLeaf = (xm: number, ym: number, dirX: number, dirY: number) => {
    const steps = Math.max(8, Math.round(0.52 * pxPerM));
    let hits = 0;
    for (let s = 3; s <= steps; s++) {
      const cx = Math.round(xm * pxPerM + dirX * s);
      const cy = Math.round(ym * pxPerM + dirY * s);
      let found = false;
      for (let off = -3; off <= 3; off++) {
        const px = dirX === 0 ? cx + off : cx;
        const py = dirY === 0 ? cy + off : cy;
        if (px >= 0 && px < cropW && py >= 0 && py < cropH) {
          const idx = py * cropW + px;
          if (!wallMask[idx] && lumaArr[idx] < 150) {
            found = true;
            break;
          }
        }
      }
      if (found) hits++;
    }
    return hits / Math.max(1, steps - 2);
  };

  // Detect parallel double-line window frame along wall centerline
  const isWindowBand = (ori: 'H' | 'V', x1: number, y1: number, x2: number, y2: number) => {
    if (ori === 'H') {
      const py = Math.round(y1 * pxPerM);
      const px1 = Math.max(0, Math.round(x1 * pxPerM) + 2);
      const px2 = Math.min(cropW - 1, Math.round(x2 * pxPerM) - 2);
      if (px2 <= px1) return false;
      let frameCols = 0;
      for (let x = px1; x <= px2; x++) {
        let hasDark = false;
        for (let oy = -4; oy <= 4; oy++) {
          const yy = py + oy;
          if (yy >= 0 && yy < cropH && lumaArr[yy * cropW + x] < 155) {
            hasDark = true;
            break;
          }
        }
        if (hasDark) frameCols++;
      }
      return frameCols / (px2 - px1 + 1) >= 0.45;
    } else {
      const px = Math.round(x1 * pxPerM);
      const py1 = Math.max(0, Math.round(y1 * pxPerM) + 2);
      const py2 = Math.min(cropH - 1, Math.round(y2 * pxPerM) - 2);
      if (py2 <= py1) return false;
      let frameRows = 0;
      for (let y = py1; y <= py2; y++) {
        let hasDark = false;
        for (let ox = -4; ox <= 4; ox++) {
          const xx = px + ox;
          if (xx >= 0 && xx < cropW && lumaArr[y * cropW + xx] < 155) {
            hasDark = true;
            break;
          }
        }
        if (hasDark) frameRows++;
      }
      return frameRows / (py2 - py1 + 1) >= 0.45;
    }
  };

  const buildOpeningForGap = (
    ori: 'H' | 'V',
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    idx: number
  ): Opening | null => {
    const len = ori === 'H' ? x2 - x1 : y2 - y1;
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const winBand = isWindowBand(ori, x1, y1, x2, y2);

    if (ori === 'H') {
      const outTop = isOutsideAtM(mx, my - 0.35);
      const outBot = isOutsideAtM(mx, my + 0.35);
      const isExt = outTop !== outBot;

      // Measure perpendicular door leaf at left (x1+0.06) and right (x2-0.06) on top (-Y) & bottom (+Y)
      const topL = measureDoorLeaf(x1 + 0.06, my, 0, -1);
      const topR = measureDoorLeaf(x2 - 0.06, my, 0, -1);
      const botL = measureDoorLeaf(x1 + 0.06, my, 0, 1);
      const botR = measureDoorLeaf(x2 - 0.06, my, 0, 1);
      const topMax = Math.max(topL, topR);
      const botMax = Math.max(botL, botR);

      if (isExt) {
        // Exterior entrance door MUST have a clear outward door leaf and NOT be a window band
        const outLeaf = outTop ? topMax : botMax;
        if (!winBand && len >= 0.65 && len <= 1.25 && outLeaf >= 0.45) {
          doorCount++;
          const isRightHinge = outTop ? topR > topL : botR > botL;
          return {
            id: `nv-op-d-${idx}`,
            type: 'entrance',
            offset: 0.5,
            width: Math.min(1.0, Math.max(0.75, Number((len * 0.92).toFixed(2)))),
            height: 2.1,
            sillHeight: 0,
            frameMaterialId: fmCharcoal,
            swing: outTop
              ? isRightHinge ? 'out_right' : 'out_left'
              : isRightHinge ? 'in_right' : 'in_left',
          };
        }
        if (len >= 0.45) {
          windowCount++;
          const isLargeWindow = len >= 1.9;
          return {
            id: `nv-op-w-${idx}`,
            type: 'window',
            offset: 0.5,
            width: Number((len * 0.9).toFixed(2)),
            height: isLargeWindow ? 2.0 : 1.35,
            sillHeight: isLargeWindow ? 0.2 : 0.75,
            frameMaterialId: isLargeWindow ? fmCharcoal : fmWhite,
          };
        }
        return null;
      }

      // Interior door: scan 0.02..0.08m from hinge ends, never reject via isWindowBand
      const topMaxInt = Math.max(
        topL,
        topR,
        measureDoorLeaf(x1 + 0.02, my, 0, -1),
        measureDoorLeaf(x2 - 0.02, my, 0, -1)
      );
      const botMaxInt = Math.max(
        botL,
        botR,
        measureDoorLeaf(x1 + 0.02, my, 0, 1),
        measureDoorLeaf(x2 - 0.02, my, 0, 1)
      );
      if (len >= 0.42 && len <= 1.25 && Math.max(topMaxInt, botMaxInt) >= 0.36) {
        doorCount++;
        const swingDown = botMaxInt > topMaxInt;
        const isRightHinge = swingDown ? botR > botL : topR > topL;
        return {
          id: `nv-op-d-${idx}`,
          type: 'door',
          offset: 0.5,
          width: Math.min(1.0, Math.max(0.7, Number((len * 0.92).toFixed(2)))),
          height: 2.1,
          sillHeight: 0,
          frameMaterialId: fmWhite,
          swing: swingDown
            ? isRightHinge ? 'in_right' : 'in_left'
            : isRightHinge ? 'out_right' : 'out_left',
        };
      }
    } else {
      const outLeft = isOutsideAtM(mx - 0.35, my);
      const outRight = isOutsideAtM(mx + 0.35, my);
      const isExt = outLeft !== outRight;

      const leftT = measureDoorLeaf(mx, y1 + 0.06, -1, 0);
      const leftB = measureDoorLeaf(mx, y2 - 0.06, -1, 0);
      const rightT = measureDoorLeaf(mx, y1 + 0.06, 1, 0);
      const rightB = measureDoorLeaf(mx, y2 - 0.06, 1, 0);
      const leftMax = Math.max(leftT, leftB);
      const rightMax = Math.max(rightT, rightB);

      if (isExt) {
        const outLeaf = outLeft ? leftMax : rightMax;
        if (!winBand && len >= 0.65 && len <= 1.25 && outLeaf >= 0.45) {
          doorCount++;
          const isBotHinge = outLeft ? leftB > leftT : rightB > rightT;
          return {
            id: `nv-op-d-${idx}`,
            type: 'entrance',
            offset: 0.5,
            width: Math.min(1.0, Math.max(0.75, Number((len * 0.92).toFixed(2)))),
            height: 2.1,
            sillHeight: 0,
            frameMaterialId: fmCharcoal,
            swing: outLeft
              ? isBotHinge ? 'in_right' : 'in_left'
              : isBotHinge ? 'out_right' : 'out_left',
          };
        }
        if (len >= 0.45) {
          windowCount++;
          const isLargeWindow = len >= 1.9;
          return {
            id: `nv-op-w-${idx}`,
            type: 'window',
            offset: 0.5,
            width: Number((len * 0.9).toFixed(2)),
            height: isLargeWindow ? 2.0 : 1.35,
            sillHeight: isLargeWindow ? 0.2 : 0.75,
            frameMaterialId: isLargeWindow ? fmCharcoal : fmWhite,
          };
        }
        return null;
      }

      const leftMaxInt = Math.max(
        leftT,
        leftB,
        measureDoorLeaf(mx, y1 + 0.02, -1, 0),
        measureDoorLeaf(mx, y2 - 0.02, -1, 0)
      );
      const rightMaxInt = Math.max(
        rightT,
        rightB,
        measureDoorLeaf(mx, y1 + 0.02, 1, 0),
        measureDoorLeaf(mx, y2 - 0.02, 1, 0)
      );
      if (len >= 0.42 && len <= 1.25 && Math.max(leftMaxInt, rightMaxInt) >= 0.36) {
        doorCount++;
        const swingLeft = leftMaxInt >= rightMaxInt;
        const isBotHinge = swingLeft ? leftB > leftT : rightB > rightT;
        return {
          id: `nv-op-d-${idx}`,
          type: 'door',
          offset: 0.5,
          width: Math.min(1.0, Math.max(0.7, Number((len * 0.92).toFixed(2)))),
          height: 2.1,
          sillHeight: 0,
          frameMaterialId: fmWhite,
          swing: swingLeft
            ? isBotHinge ? 'in_right' : 'in_left'
            : isBotHinge ? 'out_right' : 'out_left',
        };
      }
    }
    return null;
  };

  mergedH.forEach((h, i) => {
    const mx = (h.x1 + h.x2) / 2;
    const isExt = isOutsideAtM(mx, h.y - 0.3) !== isOutsideAtM(mx, h.y + 0.3);
    walls.push({
      id: `nv-wh-${i + 1}`,
      x1: h.x1,
      y1: h.y,
      x2: h.x2,
      y2: h.y,
      thickness: isExt ? 0.22 : 0.14,
      height: H,
      isLoadBearing: isExt,
      demolished: false,
      isExterior: isExt,
      frontMaterialId: wpDefault,
      backMaterialId: wpDefault,
      openings: [],
    });
  });

  mergedV.forEach((v, i) => {
    const my = (v.y1 + v.y2) / 2;
    const isExt = isOutsideAtM(v.x - 0.3, my) !== isOutsideAtM(v.x + 0.3, my);
    walls.push({
      id: `nv-wv-${i + 1}`,
      x1: v.x,
      y1: v.y1,
      x2: v.x,
      y2: v.y2,
      thickness: isExt ? 0.22 : 0.14,
      height: H,
      isLoadBearing: isExt,
      demolished: false,
      isExterior: isExt,
      frontMaterialId: wpDefault,
      backMaterialId: wpDefault,
      openings: [],
    });
  });

  gapBridges.forEach((g, idx) => {
    const op = buildOpeningForGap(g.ori, g.x1, g.y1, g.x2, g.y2, idx + 1);
    if (!op) return;
    const mx = (g.x1 + g.x2) / 2;
    const my = (g.y1 + g.y2) / 2;
    const isExt =
      g.ori === 'H'
        ? isOutsideAtM(mx, my - 0.3) !== isOutsideAtM(mx, my + 0.3)
        : isOutsideAtM(mx - 0.3, my) !== isOutsideAtM(mx + 0.3, my);
    walls.push({
      id: `nv-wg-${idx + 1}`,
      x1: g.x1,
      y1: g.y1,
      x2: g.x2,
      y2: g.y2,
      thickness: isExt ? 0.2 : 0.12,
      height: H,
      isLoadBearing: isExt,
      demolished: false,
      isExterior: isExt,
      frontMaterialId: wpDefault,
      backMaterialId: wpDefault,
      openings: [op],
    });
  });

  // 8. 욕실 위생도기 및 기본 가구 자동 배치
  const furniture: FurnitureItem[] = [];
  rooms.forEach((rm, idx) => {
    const xs = rm.polygon.map((p) => p.x);
    const ys = rm.polygon.map((p) => p.y);
    const rx1 = Math.min(...xs);
    const rx2 = Math.max(...xs);
    const ry1 = Math.min(...ys);
    const ry2 = Math.max(...ys);
    const rw = rx2 - rx1;
    const rd = ry2 - ry1;
    const cx = (rx1 + rx2) / 2;
    const cy = (ry1 + ry2) / 2;

    if (rm.type === 'bath' && rw >= 1.1 && rd >= 1.1) {
      const isWide = rw >= rd;
      if (rm.name.includes('공용')) {
        if (isWide) {
          furniture.push(
            { id: `nv-fn-tub-${idx}`, name: '욕조', category: 'bathtub', x: Number((rx1 + rw * 0.45).toFixed(2)), y: Number((ry1 + 0.42).toFixed(2)), width: Math.min(1.65, Number((rw * 0.72).toFixed(2))), depth: 0.7, height: 0.55, rotation: 0, color: '#FFFFFF' },
            { id: `nv-fn-van-${idx}`, name: '세면대', category: 'vanity', x: Number((rx2 - 0.38).toFixed(2)), y: Number((ry1 + rd * 0.58).toFixed(2)), width: 0.52, depth: 0.42, height: 0.82, rotation: Math.PI / 2, color: '#FFFFFF' },
            { id: `nv-fn-toi-${idx}`, name: '양변기', category: 'toilet', x: Number((rx2 - 0.4).toFixed(2)), y: Number((ry2 - 0.36).toFixed(2)), width: 0.42, depth: 0.6, height: 0.72, rotation: Math.PI / 2, color: '#FFFFFF' }
          );
        } else {
          furniture.push(
            { id: `nv-fn-tub-${idx}`, name: '욕조', category: 'bathtub', x: Number((rx1 + 0.42).toFixed(2)), y: Number((ry1 + rd * 0.45).toFixed(2)), width: 0.7, depth: Math.min(1.65, Number((rd * 0.72).toFixed(2))), height: 0.55, rotation: 0, color: '#FFFFFF' },
            { id: `nv-fn-van-${idx}`, name: '세면대', category: 'vanity', x: Number((rx2 - 0.36).toFixed(2)), y: Number((ry1 + 0.48).toFixed(2)), width: 0.52, depth: 0.42, height: 0.82, rotation: Math.PI / 2, color: '#FFFFFF' },
            { id: `nv-fn-toi-${idx}`, name: '양변기', category: 'toilet', x: Number((rx2 - 0.38).toFixed(2)), y: Number((ry1 + 1.15).toFixed(2)), width: 0.42, depth: 0.6, height: 0.72, rotation: Math.PI / 2, color: '#FFFFFF' }
          );
        }
      } else {
        furniture.push(
          { id: `nv-fn-shw-${idx}`, name: '샤워부스', category: 'shower', x: Number((rx1 + 0.48).toFixed(2)), y: Number((ry1 + 0.48).toFixed(2)), width: 0.82, depth: 0.82, height: 2.0, rotation: 0, color: '#BAE6FD' },
          { id: `nv-fn-van-${idx}`, name: '세면대', category: 'vanity', x: Number((rx2 - 0.36).toFixed(2)), y: Number((ry1 + 0.45).toFixed(2)), width: 0.5, depth: 0.4, height: 0.82, rotation: Math.PI / 2, color: '#FFFFFF' },
          { id: `nv-fn-toi-${idx}`, name: '양변기', category: 'toilet', x: Number((rx2 - 0.38).toFixed(2)), y: Number((ry2 - 0.4).toFixed(2)), width: 0.42, depth: 0.58, height: 0.72, rotation: Math.PI / 2, color: '#FFFFFF' }
        );
      }
    } else if (rm.type === 'master' && rw >= 2.2 && rd >= 2.2) {
      furniture.push({
        id: `nv-fn-bed-${idx}`,
        name: '안방 침대',
        category: 'bed',
        x: Number(cx.toFixed(2)),
        y: Number(cy.toFixed(2)),
        width: 1.8,
        depth: 2.0,
        height: 0.55,
        rotation: 0,
        color: '#C8BFAF',
      });
    }
  });

  const lights: LightFixture[] = rooms
    .filter((r) => r.type === 'living' || r.type === 'master' || r.type === 'kitchen')
    .slice(0, 4)
    .map((r, i) => {
      const cx = r.polygon.reduce((s, p) => s + p.x, 0) / r.polygon.length;
      const cy = r.polygon.reduce((s, p) => s + p.y, 0) / r.polygon.length;
      return {
        id: `nv-lt-${i + 1}`,
        roomId: r.id,
        type: r.type === 'living' ? 'ceiling_fan' : r.type === 'kitchen' ? 'pendant' : 'downlight_3',
        x: Number(cx.toFixed(2)),
        y: Number(cy.toFixed(2)),
        kelvin: r.type === 'master' ? '3000K' : '4000K',
        on: true,
      };
    });

  // 9. 디버그/검수용 오버레이 이미지 생성 (원본 크롭 이미지 위에 추출된 벽·문 시각화)
  const dbgCanvas = document.createElement('canvas');
  dbgCanvas.width = cropW;
  dbgCanvas.height = cropH;
  const dbgCtx = dbgCanvas.getContext('2d')!;
  dbgCtx.drawImage(fullCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
  const croppedSourceDataUrl = dbgCanvas.toDataURL('image/png');
  dbgCtx.fillStyle = 'rgba(255, 255, 255, 0.35)';
  dbgCtx.fillRect(0, 0, cropW, cropH);

  for (const w of walls) {
    const hasDoor = w.openings.some((o) => o.type === 'door' || o.type === 'entrance');
    const hasWin = w.openings.some((o) => o.type === 'window');
    dbgCtx.strokeStyle = hasDoor ? '#16a34a' : hasWin ? '#0284c7' : '#dc2626';
    dbgCtx.lineWidth = hasDoor || hasWin ? 4 : 3;
    dbgCtx.beginPath();
    dbgCtx.moveTo(w.x1 * pxPerM, w.y1 * pxPerM);
    dbgCtx.lineTo(w.x2 * pxPerM, w.y2 * pxPerM);
    dbgCtx.stroke();
  }

  const widthM = Number((cropW * mPerPx).toFixed(2));
  const depthM = Number((cropH * mPerPx).toFixed(2));
  const detectedAreaSqm = Number(
    rawRooms.reduce((s, r) => s + r.areaSqm, 0).toFixed(1)
  );

  const plan: FloorPlanTemplate = {
    id: `naver-${options.complexId || 'custom'}-${Date.now()}`,
    complexId: options.complexId || 'custom-naver',
    complexName: options.complexName || '네이버 도면 변환',
    district: options.district || '강동구',
    region: 'seoul',
    typeName: options.typeName || `${targetAreaSqm}㎡ (네이버 2D 실측)`,
    areaSqm: targetAreaSqm,
    pyeong: Math.round(targetAreaSqm / 3.3058),
    bayInfo: `네이버 2D 직교 추출 · 벽 ${walls.length}개 · 실 ${rooms.length}개`,
    isExtended: true,
    description: '네이버 부동산 2D 평면도 이미지를 직교 CV로 분석하여 1:1 비율로 생성된 도면입니다.',
    width: widthM,
    depth: depthM,
    rooms,
    walls,
    lights,
    furniture,
  };

  return {
    plan,
    croppedSourceDataUrl,
    debugOverlayDataUrl: dbgCanvas.toDataURL('image/png'),
    stats: {
      wallCount: walls.length,
      roomCount: rooms.length,
      doorCount,
      windowCount,
      fixtureCount: furniture.length,
      detectedAreaSqm,
    },
  };
}
