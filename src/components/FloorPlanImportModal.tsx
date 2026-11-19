import React, { useEffect, useState, useRef } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import {
  DoorSwing,
  RoomType,
} from '../types/interior';
import {
  autoDetectRooms,
  autoOpenings,
  buildRoomIndex,
  buildTemplate,
  buildWallSegments,
  cellSize,
  estimateScale,
  findGaps,
  floodFillRoom,
  Gap,
  guessRoom,
  labelPoint,
  loadPlanImage,
  maskToPolygon,
  OpeningKind,
  PlanImage,
  pointInPoly,
  polyArea,
  Pt,
  rectRoomMask,
  WOpening,
  WRoom,
  WWall,
} from '../utils/planWizardEngine';
import { saveBlueprintForType } from '../utils/savedBlueprints';
import {
  X,
  Upload,
  Wand2,
  CheckCircle2,
  RotateCw,
  Save,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Square,
  MousePointerClick,
  ExternalLink,
  Ruler,
  Undo2,
  Search,
  Loader2,
  SlidersHorizontal,
} from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  initialImageUrl?: string | null;
  importMode?: 'base' | 'option';
}

const ROOM_PRESETS: Array<{ label: string; type: RoomType | 'auto'; color: string }> = [
  { label: '자동 판별', type: 'auto', color: '#2563EB' },
  { label: '거실/주방', type: 'living', color: '#D97706' },
  { label: '복도', type: 'alpha', color: '#64748B' },
  { label: '주방/식당', type: 'kitchen', color: '#EA580C' },
  { label: '침실1 (안방)', type: 'master', color: '#CA8A04' },
  { label: '침실2', type: 'bedroom', color: '#A16207' },
  { label: '침실3', type: 'bedroom', color: '#854D0E' },
  { label: '공용욕실', type: 'bath', color: '#0284C7' },
  { label: '부부욕실', type: 'bath', color: '#0369A1' },
  { label: '드레스룸', type: 'dress', color: '#7C3AED' },
  { label: '팬트리', type: 'alpha', color: '#4F46E5' },
  { label: '현관', type: 'entrance', color: '#475569' },
  { label: '발코니', type: 'balcony', color: '#059669' },
  { label: '다용도실', type: 'utility', color: '#0D9488' },
];

const ROOM_COLOR_MAP: Record<RoomType, string> = {
  living: 'rgba(245, 158, 11, 0.36)',
  kitchen: 'rgba(234, 88, 12, 0.36)',
  master: 'rgba(202, 138, 4, 0.36)',
  bedroom: 'rgba(161, 98, 7, 0.34)',
  bath: 'rgba(14, 165, 233, 0.38)',
  dress: 'rgba(139, 92, 246, 0.36)',
  alpha: 'rgba(79, 70, 229, 0.36)',
  entrance: 'rgba(100, 116, 139, 0.42)',
  balcony: 'rgba(16, 185, 129, 0.34)',
  utility: 'rgba(20, 184, 166, 0.36)',
};

export const FloorPlanImportModal: React.FC<Props> = ({
  open,
  onClose,
  initialImageUrl,
  importMode = 'base',
}) => {
  const {
    plan,
    loadPlanTemplate,
    addOptionVariantToCurrentPlan,
    setUnderlayImage,
    showToast,
  } = useStudioStore();
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialImageUrl || null);
  const [customName, setCustomName] = useState<string>('네이버 평면도');
  const [sourceTab, setSourceTab] = useState<'naver' | 'bunyang'>('naver');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searching, setSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<
    Array<{ url: string; thumbUrl: string; title: string }>
  >([]);
  const [bunyangOptions, setBunyangOptions] = useState<{
    balcony: 'extended' | 'basic';
    alphaWall: 'keep' | 'open';
    kitchenType: 'basic' | 'island';
    dressType: 'basic' | 'wide';
  }>({
    balcony: 'extended',
    alphaWall: 'keep',
    kitchenType: 'basic',
    dressType: 'basic',
  });
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [planImg, setPlanImg] = useState<PlanImage | null>(null);
  const srcCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const viewCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Step 1 state: rooms
  const [rooms, setRooms] = useState<WRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [activePresetIdx, setActivePresetIdx] = useState<number>(0);
  const [fillMode, setFillMode] = useState<'click' | 'rect'>('rect');
  const [rectStart, setRectStart] = useState<Pt | null>(null);
  const [mousePt, setMousePt] = useState<Pt | null>(null);
  const [hintMsg, setHintMsg] = useState<string | null>(null);

  // Step 2 state: walls & openings
  const [walls, setWalls] = useState<WWall[]>([]);
  const [unusedGaps, setUnusedGaps] = useState<Gap[]>([]);
  const [selectedOp, setSelectedOp] = useState<{ wallId: string; opId: string } | null>(null);
  const [mPerPx, setMPerPx] = useState<number>(0.015);

  // Step 3 state: dimension calibration
  const [calibWallId, setCalibWallId] = useState<string | null>(null);
  const [calibMmInput, setCalibMmInput] = useState<string>('3600');
  const [targetAreaSqm, setTargetAreaSqm] = useState<number>(84);

  // Unified Undo stack across Step 1, Step 2, and Step 3
  const [undoStack, setUndoStack] = useState<
    Array<{
      rooms: WRoom[];
      walls: WWall[];
      unusedGaps: Gap[];
      mPerPx: number;
      targetAreaSqm: number;
    }>
  >([]);

  const pushUndo = () => {
    setUndoStack((prev) => [
      ...prev.slice(-24),
      {
        rooms: rooms.map((r) => ({ ...r, poly: r.poly.map((p) => ({ ...p })) })),
        walls: JSON.parse(JSON.stringify(walls)),
        unusedGaps: JSON.parse(JSON.stringify(unusedGaps)),
        mPerPx,
        targetAreaSqm,
      },
    ]);
  };

  const handleWizardUndo = () => {
    if (undoStack.length === 0) return;
    const snap = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setRooms(snap.rooms);
    setWalls(snap.walls);
    setUnusedGaps(snap.unusedGaps);
    setMPerPx(snap.mPerPx);
    setTargetAreaSqm(snap.targetAreaSqm);
    setSelectedRoomId(null);
    setSelectedOp(null);
    setHintMsg('이전 작업으로 되돌렸습니다.');
  };

  useEffect(() => {
    if (!open) return;
    if (importMode === 'option') {
      setSourceTab('bunyang');
      const nextNum = plan.optionVariants?.length || 1;
      setCustomName(`옵션 ${nextNum}`);
      setSearchQuery(`${plan.complexName} 분양 옵션 평면도`);
    }
    if (initialImageUrl) {
      setPreviewUrl(initialImageUrl);
    } else {
      setPreviewUrl(null);
      setStep(1);
      setRooms([]);
      setWalls([]);
      setUnusedGaps([]);
      setUndoStack([]);
      setSelectedRoomId(null);
      setSelectedOp(null);
    }
  }, [open, initialImageUrl, importMode, plan.complexName, plan.optionVariants?.length]);

  // Load image and auto-seed major rooms
  useEffect(() => {
    if (!open || !previewUrl) return;
    let cancelled = false;
    loadPlanImage(previewUrl)
      .then(({ plan, canvas }) => {
        if (cancelled) return;
        srcCanvasRef.current = canvas;
        setPlanImg(plan);
        const seeded = autoDetectRooms(plan);
        setRooms(seeded);
        setSelectedRoomId(null);
        setStep(1);
        setHintMsg(
          `주요 공간 ${seeded.length}개를 자동으로 찾았습니다. 빠진 공간(현관·팬트리·발코니·드레스룸 등)은 위에서 이름을 고른 뒤 도면 위를 클릭해 추가하세요.`
        );
      })
      .catch(() => {
        if (!cancelled) setHintMsg('이미지를 불러오지 못했습니다.');
      });
    return () => {
      cancelled = true;
    };
  }, [open, previewUrl]);

  // Proceed from Step 1 -> Step 2 (generate walls & openings from confirmed rooms)
  const buildStep2FromRooms = () => {
    if (!planImg || rooms.length === 0) {
      setHintMsg('최소 1개 이상의 방을 지정해 주세요.');
      return;
    }
    const polys = rooms.map((r) => r.poly);
    const segs = buildWallSegments(planImg, polys);
    const allXs = polys.flatMap((p) => p.map((pt) => pt.x));
    const spanPx = allXs.length ? Math.max(...allXs) - Math.min(...allXs) : planImg.w;
    let m = estimateScale(segs, spanPx);
    // Calibrate initial mPerPx to targetAreaSqm
    const nonBalAreaPx = rooms
      .filter((r) => r.type !== 'balcony')
      .reduce((s, r) => s + polyArea(r.poly), 0);
    if (nonBalAreaPx > 100) {
      m = Math.sqrt(targetAreaSqm / nonBalAreaPx);
    }
    const gaps = findGaps(segs, m);
    const idx = buildRoomIndex(planImg.w, planImg.h, rooms);
    const res = autoOpenings(planImg, rooms, idx, segs, gaps, m);
    setMPerPx(m);
    setWalls(res.walls);
    setUnusedGaps(res.gaps);
    setSelectedOp(null);
    setStep(2);
    setHintMsg(
      '문(초록)·창문(파랑)을 클릭하면 열림 방향·양개문(팬트리)·창문·벽 막기를 즉시 바꿀 수 있습니다.'
    );
  };

  // Draw canvas for Step 1 / Step 2 / Step 3
  useEffect(() => {
    const canvas = viewCanvasRef.current;
    const srcCanvas = srcCanvasRef.current;
    if (!canvas || !srcCanvas || !planImg) return;

    const maxW = 760;
    const maxH = 420;
    const sc = Math.min(maxW / planImg.w, maxH / planImg.h);
    const cw = Math.max(200, Math.round(planImg.w * sc));
    const ch = Math.max(160, Math.round(planImg.h * sc));
    const dpr = window.devicePixelRatio || 1;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cw, ch);

    ctx.save();
    ctx.globalAlpha = step === 1 ? 0.72 : 0.45;
    ctx.drawImage(srcCanvas, 0, 0, cw, ch);
    ctx.restore();

    // Draw room polygons
    rooms.forEach((r) => {
      const isSel = r.id === selectedRoomId;
      ctx.beginPath();
      r.poly.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x * sc, p.y * sc);
        else ctx.lineTo(p.x * sc, p.y * sc);
      });
      ctx.closePath();
      ctx.fillStyle = ROOM_COLOR_MAP[r.type] || 'rgba(59, 130, 246, 0.3)';
      ctx.fill();
      ctx.strokeStyle = isSel ? '#2563EB' : 'rgba(15, 23, 42, 0.65)';
      ctx.lineWidth = isSel ? 2.8 : 1.4;
      ctx.stroke();

      const lp = labelPoint(r.poly);
      ctx.save();
      ctx.font = '700 11px "Noto Sans KR", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(255,255,255,0.92)';
      ctx.lineWidth = 3;
      ctx.strokeText(r.name, lp.x * sc, lp.y * sc);
      ctx.fillStyle = isSel ? '#1D4ED8' : '#0F172A';
      ctx.fillText(r.name, lp.x * sc, lp.y * sc);
      ctx.restore();
    });

    // Step 1 rectangle drag preview
    if (step === 1 && fillMode === 'rect' && rectStart && mousePt) {
      ctx.save();
      ctx.setLineDash([5, 3]);
      ctx.strokeStyle = '#2563EB';
      ctx.lineWidth = 2;
      ctx.strokeRect(
        Math.min(rectStart.x, mousePt.x) * sc,
        Math.min(rectStart.y, mousePt.y) * sc,
        Math.abs(mousePt.x - rectStart.x) * sc,
        Math.abs(mousePt.y - rectStart.y) * sc
      );
      ctx.restore();
    }

    // Step 2 & 3: draw walls, unused gaps, and openings
    if (step >= 2) {
      // Unused gaps (dashed gray — click to turn into door/window)
      unusedGaps.forEach((g) => {
        const x1 = (g.ori === 'H' ? g.a1 : g.c) * sc;
        const y1 = (g.ori === 'H' ? g.c : g.a1) * sc;
        const x2 = (g.ori === 'H' ? g.a2 : g.c) * sc;
        const y2 = (g.ori === 'H' ? g.c : g.a2) * sc;
        ctx.save();
        ctx.setLineDash([4, 3]);
        ctx.strokeStyle = 'rgba(100, 116, 139, 0.7)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
      });

      walls.forEach((w) => {
        const x1 = (w.ori === 'H' ? w.a1 : w.c) * sc;
        const y1 = (w.ori === 'H' ? w.c : w.a1) * sc;
        const x2 = (w.ori === 'H' ? w.a2 : w.c) * sc;
        const y2 = (w.ori === 'H' ? w.c : w.a2) * sc;
        const isCalib = step === 3 && w.id === calibWallId;

        if (!w.gapWall) {
          ctx.strokeStyle = isCalib ? '#2563EB' : '#DC2626';
          ctx.lineWidth = isCalib ? 5 : 3.2;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();

          if (step === 3 && (w.a2 - w.a1) * mPerPx >= 1.0) {
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2;
            const lenMm = Math.round((w.a2 - w.a1) * mPerPx * 1000);
            ctx.save();
            ctx.font = '700 10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.strokeStyle = 'rgba(255,255,255,0.92)';
            ctx.lineWidth = 3;
            ctx.strokeText(`${lenMm}`, mx, my);
            ctx.fillStyle = isCalib ? '#1D4ED8' : '#0F172A';
            ctx.fillText(`${lenMm}`, mx, my);
            ctx.restore();
          }
        }

        const dx = x2 - x1;
        const dy = y2 - y1;
        const angle = Math.atan2(dy, dx);

        w.openings.forEach((op) => {
          const isSel =
            selectedOp?.wallId === w.id && selectedOp?.opId === op.id;
          const t = (op.center - w.a1) / Math.max(1, w.a2 - w.a1);
          const cx = x1 + dx * t;
          const cy = y1 + dy * t;
          const opW = op.width * sc;

          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(angle);

          if (op.type === 'window' || op.type === 'sliding_door') {
            ctx.strokeStyle = isSel ? '#1D4ED8' : '#0284C7';
            ctx.lineWidth = isSel ? 6 : 4.5;
            ctx.beginPath();
            ctx.moveTo(-opW / 2, 0);
            ctx.lineTo(opW / 2, 0);
            ctx.stroke();
          } else {
            ctx.strokeStyle = isSel ? '#15803D' : '#16A34A';
            ctx.lineWidth = isSel ? 6 : 4.5;
            ctx.beginPath();
            ctx.moveTo(-opW / 2, 0);
            ctx.lineTo(opW / 2, 0);
            ctx.stroke();

            const swing = op.swing || 'out_left';
            const isDouble = swing === 'in_double' || swing === 'out_double';
            const isRight = swing === 'in_right' || swing === 'out_right';
            const isInward =
              swing === 'in_left' ||
              swing === 'in_right' ||
              swing === 'in_double';
            const dirY = isInward ? 1 : -1;

            ctx.lineWidth = 1.6;
            if (isDouble) {
              const hw = opW / 2;
              ctx.beginPath();
              ctx.moveTo(-hw, 0);
              ctx.lineTo(-hw, dirY * hw);
              ctx.moveTo(hw, 0);
              ctx.lineTo(hw, dirY * hw);
              ctx.stroke();
              ctx.beginPath();
              if (!isInward) {
                ctx.arc(-hw, 0, hw, -Math.PI / 2, 0);
                ctx.arc(hw, 0, hw, Math.PI, -Math.PI / 2);
              } else {
                ctx.arc(-hw, 0, hw, 0, Math.PI / 2);
                ctx.arc(hw, 0, hw, Math.PI / 2, Math.PI);
              }
              ctx.stroke();
            } else {
              const hx = isRight ? opW / 2 : -opW / 2;
              ctx.beginPath();
              ctx.moveTo(hx, 0);
              ctx.lineTo(hx, dirY * opW);
              ctx.stroke();
              ctx.beginPath();
              if (!isRight && !isInward) ctx.arc(hx, 0, opW, -Math.PI / 2, 0);
              else if (isRight && !isInward)
                ctx.arc(hx, 0, opW, Math.PI, -Math.PI / 2);
              else if (!isRight && isInward) ctx.arc(hx, 0, opW, 0, Math.PI / 2);
              else ctx.arc(hx, 0, opW, Math.PI / 2, Math.PI);
              ctx.stroke();
            }
          }
          ctx.restore();
        });
      });
    }
  }, [
    planImg,
    step,
    rooms,
    selectedRoomId,
    fillMode,
    rectStart,
    mousePt,
    walls,
    unusedGaps,
    selectedOp,
    calibWallId,
    mPerPx,
  ]);

  if (!open) return null;

  const toImgPt = (e: React.MouseEvent<HTMLCanvasElement>): Pt | null => {
    const canvas = viewCanvasRef.current;
    if (!canvas || !planImg) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * planImg.w,
      y: ((e.clientY - rect.top) / rect.height) * planImg.h,
    };
  };

  const applyPresetToNewRoom = (
    mask: ReturnType<typeof floodFillRoom> & object,
    poly: Pt[]
  ) => {
    const preset = ROOM_PRESETS[activePresetIdx];
    const g =
      preset.type === 'auto'
        ? guessRoom(mask.color, rooms)
        : { name: preset.label, type: preset.type };
    pushUndo();
    const newRoom: WRoom = {
      id: `r-${Date.now()}`,
      name: g.name,
      type: g.type,
      poly,
      mask,
      autoNamed: preset.type === 'auto',
    };
    setRooms((prev) => [...prev, newRoom]);
    setSelectedRoomId(newRoom.id);
    setHintMsg(`'${newRoom.name}' 공간이 추가되었습니다.`);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!planImg) return;
    const pt = toImgPt(e);
    if (!pt) return;

    if (step === 1) {
      if (fillMode === 'rect') {
        if (!rectStart) {
          setRectStart(pt);
          setHintMsg('사각형의 반대쪽 모서리를 클릭하세요.');
        } else {
          const taken = buildRoomIndex(planImg.w, planImg.h, rooms);
          const rm = rectRoomMask(
            planImg,
            rectStart.x,
            rectStart.y,
            pt.x,
            pt.y,
            taken
          );
          setRectStart(null);
          if (!rm) {
            setHintMsg('유효한 사각형 영역이 아닙니다.');
            return;
          }
          const poly = maskToPolygon(rm, cellSize(planImg));
          applyPresetToNewRoom(rm, poly);
        }
        return;
      }

      // Check if clicking inside an existing room -> only select it (never auto-rename on click)
      const hitRoom = rooms.find((r) => pointInPoly(pt, r.poly));
      if (hitRoom) {
        setSelectedRoomId(hitRoom.id);
        setHintMsg(
          `'${hitRoom.name}' 선택됨 — 아래 공간 이름 버튼을 누르면 이름이 변경되고, 우측 [선택 방 삭제]로 지울 수 있습니다.`
        );
        return;
      }

      // 선택/이름변경 모드: 기존 방만 선택/이름변경 (자동 채우기 비활성화)
      setSelectedRoomId(null);
      setHintMsg('새 공간을 추가하려면 [공간지정] 버튼을 누른 뒤 두 모서리를 클릭하세요.');
      return;
    }

    if (step === 2) {
      // 1) Check if user clicked an existing opening
      for (const w of walls) {
        for (const op of w.openings) {
          const ox = w.ori === 'H' ? op.center : w.c;
          const oy = w.ori === 'H' ? w.c : op.center;
          if (Math.hypot(pt.x - ox, pt.y - oy) <= Math.max(14, op.width * 0.55)) {
            setSelectedOp({ wallId: w.id, opId: op.id });
            // If already selected, cycle its swing direction immediately!
            if (selectedOp?.wallId === w.id && selectedOp?.opId === op.id) {
              cycleSelectedOpeningSwing(w.id, op.id);
            }
            return;
          }
        }
      }

      // 2) Check if user clicked an unused gap -> turn it into a door!
      const hitGapIdx = unusedGaps.findIndex((g) => {
        const cx = g.ori === 'H' ? (g.a1 + g.a2) / 2 : g.c;
        const cy = g.ori === 'H' ? g.c : (g.a1 + g.a2) / 2;
        return Math.hypot(pt.x - cx, pt.y - cy) <= Math.max(16, (g.a2 - g.a1) * 0.55);
      });
      if (hitGapIdx >= 0) {
        pushUndo();
        const g = unusedGaps[hitGapIdx];
        const newWallId = `g-add-${Date.now()}`;
        const newOpId = `o-add-${Date.now()}`;
        const newWall: WWall = {
          ...g,
          id: newWallId,
          exterior: false,
          gapWall: true,
          openings: [
            {
              id: newOpId,
              type: 'door',
              center: (g.a1 + g.a2) / 2,
              width: g.a2 - g.a1,
              swing: 'out_left',
            },
          ],
        };
        setUnusedGaps((prev) => prev.filter((_, i) => i !== hitGapIdx));
        setWalls((prev) => [...prev, newWall]);
        setSelectedOp({ wallId: newWallId, opId: newOpId });
        return;
      }

      // 3) Check if user clicked on a solid wall -> punch a door at that spot!
      for (const w of walls) {
        if (w.gapWall) continue;
        const along = w.ori === 'H' ? pt.x : pt.y;
        const perp = w.ori === 'H' ? pt.y : pt.x;
        if (
          along >= w.a1 + 8 &&
          along <= w.a2 - 8 &&
          Math.abs(perp - w.c) <= Math.max(12, w.t)
        ) {
          const newOpId = `o-wall-${Date.now()}`;
          pushUndo();
          const doorPx = Math.min((w.a2 - w.a1) * 0.8, 0.85 / mPerPx);
          const newOp: WOpening = {
            id: newOpId,
            type: w.exterior ? 'window' : 'door',
            center: along,
            width: doorPx,
            swing: 'out_left',
          };
          setWalls((prev) =>
            prev.map((item) =>
              item.id === w.id
                ? { ...item, openings: [...item.openings, newOp] }
                : item
            )
          );
          setSelectedOp({ wallId: w.id, opId: newOpId });
          return;
        }
      }
      return;
    }

    if (step === 3) {
      // Find nearest solid wall to calibrate millimeter length
      let bestW: WWall | null = null;
      let bestD = 24;
      for (const w of walls) {
        if (w.gapWall) continue;
        const along = w.ori === 'H' ? pt.x : pt.y;
        const perp = w.ori === 'H' ? pt.y : pt.x;
        if (along >= w.a1 && along <= w.a2) {
          const d = Math.abs(perp - w.c);
          if (d < bestD) {
            bestD = d;
            bestW = w;
          }
        }
      }
      if (bestW) {
        setCalibWallId(bestW.id);
        setCalibMmInput(
          String(Math.round((bestW.a2 - bestW.a1) * mPerPx * 1000))
        );
      }
    }
  };

  const cycleSelectedOpeningSwing = (wallId: string, opId: string) => {
    pushUndo();
    const order: DoorSwing[] = [
      'out_left',
      'out_right',
      'in_left',
      'in_right',
      'out_double',
      'in_double',
    ];
    setWalls((prev) =>
      prev.map((w) =>
        w.id !== wallId
          ? w
          : {
              ...w,
              openings: w.openings.map((o) =>
                o.id !== opId
                  ? o
                  : {
                      ...o,
                      swing:
                        order[(order.indexOf(o.swing) + 1) % order.length],
                    }
              ),
            }
      )
    );
  };

  const updateSelectedOpening = (
    patch: Partial<{ type: OpeningKind; swing: DoorSwing }>
  ) => {
    if (!selectedOp) return;
    pushUndo();
    setWalls((prev) =>
      prev.map((w) =>
        w.id !== selectedOp.wallId
          ? w
          : {
              ...w,
              openings: w.openings.map((o) =>
                o.id !== selectedOp.opId ? o : { ...o, ...patch }
              ),
            }
      )
    );
  };

  const deleteSelectedOpening = () => {
    if (!selectedOp) return;
    pushUndo();
    setWalls((prev) =>
      prev
        .map((w) =>
          w.id !== selectedOp.wallId
            ? w
            : {
                ...w,
                openings: w.openings.filter((o) => o.id !== selectedOp.opId),
              }
        )
        .filter((w) => !w.gapWall || w.openings.length > 0)
    );
    setSelectedOp(null);
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviewUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) handleFile(file);
      }
    }
  };

  const handleApplyAndSave = () => {
    if (!rooms.length || !walls.length) return;
    const label = customName.trim() || (importMode === 'option' ? '옵션 도면' : '네이버 평면도');
    const built = buildTemplate({
      rooms,
      walls,
      mPerPx,
      name: label,
    });

    if (importMode === 'option') {
      addOptionVariantToCurrentPlan(label, built);
    } else {
      loadPlanTemplate(built);
      localStorage.setItem('gangdong_interior_saved_plan', JSON.stringify(built));
      saveBlueprintForType('custom-naver', built.complexName, built);
      showToast(
        `'${built.complexName}' 2D CAD · 3D 도면 생성 완료 (방 ${built.rooms.length}개 · 벽 ${built.walls.length}개)`
      );
    }

    setUnderlayImage(null);
    setPreviewUrl(null);
    setStep(1);
    setRooms([]);
    setWalls([]);
    setUnusedGaps([]);
    setUndoStack([]);
    onClose();
  };

  const activeOpObj = selectedOp
    ? walls
        .find((w) => w.id === selectedOp.wallId)
        ?.openings.find((o) => o.id === selectedOp.opId)
    : null;

  return (
    <div
      onPaste={handlePaste}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) handleFile(file);
      }}
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="w-full max-w-5xl bg-white border border-[#E9E9E7] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header + 3-Step Indicator */}
        <div className="px-5 py-3.5 border-b border-[#E9E9E7] flex items-center justify-between bg-[#FBFBFA]">
          <div className="flex items-center gap-2.5">
            <Wand2 className="w-5 h-5 text-[#2383E2]" />
            <div>
              <h2 className="text-base font-bold text-[#37352F]">
                네이버 도면 3단계 마법사 (일반 사용자용 100% 정밀 변환)
              </h2>
              <p className="text-xs text-[#787774]">
                1단계 방 클릭 확인 → 2단계 문·양개문·창호 클릭 설정 → 3단계 치수 맞춤 후 2D/3D 완성
              </p>
            </div>
          </div>

          {previewUrl && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold">
              {[
                [1, '1. 공간(방) 지정'],
                [2, '2. 문 · 창호 확인'],
                [3, '3. 치수 · 완료'],
              ].map(([s, label]) => (
                <button
                  key={s}
                  onClick={() => {
                    if (s === 1) setStep(1);
                    else if (s === 2) buildStep2FromRooms();
                    else if (s === 3) {
                      if (step === 1) buildStep2FromRooms();
                      setStep(3);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-md transition ${
                    step === s
                      ? 'bg-[#2383E2] text-white'
                      : 'bg-[#EFEFED] text-[#787774] hover:text-[#37352F]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#787774] hover:bg-[#EFEFED]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 overflow-y-auto">
          {!previewUrl ? (
            <div className="space-y-3.5">
              {/* 도면 소스 선택 탭: 네이버 부동산 도면 vs 분양도면(내부구조 옵션) */}
              <div className="flex items-center gap-2 border-b border-[#E9E9E7] pb-2.5">
                <button
                  onClick={() => {
                    setSourceTab('naver');
                    setSearchResults([]);
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold transition ${
                    sourceTab === 'naver'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-[#F7F7F5] text-[#787774] hover:text-[#37352F]'
                  }`}
                >
                  네이버 부동산 도면 검색
                </button>
                <button
                  onClick={() => {
                    setSourceTab('bunyang');
                    setSearchResults([]);
                  }}
                  className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    sourceTab === 'bunyang'
                      ? 'bg-[#2383E2] text-white shadow-xs'
                      : 'bg-[#F7F7F5] text-[#787774] hover:text-[#37352F]'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  분양도면 검색 (내부 구조 옵션 선택)
                </button>
              </div>

              {/* 아파트 / 평형 검색바 */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  const q = searchQuery.trim();
                  if (!q) return;
                  setSearching(true);
                  try {
                    const suffix =
                      sourceTab === 'naver'
                        ? ' 네이버 부동산 평면도'
                        : ' 분양 평면도 유상옵션';
                    const res = await fetch(
                      `/api/naver/image-search?q=${encodeURIComponent(q + suffix)}`
                    );
                    const json = await res.json();
                    setSearchResults(json.items || []);
                  } catch {
                    setSearchResults([]);
                  } finally {
                    setSearching(false);
                  }
                }}
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#9B9A97] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      sourceTab === 'naver'
                        ? '아파트 단지명과 타입 입력 (예: 고덕자이 84B, 올림픽파크포레온 84A)'
                        : '분양 단지명과 타입 입력 (예: 올림픽파크포레온 84A, 더샵 둔촌포레 84)'
                    }
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#D3D1CB] focus:border-[#2383E2] rounded-lg outline-none text-[#37352F]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching}
                  className="px-4 py-2 rounded-lg bg-[#37352F] hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 disabled:opacity-50"
                >
                  {searching ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                  <span>도면 검색</span>
                </button>
              </form>

              {/* 빠른 추천 검색어 */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-[#787774] font-medium">빠른 검색:</span>
                {['고덕자이 84B', '올림픽파크포레온 84A', '고덕 그라시움 84A', '고덕 아르테온 84A'].map(
                  (presetQ) => (
                    <button
                      key={presetQ}
                      type="button"
                      onClick={() => setSearchQuery(presetQ)}
                      className="px-2 py-0.5 rounded bg-[#F7F7F5] hover:bg-[#EFEFED] border border-[#E9E9E7] text-[#37352F]"
                    >
                      {presetQ}
                    </button>
                  )
                )}
              </div>

              {/* 분양도면 안내 배너 */}
              {sourceTab === 'bunyang' && (
                <div className="p-3 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-xs text-[#1E40AF] flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 shrink-0 text-[#2383E2]" />
                  <span>
                    {importMode === 'option'
                      ? '옵션별 분양도면 이미지를 선택해 변환하면 상단에서 기본 도면 ↔ 옵션 도면을 자유롭게 전환할 수 있습니다.'
                      : '분양 기본 도면을 먼저 적용한 뒤, 상단 [+ 옵션 도면 추가] 버튼으로 유상옵션별 도면을 추가해 비교·선택할 수 있습니다.'}
                  </span>
                </div>
              )}

              {/* 검색된 도면 이미지 그리드 */}
              {searchResults.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-[#37352F]">
                    검색된 {sourceTab === 'naver' ? '네이버 부동산 도면' : '분양도면'} ({searchResults.length}건) — 도면을 클릭하면 바로 변환 마법사로 이동합니다
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[260px] overflow-y-auto p-1">
                    {searchResults.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setCustomName(searchQuery.trim() || item.title.slice(0, 20));
                          setPreviewUrl(item.thumbUrl);
                        }}
                        className="group border border-[#E9E9E7] hover:border-[#2383E2] rounded-lg overflow-hidden bg-white text-left transition shadow-2xs hover:shadow-md"
                      >
                        <div className="h-28 bg-[#FBFBFA] flex items-center justify-center p-1.5 overflow-hidden">
                          <img
                            src={item.thumbUrl}
                            alt={item.title}
                            className="max-h-full max-w-full object-contain group-hover:scale-105 transition"
                          />
                        </div>
                        <div className="px-2 py-1.5 border-t border-[#F1F1EF] text-[10px] text-[#37352F] font-medium truncate">
                          {item.title || searchQuery}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 보조: 직접 이미지 업로드 / 붙여넣기 */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-[#FBFBFA] border border-[#E9E9E7]">
                <span className="text-xs text-[#787774]">
                  원하는 이미지가 있다면 바로 <kbd className="px-1.5 py-0.5 bg-[#EFEFED] border border-[#E9E9E7] rounded text-[11px]">Ctrl + V</kbd> 붙여넣기하거나 파일로 올릴 수도 있습니다.
                </span>
                <div className="flex items-center gap-2">
                  <label className="cursor-pointer px-2.5 py-1 bg-white border border-[#D3D1CB] hover:bg-[#EFEFED] rounded-md text-xs font-semibold text-[#37352F] flex items-center gap-1">
                    <Upload className="w-3.5 h-3.5" />
                    파일 업로드
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                      }}
                    />
                  </label>
                  <a
                    href="https://new.land.naver.com/complexes?ms=37.5301,127.1238,15&a=APT&e=RETAIL"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold"
                  >
                    네이버 부동산 열기
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Step 1 Controls: Room Type Chips & Fill Mode */}
              {step === 1 && (
                <div className="p-3 rounded-lg bg-[#F7F7F5] border border-[#E9E9E7] space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#37352F]">
                      1단계: 추가하거나 이름을 바꿀 공간 종류를 고른 뒤 도면의 방 안쪽을 클릭하세요
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setFillMode('click');
                          setRectStart(null);
                        }}
                        className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
                          fillMode === 'click'
                            ? 'bg-[#37352F] text-white'
                            : 'bg-white border border-[#D3D1CB] text-[#37352F]'
                        }`}
                      >
                        <MousePointerClick className="w-3.5 h-3.5" />
                        선택 / 이름변경
                      </button>
                      <button
                        onClick={() => {
                          setFillMode('rect');
                          setRectStart(null);
                        }}
                        className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1 ${
                          fillMode === 'rect'
                            ? 'bg-[#37352F] text-white'
                            : 'bg-white border border-[#D3D1CB] text-[#37352F]'
                        }`}
                      >
                        <Square className="w-3.5 h-3.5" />
                        공간지정
                      </button>
                      {selectedRoomId && (
                        <button
                          onClick={() => {
                            pushUndo();
                            setRooms((prev) =>
                              prev.filter((r) => r.id !== selectedRoomId)
                            );
                            setSelectedRoomId(null);
                          }}
                          className="px-2.5 py-1 rounded text-xs font-semibold bg-rose-600 text-white flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          선택 방 삭제
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {ROOM_PRESETS.map((p, idx) => (
                      <button
                        key={p.label}
                        onClick={() => {
                          setActivePresetIdx(idx);
                          if (selectedRoomId && p.type !== 'auto') {
                            pushUndo();
                            setRooms((prev) =>
                              prev.map((r) =>
                                r.id === selectedRoomId
                                  ? { ...r, name: p.label, type: p.type as RoomType }
                                  : r
                              )
                            );
                            setHintMsg(`선택한 공간 이름을 '${p.label}'(으)로 변경했습니다.`);
                          }
                        }}
                        className={`px-2.5 py-1 rounded-md text-xs font-semibold transition border ${
                          activePresetIdx === idx
                            ? 'bg-[#2383E2] text-white border-[#2383E2] shadow-2xs'
                            : 'bg-white text-[#37352F] border-[#D3D1CB] hover:bg-[#EFEFED]'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2 Controls: Door / Double-Door / Window Inspector */}
              {step === 2 && (
                <div className="p-3 rounded-lg bg-[#F7F7F5] border border-[#E9E9E7] flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-[#37352F]">
                    <strong>2단계:</strong> 도면 위의{' '}
                    <span className="text-emerald-700 font-bold">초록(문)</span> ·{' '}
                    <span className="text-sky-700 font-bold">파랑(창문)</span> ·{' '}
                    <span className="text-slate-600 font-bold">회색 점선(빈틈)</span>을 클릭해 문 종류와 열림 방향을 맞추세요.
                  </div>
                  {activeOpObj ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() =>
                          cycleSelectedOpeningSwing(
                            selectedOp!.wallId,
                            selectedOp!.opId
                          )
                        }
                        className="px-2.5 py-1 rounded bg-[#2383E2] text-white text-xs font-semibold flex items-center gap-1"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                        방향 회전 ({activeOpObj.swing})
                      </button>
                      <button
                        onClick={() =>
                          updateSelectedOpening({
                            type: 'door',
                            swing:
                              activeOpObj.swing === 'out_double'
                                ? 'in_double'
                                : 'out_double',
                          })
                        }
                        className="px-2.5 py-1 rounded bg-indigo-600 text-white text-xs font-semibold"
                      >
                        양개문 (팬트리 양쪽 열림)
                      </button>
                      <button
                        onClick={() =>
                          updateSelectedOpening({ type: 'sliding_door' })
                        }
                        className="px-2 py-1 rounded bg-white border border-[#D3D1CB] text-xs font-semibold text-[#37352F]"
                      >
                        미닫이/중문
                      </button>
                      <button
                        onClick={() => updateSelectedOpening({ type: 'window' })}
                        className="px-2 py-1 rounded bg-sky-600 text-white text-xs font-semibold"
                      >
                        창문으로 변경
                      </button>
                      <button
                        onClick={() =>
                          updateSelectedOpening({
                            type: 'entrance',
                            swing: 'out_left',
                          })
                        }
                        className="px-2 py-1 rounded bg-emerald-700 text-white text-xs font-semibold"
                      >
                        현관문
                      </button>
                      <button
                        onClick={deleteSelectedOpening}
                        className="px-2 py-1 rounded bg-rose-600 text-white text-xs font-semibold"
                      >
                        벽으로 막기(삭제)
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-[#787774]">
                      문이나 창문을 클릭하면 여기서 양개문·방향·창문 전환이 가능합니다.
                    </span>
                  )}
                </div>
              )}

              {/* Step 3 Controls: Exact Millimeter Calibration & Plan Name */}
              {step === 3 && (
                <div className="p-3 rounded-lg bg-[#F7F7F5] border border-[#E9E9E7] flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-semibold text-[#787774]">
                      도면 이름:
                    </label>
                    <input
                      type="text"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="px-2.5 py-1 text-xs font-semibold bg-white border border-[#D3D1CB] rounded text-[#37352F]"
                    />
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-[#787774]">
                      빠른 면적 맞춤:
                    </span>
                    {[59, 74, 84, 99, 114].map((sq) => (
                      <button
                        key={sq}
                        onClick={() => {
                          pushUndo();
                          setTargetAreaSqm(sq);
                          const nonBalPx = rooms
                            .filter((r) => r.type !== 'balcony')
                            .reduce((s, r) => s + polyArea(r.poly), 0);
                          if (nonBalPx > 100) {
                            setMPerPx(Math.sqrt(sq / nonBalPx));
                          }
                        }}
                        className={`px-2 py-1 text-xs rounded border font-semibold ${
                          targetAreaSqm === sq
                            ? 'bg-[#2383E2] text-white border-[#2383E2]'
                            : 'bg-white border-[#D3D1CB] text-[#37352F]'
                        }`}
                      >
                        {sq}㎡
                      </button>
                    ))}
                  </div>

                  {calibWallId ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const w = walls.find((item) => item.id === calibWallId);
                        const mm = Number(calibMmInput);
                        if (w && mm >= 300) {
                          pushUndo();
                          const pxLen = Math.max(1, w.a2 - w.a1);
                          setMPerPx(mm / 1000 / pxLen);
                          setHintMsg(
                            `선택한 벽을 ${mm.toLocaleString()}mm로 맞춰 전체 도면 축척을 1:1 보정했습니다.`
                          );
                        }
                      }}
                      className="flex items-center gap-1.5"
                    >
                      <Ruler className="w-3.5 h-3.5 text-[#2383E2]" />
                      <span className="text-xs font-semibold text-[#37352F]">
                        선택 벽 실측(mm):
                      </span>
                      <input
                        type="number"
                        min={300}
                        max={25000}
                        value={calibMmInput}
                        onChange={(e) => setCalibMmInput(e.target.value)}
                        className="w-20 px-2 py-1 text-xs font-mono font-bold bg-white border border-[#2383E2] rounded"
                      />
                      <button
                        type="submit"
                        className="px-2.5 py-1 rounded bg-[#2383E2] text-white text-xs font-semibold"
                      >
                        축척 적용
                      </button>
                    </form>
                  ) : (
                    <span className="text-xs text-[#787774]">
                      도면의 빨간 벽을 클릭해 네이버 치수(예: 3000, 4000mm)를 입력하면 1:1 정밀 축척이 적용됩니다.
                    </span>
                  )}
                </div>
              )}

              {/* Main Interactive Wizard Canvas */}
              <div className="border border-[#E9E9E7] rounded-xl bg-white p-3 flex flex-col items-center justify-center min-h-[380px]">
                <canvas
                  ref={viewCanvasRef}
                  onClick={handleCanvasClick}
                  onMouseMove={(e) => {
                    const pt = toImgPt(e);
                    if (pt) setMousePt(pt);
                  }}
                  className="cursor-default rounded border border-[#EFEFED] shadow-xs"
                />
              </div>

              {/* Status & Hint Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE] text-xs text-[#1E40AF]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#2563EB] shrink-0" />
                  <span>{hintMsg}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewUrl(null);
                      setRooms([]);
                      setWalls([]);
                    }}
                    className="text-[11px] font-semibold text-[#1E40AF] hover:underline"
                  >
                    도면 검색으로 돌아가기
                  </button>
                  <label className="cursor-pointer text-[11px] font-semibold text-[#2563EB] hover:underline">
                    다른 도면 이미지 열기
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFile(file);
                      }}
                    />
                  </label>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-5 py-3 border-t border-[#E9E9E7] bg-[#FBFBFA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (step > 1) setStep((s) => ((s - 1) as 1 | 2 | 3));
                else onClose();
              }}
              className="flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-[#787774] hover:text-[#37352F]"
            >
              {step > 1 ? (
                <>
                  <ArrowLeft className="w-3.5 h-3.5" /> 이전 단계
                </>
              ) : (
                '취소'
              )}
            </button>

            {previewUrl && (
              <button
                onClick={handleWizardUndo}
                disabled={undoStack.length === 0}
                className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold border border-[#D3D1CB] bg-white text-[#37352F] hover:bg-[#EFEFED] disabled:opacity-35 transition"
                title="방금 한 작업 되돌리기"
              >
                <Undo2 className="w-3.5 h-3.5" />
                <span>실행 취소</span>
              </button>
            )}
          </div>

          {previewUrl && (
            <div className="flex items-center gap-2">
              {step === 1 && (
                <button
                  onClick={buildStep2FromRooms}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-[#2383E2] hover:bg-[#1a6ec2] text-white shadow-sm"
                >
                  <span>다음: 벽 · 문 · 창호 자동 생성</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              {step === 2 && (
                <button
                  onClick={() => setStep(3)}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-[#2383E2] hover:bg-[#1a6ec2] text-white shadow-sm"
                >
                  <span>다음: 치수 확인 및 완료</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
              {step === 3 && (
                <button
                  onClick={handleApplyAndSave}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>2D CAD · 3D 도면 적용 및 저장</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
