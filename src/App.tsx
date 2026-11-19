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
    { id: 'select', label: '선택', icon: <MousePointer2 className="w-4 h-4" /> },
    { id: 'demolish', label: '벽철거', icon: <Hammer className="w-4 h-4" /> },
    { id: 'draw_wall', label: '가벽', icon: <PenTool className="w-4 h-4" /> },
    { id: 'add_door', label: '문추가', icon: <DoorOpen className="w-4 h-4" /> },
    { id: 'add_window', label: '창추가', icon: <AppWindow className="w-4 h-4" /> },
    { id: 'add_light', label: '조명', icon: <Lightbulb className="w-4 h-4" /> },
    { id: 'add_outlet', label: '콘센트', icon: <Plug className="w-4 h-4" /> },
  ];

  return (
    <div className="w-screen h-screen flex flex-col bg-white text-[#37352F] overflow-hidden">
      {/* Notion-style Top Header & Breadcrumb */}
      <header className="h-13 shrink-0 border-b border-[#E9E9E7] bg-white px-3 lg:px-4 flex items-center justify-between gap-2">
        {/* Left: Home + Workspace Logo + Breadcrumb Apartment Selector */}
        <div className="flex items-center gap-1.5 min-w-0">
          <button
            onClick={goHome}
            title="홈 화면으로 이동"
            className="flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-md hover:bg-[#EFEFEE] transition cursor-pointer"
          >
            <div className="w-6 h-6 rounded-md bg-[#37352F] flex items-center justify-center font-bold text-white text-xs">
              Y
            </div>
            <span className="hidden sm:inline text-sm font-bold tracking-tight text-[#37352F]">
              Yulha Interior
            </span>
          </button>

          {hasSelectedPlan && (
            <button
              onClick={goHome}
              title="홈 화면으로 돌아가기"
              className="flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium text-[#787774] hover:text-[#37352F] hover:bg-[#EFEFEE] transition shrink-0"
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden md:inline">홈</span>
            </button>
          )}

          <span className="text-[#D3D1CB] hidden sm:inline">/</span>

          <button
            onClick={() => {
              setImportMode('base');
              setPastedImageUrl(null);
              setImportModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md hover:bg-[#EFEFEE] transition text-left min-w-0 group"
          >
            <ScanLine className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            {hasSelectedPlan ? (
              <>
                <span className="text-xs font-semibold text-[#37352F] truncate">
                  {plan.complexName}
                </span>
                <span className="text-[11px] px-1.5 py-0.5 rounded bg-[#EBF5FF] text-[#2383E2] font-medium shrink-0">
                  {plan.areaSqm}㎡
                </span>
              </>
            ) : (
              <span className="text-xs font-semibold text-emerald-700">
                네이버 도면 붙여넣기 (Ctrl+V) · 업로드
              </span>
            )}
          </button>

          {/* 옵션 도면이 추가된 경우 옵션 선택 스위치 + 옵션 도면 추가 버튼 */}
          {hasSelectedPlan && (
            <div className="flex items-center gap-1 shrink-0">
              {plan.optionVariants && plan.optionVariants.length > 1 && (
                <div className="flex items-center bg-[#F7F7F5] border border-[#E9E9E7] rounded-md p-0.5 gap-0.5">
                  {plan.optionVariants.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => selectOptionVariant(opt.id)}
                      className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                        (plan.activeOptionId || 'base') === opt.id
                          ? 'bg-[#2383E2] text-white shadow-2xs'
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
                title="현재 기본 도면에 분양 유상옵션 도면 추가"
                className="px-2 py-1 rounded-md text-[11px] font-semibold border border-[#D3D1CB] bg-white hover:bg-[#EFEFEE] text-[#37352F] transition shrink-0"
              >
                + 옵션 도면
              </button>
            </div>
          )}

          {/* 확장형 / 비확장형 전환 스위치 */}
          {hasSelectedPlan && (
            <button
              onClick={toggleExtendedMode}
              title="발코니 확장형 / 비확장형 전환 (2D·3D 동시 반영)"
              className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition shrink-0 ${
                plan.isExtended ?? true
                  ? 'bg-[#DDEDEA] text-[#0F7B6C] border-[#B8DBD5]'
                  : 'bg-[#FAEBDD] text-[#D9730D] border-[#F2CFAF]'
              }`}
            >
              {(plan.isExtended ?? true) ? '확장형' : '비확장형'}
            </button>
          )}
        </div>

        {/* Center View Mode Switcher (Notion Segmented Pill) */}
        <div className="hidden md:flex items-center bg-[#F7F7F5] border border-[#E9E9E7] rounded-lg p-0.5 gap-0.5">
          <button
            onClick={() => setViewMode('split')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
              viewMode === 'split'
                ? 'bg-white text-[#37352F] shadow-xs border border-[#E9E9E7]'
                : 'text-[#787774] hover:text-[#37352F]'
            }`}
          >
            <Columns2 className="w-3.5 h-3.5 text-[#2383E2]" />
            <span>2D + 3D 연동</span>
          </button>
          <button
            onClick={() => setViewMode('2d')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
              viewMode === '2d'
                ? 'bg-white text-[#37352F] shadow-xs border border-[#E9E9E7]'
                : 'text-[#787774] hover:text-[#37352F]'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>2D 도면</span>
          </button>
          <button
            onClick={() => setViewMode('3d')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
              viewMode === '3d'
                ? 'bg-white text-[#37352F] shadow-xs border border-[#E9E9E7]'
                : 'text-[#787774] hover:text-[#37352F]'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D 모델</span>
          </button>

          {hasSelectedPlan && (
            <>
              <div className="w-px h-4 bg-[#E9E9E7] mx-0.5" />
              <button
                onClick={() => setSyncMode(syncMode === 'realtime' ? 'manual' : 'realtime')}
                title={
                  syncMode === 'realtime'
                    ? '현재: 2D 수정 시 3D 실시간 반영 중 (클릭 시 수동 반영 모드로 전환)'
                    : '현재: 2D 수정 후 [3D 업데이트] 클릭 시 반영 (클릭 시 실시간 모드로 전환)'
                }
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition ${
                  syncMode === 'realtime'
                    ? 'text-[#0F7B6C] bg-[#DDEDEA]/70 hover:bg-[#DDEDEA]'
                    : 'text-[#787774] hover:text-[#37352F] hover:bg-[#EFEFEE]'
                }`}
              >
                {syncMode === 'realtime' ? '실시간 3D' : '수동 3D'}
              </button>
              {syncMode === 'manual' && (
                <button
                  onClick={commit3DUpdate}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold flex items-center gap-1 transition ${
                    hasPending3DChanges
                      ? 'bg-[#2383E2] text-white shadow-xs animate-pulse'
                      : 'bg-white text-[#787774] border border-[#E9E9E7]'
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>3D 업데이트</span>
                </button>
              )}
            </>
          )}
        </div>

        {/* Right Actions: Undo/Redo, Save, Estimate, AI */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={undo}
            disabled={past.length === 0}
            className="p-1.5 rounded-md text-[#787774] hover:text-[#37352F] hover:bg-[#EFEFEE] disabled:opacity-30 transition"
            title="실행 취소 (Undo)"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={future.length === 0}
            className="p-1.5 rounded-md text-[#787774] hover:text-[#37352F] hover:bg-[#EFEFEE] disabled:opacity-30 transition"
            title="다시 실행 (Redo)"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <button
            onClick={resetPlan}
            className="p-1.5 rounded-md text-[#787774] hover:text-[#37352F] hover:bg-[#EFEFEE] hidden sm:block transition"
            title="도면 초기화"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="h-4 w-px bg-[#E9E9E7] mx-1 hidden sm:block" />

          <button
            onClick={handleSaveLocal}
            className="p-1.5 rounded-md text-[#787774] hover:text-[#37352F] hover:bg-[#EFEFEE] hidden lg:block transition"
            title="브라우저에 저장"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            onClick={handleLoadLocal}
            className="p-1.5 rounded-md text-[#787774] hover:text-[#37352F] hover:bg-[#EFEFEE] hidden lg:block transition"
            title="저장된 프로젝트 불러오기"
          >
            <FolderOpen className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setImportMode('base');
              setPastedImageUrl(null);
              setImportModalOpen(true);
            }}
            className="px-2.5 py-1.5 rounded-md bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition"
            title="네이버 부동산 2D 평면도 붙여넣기(Ctrl+V) 또는 업로드"
          >
            <ScanLine className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {hasSelectedPlan ? '다른 도면 검색' : '도면 검색'}
            </span>
          </button>

          <button
            onClick={() => setModalMode('estimate')}
            className="px-2.5 py-1.5 rounded-md bg-[#DDEDEA] hover:bg-[#CFE6E2] text-[#0F7B6C] text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">실시간 견적</span>
          </button>

          <button
            onClick={() => setModalMode('ai')}
            className="px-2.5 py-1.5 rounded-md bg-[#2383E2] hover:bg-[#1A6EC2] text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI 디자이너</span>
          </button>
        </div>
      </header>

      {/* Main Studio Body */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Left Vertical CAD Tool Dock (only when plan is active) */}
        {hasSelectedPlan && (
          <nav className="w-14 shrink-0 border-r border-[#E9E9E7] bg-[#F7F7F5] flex flex-col items-center py-2.5 gap-1.5">
            {tools.map((t) => {
              const active = editorTool === t.id;
              const isDemolish = t.id === 'demolish';
              return (
                <button
                  key={t.id}
                  onClick={() => setEditorTool(t.id)}
                  className={`w-11 py-2 rounded-lg flex flex-col items-center justify-center gap-1 transition ${
                    active
                      ? isDemolish
                        ? 'bg-[#FBE4E4] text-[#E03E3E] border border-[#F5C2C2]'
                        : 'bg-[#EBF5FF] text-[#2383E2] border border-[#BFE0FF]'
                      : 'text-[#787774] hover:text-[#37352F] hover:bg-[#EFEFEE]'
                  }`}
                  title={t.label}
                >
                  {t.icon}
                  <span className="text-[9px] font-semibold">{t.label}</span>
                </button>
              );
            })}

            <div className="w-8 h-px bg-[#E9E9E7] my-1" />

            <button
              onClick={() => setShowFurniture(!showFurniture)}
              className={`w-11 py-2 rounded-lg flex flex-col items-center justify-center gap-1 transition ${
                showFurniture
                  ? 'bg-white text-[#37352F] border border-[#E9E9E7] shadow-2xs'
                  : 'text-[#9B9A97] hover:text-[#37352F] hover:bg-[#EFEFEE]'
              }`}
              title="기본 가구 배치 표시/숨김"
            >
              <Sofa className="w-4 h-4" />
              <span className="text-[9px] font-semibold">가구</span>
            </button>

            <button
              onClick={() => setShowDimensions(!showDimensions)}
              className={`w-11 py-2 rounded-lg flex flex-col items-center justify-center gap-1 transition ${
                showDimensions
                  ? 'bg-white text-[#37352F] border border-[#E9E9E7] shadow-2xs'
                  : 'text-[#9B9A97] hover:text-[#37352F] hover:bg-[#EFEFEE]'
              }`}
              title="2D 치수 표시/숨김"
            >
              <Ruler className="w-4 h-4" />
              <span className="text-[9px] font-semibold">치수</span>
            </button>
          </nav>
        )}

        {/* Coupled 2D & 3D Viewports or Full Studio Home Dashboard */}
        <main className="flex-1 flex min-w-0 min-h-0">
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
                  } h-full min-w-0`}
                >
                  <Viewport2D />
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

        {/* Right Material & Property Panel (only when plan is active) */}
        {hasSelectedPlan && <MaterialPanel />}

        {/* Notion-style Floating Toast */}
        {toastMessage && (
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-[#37352F] text-white text-xs font-medium shadow-lg">
            {toastMessage}
          </div>
        )}
      </div>

      {/* Modals */}
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
