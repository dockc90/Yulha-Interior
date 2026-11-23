import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Maximize2, Crosshair, RotateCw, Trash2 } from 'lucide-react';
import { usePlannerStore } from '../store/usePlannerStore';
import { distPointToSeg, pointInPolygon, projectBounds } from '../engine/cadGraph';
import { getMat } from '../data/materialsDb';
import { FloorProject, SceneItem } from '../types/planner';

interface Camera2D {
  x: number;
  y: number;
  zoom: number;
}

type DragState =
  | { kind: 'none' }
  | { kind: 'pan'; startClientX: number; startClientY: number; startCamX: number; startCamY: number }
  | { kind: 'node'; nodeId: string; snapshot: FloorProject }
  | { kind: 'item'; itemId: string; offsetX: number; offsetY: number; snapshot: FloorProject }
  | { kind: 'wall_draw'; startX: number; startY: number; curX: number; curY: number }
  | { kind: 'room_box'; startX: number; startY: number; curX: number; curY: number };

const SNAP_GRID_M = 0.05;

function drawItemSymbol2D(
  ctx: CanvasRenderingContext2D,
  item: SceneItem,
  isSel: boolean,
  isHovered: boolean,
  zoom: number,
) {
  const hw = item.width / 2;
  const hd = item.depth / 2;
  const lw = (isSel ? 2.2 : 1.1) / zoom;

  ctx.save();
  ctx.translate(item.x, item.y);
  ctx.rotate(item.rotation);

  ctx.strokeStyle = isSel ? '#2563EB' : isHovered ? '#0F172A' : '#475569';
  ctx.lineWidth = lw;

  if (item.kind === 'downlight') {
    ctx.beginPath();
    ctx.arc(0, 0, 0.06, 0, Math.PI * 2);
    ctx.fillStyle = '#FEF3C7';
    ctx.fill();
    ctx.stroke();
  } else if (item.kind === 'ceiling_fan') {
    ctx.strokeStyle = isSel ? '#2563EB' : 'rgba(71, 85, 105, 0.55)';
    ctx.beginPath();
    ctx.arc(0, 0, 0.09, 0, Math.PI * 2);
    ctx.fillStyle = '#F8FAFC';
    ctx.fill();
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI * 2) / 3);
      ctx.beginPath();
      ctx.ellipse(hw * 0.52, 0, hw * 0.42, 0.075, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(226, 232, 240, 0.45)';
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
  } else if (item.kind === 'rug_round') {
    ctx.beginPath();
    ctx.arc(0, 0, hw, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(241, 245, 249, 0.65)';
    ctx.fill();
    ctx.setLineDash([4 / zoom, 4 / zoom]);
    ctx.strokeStyle = isSel ? '#2563EB' : '#94A3B8';
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (item.kind === 'induction_3') {
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(-hw, -hd, item.width, item.depth);
    ctx.strokeRect(-hw, -hd, item.width, item.depth);
    ctx.strokeStyle = '#94A3B8';
    [
      [-hw * 0.42, -hd * 0.25, 0.08],
      [-hw * 0.42, hd * 0.35, 0.065],
      [hw * 0.35, 0, 0.105],
    ].forEach(([bx, by, r]) => {
      ctx.beginPath();
      ctx.arc(bx, by, r, 0, Math.PI * 2);
      ctx.stroke();
    });
  } else if (item.kind === 'outlet_2' || item.kind === 'switch_2' || item.kind === 'wallpad') {
    ctx.fillStyle = '#FEF3C7';
    ctx.fillRect(-hw, -Math.max(hd, 0.03), item.width, Math.max(item.depth, 0.06));
    ctx.strokeRect(-hw, -Math.max(hd, 0.03), item.width, Math.max(item.depth, 0.06));
  } else {
    // Standard furniture box
    ctx.fillStyle = isSel ? '#EFF6FF' : '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(-hw, -hd, item.width, item.depth, 0.04);
    ctx.fill();
    ctx.stroke();

    // Subtle interior architectural details
    ctx.strokeStyle = isSel ? '#93C5FD' : '#CBD5E1';
    ctx.lineWidth = 0.9 / zoom;

    if (item.kind === 'sofa_modular') {
      // Backrest & cushion lines
      if (item.depth > item.width) {
        ctx.strokeRect(-hw + 0.05, -hd + 0.05, 0.2, item.depth - 0.1);
        ctx.beginPath();
        ctx.moveTo(-hw + 0.25, 0);
        ctx.lineTo(hw - 0.05, 0);
        ctx.stroke();
      } else {
        ctx.strokeRect(-hw + 0.05, -hd + 0.05, item.width - 0.1, 0.2);
        ctx.beginPath();
        ctx.moveTo(0, -hd + 0.25);
        ctx.lineTo(0, hd - 0.05);
        ctx.stroke();
      }
    } else if (item.kind === 'bed_queen') {
      // Headboard + 2 pillows + duvet line
      ctx.strokeRect(-hw + 0.08, -hd + 0.08, item.width - 0.16, 0.12);
      ctx.strokeRect(-hw + 0.16, -hd + 0.28, item.width * 0.34, 0.28);
      ctx.strokeRect(hw - 0.16 - item.width * 0.34, -hd + 0.28, item.width * 0.34, 0.28);
      ctx.beginPath();
      ctx.moveTo(-hw + 0.04, -hd + 0.72);
      ctx.lineTo(hw - 0.04, -hd + 0.72);
      ctx.stroke();
    } else if (item.kind === 'kitchen_sink') {
      ctx.strokeRect(-hw + 0.15, -hd + 0.08, 0.65, item.depth - 0.16);
    } else if (item.kind === 'dining_set') {
      // Subtle chairs
      const cw = 0.38;
      [-hw * 0.45, hw * 0.45].forEach((cx) => {
        ctx.strokeRect(cx - cw / 2, -hd - 0.14, cw, 0.12);
        ctx.strokeRect(cx - cw / 2, hd + 0.02, cw, 0.12);
      });
    } else if (item.kind === 'bathtub') {
      ctx.beginPath();
      ctx.roundRect(-hw + 0.08, -hd + 0.08, item.width - 0.16, item.depth - 0.16, 0.12);
      ctx.stroke();
    } else if (item.kind === 'toilet') {
      ctx.strokeRect(-hw + 0.04, -hd + 0.04, item.width - 0.08, 0.16);
      ctx.beginPath();
      ctx.ellipse(0, 0.1, hw * 0.72, hd * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Fit label strictly INSIDE the object along its longer axis (never overflowing!)
    const longDim = Math.max(item.width, item.depth);
    const shortDim = Math.min(item.width, item.depth);
    if (longDim * zoom >= 48 && shortDim * zoom >= 18) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(-hw + 0.04, -hd + 0.04, Math.max(0.05, item.width - 0.08), Math.max(0.05, item.depth - 0.08));
      ctx.clip();

      if (item.depth > item.width * 1.25) {
        ctx.rotate(-Math.PI / 2);
      }

      const maxTextW = (Math.max(item.width, item.depth) - 0.14) * zoom;
      let pxFont = Math.min(11, Math.max(8.5, shortDim * zoom * 0.32));
      ctx.font = `600 ${pxFont / zoom}px Inter, Pretendard, sans-serif`;
      let label = item.name;
      while (ctx.measureText(label).width * zoom > maxTextW && pxFont > 7.5) {
        pxFont -= 0.5;
        ctx.font = `600 ${pxFont / zoom}px Inter, Pretendard, sans-serif`;
      }
      if (ctx.measureText(label).width * zoom > maxTextW) {
        while (label.length > 2 && ctx.measureText(`${label}…`).width * zoom > maxTextW) {
          label = label.slice(0, -1);
        }
        label = `${label}…`;
      }

      ctx.fillStyle = isSel ? '#1D4ED8' : '#475569';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, 0, item.kind === 'bed_queen' ? 0.18 : 0);
      ctx.restore();
    }
  }

  ctx.restore();
}

export const Viewport2D: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const project = usePlannerStore((s) => s.project);
  const rooms = usePlannerStore((s) => s.rooms);
  const tool = usePlannerStore((s) => s.tool);
  const pendingPropKind = usePlannerStore((s) => s.pendingPropKind);
  const selection = usePlannerStore((s) => s.selection);
  const underlayUrl = usePlannerStore((s) => s.underlayUrl);
  const underlayOpacity = usePlannerStore((s) => s.underlayOpacity);

  const setTool = usePlannerStore((s) => s.setTool);
  const setSelection = usePlannerStore((s) => s.setSelection);
  const moveNode = usePlannerStore((s) => s.moveNode);
  const pushHistorySnapshot = usePlannerStore((s) => s.pushHistorySnapshot);
  const addWallSegment = usePlannerStore((s) => s.addWallSegment);
  const drawRoomBox = usePlannerStore((s) => s.drawRoomBox);
  const addOpeningAtPoint = usePlannerStore((s) => s.addOpeningAtPoint);
  const addSceneItem = usePlannerStore((s) => s.addSceneItem);
  const moveSceneItem = usePlannerStore((s) => s.moveSceneItem);
  const deleteSelected = usePlannerStore((s) => s.deleteSelected);
  const rotateSelected = usePlannerStore((s) => s.rotateSelected);

  const [cam, setCam] = useState<Camera2D>({ x: 6.1, y: 4.7, zoom: 55 });
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [hoverWorld, setHoverWorld] = useState<{ x: number; y: number } | null>(null);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);
  const [alignGuides, setAlignGuides] = useState<{ x?: number; y?: number }>({});
  const dragRef = useRef<DragState>({ kind: 'none' });
  const underlayImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!underlayUrl) {
      underlayImgRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      underlayImgRef.current = img;
    };
    img.src = underlayUrl;
  }, [underlayUrl]);

  const fitView = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const b = projectBounds(project);
    const w = Math.max(2, b.maxX - b.minX);
    const h = Math.max(2, b.maxY - b.minY);
    const pad = 0.78;
    const zoom = Math.min((el.clientWidth * pad) / w, (el.clientHeight * pad) / h, 120);
    setCam({
      x: (b.minX + b.maxX) / 2,
      y: (b.minY + b.maxY) / 2,
      zoom: Math.max(20, zoom),
    });
  }, [project]);

  useEffect(() => {
    fitView();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  const screenToWorld = useCallback(
    (sx: number, sy: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      return {
        x: cam.x + (sx - cx) / cam.zoom,
        y: cam.y + (sy - cy) / cam.zoom,
      };
    },
    [cam],
  );

  const snapPoint = useCallback(
    (wx: number, wy: number, ignoreNodeId?: string): { x: number; y: number; gx?: number; gy?: number } => {
      let sx = snapEnabled ? Math.round(wx / SNAP_GRID_M) * SNAP_GRID_M : wx;
      let sy = snapEnabled ? Math.round(wy / SNAP_GRID_M) * SNAP_GRID_M : wy;
      let gx: number | undefined;
      let gy: number | undefined;

      for (const n of project.nodes) {
        if (n.id === ignoreNodeId) continue;
        if (Math.hypot(n.x - wx, n.y - wy) < 0.18) {
          return { x: n.x, y: n.y, gx: n.x, gy: n.y };
        }
        if (Math.abs(n.x - wx) < 0.11) {
          sx = n.x;
          gx = n.x;
        }
        if (Math.abs(n.y - wy) < 0.11) {
          sy = n.y;
          gy = n.y;
        }
      }
      return { x: sx, y: sy, gx, gy };
    },
    [project.nodes, snapEnabled],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.scale(dpr, dpr);

      ctx.fillStyle = '#FAF9F6';
      ctx.fillRect(0, 0, w, h);

      ctx.translate(w / 2, h / 2);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-cam.x, -cam.y);

      const viewLeft = cam.x - w / 2 / cam.zoom;
      const viewRight = cam.x + w / 2 / cam.zoom;
      const viewTop = cam.y - h / 2 / cam.zoom;
      const viewBottom = cam.y + h / 2 / cam.zoom;

      const stepMinor = 0.5;
      const startX = Math.floor(viewLeft / stepMinor) * stepMinor;
      const startY = Math.floor(viewTop / stepMinor) * stepMinor;

      ctx.lineWidth = 1 / cam.zoom;
      for (let gx = startX; gx <= viewRight; gx += stepMinor) {
        const isMajor = Math.abs(gx - Math.round(gx)) < 0.001;
        ctx.strokeStyle = isMajor ? '#EAE6DF' : '#F4F1EC';
        ctx.beginPath();
        ctx.moveTo(gx, viewTop);
        ctx.lineTo(gx, viewBottom);
        ctx.stroke();
      }
      for (let gy = startY; gy <= viewBottom; gy += stepMinor) {
        const isMajor = Math.abs(gy - Math.round(gy)) < 0.001;
        ctx.strokeStyle = isMajor ? '#EAE6DF' : '#F4F1EC';
        ctx.beginPath();
        ctx.moveTo(viewLeft, gy);
        ctx.lineTo(viewRight, gy);
        ctx.stroke();
      }

      if (underlayImgRef.current) {
        const img = underlayImgRef.current;
        const iw = img.width * 0.015;
        const ih = img.height * 0.015;
        ctx.save();
        ctx.globalAlpha = underlayOpacity;
        ctx.drawImage(img, 0, 0, iw, ih);
        ctx.restore();
      }

      // Rooms with soft material tint
      for (const room of rooms) {
        if (room.polygon.length < 3) continue;
        const mat = getMat(room.floorMaterialId);
        const isSel = selection?.kind === 'room' && selection.key === room.key;
        ctx.save();
        ctx.beginPath();
        room.polygon.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.closePath();
        ctx.fillStyle = mat.color;
        ctx.globalAlpha = isSel ? 0.62 : 0.4;
        ctx.fill();
        ctx.globalAlpha = 1;
        if (isSel) {
          ctx.strokeStyle = '#2563EB';
          ctx.lineWidth = 2.5 / cam.zoom;
          ctx.stroke();
        }
        ctx.restore();
      }

      // Scene items
      for (const item of project.items) {
        const isSel = selection?.kind === 'item' && selection.id === item.id;
        const isHov = hoveredItemId === item.id;
        drawItemSymbol2D(ctx, item, isSel, isHov, cam.zoom);
      }

      const nodeMap = new Map(project.nodes.map((n) => [n.id, n]));

      // Walls (soft slate architectural style)
      for (const wall of project.walls) {
        const a = nodeMap.get(wall.startId);
        const b = nodeMap.get(wall.endId);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy);
        if (len < 0.01) continue;
        const nx = -dy / len;
        const ny = dx / len;
        const ht = wall.thickness / 2;
        const isSel = selection?.kind === 'wall' && selection.id === wall.id;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(a.x + nx * ht, a.y + ny * ht);
        ctx.lineTo(b.x + nx * ht, b.y + ny * ht);
        ctx.lineTo(b.x - nx * ht, b.y - ny * ht);
        ctx.lineTo(a.x - nx * ht, a.y - ny * ht);
        ctx.closePath();
        ctx.fillStyle = isSel ? '#2563EB' : '#334155';
        ctx.fill();

        if (len >= 0.8) {
          const mx = (a.x + b.x) / 2 + nx * (ht + 0.2);
          const my = (a.y + b.y) / 2 + ny * (ht + 0.2);
          const fontSize = Math.max(9 / cam.zoom, 0.11);
          ctx.font = `600 ${fontSize}px Inter, Pretendard, sans-serif`;
          ctx.fillStyle = isSel ? '#2563EB' : '#64748B';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${Math.round(len * 1000)}`, mx, my);
        }
        ctx.restore();
      }

      // Openings
      for (const op of project.openings) {
        const wObj = project.walls.find((w) => w.id === op.wallId);
        if (!wObj) continue;
        const a = nodeMap.get(wObj.startId);
        const b = nodeMap.get(wObj.endId);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const len = Math.hypot(dx, dy);
        if (len < 0.01) continue;
        const ux = dx / len;
        const uy = dy / len;
        const nx = -uy;
        const ny = ux;
        const cx = a.x + dx * op.offset;
        const cy = a.y + dy * op.offset;
        const hw = op.width / 2;
        const ht = wObj.thickness / 2 + 0.012;
        const isSel = selection?.kind === 'opening' && selection.id === op.id;

        ctx.save();
        ctx.beginPath();
        ctx.moveTo(cx - ux * hw + nx * ht, cy - uy * hw + ny * ht);
        ctx.lineTo(cx + ux * hw + nx * ht, cy + uy * hw + ny * ht);
        ctx.lineTo(cx + ux * hw - nx * ht, cy + uy * hw - ny * ht);
        ctx.lineTo(cx - ux * hw - nx * ht, cy - uy * hw - ny * ht);
        ctx.closePath();
        ctx.fillStyle = '#FAF9F6';
        ctx.fill();

        const angle = Math.atan2(dy, dx);
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        if (op.kind === 'window') {
          ctx.strokeStyle = isSel ? '#2563EB' : '#0284C7';
          ctx.lineWidth = 2 / cam.zoom;
          ctx.strokeRect(-hw, -wObj.thickness / 2, op.width, wObj.thickness);
          ctx.beginPath();
          ctx.moveTo(-hw, 0);
          ctx.lineTo(hw, 0);
          ctx.stroke();
        } else if (op.kind === 'sliding_glass') {
          ctx.strokeStyle = isSel ? '#2563EB' : '#0F766E';
          ctx.lineWidth = 2.2 / cam.zoom;
          ctx.strokeRect(-hw, -wObj.thickness / 2, op.width, wObj.thickness);
          ctx.beginPath();
          ctx.moveTo(-hw, -0.02);
          ctx.lineTo(0.12, -0.02);
          ctx.moveTo(-0.12, 0.02);
          ctx.lineTo(hw, 0.02);
          ctx.stroke();
        } else {
          ctx.strokeStyle = isSel ? '#2563EB' : '#B45309';
          ctx.lineWidth = 1.8 / cam.zoom;
          ctx.beginPath();
          ctx.moveTo(-hw, 0);
          ctx.lineTo(-hw, op.width);
          ctx.stroke();
          ctx.setLineDash([4 / cam.zoom, 4 / cam.zoom]);
          ctx.beginPath();
          ctx.arc(-hw, 0, op.width, 0, Math.PI / 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.restore();
      }

      // Room pill badges (always readable, clean background)
      for (const room of rooms) {
        const py = (room.areaSqm / 3.3058).toFixed(1);
        const titleSize = Math.max(10.5 / cam.zoom, 0.14);
        const subSize = Math.max(8.5 / cam.zoom, 0.11);
        ctx.save();
        ctx.font = `700 ${titleSize}px Inter, Pretendard, sans-serif`;
        const w1 = ctx.measureText(room.name).width;
        ctx.font = `500 ${subSize}px Inter, Pretendard, sans-serif`;
        const subText = `${room.areaSqm.toFixed(1)}㎡ (${py}평)`;
        const w2 = ctx.measureText(subText).width;
        const bw = Math.max(w1, w2) + 0.34;
        const bh = titleSize + subSize + 0.24;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.86)';
        ctx.strokeStyle = 'rgba(203, 213, 225, 0.9)';
        ctx.lineWidth = 1 / cam.zoom;
        ctx.beginPath();
        ctx.roundRect(room.centroid.x - bw / 2, room.centroid.y - bh / 2, bw, bh, 0.1);
        ctx.fill();
        ctx.stroke();

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `700 ${titleSize}px Inter, Pretendard, sans-serif`;
        ctx.fillStyle = '#1E293B';
        ctx.fillText(room.name, room.centroid.x, room.centroid.y - subSize * 0.65);
        ctx.font = `500 ${subSize}px Inter, Pretendard, sans-serif`;
        ctx.fillStyle = '#64748B';
        ctx.fillText(subText, room.centroid.x, room.centroid.y + titleSize * 0.72);
        ctx.restore();
      }

      // Subtle corner handles
      for (const n of project.nodes) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(n.x, n.y, 0.055, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        ctx.strokeStyle = '#64748B';
        ctx.lineWidth = 1.2 / cam.zoom;
        ctx.stroke();
        ctx.restore();
      }

      // Floating pill label ONLY above hovered or selected item (so small/dense fixtures never clutter!)
      const activeItemId = selection?.kind === 'item' ? selection.id : hoveredItemId;
      if (activeItemId) {
        const it = project.items.find((x) => x.id === activeItemId);
        if (it) {
          ctx.save();
          const fs = 11 / cam.zoom;
          ctx.font = `600 ${fs}px Inter, Pretendard, sans-serif`;
          const tw = ctx.measureText(it.name).width;
          const pw = tw + 14 / cam.zoom;
          const ph = 20 / cam.zoom;
          const ly = it.y - Math.max(it.depth, it.width) / 2 - ph / 2 - 8 / cam.zoom;
          ctx.fillStyle = selection?.kind === 'item' && selection.id === it.id ? '#2563EB' : '#0F172A';
          ctx.beginPath();
          ctx.roundRect(it.x - pw / 2, ly - ph / 2, pw, ph, 6 / cam.zoom);
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(it.name, it.x, ly);
          ctx.restore();
        }
      }

      if (alignGuides.x !== undefined || alignGuides.y !== undefined) {
        ctx.save();
        ctx.strokeStyle = '#0EA5E9';
        ctx.lineWidth = 1.2 / cam.zoom;
        ctx.setLineDash([6 / cam.zoom, 6 / cam.zoom]);
        if (alignGuides.x !== undefined) {
          ctx.beginPath();
          ctx.moveTo(alignGuides.x, viewTop);
          ctx.lineTo(alignGuides.x, viewBottom);
          ctx.stroke();
        }
        if (alignGuides.y !== undefined) {
          ctx.beginPath();
          ctx.moveTo(viewLeft, alignGuides.y);
          ctx.lineTo(viewRight, alignGuides.y);
          ctx.stroke();
        }
        ctx.restore();
      }

      const drag = dragRef.current;
      if (drag.kind === 'wall_draw') {
        ctx.save();
        ctx.strokeStyle = '#2563EB';
        ctx.lineWidth = 0.14;
        ctx.globalAlpha = 0.45;
        ctx.beginPath();
        ctx.moveTo(drag.startX, drag.startY);
        ctx.lineTo(drag.curX, drag.curY);
        ctx.stroke();
        const len = Math.round(Math.hypot(drag.curX - drag.startX, drag.curY - drag.startY) * 1000);
        ctx.globalAlpha = 1;
        const fs = Math.max(12 / cam.zoom, 0.15);
        ctx.font = `700 ${fs}px Inter, sans-serif`;
        ctx.fillStyle = '#1D4ED8';
        ctx.fillText(`${len} mm`, (drag.startX + drag.curX) / 2, (drag.startY + drag.curY) / 2 - 0.2);
        ctx.restore();
      } else if (drag.kind === 'room_box') {
        const x = Math.min(drag.startX, drag.curX);
        const y = Math.min(drag.startY, drag.curY);
        const rw = Math.abs(drag.curX - drag.startX);
        const rh = Math.abs(drag.curY - drag.startY);
        ctx.save();
        ctx.fillStyle = 'rgba(37, 99, 235, 0.12)';
        ctx.strokeStyle = '#2563EB';
        ctx.lineWidth = 2 / cam.zoom;
        ctx.fillRect(x, y, rw, rh);
        ctx.strokeRect(x, y, rw, rh);
        const sqm = (rw * rh).toFixed(1);
        const fs = Math.max(12 / cam.zoom, 0.16);
        ctx.font = `700 ${fs}px Inter, sans-serif`;
        ctx.fillStyle = '#1D4ED8';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(rw * 1000)} × ${Math.round(rh * 1000)} mm (${sqm}㎡)`, x + rw / 2, y + rh / 2);
        ctx.restore();
      } else if (tool === 'place_item' && hoverWorld) {
        ctx.save();
        ctx.strokeStyle = '#2563EB';
        ctx.setLineDash([4 / cam.zoom, 4 / cam.zoom]);
        ctx.lineWidth = 2 / cam.zoom;
        ctx.strokeRect(hoverWorld.x - 0.45, hoverWorld.y - 0.3, 0.9, 0.6);
        ctx.restore();
      }

      ctx.restore();
    };

    render();
  }, [cam, project, rooms, selection, tool, hoverWorld, hoveredItemId, alignGuides, underlayOpacity]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const world = screenToWorld(sx, sy);

    if (e.button === 1 || e.button === 2) {
      e.currentTarget.setPointerCapture(e.pointerId);
      dragRef.current = {
        kind: 'pan',
        startClientX: e.clientX,
        startClientY: e.clientY,
        startCamX: cam.x,
        startCamY: cam.y,
      };
      return;
    }

    if (tool === 'draw_wall') {
      e.currentTarget.setPointerCapture(e.pointerId);
      const sn = snapPoint(world.x, world.y);
      dragRef.current = { kind: 'wall_draw', startX: sn.x, startY: sn.y, curX: sn.x, curY: sn.y };
      return;
    }

    if (tool === 'draw_room_box') {
      e.currentTarget.setPointerCapture(e.pointerId);
      const sn = snapPoint(world.x, world.y);
      dragRef.current = { kind: 'room_box', startX: sn.x, startY: sn.y, curX: sn.x, curY: sn.y };
      return;
    }

    if (tool === 'add_door' || tool === 'add_window' || tool === 'add_sliding') {
      const kind = tool === 'add_door' ? 'door' : tool === 'add_window' ? 'window' : 'sliding_glass';
      addOpeningAtPoint(world.x, world.y, kind);
      return;
    }

    if (tool === 'place_item') {
      const sn = snapPoint(world.x, world.y);
      addSceneItem(pendingPropKind, sn.x, sn.y);
      return;
    }

    for (const n of project.nodes) {
      if (Math.hypot(n.x - world.x, n.y - world.y) < Math.max(0.18, 12 / cam.zoom)) {
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = {
          kind: 'node',
          nodeId: n.id,
          snapshot: JSON.parse(JSON.stringify(project)) as FloorProject,
        };
        return;
      }
    }

    for (let i = project.items.length - 1; i >= 0; i--) {
      const it = project.items[i];
      const hw = Math.max(it.width / 2, 0.16);
      const hd = Math.max(it.depth / 2, 0.16);
      if (Math.abs(world.x - it.x) <= hw && Math.abs(world.y - it.y) <= hd) {
        e.currentTarget.setPointerCapture(e.pointerId);
        setSelection({ kind: 'item', id: it.id });
        dragRef.current = {
          kind: 'item',
          itemId: it.id,
          offsetX: world.x - it.x,
          offsetY: world.y - it.y,
          snapshot: JSON.parse(JSON.stringify(project)) as FloorProject,
        };
        return;
      }
    }

    const nodeMap = new Map(project.nodes.map((n) => [n.id, n]));
    for (const op of project.openings) {
      const w = project.walls.find((x) => x.id === op.wallId);
      if (!w) continue;
      const a = nodeMap.get(w.startId);
      const b = nodeMap.get(w.endId);
      if (!a || !b) continue;
      const ox = a.x + (b.x - a.x) * op.offset;
      const oy = a.y + (b.y - a.y) * op.offset;
      if (Math.hypot(world.x - ox, world.y - oy) < op.width / 2 + 0.12) {
        setSelection({ kind: 'opening', id: op.id });
        return;
      }
    }

    for (const w of project.walls) {
      const a = nodeMap.get(w.startId);
      const b = nodeMap.get(w.endId);
      if (!a || !b) continue;
      const { dist } = distPointToSeg(world.x, world.y, a.x, a.y, b.x, b.y);
      if (dist < Math.max(w.thickness, 0.22)) {
        setSelection({ kind: 'wall', id: w.id });
        return;
      }
    }

    for (const r of rooms) {
      if (pointInPolygon(world.x, world.y, r.polygon)) {
        setSelection({ kind: 'room', key: r.key });
        return;
      }
    }

    setSelection(null);
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      kind: 'pan',
      startClientX: e.clientX,
      startClientY: e.clientY,
      startCamX: cam.x,
      startCamY: cam.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
    setHoverWorld(world);

    const drag = dragRef.current;
    if (drag.kind === 'pan') {
      const dx = (e.clientX - drag.startClientX) / cam.zoom;
      const dy = (e.clientY - drag.startClientY) / cam.zoom;
      setCam((c) => ({ ...c, x: drag.startCamX - dx, y: drag.startCamY - dy }));
      return;
    }
    if (drag.kind === 'node') {
      const sn = snapPoint(world.x, world.y, drag.nodeId);
      setAlignGuides({ x: sn.gx, y: sn.gy });
      moveNode(drag.nodeId, sn.x, sn.y, false);
      return;
    }
    if (drag.kind === 'item') {
      const nx = snapEnabled
        ? Math.round((world.x - drag.offsetX) / SNAP_GRID_M) * SNAP_GRID_M
        : world.x - drag.offsetX;
      const ny = snapEnabled
        ? Math.round((world.y - drag.offsetY) / SNAP_GRID_M) * SNAP_GRID_M
        : world.y - drag.offsetY;
      moveSceneItem(drag.itemId, nx, ny, false);
      return;
    }
    if (drag.kind === 'wall_draw') {
      const sn = snapPoint(world.x, world.y);
      let cx = sn.x;
      let cy = sn.y;
      if (Math.abs(cx - drag.startX) < 0.16) cx = drag.startX;
      if (Math.abs(cy - drag.startY) < 0.16) cy = drag.startY;
      setAlignGuides({ x: sn.gx, y: sn.gy });
      dragRef.current = { ...drag, curX: cx, curY: cy };
      return;
    }
    if (drag.kind === 'room_box') {
      const sn = snapPoint(world.x, world.y);
      setAlignGuides({ x: sn.gx, y: sn.gy });
      dragRef.current = { ...drag, curX: sn.x, curY: sn.y };
      return;
    }

    // Hover detection for floating pill label
    let foundHover: string | null = null;
    for (let i = project.items.length - 1; i >= 0; i--) {
      const it = project.items[i];
      const hw = Math.max(it.width / 2, 0.16);
      const hd = Math.max(it.depth / 2, 0.16);
      if (Math.abs(world.x - it.x) <= hw && Math.abs(world.y - it.y) <= hd) {
        foundHover = it.id;
        break;
      }
    }
    setHoveredItemId(foundHover);
  };

  const handlePointerUp = () => {
    const drag = dragRef.current;
    if (drag.kind === 'node' || drag.kind === 'item') {
      pushHistorySnapshot(drag.snapshot);
    } else if (drag.kind === 'wall_draw') {
      addWallSegment(drag.startX, drag.startY, drag.curX, drag.curY);
    } else if (drag.kind === 'room_box') {
      drawRoomBox(drag.startX, drag.startY, drag.curX, drag.curY);
      setTool('select');
    }
    dragRef.current = { kind: 'none' };
    setAlignGuides({});
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    const factor = e.deltaY < 0 ? 1.12 : 0.89;
    setCam((c) => ({
      ...c,
      zoom: Math.max(15, Math.min(250, c.zoom * factor)),
    }));
  };

  return (
    <div ref={containerRef} className="relative w-full h-full bg-[#FAF9F6] select-none overflow-hidden">
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
        className={`w-full h-full block ${tool === 'select' ? 'cursor-default' : 'cursor-crosshair'}`}
      />

      <div className="absolute top-3 left-3 flex items-center gap-2 bg-white/95 backdrop-blur border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm text-xs text-slate-600">
        <span className="font-semibold text-slate-800">2D 평면도</span>
        <span className="text-slate-300">|</span>
        <span>
          {tool === 'select' && '코너 드래그로 방 크기 변경 · 마우스 올리면 이름 표시'}
          {tool === 'draw_wall' && '드래그하여 벽체 그리기 (자동 코너 스냅)'}
          {tool === 'draw_room_box' && '드래그하여 사각형 방 생성'}
          {(tool === 'add_door' || tool === 'add_window' || tool === 'add_sliding') &&
            '벽체 위를 클릭하여 개구부 배치'}
          {tool === 'place_item' && '도면 위 원하는 위치를 클릭해 배치'}
        </span>
      </div>

      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/95 backdrop-blur border border-slate-200 rounded-lg p-1.5 shadow-sm">
        {selection?.kind === 'item' && (
          <button
            onClick={() => rotateSelected(45)}
            title="45도 회전 (R)"
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded"
          >
            <RotateCw className="w-3.5 h-3.5" />
            회전
          </button>
        )}
        {selection && selection.kind !== 'room' && (
          <button
            onClick={deleteSelected}
            title="삭제 (Delete)"
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded"
          >
            <Trash2 className="w-3.5 h-3.5" />
            삭제
          </button>
        )}
        <button
          onClick={() => setSnapEnabled((v) => !v)}
          className={`flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${
            snapEnabled ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
          }`}
          title="50mm 그리드 & 직교 스냅"
        >
          <Crosshair className="w-3.5 h-3.5" />
          스냅 {snapEnabled ? 'ON' : 'OFF'}
        </button>
        <button
          onClick={fitView}
          className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded"
          title="전체 도면 맞춤"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          맞춤
        </button>
      </div>
    </div>
  );
};
