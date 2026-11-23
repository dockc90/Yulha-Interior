import React, { useState } from 'react';
import { X, Upload, Search, FolderOpen, Save, Trash2, Calculator } from 'lucide-react';
import { usePlannerStore } from '../store/usePlannerStore';
import { getMat } from '../data/materialsDb';

export const EstimateModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const rooms = usePlannerStore((s) => s.rooms);
  const project = usePlannerStore((s) => s.project);
  const nodeMap = new Map(project.nodes.map((n) => [n.id, n]));

  const floorRows = rooms.map((r) => {
    const mat = getMat(r.floorMaterialId);
    const py = r.areaSqm / 3.3058;
    const cost = Math.round(py * mat.price);
    return { room: r.name, matName: `${mat.brand} ${mat.name}`, qty: `${py.toFixed(1)}평`, cost };
  });

  let totalWallSqm = 0;
  const wallMatCounts = new Map<string, number>();
  for (const w of project.walls) {
    const a = nodeMap.get(w.startId);
    const b = nodeMap.get(w.endId);
    if (!a || !b) continue;
    const sqm = Math.hypot(b.x - a.x, b.y - a.y) * w.height;
    totalWallSqm += sqm;
    wallMatCounts.set(w.frontMaterialId, (wallMatCounts.get(w.frontMaterialId) ?? 0) + sqm);
  }
  const wallRows = Array.from(wallMatCounts.entries()).map(([matId, sqm]) => {
    const mat = getMat(matId);
    const py = sqm / 3.3058;
    return {
      room: '벽체 전체',
      matName: `${mat.brand} ${mat.name}`,
      qty: `${py.toFixed(1)}평 (${sqm.toFixed(1)}㎡)`,
      cost: Math.round(py * mat.price),
    };
  });

  const itemRows = project.items.map((it) => {
    const mat = getMat(it.materialId);
    const unitCost = mat.unit === '개' || mat.unit === '개소' || mat.unit === '대' || mat.unit === '세트' ? mat.price : 450000;
    return {
      room: it.name,
      matName: `${mat.brand} ${mat.name}`,
      qty: '1식',
      cost: unitCost,
    };
  });

  const allRows = [...floorRows, ...wallRows, ...itemRows];
  const totalCost = allRows.reduce((acc, r) => acc + r.cost, 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">실시간 자재 물량 · 예상 견적서</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4">
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-700 font-medium">{project.title}</p>
              <p className="text-[11px] text-blue-600">
                총 벽체 면적 {totalWallSqm.toFixed(1)}㎡ · 자재 + 기본 시공비 기준
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-blue-700">예상 합계</p>
              <p className="text-xl font-extrabold text-blue-900">
                {totalCost.toLocaleString()}원
              </p>
            </div>
          </div>

          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 text-left font-semibold">구분 / 공간</th>
                <th className="py-2 text-left font-semibold">적용 브랜드 자재</th>
                <th className="py-2 text-right font-semibold">물량</th>
                <th className="py-2 text-right font-semibold">금액</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allRows.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50">
                  <td className="py-2 font-medium text-slate-800">{row.room}</td>
                  <td className="py-2 text-slate-600">{row.matName}</td>
                  <td className="py-2 text-right text-slate-500">{row.qty}</td>
                  <td className="py-2 text-right font-semibold text-slate-800">
                    {row.cost.toLocaleString()}원
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export const UnderlayModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const underlayUrl = usePlannerStore((s) => s.underlayUrl);
  const underlayOpacity = usePlannerStore((s) => s.underlayOpacity);
  const setUnderlay = usePlannerStore((s) => s.setUnderlay);
  const [aptQuery, setAptQuery] = useState('고덕자이 84B 평면도');

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUnderlay(reader.result, 0.45);
        onClose();
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">분양 도면 밑그림 불러오기</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">1. 네이버 평면도 빠른 검색</label>
            <div className="flex gap-2">
              <input
                value={aptQuery}
                onChange={(e) => setAptQuery(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg"
                placeholder="단지명 + 타입 (예: 래미안 원베일리 84A)"
              />
              <a
                href={`https://search.naver.com/search.naver?where=image&query=${encodeURIComponent(aptQuery)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 px-3 py-2 bg-emerald-600 text-white font-semibold rounded-lg hover:bg-emerald-700"
              >
                <Search className="w-3.5 h-3.5" />
                검색
              </a>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">2. 저장한 도면 이미지 업로드</label>
            <label className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/30">
              <Upload className="w-6 h-6 text-blue-600" />
              <span className="font-medium text-slate-700">PNG / JPG 도면 파일 선택</span>
              <input type="file" accept="image/*" onChange={handleFile} className="hidden" />
            </label>
          </div>

          {underlayUrl && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-slate-700">
                  밑그림 투명도 ({Math.round(underlayOpacity * 100)}%)
                </span>
                <button
                  onClick={() => setUnderlay(null)}
                  className="text-rose-600 font-medium hover:underline"
                >
                  밑그림 제거
                </button>
              </div>
              <input
                type="range"
                min={0.1}
                max={0.9}
                step={0.05}
                value={underlayOpacity}
                onChange={(e) => setUnderlay(underlayUrl, Number(e.target.value))}
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const ProjectsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const project = usePlannerStore((s) => s.project);
  const listSavedProjects = usePlannerStore((s) => s.listSavedProjects);
  const saveCurrentProject = usePlannerStore((s) => s.saveCurrentProject);
  const loadSavedProject = usePlannerStore((s) => s.loadSavedProject);
  const deleteSavedProject = usePlannerStore((s) => s.deleteSavedProject);

  const [title, setTitle] = useState(project.title);
  const [, setRefresh] = useState(0);
  const saved = listSavedProjects();

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">프로젝트 저장 · 불러오기</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="flex gap-2">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg"
              placeholder="프로젝트 이름"
            />
            <button
              onClick={() => {
                saveCurrentProject(title);
                setRefresh((v) => v + 1);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
            >
              <Save className="w-3.5 h-3.5" />
              저장
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {saved.length === 0 ? (
              <p className="text-center py-6 text-slate-400">저장된 프로젝트가 없습니다.</p>
            ) : (
              saved.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 truncate">{entry.title}</p>
                    <p className="text-[10px] text-slate-400">
                      {new Date(entry.updatedAt).toLocaleString('ko-KR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        loadSavedProject(entry.id);
                        onClose();
                      }}
                      className="px-2.5 py-1 bg-slate-900 text-white rounded font-medium hover:bg-slate-700"
                    >
                      열기
                    </button>
                    <button
                      onClick={() => {
                        deleteSavedProject(entry.id);
                        setRefresh((v) => v + 1);
                      }}
                      className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
