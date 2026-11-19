import React, { useEffect, useRef, useState } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { getMaterialById } from '../data/materials';
import { Room, Wall } from '../types/interior';
import { ZoomIn, ZoomOut, Maximize2, RotateCw } from 'lucide-react';

function pointToSegmentDist(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return { dist: Math.hypot(px - x1, py - y1), t: 0 };
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return { dist: Math.hypot(px - projX, py - projY), t };
}

function pointInPolygon(px: number, py: number, poly: { x: number; y: number }[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x,
      yi = poly[i].y;
    const xj = poly[j].x,
      yj = poly[j].y;
    const intersect =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi + 1e-9) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

function polygonArea(poly: { x: number; y: number }[]) {
  let area = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    area += (poly[j].x + poly[i].x) * (poly[j].y - poly[i].y);
  }
  return Math.abs(area / 2);
}

export const Viewport2D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    plan,
    selection,
    editorTool,
    showFurniture,
    showDimensions,
    underlayImage,
    underlayOpacity,
    selectTarget,
    toggleDemolishWall,
    addWall,
    moveWallEndpoint,
    addOpeningToWall,
    addWallFixture,
    addLightFixture,
    moveFurniture,
    resizeWallLength,
    setUnderlayImage,
    setEditorTool,
  } = useStudioStore();

  const [scale, setScale] = useState(52); // px per meter
  const [pan, setPan] = useState({ x: 60, y: 60 });
  const [rotationDeg, setRotationDeg] = useState<0 | 90 | 180 | 270>(0);
  const [cadTheme, setCadTheme] = useState<'cad_dark' | 'cad_light'>('cad_dark');
  const [editingDim, setEditingDim] = useState<{
    wallId: string;
    valueMm: string;
    screenX: number;
    screenY: number;
  } | null>(null);
  const dimHitboxesRef = useRef<
    Array<{ wallId: string; wx: number; wy: number; lenMm: number }>
  >([]);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [mouseWorld, setMouseWorld] = useState<{ x: number; y: number } | null>(null);
  const [dragState, setDragState] = useState<
    | { kind: 'pan'; startX: number; startY: number; origPan: { x: number; y: number } }
    | { kind: 'wall_end'; wallId: string; end: 'start' | 'end' }
    | { kind: 'furniture'; id: string }
    | null
  >(null);

  const underlayImgObj = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    if (!underlayImage) {
      underlayImgObj.current = null;
      return;
    }
    const img = new Image();
    img.src = underlayImage;
    img.onload = () => {
      underlayImgObj.current = img;
    };
  }, [underlayImage]);

  // Center plan on plan change
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const fitScale = Math.min(
      (rect.width - 80) / plan.width,
      (rect.height - 80) / plan.depth
    );
    const s = Math.max(28, Math.min(72, fitScale));
    setScale(s);
    setPan({
      x: (rect.width - plan.width * s) / 2,
      y: (rect.height - plan.depth * s) / 2,
    });
  }, [plan.id]);

  const screenToWorld = (sx: number, sy: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const px = (sx - rect.left - pan.x) / scale;
    const py = (sy - rect.top - pan.y) / scale;
    if (rotationDeg === 0) return { x: px, y: py };
    const cx = plan.width / 2;
    const cy = plan.depth / 2;
    const rad = (-rotationDeg * Math.PI) / 180;
    const dx = px - cx;
    const dy = py - cy;
    return {
      x: cx + dx * Math.cos(rad) - dy * Math.sin(rad),
      y: cy + dx * Math.sin(rad) + dy * Math.cos(rad),
    };
  };

  // Render 2D CAD Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDarkCad = cadTheme === 'cad_dark';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = isDarkCad ? '#14181F' : '#FBFBFA';
    ctx.fillRect(0, 0, rect.width, rect.height);
    dimHitboxesRef.current = [];

    ctx.save();
    ctx.translate(pan.x, pan.y);
    if (rotationDeg !== 0) {
      const rcx = (plan.width * scale) / 2;
      const rcy = (plan.depth * scale) / 2;
      ctx.translate(rcx, rcy);
      ctx.rotate((rotationDeg * Math.PI) / 180);
      ctx.translate(-rcx, -rcy);
    }

    // 1. Grid
    const gridMinX = -4;
    const gridMaxX = Math.ceil(plan.width) + 4;
    const gridMinY = -4;
    const gridMaxY = Math.ceil(plan.depth) + 4;

    for (let x = gridMinX; x <= gridMaxX; x += 0.5) {
      const isMajor = Math.abs(x % 1) < 0.01;
      ctx.strokeStyle = isDarkCad
        ? isMajor
          ? 'rgba(148, 163, 184, 0.11)'
          : 'rgba(148, 163, 184, 0.04)'
        : isMajor
          ? 'rgba(24, 24, 27, 0.045)'
          : 'rgba(24, 24, 27, 0.018)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x * scale, gridMinY * scale);
      ctx.lineTo(x * scale, gridMaxY * scale);
      ctx.stroke();
    }
    for (let y = gridMinY; y <= gridMaxY; y += 0.5) {
      const isMajor = Math.abs(y % 1) < 0.01;
      ctx.strokeStyle = isDarkCad
        ? isMajor
          ? 'rgba(148, 163, 184, 0.11)'
          : 'rgba(148, 163, 184, 0.04)'
        : isMajor
          ? 'rgba(24, 24, 27, 0.045)'
          : 'rgba(24, 24, 27, 0.018)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(gridMinX * scale, y * scale);
      ctx.lineTo(gridMaxX * scale, y * scale);
      ctx.stroke();
    }

    // Optional Underlay Image for tracing
    if (underlayImgObj.current) {
      ctx.save();
      ctx.globalAlpha = underlayOpacity;
      ctx.drawImage(
        underlayImgObj.current,
        0,
        0,
        plan.width * scale,
        plan.depth * scale
      );
      ctx.restore();
    }

    // 2. Rooms (floor material color + labels + well ceiling indicator)
    plan.rooms.forEach((room) => {
      const floorMat = getMaterialById(room.floorMaterialId);
      const isSelected =
        (selection?.kind === 'room' && selection.id === room.id) ||
        (selection?.kind === 'ceiling' && selection.roomId === room.id);

      ctx.beginPath();
      room.polygon.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x * scale, p.y * scale);
        else ctx.lineTo(p.x * scale, p.y * scale);
      });
      ctx.closePath();

      ctx.fillStyle = floorMat.baseColor;
      ctx.globalAlpha = isDarkCad ? 0.22 : 0.92;
      ctx.fill();
      ctx.globalAlpha = 1;

      // Subtle 2D architectural floor plank / tile seams
      if (
        floorMat.pattern === 'oak_plank' ||
        floorMat.pattern === 'wide_plank' ||
        floorMat.pattern === 'herringbone'
      ) {
        ctx.save();
        ctx.clip();
        const xs = room.polygon.map((p) => p.x);
        const ys = room.polygon.map((p) => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        ctx.strokeStyle = 'rgba(55, 53, 47, 0.065)';
        ctx.lineWidth = 0.8;
        const step = floorMat.pattern === 'wide_plank' ? 0.26 : 0.18;
        if (room.floorDirection === 'vertical') {
          for (let x = minX; x <= maxX; x += step) {
            ctx.beginPath();
            ctx.moveTo(x * scale, minY * scale);
            ctx.lineTo(x * scale, maxY * scale);
            ctx.stroke();
          }
        } else {
          for (let y = minY; y <= maxY; y += step) {
            ctx.beginPath();
            ctx.moveTo(minX * scale, y * scale);
            ctx.lineTo(maxX * scale, y * scale);
            ctx.stroke();
          }
        }
        ctx.restore();
      } else if (
        floorMat.pattern === 'marble_tile' ||
        floorMat.pattern === 'concrete_tile'
      ) {
        ctx.save();
        ctx.clip();
        const xs = room.polygon.map((p) => p.x);
        const ys = room.polygon.map((p) => p.y);
        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.05)';
        ctx.lineWidth = 0.7;
        for (let x = minX; x <= maxX; x += 0.6) {
          ctx.beginPath();
          ctx.moveTo(x * scale, minY * scale);
          ctx.lineTo(x * scale, maxY * scale);
          ctx.stroke();
        }
        for (let y = minY; y <= maxY; y += 0.6) {
          ctx.beginPath();
          ctx.moveTo(minX * scale, y * scale);
          ctx.lineTo(maxX * scale, y * scale);
          ctx.stroke();
        }
        ctx.restore();
      }

      if (isSelected) {
        ctx.strokeStyle = '#2383E2';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // Refined architectural ceiling tray hairline
      if (room.ceilingType !== 'flat') {
        const xs = room.polygon.map((p) => p.x);
        const ys = room.polygon.map((p) => p.y);
        const minX = Math.min(...xs) + 0.55;
        const maxX = Math.max(...xs) - 0.55;
        const minY = Math.min(...ys) + 0.55;
        const maxY = Math.max(...ys) - 0.55;
        if (maxX > minX && maxY > minY) {
          ctx.save();
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = 'rgba(100, 116, 139, 0.28)';
          ctx.lineWidth = 1;
          if (room.ceilingType === 'well_round') {
            ctx.beginPath();
            ctx.roundRect(
              minX * scale,
              minY * scale,
              (maxX - minX) * scale,
              (maxY - minY) * scale,
              18
            );
            ctx.stroke();
          } else {
            ctx.strokeRect(
              minX * scale,
              minY * scale,
              (maxX - minX) * scale,
              (maxY - minY) * scale
            );
          }
          ctx.restore();
        }
      }
    });

    // 3. Furniture & Bathroom/Kitchen Fixtures
    if (showFurniture) {
      plan.furniture.forEach((f) => {
        const isSel = selection?.kind === 'furniture' && selection.id === f.id;
        const wPx = f.width * scale;
        const dPx = f.depth * scale;
        ctx.save();
        ctx.translate(f.x * scale, f.y * scale);
        ctx.rotate(f.rotation);

        if (f.category === 'toilet') {
          // Architectural Toilet symbol (tank + oval bowl)
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = isSel ? '#2383E2' : '#475569';
          ctx.lineWidth = isSel ? 2 : 1.2;
          ctx.fillRect(-wPx / 2, -dPx / 2, wPx, dPx * 0.32);
          ctx.strokeRect(-wPx / 2, -dPx / 2, wPx, dPx * 0.32);
          ctx.beginPath();
          ctx.ellipse(0, dPx * 0.14, wPx * 0.42, dPx * 0.36, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        } else if (f.category === 'vanity') {
          // Architectural Vanity / Sink symbol (counter + basin)
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = isSel ? '#2383E2' : '#475569';
          ctx.lineWidth = isSel ? 2 : 1.2;
          ctx.fillRect(-wPx / 2, -dPx / 2, wPx, dPx);
          ctx.strokeRect(-wPx / 2, -dPx / 2, wPx, dPx);
          ctx.beginPath();
          ctx.ellipse(0, 0, wPx * 0.34, dPx * 0.32, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else if (f.category === 'shower') {
          // Shower booth glass + drain cross
          ctx.fillStyle = 'rgba(186, 230, 253, 0.25)';
          ctx.fillRect(-wPx / 2, -dPx / 2, wPx, dPx);
          ctx.strokeStyle = isSel ? '#2383E2' : '#64748b';
          ctx.lineWidth = 1.2;
          ctx.strokeRect(-wPx / 2, -dPx / 2, wPx, dPx);
          ctx.beginPath();
          ctx.arc(0, 0, Math.min(wPx, dPx) * 0.12, 0, Math.PI * 2);
          ctx.stroke();
        } else if (f.category === 'bathtub') {
          // Architectural Bathtub symbol (outer rim + rounded inner basin + drain)
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = isSel ? '#2383E2' : '#475569';
          ctx.lineWidth = isSel ? 2 : 1.2;
          ctx.fillRect(-wPx / 2, -dPx / 2, wPx, dPx);
          ctx.strokeRect(-wPx / 2, -dPx / 2, wPx, dPx);
          ctx.beginPath();
          ctx.roundRect(-wPx * 0.42, -dPx * 0.38, wPx * 0.84, dPx * 0.76, 6);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(-wPx * 0.26, 0, 2.5, 0, Math.PI * 2);
          ctx.stroke();
        } else {
          // Soft contact shadow under architectural furniture
          ctx.save();
          ctx.fillStyle = 'rgba(15, 23, 42, 0.08)';
          ctx.beginPath();
          ctx.roundRect(-wPx / 2 + 2, -dPx / 2 + 3, wPx, dPx, 4);
          ctx.fill();
          ctx.restore();

          ctx.fillStyle = f.color;
          ctx.strokeStyle = isSel ? '#2383E2' : 'rgba(30, 41, 59, 0.42)';
          ctx.lineWidth = isSel ? 2 : 1;
          ctx.beginPath();
          ctx.roundRect(-wPx / 2, -dPx / 2, wPx, dPx, f.category === 'sofa' || f.category === 'dining' ? 4 : 2);
          ctx.fill();
          ctx.stroke();

          // Kitchen sink/cooktop detail
          if (f.category === 'kitchen_counter' && wPx > 30) {
            ctx.strokeStyle = 'rgba(51, 65, 85, 0.48)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.roundRect(-wPx * 0.36, -dPx * 0.3, wPx * 0.24, dPx * 0.6, 3);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(wPx * 0.2, -dPx * 0.14, 3.2, 0, Math.PI * 2);
            ctx.arc(wPx * 0.32, -dPx * 0.14, 3.2, 0, Math.PI * 2);
            ctx.arc(wPx * 0.26, dPx * 0.12, 3.6, 0, Math.PI * 2);
            ctx.stroke();
          }

          // Architectural Sofa cushions & backrest
          if (f.category === 'sofa') {
            ctx.strokeStyle = 'rgba(51, 65, 85, 0.32)';
            ctx.lineWidth = 0.9;
            if (wPx >= dPx) {
              ctx.beginPath();
              ctx.moveTo(-wPx / 2, -dPx * 0.22);
              ctx.lineTo(wPx / 2, -dPx * 0.22);
              ctx.moveTo(0, -dPx * 0.22);
              ctx.lineTo(0, dPx / 2);
              ctx.stroke();
            } else {
              ctx.beginPath();
              ctx.moveTo(-wPx * 0.22, -dPx / 2);
              ctx.lineTo(-wPx * 0.22, dPx / 2);
              ctx.moveTo(-wPx * 0.22, 0);
              ctx.lineTo(wPx / 2, 0);
              ctx.stroke();
            }
          }

          // Dining Table + 4 tucked-in chairs
          if (f.category === 'dining' && wPx > 24) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
            ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
            ctx.lineWidth = 0.9;
            [-0.26, 0.26].forEach((rx) => {
              [-1, 1].forEach((side) => {
                ctx.beginPath();
                ctx.roundRect(wPx * rx - wPx * 0.12, side * (dPx * 0.56) - 3, wPx * 0.24, 6, 2);
                ctx.fill();
                ctx.stroke();
              });
            });
          }

          // Architectural Bed symbol (headboard + two pillows + duvet fold line)
          if (f.category === 'bed' && wPx > 24 && dPx > 24) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
            ctx.strokeStyle = 'rgba(51, 65, 85, 0.38)';
            ctx.lineWidth = 0.9;
            // Headboard bar
            ctx.fillRect(-wPx / 2, -dPx / 2, wPx, dPx * 0.08);
            const pw = wPx * 0.36;
            const ph = dPx * 0.16;
            ctx.beginPath();
            ctx.roundRect(-wPx * 0.42, -dPx * 0.38, pw, ph, 3);
            ctx.roundRect(wPx * 0.06, -dPx * 0.38, pw, ph, 3);
            ctx.fill();
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-wPx / 2, -dPx * 0.12);
            ctx.lineTo(wPx / 2, -dPx * 0.12);
            ctx.stroke();
          }

          if (isSel) {
            ctx.fillStyle = '#0f172a';
            ctx.font = '600 9px "Noto Sans KR", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(f.name, 0, 3);
          }
        }
        ctx.restore();
      });
    }

    // 3b. Room labels (drawn after furniture with subtle white halo so text never collides or gets hidden)
    plan.rooms.forEach((room) => {
      if (!room.name) return;
      const xs = room.polygon.map((p) => p.x);
      const ys = room.polygon.map((p) => p.y);
      const roomW = (Math.max(...xs) - Math.min(...xs)) * scale;
      const cx = (room.polygon.reduce((s, p) => s + p.x, 0) / room.polygon.length) * scale;
      const cy = (room.polygon.reduce((s, p) => s + p.y, 0) / room.polygon.length) * scale;
      ctx.save();
      ctx.translate(cx, cy);
      if (rotationDeg !== 0) {
        ctx.rotate((-rotationDeg * Math.PI) / 180);
      }
      const fontSize = roomW < 72 ? 9.5 : 11;
      ctx.font = `600 ${fontSize}px "Noto Sans KR", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = isDarkCad ? 'rgba(20, 24, 31, 0.88)' : 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 3;
      ctx.strokeText(room.name, 0, 0);
      ctx.fillStyle = isDarkCad ? '#E2E8F0' : '#0f172a';
      ctx.fillText(room.name, 0, 0);
      ctx.restore();
    });

    // 4. Walls & Openings
    plan.walls.forEach((w) => {
      const isSelected = selection?.kind === 'wall' && selection.id === w.id;
      const x1 = w.x1 * scale;
      const y1 = w.y1 * scale;
      const x2 = w.x2 * scale;
      const y2 = w.y2 * scale;
      const thickPx = Math.max(4, w.thickness * scale);

      if (w.demolished) {
        // 확장형 모드에서 기본 확장된 발코니 경계선은 붉은 '철거됨' 배지 대신 깔끔하게 생략
        if (w.id.startsWith('w-bal-')) return;
        ctx.save();
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = isSelected ? '#38bdf8' : '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Demolished badge
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
        ctx.fillRect(mx - 22, my - 9, 44, 18);
        ctx.fillStyle = '#fff';
        ctx.font = '600 9px "Noto Sans KR", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('철거됨', mx, my + 3);
        ctx.restore();
        return;
      }

      // AutoCAD-style double-line wall & core
      ctx.save();
      ctx.lineCap = 'square';
      if (isDarkCad) {
        ctx.strokeStyle = isSelected
          ? '#38BDF8'
          : w.isLoadBearing
            ? '#E2E8F0'
            : '#94A3B8';
        ctx.lineWidth = thickPx;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.strokeStyle = '#1E2530';
        ctx.lineWidth = Math.max(1.5, thickPx - 3);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      } else {
        ctx.strokeStyle = isSelected
          ? '#2383E2'
          : w.isLoadBearing
            ? '#1F2328'
            : '#3F4650';
        ctx.lineWidth = thickPx;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        const wpFront = getMaterialById(w.frontMaterialId);
        ctx.strokeStyle = w.isExterior ? '#F1F5F9' : wpFront.baseColor;
        ctx.lineWidth = Math.max(1.5, thickPx * 0.36);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      // Openings (doors / windows)
      const dx = x2 - x1;
      const dy = y2 - y1;
      const lenPx = Math.hypot(dx, dy);
      const angle = Math.atan2(dy, dx);

      w.openings.forEach((op) => {
        const opSel =
          selection?.kind === 'opening' && selection.openingId === op.id;
        const cx = x1 + dx * op.offset;
        const cy = y1 + dy * op.offset;
        const opW = op.width * scale;
        const frameMat = getMaterialById(op.frameMaterialId);

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        // Cutout background
        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-opW / 2, -thickPx / 2 - 1, opW, thickPx + 2);

        if (op.type === 'window') {
          ctx.fillStyle = '#bae6fd';
          ctx.fillRect(-opW / 2, -thickPx * 0.25, opW, thickPx * 0.5);
          ctx.strokeStyle = opSel ? '#38bdf8' : frameMat.baseColor;
          ctx.lineWidth = 2;
          ctx.strokeRect(-opW / 2, -thickPx * 0.35, opW, thickPx * 0.7);
        } else if (op.type === 'door' || op.type === 'entrance') {
          // Door leaf + swing arc respecting op.swing (including double doors in_double / out_double)
          const swing = op.swing || 'out_left';
          const isDouble = swing === 'in_double' || swing === 'out_double';
          const isRight = swing === 'in_right' || swing === 'out_right';
          const isInward =
            swing === 'in_left' || swing === 'in_right' || swing === 'in_double';
          const dirY = isInward ? 1 : -1;

          if (isDouble) {
            const halfW = opW / 2;
            ctx.strokeStyle = opSel ? '#38bdf8' : frameMat.baseColor;
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(-halfW, 0);
            ctx.lineTo(-halfW, dirY * halfW);
            ctx.moveTo(halfW, 0);
            ctx.lineTo(halfW, dirY * halfW);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(100, 116, 139, 0.55)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            if (!isInward) {
              ctx.arc(-halfW, 0, halfW, -Math.PI / 2, 0);
              ctx.arc(halfW, 0, halfW, Math.PI, -Math.PI / 2);
            } else {
              ctx.arc(-halfW, 0, halfW, 0, Math.PI / 2);
              ctx.arc(halfW, 0, halfW, Math.PI / 2, Math.PI);
            }
            ctx.stroke();
          } else {
            const hingeX = isRight ? opW / 2 : -opW / 2;
            ctx.strokeStyle = opSel ? '#38bdf8' : frameMat.baseColor;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(hingeX, 0);
            ctx.lineTo(hingeX, dirY * opW);
            ctx.stroke();

            ctx.strokeStyle = 'rgba(100, 116, 139, 0.55)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            if (!isRight && !isInward) {
              ctx.arc(hingeX, 0, opW, -Math.PI / 2, 0);
            } else if (isRight && !isInward) {
              ctx.arc(hingeX, 0, opW, Math.PI, -Math.PI / 2);
            } else if (!isRight && isInward) {
              ctx.arc(hingeX, 0, opW, 0, Math.PI / 2);
            } else {
              ctx.arc(hingeX, 0, opW, Math.PI / 2, Math.PI);
            }
            ctx.stroke();
          }
        } else if (op.type === 'sliding_door') {
          ctx.strokeStyle = opSel ? '#38bdf8' : frameMat.baseColor;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(-opW / 2, -2);
          ctx.lineTo(0, -2);
          ctx.moveTo(0, 2);
          ctx.lineTo(opW / 2, 2);
          ctx.stroke();
        }
        ctx.restore();
      });

      // Architectural CAD Dimension Line (mm, clickable to edit!)
      if (showDimensions && (w.isExterior || isSelected) && lenPx > 32) {
        const mx = (x1 + x2) / 2;
        const my = (y1 + y2) / 2;
        const lenM = Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
        const lenMm = Math.round(lenM * 1000);
        const ux = (x2 - x1) / (lenPx || 1);
        const uy = (y2 - y1) / (lenPx || 1);
        let nx = -uy;
        let ny = ux;
        const cxPlan = (plan.width / 2) * scale;
        const cyPlan = (plan.depth / 2) * scale;
        if ((mx - cxPlan) * nx + (my - cyPlan) * ny < 0) {
          nx = -nx;
          ny = -ny;
        }
        const offsetPx = isSelected ? 22 : 24;
        const dx1 = x1 + nx * offsetPx;
        const dy1 = y1 + ny * offsetPx;
        const dx2 = x2 + nx * offsetPx;
        const dy2 = y2 + ny * offsetPx;
        const lx = mx + nx * (offsetPx + 10);
        const ly = my + ny * (offsetPx + 10);

        dimHitboxesRef.current.push({
          wallId: w.id,
          wx: lx / scale,
          wy: ly / scale,
          lenMm,
        });

        ctx.save();
        ctx.strokeStyle = isSelected
          ? '#38BDF8'
          : isDarkCad
            ? 'rgba(56, 189, 248, 0.55)'
            : 'rgba(100, 116, 139, 0.55)';
        ctx.lineWidth = 0.9;
        // Extension lines + dimension line
        ctx.beginPath();
        ctx.moveTo(x1 + nx * 6, y1 + ny * 6);
        ctx.lineTo(x1 + nx * (offsetPx + 5), y1 + ny * (offsetPx + 5));
        ctx.moveTo(x2 + nx * 6, y2 + ny * 6);
        ctx.lineTo(x2 + nx * (offsetPx + 5), y2 + ny * (offsetPx + 5));
        ctx.moveTo(dx1, dy1);
        ctx.lineTo(dx2, dy2);
        // 45-degree architectural tick marks
        const tick = 4;
        ctx.moveTo(dx1 - (ux + nx) * tick, dy1 - (uy + ny) * tick);
        ctx.lineTo(dx1 + (ux + nx) * tick, dy1 + (uy + ny) * tick);
        ctx.moveTo(dx2 - (ux + nx) * tick, dy2 - (uy + ny) * tick);
        ctx.lineTo(dx2 + (ux + nx) * tick, dy2 + (uy + ny) * tick);
        ctx.stroke();

        ctx.fillStyle = isSelected
          ? '#38BDF8'
          : isDarkCad
            ? '#7DD3FC'
            : '#334155';
        ctx.font = '600 9.5px "JetBrains Mono", "Inter", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(lenMm.toLocaleString(), lx, ly);
        ctx.restore();
      }

      // Endpoint handles for selected non-exterior walls
      if (isSelected && !w.isExterior) {
        [
          { x: x1, y: y1 },
          { x: x2, y: y2 },
        ].forEach((pt) => {
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2;
          ctx.stroke();
        });
      }

      ctx.restore();
    });

    // 5. Lights (crisp architectural symbols)
    plan.lights.forEach((lt) => {
      const isSel = selection?.kind === 'light' && selection.id === lt.id;
      const lx = lt.x * scale;
      const ly = lt.y * scale;
      ctx.save();
      ctx.beginPath();
      ctx.arc(lx, ly, lt.type === 'ceiling_fan' ? 7 : 4.5, 0, Math.PI * 2);
      ctx.fillStyle = lt.on
        ? lt.kelvin === '3000K'
          ? 'rgba(245, 158, 11, 0.35)'
          : 'rgba(250, 204, 21, 0.35)'
        : 'rgba(148, 163, 184, 0.25)';
      ctx.fill();
      ctx.strokeStyle = isSel ? '#2383E2' : '#D9730D';
      ctx.lineWidth = isSel ? 2 : 1.25;
      ctx.stroke();
      ctx.restore();
    });

    // 6. Active wall drawing preview
    if (editorTool === 'draw_wall' && drawStart && mouseWorld) {
      ctx.save();
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 6;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(drawStart.x * scale, drawStart.y * scale);
      ctx.lineTo(mouseWorld.x * scale, mouseWorld.y * scale);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }, [
    plan,
    selection,
    scale,
    pan,
    rotationDeg,
    cadTheme,
    showFurniture,
    showDimensions,
    editorTool,
    drawStart,
    mouseWorld,
    underlayImage,
    underlayOpacity,
  ]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const world = screenToWorld(e.clientX, e.clientY);
    const snapX = Math.round(world.x * 10) / 10;
    const snapY = Math.round(world.y * 10) / 10;
    setEditingDim(null);

    // Check clickable dimension labels first (in select mode)
    if (editorTool === 'select' && showDimensions) {
      const hitDim = dimHitboxesRef.current.find(
        (d) => Math.hypot(world.x - d.wx, world.y - d.wy) < 0.42
      );
      if (hitDim) {
        const rect = containerRef.current?.getBoundingClientRect();
        setEditingDim({
          wallId: hitDim.wallId,
          valueMm: String(hitDim.lenMm),
          screenX: rect ? e.clientX - rect.left : 120,
          screenY: rect ? e.clientY - rect.top : 120,
        });
        selectTarget({ kind: 'wall', id: hitDim.wallId });
        return;
      }
    }

    // Middle click or Alt+click -> pan
    if (e.button === 1 || e.button === 2 || e.altKey) {
      setDragState({
        kind: 'pan',
        startX: e.clientX,
        startY: e.clientY,
        origPan: { ...pan },
      });
      return;
    }

    if (editorTool === 'draw_wall') {
      if (!drawStart) {
        setDrawStart({ x: snapX, y: snapY });
      } else {
        addWall(drawStart.x, drawStart.y, snapX, snapY);
        setDrawStart(null);
        setEditorTool('select');
      }
      return;
    }

    if (editorTool === 'add_light') {
      const room = plan.rooms.find((r) => pointInPolygon(world.x, world.y, r.polygon));
      addLightFixture(room?.id || plan.rooms[0].id, 'downlight_3', snapX, snapY);
      setEditorTool('select');
      return;
    }

    // Check selected wall endpoint drag
    if (selection?.kind === 'wall') {
      const selWall = plan.walls.find((w) => w.id === selection.id);
      if (selWall && !selWall.isExterior) {
        if (Math.hypot(world.x - selWall.x1, world.y - selWall.y1) < 0.35) {
          setDragState({ kind: 'wall_end', wallId: selWall.id, end: 'start' });
          return;
        }
        if (Math.hypot(world.x - selWall.x2, world.y - selWall.y2) < 0.35) {
          setDragState({ kind: 'wall_end', wallId: selWall.id, end: 'end' });
          return;
        }
      }
    }

    // Check Lights
    for (const lt of plan.lights) {
      if (Math.hypot(world.x - lt.x, world.y - lt.y) < 0.35) {
        selectTarget({ kind: 'light', id: lt.id });
        return;
      }
    }

    // Check Walls (including demolished)
    let hitWall: { wall: Wall; t: number; dist: number } | null = null;
    for (const w of plan.walls) {
      const { dist, t } = pointToSegmentDist(world.x, world.y, w.x1, w.y1, w.x2, w.y2);
      if (dist < Math.max(0.22, w.thickness)) {
        if (!hitWall || dist < hitWall.dist) {
          hitWall = { wall: w, t, dist };
        }
      }
    }

    if (hitWall) {
      if (editorTool === 'demolish') {
        toggleDemolishWall(hitWall.wall.id);
        return;
      }
      if (editorTool === 'add_door') {
        addOpeningToWall(hitWall.wall.id, 'door', hitWall.t);
        setEditorTool('select');
        return;
      }
      if (editorTool === 'add_window') {
        addOpeningToWall(hitWall.wall.id, 'window', hitWall.t);
        setEditorTool('select');
        return;
      }
      if (editorTool === 'add_outlet') {
        addWallFixture(hitWall.wall.id, 'outlet_2', hitWall.t);
        setEditorTool('select');
        return;
      }
      // Check if clicked near an opening
      for (const op of hitWall.wall.openings) {
        const wallLen = Math.hypot(
          hitWall.wall.x2 - hitWall.wall.x1,
          hitWall.wall.y2 - hitWall.wall.y1
        );
        const halfNorm = (op.width / 2) / (wallLen || 1);
        if (Math.abs(hitWall.t - op.offset) <= halfNorm) {
          selectTarget({
            kind: 'opening',
            wallId: hitWall.wall.id,
            openingId: op.id,
          });
          return;
        }
      }
      selectTarget({ kind: 'wall', id: hitWall.wall.id });
      return;
    }

    // Check Furniture
    if (showFurniture) {
      for (const f of plan.furniture) {
        if (
          Math.abs(world.x - f.x) <= f.width / 2 &&
          Math.abs(world.y - f.y) <= f.depth / 2
        ) {
          selectTarget({ kind: 'furniture', id: f.id });
          setDragState({ kind: 'furniture', id: f.id });
          return;
        }
      }
    }

    // Check Rooms
    const room = plan.rooms.find((r) => pointInPolygon(world.x, world.y, r.polygon));
    if (room) {
      selectTarget({ kind: 'room', id: room.id });
      return;
    }

    // Empty background -> pan
    setDragState({
      kind: 'pan',
      startX: e.clientX,
      startY: e.clientY,
      origPan: { ...pan },
    });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const world = screenToWorld(e.clientX, e.clientY);
    setMouseWorld({
      x: Math.round(world.x * 10) / 10,
      y: Math.round(world.y * 10) / 10,
    });

    if (!dragState) return;
    if (dragState.kind === 'pan') {
      setPan({
        x: dragState.origPan.x + (e.clientX - dragState.startX),
        y: dragState.origPan.y + (e.clientY - dragState.startY),
      });
    } else if (dragState.kind === 'wall_end') {
      moveWallEndpoint(dragState.wallId, dragState.end, world.x, world.y);
    } else if (dragState.kind === 'furniture') {
      moveFurniture(dragState.id, world.x, world.y);
    }
  };

  const handleMouseUp = () => {
    setDragState(null);
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    const delta = e.deltaY < 0 ? 1.1 : 0.9;
    setScale((s) => Math.max(22, Math.min(130, s * delta)));
  };

  const handleUnderlayUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUnderlayImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-[#FBFBFA] overflow-hidden"
    >
      {/* Top-left CAD badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-sm border border-[#E9E9E7] shadow-xs px-3 py-1.5 rounded-lg text-xs">
        <span className="w-2 h-2 rounded-full bg-[#2383E2]" />
        <span className="font-semibold text-[#37352F]">2D CAD 도면</span>
        <span className="text-[#D3D1CB]">|</span>
        <span className="text-[#787774]">
          {editorTool === 'draw_wall'
            ? '시작점과 끝점을 클릭해 가벽 추가'
            : editorTool === 'demolish'
              ? '철거할 비내력벽(회색 벽)을 클릭'
              : '클릭·드래그로 3D와 실시간 동기화'}
        </span>
      </div>

      {/* Inline Dimension (mm) Editor Popover */}
      {editingDim && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const val = Number(editingDim.valueMm);
            if (!Number.isNaN(val) && val >= 300) {
              resizeWallLength(editingDim.wallId, val);
            }
            setEditingDim(null);
          }}
          style={{
            left: Math.max(16, editingDim.screenX - 55),
            top: Math.max(16, editingDim.screenY - 18),
          }}
          className="absolute z-20 flex items-center gap-1 bg-white border border-[#2383E2] rounded-md shadow-lg px-2 py-1"
        >
          <input
            autoFocus
            type="number"
            min={300}
            max={25000}
            step={50}
            value={editingDim.valueMm}
            onChange={(e) =>
              setEditingDim({ ...editingDim, valueMm: e.target.value })
            }
            onKeyDown={(e) => {
              if (e.key === 'Escape') setEditingDim(null);
            }}
            className="w-20 text-xs font-mono font-semibold text-[#0f172a] outline-none"
          />
          <span className="text-[10px] text-[#787774]">mm</span>
          <button
            type="submit"
            className="px-1.5 py-0.5 bg-[#2383E2] text-white text-[10px] font-semibold rounded"
          >
            적용
          </button>
        </form>
      )}

      {/* Bottom-right 2D Controls */}
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1 bg-white/95 backdrop-blur-sm border border-[#E9E9E7] shadow-xs p-1 rounded-lg">
        {underlayImage && (
          <>
            <button
              onClick={() => setUnderlayImage(null)}
              className="px-2 py-1 text-[11px] text-[#787774] hover:text-[#37352F] hover:bg-[#EFEFEE] rounded-md"
            >
              공식 도면 배경 숨김
            </button>
            <div className="w-px h-4 bg-[#E9E9E7] mx-0.5" />
          </>
        )}
        <button
          onClick={() =>
            setCadTheme((t) => (t === 'cad_dark' ? 'cad_light' : 'cad_dark'))
          }
          className={`px-2 py-1 text-xs rounded-md font-medium transition ${
            cadTheme === 'cad_dark'
              ? 'bg-[#14181F] text-[#38BDF8]'
              : 'text-[#37352F] hover:bg-[#EFEFEE]'
          }`}
          title="AutoCAD 다크 / 화이트 CAD 전환"
        >
          {cadTheme === 'cad_dark' ? 'AutoCAD 다크' : '화이트 CAD'}
        </button>
        <div className="w-px h-4 bg-[#E9E9E7] mx-0.5" />
        <button
          onClick={() =>
            setRotationDeg((d) => (((d + 90) % 360) as 0 | 90 | 180 | 270))
          }
          className="px-2 py-1 text-xs text-[#37352F] hover:bg-[#EFEFEE] rounded-md flex items-center gap-1 font-medium transition"
          title="2D 도면 시계방향 90도 회전"
        >
          <RotateCw className="w-3.5 h-3.5 text-[#2383E2]" />
          <span>90° 회전{rotationDeg !== 0 ? ` (${rotationDeg}°)` : ''}</span>
        </button>
        <div className="w-px h-4 bg-[#E9E9E7] mx-0.5" />
        <button
          onClick={() => setScale((s) => Math.min(130, s * 1.15))}
          className="p-1.5 text-[#787774] hover:text-[#37352F] hover:bg-[#EFEFEE] rounded-md"
          title="확대"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setScale((s) => Math.max(22, s * 0.85))}
          className="p-1.5 text-[#787774] hover:text-[#37352F] hover:bg-[#EFEFEE] rounded-md"
          title="축소"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const fitScale = Math.min(
              (rect.width - 80) / plan.width,
              (rect.height - 80) / plan.depth
            );
            setScale(fitScale);
            setPan({
              x: (rect.width - plan.width * fitScale) / 2,
              y: (rect.height - plan.depth * fitScale) / 2,
            });
          }}
          className="p-1.5 text-[#787774] hover:text-[#37352F] hover:bg-[#EFEFEE] rounded-md"
          title="화면 맞춤"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full block cursor-default"
      />
    </div>
  );
};
