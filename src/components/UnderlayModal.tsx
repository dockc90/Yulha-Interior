import React from 'react';
import { ImagePlus, X } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';
import { FloorPlanFinder } from './FloorPlanFinder';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const UnderlayModal: React.FC<Props> = ({ open, onClose }) => {
  const { setUnderlayImage, underlayImage, underlayOpacity, setUnderlayOpacity, convertUnderlayTo2D, notify } =
    useProjectStore();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl border border-[#E9E9E7] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-5 py-3.5 border-b border-[#E9E9E7] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImagePlus className="w-4 h-4 text-[#0F7B6C]" />
            <div>
              <h2 className="text-sm font-bold text-[#37352F]">2D 도면 밑그림 교체 · 불러오기</h2>
              <p className="text-[11px] text-[#787774]">
                새 도면을 검색·캡처해 Ctrl + V로 붙여넣으면 현재 2D 캔버스 밑그림이 교체됩니다.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-[#EFEFED] text-[#787774]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <FloorPlanFinder
            onApplyImage={(dataUrl) => {
              convertUnderlayTo2D(dataUrl);
              onClose();
            }}
          />

          {underlayImage && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#F7F7F5] border border-[#E9E9E7] text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#37352F]">밑그림 투명도</span>
                <input
                  type="range"
                  min={10}
                  max={90}
                  value={Math.round(underlayOpacity * 100)}
                  onChange={(e) => setUnderlayOpacity(Number(e.target.value) / 100)}
                  className="w-28 accent-[#0F7B6C]"
                />
                <span className="text-[#787774]">{Math.round(underlayOpacity * 100)}%</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUnderlayImage(null);
                  notify('2D 밑그림을 제거했습니다.');
                  onClose();
                }}
                className="px-2.5 py-1 rounded bg-red-50 hover:bg-red-100 text-red-600 font-semibold"
              >
                밑그림 제거
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
