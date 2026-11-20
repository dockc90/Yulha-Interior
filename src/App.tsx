import React, { useEffect, useState } from 'react';
import { useProjectStore } from './store/useProjectStore';
import { createBlankCanvasPlan } from './data/starterTemplates';
import { Canvas2DEditor } from './components/Canvas2DEditor';
import { Studio3DViewport } from './components/Studio3DViewport';
import { InspectorPanel } from './components/InspectorPanel';
import { UnderlayModal } from './components/UnderlayModal';
import { EstimateModal } from './components/EstimateModal';
import { ProjectLibraryModal } from './components/ProjectLibraryModal';
import { FloorPlanFinder } from './components/FloorPlanFinder';
import {
  Box,
  Calculator,
  Columns2,
  Crown,
  DoorOpen,
  FolderOpen,
  Home,
  ImagePlus,
  Lightbulb,
  MousePointer2,
  PanelLeftClose,
  PanelLeftOpen,
  PenTool,
  Plug,
  Redo2,
  RefreshCw,
  Ruler,
  Save,
  Sofa,
  Square,
  Undo2,
  AppWindow,
  LayoutGrid,
  Trash2,
} from 'lucide-react';
import { ToolMode } from './types/studio';

export function App() {
  const {
    hasActiveProject,
    project,
    past,
    future,
    viewMode,
    autoSync3D,
    hasPending3DChanges,
    toolMode,
    selection,
    showDimensions,
    toast,
    openProject,
    goHome,
    setViewMode,
    setAutoSync3D,
    commit3DUpdate,
    setToolMode,
    setSelection,
    setShowDimensions,
    deleteSelected,
    duplicateSelectedObject,
    undo,
    redo,
  } = useProjectStore();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [underlayOpen, setUnderlayOpen] = useState(false);
  const [estimateOpen, setEstimateOpen] = useState(false);
  const [libraryMode, setLibraryMode] = useState<'save' | 'load' | null>(null);

  useEffect(() => {
    const onPasteGlobal = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const f = item.getAsFile();
          if (!f) continue;
          const reader = new FileReader();
          reader.onload = () => {
            if (typeof reader.result === 'string') {
              const st = useProjectStore.getState();
              if (!st.hasActiveProject) {
                st.openProject(createBlankCanvasPlan());
              }
              st.setUnderlayImage(reader.result);
              st.convertUnderlayTo2D(reader.result);
              setUnderlayOpen(false);
            }
          };
          reader.readAsDataURL(f);
          break;
        }
      }
    };
    window.addEventListener('paste', onPasteGlobal);
    return () => window.removeEventListener('paste', onPasteGlobal);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!hasActiveProject) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelectedObject();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      } else if (e.key === 'Escape') {
        setToolMode('select');
        setSelection(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hasActiveProject, undo, redo, deleteSelected, duplicateSelectedObject, setToolMode, setSelection]);

  const handleSavePro = () => setLibraryMode('save');
  const handleLoadPro = () => setLibraryMode('load');

  const tools: { id: ToolMode; label: string; icon: React.ReactNode }[] = [
    { id: 'select', label: '선택', icon: <MousePointer2 className="w-3.5 h-3.5" /> },
    { id: 'add_room', label: '방 지정', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { id: 'draw_wall', label: '벽 그리기', icon: <PenTool className="w-3.5 h-3.5" /> },
    { id: 'add_door', label: '문', icon: <DoorOpen className="w-3.5 h-3.5" /> },
    { id: 'add_window', label: '창문', icon: <AppWindow className="w-3.5 h-3.5" /> },
    { id: 'add_outlet', label: '콘센트', icon: <Plug className="w-3.5 h-3.5" /> },
    { id: 'add_light', label: '조명', icon: <Lightbulb className="w-3.5 h-3.5" /> },
    { id: 'add_furniture', label: '가전/가구', icon: <Sofa className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="w-screen h-screen flex bg-white text-[#37352F] overflow-hidden">
      {/* Notion Workspace Left Sidebar */}
      {sidebarOpen && (
        <aside className="w-56 shrink-0 h-full bg-[#F7F7F5] border-r border-[#E9E9E7] flex flex-col justify-between select-none">
          <div className="p-3 space-y-5 overflow-y-auto">
            <div className="flex items-center justify-between px-1">
              <button onClick={goHome} className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#0F7B6C] text-white flex items-center justify-center text-xs font-black">
                  Y
                </div>
                <span className="text-xs font-bold text-[#37352F]">Yulha Interior</span>
              </button>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 rounded hover:bg-[#EAEAE6] text-[#787774]"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            </div>

            <nav className="space-y-0.5">
              <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#9B9A97]">
                워크스페이스
              </div>
              <button
                onClick={goHome}
                className={`w-full px-2 py-1.5 rounded-md text-xs flex items-center gap-2 ${
                  !hasActiveProject ? 'bg-[#EAEAE6] font-semibold' : 'text-[#5F5E5B] hover:bg-[#EFEFED]'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>홈</span>
              </button>

              {hasActiveProject && (
                <>
                  <button
                    onClick={() => setViewMode('split')}
                    className={`w-full px-2 py-1.5 rounded-md text-xs flex items-center gap-2 ${
                      viewMode === 'split' ? 'bg-[#EAEAE6] font-semibold' : 'text-[#5F5E5B] hover:bg-[#EFEFED]'
                    }`}
                  >
                    <Columns2 className="w-3.5 h-3.5 text-[#0F7B6C]" />
                    <span>2D + 3D 연동</span>
                  </button>
                  <button
                    onClick={() => setViewMode('2d')}
                    className={`w-full px-2 py-1.5 rounded-md text-xs flex items-center gap-2 ${
                      viewMode === '2d' ? 'bg-[#EAEAE6] font-semibold' : 'text-[#5F5E5B] hover:bg-[#EFEFED]'
                    }`}
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>2D 도면 편집</span>
                  </button>
                  <button
                    onClick={() => setViewMode('3d')}
                    className={`w-full px-2 py-1.5 rounded-md text-xs flex items-center gap-2 ${
                      viewMode === '3d' ? 'bg-[#EAEAE6] font-semibold' : 'text-[#5F5E5B] hover:bg-[#EFEFED]'
                    }`}
                  >
                    <Box className="w-3.5 h-3.5 text-[#2383E2]" />
                    <span>3D 인테리어</span>
                  </button>
                </>
              )}
            </nav>

            {hasActiveProject && (
              <div className="space-y-0.5">
                <div className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#9B9A97]">
                  도구 · 견적
                </div>
                <button
                  onClick={() => setUnderlayOpen(true)}
                  className="w-full px-2 py-1.5 rounded-md text-xs text-[#5F5E5B] hover:bg-[#EFEFED] flex items-center gap-2"
                >
                  <ImagePlus className="w-3.5 h-3.5 text-[#0F7B6C]" />
                  <span>도면 밑그림 깔기</span>
                </button>
                <button
                  onClick={() => setEstimateOpen(true)}
                  className="w-full px-2 py-1.5 rounded-md text-xs text-[#5F5E5B] hover:bg-[#EFEFED] flex items-center gap-2"
                >
                  <Calculator className="w-3.5 h-3.5 text-[#0F7B6C]" />
                  <span>실시간 견적서</span>
                </button>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-[#E9E9E7] space-y-1.5">
            <button
              onClick={handleSavePro}
              disabled={!hasActiveProject}
              className="w-full px-2.5 py-1.5 rounded-md bg-white hover:bg-[#EFEFED] border border-[#E9E9E7] text-xs font-medium flex items-center justify-between disabled:opacity-40"
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
              onClick={handleLoadPro}
              className="w-full px-2.5 py-1.5 rounded-md bg-white hover:bg-[#EFEFED] border border-[#E9E9E7] text-xs font-medium flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-[#787774]" />
                <span>저장 불러오기</span>
              </span>
              <span className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
                <Crown className="w-2.5 h-2.5" /> PRO
              </span>
            </button>
          </div>
        </aside>
      )}

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Top Notion Breadcrumb Header */}
        <header className="h-11 shrink-0 border-b border-[#E9E9E7] bg-white px-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {!sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1.5 rounded hover:bg-[#EFEFED] text-[#787774]"
              >
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}
            <button onClick={goHome} className="text-xs font-medium text-[#787774] hover:text-[#37352F]">
              Yulha Interior
            </button>
            {hasActiveProject && (
              <>
                <span className="text-[#D3D1CB]">/</span>
                <span className="text-xs font-bold text-[#37352F] truncate">{project.title}</span>
              </>
            )}
          </div>

          {hasActiveProject && (
            <div className="flex items-center gap-1.5 shrink-0">
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
                title="다시 실행"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>

              <div className="h-4 w-px bg-[#E9E9E7] mx-0.5" />

              <button
                onClick={() => setAutoSync3D(!autoSync3D)}
                className={`px-2 py-1 rounded text-[11px] font-semibold ${
                  autoSync3D ? 'bg-[#DDEDEA] text-[#0F7B6C]' : 'bg-[#F7F7F5] text-[#787774] border border-[#E9E9E7]'
                }`}
              >
                {autoSync3D ? '실시간 3D 반영' : '수동 3D 반영'}
              </button>

              {!autoSync3D && (
                <button
                  onClick={commit3DUpdate}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold flex items-center gap-1 ${
                    hasPending3DChanges
                      ? 'bg-[#2383E2] text-white shadow-xs animate-pulse'
                      : 'bg-[#F7F7F5] text-[#787774] border border-[#E9E9E7]'
                  }`}
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>3D 업데이트</span>
                </button>
              )}
            </div>
          )}
        </header>

        {/* Body */}
        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          {!hasActiveProject ? (
            <div className="flex-1 overflow-y-auto bg-white">
              <div className="h-20 w-full bg-gradient-to-r from-[#F7F4EE] via-[#F2EFE9] to-[#E9F2EE] border-b border-[#E9E9E7]" />
              <div className="max-w-3xl mx-auto px-6 pb-16 -mt-7 space-y-8">
                <div className="space-y-2.5">
                  <div className="w-12 h-12 rounded-xl bg-white border border-[#E9E9E7] shadow-xs flex items-center justify-center text-xl font-black text-[#0F7B6C]">
                    Y
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-[#37352F]">
                    Yulha Interior Studio
                  </h1>
                  <p className="text-sm text-[#787774] leading-relaxed">
                    2D 도면으로 구조를 직접 수정하고, 3D 공간에서 마루 · 벽지 · 콘센트 · 스위치 · 냉장고장 · 인덕션 · 필름지까지 모든 인테리어 자재를 클릭해 실사감 있게 시뮬레이션하세요.
                  </p>
                </div>

                <div className="p-5 rounded-xl border border-[#E9E9E7] bg-white shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#37352F]">
                      평면도 검색 · 캡처 붙여넣기로 바로 시작
                    </span>
                    <button
                      onClick={() => openProject(createBlankCanvasPlan())}
                      className="text-[11px] font-semibold text-[#0F7B6C] hover:underline"
                    >
                      밑그림 없이 빈 도면 열기 →
                    </button>
                  </div>
                  <FloorPlanFinder
                    onApplyImage={(dataUrl) => {
                      openProject(createBlankCanvasPlan());
                      useProjectStore.getState().convertUnderlayTo2D(dataUrl);
                    }}
                  />
                </div>

                {/* Usage Guide */}
                <div className="space-y-2.5">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#9B9A97]">
                    사용 가이드
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="p-3.5 rounded-lg bg-[#F7F7F5] border border-[#E9E9E7] space-y-1">
                      <div className="text-[11px] font-bold text-[#0F7B6C]">STEP 1. 도면 불러오기</div>
                      <div className="text-xs font-semibold text-[#37352F]">검색 후 캡처 붙여넣기</div>
                      <p className="text-[11px] text-[#787774] leading-relaxed">
                        위에서 단지·타입을 입력해 네이버부동산·호갱노노·직방에서 도면을 찾고, 캡처(Win+Shift+S) 후 <b>Ctrl+V</b>로 붙여넣으세요.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-lg bg-[#F7F7F5] border border-[#E9E9E7] space-y-1">
                      <div className="text-[11px] font-bold text-[#2383E2]">STEP 2. 2D 도면 편집</div>
                      <div className="text-xs font-semibold text-[#37352F]">밑그림 따라 구조·설비 배치</div>
                      <p className="text-[11px] text-[#787774] leading-relaxed">
                        2D 캔버스 밑그림 위에 벽·문·창문·콘센트·조명·냉장고장·아일랜드를 배치하고 <b>실시간/수동 3D 업데이트</b>로 반영하세요.
                      </p>
                    </div>
                    <div className="p-3.5 rounded-lg bg-[#F7F7F5] border border-[#E9E9E7] space-y-1">
                      <div className="text-[11px] font-bold text-[#D9730D]">STEP 3. 3D 자재 시뮬레이션</div>
                      <div className="text-xs font-semibold text-[#37352F]">클릭해 실사 자재 적용</div>
                      <p className="text-[11px] text-[#787774] leading-relaxed">
                        3D 공간에서 마루·벽지·필름지·콘센트·인덕션·실링팬을 클릭해 자재를 바꾸고 실시간 견적서를 확인하세요.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLoadPro}
                  className="w-full p-3.5 rounded-lg border border-[#E9E9E7] hover:bg-[#F7F7F5] text-xs font-semibold text-[#37352F] flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-[#787774]" />
                    <span>저장된 내 프로젝트 이어하기</span>
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                    <Crown className="w-3 h-3" /> PRO
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <>
              <main className="flex-1 flex min-w-0 min-h-0">
                {(viewMode === 'split' || viewMode === '2d') && (
                  <div
                    className={`${
                      viewMode === 'split' ? 'w-1/2 border-r border-[#E9E9E7]' : 'w-full'
                    } h-full min-w-0 relative`}
                  >
                    <Canvas2DEditor />
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 bg-white/95 backdrop-blur-sm border border-[#E9E9E7] shadow-md rounded-xl px-1.5 py-1">
                      {tools.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setToolMode(t.id)}
                          className={`px-2 py-1.5 rounded-lg flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap transition ${
                            toolMode === t.id
                              ? 'bg-[#EBF5FF] text-[#2383E2]'
                              : 'text-[#787774] hover:text-[#37352F] hover:bg-[#EFEFEE]'
                          }`}
                        >
                          {t.icon}
                          <span className="hidden xl:inline">{t.label}</span>
                        </button>
                      ))}
                      <div className="w-px h-4 bg-[#E9E9E7] mx-0.5" />
                      <button
                        onClick={undo}
                        disabled={past.length === 0}
                        className="px-2 py-1.5 rounded-lg text-[11px] font-semibold text-[#37352F] hover:bg-[#EFEFEE] disabled:opacity-30 flex items-center gap-1 whitespace-nowrap"
                        title="실행 취소 (Ctrl+Z)"
                      >
                        <Undo2 className="w-3.5 h-3.5" />
                        <span className="hidden 2xl:inline">실행취소</span>
                      </button>
                      <button
                        onClick={redo}
                        disabled={future.length === 0}
                        className="px-2 py-1.5 rounded-lg text-[11px] font-semibold text-[#37352F] hover:bg-[#EFEFEE] disabled:opacity-30 flex items-center gap-1 whitespace-nowrap"
                        title="재실행 (Ctrl+Y)"
                      >
                        <Redo2 className="w-3.5 h-3.5" />
                        <span className="hidden 2xl:inline">재실행</span>
                      </button>
                      <button
                        onClick={deleteSelected}
                        disabled={!selection}
                        className="px-2 py-1.5 rounded-lg text-[11px] font-semibold text-[#E03E3E] hover:bg-[#FBE4E4] disabled:opacity-30 flex items-center gap-1 whitespace-nowrap"
                        title="선택 요소 삭제 (Delete)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden 2xl:inline">삭제</span>
                      </button>
                      <button
                        onClick={() => setShowDimensions(!showDimensions)}
                        className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold ${
                          showDimensions ? 'bg-[#F7F7F5] text-[#37352F]' : 'text-[#9B9A97]'
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
                    className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} h-full min-w-0`}
                  >
                    <Studio3DViewport />
                  </div>
                )}
              </main>

              <InspectorPanel />
            </>
          )}

          {toast && (
            <div className="fixed bottom-5 right-5 z-50 px-4 py-2 rounded-lg bg-[#37352F] text-white text-xs font-medium shadow-lg">
              {toast}
            </div>
          )}
        </div>
      </div>

      <UnderlayModal open={underlayOpen} onClose={() => setUnderlayOpen(false)} />
      <EstimateModal open={estimateOpen} onClose={() => setEstimateOpen(false)} />
      <ProjectLibraryModal mode={libraryMode} onClose={() => setLibraryMode(null)} />
    </div>
  );
}

export default App;
