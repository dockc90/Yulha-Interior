import React, { useEffect, useRef, useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { getMaterial } from '../data/catalog';
import { ObjectKind } from '../types/studio';

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

const OBJECT_PALETTE: { kind: ObjectKind; label: string }[] = [
  { kind: 'fridge_4door', label: '4도어 냉장고장' },
  { kind: 'tall_homebar', label: '홈바 키큰장' },
  { kind: 'island_counter', label: '대면형 아일랜드' },
  { kind: 'induction_3', label: '3구 인덕션' },
  { kind: 'dining_set', label: '4인 식탁' },
  { kind: 'sofa_modular', label: '모듈 소파' },
  { kind: 'wall_tv', label: '반매립 TV' },
  { kind: 'ceiling_fan', label: '우드 실링팬' },
  { kind: 'outlet_2', label: '2구 콘센트' },
  { kind: 'switch_2', label: '2구 스위치' },
  { kind: 'wallpad', label: '홈 월패드' },
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
    addWall,
    moveWallEndpoint,
    addOpening,
    addObject,
    moveObject,
  } = useProjectStore();

  const [zoom, setZoom] = useState(0.95);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [hoverPt, setHoverPt] = useState<{ x: number; y: number } | null>(null);
  const [wallStart, setWallStart] = useState<{ x: number; y: number } | null>(null);
  const [pendingFurniture, setPendingFurniture] = useState<ObjectKind>('fridge_4door');
  const [underlayImgEl, setUnderlayImgEl] = useState<HTMLImageElement | null>(null);

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
    img.onload = () => setUnderlayImgEl(img);
    img.src = underlayImage;
  }, [underlayImage]);

  const toWorld = (clientX: number, clientY: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const wx = (clientX - rect.left - pan.x) / (PX_PER_M * zoom);
    const wy = (clientY - rect.top - pan.y) / (PX_PER_M * zoom);
    return {
      x: Math.round(wx * 10) / 10, // 100mm snap
      y: Math.round(wy * 10) / 10,
      rawX: wx,
      rawY: wy,
    };
  };

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

    // Subtle CAD grid (1m & 0.5m)
    const maxW = Math.max(16, project.width + 4);
    const maxD = Math.max(14, project.depth + 4);
    ctx.lineWidth = 1 / zoom;
    for (let x = 0; x <= maxW; x += 0.5) {
      ctx.strokeStyle = x % 1 === 0 ? '#E5E5E0' : '#F0F0EC';
      ctx.beginPath();
      ctx.moveTo(x * PX_PER_M, 0);
      ctx.lineTo(x * PX_PER_M, maxD * PX_PER_M);
      ctx.stroke();
    }
    for (let y = 0; y <= maxD; y += 0.5) {
      ctx.strokeStyle = y % 1 === 0 ? '#E5E5E0' : '#F0F0EC';
      ctx.beginPath();
      ctx.moveTo(0, y * PX_PER_M);
      ctx.lineTo(maxW * PX_PER_M, y * PX_PER_M);
      ctx.stroke();
    }

    // Optional Underlay Floor Plan Image
    if (underlayImgEl) {
      ctx.save();
      ctx.globalAlpha = underlayOpacity;
      ctx.drawImage(underlayImgEl, 0, 0, project.width * PX_PER_M, project.depth * PX_PER_M);
      ctx.restore();
    }

    // Rooms
    project.rooms.forEach((rm) => {
      const mat = getMaterial(rm.floorMaterialId);
      const isSel = selection?.kind === 'room' && selection.id === rm.id;
      ctx.beginPath();
      rm.polygon.forEach((p, i) => {
        if (i === 0) ctx.moveTo(p.x * PX_PER_M, p.y * PX_PER_M);
        else ctx.lineTo(p.x * PX_PER_M, p.y * PX_PER_M);
      });
      ctx.closePath();
      ctx.fillStyle = mat.color + (underlayImgEl ? '99' : 'DD');
      ctx.fill();
      if (isSel) {
        ctx.strokeStyle = '#0F7B6C';
        ctx.lineWidth = 2.5 / zoom;
        ctx.stroke();
      }

      const cx = (rm.polygon.reduce((a, b) => a + b.x, 0) / rm.polygon.length) * PX_PER_M;
      const cy = (rm.polygon.reduce((a, b) => a + b.y, 0) / rm.polygon.length) * PX_PER_M;
      ctx.fillStyle = '#37352F';
      ctx.font = `600 ${12 / Math.sqrt(zoom)}px "Noto Sans KR", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(rm.name, cx, cy);
    });

    // Walls
    project.walls.forEach((w) => {
      const isSel = selection?.kind === 'wall' && selection.id === w.id;
      ctx.strokeStyle = isSel ? '#2383E2' : '#2F2E2B';
      ctx.lineWidth = Math.max(4, w.thickness * PX_PER_M);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(w.x1 * PX_PER_M, w.y1 * PX_PER_M);
      ctx.lineTo(w.x2 * PX_PER_M, w.y2 * PX_PER_M);
      ctx.stroke();

      if (showDimensions) {
        const lenMm = Math.round(Math.hypot(w.x2 - w.x1, w.y2 - w.y1) * 1000);
        const mx = ((w.x1 + w.x2) / 2) * PX_PER_M;
        const my = ((w.y1 + w.y2) / 2) * PX_PER_M - 8;
        ctx.fillStyle = '#787774';
        ctx.font = `500 ${10 / Math.sqrt(zoom)}px monospace`;
        ctx.textAlign = 'center';
        ctx.fillText(`${lenMm}`, mx, my);
      }

      if (isSel) {
        [
          [w.x1, w.y1],
          [w.x2, w.y2],
        ].forEach(([ex, ey]) => {
          ctx.fillStyle = '#2383E2';
          ctx.beginPath();
          ctx.arc(ex * PX_PER_M, ey * PX_PER_M, 5 / zoom, 0, Math.PI * 2);
          ctx.fill();
        });
      }
    });

    // Openings
    project.openings.forEach((op) => {
      const w = project.walls.find((wl) => wl.id === op.wallId);
      if (!w) return;
      const isSel = selection?.kind === 'opening' && selection.id === op.id;
      const ox = (w.x1 + (w.x2 - w.x1) * op.offset) * PX_PER_M;
      const oy = (w.y1 + (w.y2 - w.y1) * op.offset) * PX_PER_M;
      const angle = Math.atan2(w.y2 - w.y1, w.x2 - w.x1);
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(angle);
      ctx.fillStyle =
        op.kind === 'window_blind'
          ? '#DBEAFE'
          : op.kind === 'sliding_glass_door'
          ? '#FEF3C7'
          : '#DCFCE7';
      ctx.strokeStyle = isSel ? '#2383E2' : op.kind === 'window_blind' ? '#2563EB' : '#059669';
      ctx.lineWidth = 2 / zoom;
      const halfW = (op.width * PX_PER_M) / 2;
      ctx.fillRect(-halfW, -5, halfW * 2, 10);
      ctx.strokeRect(-halfW, -5, halfW * 2, 10);
      ctx.restore();
    });

    // Objects (Furniture, Appliances, Outlets, Lights)
    project.objects.forEach((obj) => {
      const isSel = selection?.kind === 'object' && selection.id === obj.id;
      ctx.save();
      ctx.translate(obj.x * PX_PER_M, obj.y * PX_PER_M);
      ctx.rotate(obj.rotation);
      const pw = Math.max(12, obj.width * PX_PER_M);
      const pd = Math.max(10, obj.depth * PX_PER_M);
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

    // Wall drawing preview
    if (toolMode === 'draw_wall' && wallStart && hoverPt) {
      ctx.strokeStyle = '#0F7B6C';
      ctx.lineWidth = 4;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(wallStart.x * PX_PER_M, wallStart.y * PX_PER_M);
      ctx.lineTo(hoverPt.x * PX_PER_M, hoverPt.y * PX_PER_M);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }, [project, selection, zoom, pan, showDimensions, underlayImgEl, underlayOpacity, toolMode, wallStart, hoverPt]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = toWorld(e.clientX, e.clientY);

    if (e.button === 1 || e.button === 2) {
      dragRef.current = { kind: 'pan', sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y };
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

    // Wall-based tools (door / window)
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

    // Select mode: check wall endpoints if selected
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

    // Check objects
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

    // Check openings & walls
    for (const w of project.walls) {
      const { dist, t } = distToSegment(pt.rawX, pt.rawY, w.x1, w.y1, w.x2, w.y2);
      if (dist < 0.25) {
        const hitOp = project.openings.find(
          (o) => o.wallId === w.id && Math.abs(o.offset - t) < 0.12
        );
        if (hitOp) {
          setSelection({ kind: 'opening', id: hitOp.id });
        } else {
          setSelection({ kind: 'wall', id: w.id });
        }
        return;
      }
    }

    // Check rooms
    for (const rm of project.rooms) {
      if (pointInPoly(pt.rawX, pt.rawY, rm.polygon)) {
        setSelection({ kind: 'room', id: rm.id });
        return;
      }
    }

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

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  return (
    <div className="relative w-full h-full bg-[#FBFBFA] overflow-hidden select-none">
      {/* Top-left 2D HUD */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-sm border border-[#E9E9E7] shadow-xs px-3 py-1.5 rounded-lg text-xs">
        <span className="w-2 h-2 rounded-full bg-[#2383E2]" />
        <span className="font-semibold text-[#37352F]">2D CAD 평면 편집</span>
        <span className="text-[#D3D1CB]">|</span>
        <span className="text-[#787774]">
          {toolMode === 'draw_wall'
            ? wallStart
              ? '끝점을 클릭하세요'
              : '벽 시작점을 클릭하세요'
            : toolMode === 'add_furniture'
            ? '배치할 위치를 클릭하세요'
            : '클릭해 선택 · 드래그로 이동'}
        </span>
      </div>

      {/* Furniture / Appliance Quick Picker when add_furniture is active */}
      {toolMode === 'add_furniture' && (
        <div className="absolute top-14 left-3 z-20 bg-white border border-[#E9E9E7] shadow-md rounded-xl p-2 flex flex-wrap gap-1 max-w-sm">
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

      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
        onWheel={(e) => {
          e.preventDefault();
          setZoom((z) => Math.max(0.45, Math.min(2.4, z * (e.deltaY < 0 ? 1.08 : 0.92))));
        }}
        className="w-full h-full cursor-crosshair"
      />
    </div>
  );
};
