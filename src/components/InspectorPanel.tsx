import React, { useState } from 'react';
import { useProjectStore } from '../store/useProjectStore';
import { MATERIAL_CATALOG, getMaterial } from '../data/catalog';
import { MaterialCategory } from '../types/studio';
import { Lightbulb, RotateCw, Search, Trash2 } from 'lucide-react';

const TABS: { id: MaterialCategory; label: string }[] = [
  { id: 'floor', label: '마루/타일' },
  { id: 'wall', label: '벽지/월판넬' },
  { id: 'film', label: '필름지' },
  { id: 'ceiling', label: '천장' },
  { id: 'lighting', label: '조명/실링팬' },
  { id: 'electrical', label: '콘센트/스위치' },
  { id: 'appliance', label: '가전/냉장고' },
];

export const InspectorPanel: React.FC = () => {
  const {
    project,
    selection,
    activeCategory,
    setActiveCategory,
    applyMaterial,
    applyMaterialToAll,
    updateRoom,
    deleteRoom,
    toggleBlind,
    deleteOpening,
    deleteWall,
    resizeWallLength,
    rotateObject,
    toggleObjectPower,
    setObjectVariant,
    deleteObject,
    notify,
  } = useProjectStore();

  const [query, setQuery] = useState('');
  const [wallLenInput, setWallLenInput] = useState('');

  const selRoom = selection?.kind === 'room' ? project.rooms.find((r) => r.id === selection.id) : null;
  const selWall = selection?.kind === 'wall' ? project.walls.find((w) => w.id === selection.id) : null;
  const selOpening = selection?.kind === 'opening' ? project.openings.find((o) => o.id === selection.id) : null;
  const selObj = selection?.kind === 'object' ? project.objects.find((o) => o.id === selection.id) : null;

  const q = query.trim().toLowerCase();
  const items = MATERIAL_CATALOG.filter(
    (m) =>
      m.category === activeCategory &&
      (!q || m.name.toLowerCase().includes(q) || m.brand.toLowerCase().includes(q) || m.tags.some((t) => t.toLowerCase().includes(q)))
  );

  return (
    <aside className="w-80 lg:w-96 shrink-0 h-full bg-white border-l border-[#E9E9E7] flex flex-col overflow-hidden">
      {/* 1. Notion Property Card */}
      <div className="p-3.5 border-b border-[#E9E9E7] bg-[#F7F7F5] space-y-2.5">
        <div className="text-[10px] font-bold uppercase tracking-wider text-[#9B9A97]">
          선택 영역 속성 · 자재 인스펙터
        </div>

        {!selection && (
          <div className="space-y-2">
            <div className="p-2.5 rounded-lg bg-white border border-[#E9E9E7] text-xs text-[#787774] leading-relaxed">
              3D 또는 2D에서 <b className="text-[#37352F]">바닥 · 벽 · 창틀 · 콘센트 · 냉장고장 · 인덕션</b>을 클릭하면 즉시 자재를 바꿀 수 있습니다.
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: '웜 뉴트럴', fl: 'fl-cream-porcelain', wl: 'wl-diamang-stucco', fm: 'fm-walnut-wood' },
                { label: '내추럴 우드', fl: 'fl-natural-oak', wl: 'wl-warm-beige', fm: 'fm-walnut-wood' },
                { label: '모던 그레이', fl: 'fl-warm-concrete', wl: 'wl-fog-gray', fm: 'fm-charcoal-metal' },
              ].map((p) => (
                <button
                  key={p.label}
                  onClick={() => {
                    applyMaterialToAll(getMaterial(p.fl));
                    applyMaterialToAll(getMaterial(p.wl));
                    applyMaterialToAll(getMaterial(p.fm));
                    notify(`'${p.label}' 스타일 패키지를 적용했습니다.`);
                  }}
                  className="py-1.5 px-2 rounded-md bg-white hover:bg-[#DDEDEA] border border-[#E9E9E7] text-[11px] font-semibold text-[#37352F] transition"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {selRoom && (
          <div className="p-2.5 rounded-lg bg-white border border-[#E9E9E7] space-y-2 text-xs">
            <div className="flex items-center justify-between gap-2">
              <input
                type="text"
                value={selRoom.name}
                onChange={(e) => updateRoom(selRoom.id, { name: e.target.value })}
                className="font-bold text-[#37352F] bg-[#F7F7F5] focus:bg-white border border-transparent focus:border-[#0F7B6C] rounded px-1.5 py-0.5 text-xs outline-none w-32"
              />
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-[#787774] truncate max-w-[110px]">
                  {getMaterial(selRoom.floorMaterialId).name}
                </span>
                <button
                  onClick={() => deleteRoom(selRoom.id)}
                  className="p-1 rounded bg-[#F7F7F5] hover:bg-[#FBE4E4] text-[#787774] hover:text-[#E03E3E]"
                  title="방 삭제 (Delete)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() =>
                  updateRoom(selRoom.id, {
                    ceilingType: selRoom.ceilingType === 'well_cove' ? 'flat' : 'well_cove',
                  })
                }
                className={`px-2 py-1 rounded text-[11px] font-semibold border ${
                  selRoom.ceilingType === 'well_cove'
                    ? 'bg-[#EBF5FF] text-[#2383E2] border-[#BFE0FF]'
                    : 'bg-[#F7F7F5] text-[#787774] border-[#E9E9E7]'
                }`}
              >
                {selRoom.ceilingType === 'well_cove' ? '우물천장 ON' : '평천장'}
              </button>
              <button
                onClick={() => updateRoom(selRoom.id, { coveLightOn: !selRoom.coveLightOn })}
                className={`px-2 py-1 rounded text-[11px] font-semibold border flex items-center gap-1 ${
                  selRoom.coveLightOn
                    ? 'bg-[#FAEBDD] text-[#D9730D] border-[#F2CFAF]'
                    : 'bg-[#F7F7F5] text-[#787774] border-[#E9E9E7]'
                }`}
              >
                <Lightbulb className="w-3 h-3" />
                간접등 {selRoom.coveLightOn ? 'ON' : 'OFF'}
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
                  표기 치수 {selWall.displayLengthMm ?? Math.round(Math.hypot(selWall.x2 - selWall.x1, selWall.y2 - selWall.y1) * 1000)}mm · {getMaterial(selWall.frontMaterialId).name}
                </div>
              </div>
              <button
                onClick={() => deleteWall(selWall.id)}
                className="p-1.5 rounded bg-[#F7F7F5] hover:bg-[#FBE4E4] text-[#787774] hover:text-[#E03E3E]"
                title="벽체 삭제 (Delete)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-[#787774]">길이 수정(mm):</span>
              <input
                type="number"
                placeholder={String(Math.round(Math.hypot(selWall.x2 - selWall.x1, selWall.y2 - selWall.y1) * 1000))}
                value={wallLenInput}
                onChange={(e) => setWallLenInput(e.target.value)}
                className="w-20 px-2 py-0.5 border border-[#D3D1CB] rounded text-[11px] font-mono"
              />
              <button
                onClick={() => {
                  const v = Number(wallLenInput);
                  if (v >= 200) {
                    resizeWallLength(selWall.id, v);
                    setWallLenInput('');
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
                {selOpening.kind === 'window_blind'
                  ? '창호 · 블라인드'
                  : selOpening.kind === 'sliding_glass_door'
                  ? '유리 중문'
                  : '도어'}
              </div>
              <div className="text-[11px] text-[#787774]">
                프레임: {getMaterial(selOpening.frameMaterialId).name}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {selOpening.kind === 'window_blind' && (
                <button
                  onClick={() => toggleBlind(selOpening.id)}
                  className="px-2 py-1 rounded bg-[#F7F7F5] hover:bg-[#EFEFED] text-[11px] font-semibold"
                >
                  블라인드 {selOpening.hasBlind ? 'ON' : 'OFF'}
                </button>
              )}
              <button
                onClick={() => deleteOpening(selOpening.id)}
                className="p-1.5 rounded bg-[#F7F7F5] hover:bg-[#FBE4E4] text-[#787774] hover:text-[#E03E3E]"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {selObj && (
          <div className="p-2.5 rounded-lg bg-white border border-[#E9E9E7] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-bold text-[#37352F]">{selObj.name}</div>
                <div className="text-[11px] text-[#787774]">{getMaterial(selObj.materialId).name}</div>
              </div>
              <div className="flex items-center gap-1">
                {(selObj.kind === 'ceiling_fan' || selObj.kind === 'downlight') && (
                  <button
                    onClick={() => toggleObjectPower(selObj.id)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold ${
                      selObj.on ? 'bg-[#FAEBDD] text-[#D9730D]' : 'bg-[#F7F7F5] text-[#787774]'
                    }`}
                  >
                    {selObj.on ? 'ON' : 'OFF'}
                  </button>
                )}
                <button
                  onClick={() => rotateObject(selObj.id)}
                  className="p-1.5 rounded bg-[#F7F7F5] hover:bg-[#EFEFED] text-[#37352F]"
                  title="90° 회전"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => deleteObject(selObj.id)}
                  className="p-1.5 rounded bg-[#F7F7F5] hover:bg-[#FBE4E4] text-[#787774] hover:text-[#E03E3E]"
                  title="삭제"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {selObj.kind === 'tall_homebar' && (
              <div className="flex gap-1.5 pt-1">
                <button
                  onClick={() => setObjectVariant(selObj.id, 'option1')}
                  className={`flex-1 py-1.5 rounded text-[11px] font-semibold border ${
                    selObj.variant === 'option1'
                      ? 'bg-[#EBF5FF] text-[#2383E2] border-[#BFE0FF]'
                      : 'bg-[#F7F7F5] text-[#787774] border-[#E9E9E7]'
                  }`}
                >
                  1번: 오픈장 + 홈바
                </button>
                <button
                  onClick={() => setObjectVariant(selObj.id, 'option2')}
                  className={`flex-1 py-1.5 rounded text-[11px] font-semibold border ${
                    selObj.variant !== 'option1'
                      ? 'bg-[#EBF5FF] text-[#2383E2] border-[#BFE0FF]'
                      : 'bg-[#F7F7F5] text-[#787774] border-[#E9E9E7]'
                  }`}
                >
                  2번: 와이드 홈바
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Category Tabs & Search */}
      <div className="px-3 pt-2.5 pb-2 border-b border-[#E9E9E7] space-y-2">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveCategory(t.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition ${
                activeCategory === t.id
                  ? 'bg-[#37352F] text-white'
                  : 'bg-[#F7F7F5] text-[#787774] hover:text-[#37352F]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#9B9A97] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="자재명, 브랜드 검색..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F7F7F5] border border-[#E9E9E7] focus:bg-white focus:border-[#0F7B6C] rounded-md outline-none"
          />
        </div>
      </div>

      {/* 3. Material Cards */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.map((mat) => {
          const isApplied =
            (selRoom && (selRoom.floorMaterialId === mat.id || selRoom.ceilingMaterialId === mat.id)) ||
            (selWall && selWall.frontMaterialId === mat.id) ||
            (selOpening && selOpening.frameMaterialId === mat.id) ||
            (selObj && selObj.materialId === mat.id);

          return (
            <div
              key={mat.id}
              onClick={() => applyMaterial(mat)}
              className={`group cursor-pointer p-2.5 rounded-lg border transition flex items-center gap-3 ${
                isApplied
                  ? 'border-[#0F7B6C] bg-[#F3FAF8]'
                  : 'border-[#E9E9E7] hover:border-[#0F7B6C] hover:bg-[#FBFBFA]'
              }`}
            >
              <div
                className="w-11 h-11 rounded-md border border-[#D3D1CB] shrink-0 shadow-2xs"
                style={{
                  background: mat.accentColor
                    ? `linear-gradient(135deg, ${mat.color} 60%, ${mat.accentColor} 100%)`
                    : mat.color,
                }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-[10px] font-semibold text-[#787774] truncate">{mat.brand}</span>
                  {isApplied && (
                    <span className="px-1.5 py-0.2 rounded bg-[#DDEDEA] text-[#0F7B6C] text-[9px] font-bold shrink-0">
                      적용됨
                    </span>
                  )}
                </div>
                <div className="text-xs font-bold text-[#37352F] truncate">{mat.name}</div>
                <div className="text-[10px] text-[#9B9A97] flex items-center justify-between mt-0.5 gap-1">
                  <span className="truncate">{mat.spec}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="font-semibold text-[#0F7B6C]">
                      {mat.pricePerUnit.toLocaleString()}원
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        applyMaterialToAll(mat);
                      }}
                      className="px-1.5 py-0.5 rounded bg-[#F7F7F5] hover:bg-[#0F7B6C] hover:text-white border border-[#E9E9E7] text-[9px] font-semibold text-[#37352F] transition"
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
