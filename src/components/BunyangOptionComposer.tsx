import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Layers, Move, RotateCcw, Scissors } from 'lucide-react';

interface Props {
  baseImageUrl: string;
  baseTitle: string;
  optionImageUrl: string;
  optionTitle: string;
  onBackToOptionSearch: () => void;
  onConfirmComposite: (compositedDataUrl: string) => void;
}

interface BoxNorm {
  x: number; // 0..1 relative to base image width
  y: number; // 0..1 relative to base image height
  w: number; // 0..1
  h: number; // 0..1
}

interface CropPct {
  top: number; // 0..40 (%)
  right: number;
  bottom: number;
  left: number;
}

function loadImg(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`이미지 로드 실패: ${src}`));
    img.src = src;
  });
}

export const BunyangOptionComposer: React.FC<Props> = ({
  baseImageUrl,
  baseTitle,
  optionImageUrl,
  optionTitle,
  onBackToOptionSearch,
  onConfirmComposite,
}) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [baseSize, setBaseSize] = useState<{ w: number; h: number }>({ w: 800, h: 600 });
  const [optAspect, setOptAspect] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Normalized overlay box on top of base image
  const [box, setBox] = useState<BoxNorm>({ x: 0.25, y: 0.2, w: 0.45, h: 0.45 });
  const [lockAspect, setLockAspect] = useState<boolean>(true);
  const [previewOpacity, setPreviewOpacity] = useState<number>(80);
  const [solidOverwrite, setSolidOverwrite] = useState<boolean>(true);
  const [crop, setCrop] = useState<CropPct>({ top: 0, right: 0, bottom: 0, left: 0 });
  const [showCropPanel, setShowCropPanel] = useState<boolean>(false);
  const [compositing, setCompositing] = useState<boolean>(false);

  const dragRef = useRef<{
    mode: 'move' | 'resize';
    startX: number;
    startY: number;
    startBox: BoxNorm;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setErrorMsg(null);
    Promise.all([loadImg(baseImageUrl), loadImg(optionImageUrl)])
      .then(([bImg, oImg]) => {
        if (cancelled) return;
        const bw = bImg.naturalWidth || 800;
        const bh = bImg.naturalHeight || 600;
        const ow = oImg.naturalWidth || 400;
        const oh = oImg.naturalHeight || 400;
        setBaseSize({ w: bw, h: bh });
        const aspect = ow / Math.max(1, oh);
        setOptAspect(aspect);

        // Initial centered box keeping option aspect relative to base image
        const initW = 0.45;
        const baseAspect = bw / Math.max(1, bh);
        const initH = Math.min(0.7, Math.max(0.15, (initW * baseAspect) / aspect));
        setBox({
          x: Math.max(0.02, (1 - initW) / 2),
          y: Math.max(0.02, (1 - initH) / 2),
          w: initW,
          h: initH,
        });
        setLoading(false);
      })
      .catch((err) => {
        if (!cancelled) {
          setErrorMsg(err?.message || '도면 이미지를 불러오지 못했습니다.');
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [baseImageUrl, optionImageUrl]);

  const effectiveAspect = (() => {
    const cw = Math.max(10, 100 - crop.left - crop.right);
    const ch = Math.max(10, 100 - crop.top - crop.bottom);
    return optAspect * (cw / ch);
  })();

  const handlePointerDown = (mode: 'move' | 'resize', e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      startBox: { ...box },
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!drag || !stage) return;
    const rect = stage.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dx = (e.clientX - drag.startX) / rect.width;
    const dy = (e.clientY - drag.startY) / rect.height;

    if (drag.mode === 'move') {
      setBox({
        ...drag.startBox,
        x: Math.max(-0.2, Math.min(1.1 - drag.startBox.w, drag.startBox.x + dx)),
        y: Math.max(-0.2, Math.min(1.1 - drag.startBox.h, drag.startBox.y + dy)),
      });
    } else {
      const nextW = Math.max(0.06, Math.min(1.2, drag.startBox.w + dx));
      let nextH = Math.max(0.06, Math.min(1.2, drag.startBox.h + dy));
      if (lockAspect) {
        const baseAspect = baseSize.w / Math.max(1, baseSize.h);
        nextH = (nextW * baseAspect) / Math.max(0.1, effectiveAspect);
      }
      setBox({
        ...drag.startBox,
        w: nextW,
        h: nextH,
      });
    }
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const handleConfirm = async () => {
    setCompositing(true);
    try {
      const [bImg, oImg] = await Promise.all([loadImg(baseImageUrl), loadImg(optionImageUrl)]);
      const bw = bImg.naturalWidth || baseSize.w;
      const bh = bImg.naturalHeight || baseSize.h;
      const ow = oImg.naturalWidth || 400;
      const oh = oImg.naturalHeight || 400;

      const canvas = document.createElement('canvas');
      canvas.width = bw;
      canvas.height = bh;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 초기화 실패');

      // 1) Draw base type floor plan
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, bw, bh);
      ctx.drawImage(bImg, 0, 0, bw, bh);

      // 2) Draw cropped option floor plan onto the chosen region
      const sx = (crop.left / 100) * ow;
      const sy = (crop.top / 100) * oh;
      const sw = Math.max(10, ((100 - crop.left - crop.right) / 100) * ow);
      const sh = Math.max(10, ((100 - crop.top - crop.bottom) / 100) * oh);

      const dx = box.x * bw;
      const dy = box.y * bh;
      const dw = box.w * bw;
      const dh = box.h * bh;

      ctx.save();
      if (solidOverwrite) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(dx, dy, dw, dh);
        ctx.globalAlpha = 1;
      } else {
        ctx.globalAlpha = previewOpacity / 100;
      }
      ctx.drawImage(oImg, sx, sy, sw, sh, dx, dy, dw, dh);
      ctx.restore();

      const dataUrl = canvas.toDataURL('image/png');
      onConfirmComposite(dataUrl);
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : '옵션 도면 합성 중 오류가 발생했습니다.'
      );
    } finally {
      setCompositing(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header info & actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-[#EFF6FF] border border-[#BFDBFE]">
        <div className="text-xs text-[#1E40AF]">
          <div className="font-bold flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#2383E2]" />
            <span>3단계: 타입 도면 베이스 위에 옵션 도면 영역 맞추기</span>
          </div>
          <div className="text-[11px] mt-0.5 text-[#1E3A8A]">
            파란 박스를 <b>드래그해 이동</b>하고, 우측 하단 모서리로 <b>크기를 조절</b>해 타입 도면의 해당 위치에 겹쳐 주세요.
          </div>
        </div>
        <button
          type="button"
          onClick={onBackToOptionSearch}
          className="px-2.5 py-1.5 rounded-md bg-white border border-[#BFDBFE] text-xs font-semibold text-[#1E40AF] hover:bg-[#DBEAFE] flex items-center gap-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          옵션 도면 다시 고르기
        </button>
      </div>

      {/* Controls bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2 rounded-lg bg-[#FBFBFA] border border-[#E9E9E7] text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <span className="text-[#787774] font-medium">미리보기 투명도</span>
            <input
              type="range"
              min={25}
              max={100}
              value={previewOpacity}
              onChange={(e) => setPreviewOpacity(Number(e.target.value))}
              className="w-24 accent-[#2383E2]"
            />
            <span className="w-8 text-right font-semibold text-[#37352F]">{previewOpacity}%</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-[#37352F]">
            <input
              type="checkbox"
              checked={lockAspect}
              onChange={(e) => setLockAspect(e.target.checked)}
              className="accent-[#2383E2]"
            />
            <span>비율 유지</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-[#37352F]">
            <input
              type="checkbox"
              checked={solidOverwrite}
              onChange={(e) => setSolidOverwrite(e.target.checked)}
              className="accent-[#2383E2]"
            />
            <span>적용 시 기존 도면 위 덮어쓰기</span>
          </label>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowCropPanel((v) => !v)}
            className={`px-2.5 py-1 rounded border text-xs font-semibold flex items-center gap-1 ${
              showCropPanel
                ? 'bg-[#37352F] text-white border-[#37352F]'
                : 'bg-white text-[#37352F] border-[#D3D1CB] hover:bg-[#EFEFED]'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            옵션 여백 자르기
          </button>
          <button
            type="button"
            onClick={() => {
              setCrop({ top: 0, right: 0, bottom: 0, left: 0 });
              const baseAspect = baseSize.w / Math.max(1, baseSize.h);
              const initW = 0.45;
              const initH = Math.min(0.7, Math.max(0.15, (initW * baseAspect) / optAspect));
              setBox({
                x: Math.max(0.02, (1 - initW) / 2),
                y: Math.max(0.02, (1 - initH) / 2),
                w: initW,
                h: initH,
              });
            }}
            className="px-2.5 py-1 rounded border border-[#D3D1CB] bg-white hover:bg-[#EFEFED] text-xs font-semibold text-[#37352F] flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            위치 초기화
          </button>
        </div>
      </div>

      {/* Optional crop sliders */}
      {showCropPanel && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-2.5 rounded-lg bg-[#F7F7F5] border border-[#E9E9E7] text-[11px]">
          {(['top', 'bottom', 'left', 'right'] as const).map((side) => {
            const labelMap = { top: '위쪽 자르기', bottom: '아래쪽 자르기', left: '왼쪽 자르기', right: '오른쪽 자르기' };
            return (
              <label key={side} className="flex flex-col gap-1">
                <div className="flex justify-between text-[#37352F] font-medium">
                  <span>{labelMap[side]}</span>
                  <span>{crop[side]}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={40}
                  value={crop[side]}
                  onChange={(e) =>
                    setCrop((prev) => ({ ...prev, [side]: Number(e.target.value) }))
                  }
                  className="accent-[#2383E2]"
                />
              </label>
            );
          })}
        </div>
      )}

      {errorMsg && (
        <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700">
          {errorMsg}
        </div>
      )}

      {/* Interactive alignment stage */}
      <div className="flex justify-center bg-[#F3F2EF] border border-[#E9E9E7] rounded-xl p-3 overflow-hidden">
        {loading ? (
          <div className="py-16 text-xs text-[#787774]">도면 이미지를 불러오는 중...</div>
        ) : (
          <div
            ref={stageRef}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative select-none shadow-sm bg-white overflow-hidden"
            style={{
              width: '100%',
              maxWidth: `min(720px, ${Math.round(420 * (baseSize.w / Math.max(1, baseSize.h)))}px)`,
              aspectRatio: `${baseSize.w} / ${baseSize.h}`,
            }}
          >
            {/* Base type floor plan */}
            <img
              src={baseImageUrl}
              alt={baseTitle}
              draggable={false}
              className="w-full h-full object-fill pointer-events-none"
            />

            {/* Draggable & resizable option overlay */}
            <div
              onPointerDown={(e) => handlePointerDown('move', e)}
              style={{
                left: `${box.x * 100}%`,
                top: `${box.y * 100}%`,
                width: `${box.w * 100}%`,
                height: `${box.h * 100}%`,
                opacity: previewOpacity / 100,
              }}
              className="absolute border-2 border-[#2383E2] bg-white/70 cursor-move shadow-md group"
            >
              {/* Cropped preview */}
              <div className="w-full h-full overflow-hidden relative">
                <img
                  src={optionImageUrl}
                  alt={optionTitle}
                  draggable={false}
                  className="max-w-none pointer-events-none"
                  style={{
                    width: `${(100 / Math.max(10, 100 - crop.left - crop.right)) * 100}%`,
                    height: `${(100 / Math.max(10, 100 - crop.top - crop.bottom)) * 100}%`,
                    marginLeft: `-${(crop.left / Math.max(10, 100 - crop.left - crop.right)) * 100}%`,
                    marginTop: `-${(crop.top / Math.max(10, 100 - crop.top - crop.bottom)) * 100}%`,
                  }}
                />
              </div>

              {/* Top badge */}
              <div className="absolute -top-5 left-0 px-1.5 py-0.5 rounded bg-[#2383E2] text-white text-[10px] font-semibold flex items-center gap-1 whitespace-nowrap pointer-events-none">
                <Move className="w-2.5 h-2.5" />
                옵션 영역 ({optionTitle.slice(0, 16) || '옵션 도면'})
              </div>

              {/* Bottom-right resize handle */}
              <div
                onPointerDown={(e) => handlePointerDown('resize', e)}
                title="드래그해 크기 조절"
                className="absolute -right-2 -bottom-2 w-5 h-5 rounded-full bg-[#2383E2] border-2 border-white shadow cursor-nwse-resize flex items-center justify-center"
              >
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Confirm CTA */}
      <div className="flex items-center justify-between pt-1">
        <div className="text-[11px] text-[#787774]">
          베이스: <b className="text-[#37352F]">{baseTitle}</b> + 옵션:{' '}
          <b className="text-[#2383E2]">{optionTitle}</b>
        </div>
        <button
          type="button"
          disabled={loading || compositing}
          onClick={handleConfirm}
          className="px-4 py-2 rounded-lg bg-[#2383E2] hover:bg-[#1a6ec2] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
        >
          <Check className="w-4 h-4" />
          <span>{compositing ? '합성 중...' : '이 영역에 옵션 적용 후 마법사 시작 →'}</span>
        </button>
      </div>
    </div>
  );
};
