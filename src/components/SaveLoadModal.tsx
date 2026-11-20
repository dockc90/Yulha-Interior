import React, { useEffect, useState } from 'react';
import { Crown, FolderOpen, Save, Trash2, X } from 'lucide-react';
import { BlueprintProject } from '../types/design';
import { useDesignStore } from '../store/useDesignStore';

interface SavedEntry {
  id: string;
  name: string;
  savedAt: string;
  data: BlueprintProject;
}

const KEY = 'yulha_v3_saved_projects';

function readList(): SavedEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const SaveLoadModal: React.FC<{ mode: 'save' | 'load' | null; onClose: () => void }> = ({
  mode,
  onClose,
}) => {
  const { draftPlan, openBlueprint, notify } = useDesignStore();
  const [list, setList] = useState<SavedEntry[]>([]);
  const [name, setName] = useState('');

  useEffect(() => {
    if (!mode) return;
    setList(readList());
    setName(draftPlan.name || '내 인테리어 설계');
  }, [mode, draftPlan.name]);

  if (!mode) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const cur = readList();
    const idx = cur.findIndex((x) => x.name === trimmed);
    const entry: SavedEntry = {
      id: idx >= 0 ? cur[idx].id : `p-${Date.now()}`,
      name: trimmed,
      savedAt: new Date().toLocaleString('ko-KR'),
      data: { ...draftPlan, name: trimmed },
    };
    const next = idx >= 0 ? cur.map((x, i) => (i === idx ? entry : x)) : [entry, ...cur];
    localStorage.setItem(KEY, JSON.stringify(next));
    setList(next);
    notify(`'${trimmed}' 저장 완료`);
    onClose();
  };

  const handleDelete = (id: string) => {
    const next = list.filter((x) => x.id !== id);
    localStorage.setItem(KEY, JSON.stringify(next));
    setList(next);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-xl border border-[#E9E9E7] shadow-xl overflow-hidden flex flex-col max-h-[82vh]">
        <div className="px-5 py-3.5 border-b border-[#E9E9E7] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mode === 'save' ? <Save className="w-4 h-4 text-[#0F7B6C]" /> : <FolderOpen className="w-4 h-4 text-[#2383E2]" />}
            <h2 className="text-sm font-bold">{mode === 'save' ? '프로젝트 저장' : '프로젝트 불러오기'}</h2>
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
            <form onSubmit={handleSave} className="space-y-2 p-3.5 rounded-lg bg-[#F7F7F5] border border-[#E9E9E7]">
              <label className="block text-xs font-semibold">저장할 이름</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-white border border-[#D3D1CB] focus:border-[#0F7B6C] rounded-lg outline-none"
                  autoFocus
                />
                <button type="submit" className="px-4 py-2 rounded-lg bg-[#0F7B6C] text-white text-xs font-semibold">
                  저장
                </button>
              </div>
            </form>
          )}

          <div className="space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#9B9A97]">
              저장 목록 ({list.length})
            </div>
            {list.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#787774] border border-dashed border-[#E9E9E7] rounded-lg">
                저장된 프로젝트가 없습니다.
              </div>
            ) : (
              list.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border border-[#E9E9E7] hover:border-[#0F7B6C] flex items-center justify-between gap-2"
                >
                  <button
                    onClick={() => {
                      if (mode === 'load') {
                        openBlueprint(item.data);
                        notify(`'${item.name}' 불러오기 완료`);
                        onClose();
                      } else {
                        setName(item.name);
                      }
                    }}
                    className="flex-1 text-left min-w-0"
                  >
                    <div className="text-xs font-bold truncate">{item.name}</div>
                    <div className="text-[11px] text-[#787774]">{item.savedAt}</div>
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded hover:bg-[#FBE4E4] text-[#9B9A97] hover:text-[#E03E3E]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
