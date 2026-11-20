import React, { useState } from 'react';
import { ClipboardPaste, ExternalLink, ImagePlus, Search, Upload, X } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

function splitComplexAndType(raw: string): { complex: string; full: string } {
  const full = raw.trim() || '고덕자이 84B';
  // Extract complex name without trailing type like 84A, 84B, 59㎡, 34평
  const complex = full
    .replace(/\s+\d{2,3}\s*[A-Za-z㎡평형타입]*$/i, '')
    .trim();
  return { complex: complex || full, full };
}

export const UnderlayModal: React.FC<Props> = ({ open, onClose }) => {
  const { setUnderlayImage, underlayImage, underlayOpacity, setUnderlayOpacity, notify } =
    useProjectStore();
  const [query, setQuery] = useState('고덕자이 84B');

  if (!open) return null;

  const { complex, full } = splitComplexAndType(query);

  const platforms = [
    {
      name: '네이버 부동산 (단지 검색)',
      desc: `'${complex}' 단지정보 → 평면도/타입 탭`,
      color: 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100',
      badge: 'NAVER',
      url: `https://new.land.naver.com/search?sk=${encodeURIComponent(complex)}`,
    },
    {
      name: '호갱노노',
      desc: `'${complex}' 아파트 평면도·확장형 확인`,
      color: 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100',
      badge: 'HOGANG',
      url: `https://hogangnono.com/search?q=${encodeURIComponent(complex)}`,
    },
    {
      name: '직방',
      desc: `'${complex}' 단지·타입별 평면도 보기`,
      color: 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100',
      badge: 'ZIGBANG',
      url: `https://www.zigbang.com/home/apt/search?q=${encodeURIComponent(complex)}`,
    },
    {
      name: '네이버 이미지 (평면도)',
      desc: `'${full} 평면도' 이미지 바로 찾기`,
      color: 'bg-[#F7F7F5] border-[#E9E9E7] text-[#37352F] hover:bg-[#EFEFED]',
      badge: 'IMG',
      url: `https://search.naver.com/search.naver?where=image&query=${encodeURIComponent(
        `${full} 평면도`
      )}`,
    },
    {
      name: '구글 이미지 (평면도)',
      desc: `'${full} 평면도' 고해상도 검색`,
      color: 'bg-[#F7F7F5] border-[#E9E9E7] text-[#37352F] hover:bg-[#EFEFED]',
      badge: 'GOOGLE',
      url: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${full} 평면도`)}`,
    },
  ];

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUnderlayImage(reader.result);
        notify('도면 이미지를 2D 밑그림으로 적용했습니다.');
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const f = item.getAsFile();
        if (f) {
          handleFile(f);
          break;
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith('image/')) {
      handleFile(f);
    }
  };

  return (
    <div
      onPaste={handlePaste}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="w-full max-w-2xl bg-white rounded-xl border border-[#E9E9E7] shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-5 py-3.5 border-b border-[#E9E9E7] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImagePlus className="w-4 h-4 text-[#0F7B6C]" />
            <div>
              <h2 className="text-sm font-bold text-[#37352F]">
                도면 찾기 · 캡처 붙여넣기 (2D 밑그림)
              </h2>
              <p className="text-[11px] text-[#787774]">
                단지/타입을 입력해 공식 사이트에서 도면을 확인한 뒤, 스샷(Win+Shift+S) 또는 이미지 복사 후 <b>Ctrl + V</b>로 바로 넣으세요.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-[#EFEFED] text-[#787774]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Step 1: Complex + Type Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#37352F] block">
              1. 찾으려는 아파트 단지명과 타입 입력
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#9B9A97] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="예: 고덕자이 84B, 올림픽파크포레온 84A, 래미안 원베일리 84A"
                className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-[#D3D1CB] focus:border-[#0F7B6C] rounded-lg outline-none font-medium"
                autoFocus
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
              <span className="text-[#787774]">빠른 입력:</span>
              {['고덕자이 84B', '올림픽파크포레온 84A', '고덕그라시움 84A', '래미안 원베일리 84A'].map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setQuery(ex)}
                  className="px-2 py-0.5 rounded bg-[#F7F7F5] hover:bg-[#EFEFED] border border-[#E9E9E7] text-[#37352F]"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Direct Platform Links */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-[#37352F]">
              2. 도면 페이지 바로 열기 (클릭 시 새 탭 이동)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {platforms.map((p) => (
                <a
                  key={p.name}
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`p-3 rounded-lg border transition flex items-center justify-between gap-2 ${p.color}`}
                >
                  <div className="min-w-0">
                    <div className="text-xs font-bold flex items-center gap-1.5">
                      <span>{p.name}</span>
                    </div>
                    <div className="text-[10px] opacity-80 truncate mt-0.5">{p.desc}</div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-75" />
                </a>
              ))}
            </div>
          </div>

          {/* Step 3: Paste / Drop / Upload Zone */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-[#37352F]">
              3. 찾은 도면 붙여넣기 (Ctrl + V) 또는 업로드
            </div>
            <label className="cursor-pointer flex flex-col items-center justify-center gap-2 p-6 rounded-xl border-2 border-dashed border-[#D3D1CB] hover:border-[#0F7B6C] bg-[#FBFBFA] hover:bg-[#F3FAF8] transition text-center">
              <div className="w-10 h-10 rounded-full bg-[#DDEDEA] text-[#0F7B6C] flex items-center justify-center">
                <ClipboardPaste className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-[#37352F]">
                여기에서 <kbd className="px-1.5 py-0.5 bg-white border border-[#D3D1CB] rounded">Ctrl + V</kbd> 로 캡처 이미지 붙여넣기
              </div>
              <div className="text-[11px] text-[#787774] flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                <span>또는 이미지를 드래그하거나 클릭해 파일 선택</span>
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
          </div>

          {/* Underlay Opacity / Remove */}
          {underlayImage && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-[#F7F7F5] border border-[#E9E9E7] text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#37352F]">현재 밑그림 투명도</span>
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
