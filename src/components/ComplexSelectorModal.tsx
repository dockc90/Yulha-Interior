import React, { useMemo, useState } from 'react';
import {
  GANGDONG_COMPLEXES,
  GANGDONG_DONGS,
  REGION_ROADMAP,
} from '../data/gangdongApartments';
import officialCatalog from '../data/officialCatalog.json';
import { useStudioStore } from '../store/useStudioStore';
import { vectorizeOfficialImageLocally } from '../utils/localFloorPlanVectorizer';
import { getSavedBlueprintForType } from '../utils/savedBlueprints';
import { createOlympicForeon23A } from '../data/exactPlans';
import {
  Building2,
  MapPin,
  Check,
  X,
  Layers,
  Search,
  Sparkles,
  Loader2,
  Globe,
} from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
}

type PyeongFilter = 'all' | '20s' | '30s' | '40s';

interface CatalogTypeEntry {
  roomTypeId: number;
  m2: string;
  p: string;
  supplySqm: number;
  exclusiveSqm: number;
  pyeong: number;
  roomsCount: number;
  bathsCount: number;
  entranceType: string;
  households: number;
  localUrl: string;
}

interface CatalogComplexEntry {
  danjiId: number;
  officialName: string;
  dong: string;
  types: CatalogTypeEntry[];
}

const CATALOG = officialCatalog as Record<string, CatalogComplexEntry>;

export const ComplexSelectorModal: React.FC<Props> = ({ open, onClose }) => {
  const { plan, loadPlanTemplate, setUnderlayImage, showToast } = useStudioStore();
  const [search, setSearch] = useState('');
  const [selectedDong, setSelectedDong] = useState('전체');
  const [pyeongFilter, setPyeongFilter] = useState<PyeongFilter>('all');
  const [autoConvertingLabel, setAutoConvertingLabel] = useState<string | null>(null);
  const [expandedComplexId, setExpandedComplexId] = useState<string | null>(null);

  const filteredComplexes = useMemo(() => {
    const q = search.replace(/\s+/g, '').toLowerCase();
    return GANGDONG_COMPLEXES.map((c) => {
      const dongMatch = selectedDong === '전체' || c.dong === selectedDong;
      if (!dongMatch) return null;

      const cNameNorm = c.name.replace(/\s+/g, '').toLowerCase();
      const cDongNorm = c.dong.replace(/\s+/g, '').toLowerCase();
      const catEntry = CATALOG[c.id];
      const officialTypes = catEntry?.types || [];

      const matchingOfficial = officialTypes.filter((t) => {
        const pyMatch =
          pyeongFilter === 'all' ||
          (pyeongFilter === '20s' && t.pyeong <= 26) ||
          (pyeongFilter === '30s' && t.pyeong >= 27 && t.pyeong <= 36) ||
          (pyeongFilter === '40s' && t.pyeong >= 37);

        const typeNorm = `${t.m2}${t.p}평`.replace(/\s+/g, '').toLowerCase();
        const qMatch =
          q === '' ||
          cNameNorm.includes(q) ||
          cDongNorm.includes(q) ||
          typeNorm.includes(q) ||
          (cNameNorm + typeNorm).includes(q);

        return pyMatch && qMatch;
      });

      const matchingFallback = c.plans.filter((p) => {
        const pyMatch =
          pyeongFilter === 'all' ||
          (pyeongFilter === '20s' && p.pyeong <= 26) ||
          (pyeongFilter === '30s' && p.pyeong >= 27 && p.pyeong <= 36) ||
          (pyeongFilter === '40s' && p.pyeong >= 37);
        const pTypeNorm = p.typeName.replace(/\s+/g, '').toLowerCase();
        const qMatch =
          q === '' ||
          cNameNorm.includes(q) ||
          cDongNorm.includes(q) ||
          pTypeNorm.includes(q);
        return pyMatch && qMatch;
      });

      if (matchingOfficial.length === 0 && matchingFallback.length === 0) {
        return null;
      }

      return {
        ...c,
        officialTypes: matchingOfficial,
        fallbackPlans: matchingFallback,
      };
    }).filter((c): c is NonNullable<typeof c> => c !== null);
  }, [search, selectedDong, pyeongFilter]);

  if (!open) return null;

  const findExactBlueprint = (complexId: string, t: CatalogTypeEntry) => {
    const complex = GANGDONG_COMPLEXES.find((c) => c.id === complexId);
    if (!complex) return null;
    if (complexId === 'olympic-foreon' && t.p.includes('23A')) {
      return createOlympicForeon23A(true);
    }
    if (complexId === 'olympic-foreon' && t.p.includes('34A')) {
      return complex.plans.find((p) => p.id === 'olympic-foreon-84a') || null;
    }
    if (complexId === 'godeok-gracium' && t.p.includes('34A')) {
      return complex.plans.find((p) => p.id === 'godeok-gracium-84a') || null;
    }
    if (complexId === 'godeok-gracium' && (t.p.includes('35B') || t.p.includes('34B'))) {
      return complex.plans.find((p) => p.id === 'godeok-gracium-84b') || null;
    }
    if (complexId === 'godeok-arteon' && t.p.includes('34A')) {
      return complex.plans.find((p) => p.id === 'godeok-arteon-84a') || null;
    }
    if (complexId === 'godeok-xi' && t.p.includes('33B')) {
      return complex.plans.find((p) => p.id === 'godeok-xi-84b') || null;
    }
    return null;
  };

  const handleSelectOfficialType = async (
    complexId: string,
    complexName: string,
    dong: string,
    t: CatalogTypeEntry
  ) => {
    const typeLabel = `${t.m2}㎡ (${t.p}평 · 방${t.roomsCount}/욕실${t.bathsCount})`;
    const saved = getSavedBlueprintForType(complexId, typeLabel);
    if (saved) {
      loadPlanTemplate(saved);
      setUnderlayImage(null);
      showToast(`${complexName} ${t.m2}㎡ 저장된 네이버 2D 도면을 불러왔습니다!`);
      onClose();
      return;
    }

    const exact = findExactBlueprint(complexId, t);
    if (exact) {
      loadPlanTemplate(exact);
      setUnderlayImage(null);
      onClose();
      return;
    }
    setAutoConvertingLabel(`${complexName} ${typeLabel}`);
    try {
      const converted = await vectorizeOfficialImageLocally({
        imageUrl: t.localUrl,
        complexId,
        complexName,
        district: `강동구 ${dong}`,
        typeName: typeLabel,
        areaSqm: t.exclusiveSqm || t.pyeong * 3.3,
        pyeong: t.pyeong,
        roomsCount: t.roomsCount,
        bathsCount: t.bathsCount,
        isExtended: true,
      });
      loadPlanTemplate(converted);
      setUnderlayImage(null);
      showToast(`${complexName} ${t.p}평 공식 평면도(2D/3D)를 생성했습니다!`);
      setAutoConvertingLabel(null);
      onClose();
    } catch (err: unknown) {
      const complex = GANGDONG_COMPLEXES.find((c) => c.id === complexId);
      const fallback = complex?.plans[0];
      if (fallback) {
        loadPlanTemplate({
          ...fallback,
          typeName: typeLabel,
          areaSqm: t.exclusiveSqm,
          pyeong: t.pyeong,
        });
      }
      setUnderlayImage(t.localUrl);
      const msg = err instanceof Error ? err.message : '오류';
      showToast(`공식 평면도 로드 중 오류: ${msg}`);
      setAutoConvertingLabel(null);
      onClose();
    }
  };

  const totalOfficialImages = Object.values(CATALOG).reduce(
    (s, c) => s + (c.types?.length || 0),
    0
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/35 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white border border-[#E9E9E7] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E9E9E7] flex items-center justify-between bg-[#FBFBFA]">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-[#2383E2]" />
            <div>
              <h2 className="text-base font-bold text-[#37352F]">
                Yulha Interior · 강동구 전체 아파트 단지 & TYPE별 공식 평면도 ({totalOfficialImages}종 저장됨)
              </h2>
              <p className="text-xs text-[#787774]">
                모든 단지·타입별 공식 평면도 이미지가 로컬 DB에 저장되어 있으며 클릭 시 실측 2D/3D로 즉시 변환됩니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-[#787774] hover:text-[#37352F] hover:bg-[#EFEFEE]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 bg-white">
          {/* Region Roadmap */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {REGION_ROADMAP.map((r) => (
              <div
                key={r.regionId}
                className={`p-3 rounded-lg border ${
                  r.active
                    ? 'bg-[#EBF5FF]/60 border-[#BFE0FF]'
                    : 'bg-[#F7F7F5] border-[#E9E9E7] opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#37352F] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#2383E2]" />
                    {r.label}
                  </span>
                </div>
                <div
                  className={`text-[10px] font-semibold mt-1 ${
                    r.active ? 'text-[#0F7B6C]' : 'text-[#787774]'
                  }`}
                >
                  {r.phase}
                </div>
                <p className="text-[11px] text-[#787774] mt-1 leading-snug">
                  {r.note}
                </p>
              </div>
            ))}
          </div>

          {/* Search & Filters */}
          <div className="p-3.5 rounded-lg bg-[#F7F7F5] border border-[#E9E9E7] space-y-2.5">
            <div className="relative">
              <Search className="w-4 h-4 text-[#9B9A97] absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="아파트 단지명, 동(고덕동/상일동 등), 평형/타입(예: 35B, 84A, 25A) 띄어쓰기 없이 검색..."
                className="w-full bg-white border border-[#E9E9E7] rounded-md pl-9 pr-3 py-2 text-xs text-[#37352F] placeholder-[#9B9A97] focus:outline-none focus:border-[#2383E2]"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex gap-1 flex-wrap">
                {GANGDONG_DONGS.map((dong) => (
                  <button
                    key={dong}
                    onClick={() => setSelectedDong(dong)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition ${
                      selectedDong === dong
                        ? 'bg-[#EBF5FF] text-[#2383E2] border border-[#BFE0FF] font-semibold'
                        : 'bg-white border border-[#E9E9E7] text-[#787774] hover:text-[#37352F]'
                    }`}
                  >
                    {dong}
                  </button>
                ))}
              </div>

              <div className="flex gap-1 shrink-0">
                {(
                  [
                    ['all', '전체 평형'],
                    ['20s', '20평대'],
                    ['30s', '30평대'],
                    ['40s', '40평대+'],
                  ] as [PyeongFilter, string][]
                ).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setPyeongFilter(val)}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition ${
                      pyeongFilter === val
                        ? 'bg-[#37352F] text-white'
                        : 'bg-white border border-[#E9E9E7] text-[#787774] hover:text-[#37352F]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {autoConvertingLabel && (
            <div className="p-3.5 rounded-lg bg-[#EBF5FF] border border-[#2383E2] flex items-center gap-3">
              <Loader2 className="w-4 h-4 text-[#2383E2] animate-spin shrink-0" />
              <div className="text-xs font-semibold text-[#37352F]">
                {autoConvertingLabel} — 저장된 공식 평면도를 실측 벡터 2D/3D 모델로 변환 중입니다...
              </div>
            </div>
          )}

          {/* Complexes List */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-[#787774] uppercase tracking-wider">
              강동구 단지 목록 ({filteredComplexes.length}개 단지)
            </div>

            {filteredComplexes.map((complex) => {
              const isExpanded = expandedComplexId === complex.id || filteredComplexes.length <= 3;
              const visibleOfficial = isExpanded
                ? complex.officialTypes
                : complex.officialTypes.slice(0, 6);

              return (
                <div
                  key={complex.id}
                  className="p-4 rounded-lg bg-[#FBFBFA] border border-[#E9E9E7] space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="text-sm font-bold text-[#37352F]">
                        {complex.name}
                      </div>
                      <div className="text-xs text-[#787774]">
                        서울 강동구 {complex.dong} · {complex.households.toLocaleString()}세대 · {complex.year}년
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#DDEDEA] text-[#0F7B6C] text-[11px] font-semibold">
                        공식 도면 {complex.officialTypes.length || complex.fallbackPlans.length}개 타입
                      </span>
                      {complex.officialTypes.length > 6 && (
                        <button
                          onClick={() =>
                            setExpandedComplexId(isExpanded ? null : complex.id)
                          }
                          className="px-2 py-0.5 rounded bg-white border border-[#E9E9E7] text-[11px] text-[#2383E2] font-medium"
                        >
                          {isExpanded ? '접기' : `전체 ${complex.officialTypes.length}개 보기`}
                        </button>
                      )}
                    </div>
                  </div>

                  {visibleOfficial.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                      {visibleOfficial.map((t) => (
                        <button
                          key={t.roomTypeId}
                          disabled={Boolean(autoConvertingLabel)}
                          onClick={() =>
                            handleSelectOfficialType(
                              complex.id,
                              complex.name,
                              complex.dong,
                              t
                            )
                          }
                          className="text-left p-2 rounded-lg bg-white border border-[#E9E9E7] hover:border-[#2383E2] transition flex flex-col gap-1.5 group disabled:opacity-60"
                        >
                          <img
                            src={t.localUrl}
                            alt={`${complex.name} ${t.p}평`}
                            loading="lazy"
                            className="w-full h-24 object-contain bg-[#FBFBFA] rounded border border-[#E9E9E7]"
                          />
                          <div>
                            <div className="text-xs font-bold text-[#37352F] group-hover:text-[#2383E2] truncate">
                              {t.p}평 ({t.m2}㎡)
                            </div>
                            <div className="text-[10px] text-[#787774]">
                              전용 {t.exclusiveSqm}㎡ · 방{t.roomsCount}/욕{t.bathsCount}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {complex.fallbackPlans.map((t) => {
                        const isActive = plan.id === t.id;
                        return (
                          <button
                            key={t.id}
                            onClick={() => {
                              loadPlanTemplate(t);
                              onClose();
                            }}
                            className={`text-left p-2.5 rounded-lg border transition ${
                              isActive
                                ? 'bg-[#EBF5FF] border-[#2383E2]'
                                : 'bg-white border-[#E9E9E7] hover:border-[#C1BFB8]'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-[#37352F] flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-[#2383E2]" />
                                {t.typeName}
                              </span>
                              {isActive && (
                                <Check className="w-4 h-4 text-[#2383E2]" />
                              )}
                            </div>
                            <div className="text-[11px] text-[#2383E2] font-medium mt-1">
                              {t.bayInfo}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
