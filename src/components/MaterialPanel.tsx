import React, { useState } from 'react';
import { useStudioStore } from '../store/useStudioStore';
import { MATERIALS_CATALOG, getMaterialById } from '../data/materials';
import { getMaterialSwatchUrl } from '../utils/proceduralTextures';
import { CeilingType, KelvinTemp, MaterialCategory } from '../types/interior';
import {
  Hammer,
  RotateCcw,
  Lightbulb,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Search,
} from 'lucide-react';

const CATEGORY_TABS: { id: MaterialCategory; label: string }[] = [
  { id: 'wallpaper', label: '도배지' },
  { id: 'floor', label: '마루/타일' },
  { id: 'film', label: '인테리어필름' },
  { id: 'ceiling', label: '천장/우물' },
  { id: 'lighting', label: '조명' },
];

export const MaterialPanel: React.FC = () => {
  const {
    plan,
    selection,
    activeMaterialCategory,
    setActiveMaterialCategory,
    applyMaterial,
    applyMaterialToAllRooms,
    toggleDemolishWall,
    deleteWall,
    setRoomFloorDirection,
    setRoomCeiling,
    renameRoom,
    flipOpeningSwing,
    deleteOpening,
    resizeWallLength,
    toggleLight,
    deleteLight,
    setEditorTool,
  } = useStudioStore();

  const [search, setSearch] = useState('');
  const [selectedBrand, setSelectedBrand] = useState<string>('전체');

  const categoryBrands = [
    '전체',
    ...Array.from(
      new Set(
        MATERIALS_CATALOG.filter((m) => m.category === activeMaterialCategory).map(
          (m) => m.brand
        )
      )
    ),
  ];

  const activeBrandFilter = categoryBrands.includes(selectedBrand)
    ? selectedBrand
    : '전체';

  const selectedRoom =
    selection?.kind === 'room'
      ? plan.rooms.find((r) => r.id === selection.id)
      : selection?.kind === 'ceiling'
        ? plan.rooms.find((r) => r.id === selection.roomId)
        : null;

  const selectedWall =
    selection?.kind === 'wall'
      ? plan.walls.find((w) => w.id === selection.id)
      : null;

  const selectedLight =
    selection?.kind === 'light'
      ? plan.lights.find((l) => l.id === selection.id)
      : null;

  const selectedOpening =
    selection?.kind === 'opening'
      ? plan.walls
          .find((w) => w.id === selection.wallId)
          ?.openings.find((o) => o.id === selection.openingId)
      : null;

  const qNorm = search.replace(/\s+/g, '').toLowerCase();
  const filteredMaterials = MATERIALS_CATALOG.filter(
    (m) =>
      m.category === activeMaterialCategory &&
      (activeBrandFilter === '전체' || m.brand === activeBrandFilter) &&
      (qNorm === '' ||
        m.name.replace(/\s+/g, '').toLowerCase().includes(qNorm) ||
        m.brand.replace(/\s+/g, '').toLowerCase().includes(qNorm) ||
        (m.productLine || '').replace(/\s+/g, '').toLowerCase().includes(qNorm) ||
        m.tags.some((t) => t.replace(/\s+/g, '').toLowerCase().includes(qNorm)))
  );

  return (
    <aside className="w-80 lg:w-96 h-full bg-white border-l border-[#E9E9E7] flex flex-col overflow-hidden">
      {/* 1. Selected Element Inspector (Notion Property Callout) */}
      <div className="p-3.5 border-b border-[#E9E9E7] bg-[#F7F7F5]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#787774]">
            선택 영역 속성 · 2D ↔ 3D
          </span>
        </div>

        {!selection && (
          <div className="p-2.5 rounded-lg bg-white border border-[#E9E9E7] text-xs text-[#787774] leading-relaxed">
            2D 도면 또는 3D 모델에서 <strong className="text-[#37352F]">방(바닥)</strong>,{' '}
            <strong className="text-[#37352F]">벽면</strong>,{' '}
            <strong className="text-[#37352F]">문/창문</strong>을 클릭하면 자재를 바로 적용할 수 있습니다.
          </div>
        )}

        {selectedRoom && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-[#37352F]">{selectedRoom.name}</div>
                <div className="text-[11px] text-[#787774]">
                  현재 바닥: {getMaterialById(selectedRoom.floorMaterialId).name}
                </div>
              </div>
              <span className="px-2 py-0.5 rounded bg-[#EBF5FF] text-[#2383E2] text-[11px] font-semibold">
                공간 선택됨
              </span>
            </div>

            {/* 마루 결 방향 (가로/세로) */}
            <div className="p-2 rounded-lg bg-white border border-[#E9E9E7] flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#37352F]">
                마루 결 방향
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setRoomFloorDirection(selectedRoom.id, 'horizontal')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                    (selectedRoom.floorDirection || 'horizontal') === 'horizontal'
                      ? 'bg-[#2383E2] text-white'
                      : 'bg-[#F7F7F5] text-[#787774] hover:text-[#37352F]'
                  }`}
                >
                  ↔ 가로방향
                </button>
                <button
                  onClick={() => setRoomFloorDirection(selectedRoom.id, 'vertical')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition ${
                    selectedRoom.floorDirection === 'vertical'
                      ? 'bg-[#2383E2] text-white'
                      : 'bg-[#F7F7F5] text-[#787774] hover:text-[#37352F]'
                  }`}
                >
                  ↕ 세로방향
                </button>
              </div>
            </div>

            {/* 우물천장 & 간접등 컨트롤 */}
            <div className="p-2.5 rounded-lg bg-white border border-[#E9E9E7] space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#37352F]">
                <span>우물천장 구조</span>
                <button
                  onClick={() =>
                    setRoomCeiling(selectedRoom.id, {
                      indirectLightOn: !selectedRoom.indirectLightOn,
                    })
                  }
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition ${
                    selectedRoom.indirectLightOn
                      ? 'bg-[#FAEBDD] text-[#D9730D]'
                      : 'bg-[#EFEFEE] text-[#787774]'
                  }`}
                >
                  T5 간접등 {selectedRoom.indirectLightOn ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {(
                  [
                    ['well_rect', '직각 우물'],
                    ['well_round', '라운드 우물'],
                    ['flat', '평천장'],
                  ] as [CeilingType, string][]
                ).map(([type, label]) => (
                  <button
                    key={type}
                    onClick={() =>
                      setRoomCeiling(selectedRoom.id, { ceilingType: type })
                    }
                    className={`py-1.5 px-2 rounded-md text-[11px] font-medium transition ${
                      selectedRoom.ceilingType === type
                        ? 'bg-[#2383E2] text-white'
                        : 'bg-[#F7F7F5] text-[#37352F] hover:bg-[#EFEFEE]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[#787774]">간접등 색온도</span>
                <div className="flex gap-1">
                  {(['3000K', '4000K', '5700K'] as KelvinTemp[]).map((k) => (
                    <button
                      key={k}
                      onClick={() =>
                        setRoomCeiling(selectedRoom.id, { indirectLightColor: k })
                      }
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                        selectedRoom.indirectLightColor === k
                          ? 'bg-[#D9730D] text-white'
                          : 'bg-[#F7F7F5] text-[#787774] hover:text-[#37352F]'
                      }`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 공간명 / 용도 간편 보정 */}
            <div className="p-2.5 rounded-lg bg-white border border-[#E9E9E7] space-y-1.5">
              <div className="text-[11px] font-semibold text-[#787774]">
                공간명 빠른 변경
              </div>
              <div className="flex flex-wrap gap-1">
                {(
                  [
                    ['거실', 'living'],
                    ['복도', 'alpha'],
                    ['주방 / 식당', 'kitchen'],
                    ['침실1 (안방)', 'master'],
                    ['침실2', 'bedroom'],
                    ['침실3', 'bedroom'],
                    ['공용욕실', 'bath'],
                    ['부부욕실', 'bath'],
                    ['드레스룸', 'dress'],
                    ['발코니', 'balcony'],
                    ['다용도실', 'utility'],
                    ['현관', 'entrance'],
                  ] as const
                ).map(([label, rType]) => (
                  <button
                    key={label}
                    onClick={() => renameRoom(selectedRoom.id, label, rType)}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                      selectedRoom.name === label
                        ? 'bg-[#2383E2] text-white'
                        : 'bg-[#F7F7F5] text-[#37352F] hover:bg-[#EFEFEE]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {selectedWall && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-[#37352F] flex items-center gap-1.5">
                  벽체 ({Math.hypot(selectedWall.x2 - selectedWall.x1, selectedWall.y2 - selectedWall.y1).toFixed(2)}m)
                  {selectedWall.demolished && (
                    <span className="px-1.5 py-0.5 text-[10px] bg-[#FBE4E4] text-[#E03E3E] rounded font-semibold">
                      철거됨
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#787774]">
                  도배지: {getMaterialById(selectedWall.frontMaterialId).name}
                </div>
              </div>

              <span
                className={`px-2 py-0.5 rounded text-[11px] font-semibold flex items-center gap-1 ${
                  selectedWall.isLoadBearing
                    ? 'bg-[#FBE4E4] text-[#E03E3E]'
                    : 'bg-[#DDEDEA] text-[#0F7B6C]'
                }`}
              >
                {selectedWall.isLoadBearing ? (
                  <>
                    <AlertTriangle className="w-3 h-3" /> 내력벽
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3 h-3" /> 비내력벽
                  </>
                )}
              </span>
            </div>

            {/* 벽체 치수(mm) 직접 수정 */}
            <form
              key={selectedWall.id}
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const val = Number(fd.get('wallLenMm'));
                if (!Number.isNaN(val) && val >= 300) {
                  resizeWallLength(selectedWall.id, val);
                }
              }}
              className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-white border border-[#E9E9E7]"
            >
              <span className="text-[11px] font-semibold text-[#787774]">
                벽 길이 (mm)
              </span>
              <div className="flex items-center gap-1">
                <input
                  name="wallLenMm"
                  type="number"
                  min={300}
                  max={25000}
                  step={50}
                  defaultValue={Math.round(
                    Math.hypot(
                      selectedWall.x2 - selectedWall.x1,
                      selectedWall.y2 - selectedWall.y1
                    ) * 1000
                  )}
                  className="w-20 px-2 py-0.5 text-xs font-mono font-semibold bg-[#F7F7F5] border border-[#D3D1CB] rounded text-[#37352F]"
                />
                <button
                  type="submit"
                  className="px-2 py-0.5 rounded bg-[#2383E2] hover:bg-[#1a6ec2] text-white text-[10px] font-semibold"
                >
                  변경
                </button>
              </div>
            </form>

            <div className="flex gap-1.5">
              {!selectedWall.isExterior && (
                <button
                  onClick={() => toggleDemolishWall(selectedWall.id)}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                    selectedWall.demolished
                      ? 'bg-[#0F7B6C] hover:bg-[#0B6357] text-white'
                      : selectedWall.isLoadBearing
                        ? 'bg-[#EFEFEE] text-[#787774] hover:bg-[#E5E5E3]'
                        : 'bg-[#E03E3E] hover:bg-[#C93333] text-white'
                  }`}
                >
                  {selectedWall.demolished ? (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" /> 벽체 복구
                    </>
                  ) : (
                    <>
                      <Hammer className="w-3.5 h-3.5" /> 벽 철거하기
                    </>
                  )}
                </button>
              )}
              {selectedWall.id.startsWith('wall-custom-') && (
                <button
                  onClick={() => deleteWall(selectedWall.id)}
                  className="p-1.5 rounded-md bg-[#EFEFEE] hover:bg-[#FBE4E4] text-[#787774] hover:text-[#E03E3E] transition"
                  title="추가한 가벽 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {selectedWall.openings.length > 0 && (
              <div className="p-2 rounded-lg bg-white border border-[#E9E9E7] space-y-1.5">
                <div className="text-[11px] font-semibold text-[#787774]">
                  벽체 내 문/창호 ({selectedWall.openings.length}개)
                </div>
                {selectedWall.openings.map((op) => (
                  <div
                    key={op.id}
                    className="flex items-center justify-between gap-1 text-[11px] bg-[#F7F7F5] px-2 py-1 rounded"
                  >
                    <span className="font-medium text-[#37352F]">
                      {op.type === 'door'
                        ? '방문'
                        : op.type === 'entrance'
                          ? '현관문'
                          : op.type === 'sliding_door'
                            ? '미닫이/중문'
                            : '창호'}{' '}
                      ({op.width.toFixed(1)}m)
                    </span>
                    <div className="flex items-center gap-1">
                      {(op.type === 'door' || op.type === 'entrance') && (
                        <button
                          onClick={() => flipOpeningSwing(selectedWall.id, op.id)}
                          className="px-1.5 py-0.5 rounded bg-white border border-[#D3D1CB] hover:bg-[#EBF5FF] text-[#2383E2] font-semibold text-[10px]"
                        >
                          열림방향 전환
                        </button>
                      )}
                      <button
                        onClick={() => deleteOpening(selectedWall.id, op.id)}
                        className="px-1.5 py-0.5 rounded bg-white border border-[#D3D1CB] hover:bg-[#FBE4E4] text-[#E03E3E] text-[10px]"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedOpening && (
          <div className="space-y-1">
            <div className="text-sm font-bold text-[#37352F]">
              {selectedOpening.type === 'window'
                ? '창호 / 섀시 프레임'
                : selectedOpening.type === 'sliding_door'
                  ? '슬라이딩 중문'
                  : '방문 / 현관문'}
            </div>
            <div className="text-xs text-[#787774]">
              규격: {selectedOpening.width}m × {selectedOpening.height}m · 필름:{' '}
              {getMaterialById(selectedOpening.frameMaterialId).name}
            </div>
          </div>
        )}

        {selectedLight && (
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-[#37352F] flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-[#D9730D]" />
                {selectedLight.type === 'ceiling_fan'
                  ? '실링팬 조명'
                  : selectedLight.type === 'pendant'
                    ? '식탁 펜던트'
                    : '매입 다운라이트'}
              </div>
              <div className="text-xs text-[#787774]">
                색온도 {selectedLight.kelvin}
              </div>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => toggleLight(selectedLight.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                  selectedLight.on
                    ? 'bg-[#FAEBDD] text-[#D9730D]'
                    : 'bg-[#EFEFEE] text-[#787774]'
                }`}
              >
                {selectedLight.on ? '점등' : '소등'}
              </button>
              <button
                onClick={() => deleteLight(selectedLight.id)}
                className="p-1.5 rounded-md bg-[#EFEFEE] hover:bg-[#FBE4E4] text-[#787774] hover:text-[#E03E3E]"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Material Catalog Tabs */}
      <div className="px-3 pt-3 pb-2 border-b border-[#E9E9E7] space-y-2 bg-white">
        <div className="flex gap-1 overflow-x-auto pb-1">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveMaterialCategory(tab.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition ${
                activeMaterialCategory === tab.id
                  ? 'bg-[#37352F] text-white'
                  : 'bg-[#F7F7F5] text-[#787774] hover:text-[#37352F] hover:bg-[#EFEFEE]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeMaterialCategory !== 'lighting' && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#9B9A97] absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="브랜드, 제품군(디아망/나투스진 등), 자재명 검색..."
                className="w-full bg-[#F7F7F5] border border-[#E9E9E7] rounded-md pl-8 pr-3 py-1.5 text-xs text-[#37352F] placeholder-[#9B9A97] focus:outline-none focus:border-[#2383E2] focus:bg-white transition"
              />
            </div>
            {/* 브랜드별 제품군 필터 */}
            <div className="flex gap-1 flex-wrap">
              {categoryBrands.map((brand) => (
                <button
                  key={brand}
                  onClick={() => setSelectedBrand(brand)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                    activeBrandFilter === brand
                      ? 'bg-[#EBF5FF] text-[#2383E2] border border-[#BFE0FF]'
                      : 'bg-[#F7F7F5] text-[#787774] hover:text-[#37352F]'
                  }`}
                >
                  {brand}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Material Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-white">
        {activeMaterialCategory === 'lighting' ? (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-[#F7F7F5] border border-[#E9E9E7] space-y-2">
              <div className="text-xs font-bold text-[#37352F]">조명 기구 추가 배치</div>
              <p className="text-[11px] text-[#787774]">
                아래 버튼을 누르고 2D 도면의 원하는 위치를 클릭하면 조명이 추가됩니다.
              </p>
              <button
                onClick={() => setEditorTool('add_light')}
                className="w-full py-2 rounded-md bg-[#D9730D] hover:bg-[#C2650A] text-white font-semibold text-xs transition"
              >
                + 2D 도면에 3인치 매입등 배치하기
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-[#787774] px-1">
                현재 배치된 조명 ({plan.lights.length}개)
              </div>
              {plan.lights.map((lt) => (
                <div
                  key={lt.id}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-[#E9E9E7]"
                >
                  <div className="flex items-center gap-2">
                    <Lightbulb
                      className={`w-4 h-4 ${
                        lt.on ? 'text-[#D9730D]' : 'text-[#C1BFB8]'
                      }`}
                    />
                    <div>
                      <div className="text-xs font-medium text-[#37352F]">
                        {lt.type === 'ceiling_fan'
                          ? '거실 실링팬'
                          : lt.type === 'pendant'
                            ? '식탁 펜던트'
                            : '매입 다운라이트'}
                      </div>
                      <div className="text-[10px] text-[#787774]">{lt.kelvin}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleLight(lt.id)}
                    className={`px-2 py-1 rounded text-[11px] font-medium ${
                      lt.on
                        ? 'bg-[#FAEBDD] text-[#D9730D]'
                        : 'bg-[#F7F7F5] text-[#787774]'
                    }`}
                  >
                    {lt.on ? 'ON' : 'OFF'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          filteredMaterials.map((mat) => {
            const swatch = getMaterialSwatchUrl(mat);
            return (
              <div
                key={mat.id}
                className="group p-2.5 rounded-lg bg-white hover:bg-[#FBFBFA] border border-[#E9E9E7] hover:border-[#2383E2]/50 transition"
              >
                <div className="flex gap-3">
                  <img
                    src={swatch}
                    alt={mat.name}
                    className="w-13 h-13 rounded-md object-cover border border-[#E9E9E7] shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-semibold text-[#2383E2] truncate">
                        {mat.brand}
                      </span>
                      <span className="text-[11px] font-semibold text-[#37352F] shrink-0">
                        {mat.pricePerUnit.toLocaleString()}원
                        <span className="text-[9px] text-[#9B9A97] font-normal">
                          /{mat.unitLabel}
                        </span>
                      </span>
                    </div>
                    <div className="text-xs font-bold text-[#37352F] truncate mt-0.5">
                      {mat.name}
                    </div>
                    <div className="text-[10px] text-[#787774] truncate mt-0.5">
                      {mat.spec}
                    </div>
                    <div className="flex items-center gap-1.5 mt-2">
                      <button
                        onClick={() => applyMaterial(mat)}
                        className="flex-1 py-1 px-2 rounded-md bg-[#EBF5FF] hover:bg-[#D8ECFF] text-[#2383E2] text-[11px] font-semibold transition"
                      >
                        선택 영역 적용
                      </button>
                      <button
                        onClick={() => applyMaterialToAllRooms(mat)}
                        className="py-1 px-2 rounded-md bg-[#F7F7F5] hover:bg-[#EFEFEE] text-[#787774] hover:text-[#37352F] text-[11px] transition"
                        title="전체 공간 일괄 적용"
                      >
                        전체 적용
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
};
