import React, { useEffect, useRef, useState } from 'react';
import { Check, Crop, FlipHorizontal2, RotateCcw, RotateCw, Sparkles, X } from 'lucide-react';

interface Props {
  imageSrc: string | null;
  onClose: () => void;
  onConfirm: (editedDataUrl: string, autoVectorize: boolean) => void;
}

interface CropBox {
  x: number; // 0..1
  y: number;
  w: number;
  h: number;
}

export const ImagePrepModal: React.FC<Props> = ({ imageSrc, onClose, onConfirm }) => {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [rotationDeg, setRotationDeg] = useState(0);
  const [flipX, setFlipX] = useState(false);
  const [contrast, setContrast] = useState(115);
  const [crop, setCrop] = useState<CropBox>({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
  const [imgSize, setImgSize] = useState<{ w: number; h: number }>({ w: 800, h: 600 });

  const dragRef = useRef<{
    mode: 'move' | 'nw' | 'se';
    sx: number;
    sy: number;
    start: CropBox;
  } | null>(null);

  useEffect(() => {
    if (!imageSrc) return;
    setRotationDeg(0);
    setFlipX(false);
    setContrast(115);
    setCrop({ x: 0.04, y: 0.04, w: 0.92, h: 0.92 });
    const im = new Image();
    im.onload = () => setImgSize({ w: im.naturalWidth || 800, h: im.naturalHeight || 600 });
    im.src = imageSrc;
  }, [imageSrc]);

  if (!imageSrc) return null;

  const isRotatedOdd = Math.abs(rotationDeg % 180) === 90;
  const dispW = isRotatedOdd ? imgSize.h : imgSize.w;
  const dispH = isRotatedOdd ? imgSize.w : imgSize.h;

  const startDrag = (mode: 'move' | 'nw' | 'se', e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { mode, sx: e.clientX, sy: e.clientY, start: { ...crop } };
  };

  const onMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    const st = stageRef.current;
    if (!d || !st) return;
    const rect = st.getBoundingClientRect();
    const dx = (e.clientX - d.sx) / rect.width;
    const dy = (e.clientY - d.sy) / rect.height;

    if (d.mode === 'move') {
      setCrop({
        ...d.start,
        x: Math.max(0, Math.min(1 - d.start.w, d.start.x + dx)),
        y: Math.max(0, Math.min(1 - d.start.h, d.start.y + dy)),
      });
    } else if (d.mode === 'se') {
      setCrop({
        ...d.start,
        w: Math.max(0.08, Math.min(1 - d.start.x, d.start.w + dx)),
        h: Math.max(0.08, Math.min(1 - d.start.y, d.start.h + dy)),
      });
    } else if (d.mode === 'nw') {
      const nx = Math.max(0, Math.min(d.start.x + d.start.w - 0.08, d.start.x + dx));
      const ny = Math.max(0, Math.min(d.start.y + d.start.h - 0.08, d.start.y + dy));
      setCrop({
        x: nx,
        y: ny,
        w: d.start.x + d.start.w - nx,
        h: d.start.y + d.start.h - ny,
      });
    }
  };

  const onUp = () => {
    dragRef.current = null;
  };

  const exportCropped = (autoVectorize: boolean) => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => {
      // 1) Render rotated + flipped + contrasted full canvas
      const full = document.createElement('canvas');
      full.width = dispW;
      full.height = dispH;
      const fctx = full.getContext('2d')!;
      fctx.fillStyle = '#ffffff';
      fctx.fillRect(0, 0, dispW, dispH);
      fctx.save();
      fctx.translate(dispW / 2, dispH / 2);
      fctx.rotate((rotationDeg * Math.PI) / 180);
      fctx.scale(flipX ? -1 : 1, 1);
      fctx.filter = `contrast(${contrast}%)`;
      fctx.drawImage(im, -im.naturalWidth / 2, -im.naturalHeight / 2);
      fctx.restore();

      // 2) Extract cropped region
      const sx = Math.round(crop.x * dispW);
      const sy = Math.round(crop.y * dispH);
      const sw = Math.max(40, Math.round(crop.w * dispW));
      const sh = Math.max(40, Math.round(crop.h * dispH));
      const out = document.createElement('canvas');
      out.width = sw;
      out.height = sh;
      const octx = out.getContext('2d')!;
      octx.drawImage(full, sx, sy, sw, sh, 0, 0, sw, sh);
      onConfirm(out.toDataURL('image/png'), autoVectorize);
    };
    im.src = imageSrc;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-white rounded-xl border border-[#E9E9E7] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#E9E9E7] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crop className="w-4 h-4 text-[#0F7B6C]" />
            <div>
              <h2 className="text-sm font-bold text-[#37352F]">도면 이미지 자르기 · 보정 편집</h2>
              <p className="text-[11px] text-[#787774]">
                불필요한 여백·제목·다른 타입을 잘라내고 필요한 평면도 영역만 선택해 2D CAD 도면으로 변환하세요.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-[#EFEFED] text-[#787774]">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-2.5 bg-[#F7F7F5] border-b border-[#E9E9E7] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setRotationDeg((d) => (d - 90 + 360) % 360)}
              className="px-2.5 py-1.5 rounded-md bg-white border border-[#D3D1CB] hover:bg-[#EFEFED] font-semibold flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>90° 좌회전</span>
            </button>
            <button
              type="button"
              onClick={() => setRotationDeg((d) => (d + 90) % 360)}
              className="px-2.5 py-1.5 rounded-md bg-white border border-[#D3D1CB] hover:bg-[#EFEFED] font-semibold flex items-center gap-1"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>90° 우회전</span>
            </button>
            <button
              type="button"
              onClick={() => setFlipX((v) => !v)}
              className={`px-2.5 py-1.5 rounded-md border font-semibold flex items-center gap-1 ${
                flipX
                  ? 'bg-[#EBF5FF] text-[#2383E2] border-[#BFE0FF]'
                  : 'bg-white border-[#D3D1CB] hover:bg-[#EFEFED]'
              }`}
            >
              <FlipHorizontal2 className="w-3.5 h-3.5" />
              <span>좌우반전</span>
            </button>
            <button
              type="button"
              onClick={() => setCrop({ x: 0, y: 0, w: 1, h: 1 })}
              className="px-2.5 py-1.5 rounded-md bg-white border border-[#D3D1CB] hover:bg-[#EFEFED] font-semibold"
            >
              전체 선택
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#787774] font-medium">벽선 대비</span>
            <input
              type="range"
              min={80}
              max={180}
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-24 accent-[#0F7B6C]"
            />
            <span className="w-10 text-right font-mono text-[#37352F]">{contrast}%</span>
          </div>
        </div>

        {/* Crop Canvas Stage */}
        <div className="flex-1 overflow-auto bg-[#ECEBE6] p-5 flex items-center justify-center">
          <div
            ref={stageRef}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            className="relative bg-white shadow-md select-none overflow-hidden"
            style={{
              width: '100%',
              maxWidth: `min(740px, ${Math.round(440 * (dispW / Math.max(1, dispH)))}px)`,
              aspectRatio: `${dispW} / ${dispH}`,
            }}
          >
            <img
              src={imageSrc}
              alt="편집할 도면"
              draggable={false}
              className="w-full h-full object-contain pointer-events-none"
              style={{
                filter: `contrast(${contrast}%)`,
                transform: `rotate(${rotationDeg}deg) scaleX(${flipX ? -1 : 1})`,
              }}
            />

            {/* Darkened outside mask */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                boxShadow: 'inset 0 0 0 9999px rgba(0,0,0,0.28)',
                clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% ${crop.y * 100}%, ${crop.x * 100}% ${crop.y * 100}%, ${crop.x * 100}% ${(crop.y + crop.h) * 100}%, ${(crop.x + crop.w) * 100}% ${(crop.y + crop.h) * 100}%, ${(crop.x + crop.w) * 100}% ${crop.y * 100}%, 0% ${crop.y * 100}%)`,
              }}
            />

            {/* Crop Selection Box */}
            <div
              onPointerDown={(e) => startDrag('move', e)}
              style={{
                left: `${crop.x * 100}%`,
                top: `${crop.y * 100}%`,
                width: `${crop.w * 100}%`,
                height: `${crop.h * 100}%`,
              }}
              className="absolute border-2 border-[#0F7B6C] cursor-move"
            >
              {/* Corner handles */}
              <div
                onPointerDown={(e) => startDrag('nw', e)}
                className="absolute -left-2 -top-2 w-4 h-4 rounded-full bg-[#0F7B6C] border-2 border-white cursor-nwse-resize shadow"
              />
              <div
                onPointerDown={(e) => startDrag('se', e)}
                className="absolute -right-2 -bottom-2 w-4 h-4 rounded-full bg-[#0F7B6C] border-2 border-white cursor-nwse-resize shadow"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#E9E9E7] bg-white flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold text-[#787774] hover:bg-[#EFEFED]"
          >
            취소
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => exportCropped(false)}
              className="px-3.5 py-2 rounded-lg border border-[#D3D1CB] hover:bg-[#EFEFED] text-xs font-semibold text-[#37352F] flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              <span>변환 없이 밑그림만 깔기</span>
            </button>
            <button
              type="button"
              onClick={() => exportCropped(true)}
              className="px-4 py-2 rounded-lg bg-[#0F7B6C] hover:bg-[#0c6357] text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>이 영역으로 2D CAD 도면 변환 →</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
