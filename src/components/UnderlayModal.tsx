import React, { useState } from 'react';
import { Loader2, Search, Upload, X } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

export const UnderlayModal: React.FC<Props> = ({ open, onClose }) => {
  const { setUnderlayImage, underlayImage, underlayOpacity, setUnderlayOpacity, notify } =
    useProjectStore();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{ thumbUrl: string; title: string }[]>([]);

  if (!open) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/naver/image-search?q=${encodeURIComponent(q + ' 아파트 평면도')}`
      );
      const data = await res.json();
      setResults(data.items || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-xl border border-[#E9E9E7] shadow-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[#E9E9E7] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#37352F]">2D 도면 밑그림 불러오기</h2>
            <p className="text-[11px] text-[#787774]">
              검색하거나 업로드한 평면도를 2D 바닥에 깔아두고 벽과 가구를 실제와 똑같이 그릴 수 있습니다.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-[#EFEFED] text-[#787774]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#9B9A97] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="아파트 단지명 + 평형 입력 (예: 래미안 원베일리 84A)"
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#D3D1CB] focus:border-[#0F7B6C] rounded-lg outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-[#37352F] hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>검색</span>
            </button>
          </form>

          {results.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto">
              {results.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setUnderlayImage(item.thumbUrl);
                    notify('선택한 도면을 2D 밑그림으로 적용했습니다.');
                    onClose();
                  }}
                  className="border border-[#E9E9E7] hover:border-[#0F7B6C] rounded-lg overflow-hidden bg-[#FBFBFA] p-1 text-left"
                >
                  <img src={item.thumbUrl} alt={item.title} className="w-full h-24 object-contain" />
                  <div className="text-[10px] truncate pt-1 text-[#37352F]">{item.title}</div>
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-lg bg-[#F7F7F5] border border-[#E9E9E7] text-xs">
            <label className="cursor-pointer px-3 py-1.5 rounded-md bg-white border border-[#D3D1CB] hover:bg-[#EFEFED] font-semibold flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span>내 PC 이미지 업로드</span>
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

            {underlayImage && (
              <div className="flex items-center gap-2">
                <span className="text-[#787774]">밑그림 투명도</span>
                <input
                  type="range"
                  min={10}
                  max={90}
                  value={Math.round(underlayOpacity * 100)}
                  onChange={(e) => setUnderlayOpacity(Number(e.target.value) / 100)}
                  className="w-24 accent-[#0F7B6C]"
                />
                <button
                  onClick={() => {
                    setUnderlayImage(null);
                    onClose();
                  }}
                  className="px-2 py-1 rounded bg-red-50 text-red-600 font-semibold"
                >
                  밑그림 제거
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
