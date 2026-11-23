import { FloorProject } from '../types/planner';

export function create34PyeongPlan(): FloorProject {
  // Connected vertex-edge graph: dragging any corner/wall updates connected rooms automatically!
  const nodes = [
    { id: 'n1', x: 0, y: 0 },
    { id: 'n2', x: 6.2, y: 0 },
    { id: 'n3', x: 9.6, y: 0 },
    { id: 'n4', x: 12.2, y: 0 },
    { id: 'n5', x: 9.6, y: 2.5 },
    { id: 'n6', x: 12.2, y: 2.5 },
    { id: 'n7', x: 0, y: 4.6 },
    { id: 'n8', x: 6.2, y: 4.6 },
    { id: 'n9', x: 9.6, y: 4.6 },
    { id: 'n10', x: 12.2, y: 4.6 },
    { id: 'n11', x: 0, y: 9.4 },
    { id: 'n12', x: 6.2, y: 9.4 },
    { id: 'n13', x: 12.2, y: 9.4 },
  ];

  const walls = [
    // Perimeter
    { id: 'w1', startId: 'n1', endId: 'n2', thickness: 0.22, height: 2.45, frontMaterialId: 'wl-lx-diamang-cream', backMaterialId: 'wl-lx-diamang-cream' },
    { id: 'w2', startId: 'n2', endId: 'n3', thickness: 0.22, height: 2.45, frontMaterialId: 'wl-lx-diamang-cream', backMaterialId: 'wl-lx-diamang-cream' },
    { id: 'w3', startId: 'n3', endId: 'n4', thickness: 0.22, height: 2.45, frontMaterialId: 'wl-lx-diamang-cream', backMaterialId: 'wl-lx-diamang-cream' },
    { id: 'w4', startId: 'n4', endId: 'n6', thickness: 0.22, height: 2.45, frontMaterialId: 'wl-lx-diamang-cream', backMaterialId: 'wl-lx-diamang-cream' },
    { id: 'w5', startId: 'n6', endId: 'n10', thickness: 0.22, height: 2.45, frontMaterialId: 'wl-lx-diamang-cream', backMaterialId: 'wl-lx-diamang-cream' },
    { id: 'w6', startId: 'n10', endId: 'n13', thickness: 0.22, height: 2.45, frontMaterialId: 'wl-lx-diamang-cream', backMaterialId: 'wl-lx-diamang-cream' },
    { id: 'w7', startId: 'n13', endId: 'n12', thickness: 0.22, height: 2.45, frontMaterialId: 'wl-lx-diamang-cream', backMaterialId: 'wl-lx-diamang-cream' },
    { id: 'w8', startId: 'n12', endId: 'n11', thickness: 0.22, height: 2.45, frontMaterialId: 'wl-lx-diamang-cream', backMaterialId: 'wl-lx-diamang-cream' },
    { id: 'w9', startId: 'n11', endId: 'n7', thickness: 0.22, height: 2.45, frontMaterialId: 'wl-hansol-louver', backMaterialId: 'wl-lx-diamang-cream' },
    { id: 'w10', startId: 'n7', endId: 'n1', thickness: 0.22, height: 2.45, frontMaterialId: 'wl-hansol-louver', backMaterialId: 'wl-lx-diamang-cream' },

    // Interior walls
    { id: 'w11', startId: 'n2', endId: 'n8', thickness: 0.14, height: 2.45, frontMaterialId: 'wl-lx-diamang-cream', backMaterialId: 'wl-lx-diamang-cream' },
    { id: 'w12', startId: 'n8', endId: 'n12', thickness: 0.14, height: 2.45, frontMaterialId: 'wl-lx-diamang-cream', backMaterialId: 'wl-lx-diamang-cream' },
    { id: 'w13', startId: 'n3', endId: 'n5', thickness: 0.14, height: 2.45, frontMaterialId: 'wl-lx-diamang-cream', backMaterialId: 'wl-lx-diamang-cream' },
    { id: 'w14', startId: 'n5', endId: 'n9', thickness: 0.14, height: 2.45, frontMaterialId: 'wl-lx-diamang-cream', backMaterialId: 'wl-lx-diamang-cream' },
    { id: 'w15', startId: 'n5', endId: 'n6', thickness: 0.12, height: 2.45, frontMaterialId: 'wl-lx-diamang-cream', backMaterialId: 'wl-lx-diamang-cream' },
    { id: 'w16', startId: 'n8', endId: 'n9', thickness: 0.14, height: 2.45, frontMaterialId: 'wl-lx-diamang-cream', backMaterialId: 'wl-lx-diamang-cream' },
    { id: 'w17', startId: 'n9', endId: 'n10', thickness: 0.14, height: 2.45, frontMaterialId: 'wl-lx-diamang-cream', backMaterialId: 'wl-lx-diamang-cream' },
  ];

  const openings = [
    { id: 'op1', wallId: 'w8', kind: 'window' as const, offset: 0.5, width: 4.2, height: 2.05, sillHeight: 0.2, frameMaterialId: 'fm-bodac-walnut', hasBlind: true },
    { id: 'op2', wallId: 'w7', kind: 'window' as const, offset: 0.5, width: 2.8, height: 1.5, sillHeight: 0.75, frameMaterialId: 'fm-bodac-walnut', hasBlind: true },
    { id: 'op3', wallId: 'w1', kind: 'window' as const, offset: 0.45, width: 1.6, height: 0.85, sillHeight: 1.2, frameMaterialId: 'fm-bodac-walnut', hasBlind: false },
    { id: 'op4', wallId: 'w11', kind: 'sliding_glass' as const, offset: 0.5, width: 1.4, height: 2.25, sillHeight: 0, frameMaterialId: 'fm-bodac-walnut' },
    { id: 'op5', wallId: 'w12', kind: 'door' as const, offset: 0.25, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: 'fm-bodac-walnut' },
    { id: 'op6', wallId: 'w4', kind: 'entrance' as const, offset: 0.5, width: 1.05, height: 2.15, sillHeight: 0, frameMaterialId: 'fm-bodac-charcoal' },
    { id: 'op7', wallId: 'w14', kind: 'door' as const, offset: 0.5, width: 0.8, height: 2.1, sillHeight: 0, frameMaterialId: 'fm-lx-benif-cream' },
  ];

  const roomOverrides = {
    'n1|n11|n12|n2|n7|n8': { key: 'n1|n11|n12|n2|n7|n8', name: '거실 · 주방', floorMaterialId: 'tl-yun-cream600', ceilingType: 'well_cove' as const, coveLightOn: true },
    'n10|n12|n13|n8|n9': { key: 'n10|n12|n13|n8|n9', name: '안방 (침실1)', floorMaterialId: 'fl-dongwha-max-essence', ceilingType: 'flat' as const, coveLightOn: true },
    'n2|n3|n5|n8|n9': { key: 'n2|n3|n5|n8|n9', name: '침실2 (서재)', floorMaterialId: 'fl-dongwha-max-essence', ceilingType: 'flat' as const, coveLightOn: false },
    'n3|n4|n5|n6': { key: 'n3|n4|n5|n6', name: '현관', floorMaterialId: 'tl-yun-gray800', ceilingType: 'flat' as const, coveLightOn: true },
    'n10|n5|n6|n9': { key: 'n10|n5|n6|n9', name: '욕실', floorMaterialId: 'tl-hyundai-terrazzo', ceilingType: 'flat' as const, coveLightOn: false },
  };

  const items = [
    { id: 'i1', name: '모듈 패브릭 소파', kind: 'sofa_modular' as const, x: 1.15, y: 7.0, elevation: 0, width: 1.05, depth: 3.1, height: 0.78, rotation: 0, materialId: 'wl-shinhan-facade' },
    { id: 'i2', name: '원형 러그', kind: 'rug_round' as const, x: 3.2, y: 7.0, elevation: 0.005, width: 2.2, depth: 2.2, height: 0.01, rotation: 0, materialId: 'wl-lx-diamang-gray' },
    { id: 'i3', name: '반매립 85" OLED TV', kind: 'wall_tv' as const, x: 6.06, y: 7.0, elevation: 1.28, width: 1.85, depth: 0.05, height: 1.04, rotation: Math.PI / 2, materialId: 'el-jung-black' },
    { id: 'i4', name: '루씨에어 실링팬', kind: 'ceiling_fan' as const, x: 3.1, y: 7.0, elevation: 2.38, width: 1.32, depth: 1.32, height: 0.28, rotation: 0, materialId: 'lt-lucci-wood', powerOn: true },
    { id: 'i5', name: 'TV 하단 콘센트', kind: 'outlet_2' as const, x: 6.06, y: 6.8, elevation: 0.42, width: 0.12, depth: 0.02, height: 0.08, rotation: Math.PI / 2, materialId: 'el-legrand-white' },
    { id: 'i6', name: '주방 벽 스위치', kind: 'switch_2' as const, x: 0.16, y: 4.1, elevation: 1.25, width: 0.09, depth: 0.02, height: 0.12, rotation: -Math.PI / 2, materialId: 'el-legrand-white' },
    { id: 'i7', name: '홈 월패드', kind: 'wallpad' as const, x: 0.16, y: 3.8, elevation: 1.38, width: 0.26, depth: 0.02, height: 0.18, rotation: -Math.PI / 2, materialId: 'el-legrand-white' },
    { id: 'i8', name: '상부장 · 싱크대', kind: 'kitchen_sink' as const, x: 2.8, y: 0.48, elevation: 0, width: 3.6, depth: 0.65, height: 0.88, rotation: 0, materialId: 'fm-lx-benif-cream' },
    { id: 'i9', name: '대면형 아일랜드', kind: 'island_counter' as const, x: 2.8, y: 2.2, elevation: 0, width: 2.8, depth: 0.9, height: 0.88, rotation: 0, materialId: 'fm-lx-benif-cream' },
    { id: 'i10', name: '비스포크 3구 인덕션', kind: 'induction_3' as const, x: 2.0, y: 2.2, elevation: 0.88, width: 0.62, depth: 0.52, height: 0.03, rotation: 0, materialId: 'ap-bespoke-induction' },
    { id: 'i11', name: '4인 우드 식탁 세트', kind: 'dining_set' as const, x: 2.8, y: 3.7, elevation: 0, width: 1.65, depth: 0.88, height: 0.75, rotation: 0, materialId: 'fl-dongwha-max-essence' },
    { id: 'i12', name: '비스포크 4도어 냉장고장', kind: 'fridge_4door' as const, x: 5.75, y: 1.35, elevation: 0, width: 1.6, depth: 0.68, height: 2.3, rotation: Math.PI / 2, materialId: 'ap-bespoke-white' },
    { id: 'i13', name: '홈바 · 키큰장', kind: 'tall_homebar' as const, x: 5.75, y: 3.05, elevation: 0, width: 1.55, depth: 0.65, height: 2.3, rotation: Math.PI / 2, materialId: 'fm-lx-benif-cream', variant: 'option2' as const },
    { id: 'i14', name: '안방 퀸 침대', kind: 'bed_queen' as const, x: 9.2, y: 7.4, elevation: 0, width: 1.85, depth: 2.1, height: 0.55, rotation: Math.PI, materialId: 'wl-shinhan-facade' },
    { id: 'i15', name: '욕조', kind: 'bathtub' as const, x: 11.1, y: 3.05, elevation: 0, width: 1.65, depth: 0.75, height: 0.55, rotation: 0, materialId: 'fm-bodac-white' },
    { id: 'i16', name: '양변기', kind: 'toilet' as const, x: 10.2, y: 4.1, elevation: 0, width: 0.44, depth: 0.65, height: 0.72, rotation: Math.PI, materialId: 'fm-bodac-white' },
    { id: 'i17', name: '세면대', kind: 'vanity' as const, x: 11.5, y: 4.15, elevation: 0, width: 0.65, depth: 0.45, height: 0.82, rotation: Math.PI, materialId: 'fm-lx-benif-cream' },
  ];

  return {
    id: 'apt-34py',
    title: '34평 4Bay 아파트 인테리어',
    areaSqm: 84.9,
    nodes,
    walls,
    openings,
    roomOverrides,
    items,
  };
}

export function create25PyeongPlan(): FloorProject {
  const nodes = [
    { id: 'a1', x: 0, y: 0 },
    { id: 'a2', x: 5.2, y: 0 },
    { id: 'a3', x: 9.4, y: 0 },
    { id: 'a4', x: 0, y: 4.0 },
    { id: 'a5', x: 5.2, y: 4.0 },
    { id: 'a6', x: 9.4, y: 4.0 },
    { id: 'a7', x: 0, y: 8.2 },
    { id: 'a8', x: 5.2, y: 8.2 },
    { id: 'a9', x: 9.4, y: 8.2 },
  ];
  const walls = [
    { id: 'aw1', startId: 'a1', endId: 'a2', thickness: 0.2, height: 2.45, frontMaterialId: 'wl-lx-diamang-white', backMaterialId: 'wl-lx-diamang-white' },
    { id: 'aw2', startId: 'a2', endId: 'a3', thickness: 0.2, height: 2.45, frontMaterialId: 'wl-lx-diamang-white', backMaterialId: 'wl-lx-diamang-white' },
    { id: 'aw3', startId: 'a3', endId: 'a6', thickness: 0.2, height: 2.45, frontMaterialId: 'wl-lx-diamang-white', backMaterialId: 'wl-lx-diamang-white' },
    { id: 'aw4', startId: 'a6', endId: 'a9', thickness: 0.2, height: 2.45, frontMaterialId: 'wl-lx-diamang-white', backMaterialId: 'wl-lx-diamang-white' },
    { id: 'aw5', startId: 'a9', endId: 'a8', thickness: 0.2, height: 2.45, frontMaterialId: 'wl-lx-diamang-white', backMaterialId: 'wl-lx-diamang-white' },
    { id: 'aw6', startId: 'a8', endId: 'a7', thickness: 0.2, height: 2.45, frontMaterialId: 'wl-lx-diamang-white', backMaterialId: 'wl-lx-diamang-white' },
    { id: 'aw7', startId: 'a7', endId: 'a4', thickness: 0.2, height: 2.45, frontMaterialId: 'wl-lx-diamang-white', backMaterialId: 'wl-lx-diamang-white' },
    { id: 'aw8', startId: 'a4', endId: 'a1', thickness: 0.2, height: 2.45, frontMaterialId: 'wl-lx-diamang-white', backMaterialId: 'wl-lx-diamang-white' },
    { id: 'aw9', startId: 'a2', endId: 'a5', thickness: 0.14, height: 2.45, frontMaterialId: 'wl-lx-diamang-white', backMaterialId: 'wl-lx-diamang-white' },
    { id: 'aw10', startId: 'a5', endId: 'a8', thickness: 0.14, height: 2.45, frontMaterialId: 'wl-lx-diamang-white', backMaterialId: 'wl-lx-diamang-white' },
    { id: 'aw11', startId: 'a5', endId: 'a6', thickness: 0.14, height: 2.45, frontMaterialId: 'wl-lx-diamang-white', backMaterialId: 'wl-lx-diamang-white' },
  ];
  return {
    id: 'apt-25py',
    title: '25평 3Bay 신혼형 인테리어',
    areaSqm: 59.9,
    nodes,
    walls,
    openings: [
      { id: 'aop1', wallId: 'aw6', kind: 'window', offset: 0.5, width: 3.4, height: 2.0, sillHeight: 0.2, frameMaterialId: 'fm-bodac-walnut', hasBlind: true },
      { id: 'aop2', wallId: 'aw5', kind: 'window', offset: 0.5, width: 2.2, height: 1.5, sillHeight: 0.75, frameMaterialId: 'fm-bodac-walnut', hasBlind: true },
      { id: 'aop3', wallId: 'aw10', kind: 'door', offset: 0.25, width: 0.9, height: 2.1, sillHeight: 0, frameMaterialId: 'fm-bodac-walnut' },
    ],
    roomOverrides: {
      'a1|a2|a4|a5|a7|a8': { key: 'a1|a2|a4|a5|a7|a8', name: '거실 · 주방', floorMaterialId: 'fl-kujung-grand-swedish', ceilingType: 'well_cove', coveLightOn: true },
      'a5|a6|a8|a9': { key: 'a5|a6|a8|a9', name: '안방', floorMaterialId: 'fl-kujung-grand-swedish', ceilingType: 'flat', coveLightOn: false },
      'a2|a3|a5|a6': { key: 'a2|a3|a5|a6', name: '침실2', floorMaterialId: 'fl-kujung-grand-swedish', ceilingType: 'flat', coveLightOn: false },
    },
    items: [
      { id: 'ai1', name: '모듈 패브릭 소파', kind: 'sofa_modular', x: 1.0, y: 6.2, elevation: 0, width: 1.0, depth: 2.6, height: 0.78, rotation: 0, materialId: 'wl-shinhan-facade' },
      { id: 'ai2', name: '안방 퀸 침대', kind: 'bed_queen', x: 7.4, y: 6.4, elevation: 0, width: 1.8, depth: 2.0, height: 0.55, rotation: Math.PI, materialId: 'wl-shinhan-facade' },
    ],
  };
}

export function createBlankProject(): FloorProject {
  return {
    id: `blank-${Date.now()}`,
    title: '새 빈 도면',
    areaSqm: 84,
    nodes: [],
    walls: [],
    openings: [],
    roomOverrides: {},
    items: [],
  };
}
