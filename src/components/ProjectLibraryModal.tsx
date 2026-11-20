import React, { useEffect, useState } from 'react';
import { Crown, FolderOpen, Save, Trash2, X } from 'lucide-react';
import { ProjectData } from '../types/studio';
import { useProjectStore } from '../store/useProjectStore';

export interface SavedProjectEntry {
  id: string;
  name: string;
  savedAt: string;
  areaSqm: number;
  data: ProjectData;
}

const STORAGE_KEY = 'yulha_v2_saved_projects';

export function readSavedProjects(): SavedProjectEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSavedProjects(list: SavedProjectEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

interface Props {
  mode: 'save' | 'load' | null;
  onClose: () => void;
}

export const ProjectLibraryModal: React.FC<Props> = ({ mode, onClose }) => {
  const { project, openProject, notify } = useProjectStore();
  const [list, setList] = useState<SavedProjectEntry[]>([]);
  const [nameInput, setNameInput] = useState('');

  useEffect(() => {
    if (!mode) return;
    setList(readSavedProjects());
    setNameInput(project.title || '내 인테리어 프로젝트');
  }, [mode, project.title]);

  if (!mode) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    const current = readSavedProjects();
    const existingIdx = current.findIndex((item) => item.name === trimmed);
    const updatedProject: ProjectData = { ...project, title: trimmed };
    const entry: SavedProjectEntry = {
      id: existingIdx >= 0 ? current[existingIdx].id : `proj-${Date.now()}`,
      name: trimmed,
      savedAt: new Date().toLocaleString('ko-KR'),
      areaSqm: project.areaSqm,
      data: updatedProject,
    };
    const next =
      existingIdx >= 0
        ? current.map((item, idx) => (idx === existingIdx ? entry : item))
        : [entry, ...current];
    writeSavedProjects(next);
    setList(next);
    notify(`'${trimmed}' 이름으로 프로젝트가 저장되었습니다.`);
    onClose();
  };

  const handleLoad = (entry: SavedProjectEntry) => {
    openProject(entry.data);
    notify(`'${entry.name}' 프로젝트를 불러왔습니다.`);
    onClose();
  };

  const handleDelete = (id: string, name: string) => {
    const next = list.filter((item) => item.id !== id);
    writeSavedProjects(next);
    setList(next);
    notify(`'${name}' 저장본을 삭제했습니다.`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-xl border border-[#E9E9E7] shadow-xl overflow-hidden flex flex-col max-h-[82vh]">
        <div className="px-5 py-3.5 border-b border-[#E9E9E7] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mode === 'save' ? (
              <Save className="w-4 h-4 text-[#0F7B6C]" />
            ) : (
              <FolderOpen className="w-4 h-4 text-[#2383E2]" />
            )}
            <h2 className="text-sm font-bold text-[#37352F]">
              {mode === 'save' ? '프로젝트 이름 지정 저장' : '저장된 프로젝트 불러오기'}
            </h2>
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[9px] font-bold">
              <Crown className="w-2.5 h-2.5" /> PRO
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-[#EFEFED] text-[#787774]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {mode === 'save' && (
            <form onSubmit={handleSave} className="space-y-2.5 p-3.5 rounded-lg bg-[#F7F7F5] border border-[#E9E9E7]">
              <label className="block text-xs font-semibold text-[#37352F]">
                저장할 프로젝트 이름
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="예: 우리집 거실 타일안, 주방 2번 옵션"
                  className="flex-1 px-3 py-2 text-xs bg-white border border-[#D3D1CB] focus:border-[#0F7B6C] rounded-lg outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#0F7B6C] hover:bg-[#0c6357] text-white text-xs font-semibold shrink-0"
                >
                  저장하기
                </button>
              </div>
              <p className="text-[11px] text-[#787774]">
                같은 이름을 입력하면 덮어쓰고, 다른 이름을 입력하면 여러 버전으로 보관됩니다.
              </p>
            </form>
          )}

          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#9B9A97]">
              저장 목록 ({list.length}개)
            </div>
            {list.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#787774] border border-dashed border-[#E9E9E7] rounded-lg">
                아직 저장된 프로젝트가 없습니다.
              </div>
            ) : (
              <div className="space-y-2">
                {list.map((entry) => (
                  <div
                    key={entry.id}
                    className="p-3 rounded-lg border border-[#E9E9E7] hover:border-[#0F7B6C] bg-white flex items-center justify-between gap-3 transition"
                  >
                    <button
                      onClick={() => {
                        if (mode === 'load') handleLoad(entry);
                        else setNameInput(entry.name);
                      }}
                      className="flex-1 text-left min-w-0"
                    >
                      <div className="text-xs font-bold text-[#37352F] truncate">
                        {entry.name}
                      </div>
                      <div className="text-[11px] text-[#787774] mt-0.5">
                        {entry.areaSqm}㎡ · 방 {entry.data.rooms?.length || 0}개 · 벽 {entry.data.walls?.length || 0}개 · {entry.savedAt}
                      </div>
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {mode === 'load' && (
                        <button
                          onClick={() => handleLoad(entry)}
                          className="px-2.5 py-1 rounded bg-[#EBF5FF] hover:bg-[#DBEAFE] text-[#2383E2] text-[11px] font-semibold"
                        >
                          열기
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(entry.id, entry.name)}
                        className="p-1.5 rounded hover:bg-[#FBE4E4] text-[#9B9A97] hover:text-[#E03E3E]"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
