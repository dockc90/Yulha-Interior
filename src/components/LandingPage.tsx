import React from 'react';
import {
  ArrowRight,
  Compass,
  FolderOpen,
  Footprints,
  Layers,
  PenTool,
  Sparkles,
  Check,
} from 'lucide-react';
import { usePlannerStore } from '../store/usePlannerStore';

interface LandingPageProps {
  onEnterStudio: () => void;
  onOpenProjects: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterStudio, onOpenProjects }) => {
  const loadPreset = usePlannerStore((s) => s.loadPreset);
  const setViewMode = usePlannerStore((s) => s.setViewMode);

  const handleStartPreset = (preset: '34py' | '25py' | 'blank', mode: 'split' | '3d' | 'walk' | '2d' = 'split') => {
    loadPreset(preset);
    setViewMode(mode);
    onEnterStudio();
  };

  return (
    <div className="min-h-screen w-full bg-[#FAF8F5] text-[#1F1E1C] overflow-y-auto selection:bg-[#D6C7B2] selection:text-[#1F1E1C]">
      {/* Top Minimal Navigation */}
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/85 backdrop-blur-md border-b border-[#EAE4DC]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#242220] text-[#FAF8F5] flex items-center justify-center font-serif font-bold text-lg shadow-xs">
              Y
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight text-[#1F1E1C]">YULHA ATELIER</p>
              <p className="text-[11px] text-[#7A7267]">3D 아파트 인테리어 & 실자재 스튜디오</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onOpenProjects}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-medium text-[#575148] hover:bg-[#EFEAE2] transition-colors"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              저장된 프로젝트
            </button>
            <button
              onClick={() => handleStartPreset('34py', 'split')}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#242220] text-[#FAF8F5] text-xs font-semibold hover:bg-[#3A3733] transition-all shadow-sm"
            >
              스튜디오 시작하기
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-6 pt-14 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#EFEAE2] border border-[#E2D9CC] text-[11px] font-semibold text-[#5E5448]">
              <Sparkles className="w-3.5 h-3.5 text-[#9B7A52]" />
              2D 평면 설계 · 실시간 3D · 1인칭 워크스루
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-[1.18] text-[#1F1E1C]">
              우리 집 도면 위에
              <br />
              <span className="text-[#8C6A43]">진짜 브랜드 자재</span>를
              <br />
              미리 입혀보세요.
            </h1>

            <p className="text-sm sm:text-base text-[#665F56] leading-relaxed max-w-lg">
              구정마루, 동화자연마루, LX하우시스 디아망, 윤현상재 포세린 타일부터 삼성 비스포크와
              루씨에어 실링팬까지. 실제 자재 스펙과 색감 그대로 우리 집 공간을 3D로 걸어보며
              예상 견적까지 한 번에 확인하세요.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => handleStartPreset('34py', 'split')}
                className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-[#242220] text-white text-sm font-semibold hover:bg-[#3B3834] transition-all shadow-md"
              >
                34평 모델하우스로 바로 체험
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleStartPreset('blank', '2d')}
                className="flex items-center gap-2 px-5 py-3.5 rounded-full bg-white border border-[#DED6CA] text-[#3B3630] text-sm font-semibold hover:bg-[#F5F1EB] transition-all"
              >
                <PenTool className="w-4 h-4 text-[#8C6A43]" />
                빈 도면 직접 그리기
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-2 text-xs text-[#787066]">
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#8C6A43]" /> 별도 설치 없이 웹에서 즉시 실행
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-[#8C6A43]" /> 실시간 자재 물량 & 견적 산출
              </span>
            </div>
          </div>

          {/* Editorial Preview Card */}
          <div className="lg:col-span-6">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-[#EAE3D8] via-[#DFD5C5] to-[#C8B9A3] p-6 sm:p-8 shadow-xl border border-[#DFD7CA]">
              {/* Simulated Architectural Mood Card */}
              <div className="bg-white/90 backdrop-blur-md rounded-2xl p-5 shadow-sm border border-white/60 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest uppercase text-[#8C6A43]">
                      SIGNATURE TEMPLATE
                    </span>
                    <h3 className="text-base font-bold text-[#1F1E1C] mt-0.5">
                      34평 4Bay · 웜 포세린 & 티크 우드
                    </h3>
                  </div>
                  <button
                    onClick={() => handleStartPreset('34py', 'walk')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#242220] text-white text-[11px] font-semibold hover:bg-[#3E3A35]"
                  >
                    <Footprints className="w-3.5 h-3.5" />
                    1인칭 걷기
                  </button>
                </div>

                {/* Color Palette Swatches */}
                <div className="grid grid-cols-4 gap-2.5">
                  <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EDE7DD]">
                    <div className="h-10 rounded-lg bg-[#EFEBE2] border border-[#DDD6C9] mb-2" />
                    <p className="text-[10px] font-bold text-[#1F1E1C] truncate">윤현상재 600각</p>
                    <p className="text-[10px] text-[#837B70] truncate">크림 샌드 포세린</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EDE7DD]">
                    <div className="h-10 rounded-lg bg-[#C8A074] border border-[#B0895D] mb-2" />
                    <p className="text-[10px] font-bold text-[#1F1E1C] truncate">동화자연마루</p>
                    <p className="text-[10px] text-[#837B70] truncate">에센스 오크</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EDE7DD]">
                    <div className="h-10 rounded-lg bg-[#F5F2EC] border border-[#E2DCD1] mb-2" />
                    <p className="text-[10px] font-bold text-[#1F1E1C] truncate">LX 디아망</p>
                    <p className="text-[10px] text-[#837B70] truncate">회벽 크림 화이트</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EDE7DD]">
                    <div className="h-10 rounded-lg bg-[#BC8C5E] border border-[#9E7146] mb-2" />
                    <p className="text-[10px] font-bold text-[#1F1E1C] truncate">한솔 스토리월</p>
                    <p className="text-[10px] text-[#837B70] truncate">티크 우드 루버</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-[#6E665C]">
                  <span>거실·주방 · 침실 2 · 현관 · 욕실 완비</span>
                  <span className="font-semibold text-[#1F1E1C]">84.9㎡ (34평형)</span>
                </div>
              </div>

              {/* 3 Feature Pills */}
              <div className="grid grid-cols-3 gap-2.5 mt-4">
                <div className="bg-white/75 backdrop-blur rounded-xl p-3 border border-white/50">
                  <Compass className="w-4 h-4 text-[#8C6A43] mb-1.5" />
                  <p className="text-xs font-bold text-[#1F1E1C]">스마트 2D CAD</p>
                  <p className="text-[10px] text-[#665F56] mt-0.5">코너 드래그로 평수 자동 계산</p>
                </div>
                <div className="bg-white/75 backdrop-blur rounded-xl p-3 border border-white/50">
                  <Layers className="w-4 h-4 text-[#8C6A43] mb-1.5" />
                  <p className="text-xs font-bold text-[#1F1E1C]">실제 색상 PBR</p>
                  <p className="text-[10px] text-[#665F56] mt-0.5">왜곡 없는 브랜드 원색 구현</p>
                </div>
                <div className="bg-white/75 backdrop-blur rounded-xl p-3 border border-white/50">
                  <Footprints className="w-4 h-4 text-[#8C6A43] mb-1.5" />
                  <p className="text-xs font-bold text-[#1F1E1C]">1인칭 워크스루</p>
                  <p className="text-[10px] text-[#665F56] mt-0.5">눈높이 시선으로 공간 체험</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Preset Templates Section */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-[11px] font-bold tracking-widest uppercase text-[#8C6A43]">START WITH A PLAN</p>
            <h2 className="text-2xl font-bold text-[#1F1E1C] mt-1">원하는 방식으로 바로 시작하세요</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <button
            onClick={() => handleStartPreset('34py', 'split')}
            className="group text-left bg-white rounded-2xl p-6 border border-[#E6DFD5] hover:border-[#8C6A43] hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-1 rounded-full bg-[#F4EFE6] text-[#7D5E3A] text-[11px] font-semibold">
                가장 인기
              </span>
              <ArrowRight className="w-4 h-4 text-[#9E9589] group-hover:text-[#8C6A43] group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-lg font-bold text-[#1F1E1C]">34평 4Bay 모델하우스</h3>
            <p className="text-xs text-[#6E665C] mt-2 leading-relaxed">
              대면형 아일랜드, 비스포크 냉장고장, 루씨에어 실링팬, 반매립 TV가 모두 세팅된 풀옵션 평면에서 자재만 바꿔보세요.
            </p>
          </button>

          <button
            onClick={() => handleStartPreset('25py', 'split')}
            className="group text-left bg-white rounded-2xl p-6 border border-[#E6DFD5] hover:border-[#8C6A43] hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-1 rounded-full bg-[#F1F5F9] text-[#475569] text-[11px] font-semibold">
                실속형 59㎡
              </span>
              <ArrowRight className="w-4 h-4 text-[#9E9589] group-hover:text-[#8C6A43] group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-lg font-bold text-[#1F1E1C]">25평 3Bay 표준 평면</h3>
            <p className="text-xs text-[#6E665C] mt-2 leading-relaxed">
              신혼부부·2~3인 가구에 최적화된 59㎡ 구조에서 동선과 바닥·벽지·중문 조합을 자유롭게 시뮬레이션하세요.
            </p>
          </button>

          <button
            onClick={() => handleStartPreset('blank', '2d')}
            className="group text-left bg-white rounded-2xl p-6 border border-[#E6DFD5] hover:border-[#8C6A43] hover:shadow-lg transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-1 rounded-full bg-[#F5F1EB] text-[#6B5D4D] text-[11px] font-semibold">
                자유 설계
              </span>
              <ArrowRight className="w-4 h-4 text-[#9E9589] group-hover:text-[#8C6A43] group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-lg font-bold text-[#1F1E1C]">빈 도면 & 밑그림 트레이싱</h3>
            <p className="text-xs text-[#6E665C] mt-2 leading-relaxed">
              분양 홈페이지에서 받은 평면도 이미지를 밑그림으로 깔고, 벽체와 사각형 방 도구로 우리 집 구조를 그대로 그려보세요.
            </p>
          </button>
        </div>
      </section>
    </div>
  );
};
