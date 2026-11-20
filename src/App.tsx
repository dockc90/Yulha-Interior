import React, { useEffect, useState } from 'react';
import { useDesignStore } from './store/useDesignStore';
import { createEmptyBlueprint, createModelHouse34 } from './data/presets';
import { CadViewport2D } from './components/CadViewport2D';
import { Photoreal3DViewport } from './components/Photoreal3DViewport';
import { MaterialInspector } from './components/MaterialInspector';
import { UnderlayPickerModal } from './components/UnderlayPickerModal';
import { QuoteModal } from './components/QuoteModal';
import { SaveLoadModal } from './components/SaveLoadModal';
import {
  AppWindow,
  Box,
  Calculator,
  Columns2,
  Crown,
  DoorOpen,
  FolderOpen,
  Home,
  ImagePlus,
  LayoutGrid,
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
  Sparkles,
  Square,
  Trash2,
  Undo2,
} from 'lucide-react';
import { CadTool } from './types/design';

export function App() {
  const {
    inStudio,
    draftPlan,
    hasPending3DUpdate,
    past,
    future,
    workspaceView,
    tool,
    selection,
    showDimensions,
    toast,
    openBlueprint,
    goHome,
    setWorkspaceView,
    setTool,
    setSelection,
    setShowDimensions,
    commit3DUpdate,
    duplicateSelected,
    deleteSelected,
    undo,
    redo,
  } = useDesignStore();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [underlayOpen, setUnderlayOpen] = useState(false);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [saveLoadMode, setSaveLoadMode] = useState<'save' | 'load' | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!inStudio) return;
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
        duplicateSelected();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      } else if (e.key === 'Escape') {
        setTool('select');
        setSelection(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [inStudio, undo, redo, duplicateSelected, deleteSelected, setTool, setSelection]);

  const tools: { id: CadTool; label: string; icon: React.ReactNode }[] = [
    { id: 'select', label: '선택', icon: <MousePointer2 className="w-3.5 h-3.5" /> },
    { id: 'add_space', label: '방 추가', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { id: 'draw_wall', label: '벽 그리기', icon: <PenTool className="w-3.5 h-3.5" /> },
    { id: 'add_door', label: '문', icon: <DoorOpen className="w-3.5 h-3.5" /> },
    { id: 'add_window', label: '창문', icon: <AppWindow className="w-3.5 h-3.5" /> },
    { id: 'add_outlet', label: '콘센트', icon: <Plug className="w-3.5 h-3.5" /> },
    { id: 'add_light', label: '조명', icon: <Lightbulb className="w-3.5 h-3.5" /> },
    { id: 'add_prop', label: '가전/가구', icon: <Sofa className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="w-screen h-screen flex bg-white text-[#37352F] overflow-hidden">
      {/* Left Notion Workspace Sidebar */}
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
                  !inStudio ? 'bg-[#EAEAE6] font-semibold' : 'text-[#5F5E5B] hover:bg-[#EFEFED]'
                }`}
              >
                <Home className="w-3.5 h-3.5" />
                <span>홈</span>
              </button>

              {inStudio && (
                <>
                  <button
                    onClick={() => setWorkspaceView('split')}
                    className={`w-full px-2 py-1.5 rounded-md text-xs flex items-center gap-2 ${
                      workspaceView === 'split' ? 'bg-[#EAEAE6] font-semibold' : 'text-[#5F5E5B] hover:bg-[#EFEFED]'
                    }`}
                  >
                    <Columns2 className="w-3.5 h-3.5 text-[#0F7B6C]" />
                    <span>2D + 3D 분할</span>
                  </button>
                  <button
                    onClick={() => setWorkspaceView('2d')}
                    className={`w-full px-2 py-1.5 rounded-md text-xs flex items-center gap-2 ${
                      workspaceView === '2d' ? 'bg-[#EAEAE6] font-semibold' : 'text-[#5F5E5B] hover:bg-[#EFEFED]'
                    }`}
                  >
                    <Square className="w-3.5 h-3.5" />
                    <span>2D 도면 편집</span>
                  </button>
                  <button
                    onClick={() => setWorkspaceView('3d')}
                    className={`w-full px-2 py-1.5 rounded-md text-xs flex items-center gap-2 ${
                      workspaceView === '3d' ? 'bg-[#EAEAE6] font-semibold' : 'text-[#5F5E5B] hover:bg-[#EFEFED]'
                    }`}
                  >
                    <Box className="w-3.5 h-3.5 text-[#2383E2]" />
                    <span>3D 인테리어 뷰</span>
                  </button>
                </>
              )}
            </nav>

            {inStudio && (
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
                  onClick={() => setQuoteOpen(true)}
                  className="w-full px-2 py-1.5 rounded-md text-xs text-[#5F5E5B] hover:bg-[#EFEFED] flex items-center gap-2"
                >
                  <Calculator className="w-3.5 h-3.5 text-[#0F7B6C]" />
                  <span>실시간 예상 견적서</span>
                </button>
              </div>
            )}
          </div>

          <div className="p-3 border-t border-[#E9E9E7] space-y-1.5">
            <button
              onClick={() => setSaveLoadMode('save')}
              disabled={!inStudio}
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
              onClick={() => setSaveLoadMode('load')}
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
        {/* Top Notion Header */}
        <header className="h-11 shrink-0 border-b border-[#E9E9E7] bg-white px-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded hover:bg-[#EFEFED] text-[#787774]">
                <PanelLeftOpen className="w-4 h-4" />
              </button>
            )}
            <button onClick={goHome} className="text-xs font-medium text-[#787774] hover:text-[#37352F]">
              Yulha Interior
            </button>
            {inStudio && (
              <>
                <span className="text-[#D3D1CB]">/</span>
                <span className="text-xs font-bold text-[#37352F] truncate">{draftPlan.name}</span>
              </>
            )}
          </div>

          {inStudio && (
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
                title="재실행 (Ctrl+Y)"
              >
                <Redo2 className="w-3.5 h-3.5" />
              </button>

              <div className="h-4 w-px bg-[#E9E9E7] mx-0.5" />

              <button
                onClick={commit3DUpdate}
                className={`px-3 py-1.5 rounded-md text-xs font-bold flex items-center gap-1.5 transition ${
                  hasPending3DUpdate
                    ? 'bg-[#0F7B6C] hover:bg-[#0c6357] text-white shadow-sm animate-pulse'
                    : 'bg-[#F7F7F5] hover:bg-[#EFEFED] text-[#37352F] border border-[#E9E9E7]'
                }`}
                title="2D 도면 수정 사항을 3D 스튜디오에 반영"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{hasPending3DUpdate ? '3D Update (변경됨)' : '3D Update'}</span>
              </button>
            </div>
          )}
        </header>

        {/* Body */}
        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          {!inStudio ? (
            <div className="flex-1 overflow-y-auto bg-white">
              <div className="h-20 w-full bg-gradient-to-r from-[#F7F3EE] via-[#F2EEE7] to-[#E6EFEA] border-b border-[#E9E9E7]" />
              <div className="max-w-3xl mx-auto px-6 pb-16 -mt-7 space-y-7">
                <div className="space-y-2.5">
                  <div className="w-12 h-12 rounded-xl bg-white border border-[#E9E9E7] shadow-xs flex items-center justify-center text-xl font-black text-[#0F7B6C]">
                    Y
                  </div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">Yulha Interior Studio</h1>
                    <span className="px-2 py-0.5 rounded bg-[#DDEDEA] text-[#0F7B6C] text-[11px] font-bold">
                      2026 트렌드 자재 반영
                    </span>
                  </div>
                  <p className="text-sm text-[#787774] leading-relaxed">
                    2D 도면에서 공간을 수정하고 <b>3D Update</b> 버튼을 눌러 실사감 있는 3D 인테리어 모델로 확인하세요. 마루·타일·벽지·필름·콘센트·조명·냉장고·인덕션까지 영역별로 직접 선택할 수 있습니다.
                  </p>
                </div>

                <div className="p-3.5 rounded-lg bg-[#F7F7F5] border border-[#E9E9E7] flex items-start gap-2.5 text-xs text-[#5F5E5B]">
                  <Sparkles className="w-4 h-4 text-[#0F7B6C] shrink-0 mt-0.5" />
                  <span>
                    모든 2D 도면 편집 및 3D 자재 시뮬레이션은 무료로 제공됩니다. 프로젝트 다중 저장/불러오기는 추후 월 구독(PRO) 기능으로 제공될 예정입니다.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <button
                    onClick={() => openBlueprint(createModelHouse34())}
                    className="p-5 rounded-xl border border-[#E9E9E7] hover:border-[#0F7B6C] bg-white hover:bg-[#FBFBFA] text-left transition space-y-2 shadow-2xs"
                  >
                    <span className="inline-block px-2 py-0.5 rounded bg-[#DDEDEA] text-[#0F7B6C] text-[10px] font-bold">
                      모델하우스 바로 체험
                    </span>
                    <div className="text-sm font-bold">웜 뉴트럴 34평 스튜디오 열기</div>
                    <p className="text-xs text-[#787774] leading-relaxed">
                      우물천장 간접등 · 루씨에어 실링팬 · 우드 블라인드 · 반매립 TV · 콘센트 · 비스포크 4도어 냉장고장 · 1/2번 홈바 키큰장 · 인덕션이 세팅된 3D 공간을 바로 체험하세요.
                    </p>
                  </button>

                  <button
                    onClick={() => {
                      openBlueprint(createEmptyBlueprint());
                      setUnderlayOpen(true);
                    }}
                    className="p-5 rounded-xl border border-[#E9E9E7] hover:border-[#2383E2] bg-white hover:bg-[#FBFBFA] text-left transition space-y-2 shadow-2xs"
                  >
                    <span className="inline-block px-2 py-0.5 rounded bg-[#EBF5FF] text-[#2383E2] text-[10px] font-bold">
                      내 도면 직접 설계
                    </span>
                    <div className="text-sm font-bold">빈 도면 + 밑그림 깔아 그리기</div>
                    <p className="text-xs text-[#787774] leading-relaxed">
                      네이버 부동산 · 호갱노노 · 분양 홈페이지에서 도면을 캡처해 밑그림으로 깔아두고, 깔끔한 CAD 방/벽/창호 도구로 내 집을 직접 그려보세요.
                    </p>
                  </button>
                </div>

                <button
                  onClick={() => setSaveLoadMode('load')}
                  className="w-full p-3.5 rounded-lg border border-[#E9E9E7] hover:bg-[#F7F7F5] text-xs font-semibold flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-[#787774]" />
                    <span>저장된 프로젝트 불러오기</span>
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
                {(workspaceView === 'split' || workspaceView === '2d') && (
                  <div
                    className={`${
                      workspaceView === 'split' ? 'w-1/2 border-r border-[#E9E9E7]' : 'w-full'
                    } h-full min-w-0 relative`}
                  >
                    <CadViewport2D />
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-0.5 bg-white/95 backdrop-blur-sm border border-[#E9E9E7] shadow-md rounded-xl px-1.5 py-1">
                      {tools.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setTool(t.id)}
                          className={`px-2 py-1.5 rounded-lg flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap transition ${
                            tool === t.id ? 'bg-[#EBF5FF] text-[#2383E2]' : 'text-[#787774] hover:bg-[#EFEFEE]'
                          }`}
                        >
                          {t.icon}
                          <span className="hidden xl:inline">{t.label}</span>
                        </button>
                      ))}
                      <div className="w-px h-4 bg-[#E9E9E7] mx-0.5" />
                      <button
                        onClick={deleteSelected}
                        disabled={!selection}
                        className="px-2 py-1.5 rounded-lg text-[11px] font-semibold text-[#E03E3E] hover:bg-[#FBE4E4] disabled:opacity-30"
                        title="선택 삭제 (Delete)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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

                {(workspaceView === 'split' || workspaceView === '3d') && (
                  <div className={`${workspaceView === 'split' ? 'w-1/2' : 'w-full'} h-full min-w-0`}>
                    <Photoreal3DViewport />
                  </div>
                )}
              </main>

              <MaterialInspector />
            </>
          )}

          {toast && (
            <div className="fixed bottom-5 right-5 z-50 px-4 py-2 rounded-lg bg-[#37352F] text-white text-xs font-medium shadow-lg">
              {toast}
            </div>
          )}
        </div>
      </div>

      <UnderlayPickerModal open={underlayOpen} onClose={() => setUnderlayOpen(false)} />
      <QuoteModal open={quoteOpen} onClose={() => setQuoteOpen(false)} />
      <SaveLoadModal mode={saveLoadMode} onClose={() => setSaveLoadMode(null)} />
    </div>
  );
}

export default App;
