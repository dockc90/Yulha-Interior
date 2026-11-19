import React, { useMemo } from 'react';
import {
  ScanLine,
  SlidersHorizontal,
  Upload,
  FolderOpen,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  Crown,
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

const MiniPlanSvg: React.FC<{ plan: FloorPlanTemplate }> = ({ plan }) => {
  const pad = 0.6;
  const w = (plan.width || 12) + pad * 2;
  const d = (plan.depth || 10) + pad * 2;
  return (
    <svg
      viewBox={`${-pad} ${-pad} ${w} ${d}`}
      className="w-full h-28 bg-[#FBFBFA] rounded-md border border-[#E9E9E7]"
    >
      {plan.rooms.map((r) => {
        const pts = r.polygon.map((p) => `${p.x},${p.y}`).join(' ');
        const fill =
          r.type === 'living'
            ? '#FEF3C7'
            : r.type === 'kitchen'
            ? '#FFEDD5'
            : r.type === 'bath'
            ? '#E0F2FE'
            : r.type === 'balcony'
            ? '#F3F4F6'
            : '#F5F5F4';
        return (
          <polygon
            key={r.id}
            points={pts}
            fill={fill}
            stroke="#D6D3D1"
            strokeWidth={0.08}
          />
        );
      })}
      {plan.walls
        .filter((wl) => !wl.demolished)
        .map((wl) => (
          <line
            key={wl.id}
            x1={wl.x1}
            y1={wl.y1}
            x2={wl.x2}
            y2={wl.y2}
            stroke="#37352F"
            strokeWidth={wl.isExterior ? 0.22 : 0.14}
            strokeLinecap="round"
          />
        ))}
    </svg>
  );
};

export const StudioHomeDashboard: React.FC<Props> = ({
  onOpenNaverSearch,
  onOpenBunyangSearch,
  onUploadFile,
  onSelectPresetPlan,
  onLoadSavedPlan,
}) => {
  const presets = useMemo(
    () => [
      { tag: '실제 구조', plan: createOlympicForeon84A(true) },
      { tag: '4Bay 판상형', plan: createGodeokGracium84A(true) },
      { tag: '타워형', plan: createGodeokGracium84B(true) },
      { tag: '알파룸', plan: createGodeokArteon84A(true) },
      { tag: '25평형', plan: createOlympicForeon23A(true) },
    ],
    []
  );

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
      };
    } catch {
      return null;
    }
  }, []);

  return (
    <div className="w-full h-full overflow-y-auto bg-white text-[#37352F]">
      {/* Notion Cover Strip */}
      <div className="h-24 w-full bg-gradient-to-r from-[#F7F3EE] via-[#EFECE6] to-[#E6EFEA] border-b border-[#E9E9E7]" />

      <div className="max-w-4xl mx-auto px-6 md:px-10 pb-16 -mt-8 space-y-8">
        {/* Notion Page Icon & Title */}
        <div className="space-y-3">
          <div className="w-14 h-14 rounded-xl bg-white border border-[#E9E9E7] shadow-xs flex items-center justify-center text-2xl font-black text-[#0F7B6C]">
            Y
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#37352F]">
              Yulha Interior Workspace
            </h1>
            <span className="px-2 py-0.5 rounded bg-[#DDEDEA] text-[#0F7B6C] text-[11px] font-bold">
              v2.0 Studio
            </span>
          </div>
          <p className="text-sm text-[#787774] leading-relaxed">
            아파트 도면을 실제 구조에 맞게 2D로 편집하고, 3D 공간에서 마루 · 벽지 · 콘센트 · 조명 · 냉장고장 · 인덕션 · 인테리어 필름까지 직접 적용해 보는 노션 스타일 인테리어 워크스페이스입니다.
          </p>
        </div>

        {/* Notion Callout */}
        <div className="p-4 rounded-lg bg-[#F7F7F5] border border-[#E9E9E7] flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-[#0F7B6C] shrink-0 mt-0.5" />
          <div className="text-xs text-[#37352F] leading-relaxed space-y-1">
            <div className="font-semibold">
              모든 2D 편집 및 3D 자재 시뮬레이션 기능을 무료로 바로 사용할 수 있습니다.
            </div>
            <div className="text-[#787774]">
              작업 중 상단에서 <b className="text-[#37352F]">실시간 3D</b> 또는{' '}
              <b className="text-[#37352F]">수동 3D 업데이트</b> 모드를 선택할 수 있으며, 프로젝트 저장·불러오기(Pro 구독 예정)는 현재 로컬 테스트로 열어두었습니다.
            </div>
          </div>
        </div>

        {/* Notion Action List (2-column clean links) */}
        <section className="space-y-2.5">
          <div className="text-xs font-bold uppercase tracking-wider text-[#9B9A97]">
            새 프로젝트 시작하기
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              onClick={onOpenNaverSearch}
              className="group p-3.5 rounded-lg border border-[#E9E9E7] hover:border-[#0F7B6C] hover:bg-[#FBFBFA] text-left transition flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-[#DDEDEA] text-[#0F7B6C] flex items-center justify-center shrink-0">
                  <ScanLine className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#37352F]">
                    네이버 부동산 도면 검색
                  </div>
                  <div className="text-[11px] text-[#787774]">
                    단지·평형 검색 후 3단계 자동 변환
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#9B9A97] group-hover:text-[#0F7B6C]" />
            </button>

            <button
              onClick={onOpenBunyangSearch}
              className="group p-3.5 rounded-lg border border-[#E9E9E7] hover:border-[#2383E2] hover:bg-[#FBFBFA] text-left transition flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-[#EBF5FF] text-[#2383E2] flex items-center justify-center shrink-0">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#37352F]">
                    분양도면 + 유상옵션 합성
                  </div>
                  <div className="text-[11px] text-[#787774]">
                    1차 타입 도면 위에 2차 옵션 영역 적용
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#9B9A97] group-hover:text-[#2383E2]" />
            </button>

            <label className="cursor-pointer group p-3.5 rounded-lg border border-[#E9E9E7] hover:border-[#37352F] hover:bg-[#FBFBFA] text-left transition flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-[#F7F7F5] text-[#37352F] flex items-center justify-center shrink-0">
                  <Upload className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#37352F]">
                    도면 이미지 업로드 · Ctrl+V
                  </div>
                  <div className="text-[11px] text-[#787774]">
                    캡처 이미지 즉시 붙여넣기 지원
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#9B9A97] group-hover:text-[#37352F]" />
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

            <button
              onClick={onLoadSavedPlan}
              className="group p-3.5 rounded-lg border border-[#E9E9E7] hover:border-[#D9730D] hover:bg-[#FBFBFA] text-left transition flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-[#FAEBDD] text-[#D9730D] flex items-center justify-center shrink-0">
                  <FolderOpen className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[#37352F] flex items-center gap-1.5">
                    <span>저장된 프로젝트 불러오기</span>
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                      <Crown className="w-2.5 h-2.5" /> PRO
                    </span>
                  </div>
                  <div className="text-[11px] text-[#787774]">
                    {savedSummary
                      ? `최근: ${savedSummary.complexName} ${savedSummary.areaSqm}㎡`
                      : '저장된 프로젝트 이어서 작업'}
                  </div>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#9B9A97] group-hover:text-[#D9730D]" />
            </button>
          </div>
        </section>

        {/* Notion Database Gallery View: Apartment Presets with Live SVG Blueprints */}
        <section className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#E9E9E7] pb-2">
            <div className="text-xs font-bold uppercase tracking-wider text-[#9B9A97]">
              도면 라이브러리 · 클릭 즉시 2D / 3D 스튜디오 열기
            </div>
            <div className="text-[11px] text-[#787774] flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#0F7B6C]" />
              <span>콘센트 · 스위치 · 냉장고장 · 실링팬 포함</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {presets.map(({ tag, plan }) => (
              <button
                key={plan.id}
                onClick={() => onSelectPresetPlan(plan)}
                className="group text-left rounded-lg border border-[#E9E9E7] hover:border-[#0F7B6C] bg-white p-3 transition hover:shadow-sm space-y-2.5"
              >
                <MiniPlanSvg plan={plan} />
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-[#37352F] group-hover:text-[#0F7B6C] truncate">
                      {plan.complexName}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-[#F7F7F5] border border-[#E9E9E7] text-[10px] font-semibold text-[#787774] shrink-0">
                      {tag}
                    </span>
                  </div>
                  <div className="text-[11px] text-[#787774] truncate">
                    {plan.typeName} · 방 {plan.rooms.length}개
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
