import React, { useEffect, useState } from 'react';
import { useStudioStore } from './store/useStudioStore';
import { Viewport2D } from './components/Viewport2D';
import { Viewport3D } from './components/Viewport3D';
import { MaterialPanel } from './components/MaterialPanel';
import { AiAndEstimateModal } from './components/AiAndEstimateModal';
import { FloorPlanImportModal } from './components/FloorPlanImportModal';
import { StudioHomeDashboard } from './components/StudioHomeDashboard';
import { saveBlueprintForType } from './utils/savedBlueprints';
import {
  MousePointer2,
  Hammer,
  PenTool,
  DoorOpen,
  AppWindow,
  Lightbulb,
  Undo2,
  Redo2,
  RotateCcw,
  Sparkles,
  Calculator,
  Columns2,
  Square,
  Box,
  Sofa,
  Ruler,
  Save,
  FolderOpen,
  ScanLine,
  Home,
  Plug,
  RefreshCw,
  PanelLeftClose,
  PanelLeftOpen,
  SlidersHorizontal,
  Crown,
} from 'lucide-react';
import { EditorTool } from './types/interior';

export function App() {
  const {
    hasSelectedPlan,
    plan,
    past,
    future,
    editorTool,
    viewMode,
    syncMode,
    hasPending3DChanges,
    showFurniture,
    showDimensions,
    toastMessage,
    setEditorTool,
    setViewMode,
    setSyncMode,
    commit3DUpdate,
    setShowFurniture,
    setShowDimensions,
    toggleExtendedMode,
    selectOptionVariant,
    undo,
    redo,
    resetPlan,
    goHome,
    showToast,
  } = useStudioStore();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<'base' | 'option'>('base');
  const [importSourceTab, setImportSourceTab] = useState<'naver' | 'bunyang'>('naver');
  const [pastedImageUrl, setPastedImageUrl] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'ai' | 'estimate' | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!hasSelectedPlan || importModalOpen || modalMode) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if (e.key === 'Escape') {
        setEditorTool('select');
        useStudioStore.getState().selectTarget(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [hasSelectedPlan, importModalOpen, modalMode, undo, redo, setEditorTool]);

  useEffect(() => {
    const onWindowPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (!file) continue;
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              setPastedImageUrl(reader.result);
              setImportModalOpen(true);
            }
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    };
    window.addEventListener('paste', onWindowPaste);
    return () => window.removeEventListener('paste', onWindowPaste);
  }, []);

  const handleSaveLocal = () => {
    localStorage.setItem('gangdong_interior_saved_plan', JSON.stringify(plan));
    if (plan.complexId && plan.typeName) {
      saveBlueprintForType(plan.complexId, plan.typeName, plan);
    }
    showToast('현재 인테리어 도면과 자재 설정이 저장되었습니다.');
  };

  const handleLoadLocal = () => {
    const raw = localStorage.getItem('gangdong_interior_saved_plan');
    if (!raw) {
      showToast('저장된 프로젝트가 없습니다.');
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      useStudioStore.getState().loadPlanTemplate(parsed);
      showToast('저장된 인테리어 프로젝트를 불러왔습니다.');
    } catch {
      showToast('저장된 데이터를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const tools: { id: EditorTool; label: string; icon: React.ReactNode }[] = [
    { id: 'select', label: '선택', icon: <MousePointer2 className="w-3.5 h-3.5" /> },
    { id: 'demolish', label: '벽철거', icon: <Hammer className="w-3.5 h-3.5" /> },
    { id: 'draw_wall', label: '가벽', icon: <PenTool className="w-3.5 h-3.5" /> },
    { id: 'add_door', label: '문', icon: <DoorOpen className="w-3.5 h-3.5" /> },
    { id: 'add_window', label: '창문', icon: <AppWindow className="w-3.5 h-3.5" /> },
    { id: 'add_light', label: '조명', icon: <Lightbulb className="w-3.5 h-3.5" /> },
    { id: 'add_outlet', label: '콘센트', icon: <Plug className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="w-screen h-screen flex bg-white text-[#37352F] overflow-hidden">
      {/* Notion Left Workspace Sidebar */}
      {sidebarOpen && (
        <aside className="w-56 shrink-0 h-full bg-[#F7F7F5] border-r border-[#E9E9E7] flex flex-col justify-between select-none">
          <div className="p-3 space-y-4 overflow-y-auto">
            {/* Workspace Identity */}
            <div className="flex items-center justify-between px-1">
              <button
                onClick={goHome}
                className="flex items-center gap-2 text-left hover:opacity-80 transition"
              >
                <div className="w-6 h-6 rounded-md bg-[#0F7B6C] text-white flex items-center justify-center text-xs font-black">
                  Y
                </div>
                <span className="text-xs font-bold tracking-tight text-[#37352F]">
                  Yulha Studio
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#EFEFED] text-[#787774] text-[9px] font-bold">
                  FREE
                </span>
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded hover:bg-[#EAEAE6] text-[#787774]"
                title="사이드바 접기"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Workspace Views */}
            <div className="space-y-0.5">
              <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#9B9A97]">
                워크스페이스
              </div>
              <button
                onClick={goHome}
                className={`w-full px-2 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition ${
                  !hasSelectedPlan
                    ? 'bg-[#EAEAE6] text-[#37352F] font-semibold'
                    : 'text-[#5F5E5B] hover:bg-[#EFEFED]'
                }`}
              >
                <Home className="w-3.5 h-3.5 text-[#787774]" />
                <span>홈 · 프로젝트 시작</span>
              </button>

              {hasSelectedPlan && (
                <>
                  <button
                    onClick={() => setViewMode('split')}
                    className={`w-full px-2 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition ${
                      viewMode === 'split'
                        ? 'bg-[#EAEAE6] text-[#37352F] font-semibold'
                        : 'text-[#5F5E5B] hover:bg-[#EFEFED]'
                    }`}
                  >
                    <Columns2 className="w-3.5 h-3.5 text-[#0F7B6C]" />
                    <span>2D + 3D 동시 작업</span>
                  </button>
                  <button
                    onClick={() => setViewMode('2d')}
                    className={`w-full px-2 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition ${
                      viewMode === '2d'
                        ? 'bg-[#EAEAE6] text-[#37352F] font-semibold'
                        : 'text-[#5F5E5B] hover:bg-[#EFEFED]'
                    }`}
                  >
                    <Square className="w-3.5 h-3.5 text-[#787774]" />
                    <span>2D 도면 편집기</span>
                  </button>
                  <button
                    onClick={() => setViewMode('3d')}
                    className={`w-full px-2 py-1.5 rounded-md text-xs font-medium flex items-center gap-2 transition ${
                      viewMode === '3d'
                        ? 'bg-[#EAEAE6] text-[#37352F] font-semibold'
                        : 'text-[#5F5E5B] hover:bg-[#EFEFED]'
                    }`}
                  >
                    <Box className="w-3.5 h-3.5 text-[#2383E2]" />
                    <span>3D 인테리어 스튜디오</span>
                  </button>
                </>
              )}
            </div>

            {/* Floor Plan Import */}
            <div className="space-y-0.5">
              <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#9B9A97]">
                도면 가져오기
              </div>
              <button
                onClick={() => {
                  setImportMode('base');
                  setImportSourceTab('naver');
                  setPastedImageUrl(null);
                  setImportModalOpen(true);
                }}
                className="w-full px-2 py-1.5 rounded-md text-xs font-medium text-[#5F5E5B] hover:bg-[#EFEFED] flex items-center gap-2 transition"
              >
                <ScanLine className="w-3.5 h-3.5 text-[#0F7B6C]" />
                <span>네이버 부동산 도면</span>
              </button>
              <button
                onClick={() => {
                  setImportMode('base');
                  setImportSourceTab('bunyang');
                  setPastedImageUrl(null);
                  setImportModalOpen(true);
                }}
                className="w-full px-2 py-1.5 rounded-md text-xs font-medium text-[#5F5E5B] hover:bg-[#EFEFED] flex items-center gap-2 transition"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-[#2383E2]" />
                <span>분양 + 옵션 합성</span>
              </button>
            </div>

            {/* Estimate & AI */}
            <div className="space-y-0.5">
              <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#9B9A97]">
                견적 · AI 스타일링
              </div>
              <button
                onClick={() => setModalMode('estimate')}
                className="w-full px-2 py-1.5 rounded-md text-xs font-medium text-[#5F5E5B] hover:bg-[#EFEFED] flex items-center gap-2 transition"
              >
                <Calculator className="w-3.5 h-3.5 text-[#0F7B6C]" />
                <span>실시간 견적서</span>
              </button>
              <button
                onClick={() => setModalMode('ai')}
                className="w-full px-2 py-1.5 rounded-md text-xs font-medium text-[#5F5E5B] hover:bg-[#EFEFED] flex items-center gap-2 transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#2383E2]" />
                <span>AI 인테리어 디자이너</span>
              </button>
            </div>
          </div>

          {/* Bottom Subscription / Save Area */}
          <div className="p-3 border-t border-[#E9E9E7] space-y-1.5">
            <button
              onClick={handleSaveLocal}
              disabled={!hasSelectedPlan}
              className="w-full px-2.5 py-1.5 rounded-md bg-white hover:bg-[#EFEFED] border border-[#E9E9E7] text-xs font-medium text-[#37352F] flex items-center justify-between disabled:opacity-40 transition"
            >
              <span className="flex items-center gap-1.5">
                <Save className="w-3.5 h-3.5 text-[#787774]" />
                <span>프로젝트 저장</span>
              </span>
              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                <Crown className="w-2.5 h-2.5" /> PRO
              </span>
            </button>
            <button
              onClick={handleLoadLocal}
              className="w-full px-2.5 py-1.5 rounded-md bg-white hover:bg-[#EFEFED] border border-[#E9E9E7] text-xs font-medium text-[#37352F] flex items-center justify-between transition"
            >
              <span className="flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-[#787774]" />
                <span>저장 불러오기</span>
              </span>
              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                <Crown className="w-2.5 h-2.5" /> PRO
              </span>
            </button>
            <div className="px-1 pt-1 text-[10px] text-[#9B9A97] leading-snug">
              편집/3D 무료 · 클라우드 저장·불러오기는 추후 월 구독 연동 예정
            </div>
          </div>
        </aside>
      )}

      {/* Right Main Column: Notion Top Breadcrumb Bar + Workspace Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Clean Notion Breadcrumb Topbar (No cramped wrapping!) */}
        <header className="h-11 shrink-0 border-b border-[#E9E9E7] bg-white px-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded hover:bg-[#EFEFED] text-[#787774]"
                title="사이드바 열기"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={goHome}
              className="text-xs font-medium text-[#787774] hover:text-[#37352F] whitespace-nowrap shrink-0"
            >
              Yulha Studio
            </button>

            {hasSelectedPlan && (
              <>
                <span className="text-[#D3D1CB]">/</span>
                <span className="text-xs font-bold text-[#37352F] truncate">
                  {plan.complexName}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-[#EBF5FF] text-[#2383E2] text-[10px] font-semibold whitespace-nowrap shrink-0">
                  {plan.areaSqm}㎡
                </span>

                <button
                  onClick={toggleExtendedMode}
                  className={`px-2 py-0.5 rounded text-[10px] font-semibold border whitespace-nowrap shrink-0 ${
                    plan.isExtended ?? true
                      ? 'bg-[#DDEDEA] text-[#0F7B6C] border-[#B8DBD5]'
                      : 'bg-[#FAEBDD] text-[#D9730D] border-[#F2CFAF]'
                  }`}
                >
                  {(plan.isExtended ?? true) ? '확장형' : '비확장형'}
                </button>

                {plan.optionVariants && plan.optionVariants.length > 1 && (
                  <div className="hidden lg:flex items-center bg-[#F7F7F5] border border-[#E9E9E7] rounded p-0.5 gap-0.5 shrink-0">
                    {plan.optionVariants.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => selectOptionVariant(opt.id)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap ${
                          (plan.activeOptionId || 'base') === opt.id
                            ? 'bg-white text-[#2383E2] shadow-2xs'
                            : 'text-[#787774] hover:text-[#37352F]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => {
                    setImportMode('option');
                    setPastedImageUrl(null);
                    setImportModalOpen(true);
                  }}
                  className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-semibold border border-[#E9E9E7] hover:bg-[#EFEFED] text-[#37352F] whitespace-nowrap shrink-0"
                >
                  + 옵션 도면
                </button>
              </>
            )}
          </div>

          {/* Right Slim Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {hasSelectedPlan && (
              <>
                <button
                  onClick={undo}
                  disabled={past.length === 0}
                  className="p-1.5 rounded hover:bg-[#EFEFED] text-[#787774] disabled:opacity-30"
                  title="실행 취소 (Ctrl+Z)"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={redo}
                  disabled={future.length === 0}
                  className="p-1.5 rounded hover:bg-[#EFEFED] text-[#787774] disabled:opacity-30"
                  title="다시 실행 (Ctrl+Y)"
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={resetPlan}
                  className="p-1.5 rounded hover:bg-[#EFEFED] text-[#787774] hidden sm:block"
                  title="도면 초기화"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <div className="h-4 w-px bg-[#E9E9E7] mx-0.5" />

                <button
                  onClick={() => setSyncMode(syncMode === 'realtime' ? 'manual' : 'realtime')}
                  className={`px-2 py-1 rounded text-[11px] font-semibold whitespace-nowrap ${
                    syncMode === 'realtime'
                      ? 'bg-[#DDEDEA] text-[#0F7B6C]'
                      : 'bg-[#F7F7F5] text-[#787774] border border-[#E9E9E7]'
                  }`}
                  title="실시간 3D 반영 / 수동 3D 업데이트 전환"
                >
                  {syncMode === 'realtime' ? '실시간 3D' : '수동 3D'}
                </button>

                {syncMode === 'manual' && (
                  <button
                    onClick={commit3DUpdate}
                    className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 whitespace-nowrap ${
                      hasPending3DChanges
                        ? 'bg-[#2383E2] text-white shadow-xs animate-pulse'
                        : 'bg-[#F7F7F5] text-[#787774] border border-[#E9E9E7]'
                    }`}
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>3D 업데이트</span>
                  </button>
                )}
              </>
            )}
          </div>
        </header>

        {/* Main Canvas & Material Inspector */}
        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          <main className="flex-1 flex min-w-0 min-h-0 relative">
            {!hasSelectedPlan ? (
              <StudioHomeDashboard
                onOpenNaverSearch={() => {
                  setImportMode('base');
                  setImportSourceTab('naver');
                  setPastedImageUrl(null);
                  setImportModalOpen(true);
                }}
                onOpenBunyangSearch={() => {
                  setImportMode('base');
                  setImportSourceTab('bunyang');
                  setPastedImageUrl(null);
                  setImportModalOpen(true);
                }}
                onUploadFile={(file) => {
                  const reader = new FileReader();
                  reader.onload = () => {
                    if (typeof reader.result === 'string') {
                      setImportMode('base');
                      setImportSourceTab('naver');
                      setPastedImageUrl(reader.result);
                      setImportModalOpen(true);
                    }
                  };
                  reader.readAsDataURL(file);
                }}
                onSelectPresetPlan={(presetPlan) => {
                  useStudioStore.getState().loadPlanTemplate(presetPlan);
                  showToast(`${presetPlan.complexName} ${presetPlan.typeName} 도면을 열었습니다.`);
                }}
                onLoadSavedPlan={handleLoadLocal}
              />
            ) : (
              <>
                {(viewMode === 'split' || viewMode === '2d') && (
                  <div
                    className={`${
                      viewMode === 'split'
                        ? 'w-1/2 border-r border-[#E9E9E7]'
                        : 'w-full'
                    } h-full min-w-0 relative`}
                  >
                    <Viewport2D />

                    {/* Notion Floating Bottom CAD Pill over 2D Viewport */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 bg-white/95 backdrop-blur-sm border border-[#E9E9E7] shadow-md rounded-xl px-1.5 py-1">
                      {tools.map((t) => {
                        const active = editorTool === t.id;
                        const isDemolish = t.id === 'demolish';
                        return (
                          <button
                            key={t.id}
                            onClick={() => setEditorTool(t.id)}
                            className={`px-2 py-1.5 rounded-lg flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap transition ${
                              active
                                ? isDemolish
                                  ? 'bg-[#FBE4E4] text-[#E03E3E]'
                                  : 'bg-[#EBF5FF] text-[#2383E2]'
                                : 'text-[#787774] hover:text-[#37352F] hover:bg-[#EFEFEE]'
                            }`}
                          >
                            {t.icon}
                            <span className="hidden xl:inline">{t.label}</span>
                          </button>
                        );
                      })}
                      <div className="w-px h-4 bg-[#E9E9E7] mx-0.5" />
                      <button
                        onClick={() => setShowFurniture(!showFurniture)}
                        className={`px-2 py-1.5 rounded-lg flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap ${
                          showFurniture
                            ? 'bg-[#F7F7F5] text-[#37352F]'
                            : 'text-[#9B9A97] hover:text-[#37352F]'
                        }`}
                        title="가구 표시"
                      >
                        <Sofa className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setShowDimensions(!showDimensions)}
                        className={`px-2 py-1.5 rounded-lg flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap ${
                          showDimensions
                            ? 'bg-[#F7F7F5] text-[#37352F]'
                            : 'text-[#9B9A97] hover:text-[#37352F]'
                        }`}
                        title="치수 표시"
                      >
                        <Ruler className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {(viewMode === 'split' || viewMode === '3d') && (
                  <div
                    className={`${
                      viewMode === 'split' ? 'w-1/2' : 'w-full'
                    } h-full min-w-0`}
                  >
                    <Viewport3D />
                  </div>
                )}
              </>
            )}
          </main>

          {hasSelectedPlan && <MaterialPanel />}

          {toastMessage && (
            <div className="fixed bottom-5 right-5 z-50 px-4 py-2 rounded-lg bg-[#37352F] text-white text-xs font-medium shadow-lg">
              {toastMessage}
            </div>
          )}
        </div>
      </div>

      <FloorPlanImportModal
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        initialImageUrl={pastedImageUrl}
        importMode={importMode}
        initialSourceTab={importSourceTab}
      />
      <AiAndEstimateModal
        mode={modalMode}
        onClose={() => setModalMode(null)}
      />
    </div>
  );
}

export default App;
