import { ProjectData } from '../types/studio';

export function createShowcase34Plan(): ProjectData {
  return {
    id: 'showcase-34py',
    title: '모던 웜 뉴트럴 34평 (모델하우스)',
    areaSqm: 84.9,
    width: 12.2,
    depth: 9.6,
    rooms: [
      {
        id: 'rm-living',
        name: '거실',
        kind: 'living',
        polygon: [
          { x: 0.2, y: 4.8 },
          { x: 6.4, y: 4.8 },
          { x: 6.4, y: 9.4 },
          { x: 0.2, y: 9.4 },
        ],
        floorMaterialId: 'fl-cream-porcelain',
        ceilingType: 'well_cove',
        ceilingMaterialId: 'cl-matte-white',
        coveLightOn: true,
        coveKelvin: '3000K',
      },
      {
        id: 'rm-kitchen',
        name: '주방 · 다이닝',
        kind: 'kitchen',
        polygon: [
          { x: 0.2, y: 0.2 },
          { x: 6.4, y: 0.2 },
          { x: 6.4, y: 4.8 },
          { x: 0.2, y: 4.8 },
        ],
        floorMaterialId: 'fl-cream-porcelain',
        ceilingType: 'flat',
        ceilingMaterialId: 'cl-warm-ivory',
        coveLightOn: true,
        coveKelvin: '3000K',
      },
      {
        id: 'rm-master',
        name: '안방 (침실1)',
        kind: 'master',
        polygon: [
          { x: 6.4, y: 4.8 },
          { x: 12.0, y: 4.8 },
          { x: 12.0, y: 9.4 },
          { x: 6.4, y: 9.4 },
        ],
        floorMaterialId: 'fl-natural-oak',
        ceilingType: 'flat',
        ceilingMaterialId: 'cl-matte-white',
        coveLightOn: true,
        coveKelvin: '3000K',
      },
      {
        id: 'rm-bedroom2',
        name: '침실2 (서재)',
        kind: 'bedroom',
        polygon: [
          { x: 6.4, y: 0.2 },
          { x: 9.6, y: 0.2 },
          { x: 9.6, y: 4.8 },
          { x: 6.4, y: 4.8 },
        ],
        floorMaterialId: 'fl-natural-oak',
        ceilingType: 'flat',
        ceilingMaterialId: 'cl-matte-white',
        coveLightOn: false,
        coveKelvin: '4000K',
      },
      {
        id: 'rm-entrance',
        name: '현관 · 중문',
        kind: 'entrance',
        polygon: [
          { x: 9.6, y: 0.2 },
          { x: 12.0, y: 0.2 },
          { x: 12.0, y: 2.6 },
          { x: 9.6, y: 2.6 },
        ],
        floorMaterialId: 'fl-warm-concrete',
        ceilingType: 'flat',
        ceilingMaterialId: 'cl-matte-white',
        coveLightOn: true,
        coveKelvin: '3000K',
      },
      {
        id: 'rm-bath',
        name: '욕실',
        kind: 'bath',
        polygon: [
          { x: 9.6, y: 2.6 },
          { x: 12.0, y: 2.6 },
          { x: 12.0, y: 4.8 },
          { x: 9.6, y: 4.8 },
        ],
        floorMaterialId: 'fl-warm-concrete',
        ceilingType: 'flat',
        ceilingMaterialId: 'cl-matte-white',
        coveLightOn: false,
        coveKelvin: '4000K',
      },
    ],
    walls: [
      // Exterior perimeter
      { id: 'w-north', x1: 0.2, y1: 0.2, x2: 12.0, y2: 0.2, thickness: 0.22, height: 2.45, isExterior: true, frontMaterialId: 'wl-diamang-stucco', backMaterialId: 'wl-diamang-stucco' },
      { id: 'w-south', x1: 0.2, y1: 9.4, x2: 12.0, y2: 9.4, thickness: 0.22, height: 2.45, isExterior: true, frontMaterialId: 'wl-diamang-stucco', backMaterialId: 'wl-diamang-stucco' },
      { id: 'w-west', x1: 0.2, y1: 0.2, x2: 0.2, y2: 9.4, thickness: 0.22, height: 2.45, isExterior: true, frontMaterialId: 'wl-wood-panel', backMaterialId: 'wl-diamang-stucco' },
      { id: 'w-east', x1: 12.0, y1: 0.2, x2: 12.0, y2: 9.4, thickness: 0.22, height: 2.45, isExterior: true, frontMaterialId: 'wl-diamang-stucco', backMaterialId: 'wl-diamang-stucco' },
      // Interior partitions
      { id: 'w-center-v', x1: 6.4, y1: 0.2, x2: 6.4, y2: 9.4, thickness: 0.14, height: 2.45, isExterior: false, frontMaterialId: 'wl-diamang-stucco', backMaterialId: 'wl-diamang-stucco' },
      { id: 'w-master-n', x1: 6.4, y1: 4.8, x2: 12.0, y2: 4.8, thickness: 0.14, height: 2.45, isExterior: false, frontMaterialId: 'wl-diamang-stucco', backMaterialId: 'wl-diamang-stucco' },
      { id: 'w-ent-w', x1: 9.6, y1: 0.2, x2: 9.6, y2: 4.8, thickness: 0.14, height: 2.45, isExterior: false, frontMaterialId: 'wl-diamang-stucco', backMaterialId: 'wl-diamang-stucco' },
      { id: 'w-ent-s', x1: 9.6, y1: 2.6, x2: 12.0, y2: 2.6, thickness: 0.12, height: 2.45, isExterior: false, frontMaterialId: 'wl-diamang-stucco', backMaterialId: 'wl-diamang-stucco' },
    ],
    openings: [
      { id: 'op-living-win', wallId: 'w-south', kind: 'window_blind', offset: 0.26, width: 4.4, height: 2.05, sillHeight: 0.2, frameMaterialId: 'fm-walnut-wood', hasBlind: true },
      { id: 'op-master-win', wallId: 'w-south', kind: 'window_blind', offset: 0.76, width: 2.8, height: 1.5, sillHeight: 0.75, frameMaterialId: 'fm-walnut-wood', hasBlind: true },
      { id: 'op-kitchen-win', wallId: 'w-north', kind: 'window_blind', offset: 0.26, width: 1.6, height: 0.85, sillHeight: 1.2, frameMaterialId: 'fm-walnut-wood', hasBlind: false },
      { id: 'op-jungmun', wallId: 'w-center-v', kind: 'sliding_glass_door', offset: 0.28, width: 1.4, height: 2.25, sillHeight: 0, frameMaterialId: 'fm-walnut-wood' },
      { id: 'op-master-door', wallId: 'w-center-v', kind: 'door', offset: 0.72, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: 'fm-walnut-wood' },
      { id: 'op-ent-door', wallId: 'w-east', kind: 'entrance_door', offset: 0.14, width: 1.05, height: 2.15, sillHeight: 0, frameMaterialId: 'fm-charcoal-metal' },
      { id: 'op-bath-door', wallId: 'w-ent-w', kind: 'door', offset: 0.76, width: 0.8, height: 2.1, sillHeight: 0, frameMaterialId: 'fm-matte-cream' },
    ],
    objects: [
      // 거실 (첨부 이미지 1)
      { id: 'obj-sofa', name: '모듈 패브릭 소파', kind: 'sofa_modular', x: 1.15, y: 7.1, elevation: 0, width: 1.05, depth: 3.1, height: 0.78, rotation: 0, materialId: 'wl-warm-beige' },
      { id: 'obj-tv', name: '반매립 85인치 OLED TV', kind: 'wall_tv', x: 6.26, y: 7.1, elevation: 1.28, width: 1.85, depth: 0.05, height: 1.04, rotation: Math.PI / 2, materialId: 'el-jung-black' },
      { id: 'obj-fan', name: '월넛 우드 3엽 실링팬', kind: 'ceiling_fan', x: 3.3, y: 7.1, elevation: 2.38, width: 1.32, depth: 1.32, height: 0.28, rotation: 0, materialId: 'lt-fan-wood', on: true },
      { id: 'obj-dl-1', name: '거실 다운라이트 1', kind: 'downlight', x: 1.6, y: 5.8, elevation: 2.42, width: 0.1, depth: 0.1, height: 0.04, rotation: 0, materialId: 'lt-downlight-3k', on: true },
      { id: 'obj-dl-2', name: '거실 다운라이트 2', kind: 'downlight', x: 5.0, y: 5.8, elevation: 2.42, width: 0.1, depth: 0.1, height: 0.04, rotation: 0, materialId: 'lt-downlight-3k', on: true },
      { id: 'obj-dl-3', name: '거실 다운라이트 3', kind: 'downlight', x: 1.6, y: 8.3, elevation: 2.42, width: 0.1, depth: 0.1, height: 0.04, rotation: 0, materialId: 'lt-downlight-3k', on: true },
      { id: 'obj-dl-4', name: '거실 다운라이트 4', kind: 'downlight', x: 5.0, y: 8.3, elevation: 2.42, width: 0.1, depth: 0.1, height: 0.04, rotation: 0, materialId: 'lt-downlight-3k', on: true },

      // TV 하단 콘센트 & 벽면 스위치 · 월패드
      { id: 'obj-out-tv1', name: 'TV 하단 2구 콘센트', kind: 'outlet_2', x: 6.26, y: 6.85, elevation: 0.42, width: 0.12, depth: 0.02, height: 0.08, rotation: Math.PI / 2, materialId: 'el-legrand-white' },
      { id: 'obj-out-tv2', name: 'TV 하단 통신/콘센트', kind: 'outlet_2', x: 6.26, y: 7.35, elevation: 0.42, width: 0.12, depth: 0.02, height: 0.08, rotation: Math.PI / 2, materialId: 'el-legrand-white' },
      { id: 'obj-sw-kit', name: '주방 벽 스위치', kind: 'switch_2', x: 0.34, y: 4.2, elevation: 1.25, width: 0.09, depth: 0.02, height: 0.12, rotation: -Math.PI / 2, materialId: 'el-legrand-white' },
      { id: 'obj-wallpad', name: '홈 월패드', kind: 'wallpad', x: 0.34, y: 3.9, elevation: 1.38, width: 0.26, depth: 0.02, height: 0.18, rotation: -Math.PI / 2, materialId: 'el-legrand-white' },

      // 주방 (첨부 이미지 2, 3, 4)
      { id: 'obj-sink', name: '상부장 · 사각 싱크대', kind: 'kitchen_sink', x: 3.0, y: 0.65, elevation: 0, width: 3.6, depth: 0.65, height: 0.88, rotation: 0, materialId: 'fm-matte-cream' },
      { id: 'obj-island', name: '대면형 아일랜드 (간접등)', kind: 'island_counter', x: 3.0, y: 2.35, elevation: 0, width: 2.8, depth: 0.9, height: 0.88, rotation: 0, materialId: 'fm-matte-cream' },
      { id: 'obj-induct', name: '블랙 글래스 3구 인덕션', kind: 'induction_3', x: 2.2, y: 2.35, elevation: 0.88, width: 0.62, depth: 0.52, height: 0.03, rotation: 0, materialId: 'ap-induction-black' },
      { id: 'obj-dining', name: '4인용 우드 식탁 세트', kind: 'dining_set', x: 3.0, y: 3.85, elevation: 0, width: 1.65, depth: 0.88, height: 0.75, rotation: 0, materialId: 'fl-white-oak' },
      { id: 'obj-fridge', name: '비스포크 키친핏 4도어 냉장고장', kind: 'fridge_4door', x: 5.95, y: 1.45, elevation: 0, width: 1.6, depth: 0.68, height: 2.3, rotation: Math.PI / 2, materialId: 'ap-bespoke-white' },
      { id: 'obj-tallcab', name: '홈바 · 키큰장 (1번/2번 옵션)', kind: 'tall_homebar', x: 5.95, y: 3.2, elevation: 0, width: 1.55, depth: 0.65, height: 2.3, rotation: Math.PI / 2, materialId: 'fm-matte-cream', variant: 'option2' },

      // 안방
      { id: 'obj-bed', name: '안방 퀸 침대', kind: 'bed_queen', x: 9.2, y: 7.4, elevation: 0, width: 1.85, depth: 2.1, height: 0.55, rotation: Math.PI, materialId: 'wl-warm-beige' },
    ],
  };
}

export function createBlankCanvasPlan(): ProjectData {
  return {
    id: `blank-${Date.now()}`,
    title: '새 빈 도면 프로젝트',
    areaSqm: 84,
    width: 12.0,
    depth: 9.6,
    rooms: [
      {
        id: 'rm-main',
        name: '거실 / 메인 공간',
        kind: 'living',
        polygon: [
          { x: 1.0, y: 1.0 },
          { x: 11.0, y: 1.0 },
          { x: 11.0, y: 8.6 },
          { x: 1.0, y: 8.6 },
        ],
        floorMaterialId: 'fl-cream-porcelain',
        ceilingType: 'well_cove',
        ceilingMaterialId: 'cl-matte-white',
        coveLightOn: true,
        coveKelvin: '3000K',
      },
    ],
    walls: [
      { id: 'w-1', x1: 1.0, y1: 1.0, x2: 11.0, y2: 1.0, thickness: 0.2, height: 2.45, isExterior: true, frontMaterialId: 'wl-diamang-stucco', backMaterialId: 'wl-diamang-stucco' },
      { id: 'w-2', x1: 11.0, y1: 1.0, x2: 11.0, y2: 8.6, thickness: 0.2, height: 2.45, isExterior: true, frontMaterialId: 'wl-diamang-stucco', backMaterialId: 'wl-diamang-stucco' },
      { id: 'w-3', x1: 11.0, y1: 8.6, x2: 1.0, y2: 8.6, thickness: 0.2, height: 2.45, isExterior: true, frontMaterialId: 'wl-diamang-stucco', backMaterialId: 'wl-diamang-stucco' },
      { id: 'w-4', x1: 1.0, y1: 8.6, x2: 1.0, y2: 1.0, thickness: 0.2, height: 2.45, isExterior: true, frontMaterialId: 'wl-diamang-stucco', backMaterialId: 'wl-diamang-stucco' },
    ],
    openings: [
      { id: 'op-1', wallId: 'w-3', kind: 'window_blind', offset: 0.5, width: 3.6, height: 2.0, sillHeight: 0.2, frameMaterialId: 'fm-walnut-wood', hasBlind: true },
    ],
    objects: [],
  };
}
