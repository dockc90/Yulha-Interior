import React from 'react';
import { RotateCw, Trash2, CheckCircle2, Layers } from 'lucide-react';
import { usePlannerStore } from '../store/usePlannerStore';
import { getMat } from '../data/materialsDb';

export const RightPropertyPanel: React.FC = () => {
  const project = usePlannerStore((s) => s.project);
  const rooms = usePlannerStore((s) => s.rooms);
  const selection = usePlannerStore((s) => s.selection);
  const updateRoomOverride = usePlannerStore((s) => s.updateRoomOverride);
  const updateWall = usePlannerStore((s) => s.updateWall);
  const updateOpening = usePlannerStore((s) => s.updateOpening);
  const updateSceneItem = usePlannerStore((s) => s.updateSceneItem);
  const deleteSelected = usePlannerStore((s) => s.deleteSelected);
  const rotateSelected = usePlannerStore((s) => s.rotateSelected);

  const selectedRoom = selection?.kind === 'room' ? rooms.find((r) => r.key === selection.key) : null;
  const selectedWall = selection?.kind === 'wall' ? project.walls.find((w) => w.id === selection.id) : null;
  const selectedOpening = selection?.kind === 'opening' ? project.openings.find((o) => o.id === selection.id) : null;
  const selectedItem = selection?.kind === 'item' ? project.items.find((i) => i.id === selection.id) : null;

  const totalArea = rooms.reduce((acc, r) => acc + r.areaSqm, 0);

  return (
    <aside className="w-[272px] shrink-0 h-full bg-white border-l border-slate-200 flex flex-col">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/70">
        <h2 className="text-xs font-bold text-slate-800">속성 및 자재 인스펙터</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!selection && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
              <p className="text-xs font-bold text-slate-800">{project.title}</p>
              <p className="text-[11px] text-slate-500">
                감지된 공간 {rooms.length}개 · 총 바닥면적 {totalArea.toFixed(1)}㎡ (
                {(totalArea / 3.3058).toFixed(1)}평)
              </p>
              <p className="text-[11px] text-slate-500">
                벽체 {project.walls.length}개 · 배치 아이템 {project.items.length}개
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold text-slate-500 mb-2">공간 목록 (클릭하여 선택)</p>
              <div className="space-y-1.5">
                {rooms.map((r) => {
                  const mat = getMat(r.floorMaterialId);
                  return (
                    <button
                      key={r.key}
                      onClick={() => usePlannerStore.getState().setSelection({ kind: 'room', key: r.key })}
                      className="w-full flex items-center justify-between p-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-left"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-4 h-4 rounded border border-slate-300 shrink-0"
                          style={{ backgroundColor: mat.color }}
                        />
                        <span className="text-xs font-medium text-slate-800 truncate">{r.name}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 shrink-0">
                        {r.areaSqm.toFixed(1)}㎡
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {selectedRoom && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700">공간 속성</span>
              <span className="text-[11px] text-slate-500">
                {selectedRoom.areaSqm.toFixed(1)}㎡ ({(selectedRoom.areaSqm / 3.3058).toFixed(1)}평)
              </span>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">공간 이름</label>
              <input
                value={selectedRoom.name}
                onChange={(e) => updateRoomOverride(selectedRoom.key, { name: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">적용된 바닥 자재</label>
              {(() => {
                const mat = getMat(selectedRoom.floorMaterialId);
                return (
                  <div className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 bg-slate-50">
                    <div
                      className="w-8 h-8 rounded border border-slate-300 shrink-0"
                      style={{ backgroundColor: mat.color }}
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-blue-700">{mat.brand}</p>
                      <p className="text-xs font-semibold text-slate-800 truncate">{mat.name}</p>
                    </div>
                  </div>
                );
              })()}
              <p className="mt-1.5 text-[11px] text-slate-400">
                좌측 [브랜드 자재] 탭에서 마루/타일을 클릭해 교체하세요.
              </p>
            </div>
          </div>
        )}

        {selectedWall && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700">벽체 속성</span>
              <button
                onClick={deleteSelected}
                className="flex items-center gap-1 text-xs text-rose-600 hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                삭제
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">벽체 두께 (mm)</label>
              <input
                type="number"
                step={10}
                value={Math.round(selectedWall.thickness * 1000)}
                onChange={(e) => updateWall(selectedWall.id, { thickness: Math.max(0.08, (Number(e.target.value) || 140) / 1000) })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">천장고 (mm)</label>
              <input
                type="number"
                step={50}
                value={Math.round(selectedWall.height * 1000)}
                onChange={(e) => updateWall(selectedWall.id, { height: Math.max(1.8, (Number(e.target.value) || 2450) / 1000) })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">적용된 벽지 / 월판넬</label>
              {(() => {
                const mat = getMat(selectedWall.frontMaterialId);
                return (
                  <div className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 bg-slate-50">
                    <div
                      className="w-8 h-8 rounded border border-slate-300 shrink-0"
                      style={{ backgroundColor: mat.color }}
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-blue-700">{mat.brand}</p>
                      <p className="text-xs font-semibold text-slate-800 truncate">{mat.name}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {selectedOpening && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700">
                {selectedOpening.kind === 'door'
                  ? '방문'
                  : selectedOpening.kind === 'sliding_glass'
                    ? '3연동 중문'
                    : selectedOpening.kind === 'entrance'
                      ? '현관문'
                      : '창호'}{' '}
                속성
              </span>
              <button
                onClick={deleteSelected}
                className="flex items-center gap-1 text-xs text-rose-600 hover:underline"
              >
                <Trash2 className="w-3.5 h-3.5" />
                삭제
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">폭 (mm)</label>
              <input
                type="number"
                step={50}
                value={Math.round(selectedOpening.width * 1000)}
                onChange={(e) => updateOpening(selectedOpening.id, { width: Math.max(0.5, (Number(e.target.value) || 900) / 1000) })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">높이 (mm)</label>
              <input
                type="number"
                step={50}
                value={Math.round(selectedOpening.height * 1000)}
                onChange={(e) => updateOpening(selectedOpening.id, { height: Math.max(0.6, (Number(e.target.value) || 2100) / 1000) })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>

            {selectedOpening.kind === 'window' && (
              <button
                onClick={() => updateOpening(selectedOpening.id, { hasBlind: !selectedOpening.hasBlind })}
                className="w-full py-1.5 text-xs font-medium border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                우드 블라인드 {selectedOpening.hasBlind ? '끄기' : '켜기'}
              </button>
            )}
          </div>
        )}

        {selectedItem && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700">{selectedItem.name}</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => rotateSelected(45)}
                  className="text-slate-600 hover:text-blue-700"
                  title="45도 회전"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={deleteSelected}
                  className="text-rose-600 hover:text-rose-700"
                  title="삭제"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">가로(mm)</label>
                <input
                  type="number"
                  step={50}
                  value={Math.round(selectedItem.width * 1000)}
                  onChange={(e) => updateSceneItem(selectedItem.id, { width: Math.max(0.05, (Number(e.target.value) || 500) / 1000) })}
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">깊이(mm)</label>
                <input
                  type="number"
                  step={50}
                  value={Math.round(selectedItem.depth * 1000)}
                  onChange={(e) => updateSceneItem(selectedItem.id, { depth: Math.max(0.02, (Number(e.target.value) || 500) / 1000) })}
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">높이(mm)</label>
                <input
                  type="number"
                  step={50}
                  value={Math.round(selectedItem.height * 1000)}
                  onChange={(e) => updateSceneItem(selectedItem.id, { height: Math.max(0.02, (Number(e.target.value) || 500) / 1000) })}
                  className="w-full px-2 py-1 text-xs border border-slate-200 rounded"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                회전 각도 ({Math.round(((selectedItem.rotation * 180) / Math.PI) % 360)}°)
              </label>
              <input
                type="range"
                min={0}
                max={345}
                step={15}
                value={Math.round((((selectedItem.rotation * 180) / Math.PI) % 360 + 360) % 360)}
                onChange={(e) => updateSceneItem(selectedItem.id, { rotation: (Number(e.target.value) * Math.PI) / 180 })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">적용 자재 / 컬러</label>
              {(() => {
                const mat = getMat(selectedItem.materialId);
                return (
                  <div className="flex items-center gap-2.5 p-2 rounded-lg border border-slate-200 bg-slate-50">
                    <div
                      className="w-8 h-8 rounded border border-slate-300 shrink-0"
                      style={{ backgroundColor: mat.color }}
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold text-blue-700">{mat.brand}</p>
                      <p className="text-xs font-semibold text-slate-800 truncate">{mat.name}</p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-500 flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        <span>
          <Layers className="w-3 h-3 inline mr-1" />
          2D · 3D 실시간 자동 동기화 중
        </span>
      </div>
    </aside>
  );
};
