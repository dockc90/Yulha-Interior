import React, { useState } from 'react';
import { ClipboardPaste, ExternalLink, ImagePlus, Search, Upload, X } from 'lucide-react';
import { useDesignStore } from '../store/useDesignStore';

export const UnderlayPickerModal: React.FC<{ open: boolean; onClose: () => void }> = ({
  open,
  onClose,
}) => {
  const { setUnderlayUrl, underlayUrl, notify } = useDesignStore();
  const [query, setQuery] = useState('고덕자이 84B');

  if (!open) return null;

  const full = query.trim() || '고덕자이 84B';
  const complex = full.replace(/\s+\d{2,3}\s*[A-Za-z㎡평형타입]*$/i, '').trim() || full;

  const links = [
    { name: '네이버 부동산', url: `https://new.land.naver.com/search?sk=${encodeURIComponent(complex)}`, cls: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
    { name: '호갱노노', url: `https://hogangnono.com/search?q=${encodeURIComponent(complex)}`, cls: 'bg-indigo-50 border-indigo-200 text-indigo-800' },
    { name: '분양 홈페이지 검색', url: `https://search.naver.com/search.naver?query=${encodeURIComponent(`${full} 분양도면`)}`, cls: 'bg-sky-50 border-sky-200 text-sky-800' },
    { name: '네이버 이미지', url: `https://search.naver.com/search.naver?where=image&query=${encodeURIComponent(`${full} 평면도`)}`, cls: 'bg-[#F7F7F5] border-[#E9E9E7] text-[#37352F]' },
  ];

  const handleFile = (f: File) => {
    const r = new FileReader();
    r.onload = () => {
      if (typeof r.result === 'string') {
        setUnderlayUrl(r.result);
        notify('도면 이미지를 2D 밑그림으로 적용했습니다. 밑그림을 따라 방과 벽을 그려보세요.');
        onClose();
      }
    };
    r.readAsDataURL(f);
  };

  return (
    <div
      onPaste={(e) => {
        for (const item of e.clipboardData?.items || []) {
          if (item.type.startsWith('image/')) {
            const f = item.getAsFile();
            if (f) handleFile(f);
          }
        }
      }}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="w-full max-w-xl bg-white rounded-xl border border-[#E9E9E7] shadow-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E9E9E7] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImagePlus className="w-4 h-4 text-[#0F7B6C]" />
            <h2 className="text-sm font-bold">도면 밑그림 찾기 · 붙여넣기</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-[#EFEFED] text-[#787774]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-[#9B9A97] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="단지명 + 타입 입력 (예: 고덕자이 84B)"
              className="w-full pl-9 pr-3 py-2 text-xs border border-[#D3D1CB] focus:border-[#0F7B6C] rounded-lg outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {links.map((l) => (
              <a
                key={l.name}
                href={l.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => navigator.clipboard?.writeText(complex).catch(() => {})}
                className={`p-2.5 rounded-lg border text-xs font-bold flex items-center justify-between ${l.cls}`}
              >
                <span>{l.name}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ))}
          </div>

          <label className="cursor-pointer flex flex-col items-center justify-center gap-1.5 p-5 rounded-xl border-2 border-dashed border-[#D3D1CB] hover:border-[#0F7B6C] bg-[#FBFBFA] text-center">
            <ClipboardPaste className="w-5 h-5 text-[#0F7B6C]" />
            <div className="text-xs font-bold">
              캡처 후 <kbd className="px-1.5 py-0.5 bg-white border rounded">Ctrl + V</kbd> 붙여넣기
            </div>
            <div className="text-[11px] text-[#787774] flex items-center gap-1">
              <Upload className="w-3.5 h-3.5" /> 또는 파일 선택
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </label>

          {underlayUrl && (
            <button
              onClick={() => {
                setUnderlayUrl(null);
                onClose();
              }}
              className="w-full py-2 rounded-lg bg-red-50 text-red-600 text-xs font-semibold"
            >
              현재 밑그림 제거
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
