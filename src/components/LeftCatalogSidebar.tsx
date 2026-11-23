import React, { useMemo, useState } from 'react';
import {
  Box,
  DoorOpen,
  Image as ImageIcon,
  Layers,
  MousePointer,
  PenTool,
  Search,
  Sofa,
  Square,
  Columns2,
  AppWindow,
} from 'lucide-react';
import { usePlannerStore, getSelectedMaterialId } from '../store/usePlannerStore';
import { MATERIALS_DB } from '../data/materialsDb';
import { MaterialKind, PropKind } from '../types/planner';

interface LeftCatalogSidebarProps {
  onOpenUnderlayModal: () => void;
}

const PROP_CATALOG: { group: string; items: { kind: PropKind; label: string; size: string }[] }[] = [
  {
    group: '거실',
    items: [
      { kind: 'sofa_modular', label: '모듈 패브릭 소파', size: '2800×980' },
      { kind: 'coffee_table', label: '세라믹 소파 테이블', size: '1200×650' },
      { kind: 'wall_tv', label: '반매립 75인치 TV', size: '1680×90' },
      { kind: 'aircon_stand', label: '비스포크 스탠드 에어컨', size: '420×340' },
      { kind: 'ceiling_fan', label: '루씨에어 실링팬', size: 'Ø1320' },
    ],
  },
  {
    group: '주방 · 다이닝',
    items: [
      { kind: 'island_counter', label: '아일랜드 식탁', size: '2200×900' },
      { kind: 'dining_set', label: '6인 우드 식탁', size: '1800×900' },
      { kind: 'fridge_4door', label: '비스포크 냉장고', size: '920×700' },
      { kind: 'induction_3', label: '3구 인덕션', size: '600×520' },
      { kind: 'kitchen_sink', label: '싱크대 하부장', size: '2600×650' },
      { kind: 'tall_homebar', label: '홈바 키큰장', size: '2200×650' },
    ],
  },
  {
    group: '침실 · 욕실',
    items: [
      { kind: 'bed_queen', label: '킹/퀸 호텔식 침대', size: '1850×2150' },
      { kind: 'wardrobe', label: '빌트인 붙박이장', size: '2400×620' },
      { kind: 'desk_set', label: '서재 우드 책상', size: '1400×700' },
      { kind: 'vanity', label: '하부장 세면대', size: '1000×520' },
      { kind: 'toilet', label: '비데 양변기', size: '420×680' },
      { kind: 'bathtub', label: '프리스탠딩 욕조', size: '1600×780' },
    ],
  },
  {
    group: '조명 · 배선설비',
    items: [
      { kind: 'downlight', label: '2인치 COB 매입등', size: 'Ø110' },
      { kind: 'outlet_2', label: '유럽형 2구 콘센트', size: '160×28' },
      { kind: 'switch_2', label: '2구 매립 스위치', size: '95×95' },
      { kind: 'wallpad', label: '스마트 홈 월패드', size: '240×160' },
    ],
  },
];

const MAT_TABS: { kind: MaterialKind | 'all'; label: string }[] = [
  { kind: 'all', label: '전체' },
  { kind: 'floor', label: '마루' },
  { kind: 'tile', label: '타일' },
  { kind: 'wall', label: '벽지' },
  { kind: 'film', label: '필름' },
  { kind: 'lighting', label: '조명' },
  { kind: 'electrical', label: '콘센트' },
  { kind: 'appliance', label: '가전' },
];

export const LeftCatalogSidebar: React.FC<LeftCatalogSidebarProps> = ({ onOpenUnderlayModal }) => {
  const tab = usePlannerStore((s) => s.sidebarTab);
  const setTab = usePlannerStore((s) => s.setSidebarTab);
  const matKind = usePlannerStore((s) => s.materialFilter);
  const setMatKind = usePlannerStore((s) => s.setMaterialFilter);
  const [brandFilter, setBrandFilter] = useState<string>('전체');
  const [search, setSearch] = useState('');

  const tool = usePlannerStore((s) => s.tool);
  const pendingPropKind = usePlannerStore((s) => s.pendingPropKind);
  const selection = usePlannerStore((s) => s.selection);
  const selectedMatId = usePlannerStore(getSelectedMaterialId);
  const setTool = usePlannerStore((s) => s.setTool);
  const applyMaterial = usePlannerStore((s) => s.applyMaterial);
  const applyMaterialToAll = usePlannerStore((s) => s.applyMaterialToAll);

  const brands = useMemo(() => {
    const set = new Set<string>(['전체']);
    MATERIALS_DB.forEach((m) => set.add(m.brand));
    return Array.from(set);
  }, []);

  const filteredMaterials = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MATERIALS_DB.filter((m) => {
      if (matKind !== 'all' && m.kind !== matKind) return false;
      if (brandFilter !== '전체' && m.brand !== brandFilter) return false;
      if (q && !`${m.brand} ${m.series} ${m.name} ${m.spec}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [matKind, brandFilter, search]);

  return (
    <aside className="w-[292px] shrink-0 h-full bg-white border-r border-slate-200 flex flex-col">
      <div className="grid grid-cols-3 border-b border-slate-200 bg-slate-50/70">
        <button
          onClick={() => setTab('build')}
          className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold border-b-2 transition-colors ${
            tab === 'build'
              ? 'border-blue-600 text-blue-700 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <PenTool className="w-4 h-4" />
          구조 그리기
        </button>
        <button
          onClick={() => setTab('props')}
          className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold border-b-2 transition-colors ${
            tab === 'props'
              ? 'border-blue-600 text-blue-700 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sofa className="w-4 h-4" />
          가구 · 가전
        </button>
        <button
          onClick={() => setTab('materials')}
          className={`flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold border-b-2 transition-colors ${
            tab === 'materials'
              ? 'border-blue-600 text-blue-700 bg-white'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          브랜드 자재
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {tab === 'build' && (
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                2D CAD 평면 도구
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setTool('select')}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium ${
                    tool === 'select'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <MousePointer className="w-4 h-4" />
                  선택 / 이동
                </button>
                <button
                  onClick={() => setTool('draw_wall')}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium ${
                    tool === 'draw_wall'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <PenTool className="w-4 h-4" />
                  벽체 그리기
                </button>
                <button
                  onClick={() => setTool('draw_room_box')}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium ${
                    tool === 'draw_room_box'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Square className="w-4 h-4" />
                  사각형 방
                </button>
                <button
                  onClick={() => setTool('add_door')}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium ${
                    tool === 'add_door'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <DoorOpen className="w-4 h-4" />
                  방문 추가
                </button>
                <button
                  onClick={() => setTool('add_sliding')}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium ${
                    tool === 'add_sliding'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Columns2 className="w-4 h-4" />
                  3연동 중문
                </button>
                <button
                  onClick={() => setTool('add_window')}
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium ${
                    tool === 'add_window'
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <AppWindow className="w-4 h-4" />
                  창문 추가
                </button>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                분양 도면 밑그림
              </p>
              <button
                onClick={onOpenUnderlayModal}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border border-dashed border-slate-300 text-xs font-medium text-slate-700 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/40"
              >
                <ImageIcon className="w-4 h-4" />
                도면 이미지 불러오기 / 검색
              </button>
              <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
                Planner 5D 방식의 꼭짓점 연결 그래프를 사용해 코너를 드래그하면 연결된 모든 벽체와 방 면적(㎡/평)이 자동 계산됩니다.
              </p>
            </div>
          </div>
        )}

        {tab === 'props' && (
          <div className="space-y-4">
            {PROP_CATALOG.map((grp) => (
              <div key={grp.group}>
                <p className="text-[11px] font-semibold text-slate-500 mb-1.5">{grp.group}</p>
                <div className="grid grid-cols-1 gap-1.5">
                  {grp.items.map((it) => {
                    const active = tool === 'place_item' && pendingPropKind === it.kind;
                    return (
                      <button
                        key={it.kind}
                        onClick={() => setTool('place_item', it.kind)}
                        className={`flex items-center justify-between px-2.5 py-2 rounded-lg border text-left transition-colors ${
                          active
                            ? 'border-blue-600 bg-blue-50 text-blue-700'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Box className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-xs font-medium">{it.label}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{it.size}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'materials' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="자재명, 브랜드 검색 (예: 구정, 비스포크)"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex flex-wrap gap-1">
              {MAT_TABS.map((t) => (
                <button
                  key={t.kind}
                  onClick={() => setMatKind(t.kind)}
                  className={`px-2 py-1 rounded text-[11px] font-medium ${
                    matKind === t.kind
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
            >
              {brands.map((b) => (
                <option key={b} value={b}>
                  브랜드: {b}
                </option>
              ))}
            </select>

            <div className="text-[11px] text-slate-400">
              {selection
                ? '클릭하면 선택한 영역에 즉시 적용됩니다.'
                : '3D/2D에서 바닥·벽·가구를 클릭 후 자재를 선택하세요.'}
            </div>

            <div className="space-y-1.5">
              {filteredMaterials.map((mat) => {
                const isApplied = selectedMatId === mat.id;
                return (
                  <div
                    key={mat.id}
                    onClick={() => applyMaterial(mat)}
                    className={`group p-2 rounded-lg border cursor-pointer transition-all ${
                      isApplied
                        ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-md border border-slate-200 shrink-0 shadow-inner"
                        style={{ backgroundColor: mat.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[10px] font-semibold text-blue-700 truncate">
                            {mat.brand} · {mat.series}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 shrink-0">
                            {(mat.price / 10000).toFixed(1)}만/{mat.unit}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-800 truncate">{mat.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{mat.spec}</p>
                      </div>
                    </div>
                    {(mat.kind === 'floor' || mat.kind === 'wall' || mat.kind === 'tile') && (
                      <div className="mt-1.5 flex justify-end">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            applyMaterialToAll(mat);
                          }}
                          className="text-[10px] font-medium text-slate-500 hover:text-blue-700 px-1.5 py-0.5 rounded bg-slate-100 hover:bg-blue-100"
                        >
                          전체 공간 일괄 적용
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
