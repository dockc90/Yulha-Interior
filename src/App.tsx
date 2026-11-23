import React, { useEffect, useState } from 'react';
import {
  Calculator,
  Camera,
  Columns2,
  FolderOpen,
  Footprints,
  Home,
  Redo2,
  Square,
  Undo2,
  Box,
} from 'lucide-react';
import { usePlannerStore, ViewMode } from './store/usePlannerStore';
import { LandingPage } from './components/LandingPage';
import { LeftCatalogSidebar } from './components/LeftCatalogSidebar';
import { Viewport2D } from './components/Viewport2D';
import { Viewport3D } from './components/Viewport3D';
import { RightPropertyPanel } from './components/RightPropertyPanel';
import { EstimateModal, ProjectsModal, UnderlayModal } from './components/Modals';

export function App() {
  const projectId = usePlannerStore((s) => s.project.id);
  const projectTitle = usePlannerStore((s) => s.project.title);
  const viewMode = usePlannerStore((s) => s.viewMode);
  const pastCount = usePlannerStore((s) => s.past.length);
  const futureCount = usePlannerStore((s) => s.future.length);

  const setViewMode = usePlannerStore((s) => s.setViewMode);
  const loadPreset = usePlannerStore((s) => s.loadPreset);
  const undo = usePlannerStore((s) => s.undo);
  const redo = usePlannerStore((s) => s.redo);
  const deleteSelected = usePlannerStore((s) => s.deleteSelected);
  const rotateSelected = usePlannerStore((s) => s.rotateSelected);
  const triggerSnapshot = usePlannerStore((s) => s.triggerSnapshot);

  const [inStudio, setInStudio] = useState(false);
  const [showEstimate, setShowEstimate] = useState(false);
  const [showUnderlay, setShowUnderlay] = useState(false);
  const [showProjects, setShowProjects] = useState(false);

  // Enter studio automatically if a saved project is loaded from landing
  useEffect(() => {
    if (!inStudio && showProjects) {
      // Wait for user action in ProjectsModal
    }
  }, [inStudio, projectId, showProjects]);

  useEffect(() => {
    if (!inStudio) return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault();
        redo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      } else if (e.key.toLowerCase() === 'r' && !e.ctrlKey && !e.metaKey) {
        rotateSelected(45);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [inStudio, undo, redo, deleteSelected, rotateSelected]);

  if (!inStudio) {
    return (
      <>
        <LandingPage
          onEnterStudio={() => setInStudio(true)}
          onOpenProjects={() => setShowProjects(true)}
        />
        {showProjects && (
          <ProjectsModal
            onClose={() => {
              setShowProjects(false);
              setInStudio(true);
            }}
          />
        )}
      </>
    );
  }

  const viewTabs: { mode: ViewMode; label: string; icon: React.ReactNode }[] = [
    { mode: '2d', label: '2D 도면', icon: <Square className="w-3.5 h-3.5" /> },
    { mode: 'split', label: '2D + 3D', icon: <Columns2 className="w-3.5 h-3.5" /> },
    { mode: '3d', label: '3D 뷰', icon: <Box className="w-3.5 h-3.5" /> },
    { mode: 'walk', label: '1인칭 걷기', icon: <Footprints className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-100 text-slate-900 overflow-hidden">
      <header className="h-13 shrink-0 bg-white border-b border-slate-200 px-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setInStudio(false)}
            className="flex items-center gap-2 shrink-0 text-left hover:opacity-80 transition-opacity"
            title="첫 화면으로 돌아가기"
          >
            <div className="w-8 h-8 rounded-lg bg-[#242220] text-[#FAF8F5] flex items-center justify-center font-serif font-bold text-sm">
              Y
            </div>
            <div className="leading-tight hidden sm:block">
              <p className="text-xs font-extrabold text-slate-900">YULHA ATELIER</p>
              <p className="text-[10px] text-slate-400 truncate max-w-[160px]">{projectTitle}</p>
            </div>
          </button>

          <div className="h-5 w-px bg-slate-200" />

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-[11px] font-semibold">
            <button
              onClick={() => loadPreset('34py')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md hover:bg-white hover:shadow-xs text-slate-700"
              title="34평 4Bay 모델하우스 불러오기"
            >
              <Home className="w-3 h-3 text-blue-600" />
              34평 4Bay
            </button>
            <button
              onClick={() => loadPreset('25py')}
              className="px-2.5 py-1 rounded-md hover:bg-white hover:shadow-xs text-slate-700"
              title="25평 3Bay 표준형 불러오기"
            >
              25평 3Bay
            </button>
            <button
              onClick={() => loadPreset('blank')}
              className="px-2.5 py-1 rounded-md hover:bg-white hover:shadow-xs text-slate-600"
            >
              빈 도면
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          {viewTabs.map((t) => (
            <button
              key={t.mode}
              onClick={() => setViewMode(t.mode)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === t.mode
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={undo}
            disabled={pastCount === 0}
            title="실행 취소 (Ctrl+Z)"
            className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-35"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={redo}
            disabled={futureCount === 0}
            title="다시 실행 (Ctrl+Y)"
            className="p-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-35"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-slate-200 mx-0.5" />

          <button
            onClick={() => setShowEstimate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Calculator className="w-3.5 h-3.5 text-blue-600" />
            견적서
          </button>

          <button
            onClick={() => setShowProjects(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <FolderOpen className="w-3.5 h-3.5 text-emerald-600" />
            저장/열기
          </button>

          {viewMode !== '2d' && (
            <button
              onClick={triggerSnapshot}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
              title="현재 3D 화면 PNG 저장"
            >
              <Camera className="w-3.5 h-3.5" />
              스냅샷
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 flex min-h-0 overflow-hidden">
        <LeftCatalogSidebar onOpenUnderlayModal={() => setShowUnderlay(true)} />

        <main className="flex-1 flex min-w-0 min-h-0 overflow-hidden">
          {(viewMode === '2d' || viewMode === 'split') && (
            <div className={`${viewMode === 'split' ? 'w-1/2 border-r border-slate-300' : 'w-full'} h-full min-w-0`}>
              <Viewport2D />
            </div>
          )}
          {(viewMode === '3d' || viewMode === 'split' || viewMode === 'walk') && (
            <div className={`${viewMode === 'split' ? 'w-1/2' : 'w-full'} h-full min-w-0`}>
              <Viewport3D />
            </div>
          )}
        </main>

        <RightPropertyPanel />
      </div>

      {showEstimate && <EstimateModal onClose={() => setShowEstimate(false)} />}
      {showUnderlay && <UnderlayModal onClose={() => setShowUnderlay(false)} />}
      {showProjects && <ProjectsModal onClose={() => setShowProjects(false)} />}
    </div>
  );
}

export default App;
