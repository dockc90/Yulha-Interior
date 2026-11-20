import React, { useState } from 'react';
import { useDesignStore } from '../store/useDesignStore';
import { BRAND_CATALOG, getCatalogItem } from '../data/brandCatalog';
import { MaterialGroup } from '../types/design';
import { Lightbulb, RotateCw, Search, Trash2 } from 'lucide-react';

const TABS: { id: MaterialGroup; label: string }[] = [
  { id: 'floor', label: '마루' },
  { id: 'tile', label: '타일' },
  { id: 'wall', label: '벽지/월판넬' },
  { id: 'film', label: '필름지' },
  { id: 'ceiling', label: '천장' },
  { id: 'lighting', label: '조명/실링팬' },
  { id: 'electrical', label: '콘센트/스위치' },
  { id: 'appliance', label: '냉장고/인덕션' },
];

export const MaterialInspector: React.FC = () => {
  const {
    draftPlan,
    selection,
    activeGroup,
    setActiveGroup,
    applyMaterial,
    applyMaterialToAll,
    renameSpace,
    toggleSpaceCove,
    toggleSpaceCeilingType,
    setWallDisplayMm,
    toggleBlind,
    rotateProp,
    togglePropPower,
    setPropVariant,
    deleteSelected,
    notify,
  } = useDesignStore();

  const [query, setQuery] = useState('');
  const [mmInput, setMmInput] = useState('');
  const [brandFilter, setBrandFilter] = useState('전체');

  const selSpace = selection?.kind === 'space' ? draftPlan.spaces.find((s) => s.id === selection.id) : null;
  const selWall = selection?.kind === 'wall' ? draftPlan.walls.find((w) => w.id === selection.id) : null;
  const selOpening = selection?.kind === 'opening' ? draftPlan.openings.find((o) => o.id === selection.id) : null;
  const selProp = selection?.kind === 'prop' ? draftPlan.props.find((p) => p.id === selection.id) : null;

  const brands = [
    '전체',
    ...Array.from(new Set(BRAND_CATALOG.filter((m) => m.group === activeGroup).map((m) => m.brand))),
  ];
  const activeBrand = brands.includes(brandFilter) ? brandFilter : '전체';

  const q = query.trim().toLowerCase();
  const items = BRAND_CATALOG.filter(
    (m) =>
      m.group === activeGroup &&
      (activeBrand === '전체' || m.brand === activeBrand) &&
      (!q ||
        m.name.toLowerCase().includes(q) ||
        m.brand.toLowerCase().includes(q) ||
        m.series.toLowerCase().includes(q))
  );

  return (
    <aside className="w-80 lg:w-96 shrink-0 h-full bg-white border-l border-[#E9E9E7] flex flex-col overflow-hidden">
      {/* Property Header */}
      <div className="p-3.5 border-b border-[#E9E9E7] bg-[#F7F7F5] space-y-2.5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#9B9A97]">
          선택 영역 속성 · 2026 자재 인스펙터
        </div>

        {!selection && (
          <div className="space-y-2">
            <div className="p-2.5 rounded-lg bg-white border border-[#E9E9E7] text-xs text-[#787774] leading-relaxed">
              3D 또는 2D에서 <b className="text-[#37352F]">바닥·벽·창틀·콘센트·냉장고·인덕션</b>을 클릭한 뒤 아래 자재를 고르세요. (미선택 시 전체 적용)
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: '2026 웜뉴트럴', fl: 'tl-yun-cream600', wl: 'wl-lx-diamang-cream', fm: 'fm-bodac-walnut' },
                { label: '내추럴 오크', fl: 'fl-dongwha-max', wl: 'wl-shinhan-facade', fm: 'fm-bodac-walnut' },
                { label: '호텔 모던그레이', fl: 'tl-yun-gray800', wl: 'wl-gaenari-primo', fm: 'fm-bodac-charcoal' },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    applyMaterialToAll(getCatalogItem(p.fl));
                    applyMaterialToAll(getCatalogItem(p.wl));
                    applyMaterialToAll(getCatalogItem(p.fm));
                    notify(`'${p.label}' 스타일을 전체 적용했습니다.`);
                  }}
                  className="py-1.5 px-2 rounded-md bg-white hover:bg-[#DDEDEA] border border-[#E9E9E7] text-[10px] font-semibold text-[#37352F] transition"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {selSpace && (
          <div className="p-2.5 rounded-lg bg-white border border-[#E9E9E7] space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={selSpace.name}
                onChange={(e) => renameSpace(selSpace.id, e.target.value)}
                className="font-bold text-[#37352F] bg-[#F7F7F5] focus:bg-white rounded px-1.5 py-0.5 text-xs outline-none w-32"
              />
              <button
                onClick={deleteSelected}
                className="p-1 rounded bg-[#F7F7F5] hover:bg-[#FBE4E4] text-[#787774] hover:text-[#E03E3E]"
                title="공간 삭제"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => toggleSpaceCeilingType(selSpace.id)}
                className={`px-2 py-1 rounded text-[11px] font-semibold border ${
                  selSpace.ceilingType === 'well_cove'
                    ? 'bg-[#EBF5FF] text-[#2383E2] border-[#BFE0FF]'
                    : 'bg-[#F7F7F5] text-[#787774] border-[#E9E9E7]'
                }`}
              >
                {selSpace.ceilingType === 'well_cove' ? '우물천장 ON' : '평천장'}
              </button>
              <button
                onClick={() => toggleSpaceCove(selSpace.id)}
                className={`px-2 py-1 rounded text-[11px] font-semibold border flex items-center gap-1 ${
                  selSpace.coveLightOn
                    ? 'bg-[#FAEBDD] text-[#D9730D] border-[#F2CFAF]'
                    : 'bg-[#F7F7F5] text-[#787774] border-[#E9E9E7]'
                }`}
              >
                <Lightbulb className="w-3 h-3" />
                간접등 {selSpace.coveLightOn ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        )}

        {selWall && (
          <div className="p-2.5 rounded-lg bg-white border border-[#E9E9E7] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-[#37352F]">벽체 ({selWall.isExterior ? '외벽' : '내벽'})</div>
                <div className="text-[11px] text-[#787774]">
                  표기 치수 {selWall.displayMm ?? Math.round(Math.hypot(selWall.x2 - selWall.x1, selWall.y2 - selWall.y1) * 1000)}mm
                </div>
              </div>
              <button
                onClick={deleteSelected}
                className="p-1.5 rounded bg-[#F7F7F5] hover:bg-[#FBE4E4] text-[#787774] hover:text-[#E03E3E]"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#787774]">치수 숫자 수정(mm):</span>
              <input
                type="number"
                value={mmInput}
                onChange={(e) => setMmInput(e.target.value)}
                placeholder={String(selWall.displayMm ?? Math.round(Math.hypot(selWall.x2 - selWall.x1, selWall.y2 - selWall.y1) * 1000))}
                className="w-20 px-2 py-0.5 border border-[#D3D1CB] rounded text-[11px] font-mono"
              />
              <button
                onClick={() => {
                  const v = Number(mmInput);
                  if (v >= 100) {
                    setWallDisplayMm(selWall.id, v);
                    setMmInput('');
                  }
                }}
                className="px-2 py-0.5 rounded bg-[#37352F] text-white text-[11px] font-semibold"
              >
                적용
              </button>
            </div>
          </div>
        )}

        {selOpening && (
          <div className="p-2.5 rounded-lg bg-white border border-[#E9E9E7] flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-[#37352F]">
                {selOpening.type === 'window_blind' ? '창호 · 우드 블라인드' : selOpening.type === 'sliding_glass' ? '유리 중문' : '도어'}
              </div>
              <div className="text-[11px] text-[#787774]">{getCatalogItem(selOpening.frameMaterialId).name}</div>
            </div>
            <div className="flex items-center gap-1">
              {selOpening.type === 'window_blind' && (
                <button
                  onClick={() => toggleBlind(selOpening.id)}
                  className="px-2 py-1 rounded bg-[#F7F7F5] text-[11px] font-semibold"
                >
                  블라인드 {selOpening.hasBlind ? 'ON' : 'OFF'}
                </button>
              )}
              <button onClick={deleteSelected} className="p-1.5 rounded bg-[#F7F7F5] hover:bg-[#FBE4E4] text-[#787774] hover:text-[#E03E3E]">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {selProp && (
          <div className="p-2.5 rounded-lg bg-white border border-[#E9E9E7] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-[#37352F]">{selProp.label}</div>
                <div className="text-[11px] text-[#787774]">{getCatalogItem(selProp.materialId).name}</div>
              </div>
              <div className="flex items-center gap-1">
                {(selProp.type === 'ceiling_fan' || selProp.type === 'downlight') && (
                  <button
                    onClick={() => togglePropPower(selProp.id)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold ${
                      selProp.powerOn ? 'bg-[#FAEBDD] text-[#D9730D]' : 'bg-[#F7F7F5] text-[#787774]'
                    }`}
                  >
                    {selProp.powerOn ? 'ON' : 'OFF'}
                  </button>
                )}
                <button onClick={() => rotateProp(selProp.id)} className="p-1.5 rounded bg-[#F7F7F5] hover:bg-[#EFEFED]" title="90° 회전">
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button onClick={deleteSelected} className="p-1.5 rounded bg-[#F7F7F5] hover:bg-[#FBE4E4] text-[#787774] hover:text-[#E03E3E]">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {selProp.type === 'tall_homebar' && (
              <div className="flex gap-1.5">
                <button
                  onClick={() => setPropVariant(selProp.id, 'option1')}
                  className={`flex-1 py-1.5 rounded text-[11px] font-semibold border ${
                    selProp.variant === 'option1' ? 'bg-[#EBF5FF] text-[#2383E2] border-[#BFE0FF]' : 'bg-[#F7F7F5] text-[#787774] border-[#E9E9E7]'
                  }`}
                >
                  1번: 오픈장 + 홈바
                </button>
                <button
                  onClick={() => setPropVariant(selProp.id, 'option2')}
                  className={`flex-1 py-1.5 rounded text-[11px] font-semibold border ${
                    selProp.variant !== 'option1' ? 'bg-[#EBF5FF] text-[#2383E2] border-[#BFE0FF]' : 'bg-[#F7F7F5] text-[#787774] border-[#E9E9E7]'
                  }`}
                >
                  2번: 와이드 홈바
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="px-3 pt-2.5 pb-2 border-b border-[#E9E9E7] space-y-2">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveGroup(t.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition ${
                activeGroup === t.id ? 'bg-[#37352F] text-white' : 'bg-[#F7F7F5] text-[#787774] hover:text-[#37352F]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {brands.map((b) => (
            <button
              key={b}
              onClick={() => setBrandFilter(b)}
              className={`px-2 py-0.5 rounded text-[10px] font-semibold whitespace-nowrap transition ${
                activeBrand === b
                  ? 'bg-[#0F7B6C] text-white'
                  : 'bg-[#F7F7F5] text-[#787774] hover:text-[#37352F]'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#9B9A97] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="브랜드, 시리즈, 자재명 검색..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F7F7F5] border border-[#E9E9E7] focus:bg-white focus:border-[#0F7B6C] rounded-md outline-none"
          />
        </div>
      </div>

      {/* Brand Catalog List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.map((mat) => {
          const isApplied =
            (selSpace && (selSpace.floorMaterialId === mat.id || selSpace.ceilingMaterialId === mat.id)) ||
            (selWall && selWall.materialId === mat.id) ||
            (selOpening && selOpening.frameMaterialId === mat.id) ||
            (selProp && selProp.materialId === mat.id);

          return (
            <div
              key={mat.id}
              onClick={() => applyMaterial(mat)}
              className={`cursor-pointer p-2.5 rounded-lg border transition flex items-center gap-3 ${
                isApplied ? 'border-[#0F7B6C] bg-[#F3FAF8]' : 'border-[#E9E9E7] hover:border-[#0F7B6C] hover:bg-[#FBFBFA]'
              }`}
            >
              <div
                className="w-11 h-11 rounded-md border border-[#D3D1CB] shrink-0"
                style={{
                  background: mat.subColor ? `linear-gradient(135deg, ${mat.color} 60%, ${mat.subColor} 100%)` : mat.color,
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-semibold text-[#787774] truncate">
                    {mat.brand} · {mat.series}
                  </span>
                  {mat.isTrend2026 && (
                    <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200 text-[9px] font-bold shrink-0">
                      2026
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-[#37352F] truncate">{mat.name}</div>
                <div className="text-[10px] text-[#9B9A97] flex items-center justify-between mt-0.5">
                  <span className="truncate">{mat.spec}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-semibold text-[#0F7B6C]">{mat.price.toLocaleString()}원</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        applyMaterialToAll(mat);
                      }}
                      className="px-1.5 py-0.5 rounded bg-[#F7F7F5] hover:bg-[#0F7B6C] hover:text-white border border-[#E9E9E7] text-[9px] font-semibold text-[#37352F]"
                    >
                      전체
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
