import React, { useEffect, useRef, useState } from 'react';
import { useDesignStore } from '../store/useDesignStore';
import { getCatalogItem } from '../data/brandCatalog';
import { ScenePropType, SpaceType } from '../types/design';
import { Ruler } from 'lucide-react';

const PX_PER_M = 60;

function distToSeg(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return { dist: Math.hypot(px - x1, py - y1), t: 0 };
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / l2));
  return { dist: Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy)), t };
}

const SPACE_PRESETS: { type: SpaceType; label: string }[] = [
  { type: 'living', label: '거실' },
  { type: 'kitchen', label: '주방' },
  { type: 'master', label: '안방' },
  { type: 'bedroom', label: '침실' },
  { type: 'bath', label: '욕실' },
  { type: 'entrance', label: '현관' },
  { type: 'hallway', label: '복도' },
  { type: 'dress', label: '드레스룸' },
  { type: 'balcony', label: '발코니' },
];

const PROP_PRESETS: { type: ScenePropType; label: string }[] = [
  { type: 'fridge_4door', label: '4도어 냉장고장' },
  { type: 'tall_homebar', label: '홈바 키큰장' },
  { type: 'island_counter', label: '대면형 아일랜드' },
  { type: 'kitchen_sink', label: '싱크대' },
  { type: 'induction_3', label: '3구 인덕션' },
  { type: 'dining_set', label: '4인 식탁' },
  { type: 'sofa_modular', label: '모듈 소파' },
  { type: 'bed_queen', label: '퀸 침대' },
  { type: 'wall_tv', label: '반매립 TV' },
  { type: 'ceiling_fan', label: '우드 실링팬' },
  { type: 'outlet_2', label: '2구 콘센트' },
  { type: 'switch_2', label: '2구 스위치' },
  { type: 'wallpad', label: '홈 월패드' },
];

export const CadViewport2D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const {
    draftPlan,
    tool,
    selection,
    showDimensions,
    underlayUrl,
    underlayOpacity,
    underlaySize,
    setTool,
    setSelection,
    setUnderlayOpacity,
    setUnderlayAspect,
    calibrateUnderlayScale,
    addSpace,
    addWall,
    moveWallEnd,
    addOpening,
    addProp,
    moveProp,
  } = useDesignStore();

  const [zoom, setZoom] = useState(0.88);
  const [pan, setPan] = useState({ x: 36, y: 48 });
  const [hoverPt, setHoverPt] = useState<{ x: number; y: number } | null>(null);
  const [wallStart, setWallStart] = useState<{ x: number; y: number } | null>(null);
  const [spaceStart, setSpaceStart] = useState<{ x: number; y: number } | null>(null);
  const [pendingSpace, setPendingSpace] = useState<SpaceType>('living');
  const [pendingProp, setPendingProp] = useState<ScenePropType>('fridge_4door');
  const [underlayImg, setUnderlayImg] = useState<HTMLImageElement | null>(null);

  const [calMode, setCalMode] = useState(false);
  const [calA, setCalA] = useState<{ x: number; y: number } | null>(null);
  const [calB, setCalB] = useState<{ x: number; y: number } | null>(null);
  const [calMm, setCalMm] = useState('4500');

  const dragRef = useRef<
    | { kind: 'pan'; sx: number; sy: number; ox: number; oy: number }
    | { kind: 'prop'; id: string }
    | { kind: 'wall_end'; wallId: string; end: 'start' | 'end' }
    | null
  >(null);

  useEffect(() => {
    if (!underlayUrl) {
      setUnderlayImg(null);
      return;
    }
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => {
      setUnderlayImg(im);
      setUnderlayAspect(im.naturalWidth, im.naturalHeight);
    };
    im.src = underlayUrl;
  }, [underlayUrl, setUnderlayAspect]);

  const snapPt = (rx: number, ry: number) => {
    for (const w of draftPlan.walls) {
      if (Math.hypot(rx - w.x1, ry - w.y1) < 0.25) return { x: w.x1, y: w.y1 };
      if (Math.hypot(rx - w.x2, ry - w.y2) < 0.25) return { x: w.x2, y: w.y2 };
    }
    return { x: Math.round(rx * 10) / 10, y: Math.round(ry * 10) / 10 };
  };

  const toWorld = (cx: number, cy: number) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const rx = (cx - rect.left - pan.x) / (PX_PER_M * zoom);
    const ry = (cy - rect.top - pan.y) / (PX_PER_M * zoom);
    const s = snapPt(rx, ry);
    return { x: s.x, y: s.y, rx, ry };
  };

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const parent = c.parentElement!;
    c.width = parent.clientWidth;
    c.height = parent.clientHeight;
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = '#FBFBFA';
    ctx.fillRect(0, 0, c.width, c.height);

    ctx.save();
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // CAD Grid
    const maxW = Math.max(16, underlaySize.w + 4);
    const maxD = Math.max(12, underlaySize.d + 4);
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

    // Tracing Paper Underlay
    if (underlayImg) {
      ctx.save();
      ctx.globalAlpha = underlayOpacity;
      ctx.drawImage(underlayImg, 0, 0, underlaySize.w * PX_PER_M, underlaySize.d * PX_PER_M);
      ctx.restore();
    }

    // Spaces
    draftPlan.spaces.forEach((sp) => {
      const mat = getCatalogItem(sp.floorMaterialId);
      const isSel = selection?.kind === 'space' && selection.id === sp.id;
      ctx.fillStyle = mat.color + (underlayImg ? '88' : 'DD');
      ctx.strokeStyle = isSel ? '#0F7B6C' : '#CBD5E1';
      ctx.lineWidth = (isSel ? 2.5 : 1) / zoom;
      ctx.fillRect(sp.x * PX_PER_M, sp.y * PX_PER_M, sp.width * PX_PER_M, sp.depth * PX_PER_M);
      ctx.strokeRect(sp.x * PX_PER_M, sp.y * PX_PER_M, sp.width * PX_PER_M, sp.depth * PX_PER_M);

      const cx = (sp.x + sp.width / 2) * PX_PER_M;
      const cy = (sp.y + sp.depth / 2) * PX_PER_M;
      const area = sp.width * sp.depth;
      ctx.fillStyle = '#37352F';
      ctx.font = `700 ${12 / Math.sqrt(zoom)}px "Noto Sans KR", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(sp.name, cx, cy - 4 / zoom);
      if (showDimensions) {
        ctx.fillStyle = '#0F7B6C';
        ctx.font = `600 ${10 / Math.sqrt(zoom)}px monospace`;
        ctx.fillText(`${area.toFixed(1)}㎡ (${(area / 3.3058).toFixed(1)}평)`, cx, cy + 10 / zoom);
      }
    });

    // Architectural Double-line CAD Walls
    draftPlan.walls.forEach((w) => {
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
      ctx.fillStyle = isSel ? '#DBEAFE' : w.isExterior ? '#334155' : '#475569';
      ctx.strokeStyle = isSel ? '#2563EB' : '#0F172A';
      ctx.lineWidth = 1.2 / zoom;
      ctx.fillRect(0, -thickPx / 2, lenPx, thickPx);
      ctx.strokeRect(0, -thickPx / 2, lenPx, thickPx);

      if (showDimensions && lenPx > 18) {
        const mm = w.displayMm ?? Math.round(Math.hypot(w.x2 - w.x1, w.y2 - w.y1) * 1000);
        const dimY = -thickPx / 2 - 14 / zoom;
        const tick = 4 / zoom;
        ctx.strokeStyle = isSel ? '#2563EB' : '#64748B';
        ctx.lineWidth = 0.9 / zoom;
        ctx.beginPath();
        ctx.moveTo(0, -thickPx / 2 - 2 / zoom);
        ctx.lineTo(0, dimY - 3 / zoom);
        ctx.moveTo(lenPx, -thickPx / 2 - 2 / zoom);
        ctx.lineTo(lenPx, dimY - 3 / zoom);
        ctx.moveTo(0, dimY);
        ctx.lineTo(lenPx, dimY);
        ctx.moveTo(-tick, dimY + tick);
        ctx.lineTo(tick, dimY - tick);
        ctx.moveTo(lenPx - tick, dimY + tick);
        ctx.lineTo(lenPx + tick, dimY - tick);
        ctx.stroke();

        const txt = `${mm}`;
        ctx.font = `600 ${9.5 / Math.sqrt(zoom)}px monospace`;
        const tw = ctx.measureText(txt).width + 6 / zoom;
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.fillRect(lenPx / 2 - tw / 2, dimY - 6 / zoom, tw, 12 / zoom);
        ctx.fillStyle = isSel ? '#2563EB' : '#1E293B';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(txt, lenPx / 2, dimY);
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

    // CAD Openings (Door Swing Arc / Sliding / Triple Window)
    draftPlan.openings.forEach((op) => {
      const w = draftPlan.walls.find((x) => x.id === op.wallId);
      if (!w) return;
      const isSel = selection?.kind === 'opening' && selection.id === op.id;
      const ox = (w.x1 + (w.x2 - w.x1) * op.offset) * PX_PER_M;
      const oy = (w.y1 + (w.y2 - w.y1) * op.offset) * PX_PER_M;
      const angle = Math.atan2(w.y2 - w.y1, w.x2 - w.x1);
      const thickPx = Math.max(6, w.thickness * PX_PER_M);
      const opW = op.width * PX_PER_M;
      const hw = opW / 2;

      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(angle);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-hw, -thickPx / 2 - 1, opW, thickPx + 2);

      if (op.type === 'window_blind') {
        ctx.strokeStyle = isSel ? '#2563EB' : '#0284C7';
        ctx.lineWidth = 1.2 / zoom;
        ctx.strokeRect(-hw, -thickPx / 2, opW, thickPx);
        ctx.beginPath();
        ctx.moveTo(-hw, 0);
        ctx.lineTo(hw, 0);
        ctx.stroke();
      } else if (op.type === 'sliding_glass') {
        ctx.strokeStyle = isSel ? '#2563EB' : '#D97706';
        ctx.lineWidth = 1.5 / zoom;
        ctx.strokeRect(-hw, -thickPx / 4, opW * 0.55, thickPx / 4);
        ctx.strokeRect(-hw + opW * 0.45, 0, opW * 0.55, thickPx / 4);
      } else {
        ctx.strokeStyle = isSel ? '#2563EB' : '#0F7B6C';
        ctx.lineWidth = 1.8 / zoom;
        ctx.beginPath();
        ctx.moveTo(-hw, 0);
        ctx.lineTo(-hw, -opW);
        ctx.stroke();
        ctx.setLineDash([4 / zoom, 3 / zoom]);
        ctx.lineWidth = 1 / zoom;
        ctx.beginPath();
        ctx.arc(-hw, 0, opW, -Math.PI / 2, 0);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.restore();
    });

    // Props
    draftPlan.props.forEach((pr) => {
      const isSel = selection?.kind === 'prop' && selection.id === pr.id;
      ctx.save();
      ctx.translate(pr.x * PX_PER_M, pr.y * PX_PER_M);
      ctx.rotate(pr.rotation);
      const pw = Math.max(14, pr.width * PX_PER_M);
      const pd = Math.max(12, pr.depth * PX_PER_M);
      const isEl = pr.type === 'outlet_2' || pr.type === 'switch_2' || pr.type === 'wallpad';
      const isLt = pr.type === 'downlight' || pr.type === 'ceiling_fan';

      if (isLt) {
        ctx.fillStyle = pr.powerOn ? '#FEF3C7' : '#E5E7EB';
        ctx.strokeStyle = isSel ? '#2563EB' : '#D97706';
        ctx.lineWidth = 1.6 / zoom;
        ctx.beginPath();
        ctx.arc(0, 0, pr.type === 'ceiling_fan' ? 18 : 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = isEl ? '#E0E7FF' : '#FFFFFF';
        ctx.strokeStyle = isSel ? '#0F7B6C' : isEl ? '#4F46E5' : '#64748B';
        ctx.lineWidth = (isSel ? 2.5 : 1.2) / zoom;
        ctx.fillRect(-pw / 2, -pd / 2, pw, pd);
        ctx.strokeRect(-pw / 2, -pd / 2, pw, pd);
      }
      if (!isLt || pr.type === 'ceiling_fan') {
        ctx.fillStyle = '#37352F';
        ctx.font = `500 ${9 / Math.sqrt(zoom)}px "Noto Sans KR", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(pr.label.slice(0, 8), 0, 3);
      }
      ctx.restore();
    });

    // Previews
    if (tool === 'draw_wall' && wallStart && hoverPt) {
      ctx.strokeStyle = '#0F7B6C';
      ctx.lineWidth = 3;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(wallStart.x * PX_PER_M, wallStart.y * PX_PER_M);
      ctx.lineTo(hoverPt.x * PX_PER_M, hoverPt.y * PX_PER_M);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if (tool === 'add_space' && spaceStart && hoverPt) {
      const rx = Math.min(spaceStart.x, hoverPt.x) * PX_PER_M;
      const ry = Math.min(spaceStart.y, hoverPt.y) * PX_PER_M;
      const rw = Math.abs(hoverPt.x - spaceStart.x) * PX_PER_M;
      const rd = Math.abs(hoverPt.y - spaceStart.y) * PX_PER_M;
      ctx.fillStyle = 'rgba(15,123,108,0.16)';
      ctx.strokeStyle = '#0F7B6C';
      ctx.lineWidth = 2;
      ctx.fillRect(rx, ry, rw, rd);
      ctx.strokeRect(rx, ry, rw, rd);
    }
    if (calMode && calA) {
      const target = calB || hoverPt;
      if (target) {
        ctx.strokeStyle = '#E03E3E';
        ctx.lineWidth = 2 / zoom;
        ctx.beginPath();
        ctx.moveTo(calA.x * PX_PER_M, calA.y * PX_PER_M);
        ctx.lineTo(target.x * PX_PER_M, target.y * PX_PER_M);
        ctx.stroke();
      }
    }

    ctx.restore();
  }, [draftPlan, selection, zoom, pan, showDimensions, underlayImg, underlayOpacity, underlaySize, tool, wallStart, spaceStart, calMode, calA, calB, hoverPt]);

  const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = toWorld(e.clientX, e.clientY);
    if (e.button === 1 || e.button === 2) {
      dragRef.current = { kind: 'pan', sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y };
      return;
    }
    if (calMode) {
      if (!calA || (calA && calB)) {
        setCalA({ x: pt.rx, y: pt.ry });
        setCalB(null);
      } else {
        setCalB({ x: pt.rx, y: pt.ry });
      }
      return;
    }
    if (tool === 'add_space') {
      setSpaceStart({ x: pt.x, y: pt.y });
      return;
    }
    if (tool === 'draw_wall') {
      if (!wallStart) setWallStart({ x: pt.x, y: pt.y });
      else {
        addWall(wallStart.x, wallStart.y, pt.x, pt.y);
        setWallStart(null);
      }
      return;
    }
    if (tool === 'add_light') {
      addProp('downlight', pt.x, pt.y);
      return;
    }
    if (tool === 'add_outlet') {
      addProp('outlet_2', pt.x, pt.y);
      return;
    }
    if (tool === 'add_prop') {
      addProp(pendingProp, pt.x, pt.y);
      setTool('select');
      return;
    }
    if (tool === 'add_door' || tool === 'add_window') {
      for (const w of draftPlan.walls) {
        const { dist, t } = distToSeg(pt.rx, pt.ry, w.x1, w.y1, w.x2, w.y2);
        if (dist < 0.35) {
          addOpening(w.id, tool === 'add_door' ? 'door' : 'window_blind', t);
          setTool('select');
          return;
        }
      }
      return;
    }

    if (selection?.kind === 'wall') {
      const sw = draftPlan.walls.find((w) => w.id === selection.id);
      if (sw) {
        if (Math.hypot(pt.rx - sw.x1, pt.ry - sw.y1) < 0.25) {
          dragRef.current = { kind: 'wall_end', wallId: sw.id, end: 'start' };
          return;
        }
        if (Math.hypot(pt.rx - sw.x2, pt.ry - sw.y2) < 0.25) {
          dragRef.current = { kind: 'wall_end', wallId: sw.id, end: 'end' };
          return;
        }
      }
    }

    for (let i = draftPlan.props.length - 1; i >= 0; i--) {
      const pr = draftPlan.props[i];
      if (Math.abs(pt.rx - pr.x) <= Math.max(0.25, pr.width / 2) && Math.abs(pt.ry - pr.y) <= Math.max(0.25, pr.depth / 2)) {
        setSelection({ kind: 'prop', id: pr.id });
        dragRef.current = { kind: 'prop', id: pr.id };
        return;
      }
    }

    for (const w of draftPlan.walls) {
      const { dist, t } = distToSeg(pt.rx, pt.ry, w.x1, w.y1, w.x2, w.y2);
      if (dist < 0.25) {
        const op = draftPlan.openings.find((o) => o.wallId === w.id && Math.abs(o.offset - t) < 0.12);
        setSelection(op ? { kind: 'opening', id: op.id } : { kind: 'wall', id: w.id });
        return;
      }
    }

    for (const sp of draftPlan.spaces) {
      if (pt.rx >= sp.x && pt.rx <= sp.x + sp.width && pt.ry >= sp.y && pt.ry <= sp.y + sp.depth) {
        setSelection({ kind: 'space', id: sp.id });
        return;
      }
    }

    setSelection(null);
    dragRef.current = { kind: 'pan', sx: e.clientX, sy: e.clientY, ox: pan.x, oy: pan.y };
  };

  const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const pt = toWorld(e.clientX, e.clientY);
    setHoverPt({ x: pt.x, y: pt.y });
    const d = dragRef.current;
    if (!d) return;
    if (d.kind === 'pan') setPan({ x: d.ox + (e.clientX - d.sx), y: d.oy + (e.clientY - d.sy) });
    else if (d.kind === 'prop') moveProp(d.id, pt.x, pt.y);
    else if (d.kind === 'wall_end') moveWallEnd(d.wallId, d.end, pt.x, pt.y);
  };

  const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (tool === 'add_space' && spaceStart) {
      const pt = toWorld(e.clientX, e.clientY);
      const x1 = Math.min(spaceStart.x, pt.x);
      const y1 = Math.min(spaceStart.y, pt.y);
      const w = Math.abs(pt.x - spaceStart.x);
      const d = Math.abs(pt.y - spaceStart.y);
      if (w >= 0.4 && d >= 0.4) {
        const label = SPACE_PRESETS.find((s) => s.type === pendingSpace)?.label || '공간';
        addSpace(label, pendingSpace, x1, y1, w, d);
      }
      setSpaceStart(null);
    }
    dragRef.current = null;
  };

  return (
    <div className="relative w-full h-full bg-[#FBFBFA] overflow-hidden select-none">
      <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-2 bg-white/95 border border-[#E9E9E7] shadow-xs px-3 py-1.5 rounded-lg text-xs">
          <span className="w-2 h-2 rounded-full bg-[#2383E2]" />
          <span className="font-semibold text-[#37352F]">2D CAD 도면 편집</span>
          <span className="text-[#D3D1CB]">|</span>
          <span className="text-[#787774]">수정 후 상단 [3D Update] 클릭 시 반영</span>
        </div>

        {underlayUrl && (
          <div className="pointer-events-auto flex items-center gap-2 bg-white/95 border border-[#E9E9E7] shadow-xs px-2.5 py-1 rounded-lg text-[11px]">
            <span className="text-[#787774] font-medium">밑그림</span>
            <input
              type="range"
              min={15}
              max={100}
              value={Math.round(underlayOpacity * 100)}
              onChange={(e) => setUnderlayOpacity(Number(e.target.value) / 100)}
              className="w-16 accent-[#0F7B6C]"
            />
            <button
              onClick={() => {
                setCalA(null);
                setCalB(null);
                setCalMode((v) => !v);
              }}
              className={`px-2 py-1 rounded font-semibold flex items-center gap-1 ${
                calMode ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-[#F7F7F5] text-[#37352F]'
              }`}
            >
              <Ruler className="w-3 h-3" />
              <span>실측 축척</span>
            </button>
          </div>
        )}
      </div>

      {tool === 'add_space' && (
        <div className="absolute top-14 left-3 z-20 bg-white border border-[#E9E9E7] shadow-md rounded-xl p-2 flex flex-wrap gap-1 max-w-md">
          {SPACE_PRESETS.map((s) => (
            <button
              key={s.type}
              onClick={() => setPendingSpace(s.type)}
              className={`px-2 py-1 rounded text-[11px] font-semibold ${
                pendingSpace === s.type ? 'bg-[#0F7B6C] text-white' : 'bg-[#F7F7F5] text-[#37352F]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {tool === 'add_prop' && (
        <div className="absolute top-14 left-3 z-20 bg-white border border-[#E9E9E7] shadow-md rounded-xl p-2 flex flex-wrap gap-1 max-w-md">
          {PROP_PRESETS.map((p) => (
            <button
              key={p.type}
              onClick={() => setPendingProp(p.type)}
              className={`px-2 py-1 rounded text-[11px] font-semibold ${
                pendingProp === p.type ? 'bg-[#0F7B6C] text-white' : 'bg-[#F7F7F5] text-[#37352F]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {calMode && calA && calB && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-white border border-red-200 shadow-lg rounded-xl px-4 py-2 flex items-center gap-2 text-xs">
          <span className="font-semibold">실제 치수(mm):</span>
          <input
            type="number"
            value={calMm}
            onChange={(e) => setCalMm(e.target.value)}
            className="w-24 px-2 py-1 border border-[#D3D1CB] rounded font-mono"
          />
          <button
            onClick={() => {
              const actual = Number(calMm);
              const measured = Math.hypot(calB.x - calA.x, calB.y - calA.y) * 1000;
              if (actual > 100 && measured > 10) calibrateUnderlayScale(actual / measured);
              setCalA(null);
              setCalB(null);
              setCalMode(false);
            }}
            className="px-3 py-1 rounded bg-[#0F7B6C] text-white font-semibold"
          >
            적용
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onContextMenu={(e) => e.preventDefault()}
        onWheel={(e) => {
          e.preventDefault();
          setZoom((z) => Math.max(0.4, Math.min(2.6, z * (e.deltaY < 0 ? 1.08 : 0.92))));
        }}
        className={`w-full h-full ${calMode || tool !== 'select' ? 'cursor-crosshair' : 'cursor-default'}`}
      />
    </div>
  );
};
