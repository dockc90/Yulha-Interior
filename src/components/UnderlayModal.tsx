import React, { useState } from 'react';
import { ExternalLink, Loader2, Search, Upload, X } from 'lucide-react';
import { useProjectStore } from '../store/useProjectStore';

interface Props {
  open: boolean;
  onClose: () => void;
}

type SearchScope = 'all' | 'naver_land' | 'bunyang' | 'type';

interface SearchResultItem {
  url: string;
  thumbUrl: string;
  title: string;
  score: number;
}

function scoreFloorPlanResult(title: string, query: string): number {
  const t = (title || '').toLowerCase();
  const qWords = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 2);
  let score = 0;
  qWords.forEach((w) => {
    if (t.includes(w)) score += 15;
  });
  if (t.includes('평면도')) score += 30;
  if (t.includes('도면')) score += 20;
  if (t.includes('확장')) score += 12;
  if (t.includes('타입') || t.includes('type')) score += 10;
  if (t.includes('bay') || t.includes('베이')) score += 8;
  if (/\d{2,3}[a-z㎡]/i.test(t)) score += 10;
  if (t.includes('조감도') || t.includes('전경') || t.includes('투시도') || t.includes('분양가')) {
    score -= 25;
  }
  return score;
}

export const UnderlayModal: React.FC<Props> = ({ open, onClose }) => {
  const { setUnderlayImage, underlayImage, underlayOpacity, setUnderlayOpacity, notify } =
    useProjectStore();
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<SearchScope>('all');
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<SearchResultItem[]>([]);

  if (!open) return null;

  const runSearch = async (rawQ: string, activeScope: SearchScope) => {
    const q = rawQ.trim();
    if (!q) return;
    setLoading(true);
    setSearched(true);

    const queries =
      activeScope === 'naver_land'
        ? [`${q} 네이버 부동산 평면도`, `${q} 네이버 평면도`]
        : activeScope === 'bunyang'
        ? [`${q} 분양 평면도 확장형`, `${q} 유상옵션 평면도`]
        : activeScope === 'type'
        ? [`${q} 타입 평면도`, `${q} 84 59 도면`]
        : [`${q} 평면도`, `${q} 아파트 도면`];

    try {
      const responses = await Promise.all(
        queries.map((subQ) =>
          fetch(`/api/naver/image-search?q=${encodeURIComponent(subQ)}`)
            .then((r) => r.json())
            .catch(() => ({ items: [] }))
        )
      );

      const seen = new Set<string>();
      const merged: SearchResultItem[] = [];
      responses.forEach((data) => {
        (data.items || []).forEach((item: { url: string; thumbUrl: string; title: string }) => {
          const key = item.url || item.thumbUrl;
          if (!key || seen.has(key)) return;
          seen.add(key);
          merged.push({
            url: item.url,
            thumbUrl: item.thumbUrl,
            title: item.title || q,
            score: scoreFloorPlanResult(item.title || '', q),
          });
        });
      });

      merged.sort((a, b) => b.score - a.score);
      setResults(merged);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(query, scope);
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

  return (
    <div
      onPaste={handlePaste}
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="w-full max-w-3xl bg-white rounded-xl border border-[#E9E9E7] shadow-xl overflow-hidden flex flex-col max-h-[88vh]">
        <div className="px-5 py-3.5 border-b border-[#E9E9E7] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#37352F]">2D 도면 밑그림 검색 · 불러오기</h2>
            <p className="text-[11px] text-[#787774]">
              평면도 우선 정렬 검색 또는 캡처(Ctrl+V)로 도면을 2D 캔버스 바닥에 깔아두고 그대로 그릴 수 있습니다.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-[#EFEFED] text-[#787774]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-3.5 overflow-y-auto">
          {/* Search Scope Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                ['all', '평면도 통합 검색'],
                ['naver_land', '네이버 부동산 도면'],
                ['bunyang', '분양 · 확장형 도면'],
                ['type', '타입별 도면'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setScope(id);
                  if (query.trim()) runSearch(query, id);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                  scope === id
                    ? 'bg-[#0F7B6C] text-white'
                    : 'bg-[#F7F7F5] text-[#787774] hover:text-[#37352F]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#9B9A97] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="아파트 단지명 + 평형 입력 (예: 래미안 원베일리 84A, 힐스테이트 84B)"
                className="w-full pl-9 pr-3 py-2 text-xs border border-[#D3D1CB] focus:border-[#0F7B6C] rounded-lg outline-none"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-lg bg-[#37352F] hover:bg-black text-white text-xs font-semibold flex items-center gap-1.5 shrink-0"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              <span>도면 검색</span>
            </button>
          </form>

          {/* Quick Example Queries */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="text-[#787774]">검색 예시:</span>
            {['래미안 원베일리 84A', '올림픽파크포레온 84A', '헬리오시티 84', '고덕그라시움 84A'].map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setQuery(ex);
                  runSearch(ex, scope);
                }}
                className="px-2 py-0.5 rounded bg-[#F7F7F5] hover:bg-[#EFEFED] border border-[#E9E9E7] text-[#37352F]"
              >
                {ex}
              </button>
            ))}
          </div>

          {/* Search Results */}
          {loading && (
            <div className="py-10 text-center text-xs text-[#787774] flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#0F7B6C]" />
              <span>평면도 이미지를 모아 정렬하는 중...</span>
            </div>
          )}

          {!loading && results.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-[#787774]">
                검색 결과 {results.length}건 (평면도 연관순 정렬 · 클릭하면 바로 밑그림에 적용됩니다)
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-64 overflow-y-auto p-0.5">
                {results.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setUnderlayImage(item.thumbUrl);
                      notify('선택한 도면을 2D 밑그림으로 적용했습니다.');
                      onClose();
                    }}
                    className="group border border-[#E9E9E7] hover:border-[#0F7B6C] rounded-lg overflow-hidden bg-[#FBFBFA] p-1.5 text-left transition hover:shadow-sm"
                  >
                    <div className="h-24 bg-white rounded flex items-center justify-center overflow-hidden">
                      <img
                        src={item.thumbUrl}
                        alt={item.title}
                        className="max-h-full max-w-full object-contain group-hover:scale-105 transition"
                      />
                    </div>
                    <div className="text-[10px] truncate pt-1.5 text-[#37352F] font-medium">
                      {item.title}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="p-4 rounded-lg bg-[#F7F7F5] border border-[#E9E9E7] text-center space-y-2 text-xs text-[#787774]">
              <div>검색 결과가 없습니다. 아래 버튼으로 네이버 부동산이나 이미지 검색에서 직접 캡처 후 <b>Ctrl+V</b>로 붙여넣어 보세요.</div>
            </div>
          )}

          {/* Upload / Paste / External Shortcuts */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-[#F7F7F5] border border-[#E9E9E7] text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <label className="cursor-pointer px-3 py-1.5 rounded-md bg-white border border-[#D3D1CB] hover:bg-[#EFEFED] font-semibold flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>파일 업로드 (또는 Ctrl+V)</span>
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

              <a
                href={`https://search.naver.com/search.naver?where=image&query=${encodeURIComponent(
                  (query.trim() || '아파트') + ' 평면도'
                )}`}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 rounded-md bg-white border border-[#D3D1CB] hover:bg-[#EFEFED] font-semibold flex items-center gap-1 text-[#0F7B6C]"
              >
                <span>네이버 이미지에서 찾기</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              <a
                href="https://new.land.naver.com/"
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1"
              >
                <span>네이버 부동산</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {underlayImage && (
              <div className="flex items-center gap-2">
                <span className="text-[#787774]">투명도</span>
                <input
                  type="range"
                  min={10}
                  max={90}
                  value={Math.round(underlayOpacity * 100)}
                  onChange={(e) => setUnderlayOpacity(Number(e.target.value) / 100)}
                  className="w-20 accent-[#0F7B6C]"
                />
                <button
                  type="button"
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
