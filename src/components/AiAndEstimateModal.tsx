import React, { useMemo, useState } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { getMaterialById } from '../data/materials';
import {
  X,
  Sparkles,
  Calculator,
  Send,
  Wand2,
  Loader2,
} from 'lucide-react';
import { CeilingType, KelvinTemp } from '../types/interior';

interface Props {
  mode: 'ai' | 'estimate' | null;
  onClose: () => void;
}

const AI_STYLE_PRESETS: {
  id: string;
  title: string;
  desc: string;
  badge: string;
  config: {
    wallMaterialId: string;
    floorMaterialId: string;
    filmMaterialId: string;
    ceilingMaterialId: string;
    ceilingType: CeilingType;
    kelvin: KelvinTemp;
  };
}[] = [
  {
    id: 'warm-minimal',
    title: '호텔식 웜 미니멀',
    desc: '디아망 회벽 화이트 + 사하라 광폭마루 + 캐시미어 필름 + 직각 우물천장(3000K)',
    badge: '강동구 84A 인기 1위',
    config: {
      wallMaterialId: 'wp-lx-diamang-white',
      floorMaterialId: 'fl-dongwha-sahara-wide',
      filmMaterialId: 'fm-hyundai-cashmere',
      ceilingMaterialId: 'cl-white-silk',
      ceilingType: 'well_rect',
      kelvin: '3000K',
    },
  },
  {
    id: 'french-modern',
    title: '프렌치 모던 헤링본',
    desc: '베스띠 소프트 린넨 + 구정 프라하 헤링본 + 밀크화이트 필름 + 라운드 우물천장',
    badge: '고급/감성',
    config: {
      wallMaterialId: 'wp-lx-besti-linen',
      floorMaterialId: 'fl-kujung-herringbone',
      filmMaterialId: 'fm-hyundai-milkwhite',
      ceilingMaterialId: 'cl-warm-ivory',
      ceilingType: 'well_round',
      kelvin: '3000K',
    },
  },
  {
    id: 'modern-chic',
    title: '모던 포세린 & 차콜',
    desc: '디아망 웜그레이 + 비앙코 포세린 타일 + 차콜 필름 + 4000K 주백색',
    badge: '타워형 추천',
    config: {
      wallMaterialId: 'wp-lx-diamang-warmgray',
      floorMaterialId: 'fl-porcelain-bianco',
      filmMaterialId: 'fm-hyundai-charcoal',
      ceilingMaterialId: 'cl-white-silk',
      ceilingType: 'well_rect',
      kelvin: '4000K',
    },
  },
  {
    id: 'natural-wood',
    title: '내추럴 화이트 & 우드',
    desc: '샌드 스톤 벽지 + 내추럴 오크 강마루 + 애쉬 우드 필름 + 우드 루버 천장',
    badge: '따뜻한 가족공간',
    config: {
      wallMaterialId: 'wp-gaenari-sand',
      floorMaterialId: 'fl-kujung-natural-oak',
      filmMaterialId: 'fm-younglim-oak',
      ceilingMaterialId: 'cl-wood-louver',
      ceilingType: 'well_rect',
      kelvin: '3000K',
    },
  },
];

export const AiAndEstimateModal: React.FC<Props> = ({ mode, onClose }) => {
  const { plan, applyThemeMaterials } = useStudioStore();
  const [prompt, setPrompt] = useState(
    '현재 도면에서 거실과 주방 분위기를 넓고 고급스럽게 꾸미기 위한 자재·조명 조합을 추천해줘.'
  );
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const estimate = useMemo(() => {
    let floorCost = 0;
    let totalPyeong = 0;
    let wellCeilingCount = 0;

    plan.rooms.forEach((r) => {
      let area = 0;
      for (let i = 0, j = r.polygon.length - 1; i < r.polygon.length; j = i++) {
        area +=
          (r.polygon[j].x + r.polygon[i].x) * (r.polygon[j].y - r.polygon[i].y);
      }
      area = Math.abs(area / 2);
      const py = area / 3.3058;
      totalPyeong += py;
      const flMat = getMaterialById(r.floorMaterialId);
      floorCost += py * flMat.pricePerUnit;
      if (r.ceilingType !== 'flat') wellCeilingCount += 1;
    });

    let wallLenSum = 0;
    let demolishedCount = 0;
    let openingCount = 0;
    plan.walls.forEach((w) => {
      if (w.demolished) {
        demolishedCount += 1;
        return;
      }
      wallLenSum += Math.hypot(w.x2 - w.x1, w.y2 - w.y1);
      openingCount += w.openings.length;
    });

    const wallAreaSqm = wallLenSum * 2.4 * 1.4;
    const wallRolls = Math.max(8, Math.ceil(wallAreaSqm / 14.5));
    const sampleWp = getMaterialById(plan.walls[0]?.frontMaterialId || 'wp-lx-diamang-white');
    const wallpaperCost = wallRolls * (sampleWp.pricePerUnit + 35000);

    const filmMeters = openingCount * 5;
    const filmCost = filmMeters * 45000;
    const ceilingCost = wellCeilingCount * 950000;
    const lightCost = plan.lights.length * 110000;
    const demolishCost = demolishedCount * 650000;

    const total =
      floorCost +
      wallpaperCost +
      filmCost +
      ceilingCost +
      lightCost +
      demolishCost;

    return {
      totalPyeong,
      wallRolls,
      floorCost: Math.round(floorCost),
      wallpaperCost: Math.round(wallpaperCost),
      filmMeters,
      filmCost,
      wellCeilingCount,
      ceilingCost,
      lightCount: plan.lights.length,
      lightCost,
      demolishedCount,
      demolishCost,
      total: Math.round(total),
    };
  }, [plan]);

  if (!mode) return null;

  const askGemini = async () => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setApiError('Gemini API Key가 설정되지 않았습니다.');
      return;
    }
    setLoading(true);
    setApiError(null);

    const summary = {
      apartment: `${plan.complexName} ${plan.typeName}`,
      demolishedWalls: plan.walls.filter((w) => w.demolished).length,
      rooms: plan.rooms.map((r) => ({
        name: r.name,
        floor: getMaterialById(r.floorMaterialId).name,
        ceiling: r.ceilingType,
        kelvin: r.indirectLightColor,
      })),
    };

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(
          apiKey
        )}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `당신은 서울 강동구 아파트 리모델링 전문 수석 인테리어 디자이너입니다.
현재 사용자의 아파트 상태: ${JSON.stringify(summary)}
예상 견적: 약 ${Math.round(estimate.total / 10000)}만원

사용자 질문: ${prompt}

한국 아파트 자재 브랜드(LX하우시스 디아망/베스띠, 구정마루, 동화자연마루, 현대L&C 보닥 필름, T5 간접등, 2~3인치 COB 다운라이트)를 활용해 구체적이고 실용적인 조언을 5~7줄로 깔끔하게 답변해주세요.`,
                  },
                ],
              },
            ],
          }),
        }
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`API 오류 (${res.status}): ${errText.slice(0, 160)}`);
      }
      const data = await res.json();
      const text =
        data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        '응답을 생성하지 못했습니다.';
      setAiReply(text);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '알 수 없는 오류';
      setApiError(
        `Gemini API 호출 중 문제가 발생했습니다 (${msg}). 아래 '원클릭 AI 스타일 프리셋'은 오프라인에서도 즉시 적용 가능합니다.`
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/35 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white border border-[#E9E9E7] rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E9E9E7] flex items-center justify-between bg-[#FBFBFA]">
          <div className="flex items-center gap-2.5">
            {mode === 'ai' ? (
              <Sparkles className="w-5 h-5 text-[#2383E2]" />
            ) : (
              <Calculator className="w-5 h-5 text-[#0F7B6C]" />
            )}
            <div>
              <h2 className="text-base font-bold text-[#37352F]">
                {mode === 'ai'
                  ? 'Gemini AI 인테리어 디자이너'
                  : '실시간 인테리어 예상 견적서'}
              </h2>
              <p className="text-xs text-[#787774]">
                {plan.complexName} · {plan.typeName}
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

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 bg-white">
          {mode === 'estimate' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-[#DDEDEA]/50 border border-[#B8DBD5] flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#0F7B6C] font-semibold">
                    총 예상 리모델링 견적 (자재 + 표준 시공비)
                  </div>
                  <div className="text-2xl font-extrabold text-[#37352F] mt-1">
                    약 {Math.round(estimate.total / 10000).toLocaleString()}만원
                  </div>
                </div>
                <div className="text-right text-xs text-[#37352F]">
                  <div>실측 면적: {estimate.totalPyeong.toFixed(1)}평</div>
                  <div>철거 벽체: {estimate.demolishedCount}개소</div>
                </div>
              </div>

              <div className="divide-y divide-[#E9E9E7] border border-[#E9E9E7] rounded-lg overflow-hidden bg-white">
                {[
                  [
                    '바닥재 (강마루/타일 시공 포함)',
                    `${estimate.totalPyeong.toFixed(1)}평`,
                    estimate.floorCost,
                  ],
                  [
                    '도배 공사 (실크벽지 + 인건비)',
                    `${estimate.wallRolls}롤`,
                    estimate.wallpaperCost,
                  ],
                  [
                    '인테리어 필름 (문·문틀·샤시)',
                    `${estimate.filmMeters}m`,
                    estimate.filmCost,
                  ],
                  [
                    '목공 우물천장 & T5 간접등',
                    `${estimate.wellCeilingCount}개소`,
                    estimate.ceilingCost,
                  ],
                  [
                    '조명 기구 & 매입등 배선',
                    `${estimate.lightCount}개`,
                    estimate.lightCost,
                  ],
                  [
                    '비내력벽 철거 & 폐기물/미장',
                    `${estimate.demolishedCount}개소`,
                    estimate.demolishCost,
                  ],
                ].map(([label, qty, cost]) => (
                  <div
                    key={label as string}
                    className="px-4 py-3 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-medium text-[#37352F]">{label}</span>
                      <span className="ml-2 text-[#787774]">({qty})</span>
                    </div>
                    <span className="font-bold text-[#37352F]">
                      {(cost as number).toLocaleString()}원
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-[#787774]">
                * 실제 시공 시 현장 상태(확장 여부, 샷시 교체, 주방 가구 별도)에 따라 견적이 변동될 수 있습니다.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* One-click AI Style Presets */}
              <div>
                <div className="text-xs font-bold text-[#37352F] mb-2.5 flex items-center gap-1.5">
                  <Wand2 className="w-4 h-4 text-[#2383E2]" />
                  원클릭 AI 스타일링 프리셋 (2D/3D 전체 즉시 반영)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {AI_STYLE_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        applyThemeMaterials(p.config);
                        onClose();
                      }}
                      className="text-left p-3 rounded-lg bg-[#FBFBFA] hover:bg-[#EBF5FF]/50 border border-[#E9E9E7] hover:border-[#2383E2] transition group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#37352F] group-hover:text-[#2383E2]">
                          {p.title}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EBF5FF] text-[#2383E2] font-medium">
                          {p.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#787774] mt-1 leading-relaxed">
                        {p.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Gemini AI Consultation */}
              <div className="p-4 rounded-lg bg-[#F7F7F5] border border-[#E9E9E7] space-y-3">
                <div className="text-xs font-bold text-[#37352F] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#2383E2]" />
                  Gemini AI 맞춤 인테리어 상담
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && askGemini()}
                    className="flex-1 bg-white border border-[#E9E9E7] rounded-md px-3 py-2 text-xs text-[#37352F] focus:outline-none focus:border-[#2383E2]"
                    placeholder="자재 조합, 벽 철거, 조명 배치 등 궁금한 점을 물어보세요..."
                  />
                  <button
                    onClick={askGemini}
                    disabled={loading}
                    className="px-4 py-2 rounded-md bg-[#2383E2] hover:bg-[#1A6EC2] disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>질문하기</span>
                  </button>
                </div>

                {apiError && (
                  <div className="p-3 rounded-md bg-[#FAEBDD] border border-[#F2CFAF] text-xs text-[#D9730D]">
                    {apiError}
                  </div>
                )}

                {aiReply && (
                  <div className="p-3.5 rounded-md bg-white border border-[#E9E9E7] text-xs text-[#37352F] whitespace-pre-wrap leading-relaxed">
                    {aiReply}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
