import React, { useMemo } from 'react';
import {
  ScanLine,
  SlidersHorizontal,
  Upload,
  FolderOpen,
  Sparkles,
  Box,
  Ruler,
  Calculator,
  ArrowRight,
  Layers,
  Building2,
} from 'lucide-react';
import {
  createOlympicForeon84A,
  createOlympicForeon23A,
  createGodeokGracium84A,
  createGodeokGracium84B,
  createGodeokArteon84A,
} from '../data/exactPlans';
import { FloorPlanTemplate } from '../types/interior';

interface Props {
  onOpenNaverSearch: () => void;
  onOpenBunyangSearch: () => void;
  onUploadFile: (file: File) => void;
  onSelectPresetPlan: (plan: FloorPlanTemplate) => void;
  onLoadSavedPlan: () => void;
}

const FEATURED_PRESETS: Array<{
  badge: string;
  title: string;
  subtitle: string;
  areaLabel: string;
  factory: () => FloorPlanTemplate;
}> = [
  {
    badge: '인기 1위',
    title: '올림픽파크 포레온',
    subtitle: '84㎡A · 4Bay 판상형',
    areaLabel: '34평형',
    factory: () => createOlympicForeon84A(true),
  },
  {
    badge: '대단지',
    title: '고덕 그라시움',
    subtitle: '84㎡A · 정남향 판상형',
    areaLabel: '34평형',
    factory: () => createGodeokGracium84A(true),
  },
  {
    badge: '타워형',
    title: '고덕 그라시움',
    subtitle: '84㎡B · 이면개방 타워형',
    areaLabel: '34평형',
    factory: () => createGodeokGracium84B(true),
  },
  {
    badge: '신축 인기',
    title: '고덕 아르테온',
    subtitle: '84㎡A · 알파룸 확장형',
    areaLabel: '34평형',
    factory: () => createGodeokArteon84A(true),
  },
  {
    badge: '소형/신혼',
    title: '올림픽파크 포레온',
    subtitle: '59㎡A · 3Bay 실속형',
    areaLabel: '25평형',
    factory: () => createOlympicForeon23A(true),
  },
];

export const StudioHomeDashboard: React.FC<Props> = ({
  onOpenNaverSearch,
  onOpenBunyangSearch,
  onUploadFile,
  onSelectPresetPlan,
  onLoadSavedPlan,
}) => {
  const savedSummary = useMemo(() => {
    try {
      const raw = localStorage.getItem('gangdong_interior_saved_plan');
      if (!raw) return null;
      const parsed = JSON.parse(raw) as FloorPlanTemplate;
      if (!parsed?.complexName) return null;
      return {
        complexName: parsed.complexName,
        typeName: parsed.typeName || '',
        areaSqm: parsed.areaSqm || 84,
        roomCount: parsed.rooms?.length || 0,
      };
    } catch {
      return null;
    }
  }, []);

  return (
    <div className="w-full h-full overflow-y-auto bg-[#FBFBFA] text-[#37352F]">
      <div className="max-w-6xl mx-auto px-5 py-8 md:py-10 space-y-8">
        {/* Hero Header */}
        <section className="relative rounded-2xl bg-gradient-to-br from-[#1F2937] via-[#2B3442] to-[#111827] text-white p-7 md:p-9 shadow-sm overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-semibold text-emerald-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>APT 2D CAD · 실시간 3D 인테리어 스튜디오</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight leading-snug">
              우리 집 도면으로 바로 시작하는
              <br />
              실시간 2D · 3D 인테리어 시뮬레이션
            </h1>
            <p className="text-xs md:text-sm text-gray-300 leading-relaxed max-w-2xl">
              네이버 부동산 도면 검색부터 분양 유상옵션 영역 합성, 2D 치수/가벽 편집, 실사 3D 워크스루와
              실시간 리모델링 견적 산출까지 한 번에 설계해 보세요.
            </p>
          </div>
          {/* Subtle decorative accent */}
          <div className="hidden md:block absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
        </section>

        {/* Primary 3 Start Action Cards */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#37352F] flex items-center gap-2">
              <span>도면 불러오기 & 새로 시작</span>
            </h2>
            {savedSummary && (
              <button
                onClick={onLoadSavedPlan}
                className="px-3 py-1.5 rounded-lg bg-white hover:bg-[#EFEFED] border border-[#E9E9E7] text-xs font-semibold text-[#37352F] flex items-center gap-1.5 shadow-2xs transition"
              >
                <FolderOpen className="w-3.5 h-3.5 text-[#2383E2]" />
                <span>
                  저장된 작업 이어하기 ({savedSummary.complexName} {savedSummary.areaSqm}㎡)
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#787774]" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Action 1: Naver Floor Plan Search */}
            <button
              onClick={onOpenNaverSearch}
              className="group text-left bg-white hover:border-emerald-500 border border-[#E9E9E7] rounded-xl p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between gap-4"
            >
              <div className="space-y-2.5">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
                  <ScanLine className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#37352F] flex items-center gap-1.5">
                    <span>네이버 부동산 도면 검색</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-600 opacity-0 group-hover:opacity-100 transition" />
                  </div>
                  <p className="text-xs text-[#787774] mt-1 leading-relaxed">
                    단지명과 타입을 검색해 도면을 고르면 3단계 마법사로 방·벽·창호를 자동 추출합니다.
                  </p>
                </div>
              </div>
              <div className="text-[11px] font-semibold text-emerald-700">
                검색으로 도면 찾기 →
              </div>
            </button>

            {/* Action 2: Bunyang Type + Option Composer */}
            <button
              onClick={onOpenBunyangSearch}
              className="group text-left bg-white hover:border-[#2383E2] border border-[#E9E9E7] rounded-xl p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between gap-4"
            >
              <div className="space-y-2.5">
                <div className="w-10 h-10 rounded-lg bg-[#EBF5FF] text-[#2383E2] flex items-center justify-center group-hover:scale-105 transition">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#37352F] flex items-center gap-1.5">
                    <span>분양도면 + 유상옵션 합성</span>
                    <ArrowRight className="w-3.5 h-3.5 text-[#2383E2] opacity-0 group-hover:opacity-100 transition" />
                  </div>
                  <p className="text-xs text-[#787774] mt-1 leading-relaxed">
                    1차 타입 도면 위에 2차 유상옵션 도면 영역을 겹쳐 적용해 옵션별 구조를 비교합니다.
                  </p>
                </div>
              </div>
              <div className="text-[11px] font-semibold text-[#2383E2]">
                타입 · 옵션 도면 구성하기 →
              </div>
            </button>

            {/* Action 3: File Upload / Paste */}
            <label className="cursor-pointer group text-left bg-white hover:border-[#37352F] border border-[#E9E9E7] rounded-xl p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between gap-4">
              <div className="space-y-2.5">
                <div className="w-10 h-10 rounded-lg bg-[#F7F7F5] text-[#37352F] flex items-center justify-center group-hover:scale-105 transition">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-[#37352F] flex items-center gap-1.5">
                    <span>도면 이미지 업로드 · 붙여넣기</span>
                  </div>
                  <p className="text-xs text-[#787774] mt-1 leading-relaxed">
                    캡처한 평면도를 <kbd className="px-1.5 py-0.5 bg-[#EFEFED] border border-[#E9E9E7] rounded text-[10px] font-semibold">Ctrl + V</kbd> 로 바로 붙여넣거나 파일로 열 수 있습니다.
                  </p>
                </div>
              </div>
              <div className="text-[11px] font-semibold text-[#37352F]">
                이미지 파일 선택하기 →
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUploadFile(file);
                }}
              />
            </label>
          </div>
        </section>

        {/* Featured Instant 3D Showcase */}
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-bold text-[#37352F] flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#2383E2]" />
                <span>인기 아파트 정밀 도면 바로 체험 (1클릭 2D/3D)</span>
              </h2>
              <p className="text-[11px] text-[#787774] mt-0.5">
                도면 변환 과정 없이 클릭 즉시 실제 평형 스튜디오를 열어 자재·조명·견적을 테스트해 볼 수 있습니다.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {FEATURED_PRESETS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => onSelectPresetPlan(item.factory())}
                className="group text-left bg-white hover:border-[#2383E2] border border-[#E9E9E7] rounded-xl p-4 transition shadow-2xs hover:shadow-md flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-1">
                    <span className="px-2 py-0.5 rounded-full bg-[#EBF5FF] text-[#2383E2] text-[10px] font-bold">
                      {item.badge}
                    </span>
                    <span className="text-[10px] font-semibold text-[#787774]">
                      {item.areaLabel}
                    </span>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#37352F] group-hover:text-[#2383E2] transition">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-[#787774] mt-0.5">
                      {item.subtitle}
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-[#F1F1EF] flex items-center justify-between text-[11px] font-semibold text-[#37352F] group-hover:text-[#2383E2]">
                  <span>3D 스튜디오 열기</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Studio Capabilities Strip */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
          {[
            {
              icon: <Ruler className="w-4 h-4 text-[#2383E2]" />,
              title: '2D CAD 정밀 편집',
              desc: '벽 철거 · 가벽 추가 · 문/창호 배치 및 mm 치수 확인',
            },
            {
              icon: <Box className="w-4 h-4 text-emerald-600" />,
              title: '실시간 3D 워크스루',
              desc: '전체뷰 · 1인칭 시점 · 주간/노을/야간 조명 전환',
            },
            {
              icon: <Layers className="w-4 h-4 text-amber-600" />,
              title: '원클릭 스타일 패키지',
              desc: '모던 화이트 · 웜 우드 · 호텔 그레이 자재 일괄 적용',
            },
            {
              icon: <Calculator className="w-4 h-4 text-[#0F7B6C]" />,
              title: 'AI 디자이너 & 실시간 견적',
              desc: '평형·자재별 공정 견적서 산출 및 AI 스타일링 제안',
            },
          ].map((feat, i) => (
            <div
              key={i}
              className="bg-white border border-[#E9E9E7] rounded-xl p-3.5 flex items-start gap-2.5"
            >
              <div className="w-8 h-8 rounded-lg bg-[#F7F7F5] flex items-center justify-center shrink-0">
                {feat.icon}
              </div>
              <div>
                <div className="text-xs font-bold text-[#37352F]">{feat.title}</div>
                <div className="text-[11px] text-[#787774] mt-0.5 leading-snug">
                  {feat.desc}
                </div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};
