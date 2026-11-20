import { create } from 'zustand';
import {
  BlueprintProject,
  CadTool,
  MaterialCatalogItem,
  MaterialGroup,
  PortalType,
  SceneProp,
  ScenePropType,
  SelectedItem,
  SpaceType,
} from '../types/design';
import { createModelHouse34 } from '../data/presets';

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));

interface DesignState {
  inStudio: boolean;
  draftPlan: BlueprintProject;
  published3DPlan: BlueprintProject;
  hasPending3DUpdate: boolean;
  past: BlueprintProject[];
  future: BlueprintProject[];

  workspaceView: 'split' | '2d' | '3d';
  tool: CadTool;
  selection: SelectedItem;
  activeGroup: MaterialGroup;
  showDimensions: boolean;
  showCeiling: boolean;
  cameraView: 'iso' | 'living' | 'kitchen' | 'master' | 'walk';

  underlayUrl: string | null;
  underlayOpacity: number;
  underlaySize: { w: number; d: number };
  toast: string | null;

  // Navigation & Sync
  openBlueprint: (plan: BlueprintProject) => void;
  goHome: () => void;
  setWorkspaceView: (v: 'split' | '2d' | '3d') => void;
  setTool: (t: CadTool) => void;
  setSelection: (s: SelectedItem) => void;
  setActiveGroup: (g: MaterialGroup) => void;
  setShowDimensions: (b: boolean) => void;
  setShowCeiling: (b: boolean) => void;
  setCameraView: (c: 'iso' | 'living' | 'kitchen' | 'master' | 'walk') => void;
  setUnderlayUrl: (url: string | null) => void;
  setUnderlayOpacity: (op: number) => void;
  setUnderlayAspect: (nw: number, nh: number) => void;
  calibrateUnderlayScale: (factor: number) => void;
  commit3DUpdate: () => void;
  notify: (msg: string) => void;

  // 2D Draft Edits (require 3D Update button)
  addSpace: (name: string, type: SpaceType, x: number, y: number, w: number, d: number) => void;
  renameSpace: (id: string, name: string) => void;
  addWall: (x1: number, y1: number, x2: number, y2: number) => void;
  moveWallEnd: (wallId: string, end: 'start' | 'end', x: number, y: number) => void;
  setWallDisplayMm: (wallId: string, mm: number) => void;
  addOpening: (wallId: string, type: PortalType, offset: number) => void;
  addProp: (type: ScenePropType, x: number, y: number) => void;
  moveProp: (id: string, x: number, y: number) => void;
  rotateProp: (id: string) => void;
  duplicateSelected: () => void;
  deleteSelected: () => void;

  // 3D Instant Material & Option Edits (sync to both 3D & 2D immediately)
  applyMaterial: (mat: MaterialCatalogItem) => void;
  applyMaterialToAll: (mat: MaterialCatalogItem) => void;
  toggleSpaceCove: (spaceId: string) => void;
  toggleSpaceCeilingType: (spaceId: string) => void;
  toggleBlind: (openingId: string) => void;
  togglePropPower: (propId: string) => void;
  setPropVariant: (propId: string, variant: 'option1' | 'option2') => void;

  undo: () => void;
  redo: () => void;
}

const initialModel = createModelHouse34();

export const useDesignStore = create<DesignState>((set, get) => ({
  inStudio: false,
  draftPlan: clone(initialModel),
  published3DPlan: clone(initialModel),
  hasPending3DUpdate: false,
  past: [],
  future: [],

  workspaceView: 'split',
  tool: 'select',
  selection: null,
  activeGroup: 'floor',
  showDimensions: true,
  showCeiling: false,
  cameraView: 'iso',

  underlayUrl: null,
  underlayOpacity: 0.75,
  underlaySize: { w: 14, d: 10.5 },
  toast: null,

  notify: (msg) => {
    set({ toast: msg });
    setTimeout(() => {
      if (get().toast === msg) set({ toast: null });
    }, 3000);
  },

  openBlueprint: (plan) => {
    const c = clone(plan);
    set({
      inStudio: true,
      draftPlan: c,
      published3DPlan: clone(c),
      hasPending3DUpdate: false,
      past: [],
      future: [],
      selection: null,
      tool: 'select',
    });
  },

  goHome: () => set({ inStudio: false, selection: null, tool: 'select' }),
  setWorkspaceView: (workspaceView) => set({ workspaceView }),
  setTool: (tool) => set({ tool }),
  setShowDimensions: (showDimensions) => set({ showDimensions }),
  setShowCeiling: (showCeiling) => set({ showCeiling }),
  setCameraView: (cameraView) => set({ cameraView, showCeiling: cameraView !== 'iso' }),
  setActiveGroup: (activeGroup) => set({ activeGroup }),
  setUnderlayUrl: (underlayUrl) => set({ underlayUrl }),
  setUnderlayOpacity: (underlayOpacity) => set({ underlayOpacity }),

  setUnderlayAspect: (nw, nh) => {
    if (!nw || !nh) return;
    const baseW = get().underlaySize.w || 14;
    const nextD = Math.round(((baseW * nh) / nw) * 100) / 100;
    set({ underlaySize: { w: baseW, d: nextD } });
  },

  calibrateUnderlayScale: (factor) => {
    if (!Number.isFinite(factor) || factor < 0.1 || factor > 10) return;
    const cur = get().underlaySize;
    const next = {
      w: Math.round(cur.w * factor * 100) / 100,
      d: Math.round(cur.d * factor * 100) / 100,
    };
    set({ underlaySize: next });
    get().notify(
      `실측 축척이 적용되었습니다 (${Math.round(next.w * 1000)} × ${Math.round(next.d * 1000)} mm)`
    );
  },

  commit3DUpdate: () => {
    const { draftPlan } = get();
    set({
      published3DPlan: clone(draftPlan),
      hasPending3DUpdate: false,
    });
    get().notify('2D 도면 변경 사항이 3D 스튜디오에 반영되었습니다.');
  },

  setSelection: (selection) => {
    set({ selection });
    if (!selection) return;
    const p = get().draftPlan;
    if (selection.kind === 'space') {
      const sp = p.spaces.find((s) => s.id === selection.id);
      set({ activeGroup: sp?.type === 'bath' || sp?.type === 'entrance' ? 'tile' : 'floor' });
    } else if (selection.kind === 'wall') {
      set({ activeGroup: 'wall' });
    } else if (selection.kind === 'opening') {
      set({ activeGroup: 'film' });
    } else if (selection.kind === 'prop') {
      const pr = p.props.find((x) => x.id === selection.id);
      if (!pr) return;
      if (pr.type === 'outlet_2' || pr.type === 'switch_2' || pr.type === 'wallpad' || pr.type === 'wall_tv') {
        set({ activeGroup: 'electrical' });
      } else if (pr.type === 'ceiling_fan' || pr.type === 'downlight') {
        set({ activeGroup: 'lighting' });
      } else if (pr.type === 'fridge_4door' || pr.type === 'induction_3') {
        set({ activeGroup: 'appliance' });
      } else {
        set({ activeGroup: 'film' });
      }
    }
  },

  addSpace: (name, type, x, y, width, depth) => {
    const { draftPlan, past } = get();
    const next = clone(draftPlan);
    const id = `sp-${Date.now()}`;
    const floorMaterialId =
      type === 'bath' || type === 'entrance' || type === 'balcony'
        ? 'tl-yun-gray800'
        : type === 'living' || type === 'kitchen'
        ? 'tl-yun-cream600'
        : 'fl-dongwha-max';
    next.spaces.push({
      id,
      name,
      type,
      x,
      y,
      width,
      depth,
      floorMaterialId,
      ceilingType: type === 'living' ? 'well_cove' : 'flat',
      ceilingMaterialId: 'cl-lx-matte',
      coveLightOn: type === 'living',
      coveKelvin: '3000K',
    });
    set({
      draftPlan: next,
      past: [...past.slice(-24), draftPlan],
      future: [],
      hasPending3DUpdate: true,
      selection: { kind: 'space', id },
    });
  },

  renameSpace: (id, name) => {
    const { draftPlan, past } = get();
    const next = clone(draftPlan);
    const sp = next.spaces.find((s) => s.id === id);
    if (!sp) return;
    sp.name = name;
    set({ draftPlan: next, past: [...past.slice(-24), draftPlan], future: [], hasPending3DUpdate: true });
  },

  addWall: (x1, y1, x2, y2) => {
    if (Math.hypot(x2 - x1, y2 - y1) < 0.2) return;
    const { draftPlan, past } = get();
    const next = clone(draftPlan);
    const id = `w-${Date.now()}`;
    next.walls.push({
      id,
      x1,
      y1,
      x2,
      y2,
      thickness: 0.16,
      height: 2.45,
      isExterior: false,
      materialId: 'wl-lx-diamang-cream',
    });
    set({
      draftPlan: next,
      past: [...past.slice(-24), draftPlan],
      future: [],
      hasPending3DUpdate: true,
      selection: { kind: 'wall', id },
    });
  },

  moveWallEnd: (wallId, end, x, y) => {
    const { draftPlan, past } = get();
    const next = clone(draftPlan);
    const w = next.walls.find((item) => item.id === wallId);
    if (!w) return;
    if (end === 'start') {
      w.x1 = x;
      w.y1 = y;
    } else {
      w.x2 = x;
      w.y2 = y;
    }
    set({ draftPlan: next, past: [...past.slice(-24), draftPlan], future: [], hasPending3DUpdate: true });
  },

  setWallDisplayMm: (wallId, mm) => {
    const { draftPlan, past } = get();
    const next = clone(draftPlan);
    const w = next.walls.find((item) => item.id === wallId);
    if (!w) return;
    w.displayMm = Math.round(mm);
    set({ draftPlan: next, past: [...past.slice(-24), draftPlan], future: [] });
    get().notify(`치수 표기를 ${w.displayMm}mm로 변경했습니다.`);
  },

  addOpening: (wallId, type, offset) => {
    const { draftPlan, past } = get();
    const next = clone(draftPlan);
    const id = `op-${Date.now()}`;
    next.openings.push({
      id,
      wallId,
      type,
      offset: Math.max(0.1, Math.min(0.9, offset)),
      width: type === 'window_blind' ? 2.2 : type === 'sliding_glass' ? 1.4 : 0.9,
      height: type === 'window_blind' ? 1.6 : 2.1,
      sillHeight: type === 'window_blind' ? 0.6 : 0,
      frameMaterialId: 'fm-bodac-walnut',
      hasBlind: type === 'window_blind',
    });
    set({
      draftPlan: next,
      past: [...past.slice(-24), draftPlan],
      future: [],
      hasPending3DUpdate: true,
      selection: { kind: 'opening', id },
    });
  },

  addProp: (type, x, y) => {
    const { draftPlan, past } = get();
    const next = clone(draftPlan);
    const id = `pr-${Date.now()}`;
    const map: Record<ScenePropType, Omit<SceneProp, 'id' | 'x' | 'y'>> = {
      fridge_4door: { label: '비스포크 4도어 냉장고장', type, elevation: 0, width: 1.6, depth: 0.68, height: 2.3, rotation: 0, materialId: 'ap-bespoke-white' },
      tall_homebar: { label: '홈바 · 키큰장', type, elevation: 0, width: 1.55, depth: 0.65, height: 2.3, rotation: 0, materialId: 'fm-lx-benif-cream', variant: 'option2' },
      island_counter: { label: '대면형 아일랜드', type, elevation: 0, width: 2.6, depth: 0.9, height: 0.88, rotation: 0, materialId: 'fm-lx-benif-cream' },
      kitchen_sink: { label: '싱크대', type, elevation: 0, width: 3.2, depth: 0.65, height: 0.88, rotation: 0, materialId: 'fm-lx-benif-cream' },
      induction_3: { label: '3구 인덕션', type, elevation: 0.88, width: 0.62, depth: 0.52, height: 0.03, rotation: 0, materialId: 'ap-bespoke-induction' },
      dining_set: { label: '4인 식탁 세트', type, elevation: 0, width: 1.65, depth: 0.88, height: 0.75, rotation: 0, materialId: 'fl-dongwha-max' },
      sofa_modular: { label: '모듈 패브릭 소파', type, elevation: 0, width: 1.05, depth: 3.0, height: 0.78, rotation: 0, materialId: 'wl-shinhan-facade' },
      bed_queen: { label: '퀸 침대', type, elevation: 0, width: 1.85, depth: 2.1, height: 0.55, rotation: 0, materialId: 'wl-shinhan-facade' },
      ceiling_fan: { label: '루씨에어 실링팬', type, elevation: 2.38, width: 1.32, depth: 1.32, height: 0.28, rotation: 0, materialId: 'lt-lucci-wood', powerOn: true },
      downlight: { label: '매립 다운라이트', type, elevation: 2.42, width: 0.1, depth: 0.1, height: 0.04, rotation: 0, materialId: 'lt-philips-2inch', powerOn: true },
      outlet_2: { label: '2구 콘센트', type, elevation: 0.42, width: 0.12, depth: 0.02, height: 0.08, rotation: 0, materialId: 'el-legrand-white' },
      switch_2: { label: '2구 스위치', type, elevation: 1.25, width: 0.09, depth: 0.02, height: 0.12, rotation: 0, materialId: 'el-legrand-white' },
      wallpad: { label: '홈 월패드', type, elevation: 1.38, width: 0.26, depth: 0.02, height: 0.18, rotation: 0, materialId: 'el-legrand-white' },
      wall_tv: { label: '반매립 OLED TV', type, elevation: 1.28, width: 1.85, depth: 0.05, height: 1.04, rotation: 0, materialId: 'el-jung-black' },
    };
    const spec = map[type];
    next.props.push({ id, x, y, ...spec });
    set({
      draftPlan: next,
      past: [...past.slice(-24), draftPlan],
      future: [],
      hasPending3DUpdate: true,
      selection: { kind: 'prop', id },
    });
  },

  moveProp: (id, x, y) => {
    const { draftPlan, past } = get();
    const next = clone(draftPlan);
    const pr = next.props.find((p) => p.id === id);
    if (!pr) return;
    pr.x = x;
    pr.y = y;
    set({ draftPlan: next, past: [...past.slice(-24), draftPlan], future: [], hasPending3DUpdate: true });
  },

  rotateProp: (id) => {
    const { draftPlan, past } = get();
    const next = clone(draftPlan);
    const pr = next.props.find((p) => p.id === id);
    if (!pr) return;
    pr.rotation = (pr.rotation + Math.PI / 2) % (Math.PI * 2);
    set({ draftPlan: next, past: [...past.slice(-24), draftPlan], future: [], hasPending3DUpdate: true });
  },

  duplicateSelected: () => {
    const { selection, draftPlan, past } = get();
    if (selection?.kind !== 'prop') return;
    const src = draftPlan.props.find((p) => p.id === selection.id);
    if (!src) return;
    const next = clone(draftPlan);
    const copy = clone(src);
    copy.id = `pr-${Date.now()}`;
    copy.x = Math.round((src.x + 0.4) * 10) / 10;
    copy.y = Math.round((src.y + 0.4) * 10) / 10;
    next.props.push(copy);
    set({
      draftPlan: next,
      past: [...past.slice(-24), draftPlan],
      future: [],
      hasPending3DUpdate: true,
      selection: { kind: 'prop', id: copy.id },
    });
  },

  deleteSelected: () => {
    const { selection, draftPlan, past } = get();
    if (!selection) return;
    const next = clone(draftPlan);
    if (selection.kind === 'space') {
      next.spaces = next.spaces.filter((s) => s.id !== selection.id);
    } else if (selection.kind === 'wall') {
      next.walls = next.walls.filter((w) => w.id !== selection.id);
      next.openings = next.openings.filter((o) => o.wallId !== selection.id);
    } else if (selection.kind === 'opening') {
      next.openings = next.openings.filter((o) => o.id !== selection.id);
    } else if (selection.kind === 'prop') {
      next.props = next.props.filter((p) => p.id !== selection.id);
    }
    set({
      draftPlan: next,
      past: [...past.slice(-24), draftPlan],
      future: [],
      hasPending3DUpdate: true,
      selection: null,
    });
    get().notify('선택한 항목을 삭제했습니다. ([3D Update]로 3D에 반영)');
  },

  // 3D Instant Material Application (syncs to both 3D & 2D immediately)
  applyMaterial: (mat) => {
    const { selection, draftPlan, published3DPlan, past } = get();
    if (!selection) {
      get().applyMaterialToAll(mat);
      return;
    }

    const applyOnPlan = (plan: BlueprintProject) => {
      const next = clone(plan);
      if (selection.kind === 'space') {
        const sp = next.spaces.find((s) => s.id === selection.id);
        if (sp) {
          if (mat.group === 'floor' || mat.group === 'tile') sp.floorMaterialId = mat.id;
          else if (mat.group === 'ceiling') sp.ceilingMaterialId = mat.id;
          else if (mat.group === 'wall') {
            next.walls.forEach((w) => {
              const mx = (w.x1 + w.x2) / 2;
              const my = (w.y1 + w.y2) / 2;
              if (mx >= sp.x - 0.3 && mx <= sp.x + sp.width + 0.3 && my >= sp.y - 0.3 && my <= sp.y + sp.depth + 0.3) {
                w.materialId = mat.id;
              }
            });
          } else if (mat.group === 'film') {
            next.openings.forEach((o) => (o.frameMaterialId = mat.id));
          }
        }
      } else if (selection.kind === 'wall') {
        const w = next.walls.find((x) => x.id === selection.id);
        if (w && (mat.group === 'wall' || mat.group === 'film' || mat.group === 'tile')) {
          w.materialId = mat.id;
        }
      } else if (selection.kind === 'opening') {
        const op = next.openings.find((o) => o.id === selection.id);
        if (op && mat.group === 'film') op.frameMaterialId = mat.id;
      } else if (selection.kind === 'prop') {
        const pr = next.props.find((p) => p.id === selection.id);
        if (pr) pr.materialId = mat.id;
      }
      return next;
    };

    set({
      draftPlan: applyOnPlan(draftPlan),
      published3DPlan: applyOnPlan(published3DPlan),
      past: [...past.slice(-24), draftPlan],
      future: [],
    });
    get().notify(`${mat.brand} "${mat.name}" 적용 완료`);
  },

  applyMaterialToAll: (mat) => {
    const { draftPlan, published3DPlan, past } = get();
    const applyAll = (plan: BlueprintProject) => {
      const next = clone(plan);
      if (mat.group === 'floor' || mat.group === 'tile') {
        next.spaces.forEach((s) => {
          if (mat.group === 'tile' || (s.type !== 'bath' && s.type !== 'entrance')) {
            s.floorMaterialId = mat.id;
          }
        });
      } else if (mat.group === 'wall') {
        next.walls.forEach((w) => (w.materialId = mat.id));
      } else if (mat.group === 'ceiling') {
        next.spaces.forEach((s) => (s.ceilingMaterialId = mat.id));
      } else if (mat.group === 'film') {
        next.openings.forEach((o) => (o.frameMaterialId = mat.id));
      } else if (mat.group === 'electrical') {
        next.props.forEach((p) => {
          if (p.type === 'outlet_2' || p.type === 'switch_2' || p.type === 'wallpad') p.materialId = mat.id;
        });
      } else if (mat.group === 'lighting') {
        next.props.forEach((p) => {
          if (p.type === 'ceiling_fan' || p.type === 'downlight') p.materialId = mat.id;
        });
      } else if (mat.group === 'appliance') {
        next.props.forEach((p) => {
          if (p.type === 'fridge_4door' || p.type === 'induction_3') p.materialId = mat.id;
        });
      }
      return next;
    };

    set({
      draftPlan: applyAll(draftPlan),
      published3DPlan: applyAll(published3DPlan),
      past: [...past.slice(-24), draftPlan],
      future: [],
    });
    get().notify(`전체 공간에 ${mat.brand} "${mat.name}" 일괄 적용`);
  },

  toggleSpaceCove: (spaceId) => {
    const toggle = (plan: BlueprintProject) => {
      const next = clone(plan);
      const sp = next.spaces.find((s) => s.id === spaceId);
      if (sp) sp.coveLightOn = !sp.coveLightOn;
      return next;
    };
    set((s) => ({ draftPlan: toggle(s.draftPlan), published3DPlan: toggle(s.published3DPlan) }));
  },

  toggleSpaceCeilingType: (spaceId) => {
    const toggle = (plan: BlueprintProject) => {
      const next = clone(plan);
      const sp = next.spaces.find((s) => s.id === spaceId);
      if (sp) sp.ceilingType = sp.ceilingType === 'well_cove' ? 'flat' : 'well_cove';
      return next;
    };
    set((s) => ({ draftPlan: toggle(s.draftPlan), published3DPlan: toggle(s.published3DPlan) }));
  },

  toggleBlind: (openingId) => {
    const toggle = (plan: BlueprintProject) => {
      const next = clone(plan);
      const op = next.openings.find((o) => o.id === openingId);
      if (op) op.hasBlind = !op.hasBlind;
      return next;
    };
    set((s) => ({ draftPlan: toggle(s.draftPlan), published3DPlan: toggle(s.published3DPlan) }));
  },

  togglePropPower: (propId) => {
    const toggle = (plan: BlueprintProject) => {
      const next = clone(plan);
      const pr = next.props.find((p) => p.id === propId);
      if (pr) pr.powerOn = !pr.powerOn;
      return next;
    };
    set((s) => ({ draftPlan: toggle(s.draftPlan), published3DPlan: toggle(s.published3DPlan) }));
  },

  setPropVariant: (propId, variant) => {
    const update = (plan: BlueprintProject) => {
      const next = clone(plan);
      const pr = next.props.find((p) => p.id === propId);
      if (pr) pr.variant = variant;
      return next;
    };
    set((s) => ({ draftPlan: update(s.draftPlan), published3DPlan: update(s.published3DPlan) }));
    get().notify(variant === 'option1' ? '1번: 오픈 장식장 + 홈바 적용' : '2번: 와이드 홈바장 적용');
  },

  undo: () => {
    const { past, future, draftPlan } = get();
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    set({
      draftPlan: prev,
      past: past.slice(0, -1),
      future: [draftPlan, ...future],
      hasPending3DUpdate: true,
    });
  },

  redo: () => {
    const { past, future, draftPlan } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({
      draftPlan: next,
      past: [...past, draftPlan],
      future: future.slice(1),
      hasPending3DUpdate: true,
    });
  },
}));
