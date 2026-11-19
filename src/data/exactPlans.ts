import { FloorPlanTemplate } from '../types/interior';

const wpDefault = 'wp-lx-diamang-white';
const wpWarm = 'wp-lx-besti-linen';
const flLiving = 'fl-dongwha-sahara-wide';
const flRoom = 'fl-kujung-natural-oak';
const flTile = 'fl-porcelain-concrete';
const fmWhite = 'fm-hyundai-milkwhite';
const fmCharcoal = 'fm-hyundai-charcoal';

// 1. 올림픽파크 포레온 84㎡A (실제 분양 평면도 기준: 좌측 안방·드레스룸·침실, 중앙 주방·거실·알파룸, 우측 현관·공용욕실·침실2·침실3)
export function createOlympicForeon84A(isExtended = true): FloorPlanTemplate {
  const W = 13.8;
  const D = 10.2;
  const H = 2.4;
  return {
    id: 'olympic-foreon-84a',
    complexId: 'olympic-foreon',
    complexName: '올림픽파크 포레온 (둔촌주공)',
    district: '강동구 둔촌동',
    region: 'seoul',
    typeName: '84㎡A (34평 · 4Bay 판상형)',
    areaSqm: 84.9,
    pyeong: 34,
    bayInfo: '공식 평면도 실측 구조 · 방3+알파룸+욕실2',
    isExtended,
    description: '올림픽파크 포레온 84㎡A 공식 평면도 기반: 좌측 안방·부부욕실·드레스룸·후면침실, 중앙 거실·ㄷ자 주방·다용도실·알파룸, 우측 현관·공용욕실·침실2·침실3.',
    width: W,
    depth: D,
    rooms: [
      { id: 'of-back-room', name: '침실4 (서재)', type: 'bedroom', polygon: [{ x: 0, y: 0 }, { x: 2.3, y: 0 }, { x: 2.3, y: 2.1 }, { x: 1.8, y: 2.1 }, { x: 1.8, y: 3.1 }, { x: 0, y: 3.1 }], floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false },
      { id: 'of-util', name: '다용도실', type: 'utility', polygon: [{ x: 2.3, y: 0 }, { x: 4.1, y: 0 }, { x: 4.1, y: 2.1 }, { x: 2.3, y: 2.1 }], floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false },
      { id: 'of-bath2', name: '부부욕실', type: 'bath', polygon: [{ x: 1.8, y: 2.1 }, { x: 3.7, y: 2.1 }, { x: 3.7, y: 4.6 }, { x: 1.8, y: 4.6 }], floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '3000K', indirectLightOn: false },
      { id: 'of-dress', name: '드레스룸', type: 'dress', polygon: [{ x: 0, y: 3.1 }, { x: 1.8, y: 3.1 }, { x: 1.8, y: 5.0 }, { x: 0, y: 5.0 }], floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '3000K', indirectLightOn: false },
      { id: 'of-master', name: '침실1 (안방)', type: 'master', polygon: [{ x: 0, y: 5.0 }, { x: 3.7, y: 5.0 }, { x: 3.7, y: 8.6 }, { x: 0, y: 8.6 }], floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-warm-ivory', indirectLightColor: '3000K', indirectLightOn: true },
      { id: 'of-bal-m', name: '발코니', type: 'balcony', polygon: [{ x: 0, y: 8.6 }, { x: 3.7, y: 8.6 }, { x: 3.7, y: D }, { x: 0, y: D }], floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false },
      { id: 'of-kitchen', name: '주방 / 다이닝', type: 'kitchen', polygon: [{ x: 4.1, y: 0 }, { x: 7.4, y: 0 }, { x: 7.4, y: 4.6 }, { x: 4.1, y: 4.6 }], floorMaterialId: flLiving, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: true },
      { id: 'of-alpha', name: '알파룸', type: 'alpha', polygon: [{ x: 7.4, y: 0 }, { x: 9.6, y: 0 }, { x: 9.6, y: 5.8 }, { x: 7.4, y: 5.8 }], floorMaterialId: flLiving, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false },
      { id: 'of-living', name: '거실', type: 'living', polygon: [{ x: 3.7, y: 4.6 }, { x: 7.4, y: 4.6 }, { x: 7.4, y: 5.8 }, { x: 7.8, y: 5.8 }, { x: 7.8, y: D }, { x: 3.7, y: D }], floorMaterialId: flLiving, floorDirection: 'horizontal', ceilingType: 'well_rect', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: true },
      { id: 'of-ent', name: '현관', type: 'entrance', polygon: [{ x: 9.6, y: 3.0 }, { x: 11.8, y: 3.0 }, { x: 11.8, y: 5.0 }, { x: 9.6, y: 5.0 }], floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: true },
      { id: 'of-bath1', name: '공용욕실', type: 'bath', polygon: [{ x: 11.8, y: 3.6 }, { x: W, y: 3.6 }, { x: W, y: 5.8 }, { x: 11.8, y: 5.8 }], floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '3000K', indirectLightOn: false },
      { id: 'of-bed2', name: '침실2', type: 'bedroom', polygon: [{ x: 7.8, y: 5.8 }, { x: 10.8, y: 5.8 }, { x: 10.8, y: D }, { x: 7.8, y: D }], floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false },
      { id: 'of-bed3', name: '침실3', type: 'bedroom', polygon: [{ x: 10.8, y: 5.8 }, { x: W, y: 5.8 }, { x: W, y: D }, { x: 10.8, y: D }], floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false },
    ],
    walls: [
      { id: 'of-w-n1', x1: 0, y1: 0, x2: 9.6, y2: 0, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'of-op-wn1', type: 'window', offset: 0.12, width: 1.4, height: 1.4, sillHeight: 0.7, frameMaterialId: fmWhite }, { id: 'of-op-wk', type: 'window', offset: 0.58, width: 1.5, height: 1.1, sillHeight: 1.0, frameMaterialId: fmWhite }] },
      { id: 'of-w-w', x1: 0, y1: 0, x2: 0, y2: D, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [] },
      { id: 'of-w-s', x1: 0, y1: D, x2: W, y2: D, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'of-op-wbm', type: 'window', offset: 0.14, width: 2.0, height: 1.4, sillHeight: 0.7, frameMaterialId: fmWhite }, { id: 'of-op-wl', type: 'window', offset: 0.42, width: 3.0, height: 2.1, sillHeight: 0.15, frameMaterialId: fmCharcoal }, { id: 'of-op-wb2', type: 'window', offset: 0.68, width: 1.5, height: 1.4, sillHeight: 0.7, frameMaterialId: fmWhite }, { id: 'of-op-wb3', type: 'window', offset: 0.88, width: 1.5, height: 1.4, sillHeight: 0.7, frameMaterialId: fmWhite }] },
      { id: 'of-w-e1', x1: 9.6, y1: 0, x2: 9.6, y2: 5.0, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'of-w-ent-n', x1: 9.6, y1: 3.0, x2: 11.8, y2: 3.0, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'of-op-ent', type: 'entrance', offset: 0.5, width: 1.05, height: 2.1, sillHeight: 0, frameMaterialId: fmCharcoal, swing: 'out_left' }] },
      { id: 'of-w-ent-e', x1: 11.8, y1: 3.0, x2: 11.8, y2: 5.8, thickness: 0.16, height: H, isLoadBearing: true, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'of-op-db1', type: 'door', offset: 0.88, width: 0.8, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'out_left' }] },
      { id: 'of-w-ent-s', x1: 9.6, y1: 5.0, x2: 11.8, y2: 5.0, thickness: 0.12, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'of-op-jm', type: 'sliding_door', offset: 0.5, width: 1.2, height: 2.1, sillHeight: 0, frameMaterialId: fmCharcoal }] },
      { id: 'of-w-b1-n', x1: 11.8, y1: 3.6, x2: W, y2: 3.6, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'of-w-e2', x1: W, y1: 3.6, x2: W, y2: D, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      // 좌측 침실4, 다용도실, 부부욕실, 드레스룸, 안방 완전 구획
      { id: 'of-w-b4-e', x1: 2.3, y1: 0, x2: 2.3, y2: 2.1, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'of-w-u-e', x1: 4.1, y1: 0, x2: 4.1, y2: 2.1, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'of-op-du', type: 'door', offset: 0.55, width: 0.8, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'in_left' }] },
      { id: 'of-w-u-s', x1: 1.8, y1: 2.1, x2: 4.1, y2: 2.1, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'of-w-b4-s', x1: 0, y1: 3.1, x2: 1.8, y2: 3.1, thickness: 0.12, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'of-op-db4', type: 'door', offset: 0.5, width: 0.8, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'out_left' }] },
      { id: 'of-w-dr-b2', x1: 1.8, y1: 2.1, x2: 1.8, y2: 5.0, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [{ id: 'of-op-db2m', type: 'door', offset: 0.82, width: 0.78, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'out_left' }] },
      { id: 'of-w-b2-s', x1: 1.8, y1: 4.6, x2: 3.7, y2: 4.6, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [] },
      { id: 'of-w-m-n', x1: 0, y1: 5.0, x2: 1.8, y2: 5.0, thickness: 0.12, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [{ id: 'of-op-ddr', type: 'sliding_door', offset: 0.5, width: 1.0, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'of-w-m-bal', x1: 0, y1: 8.6, x2: 3.7, y2: 8.6, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [{ id: 'of-op-bm', type: 'sliding_door', offset: 0.5, width: 2.2, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'of-w-m-e', x1: 3.7, y1: 2.1, x2: 3.7, y2: D, thickness: 0.18, height: H, isLoadBearing: true, demolished: false, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [{ id: 'of-op-dm', type: 'door', offset: 0.44, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'in_right' }] },
      { id: 'of-w-k-a', x1: 7.4, y1: 0, x2: 7.4, y2: 5.8, thickness: 0.12, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'of-w-b23-n', x1: 7.8, y1: 5.8, x2: W, y2: 5.8, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'of-op-db2', type: 'door', offset: 0.18, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'in_left' }, { id: 'of-op-db3', type: 'door', offset: 0.68, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'in_left' }] },
      { id: 'of-w-b23-m', x1: 10.8, y1: 5.8, x2: 10.8, y2: D, thickness: 0.12, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
    ],
    lights: [
      { id: 'of-lt-1', roomId: 'of-living', type: 'ceiling_fan', x: 5.8, y: 7.2, kelvin: '4000K', on: true },
      { id: 'of-lt-2', roomId: 'of-kitchen', type: 'pendant', x: 5.8, y: 3.2, kelvin: '3000K', on: true },
      { id: 'of-lt-3', roomId: 'of-master', type: 'downlight_3', x: 1.8, y: 6.8, kelvin: '3000K', on: true },
    ],
    furniture: [
      { id: 'of-fn-sofa', name: '거실 소파', category: 'sofa', x: 7.2, y: 7.5, width: 0.9, depth: 2.5, height: 0.78, rotation: 0, color: '#D9D4CC' },
      // ㄷ자 주방 열 맞춤 (x=4.1..7.4)
      { id: 'of-fn-kit-top', name: '주방 쿡탑/싱크', category: 'kitchen_counter', x: 5.75, y: 0.33, width: 3.3, depth: 0.65, height: 0.88, rotation: 0, color: '#F2F0EB' },
      { id: 'of-fn-kit-r', name: '주방 조리대', category: 'kitchen_counter', x: 7.07, y: 1.55, width: 0.65, depth: 1.80, height: 0.88, rotation: 0, color: '#F2F0EB' },
      { id: 'of-fn-kit-pen', name: '아일랜드', category: 'island', x: 6.35, y: 2.13, width: 2.05, depth: 0.65, height: 0.88, rotation: 0, color: '#E5E1D8' },
      { id: 'of-fn-induct', name: '3구 인덕션', category: 'induction', x: 6.35, y: 2.13, width: 0.60, depth: 0.52, height: 0.03, rotation: 0, color: '#181A1E', materialId: 'ap-induction-black' },
      { id: 'of-fn-fridge', name: '키친핏 냉장고장', category: 'fridge_cabinet', x: 4.48, y: 1.45, width: 1.35, depth: 0.68, height: 2.25, rotation: Math.PI / 2, color: '#F5F3EE', materialId: 'ap-bespoke-white' },
      { id: 'of-fn-tallcab', name: '홈바 · 키큰장 (1번/2번 옵션)', category: 'tall_cabinet', x: 4.48, y: 3.05, width: 1.50, depth: 0.65, height: 2.25, rotation: Math.PI / 2, color: '#F3EFEA', variant: 'option2' },
      { id: 'of-fn-dining', name: '식탁', category: 'dining', x: 5.8, y: 3.2, width: 1.5, depth: 0.85, height: 0.75, rotation: 0, color: '#8C6849' },
      // 공용욕실 (욕조 + 세면대 + 양변기)
      { id: 'of-fn-tub1', name: '욕조', category: 'bathtub', x: 12.8, y: 4.02, width: 1.85, depth: 0.76, height: 0.55, rotation: 0, color: '#FFFFFF' },
      { id: 'of-fn-vanity1', name: '세면대', category: 'vanity', x: 13.45, y: 4.78, width: 0.56, depth: 0.44, height: 0.82, rotation: Math.PI / 2, color: '#FFFFFF' },
      { id: 'of-fn-toilet1', name: '양변기', category: 'toilet', x: 13.40, y: 5.42, width: 0.44, depth: 0.64, height: 0.72, rotation: Math.PI / 2, color: '#FFFFFF' },
      // 부부욕실 (샤워부스 + 세면대 + 양변기)
      { id: 'of-fn-shower2', name: '샤워부스', category: 'shower', x: 2.28, y: 2.60, width: 0.86, depth: 0.90, height: 2.0, rotation: 0, color: '#BAE6FD' },
      { id: 'of-fn-vanity2', name: '세면대', category: 'vanity', x: 3.35, y: 3.35, width: 0.56, depth: 0.44, height: 0.82, rotation: Math.PI / 2, color: '#FFFFFF' },
      { id: 'of-fn-toilet2', name: '양변기', category: 'toilet', x: 3.30, y: 4.10, width: 0.44, depth: 0.64, height: 0.72, rotation: Math.PI / 2, color: '#FFFFFF' },
      { id: 'of-fn-bedm', name: '안방 침대', category: 'bed', x: 1.5, y: 6.8, width: 1.9, depth: 2.1, height: 0.55, rotation: 0, color: '#C8BFAF' },
    ],
    fixtures: [
      { id: 'of-fx-tv', wallId: 'of-w-m-e', type: 'wall_tv', offset: 0.55, elevation: 1.35, side: 'front', materialId: 'el-legrand-white' },
      { id: 'of-fx-out1', wallId: 'of-w-m-e', type: 'outlet_2', offset: 0.52, elevation: 0.42, side: 'front', materialId: 'el-legrand-white' },
      { id: 'of-fx-out2', wallId: 'of-w-m-e', type: 'outlet_2', offset: 0.58, elevation: 0.42, side: 'front', materialId: 'el-legrand-white' },
      { id: 'of-fx-sw1', wallId: 'of-w-k-w', type: 'switch_2', offset: 0.75, elevation: 1.25, side: 'front', materialId: 'el-legrand-white' },
      { id: 'of-fx-pad', wallId: 'of-w-k-w', type: 'wallpad', offset: 0.85, elevation: 1.40, side: 'front', materialId: 'el-legrand-white' },
    ],
  };
}

// 2. 고덕 그라시움 84㎡A (네이버 부동산 공식 평면도 1:1 실측 — 모든 외벽·내벽·문·창문 완비)
export function createGodeokGracium84A(isExtended = true): FloorPlanTemplate {
  const W = 11.2;
  const D = 10.4;
  const H = 2.4;
  return {
    id: 'godeok-gracium-84a',
    complexId: 'godeok-gracium',
    complexName: '고덕 그라시움',
    district: '강동구 고덕동',
    region: 'seoul',
    typeName: '84㎡A (34평 · 타워형)',
    areaSqm: 84.2,
    pyeong: 34,
    bayInfo: '네이버부동산 실측 구조 · 방3+욕실2+드레스룸+발코니2',
    isExtended,
    description: '고덕 그라시움 84㎡A 네이버 부동산 평면도 1:1 실측: 상단 다용도실(발코니)·ㄷ자 주방, 좌측 부부욕실·침실3·드레스룸·안방·안방발코니, 중앙 거실·복도, 우측 현관·공용욕실·침실2.',
    width: W,
    depth: D,
    rooms: [
      { id: 'gg-util', name: '발코니(다용도실)', type: 'utility', polygon: [{ x: 3.8, y: 0 }, { x: 5.5, y: 0 }, { x: 5.5, y: 1.9 }, { x: 3.8, y: 1.9 }], floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false },
      { id: 'gg-kitchen', name: '주방 / 식당', type: 'kitchen', polygon: [{ x: 5.5, y: 0 }, { x: 7.6, y: 0 }, { x: 7.6, y: 4.4 }, { x: 5.5, y: 4.4 }], floorMaterialId: flLiving, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: true },
      { id: 'gg-bath2', name: '부부욕실', type: 'bath', polygon: [{ x: 0.6, y: 1.4 }, { x: 2.0, y: 1.4 }, { x: 2.0, y: 4.0 }, { x: 0.6, y: 4.0 }], floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '3000K', indirectLightOn: false },
      { id: 'gg-bed3', name: '침실3', type: 'bedroom', polygon: [{ x: 2.0, y: 1.4 }, { x: 3.8, y: 1.4 }, { x: 3.8, y: 4.4 }, { x: 2.4, y: 4.4 }, { x: 2.4, y: 4.0 }, { x: 2.0, y: 4.0 }], floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false },
      { id: 'gg-dress', name: '드레스룸', type: 'dress', polygon: [{ x: 0.6, y: 4.0 }, { x: 2.4, y: 4.0 }, { x: 2.4, y: 5.8 }, { x: 0.6, y: 5.8 }], floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '3000K', indirectLightOn: false },
      { id: 'gg-master', name: '침실1 (안방)', type: 'master', polygon: [{ x: 0, y: 5.8 }, { x: 3.8, y: 5.8 }, { x: 3.8, y: 9.0 }, { x: 0, y: 9.0 }], floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-warm-ivory', indirectLightColor: '3000K', indirectLightOn: true },
      { id: 'gg-bal-m', name: '발코니', type: 'balcony', polygon: [{ x: 1.8, y: 9.0 }, { x: 3.8, y: 9.0 }, { x: 3.8, y: D }, { x: 1.8, y: D }], floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false },
      { id: 'gg-living', name: '거실', type: 'living', polygon: [{ x: 3.8, y: 4.4 }, { x: 7.8, y: 4.4 }, { x: 7.8, y: 9.6 }, { x: 3.8, y: 9.6 }], floorMaterialId: flLiving, floorDirection: 'horizontal', ceilingType: 'well_rect', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: true },
      { id: 'gg-ent', name: '현관', type: 'entrance', polygon: [{ x: 7.6, y: 2.6 }, { x: 9.4, y: 2.6 }, { x: 9.4, y: 4.4 }, { x: 7.6, y: 4.4 }], floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: true },
      { id: 'gg-bath1', name: '공용욕실', type: 'bath', polygon: [{ x: 9.4, y: 3.2 }, { x: W, y: 3.2 }, { x: W, y: 5.8 }, { x: 9.4, y: 5.8 }], floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '3000K', indirectLightOn: false },
      { id: 'gg-bed2', name: '침실2', type: 'bedroom', polygon: [{ x: 7.8, y: 5.8 }, { x: W, y: 5.8 }, { x: W, y: 8.8 }, { x: 7.8, y: 8.8 }], floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false },
    ],
    walls: [
      // 상단 발코니(다용도실) & 주방 외벽
      { id: 'gg-w-top', x1: 3.8, y1: 0, x2: 7.6, y2: 0, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'gg-op-wk', type: 'window', offset: 0.72, width: 1.2, height: 1.0, sillHeight: 1.1, frameMaterialId: fmWhite }] },
      { id: 'gg-w-u-w', x1: 3.8, y1: 0, x2: 3.8, y2: 4.4, thickness: 0.18, height: H, isLoadBearing: true, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'gg-w-u-k', x1: 5.5, y1: 0, x2: 5.5, y2: 1.9, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'gg-op-du', type: 'door', offset: 0.55, width: 0.8, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'in_right' }] },
      { id: 'gg-w-u-s', x1: 3.8, y1: 1.9, x2: 5.5, y2: 1.9, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'gg-w-k-e', x1: 7.6, y1: 0, x2: 7.6, y2: 4.4, thickness: 0.20, height: H, isLoadBearing: true, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },

      // 침실3 & 부부욕실 & 드레스룸 외벽/내벽
      { id: 'gg-w-b3-n', x1: 0.6, y1: 1.4, x2: 3.8, y2: 1.4, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'gg-op-wb3', type: 'window', offset: 0.72, width: 1.4, height: 1.4, sillHeight: 0.7, frameMaterialId: fmWhite }] },
      { id: 'gg-w-b3-w', x1: 0.6, y1: 1.4, x2: 0.6, y2: 5.8, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'gg-w-b2-b3', x1: 2.0, y1: 1.4, x2: 2.0, y2: 4.0, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'gg-w-b2-dr', x1: 0.6, y1: 4.0, x2: 2.4, y2: 4.0, thickness: 0.12, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'gg-op-db2', type: 'door', offset: 0.5, width: 0.75, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'out_left' }] },
      { id: 'gg-w-b3-s', x1: 2.4, y1: 4.4, x2: 5.5, y2: 4.4, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'gg-op-db3', type: 'door', offset: 0.26, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'out_left' }] },
      { id: 'gg-w-dr-e', x1: 2.4, y1: 4.0, x2: 2.4, y2: 5.8, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [] },

      // 안방 & 안방 발코니
      { id: 'gg-w-m-n', x1: 0, y1: 5.8, x2: 3.8, y2: 5.8, thickness: 0.16, height: H, isLoadBearing: true, demolished: false, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [{ id: 'gg-op-dm', type: 'door', offset: 0.8, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'in_right' }] },
      { id: 'gg-w-m-w', x1: 0, y1: 5.8, x2: 0, y2: 9.0, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [] },
      { id: 'gg-w-m-e', x1: 3.8, y1: 5.8, x2: 3.8, y2: D, thickness: 0.18, height: H, isLoadBearing: true, demolished: false, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [] },
      { id: 'gg-w-m-bal', x1: 0, y1: 9.0, x2: 3.8, y2: 9.0, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [{ id: 'gg-op-bm', type: 'sliding_door', offset: 0.72, width: 1.8, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'gg-w-bal-s', x1: 1.8, y1: D, x2: 3.8, y2: D, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'gg-op-wbm', type: 'window', offset: 0.5, width: 1.4, height: 1.4, sillHeight: 0.7, frameMaterialId: fmWhite }] },
      { id: 'gg-w-bal-w', x1: 1.8, y1: 9.0, x2: 1.8, y2: D, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },

      // 거실 하단 통창
      { id: 'gg-w-liv-s', x1: 3.8, y1: 9.6, x2: 7.8, y2: 9.6, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'gg-op-wl', type: 'window', offset: 0.5, width: 3.0, height: 2.1, sillHeight: 0.15, frameMaterialId: fmCharcoal }] },

      // 우측 현관(중문 포함), 공용욕실, 침실2
      { id: 'gg-w-ent-n', x1: 7.6, y1: 2.6, x2: 9.4, y2: 2.6, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'gg-op-ent', type: 'entrance', offset: 0.5, width: 1.0, height: 2.1, sillHeight: 0, frameMaterialId: fmCharcoal, swing: 'out_left' }] },
      { id: 'gg-w-ent-s', x1: 7.6, y1: 4.4, x2: 9.4, y2: 4.4, thickness: 0.12, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'gg-op-jm', type: 'sliding_door', offset: 0.5, width: 1.2, height: 2.1, sillHeight: 0, frameMaterialId: fmCharcoal }] },
      { id: 'gg-w-ent-b1', x1: 9.4, y1: 2.6, x2: 9.4, y2: 5.8, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'gg-op-db1', type: 'door', offset: 0.85, width: 0.8, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'out_left' }] },
      { id: 'gg-w-b1-n', x1: 9.4, y1: 3.2, x2: W, y2: 3.2, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'gg-w-e', x1: W, y1: 3.2, x2: W, y2: 8.8, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'gg-w-b2-n', x1: 7.8, y1: 5.8, x2: W, y2: 5.8, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'gg-op-db2', type: 'door', offset: 0.22, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'in_left' }] },
      { id: 'gg-w-b2-w', x1: 7.8, y1: 5.8, x2: 7.8, y2: 9.6, thickness: 0.16, height: H, isLoadBearing: true, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'gg-w-b2-s', x1: 7.8, y1: 8.8, x2: W, y2: 8.8, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'gg-op-wb2', type: 'window', offset: 0.5, width: 1.6, height: 1.4, sillHeight: 0.7, frameMaterialId: fmWhite }] },
    ],
    lights: [
      { id: 'gg-lt-1', roomId: 'gg-living', type: 'ceiling_fan', x: 5.8, y: 7.0, kelvin: '4000K', on: true },
      { id: 'gg-lt-2', roomId: 'gg-kitchen', type: 'pendant', x: 6.5, y: 2.5, kelvin: '3000K', on: true },
      { id: 'gg-lt-3', roomId: 'gg-master', type: 'downlight_3', x: 1.9, y: 7.4, kelvin: '3000K', on: true },
    ],
    furniture: [
      { id: 'gg-fn-sofa', name: '거실 소파', category: 'sofa', x: 4.4, y: 7.0, width: 0.9, depth: 2.4, height: 0.78, rotation: 0, color: '#D9D4CC' },
      { id: 'gg-fn-kit-top', name: '주방 상부/싱크', category: 'kitchen_counter', x: 6.55, y: 0.33, width: 2.0, depth: 0.65, height: 0.88, rotation: 0, color: '#F2F0EB' },
      { id: 'gg-fn-kit-r', name: '주방 조리대', category: 'kitchen_counter', x: 7.25, y: 1.5, width: 0.65, depth: 1.8, height: 0.88, rotation: 0, color: '#F2F0EB' },
      // 공용욕실 (욕조 + 세면대 + 양변기)
      { id: 'gg-fn-tub1', name: '욕조', category: 'bathtub', x: 10.30, y: 3.60, width: 1.68, depth: 0.72, height: 0.55, rotation: 0, color: '#FFFFFF' },
      { id: 'gg-fn-vanity1', name: '세면대', category: 'vanity', x: 10.88, y: 4.45, width: 0.54, depth: 0.44, height: 0.82, rotation: Math.PI / 2, color: '#FFFFFF' },
      { id: 'gg-fn-toilet1', name: '양변기', category: 'toilet', x: 10.82, y: 5.18, width: 0.44, depth: 0.64, height: 0.72, rotation: Math.PI / 2, color: '#FFFFFF' },
      // 부부욕실 (샤워부스 + 세면대 + 양변기)
      { id: 'gg-fn-shower2', name: '샤워부스', category: 'shower', x: 1.52, y: 1.88, width: 0.84, depth: 0.88, height: 2.0, rotation: 0, color: '#BAE6FD' },
      { id: 'gg-fn-vanity2', name: '세면대', category: 'vanity', x: 0.90, y: 2.45, width: 0.52, depth: 0.42, height: 0.82, rotation: -Math.PI / 2, color: '#FFFFFF' },
      { id: 'gg-fn-toilet2', name: '양변기', category: 'toilet', x: 0.94, y: 3.15, width: 0.44, depth: 0.62, height: 0.72, rotation: -Math.PI / 2, color: '#FFFFFF' },
      { id: 'gg-fn-bedm', name: '안방 침대', category: 'bed', x: 1.5, y: 7.4, width: 1.9, depth: 2.1, height: 0.55, rotation: 0, color: '#C8BFAF' },
    ],
  };
}

// 3. 고덕 아르테온 84㎡A (실제 분양 평면도 기준: 상단 주방·다용도실, 좌측 침실2·욕실·드레스룸·안방·발코니, 중앙 거실, 우측 현관·공용욕실·침실3)
export function createGodeokArteon84A(isExtended = true): FloorPlanTemplate {
  const W = 11.8;
  const D = 10.6;
  const H = 2.4;
  return {
    id: 'godeok-arteon-84a',
    complexId: 'godeok-arteon',
    complexName: '고덕 아르테온',
    district: '강동구 상일동',
    region: 'seoul',
    typeName: '84㎡A (34평 · 타워형 LDK)',
    areaSqm: 84.9,
    pyeong: 34,
    bayInfo: '공식 평면도 실측 구조 · 방3+드레스룸+욕실2',
    isExtended,
    description: '고덕 아르테온 84㎡A 공식 평면도 기반: 상단 ㄷ자 주방·다용도실, 좌측 침실2·부부욕실·드레스룸·안방·발코니, 중앙 거실, 우측 현관·공용욕실·침실3.',
    width: W,
    depth: D,
    rooms: [
      { id: 'ga-kitchen', name: '주방 / 식당', type: 'kitchen', polygon: [{ x: 4.4, y: 0 }, { x: 5.8, y: 0 }, { x: 5.8, y: 1.8 }, { x: 7.4, y: 1.8 }, { x: 7.4, y: 4.2 }, { x: 4.4, y: 4.2 }], floorMaterialId: flLiving, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: true },
      { id: 'ga-util', name: '다용도실', type: 'utility', polygon: [{ x: 5.8, y: 0 }, { x: 7.4, y: 0 }, { x: 7.4, y: 1.8 }, { x: 5.8, y: 1.8 }], floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false },
      { id: 'ga-bed2', name: '침실2', type: 'bedroom', polygon: [{ x: 1.4, y: 1.2 }, { x: 4.4, y: 1.2 }, { x: 4.4, y: 4.2 }, { x: 1.8, y: 4.2 }, { x: 1.8, y: 2.4 }, { x: 1.4, y: 2.4 }], floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false },
      { id: 'ga-bath2', name: '부부욕실', type: 'bath', polygon: [{ x: 0, y: 2.4 }, { x: 1.8, y: 2.4 }, { x: 1.8, y: 4.4 }, { x: 0, y: 4.4 }], floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '3000K', indirectLightOn: false },
      { id: 'ga-dress', name: '드레스룸', type: 'dress', polygon: [{ x: 0, y: 4.4 }, { x: 2.0, y: 4.4 }, { x: 2.0, y: 6.0 }, { x: 0, y: 6.0 }], floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '3000K', indirectLightOn: false },
      { id: 'ga-master', name: '침실1 (안방)', type: 'master', polygon: [{ x: 0, y: 6.0 }, { x: 3.8, y: 6.0 }, { x: 3.8, y: 9.2 }, { x: 0, y: 9.2 }], floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-warm-ivory', indirectLightColor: '3000K', indirectLightOn: true },
      { id: 'ga-bal', name: '발코니', type: 'balcony', polygon: [{ x: 0, y: 9.2 }, { x: 3.8, y: 9.2 }, { x: 3.8, y: D }, { x: 0, y: D }], floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false },
      { id: 'ga-living', name: '거실', type: 'living', polygon: [{ x: 3.8, y: 4.2 }, { x: 7.4, y: 4.2 }, { x: 7.4, y: 4.4 }, { x: 7.8, y: 4.4 }, { x: 7.8, y: D }, { x: 3.8, y: D }], floorMaterialId: flLiving, floorDirection: 'horizontal', ceilingType: 'well_rect', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: true },
      { id: 'ga-ent', name: '현관', type: 'entrance', polygon: [{ x: 7.4, y: 2.4 }, { x: 9.4, y: 2.4 }, { x: 9.4, y: 4.4 }, { x: 7.4, y: 4.4 }], floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: true },
      { id: 'ga-bath1', name: '공용욕실', type: 'bath', polygon: [{ x: 9.4, y: 3.0 }, { x: W, y: 3.0 }, { x: W, y: 5.2 }, { x: 9.4, y: 5.2 }], floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '3000K', indirectLightOn: false },
      { id: 'ga-bed3', name: '침실3', type: 'bedroom', polygon: [{ x: 7.8, y: 5.2 }, { x: W, y: 5.2 }, { x: W, y: 9.2 }, { x: 7.8, y: 9.2 }], floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false },
    ],
    walls: [
      { id: 'ga-w-top', x1: 4.4, y1: 0, x2: 7.4, y2: 0, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'ga-op-wk', type: 'window', offset: 0.35, width: 1.2, height: 1.0, sillHeight: 1.1, frameMaterialId: fmWhite }] },
      { id: 'ga-w-k-w', x1: 4.4, y1: 0, x2: 4.4, y2: 4.2, thickness: 0.16, height: H, isLoadBearing: true, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'ga-w-k-e', x1: 7.4, y1: 0, x2: 7.4, y2: 2.4, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'ga-w-u-s', x1: 5.8, y1: 1.8, x2: 7.4, y2: 1.8, thickness: 0.12, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'ga-op-du', type: 'door', offset: 0.4, width: 0.8, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'out_left' }] },
      { id: 'ga-w-u-w', x1: 5.8, y1: 0, x2: 5.8, y2: 1.8, thickness: 0.12, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'ga-w-b2-n', x1: 1.4, y1: 1.2, x2: 4.4, y2: 1.2, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'ga-op-wb2', type: 'window', offset: 0.5, width: 1.5, height: 1.4, sillHeight: 0.7, frameMaterialId: fmWhite }] },
      { id: 'ga-w-b2-w', x1: 1.4, y1: 1.2, x2: 1.4, y2: 2.4, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'ga-w-b2-s', x1: 1.8, y1: 4.2, x2: 4.4, y2: 4.2, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'ga-op-db2', type: 'door', offset: 0.65, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'ga-w-b2-n2', x1: 0, y1: 2.4, x2: 1.8, y2: 2.4, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'ga-w-b2-dr', x1: 0, y1: 4.4, x2: 1.8, y2: 4.4, thickness: 0.12, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'ga-op-db2r', type: 'door', offset: 0.6, width: 0.75, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'ga-w-dr-e', x1: 1.8, y1: 2.4, x2: 1.8, y2: 4.4, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'ga-w-dr-e2', x1: 2.0, y1: 4.4, x2: 2.0, y2: 6.0, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [] },
      { id: 'ga-w-m-n', x1: 0, y1: 6.0, x2: 3.8, y2: 6.0, thickness: 0.16, height: H, isLoadBearing: true, demolished: false, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [{ id: 'ga-op-dm2', type: 'door', offset: 0.82, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'in_right' }] },
      { id: 'ga-w-west', x1: 0, y1: 2.4, x2: 0, y2: D, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [] },
      { id: 'ga-w-s1', x1: 0, y1: D, x2: 7.8, y2: D, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'ga-op-wl', type: 'window', offset: 0.72, width: 3.0, height: 2.1, sillHeight: 0.15, frameMaterialId: fmCharcoal }] },
      { id: 'ga-w-s2', x1: 7.8, y1: 9.2, x2: W, y2: 9.2, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'ga-op-wb3', type: 'window', offset: 0.5, width: 1.6, height: 1.4, sillHeight: 0.7, frameMaterialId: fmWhite }] },
      { id: 'ga-w-ent', x1: 7.4, y1: 2.4, x2: 9.4, y2: 2.4, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'ga-op-ent', type: 'entrance', offset: 0.5, width: 1.0, height: 2.1, sillHeight: 0, frameMaterialId: fmCharcoal, swing: 'out_left' }] },
      { id: 'ga-w-ent-s', x1: 7.4, y1: 4.4, x2: 9.4, y2: 4.4, thickness: 0.12, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'ga-op-jm', type: 'sliding_door', offset: 0.5, width: 1.2, height: 2.1, sillHeight: 0, frameMaterialId: fmCharcoal }] },
      { id: 'ga-w-ent-b1', x1: 9.4, y1: 2.4, x2: 9.4, y2: 5.2, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'ga-op-db1', type: 'door', offset: 0.75, width: 0.8, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'ga-w-b1-n', x1: 9.4, y1: 3.0, x2: W, y2: 3.0, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'ga-w-b3-n', x1: 7.8, y1: 5.2, x2: W, y2: 5.2, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'ga-w-e', x1: W, y1: 3.0, x2: W, y2: 9.2, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'ga-w-m-bal', x1: 0, y1: 9.2, x2: 3.8, y2: 9.2, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [{ id: 'ga-op-bm', type: 'sliding_door', offset: 0.5, width: 2.0, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'ga-w-m-e', x1: 3.8, y1: 6.0, x2: 3.8, y2: D, thickness: 0.18, height: H, isLoadBearing: true, demolished: false, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [{ id: 'ga-op-dm', type: 'door', offset: 0.2, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'in_right' }] },
      { id: 'ga-w-b3-w', x1: 7.8, y1: 5.2, x2: 7.8, y2: D, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'ga-op-db3', type: 'door', offset: 0.18, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'out_left' }] },
    ],
    lights: [
      { id: 'ga-lt-1', roomId: 'ga-living', type: 'ceiling_fan', x: 5.8, y: 7.2, kelvin: '4000K', on: true },
      { id: 'ga-lt-2', roomId: 'ga-kitchen', type: 'pendant', x: 5.8, y: 2.8, kelvin: '3000K', on: true },
      { id: 'ga-lt-3', roomId: 'ga-master', type: 'downlight_3', x: 1.8, y: 7.6, kelvin: '3000K', on: true },
    ],
    furniture: [
      { id: 'ga-fn-sofa', name: '거실 소파', category: 'sofa', x: 4.4, y: 7.2, width: 0.9, depth: 2.5, height: 0.78, rotation: 0, color: '#D9D4CC' },
      { id: 'ga-fn-kit-top', name: '주방 상부/싱크', category: 'kitchen_counter', x: 5.1, y: 0.33, width: 1.3, depth: 0.65, height: 0.88, rotation: 0, color: '#F2F0EB' },
      { id: 'ga-fn-kit-l', name: '주방 조리대', category: 'kitchen_counter', x: 4.75, y: 1.5, width: 0.65, depth: 1.7, height: 0.88, rotation: 0, color: '#F2F0EB' },
      // 공용욕실 (욕조 + 세면대 + 양변기)
      { id: 'ga-fn-tub1', name: '욕조', category: 'bathtub', x: 10.45, y: 3.40, width: 1.68, depth: 0.72, height: 0.55, rotation: 0, color: '#FFFFFF' },
      { id: 'ga-fn-vanity1', name: '세면대', category: 'vanity', x: 11.35, y: 4.15, width: 0.56, depth: 0.44, height: 0.82, rotation: Math.PI / 2, color: '#FFFFFF' },
      { id: 'ga-fn-toilet1', name: '양변기', category: 'toilet', x: 11.35, y: 4.80, width: 0.44, depth: 0.64, height: 0.72, rotation: Math.PI / 2, color: '#FFFFFF' },
      // 부부욕실 (샤워부스 + 세면대 + 양변기)
      { id: 'ga-fn-shower2', name: '샤워부스', category: 'shower', x: 0.48, y: 2.88, width: 0.85, depth: 0.85, height: 2.0, rotation: 0, color: '#BAE6FD' },
      { id: 'ga-fn-vanity2', name: '세면대', category: 'vanity', x: 0.36, y: 3.65, width: 0.52, depth: 0.42, height: 0.82, rotation: -Math.PI / 2, color: '#FFFFFF' },
      { id: 'ga-fn-toilet2', name: '양변기', category: 'toilet', x: 1.42, y: 3.00, width: 0.44, depth: 0.62, height: 0.72, rotation: Math.PI / 2, color: '#FFFFFF' },
      { id: 'ga-fn-bedm', name: '안방 침대', category: 'bed', x: 1.5, y: 7.6, width: 1.9, depth: 2.1, height: 0.55, rotation: 0, color: '#C8BFAF' },
    ],
  };
}

// 4. 고덕 그라시움 84㎡B (35B평 · 공식 평면도 정밀 실측: 상단 현관·공용욕실·침실2+발코니, 좌측 ㄷ자 주방+다용도실, 우측 거실, 하단 침실3·부부욕실·드레스룸·안방+발코니)
export function createGodeokGracium84B(isExtended = true): FloorPlanTemplate {
  const W = 11.6;
  const D = 10.4;
  const H = 2.4;
  return {
    id: 'godeok-gracium-84b',
    complexId: 'godeok-gracium',
    complexName: '고덕 그라시움',
    district: '강동구 고덕동',
    region: 'seoul',
    typeName: '84㎡B (35평 · 타워형 LDK)',
    areaSqm: 84.3,
    pyeong: 35,
    bayInfo: '공식 평면도 정밀 실측 · 방3+욕실2+드레스룸+발코니2',
    isExtended,
    description: '고덕 그라시움 84㎡B (115B/35B) 공식 평면도: 상단 현관(좌측문)·침실2·침실2발코니·공용욕실, 좌측 ㄷ자 주방·돌출 다용도실, 중앙 복도·광폭 거실, 하단 침실3·부부욕실·드레스룸·안방·안방발코니.',
    width: W,
    depth: D,
    rooms: [
      { id: 'ggb-ent', name: '현관', type: 'entrance', polygon: [{ x: 5.0, y: 0 }, { x: 6.6, y: 0 }, { x: 6.6, y: 1.9 }, { x: 5.0, y: 1.9 }], floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: true },
      { id: 'ggb-bed2', name: '침실2', type: 'bedroom', polygon: [{ x: 6.6, y: 0 }, { x: 9.6, y: 0 }, { x: 9.6, y: 2.9 }, { x: 6.6, y: 2.9 }], floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false },
      { id: 'ggb-bal2', name: '발코니', type: 'balcony', polygon: [{ x: 9.6, y: 0.9 }, { x: 11.0, y: 0.9 }, { x: 11.0, y: 2.9 }, { x: 9.6, y: 2.9 }], floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false },
      { id: 'ggb-bath1', name: '공용욕실', type: 'bath', polygon: [{ x: 3.1, y: 1.7 }, { x: 5.0, y: 1.7 }, { x: 5.0, y: 3.4 }, { x: 3.1, y: 3.4 }], floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '3000K', indirectLightOn: false },
      { id: 'ggb-kitchen', name: '주방 / 식당', type: 'kitchen', polygon: [{ x: 0.6, y: 3.4 }, { x: 5.0, y: 3.4 }, { x: 5.0, y: 6.0 }, { x: 2.0, y: 6.0 }, { x: 2.0, y: 5.0 }, { x: 0.6, y: 5.0 }], floorMaterialId: flLiving, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: true },
      { id: 'ggb-util', name: '다용도실', type: 'utility', polygon: [{ x: 0, y: 5.0 }, { x: 2.0, y: 5.0 }, { x: 2.0, y: 6.8 }, { x: 0, y: 6.8 }], floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false },
      { id: 'ggb-corridor', name: '복도', type: 'alpha', polygon: [{ x: 5.0, y: 1.9 }, { x: 6.6, y: 1.9 }, { x: 6.6, y: 7.4 }, { x: 5.0, y: 7.4 }], floorMaterialId: flLiving, floorDirection: 'vertical', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: true },
      { id: 'ggb-living', name: '거실', type: 'living', polygon: [{ x: 6.6, y: 2.9 }, { x: 10.6, y: 2.9 }, { x: 10.6, y: 6.8 }, { x: 6.6, y: 6.8 }], floorMaterialId: flLiving, floorDirection: 'vertical', ceilingType: 'well_rect', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: true },
      { id: 'ggb-bed3', name: '침실3', type: 'bedroom', polygon: [{ x: 2.0, y: 6.0 }, { x: 5.0, y: 6.0 }, { x: 5.0, y: 8.2 }, { x: 4.5, y: 8.2 }, { x: 4.5, y: 8.8 }, { x: 2.0, y: 8.8 }], floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false },
      { id: 'ggb-bath2', name: '부부욕실', type: 'bath', polygon: [{ x: 2.4, y: 8.8 }, { x: 4.5, y: 8.8 }, { x: 4.5, y: D }, { x: 2.4, y: D }], floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '3000K', indirectLightOn: false },
      { id: 'ggb-dress', name: '드레스룸', type: 'dress', polygon: [{ x: 4.5, y: 8.2 }, { x: 6.8, y: 8.2 }, { x: 6.8, y: D }, { x: 4.5, y: D }], floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '3000K', indirectLightOn: false },
      { id: 'ggb-master', name: '침실1 (안방)', type: 'master', polygon: [{ x: 6.8, y: 6.8 }, { x: 10.0, y: 6.8 }, { x: 10.0, y: D }, { x: 6.8, y: D }], floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-warm-ivory', indirectLightColor: '3000K', indirectLightOn: true },
      { id: 'ggb-bal-m', name: '안방 발코니', type: 'balcony', polygon: [{ x: 10.0, y: 6.8 }, { x: W, y: 6.8 }, { x: W, y: D }, { x: 10.0, y: D }], floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false },
    ],
    walls: [
      // 상단 현관 & 침실2
      { id: 'ggb-w-top1', x1: 5.0, y1: 0, x2: 9.6, y2: 0, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'ggb-w-ent-w', x1: 5.0, y1: 0, x2: 5.0, y2: 1.9, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'ggb-op-ent', type: 'entrance', offset: 0.6, width: 1.0, height: 2.1, sillHeight: 0, frameMaterialId: fmCharcoal, swing: 'in_right' }] },
      { id: 'ggb-w-ent-e', x1: 6.6, y1: 0, x2: 6.6, y2: 2.9, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'ggb-op-db2', type: 'door', offset: 0.78, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'out_left' }] },
      { id: 'ggb-w-b2-bal', x1: 9.6, y1: 0.9, x2: 9.6, y2: 2.9, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'ggb-op-wb2', type: 'sliding_door', offset: 0.5, width: 1.5, height: 2.0, sillHeight: 0.1, frameMaterialId: fmWhite }] },
      { id: 'ggb-w-bal2-e', x1: 11.0, y1: 0.9, x2: 11.0, y2: 2.9, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      // 공용욕실 & 주방 & 다용도실
      { id: 'ggb-w-b1-n', x1: 3.1, y1: 1.7, x2: 5.0, y2: 1.7, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'ggb-w-b1-e', x1: 5.0, y1: 1.7, x2: 5.0, y2: 3.4, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'ggb-op-db1', type: 'door', offset: 0.72, width: 0.8, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'in_right' }] },
      { id: 'ggb-w-k-n', x1: 0.6, y1: 3.4, x2: 5.0, y2: 3.4, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'ggb-w-k-w', x1: 0.6, y1: 3.4, x2: 0.6, y2: 5.0, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'ggb-w-u-n', x1: 0, y1: 5.0, x2: 2.0, y2: 5.0, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'ggb-w-u-e', x1: 2.0, y1: 5.0, x2: 2.0, y2: 6.0, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'ggb-op-du', type: 'door', offset: 0.5, width: 0.78, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'in_left' }] },
      { id: 'ggb-w-u-w', x1: 0, y1: 5.0, x2: 0, y2: 6.8, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'ggb-op-wu', type: 'window', offset: 0.5, width: 1.1, height: 1.1, sillHeight: 1.0, frameMaterialId: fmWhite }] },
      { id: 'ggb-w-u-s', x1: 0, y1: 6.8, x2: 2.0, y2: 6.8, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      // 거실 우측 외벽
      { id: 'ggb-w-b2-s', x1: 6.6, y1: 2.9, x2: 11.0, y2: 2.9, thickness: 0.16, height: H, isLoadBearing: true, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'ggb-w-liv-e', x1: 10.6, y1: 2.9, x2: 10.6, y2: 6.8, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'ggb-op-wl', type: 'window', offset: 0.5, width: 3.1, height: 2.1, sillHeight: 0.15, frameMaterialId: fmCharcoal }] },
      // 침실3, 부부욕실, 드레스룸, 안방, 안방발코니
      { id: 'ggb-w-b3-n', x1: 2.0, y1: 6.0, x2: 5.0, y2: 6.0, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'ggb-w-b3-w', x1: 2.0, y1: 6.0, x2: 2.0, y2: 9.0, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'ggb-op-wb3', type: 'window', offset: 0.5, width: 1.5, height: 1.4, sillHeight: 0.7, frameMaterialId: fmWhite }] },
      { id: 'ggb-w-b3-e', x1: 5.0, y1: 6.0, x2: 5.0, y2: 8.2, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'ggb-op-db3', type: 'door', offset: 0.28, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'in_left' }] },
      { id: 'ggb-w-b2-n', x1: 2.4, y1: 8.8, x2: 4.5, y2: 8.8, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'ggb-w-b2-w', x1: 2.4, y1: 8.8, x2: 2.4, y2: D, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'ggb-w-b2-dr', x1: 4.5, y1: 8.2, x2: 4.5, y2: D, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'ggb-op-db2', type: 'door', offset: 0.55, width: 0.75, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'in_left' }] },
      { id: 'ggb-w-dr-n', x1: 4.5, y1: 8.2, x2: 6.6, y2: 8.2, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'ggb-w-m-n', x1: 6.6, y1: 6.8, x2: W, y2: 6.8, thickness: 0.18, height: H, isLoadBearing: true, demolished: false, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [] },
      { id: 'ggb-w-m-w', x1: 6.6, y1: 6.8, x2: 6.6, y2: D, thickness: 0.16, height: H, isLoadBearing: true, demolished: false, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [{ id: 'ggb-op-dm', type: 'door', offset: 0.22, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'out_left' }, { id: 'ggb-op-ddr', type: 'door', offset: 0.75, width: 0.85, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'in_left' }] },
      { id: 'ggb-w-m-bal', x1: 10.0, y1: 6.8, x2: 10.0, y2: D, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [{ id: 'ggb-op-bm', type: 'sliding_door', offset: 0.45, width: 2.0, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'ggb-w-balm-e', x1: W, y1: 6.8, x2: W, y2: D, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'ggb-op-wbm', type: 'window', offset: 0.65, width: 1.4, height: 1.4, sillHeight: 0.7, frameMaterialId: fmWhite }] },
      { id: 'ggb-w-bot', x1: 2.4, y1: D, x2: W, y2: D, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [] },
    ],
    lights: [
      { id: 'ggb-lt-1', roomId: 'ggb-living', type: 'ceiling_fan', x: 8.6, y: 4.8, kelvin: '4000K', on: true },
      { id: 'ggb-lt-2', roomId: 'ggb-kitchen', type: 'pendant', x: 3.4, y: 4.6, kelvin: '3000K', on: true },
      { id: 'ggb-lt-3', roomId: 'ggb-master', type: 'downlight_3', x: 8.4, y: 8.6, kelvin: '3000K', on: true },
    ],
    furniture: [
      { id: 'ggb-fn-sofa', name: '거실 소파', category: 'sofa', x: 8.6, y: 6.2, width: 2.3, depth: 0.9, height: 0.78, rotation: 0, color: '#D9D4CC' },
      { id: 'ggb-fn-tv', name: '거실 TV장', category: 'tv_stand', x: 8.4, y: 3.3, width: 2.0, depth: 0.45, height: 0.5, rotation: 0, color: '#5A4A3F' },
      { id: 'ggb-fn-kit-top', name: '주방 상부/싱크', category: 'kitchen_counter', x: 2.4, y: 3.73, width: 3.4, depth: 0.65, height: 0.88, rotation: 0, color: '#F2F0EB' },
      { id: 'ggb-fn-kit-l', name: '주방 조리대', category: 'kitchen_counter', x: 0.95, y: 4.5, width: 0.65, depth: 1.4, height: 0.88, rotation: 0, color: '#F2F0EB' },
      // 공용욕실 (욕조 + 세면대 + 양변기)
      { id: 'ggb-fn-tub1', name: '욕조', category: 'bathtub', x: 3.48, y: 2.55, width: 0.72, depth: 1.62, height: 0.55, rotation: 0, color: '#FFFFFF' },
      { id: 'ggb-fn-vanity1', name: '세면대', category: 'vanity', x: 4.22, y: 2.02, width: 0.54, depth: 0.44, height: 0.82, rotation: 0, color: '#FFFFFF' },
      { id: 'ggb-fn-toilet1', name: '양변기', category: 'toilet', x: 4.70, y: 2.06, width: 0.44, depth: 0.62, height: 0.72, rotation: 0, color: '#FFFFFF' },
      // 부부욕실 (샤워부스 + 세면대 + 양변기)
      { id: 'ggb-fn-shower2', name: '샤워부스', category: 'shower', x: 2.88, y: 9.28, width: 0.85, depth: 0.85, height: 2.0, rotation: 0, color: '#BAE6FD' },
      { id: 'ggb-fn-vanity2', name: '세면대', category: 'vanity', x: 3.55, y: 10.05, width: 0.52, depth: 0.42, height: 0.82, rotation: Math.PI, color: '#FFFFFF' },
      { id: 'ggb-fn-toilet2', name: '양변기', category: 'toilet', x: 4.10, y: 10.00, width: 0.44, depth: 0.62, height: 0.72, rotation: Math.PI, color: '#FFFFFF' },
      { id: 'ggb-fn-bedm', name: '안방 침대', category: 'bed', x: 8.4, y: 9.0, width: 1.9, depth: 2.1, height: 0.55, rotation: 0, color: '#C8BFAF' },
    ],
  };
}

// 5. 올림픽파크 포레온 75A㎡ (23A평 · 네이버 부동산 1:1 실측: 1500/5510/1000/1420 × 3700/3000, 문 열림 방향·ㄷ자 주방·욕실 변기/세면대/샤워부스 완비)
export function createOlympicForeon23A(isExtended = true): FloorPlanTemplate {
  const W = 9.43;
  const D = 6.70;
  const H = 2.4;
  return {
    id: 'olympic-foreon-23a',
    complexId: 'olympic-foreon',
    complexName: '올림픽파크 포레온 (둔촌주공)',
    district: '강동구 둔촌동',
    region: 'seoul',
    typeName: '75A㎡ (23A평 · 방2/욕실1)',
    areaSqm: 49.9,
    pyeong: 23,
    bayInfo: '네이버부동산 실측 · 1500/5510/1000/1420',
    isExtended,
    description: '올림픽파크 포레온 75A㎡(23A평) 실측 도면: 좌측 거실 통창, 상단 ㄷ자형 주방 및 다용도실, 우측 현관, 하단 발코니·안방·공용욕실(변기/세면대/샤워부스)·침실2 및 정확한 문 열림 방향 반영.',
    width: W,
    depth: D,
    rooms: [
      { id: 'of23-living', name: '거실', type: 'living', polygon: [{ x: 0, y: 0 }, { x: 4.21, y: 0 }, { x: 4.21, y: 3.70 }, { x: 0, y: 3.70 }], floorMaterialId: flLiving, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: true },
      { id: 'of23-kitchen', name: '주방 / 식당', type: 'kitchen', polygon: [{ x: 4.21, y: 0 }, { x: 7.01, y: 0 }, { x: 7.01, y: 3.70 }, { x: 4.21, y: 3.70 }], floorMaterialId: flLiving, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: true },
      { id: 'of23-util', name: '다용도실', type: 'utility', polygon: [{ x: 7.01, y: 0.90 }, { x: 8.01, y: 0.90 }, { x: 8.01, y: 2.50 }, { x: 7.01, y: 2.50 }], floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false },
      { id: 'of23-ent', name: '현관', type: 'entrance', polygon: [{ x: 8.01, y: 1.80 }, { x: W, y: 1.80 }, { x: W, y: 3.70 }, { x: 8.01, y: 3.70 }], floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: true },
      { id: 'of23-bal', name: '발코니', type: 'balcony', polygon: [{ x: 0, y: 3.70 }, { x: 1.50, y: 3.70 }, { x: 1.50, y: D }, { x: 0, y: D }], floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false },
      {
        id: 'of23-master',
        name: '침실1 (안방)',
        type: 'master',
        polygon: [
          { x: 1.50, y: 3.70 },
          { x: 4.50, y: 3.70 },
          { x: 4.50, y: 5.15 },
          { x: 5.15, y: 5.15 },
          { x: 5.15, y: D },
          { x: 1.50, y: D },
        ],
        floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-warm-ivory', indirectLightColor: '3000K', indirectLightOn: true,
      },
      {
        id: 'of23-bath',
        name: '공용욕실',
        type: 'bath',
        polygon: [
          { x: 4.50, y: 3.70 },
          { x: 6.05, y: 3.70 },
          { x: 6.05, y: 6.20 },
          { x: 5.15, y: 6.20 },
          { x: 5.15, y: 5.15 },
          { x: 4.50, y: 5.15 },
        ],
        floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '3000K', indirectLightOn: false,
      },
      { id: 'of23-bed2', name: '침실2', type: 'bedroom', polygon: [{ x: 6.05, y: 3.70 }, { x: 9.05, y: 3.70 }, { x: 9.05, y: D }, { x: 6.05, y: D }], floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false },
    ],
    walls: [
      { id: 'of23-w-n1', x1: 0, y1: 0, x2: 8.01, y2: 0, thickness: 0.20, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'of23-op-wk', type: 'window', offset: 0.68, width: 1.1, height: 0.9, sillHeight: 1.2, frameMaterialId: fmWhite }] },
      { id: 'of23-w-w', x1: 0, y1: 0, x2: 0, y2: D, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'of23-op-wl', type: 'window', offset: 0.28, width: 2.8, height: 2.1, sillHeight: 0.15, frameMaterialId: fmCharcoal }, { id: 'of23-op-wb', type: 'window', offset: 0.78, width: 1.4, height: 1.4, sillHeight: 0.7, frameMaterialId: fmWhite }] },
      { id: 'of23-w-s1', x1: 0, y1: D, x2: 4.50, y2: D, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [] },
      { id: 'of23-w-s2', x1: 6.05, y1: D, x2: 9.05, y2: D, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'of23-w-u-e', x1: 8.01, y1: 0, x2: 8.01, y2: 2.20, thickness: 0.20, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'of23-w-u-l', x1: 7.01, y1: 0, x2: 7.01, y2: 2.20, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'of23-w-u-s', x1: 7.01, y1: 2.20, x2: 8.01, y2: 2.20, thickness: 0.12, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'of23-op-du', type: 'door', offset: 0.5, width: 0.8, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'out_left' }] },
      { id: 'of23-w-ent-n', x1: 8.01, y1: 1.80, x2: W, y2: 1.80, thickness: 0.20, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'of23-w-ent-e', x1: W, y1: 1.80, x2: W, y2: 3.70, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'of23-op-ent', type: 'entrance', offset: 0.5, width: 1.0, height: 2.1, sillHeight: 0, frameMaterialId: fmCharcoal, swing: 'out_left' }] },
      { id: 'of23-w-b2-e', x1: 9.05, y1: 3.70, x2: 9.05, y2: D, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'of23-op-wb2', type: 'window', offset: 0.5, width: 1.5, height: 1.4, sillHeight: 0.7, frameMaterialId: fmWhite }] },
      // 중앙 가로 내벽 (문 4개 정확한 열림 방향 적용)
      {
        id: 'of23-w-mid',
        x1: 0, y1: 3.70, x2: W, y2: 3.70,
        thickness: 0.14, height: H, isLoadBearing: true, demolished: false,
        frontMaterialId: wpDefault, backMaterialId: wpDefault,
        openings: [
          { id: 'of23-op-dbal', type: 'door', offset: 0.08, width: 0.8, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'out_left' },
          { id: 'of23-op-dm', type: 'door', offset: 0.41, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'in_right' },
          { id: 'of23-op-dbath', type: 'door', offset: 0.58, width: 0.8, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'in_right' },
          { id: 'of23-op-db2', type: 'door', offset: 0.70, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'in_left' },
        ],
      },
      { id: 'of23-w-m-bal', x1: 1.50, y1: 3.70, x2: 1.50, y2: D, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [] },
      { id: 'of23-w-m-b1', x1: 4.50, y1: 3.70, x2: 4.50, y2: 5.15, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [] },
      { id: 'of23-w-m-b2', x1: 4.50, y1: 5.15, x2: 5.15, y2: 5.15, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [] },
      { id: 'of23-w-m-b3', x1: 5.15, y1: 5.15, x2: 5.15, y2: D, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [] },
      { id: 'of23-w-b-b2', x1: 6.05, y1: 3.70, x2: 6.05, y2: D, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'of23-w-b-s', x1: 5.15, y1: 6.20, x2: 6.05, y2: 6.20, thickness: 0.20, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
    ],
    lights: [
      { id: 'of23-lt-1', roomId: 'of23-living', type: 'ceiling_fan', x: 2.3, y: 1.85, kelvin: '4000K', on: true },
      { id: 'of23-lt-2', roomId: 'of23-kitchen', type: 'pendant', x: 5.75, y: 1.9, kelvin: '3000K', on: true },
      { id: 'of23-lt-3', roomId: 'of23-master', type: 'downlight_3', x: 3.0, y: 5.2, kelvin: '3000K', on: true },
    ],
    furniture: [
      // ㄷ자형 주방 싱크대 (x=4.21..7.01 열 맞춤)
      { id: 'of23-fn-kit-top', name: '주방 상부/쿡탑', category: 'kitchen_counter', x: 5.61, y: 0.33, width: 2.80, depth: 0.65, height: 0.88, rotation: 0, color: '#F2F0EB' },
      { id: 'of23-fn-kit-l', name: '싱크대', category: 'kitchen_counter', x: 4.54, y: 1.50, width: 0.65, depth: 1.70, height: 0.88, rotation: 0, color: '#F2F0EB' },
      { id: 'of23-fn-kit-r', name: '키큰장/냉장고', category: 'wardrobe', x: 6.68, y: 1.50, width: 0.65, depth: 1.70, height: 2.1, rotation: 0, color: '#E5E1D8' },
      // L자형 공용욕실 변기 · 세면대 · 샤워부스
      { id: 'of23-fn-toilet', name: '양변기', category: 'toilet', x: 4.82, y: 4.08, width: 0.44, depth: 0.64, height: 0.72, rotation: -Math.PI / 2, color: '#FFFFFF' },
      { id: 'of23-fn-vanity', name: '세면대', category: 'vanity', x: 4.80, y: 4.72, width: 0.56, depth: 0.44, height: 0.82, rotation: -Math.PI / 2, color: '#FFFFFF' },
      { id: 'of23-fn-shower', name: '샤워부스', category: 'shower', x: 5.60, y: 5.62, width: 0.86, depth: 1.12, height: 2.0, rotation: 0, color: '#BAE6FD' },
      // 안방 침대
      { id: 'of23-fn-bedm', name: '안방 침대', category: 'bed', x: 3.0, y: 5.4, width: 1.7, depth: 2.0, height: 0.55, rotation: 0, color: '#C8BFAF' },
    ],
  };
}
