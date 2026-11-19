import {
  DoorSwing,
  FloorPlanTemplate,
  FurnitureItem,
  LightFixture,
  Opening,
  Room,
  RoomType,
  Wall,
} from '../types/interior';

/* =====================================================================
 * Plan Wizard Engine
 * 사람은 "의미"(어느 영역이 어떤 방인지, 문/창 종류)를 클릭으로 알려주고
 * 엔진은 "기하"(방 윤곽, 벽 두께·중심선, 개구부 위치, 축척)를 정확히 계산한다.
 * ===================================================================== */

export type Pt = { x: number; y: number };
export type Ori = 'H' | 'V';

export interface PlanImage {
  w: number;
  h: number;
  data: Uint8ClampedArray;
  luma: Uint8Array;
  dark: Uint8Array;
  thick: Uint8Array;
}

export interface RoomMask {
  x0: number;
  y0: number;
  w: number;
  h: number;
  m: Uint8Array;
  area: number;
  color: [number, number, number];
}

export interface WSeg {
  ori: Ori;
  c: number; // 벽 중심선 좌표 (H: y, V: x)
  a1: number; // 축 방향 시작 (H: x, V: y)
  a2: number;
  t: number; // 벽 두께(px)
}

export type Gap = WSeg;
export type OpeningKind = 'door' | 'entrance' | 'window' | 'sliding_door';

export interface WOpening {
  id: string;
  type: OpeningKind;
  center: number;
  width: number;
  swing: DoorSwing;
}

export interface WWall extends WSeg {
  id: string;
  exterior: boolean;
  gapWall: boolean;
  openings: WOpening[];
}

export interface WRoom {
  id: string;
  name: string;
  type: RoomType;
  poly: Pt[];
  mask: RoomMask;
  autoNamed: boolean;
}

const DARK = 135;

/* ----------------------------- Image ----------------------------- */

function loadImg(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = url;
  });
}

export async function loadPlanImage(
  url: string
): Promise<{ plan: PlanImage; canvas: HTMLCanvasElement }> {
  const img = await loadImg(url);
  const maxSide = Math.max(img.width, img.height);
  const target = Math.min(1400, Math.max(1000, maxSide));
  const s = target / maxSide;
  const w = Math.max(1, Math.round(img.width * s));
  const h = Math.max(1, Math.round(img.height * s));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('canvas unavailable');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h).data;

  const N = w * h;
  const luma = new Uint8Array(N);
  const dark = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const p = i * 4;
    const l = (data[p] * 299 + data[p + 1] * 587 + data[p + 2] * 114) / 1000;
    luma[i] = l;
    if (l < DARK) dark[i] = 1;
  }

  // 두꺼운 검정(=벽체, 2px 이상 직선 벽 포함)과 얇은 선(=문호, 글자, 창틀선, 욕실 내부 도기선)을 분리
  const LWall = Math.max(16, Math.round(Math.max(w, h) / 55));
  const hRun = new Uint16Array(N);
  const vRun = new Uint16Array(N);
  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < w) {
      if (!dark[y * w + x]) {
        x++;
        continue;
      }
      let e = x;
      while (e < w && dark[y * w + e]) e++;
      const len = Math.min(65535, e - x);
      for (let k = x; k < e; k++) hRun[y * w + k] = len;
      x = e;
    }
  }
  for (let x = 0; x < w; x++) {
    let y = 0;
    while (y < h) {
      if (!dark[y * w + x]) {
        y++;
        continue;
      }
      let e = y;
      while (e < h && dark[e * w + x]) e++;
      const len = Math.min(65535, e - y);
      for (let k = y; k < e; k++) vRun[k * w + x] = len;
      y = e;
    }
  }

  const isBathPixel = (idx: number) => {
    const q = idx * 4;
    return data[q + 2] - data[q] > 4 && luma[idx] > 160;
  };

  const thick = new Uint8Array(N);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!dark[i] || luma[i] >= 105) continue;
      const isHWall = hRun[i] >= LWall && vRun[i] >= 2;
      const isVWall = vRun[i] >= LWall && hRun[i] >= 2;
      if (!isHWall && !isVWall) continue;

      // 욕실(하늘색) 내부의 욕조·샤워부스·변기 구분선(양쪽이 모두 욕실 바닥인 얇은 선)은 벽체에서 제외
      if (vRun[i] <= 3 && y >= 6 && y + 6 < h && isBathPixel((y - 6) * w + x) && isBathPixel((y + 6) * w + x)) {
        continue;
      }
      if (hRun[i] <= 3 && x >= 6 && x + 6 < w && isBathPixel(y * w + (x - 6)) && isBathPixel(y * w + (x + 6))) {
        continue;
      }
      thick[i] = 1;
    }
  }

  return { plan: { w, h, data, luma, dark, thick }, canvas };
}

export function cellSize(p: PlanImage): number {
  return Math.max(2, Math.round(Math.max(p.w, p.h) / 360));
}

/* --------------------------- Geometry utils --------------------------- */

export function pointInPoly(pt: Pt, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    if (yi > pt.y !== yj > pt.y && pt.x < ((xj - xi) * (pt.y - yi)) / (yj - yi + 1e-12) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function shoelace(poly: Pt[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

export function polyArea(poly: Pt[]): number {
  return Math.abs(shoelace(poly));
}

export function labelPoint(poly: Pt[]): Pt {
  const xs = poly.map((p) => p.x);
  const ys = poly.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const c = { x: (minX + maxX) / 2, y: (minY + maxY) / 2 };
  if (pointInPoly(c, poly)) return c;
  let best = c;
  let bd = Infinity;
  const step = Math.max(2, Math.min(maxX - minX, maxY - minY) / 12);
  for (let y = minY + step / 2; y < maxY; y += step) {
    for (let x = minX + step / 2; x < maxX; x += step) {
      if (!pointInPoly({ x, y }, poly)) continue;
      const d = Math.hypot(x - c.x, y - c.y);
      if (d < bd) {
        bd = d;
        best = { x, y };
      }
    }
  }
  return best;
}

function median(arr: number[]): number {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

/* ----------------------------- Room fill ----------------------------- */

/**
 * 클릭한 지점에서 같은 바닥색 영역을 채운다.
 * - 두꺼운 검정(벽)은 통과 불가, 얇은 선(문호·글자·도기 외곽선)은 통과 → 방이 문호에 잘리지 않음
 * - 이후 방 안의 위생도기·주방 상판·글자 등 내부 구멍을 메운다.
 */
export function floodFillRoom(
  p: PlanImage,
  sxIn: number,
  syIn: number,
  taken: Int16Array
): RoomMask | string {
  const { w, h, data, luma, dark, thick } = p;
  let sx = Math.round(sxIn);
  let sy = Math.round(syIn);
  if (sx < 0 || sy < 0 || sx >= w || sy >= h) return '도면 영역 밖을 클릭했습니다.';
  if (thick[sy * w + sx]) return '벽 위를 클릭했습니다. 방 안쪽 바닥을 클릭해 주세요.';
  if (taken[sy * w + sx]) return '이미 지정된 방입니다.';

  if (dark[sy * w + sx]) {
    let found = false;
    for (let r = 1; r <= 6 && !found; r++) {
      for (let dy = -r; dy <= r && !found; dy++) {
        for (let dx = -r; dx <= r && !found; dx++) {
          const x = sx + dx;
          const y = sy + dy;
          if (x >= 0 && y >= 0 && x < w && y < h && !dark[y * w + x] && !taken[y * w + x]) {
            sx = x;
            sy = y;
            found = true;
          }
        }
      }
    }
    if (!found) return '바닥 색이 보이는 곳을 클릭해 주세요.';
  }

  let sr = 0;
  let sg = 0;
  let sb = 0;
  let sc = 0;
  for (let dy = -4; dy <= 4; dy++) {
    for (let dx = -4; dx <= 4; dx++) {
      const x = sx + dx;
      const y = sy + dy;
      if (x < 0 || y < 0 || x >= w || y >= h) continue;
      const i = y * w + x;
      if (dark[i]) continue;
      sr += data[i * 4];
      sg += data[i * 4 + 1];
      sb += data[i * 4 + 2];
      sc++;
    }
  }
  if (sc < 5) return '바닥 색이 보이는 곳을 클릭해 주세요.';
  sr /= sc;
  sg /= sc;
  sb /= sc;
  const mx = Math.max(sr, sg, sb);
  const mn = Math.min(sr, sg, sb);
  const sat = mx > 0 ? (mx - mn) / mx : 0;
  const sl = 0.299 * sr + 0.587 * sg + 0.114 * sb;

  // 네이버 평면도 4대 바닥 색상군 분리:
  // 1) 거실/복도/주방 진한 오렌지 우드 (R - B >= 47)
  // 2) 안방/침실 연베이지 우드 (14 <= R - B < 47)
  // 3) 욕실 하늘색 타일 (B - R >= 4)
  // 4) 현관/발코니/팬트리/다용도실 무채색 타일 (|R - B| < 14)
  const isLivingWood = sr - sb >= 47 && sl < 220;
  const isBedroomWood = sr - sb >= 14 && sr - sb < 47;
  const isBathSeed = sb - sr >= 4 && sl > 160;
  const isNeutralSeed = !isLivingWood && !isBedroomWood && !isBathSeed;
  const strict = sl > 228 && sat < 0.07;
  const tol2 = (isLivingWood ? 90 : isBedroomWood ? 44 : strict ? 22 : 36) ** 2;

  const ok = (i: number) => {
    if (thick[i] || taken[i] || dark[i]) return false;
    const q = i * 4;
    const r = data[q];
    const g = data[q + 1];
    const b = data[q + 2];
    const l = luma[i];
    const rb = r - b;
    const br = b - r;

    if (isBathSeed) return br >= 3 && l > 155;
    if (isLivingWood) return rb >= 44 && l > 105 && l < 238;
    if (isBedroomWood) {
      if (rb < 12 || rb >= 47 || br >= 3) return false;
    } else if (isNeutralSeed) {
      if (rb >= 16 || br >= 5) return false;
    }

    const dr = r - sr;
    const dg = g - sg;
    const db = b - sb;
    return dr * dr + dg * dg + db * db <= tol2;
  };

  const N = w * h;
  const vis = new Uint8Array(N);
  const q = new Int32Array(N);
  let head = 0;
  let tail = 0;
  const seed = sy * w + sx;
  vis[seed] = 1;
  q[tail++] = seed;
  let minX = sx;
  let maxX = sx;
  let minY = sy;
  let maxY = sy;
  let border = false;
  const limit = Math.floor(N * 0.65);

  // 얇은 선(1~3px 문 열림 호·문짝·글자·욕조 구분선·현관 격자선) 너머에 동일한 방 바닥색이 이어지면 건너뛰어 온전한 직사각형으로 채움
  // (단, 아주 밝은 흰 발코니는 창틀선을 넘어 흰 배경으로 번지지 않도록 점프 비활성화)
  const allowThinJump = isLivingWood || isBedroomWood || isBathSeed || (isNeutralSeed && !strict);

  const stepDir = (cx: number, cy: number, dx: number, dy: number) => {
    const nx = cx + dx;
    const ny = cy + dy;
    if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
    const ni = ny * w + nx;
    if (!vis[ni] && ok(ni)) {
      vis[ni] = 1;
      q[tail++] = ni;
      return;
    }
    if (allowThinJump && dark[ni] && !thick[ni]) {
      const maxJump = isBathSeed ? 8 : isNeutralSeed ? 3 : 4;
      for (let k = 2; k <= maxJump; k++) {
        const ax = cx + dx * k;
        const ay = cy + dy * k;
        if (ax < 0 || ay < 0 || ax >= w || ay >= h) break;
        const ai = ay * w + ax;
        if (thick[ai]) break;
        if (!dark[ai]) {
          if (!vis[ai] && ok(ai)) {
            vis[ai] = 1;
            q[tail++] = ai;
          }
          break;
        }
      }
    }
  };

  while (head < tail) {
    const cur = q[head++];
    const x = cur % w;
    const y = (cur - x) / w;
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
    if (x === 0 || y === 0 || x === w - 1 || y === h - 1) border = true;
    if (tail > limit) break;
    stepDir(x, y, -1, 0);
    stepDir(x, y, 1, 0);
    stepDir(x, y, 0, -1);
    stepDir(x, y, 0, 1);
  }

  if (border || tail > limit) {
    return '방 경계가 열려 있어 도면 바깥까지 번졌습니다. [사각형] 도구로 이 방을 직접 그려 주세요.';
  }

  // ---- 내부 구멍(욕조 0.75m·주방 상판 0.65m·도기·글자·문호 쐐기) 메우기 ----
  const M = isBathSeed
    ? cellSize(p) * 14 + 10
    : isLivingWood
      ? cellSize(p) * 8 + 6
      : cellSize(p) * 3 + 4;
  const x0 = Math.max(0, minX - M);
  const y0 = Math.max(0, minY - M);
  const x1 = Math.min(w - 1, maxX + M);
  const y1 = Math.min(h - 1, maxY + M);
  const LW = x1 - x0 + 1;
  const LH = y1 - y0 + 1;
  const LN = LW * LH;
  const lm = new Uint8Array(LN);
  for (let k = 0; k < tail; k++) {
    const g = q[k];
    const gx = g % w;
    const gy = (g - gx) / w;
    lm[(gy - y0) * LW + (gx - x0)] = 1;
  }

  const reach = new Uint8Array(LN);
  const lq = new Int32Array(LN);
  let lh = 0;
  let lt = 0;
  const gIdx = (k: number) => (y0 + Math.floor(k / LW)) * w + (x0 + (k % LW));
  const passOut = (k: number) => !lm[k] && !dark[gIdx(k)];
  const seedOut = (k: number) => {
    if (!reach[k] && passOut(k)) {
      reach[k] = 1;
      lq[lt++] = k;
    }
  };
  for (let x = 0; x < LW; x++) {
    seedOut(x);
    seedOut((LH - 1) * LW + x);
  }
  for (let y = 0; y < LH; y++) {
    seedOut(y * LW);
    seedOut(y * LW + LW - 1);
  }
  while (lh < lt) {
    const k = lq[lh++];
    const kx = k % LW;
    const ky = (k - kx) / LW;
    if (kx > 0) seedOut(k - 1);
    if (kx < LW - 1) seedOut(k + 1);
    if (ky > 0) seedOut(k - LW);
    if (ky < LH - 1) seedOut(k + LW);
  }

  lh = 0;
  lt = 0;
  for (let k = 0; k < LN; k++) if (lm[k]) lq[lt++] = k;
  const grow = (n: number) => {
    if (lm[n] || reach[n]) return;
    const gi = gIdx(n);
    if (thick[gi] || taken[gi]) return;
    const r = data[gi * 4];
    const b = data[gi * 4 + 2];
    const rb = r - b;
    const br = b - r;
    // 구멍 메우기가 문턱 너머 다른 색상군의 방(복도·침실·욕실)으로 새어나가지 않도록 차단
    if (isBathSeed && rb >= 14) return;
    if (isBedroomWood && (rb >= 47 || br >= 4)) return;
    if (isLivingWood && (br >= 4 || (rb >= 14 && rb < 42 && luma[gi] > 195))) return;
    if (isNeutralSeed && (rb >= 16 || br >= 4)) return;
    lm[n] = 1;
    lq[lt++] = n;
  };
  while (lh < lt) {
    const k = lq[lh++];
    const kx = k % LW;
    const ky = (k - kx) / LW;
    if (kx > 0) grow(k - 1);
    if (kx < LW - 1) grow(k + 1);
    if (ky > 0) grow(k - LW);
    if (ky < LH - 1) grow(k + LW);
  }

  let area = 0;
  for (let k = 0; k < LN; k++) if (lm[k]) area++;
  if (area < 60) return '너무 작은 영역입니다. 방 바닥 가운데를 클릭해 주세요.';

  return { x0, y0, w: LW, h: LH, m: lm, area, color: [sr, sg, sb] };
}

export function rectRoomMask(
  p: PlanImage,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  taken: Int16Array
): RoomMask | null {
  const x0 = Math.max(0, Math.round(Math.min(ax, bx)));
  const y0 = Math.max(0, Math.round(Math.min(ay, by)));
  const x1 = Math.min(p.w - 1, Math.round(Math.max(ax, bx)));
  const y1 = Math.min(p.h - 1, Math.round(Math.max(ay, by)));
  const LW = x1 - x0 + 1;
  const LH = y1 - y0 + 1;
  if (LW < 8 || LH < 8) return null;
  const m = new Uint8Array(LW * LH);
  let area = 0;
  let sr = 0;
  let sg = 0;
  let sb = 0;
  let sc = 0;
  for (let y = 0; y < LH; y++) {
    for (let x = 0; x < LW; x++) {
      const gi = (y0 + y) * p.w + (x0 + x);
      if (taken[gi]) continue;
      m[y * LW + x] = 1;
      area++;
      if (!p.dark[gi]) {
        sr += p.data[gi * 4];
        sg += p.data[gi * 4 + 1];
        sb += p.data[gi * 4 + 2];
        sc++;
      }
    }
  }
  if (area < 60) return null;
  sc = Math.max(1, sc);
  return { x0, y0, w: LW, h: LH, m, area, color: [sr / sc, sg / sc, sb / sc] };
}

/* ------------------------- Mask → Orthogonal polygon ------------------------- */

function morph(g: Uint8Array, W: number, H: number, dilate: boolean): Uint8Array {
  const out = new Uint8Array(W * H);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      let any = false;
      let all = true;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (g[(y + dy) * W + x + dx]) any = true;
          else all = false;
        }
      }
      out[y * W + x] = (dilate ? any : all) ? 1 : 0;
    }
  }
  return out;
}

function largestComponent(g: Uint8Array, W: number, H: number): Uint8Array {
  const lab = new Int32Array(W * H);
  const q = new Int32Array(W * H);
  let best = 0;
  let bestSize = 0;
  let cur = 0;
  for (let i = 0; i < W * H; i++) {
    if (!g[i] || lab[i]) continue;
    cur++;
    let h = 0;
    let t = 0;
    q[t++] = i;
    lab[i] = cur;
    while (h < t) {
      const k = q[h++];
      const x = k % W;
      const nb = [x > 0 ? k - 1 : -1, x < W - 1 ? k + 1 : -1, k - W, k + W];
      for (const n of nb) {
        if (n < 0 || n >= W * H) continue;
        if (g[n] && !lab[n]) {
          lab[n] = cur;
          q[t++] = n;
        }
      }
    }
    if (t > bestSize) {
      bestSize = t;
      best = cur;
    }
  }
  const out = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) if (lab[i] === best) out[i] = 1;
  return out;
}

function fillGridHoles(g: Uint8Array, W: number, H: number): Uint8Array {
  const reach = new Uint8Array(W * H);
  const q = new Int32Array(W * H);
  let h = 0;
  let t = 0;
  const seed = (k: number) => {
    if (!g[k] && !reach[k]) {
      reach[k] = 1;
      q[t++] = k;
    }
  };
  for (let x = 0; x < W; x++) {
    seed(x);
    seed((H - 1) * W + x);
  }
  for (let y = 0; y < H; y++) {
    seed(y * W);
    seed(y * W + W - 1);
  }
  while (h < t) {
    const k = q[h++];
    const x = k % W;
    if (x > 0) seed(k - 1);
    if (x < W - 1) seed(k + 1);
    if (k - W >= 0) seed(k - W);
    if (k + W < W * H) seed(k + W);
  }
  const out = new Uint8Array(W * H);
  for (let i = 0; i < W * H; i++) out[i] = g[i] || !reach[i] ? 1 : 0;
  return out;
}

function cleanPoly(pts: Pt[]): Pt[] {
  let p = pts.map((q) => ({ ...q }));
  let changed = true;
  let guard = 0;
  while (changed && p.length > 3 && guard++ < 100) {
    changed = false;
    const out: Pt[] = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[(i - 1 + p.length) % p.length];
      const b = p[i];
      const c = p[(i + 1) % p.length];
      if (b.x === c.x && b.y === c.y) {
        changed = true;
        continue;
      }
      if ((a.x === b.x && b.x === c.x) || (a.y === b.y && b.y === c.y)) {
        changed = true;
        continue;
      }
      out.push(b);
    }
    p = out;
  }
  return p;
}

function dirOf(a: Pt, b: Pt): string {
  if (a.x === b.x) return b.y > a.y ? 'D' : 'U';
  return b.x > a.x ? 'R' : 'L';
}

function simplifyOrtho(input: Pt[], jog: number): Pt[] {
  let p = cleanPoly(input);
  for (let iter = 0; iter < 500 && p.length > 4; iter++) {
    let done = true;
    const n = p.length;
    for (let i = 0; i < n; i++) {
      const a = p[(i - 1 + n) % n];
      const b = p[i];
      const c = p[(i + 1) % n];
      const d = p[(i + 2) % n];
      const lbc = Math.abs(c.x - b.x) + Math.abs(c.y - b.y);
      if (lbc > jog) continue;
      if (dirOf(a, b) !== dirOf(c, d)) continue;
      const lab = Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
      const lcd = Math.abs(d.x - c.x) + Math.abs(d.y - c.y);
      const horiz = a.y === b.y;
      if (lab >= lcd) {
        if (horiz) {
          c.y = b.y;
          d.y = b.y;
        } else {
          c.x = b.x;
          d.x = b.x;
        }
      } else if (horiz) {
        a.y = c.y;
        b.y = c.y;
      } else {
        a.x = c.x;
        b.x = c.x;
      }
      done = false;
      break;
    }
    if (done) break;
    p = cleanPoly(p);
  }
  return p;
}

export function maskToPolygon(rm: RoomMask, cell: number): Pt[] {
  const gw = Math.ceil(rm.w / cell);
  const gh = Math.ceil(rm.h / cell);
  const P = 2;
  const W = gw + P * 2;
  const H = gh + P * 2;
  let g = new Uint8Array(W * H);
  for (let cy = 0; cy < gh; cy++) {
    for (let cx = 0; cx < gw; cx++) {
      let cnt = 0;
      let tot = 0;
      const yEnd = Math.min(rm.h, (cy + 1) * cell);
      const xEnd = Math.min(rm.w, (cx + 1) * cell);
      for (let yy = cy * cell; yy < yEnd; yy++) {
        for (let xx = cx * cell; xx < xEnd; xx++) {
          tot++;
          if (rm.m[yy * rm.w + xx]) cnt++;
        }
      }
      if (tot && cnt * 2 >= tot) g[(cy + P) * W + cx + P] = 1;
    }
  }
  g = morph(g, W, H, true);
  g = morph(g, W, H, false);
  g = largestComponent(g, W, H);
  g = fillGridHoles(g, W, H);

  const VW = W + 1;
  const from: number[] = [];
  const to: number[] = [];
  const outMap = new Map<number, number[]>();
  const addE = (ax: number, ay: number, bx: number, by: number) => {
    const a = ay * VW + ax;
    const b = by * VW + bx;
    const id = from.length;
    from.push(a);
    to.push(b);
    const arr = outMap.get(a);
    if (arr) arr.push(id);
    else outMap.set(a, [id]);
  };
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      if (!g[y * W + x]) continue;
      if (!g[(y - 1) * W + x]) addE(x, y, x + 1, y);
      if (!g[y * W + x + 1]) addE(x + 1, y, x + 1, y + 1);
      if (!g[(y + 1) * W + x]) addE(x + 1, y + 1, x, y + 1);
      if (!g[y * W + x - 1]) addE(x, y + 1, x, y);
    }
  }
  const used = new Uint8Array(from.length);
  let best: Pt[] = [];
  let bestA = 0;
  for (let s = 0; s < from.length; s++) {
    if (used[s]) continue;
    const loop: Pt[] = [];
    let e = s;
    let guard = 0;
    while (!used[e] && guard++ < 500000) {
      used[e] = 1;
      const a = from[e];
      loop.push({ x: a % VW, y: Math.floor(a / VW) });
      const nexts = outMap.get(to[e]) || [];
      let nx = -1;
      for (const c of nexts) {
        if (!used[c]) {
          nx = c;
          break;
        }
      }
      if (nx < 0) break;
      e = nx;
    }
    const A = Math.abs(shoelace(loop));
    if (A > bestA) {
      bestA = A;
      best = loop;
    }
  }
  const pts = best.map((v) => ({
    x: rm.x0 + (v.x - P) * cell,
    y: rm.y0 + (v.y - P) * cell,
  }));
  return simplifyOrtho(pts, cell * 2 + 0.5);
}

/* ------------------------------ Walls ------------------------------ */

function mergeCollinear(segs: WSeg[]): WSeg[] {
  const arr = segs.map((s) => ({ ...s }));
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 5000) {
    changed = false;
    outer: for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const a = arr[i];
        const b = arr[j];
        if (a.ori !== b.ori) continue;
        if (Math.abs(a.c - b.c) > Math.max(a.t, b.t) * 0.6 + 2) continue;
        if (Math.min(a.a2, b.a2) - Math.max(a.a1, b.a1) < -3) continue;
        const la = Math.max(1, a.a2 - a.a1);
        const lb = Math.max(1, b.a2 - b.a1);
        arr[i] = {
          ori: a.ori,
          c: (a.c * la + b.c * lb) / (la + lb),
          a1: Math.min(a.a1, b.a1),
          a2: Math.max(a.a2, b.a2),
          t: Math.max(a.t, b.t),
        };
        arr.splice(j, 1);
        changed = true;
        break outer;
      }
    }
  }
  return arr;
}

function snapJunctions(segs: WSeg[]): WSeg[] {
  const arr = segs.map((s) => ({ ...s }));
  for (let pass = 0; pass < 2; pass++) {
    for (const s of arr) {
      const mid = (s.a1 + s.a2) / 2;
      for (const endKey of ['a1', 'a2'] as const) {
        const e = s[endKey];
        let best: WSeg | null = null;
        let bd = Infinity;
        for (const q of arr) {
          if (q.ori === s.ori) continue;
          const margin = s.t / 2 + 6;
          if (s.c < q.a1 - margin || s.c > q.a2 + margin) continue;
          if (endKey === 'a1' && q.c >= mid) continue;
          if (endKey === 'a2' && q.c <= mid) continue;
          const d = Math.abs(q.c - e);
          if (d <= q.t / 2 + s.t / 2 + 8 && d < bd) {
            bd = d;
            best = q;
          }
        }
        if (best) s[endKey] = best.c;
      }
    }
  }
  return arr.filter((s) => s.a2 - s.a1 >= 3);
}

/**
 * 각 방 윤곽선에서 바깥쪽으로 "두꺼운 검정"을 측정해 실제 벽 두께·중심선을 구한다.
 * 벽이 끊긴 구간(문·창)은 자연스럽게 빈칸(gap)으로 남는다.
 */
export function buildWallSegments(p: PlanImage, polys: Pt[][]): WSeg[] {
  const { w, h, thick } = p;
  const cell = cellSize(p);
  const maxT = Math.round(Math.max(w, h) * 0.03);
  const slack = cell + 3;
  const isThick = (x: number, y: number) =>
    x >= 0 && y >= 0 && x < w && y < h && thick[y * w + x] === 1;

  const raw: WSeg[] = [];
  for (const poly of polys) {
    const n = poly.length;
    for (let i = 0; i < n; i++) {
      const A = poly[i];
      const B = poly[(i + 1) % n];
      let ori: Ori;
      if (A.y === B.y && A.x !== B.x) ori = 'H';
      else if (A.x === B.x && A.y !== B.y) ori = 'V';
      else continue;
      const lo = ori === 'H' ? Math.min(A.x, B.x) : Math.min(A.y, B.y);
      const hi = ori === 'H' ? Math.max(A.x, B.x) : Math.max(A.y, B.y);
      const coord = ori === 'H' ? A.y : A.x;
      if (hi - lo < 4) continue;
      const mid = (lo + hi) / 2;
      const test = ori === 'H' ? { x: mid, y: coord + 1.5 } : { x: coord + 1.5, y: mid };
      const ns = pointInPoly(test, poly) ? -1 : 1;

      const samples: { pos: number; k0: number; t: number }[] = [];
      for (let pos = lo + 2; pos <= hi - 2; pos += 2) {
        const at = (k: number): [number, number] =>
          ori === 'H'
            ? [Math.round(pos), Math.round(coord + ns * k)]
            : [Math.round(coord + ns * k), Math.round(pos)];
        let k0 = -1e9;
        let t = 0;
        for (let k = -cell; k <= slack + maxT; k++) {
          const [x, y] = at(k);
          if (isThick(x, y)) {
            if (k0 === -1e9) {
              if (k > slack) break;
              k0 = k;
              while (k0 > -2 * cell) {
                const [px, py] = at(k0 - 1);
                if (!isThick(px, py)) break;
                k0--;
              }
              t = k - k0;
            }
            t++;
            if (t >= maxT) break;
          } else if (k0 !== -1e9) {
            break;
          }
        }
        samples.push({ pos, k0, t: k0 === -1e9 ? 0 : t });
      }

      const flush = (s: number, e: number) => {
        if (e - s + 1 < 3) return;
        const seg = samples.slice(s, e + 1).filter((q) => q.t >= 2);
        if (seg.length < 3) return;
        const k0m = median(seg.map((q) => q.k0));
        const tm = median(seg.map((q) => q.t));
        const c = coord + ns * (k0m + tm / 2);
        let a1 = samples[s].pos - 2;
        let a2 = samples[e].pos + 2;
        if (a1 - lo <= 6) a1 = lo - (k0m + tm);
        if (hi - a2 <= 6) a2 = hi + (k0m + tm);
        raw.push({ ori, c, a1, a2, t: tm });
      };

      let runStart = -1;
      let lastWall = -1;
      let miss = 0;
      for (let k = 0; k < samples.length; k++) {
        if (samples[k].t >= 2) {
          if (runStart < 0) runStart = k;
          lastWall = k;
          miss = 0;
        } else if (runStart >= 0) {
          miss++;
          if (miss > 1) {
            flush(runStart, lastWall);
            runStart = -1;
            miss = 0;
          }
        }
      }
      if (runStart >= 0) flush(runStart, lastWall);
    }
  }

  return mergeCollinear(snapJunctions(mergeCollinear(raw)));
}

export function estimateScale(segs: WSeg[], spanPx: number): number {
  let m = 0.015;
  if (segs.length) {
    const items = segs.map((s) => ({ t: s.t, l: Math.max(1, s.a2 - s.a1) })).sort((a, b) => a.t - b.t);
    const total = items.reduce((s, i) => s + i.l, 0);
    let acc = 0;
    let med = items[0].t;
    for (const it of items) {
      acc += it.l;
      if (acc >= total / 2) {
        med = it.t;
        break;
      }
    }
    m = 0.2 / Math.max(2, med);
  }
  if (spanPx > 0) {
    const span = spanPx * m;
    if (span < 6 || span > 30) m = 13 / spanPx;
  }
  return m;
}

/* --------------------------- Gaps (문·창 후보) --------------------------- */

export function findGaps(segs: WSeg[], mPerPx: number): Gap[] {
  const minG = 0.3 / mPerPx;
  const maxG = 3.8 / mPerPx;
  const maxCorner = 1.4 / mPerPx;
  const colTol = (a: WSeg, b: WSeg) => Math.max(a.t, b.t) * 0.6 + 2;
  const gaps: Gap[] = [];

  for (const a of segs) {
    let best: WSeg | null = null;
    for (const b of segs) {
      if (b === a || b.ori !== a.ori) continue;
      if (Math.abs(b.c - a.c) > colTol(a, b)) continue;
      if (b.a1 <= a.a2) continue;
      if (!best || b.a1 < best.a1) best = b;
    }
    if (!best) continue;
    const g = best.a1 - a.a2;
    if (g < minG || g > maxG) continue;
    const c = (a.c + best.c) / 2;
    const crossed = segs.some(
      (q) =>
        q.ori !== a.ori &&
        q.c > a.a2 + q.t &&
        q.c < best!.a1 - q.t &&
        c >= q.a1 - 2 &&
        c <= q.a2 + 2
    );
    if (crossed) continue;
    gaps.push({ ori: a.ori, c, a1: a.a2, a2: best.a1, t: Math.max(a.t, best.t) });
  }

  for (const s of segs) {
    for (const endKey of ['a1', 'a2'] as const) {
      const e = s[endKey];
      const dir = endKey === 'a2' ? 1 : -1;
      const attached = segs.some(
        (q) =>
          q.ori !== s.ori &&
          Math.abs(q.c - e) <= q.t / 2 + s.t / 2 + 3 &&
          s.c >= q.a1 - s.t &&
          s.c <= q.a2 + s.t
      );
      if (attached) continue;
      let best: WSeg | null = null;
      let bd = Infinity;
      for (const q of segs) {
        if (q.ori === s.ori) continue;
        if (s.c < q.a1 - s.t / 2 - 2 || s.c > q.a2 + s.t / 2 + 2) continue;
        const d = (q.c - e) * dir - q.t / 2;
        if (d > 0 && d < bd) {
          bd = d;
          best = q;
        }
      }
      if (!best || bd < minG || bd > maxCorner) continue;
      const lo = dir > 0 ? e : best.c + best.t / 2;
      const hi = dir > 0 ? best.c - best.t / 2 : e;
      const blocked = segs.some(
        (b) =>
          b !== s &&
          b.ori === s.ori &&
          Math.abs(b.c - s.c) <= colTol(s, b) &&
          b.a1 < hi &&
          b.a2 > lo
      );
      if (blocked) continue;
      gaps.push({ ori: s.ori, c: s.c, a1: lo, a2: hi, t: s.t });
    }
  }

  const out: Gap[] = [];
  for (const g of gaps) {
    const dup = out.some(
      (o) =>
        o.ori === g.ori &&
        Math.abs(o.c - g.c) <= Math.max(o.t, g.t) &&
        Math.min(o.a2, g.a2) - Math.max(o.a1, g.a1) > 0
    );
    if (!dup) out.push(g);
  }
  return out;
}

/* --------------------------- Rooms index --------------------------- */

export function buildRoomIndex(w: number, h: number, rooms: WRoom[]): Int16Array {
  const idx = new Int16Array(w * h);
  rooms.forEach((r, k) => {
    const m = r.mask;
    for (let y = 0; y < m.h; y++) {
      const gy = m.y0 + y;
      if (gy < 0 || gy >= h) continue;
      for (let x = 0; x < m.w; x++) {
        if (!m.m[y * m.w + x]) continue;
        const gx = m.x0 + x;
        if (gx < 0 || gx >= w) continue;
        if (!idx[gy * w + gx]) idx[gy * w + gx] = k + 1;
      }
    }
  });
  return idx;
}

export function roomIdxAt(
  idx: Int16Array,
  w: number,
  h: number,
  xIn: number,
  yIn: number,
  r: number
): number {
  const x0 = Math.round(xIn);
  const y0 = Math.round(yIn);
  for (let rr = 0; rr <= r; rr++) {
    for (let dy = -rr; dy <= rr; dy++) {
      for (let dx = -rr; dx <= rr; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== rr) continue;
        const x = x0 + dx;
        const y = y0 + dy;
        if (x < 0 || y < 0 || x >= w || y >= h) continue;
        const v = idx[y * w + x];
        if (v > 0) return v - 1;
      }
    }
  }
  return -1;
}

function sideRoom(idx: Int16Array, p: PlanImage, s: WSeg, along: number, off: number): number {
  const x = s.ori === 'H' ? along : s.c + off;
  const y = s.ori === 'H' ? s.c + off : along;
  return roomIdxAt(idx, p.w, p.h, x, y, 4);
}

/* --------------------------- Door swing --------------------------- */

export function toSwing(ori: Ori, side: number, hingeAtEnd: boolean): DoorSwing {
  const inward = ori === 'H' ? side > 0 : side < 0;
  return `${inward ? 'in' : 'out'}_${hingeAtEnd ? 'right' : 'left'}` as DoorSwing;
}

export function toDoubleSwing(ori: Ori, side: number): DoorSwing {
  const inward = ori === 'H' ? side > 0 : side < 0;
  return (inward ? 'in_double' : 'out_double') as DoorSwing;
}

export function swingInfo(ori: Ori, swing: DoorSwing): { side: number; hingeAtEnd: boolean } {
  const inward = swing.startsWith('in');
  const side = ori === 'H' ? (inward ? 1 : -1) : inward ? -1 : 1;
  return { side, hingeAtEnd: swing.endsWith('right') };
}

function leafRatio(p: PlanImage, g: WSeg, endAlong: number, side: number): number {
  const along = endAlong === g.a1 ? g.a1 + 3 : g.a2 - 3;
  const len = Math.max(6, (g.a2 - g.a1) * 0.6);
  let hits = 0;
  let tot = 0;
  for (let k = g.t / 2 + 3; k <= g.t / 2 + len; k += 1) {
    tot++;
    let hit = false;
    for (let lat = -2; lat <= 2 && !hit; lat++) {
      const x = Math.round(g.ori === 'H' ? along + lat : g.c + side * k);
      const y = Math.round(g.ori === 'H' ? g.c + side * k : along + lat);
      if (x < 0 || y < 0 || x >= p.w || y >= p.h) continue;
      if (p.luma[y * p.w + x] < 165) hit = true;
    }
    if (hit) hits++;
  }
  return tot ? hits / tot : 0;
}

const PRI: Partial<Record<RoomType, number>> = {
  bath: 5,
  dress: 5,
  utility: 4,
  alpha: 4,
  master: 3,
  bedroom: 3,
  balcony: 2,
  entrance: 1,
  kitchen: 0,
  living: 0,
};

/**
 * 빈칸(gap)을 의미에 따라 자동 분류
 * - 방↔방: 0.5~1.2m → 여닫이문 (욕실·드레스룸·침실 쪽으로 열림 = 한국 아파트 관례)
 * - 방↔발코니: 미닫이
 * - 방↔바깥: 현관이면 현관문(바깥으로 열림), 그 외는 창문
 */
export function autoOpenings(
  p: PlanImage,
  rooms: WRoom[],
  idx: Int16Array,
  segs: WSeg[],
  gaps: Gap[],
  mPerPx: number
): { walls: WWall[]; gaps: Gap[] } {
  const cell = cellSize(p);
  const walls: WWall[] = segs.map((s, i) => ({
    ...s,
    id: `w${i}`,
    exterior: false,
    gapWall: false,
    openings: [],
  }));
  const rest: Gap[] = [];

  gaps.forEach((g, gi) => {
    const mid = (g.a1 + g.a2) / 2;
    const off = g.t / 2 + cell * 2 + 4;
    const neg = sideRoom(idx, p, g, mid, -off);
    const pos = sideRoom(idx, p, g, mid, off);
    const wm = (g.a2 - g.a1) * mPerPx;
    const make = (type: OpeningKind, swing: DoorSwing, ext: boolean) => {
      walls.push({
        ...g,
        id: `g${gi}`,
        exterior: ext,
        gapWall: true,
        openings: [{ id: `o${gi}`, type, center: mid, width: g.a2 - g.a1, swing }],
      });
    };

    if (neg >= 0 && pos >= 0 && neg !== pos) {
      const rn = rooms[neg];
      const rp = rooms[pos];
      if ((rn.type === 'balcony' || rp.type === 'balcony') && wm >= 0.6) {
        make('sliding_door', 'in_left', false);
        return;
      }
      if (wm >= 0.45 && wm <= 1.35) {
        const lPA = leafRatio(p, g, g.a1, 1);
        const lPB = leafRatio(p, g, g.a2, 1);
        const lNA = leafRatio(p, g, g.a1, -1);
        const lNB = leafRatio(p, g, g.a2, -1);

        // 팬트리(alpha) 문: 복도/거실 쪽으로 열리는 양개문(in_double / out_double) 우선 적용
        if (rn.type === 'alpha' || rp.type === 'alpha') {
          const corridorSide = rn.type === 'alpha' ? 1 : -1;
          make('door', toDoubleSwing(g.ori, corridorSide), false);
          return;
        }

        // 양쪽 힌지 모두 문짝 픽셀이 뚜렷하면 양개문으로 판정
        if (lPA >= 0.38 && lPB >= 0.38 && lPA + lPB >= lNA + lNB) {
          make('door', toDoubleSwing(g.ori, 1), false);
          return;
        }
        if (lNA >= 0.38 && lNB >= 0.38 && lNA + lNB > lPA + lPB) {
          make('door', toDoubleSwing(g.ori, -1), false);
          return;
        }

        const pn = PRI[rn.type] ?? 2;
        const pp = PRI[rp.type] ?? 2;
        let side = pp > pn ? 1 : pn > pp ? -1 : 0;
        if (side === 0) side = Math.max(lPA, lPB) >= Math.max(lNA, lNB) ? 1 : -1;
        const hingeAtEnd = side > 0 ? lPB > lPA : lNB > lNA;
        make('door', toSwing(g.ori, side, hingeAtEnd), false);
        return;
      }
      rest.push(g);
      return;
    }

    if (neg >= 0 !== pos >= 0) {
      const inside = neg >= 0 ? neg : pos;
      const outSide = neg >= 0 ? 1 : -1;
      const r = rooms[inside];
      if (r.type === 'entrance' && wm >= 0.7 && wm <= 1.3) {
        const hingeAtEnd = leafRatio(p, g, g.a2, outSide) > leafRatio(p, g, g.a1, outSide);
        make('entrance', toSwing(g.ori, outSide, hingeAtEnd), true);
        return;
      }
      if (wm >= 0.4) {
        make('window', 'in_left', true);
        return;
      }
    }
    rest.push(g);
  });

  walls.forEach((wl) => {
    if (wl.gapWall) return;
    const off = wl.t / 2 + cell * 2 + 4;
    let extVotes = 0;
    for (const f of [0.25, 0.5, 0.75]) {
      const along = wl.a1 + (wl.a2 - wl.a1) * f;
      const a = sideRoom(idx, p, wl, along, -off);
      const b = sideRoom(idx, p, wl, along, off);
      if (a >= 0 !== b >= 0) extVotes++;
    }
    wl.exterior = extVotes >= 2;
  });

  return { walls, gaps: rest };
}

/* --------------------------- Room naming --------------------------- */

export function guessRoom(
  c: [number, number, number],
  rooms: WRoom[]
): { name: string; type: RoomType } {
  const [r, , b] = c;
  const l = 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
  const count = (t: RoomType) => rooms.filter((x) => x.type === t).length;
  if (b - r > 4 && l > 160) {
    const n = count('bath');
    return { name: n === 0 ? '공용욕실' : n === 1 ? '부부욕실' : `욕실${n + 1}`, type: 'bath' };
  }
  if (r - b > 55 && l < 200) {
    return count('living') === 0
      ? { name: '거실/주방', type: 'living' }
      : { name: '주방/식당', type: 'kitchen' };
  }
  if (r - b > 14) {
    const n = count('bedroom') + count('master');
    return { name: `침실${n + 1}`, type: 'bedroom' };
  }
  if (l > 212) return { name: '발코니', type: 'balcony' };
  return { name: '다용도실', type: 'utility' };
}

/**
 * 이미지 내 모든 방(거실/주방, 침실, 욕실 및 벽으로 둘러싸인 현관·팬트리·드레스룸·발코니·다용도실)을 고정밀로 자동 시딩한다.
 */
export function autoDetectRooms(p: PlanImage): WRoom[] {
  const rooms: WRoom[] = [];
  const cell = cellSize(p);
  const step = Math.max(12, Math.round(Math.min(p.w, p.h) / 34));
  let taken = buildRoomIndex(p.w, p.h, rooms);

  // 0차: 이미지 테두리에서 시작하는 외부 흰 배경 마스크(outside) 계산
  const N = p.w * p.h;
  const outside = new Uint8Array(N);
  const oq = new Int32Array(N);
  let oh = 0;
  let ot = 0;
  const seedOutPx = (i: number) => {
    if (outside[i] || p.thick[i]) return;
    const q = i * 4;
    const r = p.data[q];
    const b = p.data[q + 2];
    if (p.luma[i] >= 232 && Math.abs(r - b) <= 12) {
      outside[i] = 1;
      oq[ot++] = i;
    }
  };
  for (let x = 0; x < p.w; x++) {
    seedOutPx(x);
    seedOutPx((p.h - 1) * p.w + x);
  }
  for (let y = 0; y < p.h; y++) {
    seedOutPx(y * p.w);
    seedOutPx(y * p.w + p.w - 1);
  }
  while (oh < ot) {
    const cur = oq[oh++];
    const cx = cur % p.w;
    const cy = (cur - cx) / p.w;
    if (cx > 0) seedOutPx(cur - 1);
    if (cx + 1 < p.w) seedOutPx(cur + 1);
    if (cy > 0) seedOutPx(cur - p.w);
    if (cy + 1 < p.h) seedOutPx(cur + p.w);
  }

  // 아파트 전체 외곽 바운딩 박스 계산 (thick 벽체 기준)
  let aptMinX = p.w;
  let aptMaxX = 0;
  let aptMinY = p.h;
  let aptMaxY = 0;
  for (let y = 0; y < p.h; y++) {
    for (let x = 0; x < p.w; x++) {
      if (p.thick[y * p.w + x]) {
        if (x < aptMinX) aptMinX = x;
        if (x > aptMaxX) aptMaxX = x;
        if (y < aptMinY) aptMinY = y;
        if (y > aptMaxY) aptMaxY = y;
      }
    }
  }

  // 1차: 유채색 공간(거실/주방, 안방/침실, 욕실) 시딩 — 먼저 모든 후보를 모은 뒤 면적 기준으로 거실/안방/침실/발코니 정확히 분류
  for (let y = step; y < p.h - step; y += step) {
    for (let x = step; x < p.w - step; x += step) {
      const idx = y * p.w + x;
      if (p.dark[idx] || p.thick[idx] || taken[idx] || outside[idx]) continue;
      const r = p.data[idx * 4];
      const b = p.data[idx * 4 + 2];
      const l = p.luma[idx];
      const isWarm = r - b > 16 && l > 110 && l < 244;
      const isBath = b - r > 4 && l > 165 && l < 248;
      if (!isWarm && !isBath) continue;

      const res = floodFillRoom(p, x, y, taken);
      if (typeof res === 'string') continue;
      if (res.area < 850) continue;
      const poly = maskToPolygon(res, cell);
      if (poly.length < 4) continue;
      const gInfo = guessRoom(res.color, rooms);
      rooms.push({
        id: `r-${Date.now()}-${rooms.length}`,
        name: gInfo.name,
        type: gInfo.type,
        poly,
        mask: res,
        autoNamed: true,
      });
      taken = buildRoomIndex(p.w, p.h, rooms);
    }
  }

  // 2차: 아파트 벽체 내부에 닫혀 있는 무채색 공간(현관, 팬트리, 드레스룸, 발코니, 다용도실) 시딩
  for (let y = Math.max(step, aptMinY + 8); y < Math.min(p.h - step, aptMaxY - 8); y += step) {
    for (let x = Math.max(step, aptMinX + 8); x < Math.min(p.w - step, aptMaxX - 8); x += step) {
      const idx = y * p.w + x;
      if (p.dark[idx] || p.thick[idx] || taken[idx] || outside[idx]) continue;
      let wallsAround = 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
        for (let k = 4; k < Math.max(p.w, p.h) * 0.35; k += 3) {
          const nx = x + dx * k;
          const ny = y + dy * k;
          if (nx < 0 || ny < 0 || nx >= p.w || ny >= p.h) break;
          if (p.thick[ny * p.w + nx]) {
            wallsAround++;
            break;
          }
        }
      }
      if (wallsAround < 4) continue;

      const res = floodFillRoom(p, x, y, taken);
      if (typeof res === 'string') continue;
      if (res.area < 900 || res.area > p.w * p.h * 0.14) continue;
      const poly = maskToPolygon(res, cell);
      if (poly.length < 4) continue;

      rooms.push({
        id: `r-${Date.now()}-${rooms.length}`,
        name: '발코니',
        type: 'balcony',
        poly,
        mask: res,
        autoNamed: true,
      });
      taken = buildRoomIndex(p.w, p.h, rooms);
    }
  }

  // 3차: 전체 방 목록을 면적/색상/외곽 인접 여부에 따라 정확하게 재분류 (스캔 순서 오류 제거)
  const touchesExterior = (r: WRoom) => {
    const pad = 22;
    const x1 = Math.max(0, r.mask.x0 - pad);
    const y1 = Math.max(0, r.mask.y0 - pad);
    const x2 = Math.min(p.w - 1, r.mask.x0 + r.mask.w + pad);
    const y2 = Math.min(p.h - 1, r.mask.y0 + r.mask.h + pad);
    for (let yy = y1; yy <= y2; yy += 4) {
      if (outside[yy * p.w + x1] || outside[yy * p.w + x2]) return true;
    }
    for (let xx = x1; xx <= x2; xx += 4) {
      if (outside[y1 * p.w + xx] || outside[y2 * p.w + xx]) return true;
    }
    return false;
  };

  // 3-1) 유채색 따뜻한 방 재분류: 최대 면적 = 거실/주방, 좁고 밝은 외벽 인접 = 발코니, 나머지 큰 방 = 안방/침실2/침실3
  const warmRooms = rooms
    .filter((r) => {
      const [rr, , bb] = r.mask.color;
      const ll = 0.299 * r.mask.color[0] + 0.587 * r.mask.color[1] + 0.114 * r.mask.color[2];
      return rr - bb >= 14 && !(bb - rr > 4 && ll > 165);
    })
    .sort((a, b) => b.mask.area - a.mask.area);

  let livingSet = false;
  const bedList: WRoom[] = [];
  for (const wr of warmRooms) {
    const [rr, gg, bb] = wr.mask.color;
    const ll = 0.299 * rr + 0.587 * gg + 0.114 * bb;
    const aspect = Math.max(wr.mask.w, wr.mask.h) / Math.max(1, Math.min(wr.mask.w, wr.mask.h));
    if (!livingSet && rr - bb >= 45) {
      wr.type = 'living';
      wr.name = '거실/주방';
      livingSet = true;
    } else if (ll > 206 && rr - bb < 34 && aspect >= 1.85 && touchesExterior(wr)) {
      wr.type = 'balcony';
      wr.name = '발코니';
    } else if (wr.mask.area < 2400 && rr - bb < 36) {
      wr.type = 'dress';
      wr.name = '드레스룸';
    } else {
      bedList.push(wr);
    }
  }
  bedList.forEach((b, i) => {
    if (i === 0) {
      b.type = 'master';
      b.name = '침실1 (안방)';
    } else {
      b.type = 'bedroom';
      b.name = `침실${i + 1}`;
    }
  });

  // 3-2) 무채색 방(발코니/현관/팬트리/드레스룸/다용도실) 정밀 분류
  const neutralRooms = rooms
    .filter((r) => {
      const [rr, , bb] = r.mask.color;
      return rr - bb < 14 && !(bb - rr > 4);
    })
    .sort((a, b) => a.mask.y0 - b.mask.y0);

  let entDone = false;
  for (const nr of neutralRooms) {
    const ext = touchesExterior(nr);
    if (!ext) {
      nr.type = 'alpha';
      nr.name = '팬트리';
    } else if (!entDone && nr.mask.y0 < aptMinY + (aptMaxY - aptMinY) * 0.45 && nr.mask.area < 5500) {
      nr.type = 'entrance';
      nr.name = '현관';
      entDone = true;
    } else if (nr.mask.y0 + nr.mask.h >= aptMaxY - 24 && nr.mask.x0 > aptMinX + (aptMaxX - aptMinX) * 0.45) {
      nr.type = 'utility';
      nr.name = '다용도실';
    } else if (nr.mask.y0 <= aptMinY + 28 && nr.mask.x0 > aptMinX + (aptMaxX - aptMinX) * 0.35 && nr.mask.x0 + nr.mask.w < aptMaxX - 40) {
      nr.type = 'dress';
      nr.name = '드레스룸';
    } else {
      nr.type = 'balcony';
      nr.name = '발코니';
    }
  }

  // 3-3) 욕실 분류: 침실1(안방) 중심에 가까운 욕실 = 부부욕실, 현관/입구 쪽 = 공용욕실
  const masterRoom = rooms.find((r) => r.type === 'master');
  const bathRooms = rooms.filter((r) => r.type === 'bath');
  if (bathRooms.length === 2 && masterRoom) {
    const mc = labelPoint(masterRoom.poly);
    const d0 = Math.hypot(labelPoint(bathRooms[0].poly).x - mc.x, labelPoint(bathRooms[0].poly).y - mc.y);
    const d1 = Math.hypot(labelPoint(bathRooms[1].poly).x - mc.x, labelPoint(bathRooms[1].poly).y - mc.y);
    if (d0 <= d1) {
      bathRooms[0].name = '부부욕실';
      bathRooms[1].name = '공용욕실';
    } else {
      bathRooms[0].name = '공용욕실';
      bathRooms[1].name = '부부욕실';
    }
  }

  return rooms;
}

/* --------------------------- Template build --------------------------- */

const WP = 'wp-lx-diamang-white';
const FL_LIVING = 'fl-dongwha-sahara-wide';
const FL_ROOM = 'fl-kujung-natural-oak';
const FL_TILE = 'fl-porcelain-concrete';
const FM_WHITE = 'fm-hyundai-milkwhite';
const FM_CHAR = 'fm-hyundai-charcoal';

function r2(v: number) {
  return Math.round(v * 100) / 100;
}

function floorFor(t: RoomType): string {
  if (t === 'living' || t === 'kitchen') return FL_LIVING;
  if (t === 'bath' || t === 'balcony' || t === 'entrance' || t === 'utility') return FL_TILE;
  return FL_ROOM;
}

function autoFurniture(rooms: Room[]): { furniture: FurnitureItem[]; lights: LightFixture[] } {
  const furniture: FurnitureItem[] = [];
  const lights: LightFixture[] = [];
  const add = (r: Room, f: FurnitureItem) => {
    if (pointInPoly({ x: f.x, y: f.y }, r.polygon)) furniture.push(f);
  };
  rooms.forEach((r, i) => {
    const xs = r.polygon.map((p) => p.x);
    const ys = r.polygon.map((p) => p.y);
    const bx1 = Math.min(...xs);
    const bx2 = Math.max(...xs);
    const by1 = Math.min(...ys);
    const by2 = Math.max(...ys);
    const rw = bx2 - bx1;
    const rd = by2 - by1;
    const cx = r2((bx1 + bx2) / 2);
    const cy = r2((by1 + by2) / 2);
    const lp = labelPoint(r.polygon);

    if (r.type === 'bath' && rw >= 1.2 && rd >= 1.2) {
      const master = r.name.includes('부부');
      add(r, { id: `f-toi-${i}`, name: '양변기', category: 'toilet', x: r2(bx2 - 0.4), y: r2(by1 + 0.38), width: 0.42, depth: 0.62, height: 0.72, rotation: 0, color: '#FFFFFF' });
      add(r, { id: `f-van-${i}`, name: '세면대', category: 'vanity', x: r2(Math.max(bx1 + 0.35, bx2 - 1.15)), y: r2(by1 + 0.26), width: 0.55, depth: 0.44, height: 0.82, rotation: 0, color: '#FFFFFF' });
      if (!master && Math.max(rw, rd) >= 1.9) {
        if (rw >= rd) {
          add(r, { id: `f-tub-${i}`, name: '욕조', category: 'bathtub', x: r2(bx1 + 0.4), y: cy, width: 0.72, depth: r2(Math.min(1.6, rd - 0.1)), height: 0.55, rotation: 0, color: '#FFFFFF' });
        } else {
          add(r, { id: `f-tub-${i}`, name: '욕조', category: 'bathtub', x: cx, y: r2(by2 - 0.4), width: r2(Math.min(1.6, rw - 0.1)), depth: 0.72, height: 0.55, rotation: 0, color: '#FFFFFF' });
        }
      } else {
        add(r, { id: `f-shw-${i}`, name: '샤워부스', category: 'shower', x: r2(bx1 + 0.48), y: r2(by2 - 0.48), width: 0.86, depth: 0.86, height: 2.0, rotation: 0, color: '#BAE6FD' });
      }
    } else if (r.type === 'master' && rw >= 2.6 && rd >= 2.6) {
      add(r, { id: `f-bed-${i}`, name: '침대', category: 'bed', x: cx, y: r2(by1 + 1.08), width: 1.6, depth: 2.0, height: 0.55, rotation: 0, color: '#C8BFAF' });
      lights.push({ id: `l-${i}`, roomId: r.id, type: 'downlight_3', x: r2(lp.x), y: r2(lp.y), kelvin: '3000K', on: true });
    } else if (r.type === 'living' && rw >= 3 && rd >= 3) {
      lights.push({ id: `l-${i}`, roomId: r.id, type: 'ceiling_fan', x: r2(lp.x), y: r2(lp.y), kelvin: '4000K', on: true });
    } else if (r.type === 'kitchen' && rw >= 2.2 && rd >= 2) {
      add(r, { id: `f-kit-${i}`, name: '주방 상판', category: 'kitchen_counter', x: cx, y: r2(by1 + 0.33), width: r2(Math.min(rw - 0.2, 3.2)), depth: 0.62, height: 0.88, rotation: 0, color: '#F2F0EB' });
      if (rd >= 2.8) {
        add(r, { id: `f-din-${i}`, name: '식탁', category: 'dining', x: cx, y: r2(cy + 0.35), width: 1.4, depth: 0.8, height: 0.74, rotation: 0, color: '#8C6849' });
      }
      lights.push({ id: `l-${i}`, roomId: r.id, type: 'pendant', x: r2(lp.x), y: r2(lp.y), kelvin: '3000K', on: true });
    }
  });
  return { furniture, lights };
}

export function buildTemplate(o: {
  rooms: WRoom[];
  walls: WWall[];
  mPerPx: number;
  name: string;
}): FloorPlanTemplate {
  const m = o.mPerPx;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const acc = (x: number, y: number) => {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  };
  o.rooms.forEach((r) => r.poly.forEach((p) => acc(p.x, p.y)));
  o.walls.forEach((w) => {
    if (w.ori === 'H') {
      acc(w.a1, w.c - w.t / 2);
      acc(w.a2, w.c + w.t / 2);
    } else {
      acc(w.c - w.t / 2, w.a1);
      acc(w.c + w.t / 2, w.a2);
    }
  });
  const X = (x: number) => r2((x - minX) * m);
  const Y = (y: number) => r2((y - minY) * m);

  const rooms: Room[] = o.rooms.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    polygon: r.poly.map((p) => ({ x: X(p.x), y: Y(p.y) })),
    floorMaterialId: floorFor(r.type),
    floorDirection: 'horizontal',
    ceilingType: r.type === 'living' ? 'well_rect' : 'flat',
    ceilingMaterialId: r.type === 'master' ? 'cl-warm-ivory' : 'cl-white-silk',
    indirectLightColor: r.type === 'bath' || r.type === 'master' ? '3000K' : '4000K',
    indirectLightOn: r.type === 'living' || r.type === 'master',
  }));

  const walls: Wall[] = o.walls.map((w) => {
    const len = Math.max(1, w.a2 - w.a1);
    const lenM = len * m;
    const openings: Opening[] = w.openings.map((op) => {
      const widthM = r2(Math.min(op.width * m, lenM));
      const offset = Math.min(0.98, Math.max(0.02, (op.center - w.a1) / len));
      if (op.type === 'window') {
        const large = widthM >= 1.8;
        return {
          id: op.id,
          type: 'window',
          offset,
          width: widthM,
          height: large ? 2.1 : 1.35,
          sillHeight: large ? 0.15 : 0.8,
          frameMaterialId: large ? FM_CHAR : FM_WHITE,
        };
      }
      if (op.type === 'sliding_door') {
        return { id: op.id, type: 'sliding_door', offset, width: widthM, height: 2.1, sillHeight: 0, frameMaterialId: FM_WHITE };
      }
      return {
        id: op.id,
        type: op.type,
        offset,
        width: widthM,
        height: 2.1,
        sillHeight: 0,
        frameMaterialId: op.type === 'entrance' ? FM_CHAR : FM_WHITE,
        swing: op.swing,
      };
    });
    const base = {
      id: w.id,
      thickness: r2(Math.min(0.35, Math.max(0.1, w.t * m))),
      height: 2.4,
      isLoadBearing: w.exterior,
      demolished: false,
      isExterior: w.exterior,
      frontMaterialId: WP,
      backMaterialId: WP,
      openings,
    };
    return w.ori === 'H'
      ? { ...base, x1: X(w.a1), y1: Y(w.c), x2: X(w.a2), y2: Y(w.c) }
      : { ...base, x1: X(w.c), y1: Y(w.a1), x2: X(w.c), y2: Y(w.a2) };
  });

  const { furniture, lights } = autoFurniture(rooms);
  const area = r2(
    rooms.filter((r) => r.type !== 'balcony').reduce((s, r) => s + polyArea(r.polygon), 0)
  );

  return {
    id: `wizard-${Date.now()}`,
    complexId: 'custom-naver',
    complexName: o.name,
    district: '네이버 도면 변환',
    region: 'seoul',
    typeName: `${Math.round(area)}㎡`,
    areaSqm: area,
    pyeong: Math.round(area / 3.3058),
    bayInfo: `방 ${rooms.length}개 · 벽 ${walls.length}개`,
    isExtended: true,
    description: '네이버 평면도를 4단계 마법사로 변환한 도면입니다.',
    width: r2((maxX - minX) * m),
    depth: r2((maxY - minY) * m),
    rooms,
    walls,
    lights,
    furniture,
  };
}
