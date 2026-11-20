import { create } from 'zustand';
import {
  InteriorObject,
  MaterialCategory,
  MaterialSpec,
  ObjectKind,
  OpeningKind,
  ProjectData,
  RoomKind,
  SelectionRef,
  ToolMode,
} from '../types/studio';
import { createShowcase34Plan } from '../data/starterTemplates';

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

interface ProjectStore {
  hasActiveProject: boolean;
  project: ProjectData;
  past: ProjectData[];
  future: ProjectData[];

  viewMode: 'split' | '2d' | '3d';
  autoSync3D: boolean;
  hasPending3DChanges: boolean;
  render3DVersion: number;

  selection: SelectionRef;
  activeCategory: MaterialCategory;
  toolMode: ToolMode;
  showCeiling: boolean;
  showDimensions: boolean;
  lightingMood: 'day' | 'sunset' | 'night';
  cameraPreset: 'iso' | 'living' | 'kitchen' | 'master' | 'first_person';

  underlayImage: string | null;
  underlayOpacity: number;
  subscriptionTier: 'free' | 'pro';
  toast: string | null;

  // Navigation & Project Lifecycle
  openProject: (data: ProjectData) => void;
  goHome: () => void;
  setViewMode: (m: 'split' | '2d' | '3d') => void;
  setAutoSync3D: (auto: boolean) => void;
  commit3DUpdate: () => void;
  setSelection: (sel: SelectionRef) => void;
  setActiveCategory: (cat: MaterialCategory) => void;
  setToolMode: (tool: ToolMode) => void;
  setShowCeiling: (show: boolean) => void;
  setShowDimensions: (show: boolean) => void;
  setLightingMood: (mood: 'day' | 'sunset' | 'night') => void;
  setCameraPreset: (preset: 'iso' | 'living' | 'kitchen' | 'master' | 'first_person') => void;
  setUnderlayImage: (url: string | null) => void;
  setUnderlayOpacity: (op: number) => void;
  setUnderlayAspectSize: (naturalW: number, naturalH: number) => void;
  applyScaleCalibration: (factor: number) => void;
  notify: (msg: string) => void;

  // 2D & 3D Mutations
  addRoom: (name: string, kind: RoomKind, polygon: { x: number; y: number }[]) => void;
  deleteRoom: (roomId: string) => void;
  addWall: (x1: number, y1: number, x2: number, y2: number) => void;
  deleteWall: (wallId: string) => void;
  moveWallEndpoint: (wallId: string, end: 'start' | 'end', x: number, y: number) => void;
  resizeWallLength: (wallId: string, newLengthMm: number) => void;
  addOpening: (wallId: string, kind: OpeningKind, offset: number) => void;
  deleteOpening: (id: string) => void;
  toggleBlind: (openingId: string) => void;

  addObject: (kind: ObjectKind, x: number, y: number, wallId?: string, offset?: number) => void;
  moveObject: (id: string, x: number, y: number) => void;
  rotateObject: (id: string, deltaRad?: number) => void;
  duplicateSelectedObject: () => void;
  deleteSelected: () => void;
  toggleObjectPower: (id: string) => void;
  setObjectVariant: (id: string, variant: string) => void;
  deleteObject: (id: string) => void;

  updateRoom: (
    roomId: string,
    patch: Partial<{
      name: string;
      kind: RoomKind;
      ceilingType: 'well_cove' | 'flat';
      coveLightOn: boolean;
      coveKelvin: '3000K' | '4000K' | '5700K';
    }>
  ) => void;

  applyMaterial: (mat: MaterialSpec) => void;
  applyMaterialToAll: (mat: MaterialSpec) => void;
  undo: () => void;
  redo: () => void;
}

const defaultShowcase = createShowcase34Plan();

export const useProjectStore = create<ProjectStore>((set, get) => ({
  hasActiveProject: false,
  project: clone(defaultShowcase),
  past: [],
  future: [],

  viewMode: 'split',
  autoSync3D: true,
  hasPending3DChanges: false,
  render3DVersion: 1,

  selection: null,
  activeCategory: 'floor',
  toolMode: 'select',
  showCeiling: true,
  showDimensions: true,
  lightingMood: 'day',
  cameraPreset: 'iso',

  underlayImage: null,
  underlayOpacity: 0.8,
  subscriptionTier: 'free',
  toast: null,

  notify: (msg) => {
    set({ toast: msg });
    setTimeout(() => {
      if (get().toast === msg) set({ toast: null });
    }, 3000);
  },

  openProject: (data) => {
    set((s) => ({
      hasActiveProject: true,
      project: clone(data),
      past: [],
      future: [],
      selection: null,
      toolMode: 'select',
      hasPending3DChanges: false,
      render3DVersion: s.render3DVersion + 1,
    }));
  },

  goHome: () => set({ hasActiveProject: false, selection: null, toolMode: 'select' }),
  setViewMode: (viewMode) => set({ viewMode }),
  setAutoSync3D: (autoSync3D) =>
    set((s) => ({
      autoSync3D,
      hasPending3DChanges: autoSync3D ? false : s.hasPending3DChanges,
      render3DVersion: autoSync3D ? s.render3DVersion + 1 : s.render3DVersion,
    })),
  commit3DUpdate: () => {
    set((s) => ({ hasPending3DChanges: false, render3DVersion: s.render3DVersion + 1 }));
    get().notify('2D 도면 수정 사항이 3D 모델에 반영되었습니다.');
  },

  setSelection: (selection) => {
    set({ selection });
    if (!selection) return;
    const { project } = get();
    if (selection.kind === 'room') set({ activeCategory: 'floor' });
    else if (selection.kind === 'wall') set({ activeCategory: 'wall' });
    else if (selection.kind === 'opening') set({ activeCategory: 'film' });
    else if (selection.kind === 'object') {
      const obj = project.objects.find((o) => o.id === selection.id);
      if (!obj) return;
      if (obj.kind === 'outlet_2' || obj.kind === 'switch_2' || obj.kind === 'wallpad' || obj.kind === 'wall_tv') {
        set({ activeCategory: 'electrical' });
      } else if (obj.kind === 'ceiling_fan' || obj.kind === 'downlight') {
        set({ activeCategory: 'lighting' });
      } else if (obj.kind === 'fridge_4door' || obj.kind === 'induction_3') {
        set({ activeCategory: 'appliance' });
      } else {
        set({ activeCategory: 'film' });
      }
    }
  },

  setActiveCategory: (activeCategory) => set({ activeCategory }),
  setToolMode: (toolMode) => set({ toolMode }),
  setShowCeiling: (showCeiling) => set({ showCeiling }),
  setShowDimensions: (showDimensions) => set({ showDimensions }),
  setLightingMood: (lightingMood) => set({ lightingMood }),
  setCameraPreset: (cameraPreset) => set({ cameraPreset }),
  setUnderlayImage: (underlayImage) => set({ underlayImage }),
  setUnderlayOpacity: (underlayOpacity) => set({ underlayOpacity }),

  setUnderlayAspectSize: (naturalW, naturalH) => {
    if (!naturalW || !naturalH) return;
    const { project } = get();
    const baseW = project.underlayWidthM || project.width || 14;
    const nextD = Math.round(((baseW * naturalH) / naturalW) * 100) / 100;
    const next = clone(project);
    next.underlayWidthM = baseW;
    next.underlayDepthM = nextD;
    next.width = Math.max(next.width, baseW);
    next.depth = Math.max(next.depth, nextD);
    set({ project: next });
  },

  applyScaleCalibration: (factor) => {
    if (!Number.isFinite(factor) || factor <= 0.05 || factor > 20) return;
    const { project, past } = get();
    const next = clone(project);
    const curW = next.underlayWidthM || next.width || 14;
    const curD = next.underlayDepthM || next.depth || 10.5;
    next.underlayWidthM = Math.round(curW * factor * 100) / 100;
    next.underlayDepthM = Math.round(curD * factor * 100) / 100;
    next.width = Math.max(next.underlayWidthM, 8);
    next.depth = Math.max(next.underlayDepthM, 6);
    set({ project: next, past: [...past.slice(-24), project], future: [] });
    get().notify(`실측 축척이 보정되었습니다 (밑그림 ${Math.round(next.underlayWidthM * 1000)} × ${Math.round(next.underlayDepthM * 1000)} mm).`);
  },

  addRoom: (name, kind, polygon) => {
    if (polygon.length < 3) return;
    const { project, past } = get();
    const next = clone(project);
    const id = `rm-${Date.now()}`;
    const floorMat =
      kind === 'bath' || kind === 'entrance' || kind === 'balcony'
        ? 'fl-warm-concrete'
        : kind === 'living' || kind === 'kitchen'
        ? 'fl-cream-porcelain'
        : 'fl-natural-oak';
    next.rooms.push({
      id,
      name,
      kind,
      polygon,
      floorMaterialId: floorMat,
      ceilingType: kind === 'living' ? 'well_cove' : 'flat',
      ceilingMaterialId: 'cl-matte-white',
      coveLightOn: kind === 'living',
      coveKelvin: '3000K',
    });
    set({
      project: next,
      past: [...past.slice(-24), project],
      future: [],
      selection: { kind: 'room', id },
    });
    get().notify(`'${name}' 공간이 추가되었습니다.`);
  },

  deleteRoom: (roomId) => {
    const { project, past } = get();
    const next = clone(project);
    next.rooms = next.rooms.filter((r) => r.id !== roomId);
    set({ project: next, past: [...past.slice(-24), project], future: [], selection: null });
  },

  resizeWallLength: (wallId, newLengthMm) => {
    const targetM = Math.max(0.2, newLengthMm / 1000);
    const { project, past } = get();
    const next = clone(project);
    const w = next.walls.find((item) => item.id === wallId);
    if (!w) return;
    const dx = w.x2 - w.x1;
    const dy = w.y2 - w.y1;
    const curLen = Math.hypot(dx, dy);
    if (curLen < 0.01) return;
    const scale = targetM / curLen;
    w.x2 = Math.round((w.x1 + dx * scale) * 100) / 100;
    w.y2 = Math.round((w.y1 + dy * scale) * 100) / 100;
    set({ project: next, past: [...past.slice(-24), project], future: [] });
  },

  duplicateSelectedObject: () => {
    const { selection, project, past } = get();
    if (selection?.kind !== 'object') return;
    const src = project.objects.find((o) => o.id === selection.id);
    if (!src) return;
    const next = clone(project);
    const copy = clone(src);
    copy.id = `obj-${Date.now()}`;
    copy.x = Math.round((src.x + 0.4) * 10) / 10;
    copy.y = Math.round((src.y + 0.4) * 10) / 10;
    next.objects.push(copy);
    set({
      project: next,
      past: [...past.slice(-24), project],
      future: [],
      selection: { kind: 'object', id: copy.id },
    });
    get().notify(`${src.name}이(가) 복제되었습니다.`);
  },

  deleteSelected: () => {
    const { selection } = get();
    if (!selection) return;
    if (selection.kind === 'room') {
      get().deleteRoom(selection.id);
      get().notify('선택한 공간을 삭제했습니다.');
    } else if (selection.kind === 'wall') {
      get().deleteWall(selection.id);
      get().notify('선택한 벽체를 삭제했습니다.');
    } else if (selection.kind === 'opening') {
      get().deleteOpening(selection.id);
      get().notify('선택한 문/창문을 삭제했습니다.');
    } else if (selection.kind === 'object') {
      get().deleteObject(selection.id);
      get().notify('선택한 요소를 삭제했습니다.');
    }
  },

  addWall: (x1, y1, x2, y2) => {
    if (Math.hypot(x2 - x1, y2 - y1) < 0.2) return;
    const { project, past } = get();
    const next = clone(project);
    const id = `w-${Date.now()}`;
    next.walls.push({
      id,
      x1,
      y1,
      x2,
      y2,
      thickness: 0.14,
      height: 2.45,
      isExterior: false,
      frontMaterialId: 'wl-diamang-stucco',
      backMaterialId: 'wl-diamang-stucco',
    });
    set({ project: next, past: [...past.slice(-24), project], future: [], selection: { kind: 'wall', id } });
  },

  deleteWall: (wallId) => {
    const { project, past } = get();
    const next = clone(project);
    next.walls = next.walls.filter((w) => w.id !== wallId);
    next.openings = next.openings.filter((o) => o.wallId !== wallId);
    set({ project: next, past: [...past.slice(-24), project], future: [], selection: null });
  },

  moveWallEndpoint: (wallId, end, x, y) => {
    const { project, past } = get();
    const next = clone(project);
    const w = next.walls.find((item) => item.id === wallId);
    if (!w) return;
    if (end === 'start') {
      w.x1 = x;
      w.y1 = y;
    } else {
      w.x2 = x;
      w.y2 = y;
    }
    set({ project: next, past: [...past.slice(-24), project], future: [] });
  },

  addOpening: (wallId, kind, offset) => {
    const { project, past } = get();
    const next = clone(project);
    const id = `op-${Date.now()}`;
    next.openings.push({
      id,
      wallId,
      kind,
      offset: Math.max(0.1, Math.min(0.9, offset)),
      width: kind === 'window_blind' ? 2.2 : kind === 'sliding_glass_door' ? 1.4 : 0.9,
      height: kind === 'window_blind' ? 1.6 : 2.1,
      sillHeight: kind === 'window_blind' ? 0.6 : 0,
      frameMaterialId: 'fm-walnut-wood',
      hasBlind: kind === 'window_blind',
    });
    set({ project: next, past: [...past.slice(-24), project], future: [], selection: { kind: 'opening', id } });
  },

  deleteOpening: (id) => {
    const { project, past } = get();
    const next = clone(project);
    next.openings = next.openings.filter((o) => o.id !== id);
    set({ project: next, past: [...past.slice(-24), project], future: [], selection: null });
  },

  toggleBlind: (openingId) => {
    const { project, past } = get();
    const next = clone(project);
    const op = next.openings.find((o) => o.id === openingId);
    if (!op) return;
    op.hasBlind = !op.hasBlind;
    set({ project: next, past: [...past.slice(-24), project], future: [] });
  },

  addObject: (kind, x, y) => {
    const { project, past } = get();
    const next = clone(project);
    const id = `obj-${Date.now()}`;
    const presetMap: Record<ObjectKind, Omit<InteriorObject, 'id' | 'x' | 'y'>> = {
      fridge_4door: { name: '키친핏 4도어 냉장고장', kind, elevation: 0, width: 1.6, depth: 0.68, height: 2.3, rotation: 0, materialId: 'ap-bespoke-white' },
      tall_homebar: { name: '홈바 · 키큰장', kind, elevation: 0, width: 1.5, depth: 0.65, height: 2.3, rotation: 0, materialId: 'fm-matte-cream', variant: 'option2' },
      island_counter: { name: '대면형 아일랜드', kind, elevation: 0, width: 2.4, depth: 0.9, height: 0.88, rotation: 0, materialId: 'fm-matte-cream' },
      kitchen_sink: { name: '싱크대', kind, elevation: 0, width: 3.0, depth: 0.65, height: 0.88, rotation: 0, materialId: 'fm-matte-cream' },
      induction_3: { name: '3구 인덕션', kind, elevation: 0.88, width: 0.62, depth: 0.52, height: 0.03, rotation: 0, materialId: 'ap-induction-black' },
      dining_set: { name: '4인 식탁 세트', kind, elevation: 0, width: 1.6, depth: 0.85, height: 0.75, rotation: 0, materialId: 'fl-white-oak' },
      sofa_modular: { name: '모듈 패브릭 소파', kind, elevation: 0, width: 1.05, depth: 2.8, height: 0.78, rotation: 0, materialId: 'wl-warm-beige' },
      bed_queen: { name: '퀸 침대', kind, elevation: 0, width: 1.85, depth: 2.1, height: 0.55, rotation: 0, materialId: 'wl-warm-beige' },
      ceiling_fan: { name: '우드 실링팬', kind, elevation: 2.38, width: 1.3, depth: 1.3, height: 0.28, rotation: 0, materialId: 'lt-fan-wood', on: true },
      downlight: { name: '매립 다운라이트', kind, elevation: 2.42, width: 0.1, depth: 0.1, height: 0.04, rotation: 0, materialId: 'lt-downlight-3k', on: true },
      outlet_2: { name: '2구 콘센트', kind, elevation: 0.42, width: 0.12, depth: 0.02, height: 0.08, rotation: 0, materialId: 'el-legrand-white' },
      switch_2: { name: '2구 스위치', kind, elevation: 1.25, width: 0.09, depth: 0.02, height: 0.12, rotation: 0, materialId: 'el-legrand-white' },
      wallpad: { name: '홈 월패드', kind, elevation: 1.38, width: 0.26, depth: 0.02, height: 0.18, rotation: 0, materialId: 'el-legrand-white' },
      wall_tv: { name: '반매립 OLED TV', kind, elevation: 1.28, width: 1.85, depth: 0.05, height: 1.04, rotation: 0, materialId: 'el-jung-black' },
    };
    const spec = presetMap[kind];
    next.objects.push({ id, x, y, ...spec });
    set({ project: next, past: [...past.slice(-24), project], future: [], selection: { kind: 'object', id } });
    get().notify(`${spec.name}이(가) 배치되었습니다.`);
  },

  moveObject: (id, x, y) => {
    const { project, past } = get();
    const next = clone(project);
    const obj = next.objects.find((o) => o.id === id);
    if (!obj) return;
    obj.x = x;
    obj.y = y;
    set({ project: next, past: [...past.slice(-24), project], future: [] });
  },

  rotateObject: (id, deltaRad = Math.PI / 2) => {
    const { project, past } = get();
    const next = clone(project);
    const obj = next.objects.find((o) => o.id === id);
    if (!obj) return;
    obj.rotation = (obj.rotation + deltaRad) % (Math.PI * 2);
    set({ project: next, past: [...past.slice(-24), project], future: [] });
  },

  toggleObjectPower: (id) => {
    const { project, past } = get();
    const next = clone(project);
    const obj = next.objects.find((o) => o.id === id);
    if (!obj) return;
    obj.on = !obj.on;
    set({ project: next, past: [...past.slice(-24), project], future: [] });
  },

  setObjectVariant: (id, variant) => {
    const { project, past } = get();
    const next = clone(project);
    const obj = next.objects.find((o) => o.id === id);
    if (!obj) return;
    obj.variant = variant;
    set({ project: next, past: [...past.slice(-24), project], future: [] });
    get().notify('빌트인 옵션이 전환되었습니다.');
  },

  deleteObject: (id) => {
    const { project, past } = get();
    const next = clone(project);
    next.objects = next.objects.filter((o) => o.id !== id);
    set({ project: next, past: [...past.slice(-24), project], future: [], selection: null });
  },

  updateRoom: (roomId, patch) => {
    const { project, past } = get();
    const next = clone(project);
    const rm = next.rooms.find((r) => r.id === roomId);
    if (!rm) return;
    Object.assign(rm, patch);
    set({ project: next, past: [...past.slice(-24), project], future: [] });
  },

  applyMaterial: (mat) => {
    const { selection, project, past } = get();
    if (!selection) {
      get().notify('먼저 3D 또는 2D에서 적용할 영역(바닥 · 벽 · 창틀 · 콘센트 · 가전)을 클릭하세요.');
      return;
    }
    const next = clone(project);

    if (selection.kind === 'room') {
      const rm = next.rooms.find((r) => r.id === selection.id);
      if (!rm) return;
      if (mat.category === 'floor') rm.floorMaterialId = mat.id;
      else if (mat.category === 'ceiling') rm.ceilingMaterialId = mat.id;
      else {
        get().notify('선택된 방에는 바닥재 또는 천장재를 적용할 수 있습니다.');
        return;
      }
    } else if (selection.kind === 'wall') {
      const w = next.walls.find((item) => item.id === selection.id);
      if (!w) return;
      if (mat.category === 'wall' || mat.category === 'film') {
        if (selection.side === 'back') w.backMaterialId = mat.id;
        else if (selection.side === 'front') w.frontMaterialId = mat.id;
        else {
          w.frontMaterialId = mat.id;
          w.backMaterialId = mat.id;
        }
      } else {
        get().notify('벽면에는 벽지 · 월판넬 · 인테리어 필름을 적용하세요.');
        return;
      }
    } else if (selection.kind === 'opening') {
      const op = next.openings.find((o) => o.id === selection.id);
      if (!op) return;
      if (mat.category === 'film') op.frameMaterialId = mat.id;
      else {
        get().notify('문/창틀에는 인테리어 필름 카테고리를 선택하세요.');
        return;
      }
    } else if (selection.kind === 'object') {
      const obj = next.objects.find((o) => o.id === selection.id);
      if (!obj) return;
      obj.materialId = mat.id;
    }

    set({ project: next, past: [...past.slice(-24), project], future: [] });
    get().notify(`${mat.brand} "${mat.name}" 적용 완료`);
  },

  applyMaterialToAll: (mat) => {
    const { project, past } = get();
    const next = clone(project);
    if (mat.category === 'floor') {
      next.rooms.forEach((r) => {
        if (r.kind !== 'bath' && r.kind !== 'entrance') r.floorMaterialId = mat.id;
      });
    } else if (mat.category === 'wall') {
      next.walls.forEach((w) => {
        w.frontMaterialId = mat.id;
        w.backMaterialId = mat.id;
      });
    } else if (mat.category === 'film') {
      next.openings.forEach((o) => {
        o.frameMaterialId = mat.id;
      });
    } else if (mat.category === 'electrical') {
      next.objects.forEach((o) => {
        if (o.kind === 'outlet_2' || o.kind === 'switch_2' || o.kind === 'wallpad') {
          o.materialId = mat.id;
        }
      });
    }
    set({ project: next, past: [...past.slice(-24), project], future: [] });
    get().notify(`전체 공간에 "${mat.name}" 일괄 적용 완료`);
  },

  undo: () => {
    const { past, future, project } = get();
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    set({ project: prev, past: past.slice(0, -1), future: [project, ...future] });
  },

  redo: () => {
    const { past, future, project } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({ project: next, past: [...past, project], future: future.slice(1) });
  },
}));

let prevProjectRef = useProjectStore.getState().project;
useProjectStore.subscribe((state) => {
  if (state.project !== prevProjectRef) {
    prevProjectRef = state.project;
    if (!state.autoSync3D && !state.hasPending3DChanges) {
      useProjectStore.setState({ hasPending3DChanges: true });
    }
  }
});
