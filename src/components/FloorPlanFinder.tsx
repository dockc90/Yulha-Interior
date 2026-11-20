import React, { useState } from 'react';
import { ClipboardPaste, ExternalLink, Search, Upload } from 'lucide-react';

interface Props {
  onApplyImage: (dataUrl: string) => void;
}

function splitComplexAndType(raw: string): { complex: string; full: string } {
  const full = raw.trim() || '고덕자이 84B';
  const complex = full.replace(/\s+\d{2,3}\s*[A-Za-z㎡평형타입]*$/i, '').trim();
  return { complex: complex || full, full };
}

export const FloorPlanFinder: React.FC<Props> = ({ onApplyImage }) => {
  const [query, setQuery] = useState('고덕자이 84B');
  const { complex, full } = splitComplexAndType(query);

  const platforms = [
    {
      name: '네이버 부동산',
      desc: `'${complex}' 단지정보 → 평면도`,
      color: 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100',
      url: `https://new.land.naver.com/search?sk=${encodeURIComponent(complex)}`,
    },
    {
      name: '호갱노노',
      desc: `'${complex}' 평면도·확장형`,
      color: 'bg-indigo-50 border-indigo-200 text-indigo-800 hover:bg-indigo-100',
      url: `https://hogangnono.com/search?q=${encodeURIComponent(complex)}`,
    },
    {
      name: '직방',
      desc: `아파트 지도 열기 (단지명 자동복사)`,
      color: 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100',
      url: `https://www.zigbang.com/home/apt`,
      copyOnClick: true,
    },
    {
      name: '네이버 이미지',
      desc: `'${full} 평면도' 검색`,
      color: 'bg-[#F7F7F5] border-[#E9E9E7] text-[#37352F] hover:bg-[#EFEFED]',
      url: `https://search.naver.com/search.naver?where=image&query=${encodeURIComponent(`${full} 평면도`)}`,
    },
    {
      name: '구글 이미지',
      desc: `'${full} 평면도' 고해상도`,
      color: 'bg-[#F7F7F5] border-[#E9E9E7] text-[#37352F] hover:bg-[#EFEFED]',
      url: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${full} 평면도`)}`,
    },
  ];

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onApplyImage(reader.result);
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
      className="space-y-4"
    >
      {/* 1. Complex + Type Input */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-[#9B9A97] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="아파트 단지명 + 타입 입력 (예: 고덕자이 84B, 래미안 원베일리 84A)"
            className="w-full pl-9 pr-3 py-2.5 text-xs bg-white border border-[#D3D1CB] focus:border-[#0F7B6C] rounded-lg outline-none font-medium"
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

      {/* 2. Platform Links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {platforms.map((p) => (
          <a
            key={p.name}
            href={p.url}
            target="_blank"
            rel="noreferrer"
            onClick={() => {
              navigator.clipboard?.writeText(complex).catch(() => {});
            }}
            className={`p-2.5 rounded-lg border transition flex items-center justify-between gap-2 ${p.color}`}
          >
            <div className="min-w-0">
              <div className="text-xs font-bold truncate">{p.name}</div>
              <div className="text-[10px] opacity-80 truncate">{p.desc}</div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 shrink-0 opacity-75" />
          </a>
        ))}
      </div>

      {/* 3. Paste / Drop / Upload */}
      <label className="cursor-pointer flex flex-col items-center justify-center gap-1.5 p-5 rounded-xl border-2 border-dashed border-[#D3D1CB] hover:border-[#0F7B6C] bg-[#FBFBFA] hover:bg-[#F3FAF8] transition text-center">
        <div className="w-9 h-9 rounded-full bg-[#DDEDEA] text-[#0F7B6C] flex items-center justify-center">
          <ClipboardPaste className="w-4 h-4" />
        </div>
        <div className="text-xs font-bold text-[#37352F]">
          찾은 도면을 캡처(Win+Shift+S) 후 <kbd className="px-1.5 py-0.5 bg-white border border-[#D3D1CB] rounded">Ctrl + V</kbd> 로 바로 붙여넣기
        </div>
        <div className="text-[11px] text-[#787774] flex items-center gap-1">
          <Upload className="w-3.5 h-3.5" />
          <span>또는 이미지를 끌어다 놓거나 클릭해서 파일 선택</span>
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
  );
};
