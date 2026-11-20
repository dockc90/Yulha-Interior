import React, { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { getMaterial } from '../data/catalog';
import { ObjectKind, RoomKind } from '../types/studio';
import { Ruler, Scissors, Sparkles } from 'lucide-react';

const PX_PER_M = 60;

function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return { dist: Math.hypot(px - x1, py - y1), t: 0 };
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  return { dist: Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy)), t };
}

function pointInPoly(x: number, y: number, poly: { x: number; y: number }[]) {
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

function polygonAreaSqm(poly: { x: number; y: number }[]): number {
  let sum = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

const OBJECT_PALETTE: { kind: ObjectKind; label: string }[] = [
  { kind: 'fridge_4door', label: '4도어 냉장고장' },
  { kind: 'tall_homebar', label: '홈바 키큰장' },
  { kind: 'island_counter', label: '대면형 아일랜드' },
  { kind: 'kitchen_sink', label: '싱크대' },
  { kind: 'induction_3', label: '3구 인덕션' },
  { kind: 'dining_set', label: '4인 식탁' },
  { kind: 'sofa_modular', label: '모듈 소파' },
  { kind: 'bed_queen', label: '퀸 침대' },
  { kind: 'wall_tv', label: '반매립 TV' },
  { kind: 'ceiling_fan', label: '우드 실링팬' },
  { kind: 'outlet_2', label: '2구 콘센트' },
  { kind: 'switch_2', label: '2구 스위치' },
  { kind: 'wallpad', label: '홈 월패드' },
];

const ROOM_PRESETS: { kind: RoomKind; label: string }[] = [
  { kind: 'living', label: '거실' },
  { kind: 'kitchen', label: '주방' },
  { kind: 'master', label: '안방' },
  { kind: 'bedroom', label: '침실' },
  { kind: 'bath', label: '욕실' },
  { kind: 'entrance', label: '현관' },
  { kind: 'hallway', label: '복도' },
  { kind: 'dress', label: '드레스룸' },
  { kind: 'balcony', label: '발코니' },
];

export const Canvas2DEditor: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const {
    project,
    selection,
    toolMode,
    showDimensions,
    underlayImage,
    underlayOpacity,
    setSelection,
    setToolMode,
    setUnderlayOpacity,
    setUnderlayAspectSize,
    applyScaleCalibration,
    convertUnderlayTo2D,
    addRoom,
    addWall,
    moveWallEndpoint,
    addOpening,
    addObject,
    moveObject,
  } = useProjectStore();

  const [zoom, setZoom] = useState(0.82);
  const [pan, setPan] = useState({ x: 36, y: 52 });
  const [hoverPt, setHoverPt] = useState<{ x: number; y: number } | null>(null);
  const [wallStart, setWallStart] = useState<{ x: number; y: number } | null>(null);
  const [roomStart, setRoomStart] = useState<{ x: number; y: number } | null>(null);
  const [pendingRoom, setPendingRoom] = useState<{ kind: RoomKind; label: string }>({
    kind: 'living',
    label: '거실',
  });
  const [pendingFurniture, setPendingFurniture] = useState<ObjectKind>('fridge_4door');
  const [underlayImgEl, setUnderlayImgEl] = useState<HTMLImageElement | null>(null);

  // Scale calibration state
  const [calStart, setCalStart] = useState<{ x: number; y: number } | null>(null);
  const [calEnd, setCalEnd] = useState<{ x: number; y: number } | null>(null);
  const [calMmInput, setCalMmInput] = useState('4500');

  // Crop-to-vectorize region state
  const [cropSelectMode, setCropSelectMode] = useState(false);
  const [cropStart, setCropStart] = useState<{ x: number; y: number } | null>(null);

  const dragRef = useRef<
    | { kind: 'pan'; sx: number; sy: number; ox: number; oy: number }
    | { kind: 'object'; id: string }
    | { kind: 'wall_end'; wallId: string; end: 'start' | 'end' }
    | null
  >(null);

  useEffect(() => {
    if (!underlayImage) {
      setUnderlayImgEl(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setUnderlayImgEl(img);
      setUnderlayAspectSize(img.naturalWidth, img.naturalHeight);
    };
    img.src = underlayImage;
  }, [underlayImage, setUnderlayAspectSize]);

  const snapPoint = (rawX: number, rawY: number) => {
    // Endpoint magnet snap within 0.25m
    for (const w of project.walls) {
      if (Math.hypot(rawX - w.x1, rawY - w.y1) < 0.25) return { x: w.x1, y: w.y1 };
      if (Math.hypot(rawX - w.x2, rawY - w.y2) < 0.25) return { x: w.x2, y: w.y2 };
    }
    return {
      x: Math.round(rawX * 10) / 10,
      y: Math.round(rawY * 10) / 10,
    };
  };

  const toWorld = (clientX: number, clientY: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const rawX = (clientX - rect.left - pan.x) / (PX_PER_M * zoom);
    const rawY = (clientY - rect.top - pan.y) / (PX_PER_M * zoom);
    const snapped = snapPoint(rawX, rawY);
    return { x: snapped.x, y: snapped.y, rawX, rawY };
  };

  const underlayW = project.underlayWidthM || project.width;
  const underlayD = project.underlayDepthM || project.depth;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement!;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    const ctx = canvas.getContext('2d')!;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FBFBFA';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Subtle CAD grid
    const maxW = Math.max(18, underlayW + 4);
    const maxD = Math.max(14, underlayD + 4);
    ctx.lineWidth = 1 / zoom;
    for (let x = 0; x <= maxW; x += 0.5) {
      ctx.strokeStyle = x % 1 === 0 ? '#E5E5E0' : '#F1F1ED';
      ctx.beginPath();
      ctx.moveTo(x * PX_PER_M, 0);
      ctx.lineTo(x * PX_PER_M, maxD * PX_PER_M);
      ctx.stroke();
    }
    for (let y = 0; y <= maxD; y += 0.5) {
      ctx.strokeStyle = y % 1 === 0 ? '#E5E5E0' : '#F1F1ED';
      ctx.beginPath();
      ctx.moveTo(0, y * PX_PER_M);
      ctx.lineTo(maxW * PX_PER_M, y * PX_PER_M);
      ctx.stroke();
    }

    // Underlay Floor Plan Image + Overall Actual Dimension Frame
    if (underlayImgEl) {
      ctx.save();
      ctx.globalAlpha = underlayOpacity;
      ctx.drawImage(underlayImgEl, 0, 0, underlayW * PX_PER_M, underlayD * PX_PER_M);
      ctx.restore();

      if (showDimensions) {
        ctx.strokeStyle = '#0F7B6C88';
        ctx.lineWidth = 1.5 / zoom;
        ctx.setLineDash([6 / zoom, 4 / zoom]);
        ctx.strokeRect(0, 0, underlayW * PX_PER_M, underlayD * PX_PER_M);
        ctx.setLineDash([]);

        ctx.fillStyle = '#0F7B6C';
        ctx.font = `700 ${11 / Math.sqrt(zoom)}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(
          `전체 실측 폭 ${Math.round(underlayW * 1000).toLocaleString()} mm`,
          (underlayW * PX_PER_M) / 2,
          -8 / zoom
        );
      }
    }

    // Rooms (with Area & Actual Dimensions)
    project.rooms.forEach((rm) => {
      const mat = getMaterial(rm.floorMaterialId);
      const isSel = selection?.kind === 'room' && selection.id === rm.id;
      ctx.beginPath();
      rm.polygon.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x * PX_PER_M, p.y * PX_PER_M);
        else ctx.lineTo(p.x * PX_PER_M, p.y * PX_PER_M);
      });
      ctx.closePath();
      ctx.fillStyle = mat.color + (underlayImgEl ? '88' : 'DD');
      ctx.fill();
      ctx.strokeStyle = isSel ? '#0F7B6C' : '#A8A29E';
      ctx.lineWidth = (isSel ? 2.5 : 1) / zoom;
      ctx.stroke();

      const xs = rm.polygon.map((p) => p.x);
      const ys = rm.polygon.map((p) => p.y);
      const cx = ((Math.min(...xs) + Math.max(...xs)) / 2) * PX_PER_M;
      const cy = ((Math.min(...ys) + Math.max(...ys)) / 2) * PX_PER_M;
      const areaSqm = polygonAreaSqm(rm.polygon);
      const py = areaSqm / 3.3058;
      const wMm = Math.round((Math.max(...xs) - Math.min(...xs)) * 1000);
      const dMm = Math.round((Math.max(...ys) - Math.min(...ys)) * 1000);

      ctx.fillStyle = '#37352F';
      ctx.font = `700 ${12 / Math.sqrt(zoom)}px "Noto Sans KR", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(rm.name, cx, cy - 4 / zoom);

      if (showDimensions) {
        ctx.fillStyle = '#0F7B6C';
        ctx.font = `600 ${10 / Math.sqrt(zoom)}px monospace`;
        ctx.fillText(`${areaSqm.toFixed(1)}㎡ (${py.toFixed(1)}평)`, cx, cy + 10 / zoom);
        ctx.fillStyle = '#787774';
        ctx.font = `500 ${9 / Math.sqrt(zoom)}px monospace`;
        ctx.fillText(`${wMm}×${dMm}`, cx, cy + 22 / zoom);
      }
    });

    // Walls (Architectural AutoCAD Double-line Style)
    project.walls.forEach((w) => {
      const isSel = selection?.kind === 'wall' && selection.id === w.id;
      const dx = (w.x2 - w.x1) * PX_PER_M;
      const dy = (w.y2 - w.y1) * PX_PER_M;
      const lenPx = Math.hypot(dx, dy);
      if (lenPx < 1) return;
      const angle = Math.atan2(dy, dx);
      const thickPx = Math.max(6, w.thickness * PX_PER_M);

      ctx.save();
      ctx.translate(w.x1 * PX_PER_M, w.y1 * PX_PER_M);
      ctx.rotate(angle);

      // CAD wall body fill + crisp outline
      ctx.fillStyle = isSel ? '#DBEAFE' : w.isExterior ? '#334155' : '#475569';
      ctx.strokeStyle = isSel ? '#2563EB' : '#0F172A';
      ctx.lineWidth = 1.3 / zoom;
      ctx.fillRect(0, -thickPx / 2, lenPx, thickPx);
      ctx.strokeRect(0, -thickPx / 2, lenPx, thickPx);

      // Architectural CAD Dimension Line (offset above wall)
      if (showDimensions && lenPx > 18) {
        const lenMm = w.displayLengthMm ?? Math.round(Math.hypot(w.x2 - w.x1, w.y2 - w.y1) * 1000);
        const dimY = -thickPx / 2 - 14 / zoom;
        const tick = 4 / zoom;

        ctx.strokeStyle = isSel ? '#2563EB' : '#64748B';
        ctx.lineWidth = 0.9 / zoom;
        // Extension lines
        ctx.beginPath();
        ctx.moveTo(0, -thickPx / 2 - 2 / zoom);
        ctx.lineTo(0, dimY - 3 / zoom);
        ctx.moveTo(lenPx, -thickPx / 2 - 2 / zoom);
        ctx.lineTo(lenPx, dimY - 3 / zoom);
        // Main dimension line
        ctx.moveTo(0, dimY);
        ctx.lineTo(lenPx, dimY);
        // Architectural 45-degree ticks
        ctx.moveTo(-tick, dimY + tick);
        ctx.lineTo(tick, dimY - tick);
        ctx.moveTo(lenPx - tick, dimY + tick);
        ctx.lineTo(lenPx + tick, dimY - tick);
        ctx.stroke();

        // Dimension text pill
        const label = `${lenMm}`;
        ctx.font = `600 ${9.5 / Math.sqrt(zoom)}px monospace`;
        const tw = ctx.measureText(label).width + 6 / zoom;
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.fillRect(lenPx / 2 - tw / 2, dimY - 6 / zoom, tw, 12 / zoom);
        ctx.fillStyle = isSel ? '#2563EB' : '#1E293B';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, lenPx / 2, dimY);
      }
      ctx.restore();

      if (isSel) {
        [
          [w.x1, w.y1],
          [w.x2, w.y2],
        ].forEach(([ex, ey]) => {
          ctx.fillStyle = '#2563EB';
          ctx.beginPath();
          ctx.arc(ex * PX_PER_M, ey * PX_PER_M, 5 / zoom, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    });

    // Openings (CAD Swing Arc / Sliding / Triple Window Symbols)
    project.openings.forEach((op) => {
      const w = project.walls.find((wl) => wl.id === op.wallId);
      if (!w) return;
      const isSel = selection?.kind === 'opening' && selection.id === op.id;
      const ox = (w.x1 + (w.x2 - w.x1) * op.offset) * PX_PER_M;
      const oy = (w.y1 + (w.y2 - w.y1) * op.offset) * PX_PER_M;
      const angle = Math.atan2(w.y2 - w.y1, w.x2 - w.x1);
      const thickPx = Math.max(6, w.thickness * PX_PER_M);
      const opW = op.width * PX_PER_M;
      const halfW = opW / 2;

      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(angle);

      // Clear wall gap cleanly
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-halfW, -thickPx / 2 - 1, opW, thickPx + 2);

      if (op.kind === 'window_blind') {
        ctx.strokeStyle = isSel ? '#2563EB' : '#0284C7';
        ctx.lineWidth = 1.2 / zoom;
        ctx.strokeRect(-halfW, -thickPx / 2, opW, thickPx);
        // Triple CAD glass lines
        ctx.beginPath();
        ctx.moveTo(-halfW, 0);
        ctx.lineTo(halfW, 0);
        ctx.moveTo(-halfW, -thickPx / 4);
        ctx.lineTo(halfW, -thickPx / 4);
        ctx.moveTo(-halfW, thickPx / 4);
        ctx.lineTo(halfW, thickPx / 4);
        ctx.stroke();
      } else if (op.kind === 'sliding_glass_door') {
        ctx.strokeStyle = isSel ? '#2563EB' : '#D97706';
        ctx.lineWidth = 1.6 / zoom;
        ctx.strokeRect(-halfW, -thickPx / 4, opW * 0.55, thickPx / 4);
        ctx.strokeRect(-halfW + opW * 0.45, 0, opW * 0.55, thickPx / 4);
      } else {
        // Architectural Door Leaf + 90-degree Swing Arc
        ctx.strokeStyle = isSel ? '#2563EB' : '#0F7B6C';
        ctx.lineWidth = 1.8 / zoom;
        ctx.beginPath();
        ctx.moveTo(-halfW, 0);
        ctx.lineTo(-halfW, -opW);
        ctx.stroke();

        ctx.setLineDash([4 / zoom, 3 / zoom]);
        ctx.lineWidth = 1 / zoom;
        ctx.beginPath();
        ctx.arc(-halfW, 0, opW, -Math.PI / 2, 0);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    });

    // Objects
    project.objects.forEach((obj) => {
      const isSel = selection?.kind === 'object' && selection.id === obj.id;
      ctx.save();
      ctx.translate(obj.x * PX_PER_M, obj.y * PX_PER_M);
      ctx.rotate(obj.rotation);
      const pw = Math.max(14, obj.width * PX_PER_M);
      const pd = Math.max(12, obj.depth * PX_PER_M);
      const isElectrical =
        obj.kind === 'outlet_2' || obj.kind === 'switch_2' || obj.kind === 'wallpad';
      const isLight = obj.kind === 'downlight' || obj.kind === 'ceiling_fan';

      if (isLight) {
        ctx.fillStyle = obj.on ? '#FEF3C7' : '#E5E7EB';
        ctx.strokeStyle = isSel ? '#2383E2' : '#D97706';
        ctx.lineWidth = 1.8 / zoom;
        ctx.beginPath();
        ctx.arc(0, 0, obj.kind === 'ceiling_fan' ? 18 : 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = isElectrical ? '#E0E7FF' : '#FFFFFF';
        ctx.strokeStyle = isSel ? '#0F7B6C' : isElectrical ? '#4F46E5' : '#787774';
        ctx.lineWidth = (isSel ? 2.5 : 1.3) / zoom;
        ctx.fillRect(-pw / 2, -pd / 2, pw, pd);
        ctx.strokeRect(-pw / 2, -pd / 2, pw, pd);
      }

      if (!isLight || obj.kind === 'ceiling_fan') {
        ctx.fillStyle = '#37352F';
        ctx.font = `500 ${9 / Math.sqrt(zoom)}px "Noto Sans KR", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(obj.name.slice(0, 8), 0, 3);
      }
      ctx.restore();
    });

    // Previews: Draw wall / Add room / Calibrate ruler
    if (toolMode === 'draw_wall' && wallStart && hoverPt) {
      ctx.strokeStyle = '#0F7B6C';
      ctx.lineWidth = 4;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(wallStart.x * PX_PER_M, wallStart.y * PX_PER_M);
      ctx.lineTo(hoverPt.x * PX_PER_M, hoverPt.y * PX_PER_M);
      ctx.stroke();
      ctx.setLineDash([]);
      const mm = Math.round(Math.hypot(hoverPt.x - wallStart.x, hoverPt.y - wallStart.y) * 1000);
      ctx.fillStyle = '#0F7B6C';
      ctx.font = '700 11px monospace';
      ctx.fillText(
        `${mm}mm`,
        ((wallStart.x + hoverPt.x) / 2) * PX_PER_M,
        ((wallStart.y + hoverPt.y) / 2) * PX_PER_M - 8
      );
    }

    if (toolMode === 'add_room' && roomStart && hoverPt) {
      const rx = Math.min(roomStart.x, hoverPt.x) * PX_PER_M;
      const ry = Math.min(roomStart.y, hoverPt.y) * PX_PER_M;
      const rw = Math.abs(hoverPt.x - roomStart.x) * PX_PER_M;
      const rd = Math.abs(hoverPt.y - roomStart.y) * PX_PER_M;
      ctx.fillStyle = 'rgba(15, 123, 108, 0.16)';
      ctx.strokeStyle = '#0F7B6C';
      ctx.lineWidth = 2;
      ctx.fillRect(rx, ry, rw, rd);
      ctx.strokeRect(rx, ry, rw, rd);
    }

    if (toolMode === 'calibrate' && calStart) {
      const target = calEnd || hoverPt;
      if (target) {
        ctx.strokeStyle = '#E03E3E';
        ctx.lineWidth = 2.5 / zoom;
        ctx.beginPath();
        ctx.moveTo(calStart.x * PX_PER_M, calStart.y * PX_PER_M);
        ctx.lineTo(target.x * PX_PER_M, target.y * PX_PER_M);
        ctx.stroke();
        [calStart, target].forEach((p) => {
          ctx.fillStyle = '#E03E3E';
          ctx.beginPath();
          ctx.arc(p.x * PX_PER_M, p.y * PX_PER_M, 5 / zoom, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    }

    if (cropSelectMode && cropStart && hoverPt) {
      const rx = Math.min(cropStart.x, hoverPt.x) * PX_PER_M;
      const ry = Math.min(cropStart.y, hoverPt.y) * PX_PER_M;
      const rw = Math.abs(hoverPt.x - cropStart.x) * PX_PER_M;
      const rd = Math.abs(hoverPt.y - cropStart.y) * PX_PER_M;
      ctx.fillStyle = 'rgba(217, 115, 13, 0.14)';
      ctx.strokeStyle = '#D9730D';
      ctx.lineWidth = 2.5 / zoom;
      ctx.setLineDash([6 / zoom, 4 / zoom]);
      ctx.fillRect(rx, ry, rw, rd);
      ctx.strokeRect(rx, ry, rw, rd);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [
    project,
    selection,
    zoom,
    pan,
    showDimensions,
    underlayImgEl,
    underlayOpacity,
    underlayW,
    underlayD,
    toolMode,
    wallStart,
    roomStart,
    calStart,
    calEnd,
    cropSelectMode,
    cropStart,
    hoverPt,
  ]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = toWorld(e.clientX, e.clientY);

    if (e.button === 1 || e.button === 2) {
      dragRef.current = { kind: 'pan', sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y };
      return;
    }

    if (cropSelectMode) {
      setCropStart({ x: pt.rawX, y: pt.rawY });
      return;
    }

    if (toolMode === 'calibrate') {
      if (!calStart || (calStart && calEnd)) {
        setCalStart({ x: pt.rawX, y: pt.rawY });
        setCalEnd(null);
      } else {
        setCalEnd({ x: pt.rawX, y: pt.rawY });
      }
      return;
    }

    if (toolMode === 'add_room') {
      setRoomStart({ x: pt.x, y: pt.y });
      return;
    }

    if (toolMode === 'draw_wall') {
      if (!wallStart) {
        setWallStart({ x: pt.x, y: pt.y });
      } else {
        addWall(wallStart.x, wallStart.y, pt.x, pt.y);
        setWallStart(null);
      }
      return;
    }

    if (toolMode === 'add_light') {
      addObject('downlight', pt.x, pt.y);
      return;
    }

    if (toolMode === 'add_outlet') {
      addObject('outlet_2', pt.x, pt.y);
      return;
    }

    if (toolMode === 'add_furniture') {
      addObject(pendingFurniture, pt.x, pt.y);
      setToolMode('select');
      return;
    }

    if (toolMode === 'add_door' || toolMode === 'add_window') {
      for (const w of project.walls) {
        const { dist, t } = distToSegment(pt.rawX, pt.rawY, w.x1, w.y1, w.x2, w.y2);
        if (dist < 0.35) {
          addOpening(w.id, toolMode === 'add_door' ? 'door' : 'window_blind', t);
          setToolMode('select');
          return;
        }
      }
      return;
    }

    // Select mode
    if (selection?.kind === 'wall') {
      const sw = project.walls.find((w) => w.id === selection.id);
      if (sw) {
        if (Math.hypot(pt.rawX - sw.x1, pt.rawY - sw.y1) < 0.25) {
          dragRef.current = { kind: 'wall_end', wallId: sw.id, end: 'start' };
          return;
        }
        if (Math.hypot(pt.rawX - sw.x2, pt.rawY - sw.y2) < 0.25) {
          dragRef.current = { kind: 'wall_end', wallId: sw.id, end: 'end' };
          return;
        }
      }
    }

    for (let i = project.objects.length - 1; i >= 0; i--) {
      const obj = project.objects[i];
      const hw = Math.max(0.25, obj.width / 2);
      const hd = Math.max(0.25, obj.depth / 2);
      if (Math.abs(pt.rawX - obj.x) <= hw && Math.abs(pt.rawY - obj.y) <= hd) {
        setSelection({ kind: 'object', id: obj.id });
        dragRef.current = { kind: 'object', id: obj.id };
        return;
      }
    }

    for (const w of project.walls) {
      const { dist, t } = distToSegment(pt.rawX, pt.rawY, w.x1, w.y1, w.x2, w.y2);
      if (dist < 0.25) {
        const hitOp = project.openings.find(
          (o) => o.wallId === w.id && Math.abs(o.offset - t) < 0.12
        );
        if (hitOp) setSelection({ kind: 'opening', id: hitOp.id });
        else setSelection({ kind: 'wall', id: w.id });
        return;
      }
    }

    for (const rm of project.rooms) {
      if (pointInPoly(pt.rawX, pt.rawY, rm.polygon)) {
        setSelection({ kind: 'room', id: rm.id });
        return;
      }
    }

    setSelection(null);
    dragRef.current = { kind: 'pan', sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = toWorld(e.clientX, e.clientY);
    setHoverPt({ x: pt.x, y: pt.y });
    const d = dragRef.current;
    if (!d) return;
    if (d.kind === 'pan') {
      setPan({ x: d.ox + (e.clientX - d.sx), y: d.oy + (e.clientY - d.sy) });
    } else if (d.kind === 'object') {
      moveObject(d.id, pt.x, pt.y);
    } else if (d.kind === 'wall_end') {
      moveWallEndpoint(d.wallId, d.end, pt.x, pt.y);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (cropSelectMode && cropStart) {
      const pt = toWorld(e.clientX, e.clientY);
      const x1 = Math.max(0, Math.min(cropStart.x, pt.rawX) / underlayW);
      const y1 = Math.max(0, Math.min(cropStart.y, pt.rawY) / underlayD);
      const x2 = Math.min(1, Math.max(cropStart.x, pt.rawX) / underlayW);
      const y2 = Math.min(1, Math.max(cropStart.y, pt.rawY) / underlayD);
      if (x2 - x1 > 0.05 && y2 - y1 > 0.05) {
        convertUnderlayTo2D(undefined, { x: x1, y: y1, w: x2 - x1, h: y2 - y1 });
      }
      setCropStart(null);
      setCropSelectMode(false);
    }
    if (toolMode === 'add_room' && roomStart) {
      const pt = toWorld(e.clientX, e.clientY);
      const x1 = Math.min(roomStart.x, pt.x);
      const y1 = Math.min(roomStart.y, pt.y);
      const x2 = Math.max(roomStart.x, pt.x);
      const y2 = Math.max(roomStart.y, pt.y);
      if (x2 - x1 >= 0.4 && y2 - y1 >= 0.4) {
        addRoom(pendingRoom.label, pendingRoom.kind, [
          { x: x1, y: y1 },
          { x: x2, y: y1 },
          { x: x2, y: y2 },
          { x: x1, y: y2 },
        ]);
      }
      setRoomStart(null);
    }
    dragRef.current = null;
  };

  const totalAreaSqm = project.rooms.reduce((acc, r) => acc + polygonAreaSqm(r.polygon), 0);

  return (
    <div className="relative w-full h-full bg-[#FBFBFA] overflow-hidden select-none">
      {/* Top-left 2D HUD + Underlay Quick Controls */}
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 bg-white/95 backdrop-blur-sm border border-[#E9E9E7] shadow-xs px-3 py-1.5 rounded-lg text-xs">
          <span className="w-2 h-2 rounded-full bg-[#2383E2]" />
          <span className="font-semibold text-[#37352F]">2D 평면 편집</span>
          {totalAreaSqm > 0 && (
            <>
              <span className="text-[#D3D1CB]">|</span>
              <span className="font-semibold text-[#0F7B6C]">
                실측 면적 {totalAreaSqm.toFixed(1)}㎡ ({(totalAreaSqm / 3.3058).toFixed(1)}평)
              </span>
            </>
          )}
          <span className="text-[#D3D1CB] hidden sm:inline">|</span>
          <span className="text-[#787774] hidden sm:inline">
            {toolMode === 'select'
              ? '클릭 선택 · Delete 삭제 · 드래그 이동'
              : toolMode === 'add_room'
              ? '방 영역을 사각형으로 드래그하세요'
              : toolMode === 'draw_wall'
              ? wallStart
                ? '벽 끝점을 클릭하세요'
                : '벽 시작점을 클릭하세요'
              : toolMode === 'calibrate'
              ? '기준 길이의 시작점과 끝점 2곳을 클릭하세요'
              : '도면 위 원하는 위치를 클릭하세요'}
          </span>
        </div>

        {underlayImage && (
          <div className="pointer-events-auto flex flex-wrap items-center gap-1.5 bg-white/95 backdrop-blur-sm border border-[#E9E9E7] shadow-xs px-2.5 py-1 rounded-lg text-[11px]">
            <span className="text-[#787774] font-medium">밑그림</span>
            <input
              type="range"
              min={15}
              max={100}
              value={Math.round(underlayOpacity * 100)}
              onChange={(e) => setUnderlayOpacity(Number(e.target.value) / 100)}
              className="w-14 accent-[#0F7B6C]"
            />
            <button
              onClick={() => convertUnderlayTo2D()}
              className="px-2 py-1 rounded bg-[#0F7B6C] hover:bg-[#0c6357] text-white font-semibold flex items-center gap-1"
              title="현재 밑그림 전체를 2D 벽·방·창문으로 자동 변환"
            >
              <Sparkles className="w-3 h-3" />
              <span>자동 변환</span>
            </button>
            <button
              onClick={() => {
                setCropStart(null);
                setCropSelectMode((v) => !v);
              }}
              className={`px-2 py-1 rounded font-semibold flex items-center gap-1 transition ${
                cropSelectMode
                  ? 'bg-amber-100 text-amber-800 border border-amber-300'
                  : 'bg-[#F7F7F5] hover:bg-[#EFEFED] text-[#37352F]'
              }`}
              title="이미지에 여러 도면이 있을 때 원하는 도면 영역만 드래그해 잘라서 2D로 변환"
            >
              <Scissors className="w-3 h-3" />
              <span>{cropSelectMode ? '드래그로 영역 선택 중' : '영역 잘라 변환'}</span>
            </button>
            <button
              onClick={() => {
                setCalStart(null);
                setCalEnd(null);
                setCropSelectMode(false);
                setToolMode(toolMode === 'calibrate' ? 'select' : 'calibrate');
              }}
              className={`px-2 py-1 rounded font-semibold flex items-center gap-1 transition ${
                toolMode === 'calibrate'
                  ? 'bg-red-50 text-red-600 border border-red-200'
                  : 'bg-[#F7F7F5] hover:bg-[#EFEFED] text-[#37352F]'
              }`}
              title="도면 위 실제 치수 두 점을 찍어 밑그림 실측 스케일 맞추기"
            >
              <Ruler className="w-3 h-3" />
              <span>실측 축척</span>
            </button>
          </div>
        )}
      </div>

      {/* Room Picker when add_room is active */}
      {toolMode === 'add_room' && (
        <div className="absolute top-14 left-3 z-20 bg-white border border-[#E9E9E7] shadow-md rounded-xl p-2 flex flex-wrap gap-1 max-w-md">
          {ROOM_PRESETS.map((rp) => (
            <button
              key={rp.kind}
              onClick={() => setPendingRoom({ kind: rp.kind, label: rp.label })}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                pendingRoom.kind === rp.kind
                  ? 'bg-[#0F7B6C] text-white'
                  : 'bg-[#F7F7F5] text-[#37352F] hover:bg-[#EFEFED]'
              }`}
            >
              {rp.label}
            </button>
          ))}
        </div>
      )}

      {/* Furniture Picker when add_furniture is active */}
      {toolMode === 'add_furniture' && (
        <div className="absolute top-14 left-3 z-20 bg-white border border-[#E9E9E7] shadow-md rounded-xl p-2 flex flex-wrap gap-1 max-w-md">
          {OBJECT_PALETTE.map((item) => (
            <button
              key={item.kind}
              onClick={() => setPendingFurniture(item.kind)}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition ${
                pendingFurniture === item.kind
                  ? 'bg-[#0F7B6C] text-white'
                  : 'bg-[#F7F7F5] text-[#37352F] hover:bg-[#EFEFED]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* Scale Calibration Input Bar */}
      {toolMode === 'calibrate' && calStart && calEnd && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-white border border-red-200 shadow-lg rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs">
          <span className="font-semibold text-[#37352F]">실제 치수(mm):</span>
          <input
            type="number"
            value={calMmInput}
            onChange={(e) => setCalMmInput(e.target.value)}
            className="w-24 px-2 py-1 border border-[#D3D1CB] rounded text-xs font-mono"
            autoFocus
          />
          <button
            onClick={() => {
              const actualMm = Number(calMmInput);
              const measuredMm = Math.hypot(calEnd.x - calStart.x, calEnd.y - calStart.y) * 1000;
              if (actualMm > 100 && measuredMm > 10) {
                applyScaleCalibration(actualMm / measuredMm);
              }
              setCalStart(null);
              setCalEnd(null);
              setToolMode('select');
            }}
            className="px-3 py-1 rounded bg-[#0F7B6C] text-white font-semibold"
          >
            축척 적용
          </button>
          <button
            onClick={() => {
              setCalStart(null);
              setCalEnd(null);
            }}
            className="px-2 py-1 rounded bg-[#F7F7F5] text-[#787774]"
          >
            다시 찍기
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        onWheel={(e) => {
          e.preventDefault();
          setZoom((z) => Math.max(0.4, Math.min(2.6, z * (e.deltaY < 0 ? 1.08 : 0.92))));
        }}
        className={`w-full h-full ${
          cropSelectMode || toolMode !== 'select' ? 'cursor-crosshair' : 'cursor-default'
        }`}
      />
    </div>
  );
};
