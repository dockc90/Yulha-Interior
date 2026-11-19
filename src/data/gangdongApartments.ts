import { ApartmentComplex, FloorPlanTemplate } from '../types/interior';
import {
  createOlympicForeon84A,
  createGodeokGracium84A,
  createGodeokGracium84B,
  createGodeokArteon84A,
} from './exactPlans';

// Helper to build an authentic Korean 4-Bay 판상형 84㎡ (with 확장형/비확장형, 발코니, 다용도실, 드레스룸, 욕실2, 알파룸)
function createFourBay84Plan(
  id: string,
  complexId: string,
  complexName: string,
  dong: string,
  typeName: string,
  description: string,
  hasAlphaRoom: boolean,
  areaSqm = 84.9,
  pyeong = 34,
  isExtended = true
): FloorPlanTemplate {
  const scaleFactor = pyeong >= 40 ? 1.15 : pyeong <= 30 ? 0.94 : 1.0;
  const W = Number((13.0 * scaleFactor).toFixed(1));
  const D = Number((9.2 * scaleFactor).toFixed(1));
  const H = 2.4;

  const yBal = Number((1.3 * scaleFactor).toFixed(1));
  const x1 = Number((3.5 * scaleFactor).toFixed(1));
  const x2 = Number((7.6 * scaleFactor).toFixed(1));
  const x3 = Number((10.3 * scaleFactor).toFixed(1));
  const yMid = Number((5.2 * scaleFactor).toFixed(1));
  const yUtil = Number((7.7 * scaleFactor).toFixed(1));
  const yBath = Number((7.1 * scaleFactor).toFixed(1));

  const wpDefault = 'wp-lx-diamang-white';
  const wpWarm = 'wp-lx-besti-linen';
  const wpSage = 'wp-shinhan-sage';
  const flLiving = 'fl-dongwha-sahara-wide';
  const flRoom = 'fl-kujung-natural-oak';
  const flTile = 'fl-porcelain-concrete';
  const fmWhite = 'fm-hyundai-milkwhite';
  const fmCharcoal = 'fm-hyundai-charcoal';

  return {
    id,
    complexId,
    complexName,
    district: `강동구 ${dong}`,
    region: 'seoul',
    typeName,
    areaSqm,
    pyeong,
    bayInfo: hasAlphaRoom ? '4Bay 판상형 · 방3+알파룸+욕실2' : '4Bay 판상형 · 맞통풍+욕실2',
    isExtended,
    description,
    width: W,
    depth: D,
    rooms: [
      {
        id: 'room-bal-master',
        name: '안방 발코니 / 실외기실',
        type: 'balcony',
        polygon: [{ x: 0, y: 0 }, { x: x1, y: 0 }, { x: x1, y: yBal }, { x: 0, y: yBal }],
        floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false,
      },
      {
        id: 'room-bal-living',
        name: isExtended ? '' : '발코니',
        type: 'balcony',
        polygon: [{ x: x1, y: 0 }, { x: x2, y: 0 }, { x: x2, y: yBal }, { x: x1, y: yBal }],
        floorMaterialId: isExtended ? flLiving : flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false,
      },
      {
        id: 'room-bal-bed',
        name: isExtended ? '' : '발코니',
        type: 'balcony',
        polygon: [{ x: x2, y: 0 }, { x: W, y: 0 }, { x: W, y: yBal }, { x: x2, y: yBal }],
        floorMaterialId: isExtended ? flRoom : flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false,
      },
      {
        id: 'room-master',
        name: '침실1 (안방)',
        type: 'master',
        polygon: [{ x: 0, y: yBal }, { x: x1, y: yBal }, { x: x1, y: yMid }, { x: 0, y: yMid }],
        floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '3000K', indirectLightOn: true,
      },
      {
        id: 'room-living',
        name: '거실',
        type: 'living',
        polygon: [{ x: x1, y: yBal }, { x: x2, y: yBal }, { x: x2, y: yMid }, { x: x1, y: yMid }],
        floorMaterialId: flLiving, floorDirection: 'horizontal', ceilingType: 'well_rect', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: true,
      },
      {
        id: 'room-bed2',
        name: '침실2',
        type: 'bedroom',
        polygon: [{ x: x2, y: yBal }, { x: x3, y: yBal }, { x: x3, y: yMid }, { x: x2, y: yMid }],
        floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false,
      },
      {
        id: 'room-bed3',
        name: '침실3',
        type: 'bedroom',
        polygon: [{ x: x3, y: yBal }, { x: W, y: yBal }, { x: W, y: yMid }, { x: x3, y: yMid }],
        floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false,
      },
      {
        id: 'room-bath-master',
        name: '드레스룸 & 부부욕실',
        type: 'dress',
        polygon: [{ x: 0, y: yMid }, { x: x1, y: yMid }, { x: x1, y: D }, { x: 0, y: D }],
        floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '3000K', indirectLightOn: false,
      },
      {
        id: 'room-kitchen',
        name: '주방 / 다이닝',
        type: 'kitchen',
        polygon: [{ x: x1, y: yMid }, { x: x2, y: yMid }, { x: x2, y: yUtil }, { x: x1, y: yUtil }],
        floorMaterialId: flLiving, floorDirection: 'horizontal', ceilingType: 'well_rect', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: true,
      },
      {
        id: 'room-utility',
        name: '다용도실 (세탁실)',
        type: 'utility',
        polygon: [{ x: x1, y: yUtil }, { x: x2, y: yUtil }, { x: x2, y: D }, { x: x1, y: D }],
        floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false,
      },
      {
        id: 'room-alpha',
        name: hasAlphaRoom ? '알파룸 / 팬트리' : '복도 / 팬트리',
        type: 'alpha',
        polygon: [{ x: x2, y: yMid }, { x: x3, y: yMid }, { x: x3, y: D }, { x: x2, y: D }],
        floorMaterialId: flLiving, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false,
      },
      {
        id: 'room-bath-common',
        name: '공용욕실',
        type: 'bath',
        polygon: [{ x: x3, y: yMid }, { x: W, y: yMid }, { x: W, y: yBath }, { x: x3, y: yBath }],
        floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '3000K', indirectLightOn: false,
      },
      {
        id: 'room-entrance',
        name: '현관',
        type: 'entrance',
        polygon: [{ x: x3, y: yBath }, { x: W, y: yBath }, { x: W, y: D }, { x: x3, y: D }],
        floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '3000K', indirectLightOn: true,
      },
    ],
    walls: [
      // South exterior windows
      { id: 'w-ext-south-1', x1: 0, y1: 0, x2: x1, y2: 0, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [{ id: 'op-win-m-bal', type: 'window', offset: 0.5, width: 2.2, height: 1.5, sillHeight: 0.65, frameMaterialId: fmWhite }] },
      { id: 'w-ext-south-2', x1: x1, y1: 0, x2: x2, y2: 0, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'op-win-living', type: 'window', offset: 0.5, width: 3.4, height: 2.1, sillHeight: 0.15, frameMaterialId: fmCharcoal }] },
      { id: 'w-ext-south-3', x1: x2, y1: 0, x2: x3, y2: 0, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'op-win-bed2', type: 'window', offset: 0.5, width: 1.8, height: 1.5, sillHeight: 0.65, frameMaterialId: fmWhite }] },
      { id: 'w-ext-south-4', x1: x3, y1: 0, x2: W, y2: 0, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'op-win-bed3', type: 'window', offset: 0.5, width: 1.8, height: 1.5, sillHeight: 0.65, frameMaterialId: fmWhite }] },
      // West / East exterior
      { id: 'w-ext-west', x1: 0, y1: 0, x2: 0, y2: D, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [] },
      { id: 'w-ext-east', x1: W, y1: 0, x2: W, y2: D, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      // North exterior
      { id: 'w-ext-north-1', x1: 0, y1: D, x2: x1, y2: D, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'op-win-dress', type: 'window', offset: 0.5, width: 0.9, height: 1.0, sillHeight: 1.1, frameMaterialId: fmWhite }] },
      { id: 'w-ext-north-2', x1: x1, y1: D, x2: x2, y2: D, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'op-win-util', type: 'window', offset: 0.5, width: 1.5, height: 1.1, sillHeight: 1.0, frameMaterialId: fmWhite }] },
      { id: 'w-ext-north-3', x1: x2, y1: D, x2: W, y2: D, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'op-entrance', type: 'entrance', offset: 0.72, width: 1.05, height: 2.1, sillHeight: 0, frameMaterialId: fmCharcoal }] },

      // Balcony partition walls (분합창 — 비확장형일 때 존재, 확장형일 때 철거됨)
      { id: 'w-bal-master', x1: 0, y1: yBal, x2: x1, y2: yBal, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [{ id: 'op-bal-m', type: 'sliding_door', offset: 0.5, width: 2.2, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'w-bal-living', x1: x1, y1: yBal, x2: x2, y2: yBal, thickness: 0.12, height: H, isLoadBearing: false, demolished: isExtended, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'op-bal-l', type: 'sliding_door', offset: 0.5, width: 3.0, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'w-bal-bed2', x1: x2, y1: yBal, x2: x3, y2: yBal, thickness: 0.12, height: H, isLoadBearing: false, demolished: isExtended, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'op-bal-b2', type: 'window', offset: 0.5, width: 1.6, height: 1.4, sillHeight: 0.7, frameMaterialId: fmWhite }] },
      { id: 'w-bal-bed3', x1: x3, y1: yBal, x2: W, y2: yBal, thickness: 0.12, height: H, isLoadBearing: false, demolished: isExtended, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'op-bal-b3', type: 'window', offset: 0.5, width: 1.6, height: 1.4, sillHeight: 0.7, frameMaterialId: fmWhite }] },

      // Interior walls
      { id: 'w-int-master-living', x1: x1, y1: 0, x2: x1, y2: yMid, thickness: 0.18, height: H, isLoadBearing: true, demolished: false, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [{ id: 'op-door-master', type: 'door', offset: 0.85, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'w-int-master-dress', x1: 0, y1: yMid, x2: x1, y2: yMid, thickness: 0.12, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [{ id: 'op-door-dress', type: 'sliding_door', offset: 0.55, width: 1.1, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'w-int-dress-kitchen', x1: x1, y1: yMid, x2: x1, y2: D, thickness: 0.18, height: H, isLoadBearing: true, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'w-int-living-bed2', x1: x2, y1: yBal, x2: x2, y2: yMid, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpSage, openings: [{ id: 'op-door-bed2', type: 'door', offset: 0.82, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'w-int-bed2-bed3', x1: x3, y1: yBal, x2: x3, y2: yMid, thickness: 0.12, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpSage, backMaterialId: wpDefault, openings: [{ id: 'op-door-bed3', type: 'door', offset: 0.82, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'w-int-kitchen-util', x1: x1, y1: yUtil, x2: x2, y2: yUtil, thickness: 0.12, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'op-door-util', type: 'door', offset: 0.25, width: 0.8, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'w-int-kitchen-alpha', x1: x2, y1: yMid, x2: x2, y2: D, thickness: 0.12, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'op-door-alpha', type: 'door', offset: 0.45, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'w-int-alpha-bath', x1: x3, y1: yMid, x2: x3, y2: yBath, thickness: 0.15, height: H, isLoadBearing: true, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'op-door-bath1', type: 'door', offset: 0.5, width: 0.8, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'w-int-bath-ent', x1: x3, y1: yBath, x2: W, y2: yBath, thickness: 0.15, height: H, isLoadBearing: true, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'w-int-alpha-ent', x1: x3, y1: yBath, x2: x3, y2: D, thickness: 0.12, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'op-jungmun', type: 'sliding_door', offset: 0.5, width: 1.2, height: 2.1, sillHeight: 0, frameMaterialId: fmCharcoal }] },
    ],
    lights: [
      { id: 'lt-1', roomId: 'room-living', type: 'ceiling_fan', x: (x1 + x2) / 2, y: (yBal + yMid) / 2, kelvin: '4000K', on: true },
      { id: 'lt-2', roomId: 'room-living', type: 'downlight_2', x: x1 + 0.7, y: yBal + 0.6, kelvin: '4000K', on: true },
      { id: 'lt-3', roomId: 'room-living', type: 'downlight_2', x: x2 - 0.7, y: yBal + 0.6, kelvin: '4000K', on: true },
      { id: 'lt-4', roomId: 'room-kitchen', type: 'pendant', x: (x1 + x2) / 2, y: yMid + 1.0, kelvin: '3000K', on: true },
      { id: 'lt-5', roomId: 'room-kitchen', type: 'downlight_3', x: (x1 + x2) / 2, y: yUtil - 0.6, kelvin: '4000K', on: true },
      { id: 'lt-6', roomId: 'room-master', type: 'downlight_3', x: x1 / 2, y: (yBal + yMid) / 2, kelvin: '3000K', on: true },
    ],
    furniture: [
      { id: 'fn-sofa', name: '거실 패브릭 소파', category: 'sofa', x: x1 + 0.55, y: (yBal + yMid) / 2, width: 0.95, depth: 2.7, height: 0.78, rotation: 0, color: '#D9D4CC' },
      { id: 'fn-tv', name: '거실 월플렉스 / TV장', category: 'tv_stand', x: x2 - 0.35, y: (yBal + yMid) / 2, width: 0.45, depth: 2.4, height: 0.5, rotation: 0, color: '#5A4A3F' },
      { id: 'fn-dining', name: '세라믹 6인 식탁', category: 'dining', x: (x1 + x2) / 2, y: yMid + 1.0, width: 1.8, depth: 0.9, height: 0.75, rotation: 0, color: '#EAE6DF' },
      { id: 'fn-kitchen', name: '주방 싱크대 / 상하부장', category: 'kitchen_counter', x: (x1 + x2) / 2, y: yUtil - 0.4, width: 3.5, depth: 0.68, height: 0.88, rotation: 0, color: '#F2F0EB' },
      { id: 'fn-bed-m', name: '안방 킹 침대', category: 'bed', x: 1.35, y: (yBal + yMid) / 2, width: 1.9, depth: 2.1, height: 0.55, rotation: 0, color: '#C8BFAF' },
    ],
  };
}

// Helper for authentic Korean 3-Bay 판상형 59㎡ (방3 + 욕실2 + 드레스룸 + 다용도실 + 발코니 확장/비확장)
function createThreeBay59Plan(
  id: string,
  complexId: string,
  complexName: string,
  dong: string,
  typeName: string,
  description: string,
  isExtended = true
): FloorPlanTemplate {
  const W = 11.0;
  const D = 8.4;
  const H = 2.4;

  const yBal = 1.2;
  const x1 = 3.5;
  const x2 = 7.4;
  const yMid = 4.6;
  const yUtil = 7.1;
  const yBath = 6.6;

  const wpDefault = 'wp-lx-diamang-white';
  const wpWarm = 'wp-lx-besti-linen';
  const flLiving = 'fl-kujung-white-wash';
  const flRoom = 'fl-kujung-natural-oak';
  const flTile = 'fl-porcelain-bianco';
  const fmWhite = 'fm-hyundai-milkwhite';
  const fmCharcoal = 'fm-hyundai-charcoal';

  return {
    id,
    complexId,
    complexName,
    district: `강동구 ${dong}`,
    region: 'seoul',
    typeName,
    areaSqm: 59.9,
    pyeong: 24,
    bayInfo: '3Bay 판상형 · 방3+욕실2',
    isExtended,
    description,
    width: W,
    depth: D,
    rooms: [
      {
        id: 'room-bal-master', name: '안방 발코니 / 실외기실', type: 'balcony',
        polygon: [{ x: 0, y: 0 }, { x: x1, y: 0 }, { x: x1, y: yBal }, { x: 0, y: yBal }],
        floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false,
      },
      {
        id: 'room-bal-living', name: isExtended ? '거실 확장부' : '거실 전면 발코니', type: 'balcony',
        polygon: [{ x: x1, y: 0 }, { x: x2, y: 0 }, { x: x2, y: yBal }, { x: x1, y: yBal }],
        floorMaterialId: isExtended ? flLiving : flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false,
      },
      {
        id: 'room-bal-bed', name: isExtended ? '침실2 확장부' : '침실2 발코니', type: 'balcony',
        polygon: [{ x: x2, y: 0 }, { x: W, y: 0 }, { x: W, y: yBal }, { x: x2, y: yBal }],
        floorMaterialId: isExtended ? flRoom : flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false,
      },
      {
        id: 'room-master', name: '침실1 (안방)', type: 'master',
        polygon: [{ x: 0, y: yBal }, { x: x1, y: yBal }, { x: x1, y: yMid }, { x: 0, y: yMid }],
        floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '3000K', indirectLightOn: true,
      },
      {
        id: 'room-living', name: '거실', type: 'living',
        polygon: [{ x: x1, y: yBal }, { x: x2, y: yBal }, { x: x2, y: yMid }, { x: x1, y: yMid }],
        floorMaterialId: flLiving, floorDirection: 'horizontal', ceilingType: 'well_round', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: true,
      },
      {
        id: 'room-bed2', name: '침실2', type: 'bedroom',
        polygon: [{ x: x2, y: yBal }, { x: W, y: yBal }, { x: W, y: yMid }, { x: x2, y: yMid }],
        floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false,
      },
      {
        id: 'room-bath-m', name: '부부욕실 & 드레스룸', type: 'dress',
        polygon: [{ x: 0, y: yMid }, { x: x1, y: yMid }, { x: x1, y: D }, { x: 0, y: D }],
        floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '3000K', indirectLightOn: false,
      },
      {
        id: 'room-kitchen', name: '주방 / 다이닝', type: 'kitchen',
        polygon: [{ x: x1, y: yMid }, { x: x2, y: yMid }, { x: x2, y: yUtil }, { x: x1, y: yUtil }],
        floorMaterialId: flLiving, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: true,
      },
      {
        id: 'room-utility', name: '다용도실', type: 'utility',
        polygon: [{ x: x1, y: yUtil }, { x: x2, y: yUtil }, { x: x2, y: D }, { x: x1, y: D }],
        floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false,
      },
      {
        id: 'room-bed3', name: '침실3', type: 'bedroom',
        polygon: [{ x: x2, y: yMid }, { x: W, y: yMid }, { x: W, y: yBath }, { x: x2, y: yBath }],
        floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false,
      },
      {
        id: 'room-ent', name: '현관 / 공용욕실', type: 'entrance',
        polygon: [{ x: x2, y: yBath }, { x: W, y: yBath }, { x: W, y: D }, { x: x2, y: D }],
        floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: true,
      },
    ],
    walls: [
      { id: 'w59-s1', x1: 0, y1: 0, x2: x1, y2: 0, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [{ id: 'op59-w1', type: 'window', offset: 0.5, width: 1.9, height: 1.45, sillHeight: 0.7, frameMaterialId: fmWhite }] },
      { id: 'w59-s2', x1: x1, y1: 0, x2: x2, y2: 0, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'op59-w2', type: 'window', offset: 0.5, width: 3.0, height: 2.1, sillHeight: 0.15, frameMaterialId: fmCharcoal }] },
      { id: 'w59-s3', x1: x2, y1: 0, x2: W, y2: 0, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'op59-w3', type: 'window', offset: 0.5, width: 1.8, height: 1.4, sillHeight: 0.75, frameMaterialId: fmWhite }] },
      { id: 'w59-w', x1: 0, y1: 0, x2: 0, y2: D, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [] },
      { id: 'w59-e', x1: W, y1: 0, x2: W, y2: D, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'op59-we', type: 'window', offset: 0.65, width: 1.2, height: 1.2, sillHeight: 0.9, frameMaterialId: fmWhite }] },
      { id: 'w59-n1', x1: 0, y1: D, x2: x1, y2: D, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'w59-n2', x1: x1, y1: D, x2: x2, y2: D, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'op59-wk', type: 'window', offset: 0.5, width: 1.5, height: 1.1, sillHeight: 1.0, frameMaterialId: fmWhite }] },
      { id: 'w59-n3', x1: x2, y1: D, x2: W, y2: D, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'op59-ent', type: 'entrance', offset: 0.68, width: 1.0, height: 2.1, sillHeight: 0, frameMaterialId: fmCharcoal }] },

      // Balcony partitions
      { id: 'w-bal-master', x1: 0, y1: yBal, x2: x1, y2: yBal, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [{ id: 'op59-bm', type: 'sliding_door', offset: 0.5, width: 2.0, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'w-bal-living', x1: x1, y1: yBal, x2: x2, y2: yBal, thickness: 0.12, height: H, isLoadBearing: false, demolished: isExtended, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'op59-bl', type: 'sliding_door', offset: 0.5, width: 2.8, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'w-bal-bed2', x1: x2, y1: yBal, x2: W, y2: yBal, thickness: 0.12, height: H, isLoadBearing: false, demolished: isExtended, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'op59-bb2', type: 'window', offset: 0.5, width: 1.6, height: 1.4, sillHeight: 0.7, frameMaterialId: fmWhite }] },

      { id: 'w59-int1', x1: x1, y1: 0, x2: x1, y2: yMid, thickness: 0.16, height: H, isLoadBearing: true, demolished: false, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [{ id: 'op59-d1', type: 'door', offset: 0.82, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'w59-int2', x1: 0, y1: yMid, x2: x1, y2: yMid, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [{ id: 'op59-d2', type: 'sliding_door', offset: 0.5, width: 1.0, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'w59-int3', x1: x1, y1: yMid, x2: x1, y2: D, thickness: 0.16, height: H, isLoadBearing: true, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'w59-int4', x1: x2, y1: yBal, x2: x2, y2: yMid, thickness: 0.12, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: 'wp-shinhan-powderblue', openings: [{ id: 'op59-d3', type: 'door', offset: 0.82, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'w59-int5', x1: x2, y1: yMid, x2: W, y2: yMid, thickness: 0.12, height: H, isLoadBearing: false, demolished: false, frontMaterialId: 'wp-shinhan-powderblue', backMaterialId: wpDefault, openings: [] },
      { id: 'w59-int6', x1: x2, y1: yMid, x2: x2, y2: yBath, thickness: 0.12, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'op59-d4', type: 'door', offset: 0.5, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'w59-int7', x1: x1, y1: yUtil, x2: x2, y2: yUtil, thickness: 0.12, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'op59-du', type: 'door', offset: 0.25, width: 0.8, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'w59-int8', x1: x2, y1: yBath, x2: W, y2: yBath, thickness: 0.15, height: H, isLoadBearing: true, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'op59-db', type: 'door', offset: 0.3, width: 0.8, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'w59-int9', x1: x2, y1: yBath, x2: x2, y2: D, thickness: 0.12, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'op59-jm', type: 'sliding_door', offset: 0.55, width: 1.15, height: 2.1, sillHeight: 0, frameMaterialId: fmCharcoal }] },
    ],
    lights: [
      { id: 'lt59-1', roomId: 'room-living', type: 'ceiling_fan', x: (x1 + x2) / 2, y: (yBal + yMid) / 2, kelvin: '4000K', on: true },
      { id: 'lt59-2', roomId: 'room-kitchen', type: 'pendant', x: (x1 + x2) / 2, y: yMid + 1.0, kelvin: '3000K', on: true },
      { id: 'lt59-3', roomId: 'room-master', type: 'downlight_3', x: x1 / 2, y: (yBal + yMid) / 2, kelvin: '3000K', on: true },
    ],
    furniture: [
      { id: 'fn59-sofa', name: '3인 패브릭 소파', category: 'sofa', x: x1 + 0.55, y: (yBal + yMid) / 2, width: 0.9, depth: 2.2, height: 0.76, rotation: 0, color: '#DDD7CE' },
      { id: 'fn59-tv', name: '거실 TV장', category: 'tv_stand', x: x2 - 0.32, y: (yBal + yMid) / 2, width: 0.42, depth: 2.0, height: 0.48, rotation: 0, color: '#6A584B' },
      { id: 'fn59-dining', name: '4인 식탁', category: 'dining', x: (x1 + x2) / 2, y: yMid + 1.0, width: 1.4, depth: 0.8, height: 0.75, rotation: 0, color: '#EAE6DF' },
      { id: 'fn59-kitchen', name: '주방 싱크대', category: 'kitchen_counter', x: (x1 + x2) / 2, y: yUtil - 0.35, width: 3.3, depth: 0.65, height: 0.88, rotation: 0, color: '#F3F1EC' },
      { id: 'fn59-bedm', name: '안방 퀸 침대', category: 'bed', x: 1.3, y: (yBal + yMid) / 2, width: 1.7, depth: 2.0, height: 0.55, rotation: 0, color: '#C8BFAF' },
    ],
  };
}

// Authentic Korean Tower-type 84㎡B/C (고덕자이 84B 등: 거실 2면 코너창 LDK + 방3 + 욕실2 + 드레스룸 + 다용도실 + 현관 복도)
function createTower84Plan(
  id: string,
  complexId: string,
  complexName: string,
  dong: string,
  typeName: string,
  description: string,
  isExtended = true
): FloorPlanTemplate {
  const W = 12.2;
  const D = 10.0;
  const H = 2.4;

  const yBal = 1.2;
  const xLivEnd = 5.4;
  const xHall = 6.6;
  const xRoomStart = 6.6;
  const yLivEnd = 5.0;
  const yUtil = 8.4;
  const yMasterEnd = 4.2;
  const yBed2End = 6.8;
  const yBathEnd = 8.4;

  const wpDefault = 'wp-lx-diamang-white';
  const wpGray = 'wp-lx-diamang-warmgray';
  const flLiving = 'fl-dongwha-sahara-wide';
  const flRoom = 'fl-kujung-natural-oak';
  const flTile = 'fl-porcelain-bianco';
  const fmCharcoal = 'fm-hyundai-charcoal';
  const fmWhite = 'fm-hyundai-milkwhite';

  return {
    id,
    complexId,
    complexName,
    district: `강동구 ${dong}`,
    region: 'seoul',
    typeName,
    areaSqm: 84.8,
    pyeong: 33,
    bayInfo: '이면개방 타워형 · 방3+욕실2+드레스룸',
    isExtended,
    description,
    width: W,
    depth: D,
    rooms: [
      {
        id: 'room-bal-living', name: isExtended ? '' : '발코니', type: 'balcony',
        polygon: [{ x: 0, y: 0 }, { x: xLivEnd, y: 0 }, { x: xLivEnd, y: yBal }, { x: 0, y: yBal }],
        floorMaterialId: isExtended ? flLiving : flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false,
      },
      {
        id: 'room-bal-master', name: '안방 발코니 / 실외기실', type: 'balcony',
        polygon: [{ x: xLivEnd, y: 0 }, { x: W, y: 0 }, { x: W, y: yBal }, { x: xLivEnd, y: yBal }],
        floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false,
      },
      {
        id: 't-living', name: '거실 (2면 코너창)', type: 'living',
        polygon: [{ x: 0, y: yBal }, { x: xLivEnd, y: yBal }, { x: xLivEnd, y: yLivEnd }, { x: 0, y: yLivEnd }],
        floorMaterialId: flLiving, floorDirection: 'horizontal', ceilingType: 'well_round', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '3000K', indirectLightOn: true,
      },
      {
        id: 't-kitchen', name: '주방 / 다이닝 (ㄷ자형)', type: 'kitchen',
        polygon: [{ x: 0, y: yLivEnd }, { x: xLivEnd, y: yLivEnd }, { x: xLivEnd, y: yUtil }, { x: 0, y: yUtil }],
        floorMaterialId: flLiving, floorDirection: 'horizontal', ceilingType: 'well_rect', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: true,
      },
      {
        id: 't-utility', name: '다용도실 / 세탁실', type: 'utility',
        polygon: [{ x: 0, y: yUtil }, { x: xLivEnd, y: yUtil }, { x: xLivEnd, y: D }, { x: 0, y: D }],
        floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false,
      },
      {
        id: 't-hall', name: '복도', type: 'alpha',
        polygon: [{ x: xLivEnd, y: yBal }, { x: xHall, y: yBal }, { x: xHall, y: D }, { x: xLivEnd, y: D }],
        floorMaterialId: flLiving, floorDirection: 'vertical', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: true,
      },
      {
        id: 't-master', name: '침실1 (안방)', type: 'master',
        polygon: [{ x: xRoomStart, y: yBal }, { x: 9.8, y: yBal }, { x: 9.8, y: yMasterEnd }, { x: xRoomStart, y: yMasterEnd }],
        floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-warm-ivory', indirectLightColor: '3000K', indirectLightOn: true,
      },
      {
        id: 't-dress', name: '드레스룸 & 부부욕실', type: 'dress',
        polygon: [{ x: 9.8, y: yBal }, { x: W, y: yBal }, { x: W, y: yMasterEnd }, { x: 9.8, y: yMasterEnd }],
        floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '3000K', indirectLightOn: false,
      },
      {
        id: 't-bed2', name: '침실2', type: 'bedroom',
        polygon: [{ x: xRoomStart, y: yMasterEnd }, { x: 9.4, y: yMasterEnd }, { x: 9.4, y: yBed2End }, { x: xRoomStart, y: yBed2End }],
        floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false,
      },
      {
        id: 't-bed3', name: '침실3', type: 'bedroom',
        polygon: [{ x: 9.4, y: yMasterEnd }, { x: W, y: yMasterEnd }, { x: W, y: yBed2End }, { x: 9.4, y: yBed2End }],
        floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false,
      },
      {
        id: 't-bath-common', name: '공용욕실', type: 'bath',
        polygon: [{ x: xRoomStart, y: yBed2End }, { x: 9.2, y: yBed2End }, { x: 9.2, y: D }, { x: xRoomStart, y: D }],
        floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '3000K', indirectLightOn: false,
      },
      {
        id: 't-ent', name: '현관 / 신발장', type: 'entrance',
        polygon: [{ x: 9.2, y: yBed2End }, { x: W, y: yBed2End }, { x: W, y: D }, { x: 9.2, y: D }],
        floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: true,
      },
    ],
    walls: [
      // Exterior
      { id: 'wt-s1', x1: 0, y1: 0, x2: xLivEnd, y2: 0, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'opt-w1', type: 'window', offset: 0.5, width: 3.8, height: 2.1, sillHeight: 0.15, frameMaterialId: fmCharcoal }] },
      { id: 'wt-s2', x1: xLivEnd, y1: 0, x2: W, y2: 0, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpGray, backMaterialId: wpDefault, openings: [{ id: 'opt-w2', type: 'window', offset: 0.5, width: 2.6, height: 1.5, sillHeight: 0.65, frameMaterialId: fmWhite }] },
      { id: 'wt-w1', x1: 0, y1: 0, x2: 0, y2: yLivEnd, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'opt-w3', type: 'window', offset: 0.5, width: 3.0, height: 2.1, sillHeight: 0.15, frameMaterialId: fmCharcoal }] },
      { id: 'wt-w2', x1: 0, y1: yLivEnd, x2: 0, y2: D, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'opt-wu', type: 'window', offset: 0.85, width: 1.2, height: 1.1, sillHeight: 1.0, frameMaterialId: fmWhite }] },
      { id: 'wt-e', x1: W, y1: 0, x2: W, y2: D, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'opt-w4', type: 'window', offset: 0.55, width: 1.5, height: 1.4, sillHeight: 0.75, frameMaterialId: fmWhite }] },
      { id: 'wt-n1', x1: 0, y1: D, x2: xRoomStart, y2: D, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'wt-n2', x1: xRoomStart, y1: D, x2: W, y2: D, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'opt-ent', type: 'entrance', offset: 0.75, width: 1.05, height: 2.1, sillHeight: 0, frameMaterialId: fmCharcoal }] },

      // Balcony partitions
      { id: 'w-bal-living', x1: 0, y1: yBal, x2: xLivEnd, y2: yBal, thickness: 0.12, height: H, isLoadBearing: false, demolished: isExtended, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'opt-bl', type: 'sliding_door', offset: 0.5, width: 3.4, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'w-bal-master', x1: xRoomStart, y1: yBal, x2: W, y2: yBal, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpGray, backMaterialId: wpDefault, openings: [{ id: 'opt-bm', type: 'sliding_door', offset: 0.35, width: 2.0, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },

      // Interior walls
      { id: 'wt-util', x1: 0, y1: yUtil, x2: xLivEnd, y2: yUtil, thickness: 0.12, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'opt-du', type: 'door', offset: 0.25, width: 0.85, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'wt-hall-l', x1: xLivEnd, y1: yLivEnd, x2: xLivEnd, y2: D, thickness: 0.15, height: H, isLoadBearing: true, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'opt-hk', type: 'sliding_door', offset: 0.2, width: 1.6, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'wt-hall-r1', x1: xRoomStart, y1: yBal, x2: xRoomStart, y2: yMasterEnd, thickness: 0.16, height: H, isLoadBearing: true, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpGray, openings: [{ id: 'opt-dm', type: 'door', offset: 0.82, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'wt-hall-r2', x1: xRoomStart, y1: yMasterEnd, x2: xRoomStart, y2: yBed2End, thickness: 0.12, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'opt-db2', type: 'door', offset: 0.5, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'wt-hall-r3', x1: xRoomStart, y1: yBed2End, x2: xRoomStart, y2: D, thickness: 0.15, height: H, isLoadBearing: true, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'opt-dbath', type: 'door', offset: 0.45, width: 0.8, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'wt-m-dress', x1: 9.8, y1: yBal, x2: 9.8, y2: yMasterEnd, thickness: 0.12, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpGray, backMaterialId: wpDefault, openings: [{ id: 'opt-ddress', type: 'sliding_door', offset: 0.5, width: 1.0, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'wt-m-b2', x1: xRoomStart, y1: yMasterEnd, x2: W, y2: yMasterEnd, thickness: 0.16, height: H, isLoadBearing: true, demolished: false, frontMaterialId: wpGray, backMaterialId: wpDefault, openings: [] },
      { id: 'wt-b2-b3', x1: 9.4, y1: yMasterEnd, x2: 9.4, y2: yBed2End, thickness: 0.12, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'wt-b2-ent', x1: xRoomStart, y1: yBed2End, x2: W, y2: yBed2End, thickness: 0.15, height: H, isLoadBearing: true, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'opt-db3', type: 'door', offset: 0.78, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'wt-bath-ent', x1: 9.2, y1: yBed2End, x2: 9.2, y2: D, thickness: 0.12, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'opt-jm', type: 'sliding_door', offset: 0.75, width: 1.15, height: 2.1, sillHeight: 0, frameMaterialId: fmCharcoal }] },
    ],
    lights: [
      { id: 'ltt-1', roomId: 't-living', type: 'ceiling_fan', x: 2.7, y: 3.1, kelvin: '3000K', on: true },
      { id: 'ltt-2', roomId: 't-kitchen', type: 'pendant', x: 2.7, y: 6.4, kelvin: '3000K', on: true },
      { id: 'ltt-3', roomId: 't-master', type: 'downlight_3', x: 8.2, y: 2.7, kelvin: '3000K', on: true },
    ],
    furniture: [
      { id: 'fnt-sofa', name: '코너형 라운지 소파', category: 'sofa', x: 3.4, y: 3.1, width: 1.0, depth: 2.8, height: 0.78, rotation: 0, color: '#D8D3CA' },
      { id: 'fnt-dining', name: '원목 6인 식탁', category: 'dining', x: 2.6, y: 6.4, width: 1.8, depth: 0.9, height: 0.75, rotation: 0, color: '#8C6849' },
      { id: 'fnt-kitchen', name: 'ㄷ자형 주방 싱크대', category: 'kitchen_counter', x: 2.2, y: 7.9, width: 3.6, depth: 0.68, height: 0.88, rotation: 0, color: '#F1EFEA' },
      { id: 'fnt-bed', name: '안방 킹 침대', category: 'bed', x: 8.2, y: 2.5, width: 1.9, depth: 2.1, height: 0.55, rotation: 0, color: '#B8AEA0' },
      { id: 'fnt-bed2', name: '침실2 침대', category: 'bed', x: 8.0, y: 5.5, width: 1.1, depth: 2.0, height: 0.5, rotation: 0, color: '#CBD5E1' },
      { id: 'fnt-bed3', name: '침실3 침대', category: 'bed', x: 10.8, y: 5.5, width: 1.1, depth: 2.0, height: 0.5, rotation: 0, color: '#CBD5E1' },
    ],
  };
}

// Exact Naver Real Estate floor plan for 고덕자이 84㎡B (33평형 B타입)
function createGodeokXi84BPlan(isExtended = true): FloorPlanTemplate {
  const W = 14.4;
  const D = 9.6;
  const H = 2.4;

  const wpDefault = 'wp-lx-diamang-white';
  const wpWarm = 'wp-lx-besti-linen';
  const flLiving = 'fl-dongwha-sahara-wide';
  const flRoom = 'fl-kujung-natural-oak';
  const flTile = 'fl-porcelain-concrete';
  const fmWhite = 'fm-hyundai-milkwhite';
  const fmCharcoal = 'fm-hyundai-charcoal';

  return {
    id: 'godeok-xi-84b',
    complexId: 'godeok-xi',
    complexName: '고덕 자이',
    district: '강동구 상일동',
    region: 'seoul',
    typeName: '84㎡B (33평 · 이면개방 타워형)',
    areaSqm: 84.8,
    pyeong: 33,
    bayInfo: '네이버부동산 실측 구조 · 방3+팬트리+욕실2',
    isExtended,
    description: '고덕자이(상일동) 84㎡B 실제 분양 평면도: 좌측 돌출 침실2, 상단 현관·공용욕실·드레스룸·부부욕실·안방·발코니, 하단 침실3·팬트리·ㄷ자형 주방·다용도실·거실 구조.',
    width: W,
    depth: D,
    rooms: [
      { id: 'xi-bed2', name: '침실2', type: 'bedroom', polygon: [{ x: 0, y: 3.4 }, { x: 2.8, y: 3.4 }, { x: 2.8, y: 6.6 }, { x: 0, y: 6.6 }], floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false },
      { id: 'xi-ent', name: '현관', type: 'entrance', polygon: [{ x: 2.8, y: 1.4 }, { x: 4.7, y: 1.4 }, { x: 4.7, y: 3.4 }, { x: 2.8, y: 3.4 }], floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: true },
      { id: 'xi-bath1', name: '공용욕실', type: 'bath', polygon: [{ x: 4.7, y: 1.4 }, { x: 6.8, y: 1.4 }, { x: 6.8, y: 3.4 }, { x: 4.7, y: 3.4 }], floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '3000K', indirectLightOn: false },
      { id: 'xi-dress', name: '드레스룸', type: 'dress', polygon: [{ x: 6.8, y: 0 }, { x: 9.6, y: 0 }, { x: 9.6, y: 1.6 }, { x: 6.8, y: 1.6 }], floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '3000K', indirectLightOn: false },
      { id: 'xi-bath2', name: '부부욕실', type: 'bath', polygon: [{ x: 6.8, y: 1.6 }, { x: 9.6, y: 1.6 }, { x: 9.6, y: 3.4 }, { x: 6.8, y: 3.4 }], floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '3000K', indirectLightOn: false },
      { id: 'xi-master', name: '침실1 (안방)', type: 'master', polygon: [{ x: 9.6, y: 0 }, { x: 13.0, y: 0 }, { x: 13.0, y: 3.4 }, { x: 9.6, y: 3.4 }], floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-warm-ivory', indirectLightColor: '3000K', indirectLightOn: true },
      { id: 'xi-bal', name: '발코니', type: 'balcony', polygon: [{ x: 13.0, y: 0 }, { x: 14.4, y: 0 }, { x: 14.4, y: 3.4 }, { x: 13.0, y: 3.4 }], floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false },
      { id: 'xi-corridor', name: '복도', type: 'alpha', polygon: [{ x: 2.8, y: 3.4 }, { x: 8.2, y: 3.4 }, { x: 8.2, y: 4.6 }, { x: 2.8, y: 4.6 }], floorMaterialId: flLiving, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: true },
      { id: 'xi-bed3', name: '침실3', type: 'bedroom', polygon: [{ x: 2.8, y: 4.6 }, { x: 5.7, y: 4.6 }, { x: 5.7, y: 7.6 }, { x: 2.8, y: 7.6 }], floorMaterialId: flRoom, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false },
      { id: 'xi-pantry', name: '팬트리', type: 'alpha', polygon: [{ x: 5.7, y: 4.6 }, { x: 7.5, y: 4.6 }, { x: 7.5, y: 7.6 }, { x: 5.7, y: 7.6 }], floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false },
      { id: 'xi-living', name: '거실', type: 'living', polygon: [{ x: 8.2, y: 3.4 }, { x: 14.4, y: 3.4 }, { x: 14.4, y: 7.2 }, { x: 10.2, y: 7.2 }, { x: 10.2, y: 4.6 }, { x: 8.2, y: 4.6 }], floorMaterialId: flLiving, floorDirection: 'horizontal', ceilingType: 'well_rect', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '3000K', indirectLightOn: true },
      { id: 'xi-kitchen', name: '주방 / 식당', type: 'kitchen', polygon: [{ x: 7.5, y: 4.6 }, { x: 10.2, y: 4.6 }, { x: 10.2, y: 9.6 }, { x: 7.5, y: 9.6 }], floorMaterialId: flLiving, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: true },
      { id: 'xi-util', name: '다용도실', type: 'utility', polygon: [{ x: 10.2, y: 7.2 }, { x: 12.2, y: 7.2 }, { x: 12.2, y: 9.6 }, { x: 10.2, y: 9.6 }], floorMaterialId: flTile, floorDirection: 'horizontal', ceilingType: 'flat', ceilingMaterialId: 'cl-white-silk', indirectLightColor: '4000K', indirectLightOn: false },
    ],
    walls: [
      // 침실2 (좌측 돌출)
      { id: 'xi-w-b2-n', x1: 0, y1: 3.4, x2: 2.8, y2: 3.4, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'xi-w-b2-w', x1: 0, y1: 3.4, x2: 0, y2: 6.6, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'xi-w-b2-s', x1: 0, y1: 6.6, x2: 2.8, y2: 6.6, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'xi-op-wb2', type: 'window', offset: 0.5, width: 1.6, height: 1.4, sillHeight: 0.7, frameMaterialId: fmWhite }] },
      { id: 'xi-w-b2-e', x1: 2.8, y1: 3.4, x2: 2.8, y2: 6.6, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'xi-op-db2', type: 'door', offset: 0.18, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'in_left' }] },

      // 현관 & 공용욕실
      { id: 'xi-w-ent-w', x1: 2.8, y1: 1.4, x2: 2.8, y2: 3.4, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'xi-w-ent-n', x1: 2.8, y1: 1.4, x2: 6.8, y2: 1.4, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'xi-op-ent', type: 'entrance', offset: 0.24, width: 1.0, height: 2.1, sillHeight: 0, frameMaterialId: fmCharcoal, swing: 'out_left' }] },
      { id: 'xi-w-ent-b1', x1: 4.7, y1: 1.4, x2: 4.7, y2: 3.4, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'xi-w-ent-s', x1: 2.8, y1: 3.4, x2: 6.8, y2: 3.4, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'xi-op-jm', type: 'sliding_door', offset: 0.24, width: 1.2, height: 2.1, sillHeight: 0, frameMaterialId: fmCharcoal }, { id: 'xi-op-db1', type: 'door', offset: 0.82, width: 0.8, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'out_left' }] },

      // 드레스룸, 부부욕실, 안방, 발코니
      { id: 'xi-w-dr-w', x1: 6.8, y1: 0, x2: 6.8, y2: 3.4, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'xi-w-top-n', x1: 6.8, y1: 0, x2: 14.4, y2: 0, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [{ id: 'xi-op-wm', type: 'window', offset: 0.62, width: 2.0, height: 1.4, sillHeight: 0.7, frameMaterialId: fmWhite }] },
      { id: 'xi-w-dr-b2', x1: 6.8, y1: 1.6, x2: 9.6, y2: 1.6, thickness: 0.12, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [{ id: 'xi-op-ddr', type: 'door', offset: 0.82, width: 0.8, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'out_left' }] },
      { id: 'xi-w-b2-m', x1: 9.6, y1: 0, x2: 9.6, y2: 3.4, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [{ id: 'xi-op-db2m', type: 'door', offset: 0.68, width: 0.8, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'in_left' }] },
      { id: 'xi-w-m-bal', x1: 13.0, y1: 0, x2: 13.0, y2: 3.4, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [{ id: 'xi-op-mbal', type: 'sliding_door', offset: 0.5, width: 2.0, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'xi-w-m-s', x1: 6.8, y1: 3.4, x2: 14.4, y2: 3.4, thickness: 0.18, height: H, isLoadBearing: true, demolished: false, frontMaterialId: wpWarm, backMaterialId: wpDefault, openings: [{ id: 'xi-op-dm', type: 'door', offset: 0.42, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'out_left' }] },
      { id: 'xi-w-e', x1: 14.4, y1: 0, x2: 14.4, y2: 7.2, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'xi-op-wliv-e', type: 'window', offset: 0.74, width: 2.6, height: 2.0, sillHeight: 0.2, frameMaterialId: fmCharcoal }] },

      // 침실3 & 팬트리
      { id: 'xi-w-b3-n', x1: 2.8, y1: 4.6, x2: 7.5, y2: 4.6, thickness: 0.14, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'xi-op-db3', type: 'door', offset: 0.48, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite, swing: 'in_left' }] },
      { id: 'xi-w-b3-s', x1: 2.8, y1: 7.6, x2: 7.5, y2: 7.6, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'xi-op-wb3', type: 'window', offset: 0.35, width: 1.6, height: 1.4, sillHeight: 0.7, frameMaterialId: fmWhite }] },
      { id: 'xi-w-b3-p', x1: 5.7, y1: 4.6, x2: 5.7, y2: 7.6, thickness: 0.12, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'xi-w-p-k', x1: 7.5, y1: 4.6, x2: 7.5, y2: 9.6, thickness: 0.16, height: H, isLoadBearing: true, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },

      // 주방, 다용도실, 거실 하단 외벽
      { id: 'xi-w-k-s', x1: 7.5, y1: 9.6, x2: 12.2, y2: 9.6, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'xi-op-wk', type: 'window', offset: 0.3, width: 1.2, height: 1.0, sillHeight: 1.1, frameMaterialId: fmWhite }] },
      { id: 'xi-w-u-e', x1: 12.2, y1: 7.2, x2: 12.2, y2: 9.6, thickness: 0.22, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [] },
      { id: 'xi-w-k-u', x1: 10.2, y1: 7.2, x2: 10.2, y2: 9.6, thickness: 0.12, height: H, isLoadBearing: false, demolished: false, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'xi-op-du', type: 'door', offset: 0.35, width: 0.85, height: 2.1, sillHeight: 0, frameMaterialId: fmWhite }] },
      { id: 'xi-w-liv-s', x1: 10.2, y1: 7.2, x2: 14.4, y2: 7.2, thickness: 0.24, height: H, isLoadBearing: true, demolished: false, isExterior: true, frontMaterialId: wpDefault, backMaterialId: wpDefault, openings: [{ id: 'xi-op-wliv-s', type: 'window', offset: 0.55, width: 2.6, height: 2.0, sillHeight: 0.2, frameMaterialId: fmCharcoal }] },
    ],
    lights: [
      { id: 'xi-lt-1', roomId: 'xi-living', type: 'ceiling_fan', x: 11.4, y: 5.2, kelvin: '3000K', on: true },
      { id: 'xi-lt-2', roomId: 'xi-kitchen', type: 'pendant', x: 8.8, y: 7.2, kelvin: '3000K', on: true },
      { id: 'xi-lt-3', roomId: 'xi-master', type: 'downlight_3', x: 11.3, y: 1.7, kelvin: '3000K', on: true },
    ],
    furniture: [
      { id: 'xi-fn-sofa', name: '거실 소파', category: 'sofa', x: 12.0, y: 4.1, width: 2.6, depth: 0.95, height: 0.78, rotation: 0, color: '#D8D3CA' },
      { id: 'xi-fn-kitchen', name: 'ㄷ자형 주방', category: 'kitchen_counter', x: 8.2, y: 8.4, width: 0.7, depth: 2.6, height: 0.88, rotation: 0, color: '#F1EFEA' },
      // 공용욕실 (욕조 + 세면대 + 양변기)
      { id: 'xi-fn-tub1', name: '욕조', category: 'bathtub', x: 5.12, y: 2.38, width: 0.74, depth: 1.75, height: 0.55, rotation: 0, color: '#FFFFFF' },
      { id: 'xi-fn-vanity1', name: '세면대', category: 'vanity', x: 5.85, y: 1.82, width: 0.54, depth: 0.44, height: 0.82, rotation: 0, color: '#FFFFFF' },
      { id: 'xi-fn-toilet1', name: '양변기', category: 'toilet', x: 6.42, y: 1.88, width: 0.44, depth: 0.62, height: 0.72, rotation: 0, color: '#FFFFFF' },
      // 부부욕실 (샤워부스 + 세면대 + 양변기)
      { id: 'xi-fn-shower2', name: '샤워부스', category: 'shower', x: 7.28, y: 2.08, width: 0.86, depth: 0.86, height: 2.0, rotation: 0, color: '#BAE6FD' },
      { id: 'xi-fn-vanity2', name: '세면대', category: 'vanity', x: 7.95, y: 2.98, width: 0.54, depth: 0.44, height: 0.82, rotation: Math.PI, color: '#FFFFFF' },
      { id: 'xi-fn-toilet2', name: '양변기', category: 'toilet', x: 8.55, y: 2.95, width: 0.44, depth: 0.62, height: 0.72, rotation: Math.PI, color: '#FFFFFF' },
      { id: 'xi-fn-bedm', name: '안방 침대', category: 'bed', x: 11.3, y: 1.4, width: 1.8, depth: 2.0, height: 0.55, rotation: 0, color: '#C8BFAF' },
    ],
  };
}

// Helper to build standard types for any Gangdong-gu complex
function buildComplex(
  id: string,
  name: string,
  dong: string,
  households: number,
  year: number,
  types: Array<'59A' | '59B' | '74A' | '84A' | '84B' | '84C' | '99A' | '114A'>
): ApartmentComplex {
  const plans: FloorPlanTemplate[] = types.map((tp) => {
    if (tp === '59A') {
      return createThreeBay59Plan(
        `${id}-59a`, id, name, dong,
        '59㎡A (24평 · 3Bay 판상형)',
        `${dong} ${name} 59A 판상형 표준 구조. 침실 가벽 철거 시 넓은 서재/거실 확장 가능.`
      );
    }
    if (tp === '59B') {
      return createTower84Plan(
        `${id}-59b`, id, name, dong,
        '59㎡B (24평 · 타워형)',
        `${dong} ${name} 59B 이면개방 타워형 구조.`
      );
    }
    if (tp === '74A') {
      return createFourBay84Plan(
        `${id}-74a`, id, name, dong,
        '74㎡A (30평 · 4Bay 판상형)',
        `${dong} ${name} 74A 30평형 4Bay 맞통풍 구조.`,
        false, 74.8, 30
      );
    }
    if (tp === '84A') {
      if (id === 'olympic-foreon') return createOlympicForeon84A(true);
      if (id === 'godeok-gracium') return createGodeokGracium84A(true);
      if (id === 'godeok-arteon') return createGodeokArteon84A(true);
      return createFourBay84Plan(
        `${id}-84a`, id, name, dong,
        '84㎡A (34평 · 4Bay 판상형)',
        `${dong} ${name} 대표 국민평형 84A 4Bay 판상형. 알파룸 가변벽 철거 지원.`,
        true, 84.9, 34
      );
    }
    if (tp === '84B' || tp === '84C') {
      if (id === 'godeok-xi' && tp === '84B') {
        return createGodeokXi84BPlan(true);
      }
      if (id === 'godeok-gracium' && tp === '84B') {
        return createGodeokGracium84B(true);
      }
      return createTower84Plan(
        `${id}-${tp.toLowerCase()}`, id, name, dong,
        `84㎡${tp.slice(2)} (34평 · 타워형 LDK)`,
        `${dong} ${name} ${tp} 파노라마 이면개방 LDK 타워형.`
      );
    }
    if (tp === '99A') {
      return createFourBay84Plan(
        `${id}-99a`, id, name, dong,
        '99㎡A (39평 · 광폭 4Bay)',
        `${dong} ${name} 99㎡ 중대형 4Bay 판상형.`,
        true, 99.5, 39
      );
    }
    return createFourBay84Plan(
      `${id}-114a`, id, name, dong,
      '114㎡A (44평 · 대형 4Bay)',
      `${dong} ${name} 114㎡ 대형 평형. 넉넉한 거실 우물천장 및 다이닝 확장 최적화.`,
      true, 114.8, 44
    );
  });

  return {
    id,
    name,
    dong,
    district: '강동구',
    region: 'seoul',
    households,
    year,
    status: 'active',
    plans,
  };
}

export const GANGDONG_COMPLEXES: ApartmentComplex[] = [
  // 1. 둔촌동
  buildComplex('olympic-foreon', '올림픽파크 포레온 (둔촌주공)', '둔촌동', 12032, 2024, ['59A', '59B', '74A', '84A', '84B', '84C', '114A']),
  buildComplex('the-sharp-dunchon', '더샵 둔촌포레', '둔촌동', 572, 2024, ['84A', '84B', '114A']),
  buildComplex('dunchon-prugio', '둔촌 푸르지오', '둔촌동', 800, 2010, ['59A', '84A', '114A']),
  buildComplex('dunchon-hyundai', '둔촌 현대 1·2·3차', '둔촌동', 650, 1998, ['59A', '84A']),

  // 2. 고덕동 (네이버 지도 법정동 기준)
  buildComplex('godeok-gracium', '고덕 그라시움', '고덕동', 4932, 2019, ['59A', '59B', '74A', '84A', '84B', '99A']),
  buildComplex('raemian-hillstate-godeok', '고덕 래미안 힐스테이트', '고덕동', 3658, 2017, ['59A', '84A', '84B', '99A', '114A']),
  buildComplex('godeok-ipark', '고덕 아이파크', '고덕동', 1142, 2011, ['59A', '84A', '114A']),

  // 3. 상일동 (네이버 지도 법정동 기준 — 이름에 '고덕'이 들어가도 실제 법정동은 상일동)
  buildComplex('godeok-arteon', '고덕 아르테온', '상일동', 4066, 2020, ['59A', '84A', '84B', '114A']),
  buildComplex('godeok-xi', '고덕 자이', '상일동', 1824, 2021, ['59A', '59B', '74A', '84A', '84B']),
  buildComplex('godeok-central-ipark', '고덕 센트럴 아이파크', '상일동', 1745, 2019, ['59A', '74A', '84A', '84B']),
  buildComplex('godeok-lottecastle-bene', '고덕 롯데캐슬 베네루체', '상일동', 1859, 2019, ['59A', '84A', '84B', '114A']),
  buildComplex('godeok-lienpark-3', '고덕 리엔파크 3단지', '상일동', 2283, 2011, ['59A', '84A', '114A']),
  buildComplex('epyeonhan-urbanbridge', 'e편한세상 고덕 어반브릿지', '상일동', 593, 2024, ['84A', '84B', '114A']),
  buildComplex('godeok-punggyeongchae', '고덕 풍경채 어바니티', '상일동', 780, 2023, ['59A', '74A', '84A']),

  // 4. 명일동
  buildComplex('raemian-solvenue', '래미안 솔베뉴', '명일동', 1900, 2019, ['59A', '74A', '84A', '84B', '114A']),
  buildComplex('samik-green-2', '삼익그린맨션 2차', '명일동', 2400, 1983, ['59A', '84A', '114A']),
  buildComplex('samik-green-1', '삼익그린맨션 1차', '명일동', 1560, 1981, ['59A', '84A']),
  buildComplex('myeongil-lg', '명일 LG아파트', '명일동', 772, 1998, ['59A', '84A', '114A']),
  buildComplex('myeongil-woosung', '명일 우성 · 신동아', '명일동', 1142, 1986, ['84A', '114A']),

  // 5. 암사동
  buildComplex('gangdong-lotte-first', '강동 롯데캐슬 퍼스트', '암사동', 3226, 2008, ['59A', '84A', '84B', '114A']),
  buildComplex('seonsa-hyundai', '선사현대 아파트', '암사동', 2938, 2000, ['59A', '74A', '84A', '114A']),
  buildComplex('hillstate-gangdong-riverview', '힐스테이트 강동 리버뷰', '암사동', 460, 2019, ['59A', '84A']),

  // 6. 천호동
  buildComplex('raemian-gangdong-palace', '래미안 강동팰리스', '천호동', 999, 2017, ['59B', '84A', '84B']),
  buildComplex('the-sharp-central-city', '더샵 강동센트럴시티', '천호동', 670, 2025, ['59A', '84A', '84B']),
  buildComplex('gangdong-jungheung', '강동 밀레니얼 중흥S-클래스', '천호동', 999, 2024, ['59A', '74A', '84A', '84B']),
  buildComplex('epyeonhan-prestigeone', 'e편한세상 강동 프레스티지원', '천호동', 535, 2026, ['59A', '74A', '84A']),

  // 7. 성내동
  buildComplex('seongnae-samsung-raemian', '성내 삼성래미안', '성내동', 1220, 2002, ['59A', '84A', '114A']),
  buildComplex('olympic-hanyang-sujain', '올림픽파크 한양수자인', '성내동', 482, 2014, ['59A', '84A']),

  // 8. 길동
  buildComplex('gangdong-heritage-xi', '강동 헤리티지 자이', '길동', 1299, 2024, ['59A', '59B', '74A', '84A']),
  buildComplex('gildong-woosung', '길동 우성아파트', '길동', 811, 1994, ['59A', '84A', '114A']),
  buildComplex('epyeonhan-ecofore', 'e편한세상 강동 에코포레', '길동', 366, 2020, ['59A', '84A']),

  // 9. 강일동
  buildComplex('hillstate-richvill-gangil', '힐스테이트 리슈빌 강일', '강일동', 809, 2023, ['84A', '84B', '99A']),
  buildComplex('gangdong-riverst-468', '강동 리버스트 4·6·8단지', '강일동', 3429, 2020, ['59A', '74A', '84A']),
  buildComplex('gangil-riverpark-3', '강일 리버파크 1~10단지', '강일동', 2400, 2009, ['59A', '84A', '114A']),
];

export const GANGDONG_DONGS = [
  '전체',
  '둔촌동',
  '고덕동',
  '상일동',
  '명일동',
  '암사동',
  '천호동',
  '성내동',
  '길동',
  '강일동',
];

export const REGION_ROADMAP = [
  {
    regionId: 'seoul-gangdong',
    label: '서울시 강동구 (9개 법정동)',
    phase: 'Phase 1 (서비스 중 · 33개 주요 단지)',
    active: true,
    note: '둔촌·고덕·상일·명일·암사·천호·성내·길동·강일동 전 단지 및 평형/타입 지원',
  },
  {
    regionId: 'seoul-all',
    label: '서울시 전체 (강남·송파·마포·성동 등 25개구)',
    phase: 'Phase 2 (확장 예정)',
    active: false,
    note: '도면 업로드/커스텀 그리기 모드로 즉시 사용 가능',
  },
  {
    regionId: 'gyeonggi-all',
    label: '경기도 전체 (하남·분당·수원·용인·과천 등)',
    phase: 'Phase 3 (확장 예정)',
    active: false,
    note: '도면 업로드/커스텀 그리기 모드로 즉시 사용 가능',
  },
];
