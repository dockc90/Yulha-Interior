import { create } from 'zustand';
import {
  CameraPreset,
  CeilingType,
  DoorSwing,
  EditorTool,
  FloorPlanTemplate,
  KelvinTemp,
  LightFixtureType,
  MaterialItem,
  OpeningType,
  RoomType,
  SelectionTarget,
  ViewMode,
  Wall,
} from '../types/interior';
import { GANGDONG_COMPLEXES } from '../data/gangdongApartments';

interface PlanSnapshot {
  walls: Wall[];
  rooms: FloorPlanTemplate['rooms'];
  lights: FloorPlanTemplate['lights'];
  furniture: FloorPlanTemplate['furniture'];
}

interface StudioState {
  hasSelectedPlan: boolean;
  plan: FloorPlanTemplate;
  past: PlanSnapshot[];
  future: PlanSnapshot[];

  selection: SelectionTarget;
  activeMaterialCategory: MaterialItem['category'];
  editorTool: EditorTool;
  viewMode: ViewMode;
  cameraPreset: CameraPreset;
  lightingMode: 'day' | 'night';
  showFurniture: boolean;
  showDimensions: boolean;
  showCeilingIn3D: boolean;
  underlayImage: string | null;
  underlayOpacity: number;
  toastMessage: string | null;

  // Actions
  loadPlanTemplate: (template: FloorPlanTemplate) => void;
  addOptionVariantToCurrentPlan: (label: string, variantPlan: FloorPlanTemplate) => void;
  selectOptionVariant: (optionId: string) => void;
  goHome: () => void;
  selectTarget: (target: SelectionTarget) => void;
  setActiveMaterialCategory: (cat: MaterialItem['category']) => void;
  setEditorTool: (tool: EditorTool) => void;
  setViewMode: (mode: ViewMode) => void;
  setCameraPreset: (preset: CameraPreset) => void;
  setLightingMode: (mode: 'day' | 'night') => void;
  setShowFurniture: (show: boolean) => void;
  setShowDimensions: (show: boolean) => void;
  setShowCeilingIn3D: (show: boolean) => void;
  setUnderlayImage: (url: string | null) => void;
  setUnderlayOpacity: (op: number) => void;
  showToast: (msg: string) => void;

  // Coupled 2D <-> 3D mutations
  applyMaterial: (mat: MaterialItem) => void;
  applyMaterialToAllRooms: (mat: MaterialItem) => void;
  toggleDemolishWall: (wallId: string, force?: boolean) => void;
  toggleExtendedMode: () => void;
  addWall: (x1: number, y1: number, x2: number, y2: number) => void;
  deleteWall: (wallId: string) => void;
  moveWallEndpoint: (
    wallId: string,
    end: 'start' | 'end',
    x: number,
    y: number
  ) => void;
  resizeWallLength: (wallId: string, newLengthMm: number) => void;
  resizeFurniture: (id: string, widthMm: number, depthMm: number) => void;
  addOpeningToWall: (wallId: string, type: OpeningType, offset: number) => void;
  flipOpeningSwing: (wallId: string, openingId: string) => void;
  deleteOpening: (wallId: string, openingId: string) => void;
  renameRoom: (roomId: string, name: string, type?: RoomType) => void;
  setRoomFloorDirection: (
    roomId: string,
    direction: 'horizontal' | 'vertical'
  ) => void;
  setRoomCeiling: (
    roomId: string,
    patch: Partial<{
      ceilingType: CeilingType;
      ceilingMaterialId: string;
      indirectLightColor: KelvinTemp;
      indirectLightOn: boolean;
    }>
  ) => void;
  addLightFixture: (roomId: string, type: LightFixtureType, x: number, y: number) => void;
  toggleLight: (lightId: string) => void;
  deleteLight: (lightId: string) => void;
  moveFurniture: (id: string, x: number, y: number) => void;
  applyThemeMaterials: (config: {
    wallMaterialId: string;
    floorMaterialId: string;
    filmMaterialId: string;
    ceilingMaterialId: string;
    ceilingType: CeilingType;
    kelvin: KelvinTemp;
  }) => void;

  undo: () => void;
  redo: () => void;
  resetPlan: () => void;
}

const clonePlan = (t: FloorPlanTemplate): FloorPlanTemplate =>
  JSON.parse(JSON.stringify(t));

const takeSnapshot = (plan: FloorPlanTemplate): PlanSnapshot => ({
  walls: JSON.parse(JSON.stringify(plan.walls)),
  rooms: JSON.parse(JSON.stringify(plan.rooms)),
  lights: JSON.parse(JSON.stringify(plan.lights)),
  furniture: JSON.parse(JSON.stringify(plan.furniture)),
});

const initialTemplate = GANGDONG_COMPLEXES[0].plans[0];

export const useStudioStore = create<StudioState>((set, get) => ({
  hasSelectedPlan: false,
  plan: clonePlan(initialTemplate),
  past: [],
  future: [],

  selection: { kind: 'room', id: initialTemplate.rooms[1]?.id || 'room-living' },
  activeMaterialCategory: 'floor',
  editorTool: 'select',
  viewMode: 'split',
  cameraPreset: 'iso',
  lightingMode: 'day',
  showFurniture: true,
  showDimensions: true,
  showCeilingIn3D: false,
  underlayImage: null,
  underlayOpacity: 0.4,
  toastMessage: null,

  showToast: (msg) => {
    set({ toastMessage: msg });
    setTimeout(() => {
      if (get().toastMessage === msg) {
        set({ toastMessage: null });
      }
    }, 3200);
  },

  loadPlanTemplate: (template) => {
    const cloned = clonePlan(template);
    if (!cloned.optionVariants || cloned.optionVariants.length === 0) {
      const baseOnly = clonePlan(cloned);
      cloned.optionVariants = [{ id: 'base', label: '기본 도면', plan: baseOnly }];
      cloned.activeOptionId = 'base';
    }
    set({
      hasSelectedPlan: true,
      plan: cloned,
      past: [],
      future: [],
      selection: cloned.rooms[1]
        ? { kind: 'room', id: cloned.rooms[1].id }
        : null,
      cameraPreset: 'iso',
    });
    get().showToast(`${template.complexName} ${template.typeName} 도면을 불러왔습니다.`);
  },

  addOptionVariantToCurrentPlan: (label, variantPlan) => {
    const { plan } = get();
    const currentVariants =
      plan.optionVariants && plan.optionVariants.length > 0
        ? plan.optionVariants.map((v) =>
            v.id === (plan.activeOptionId || 'base')
              ? { ...v, plan: clonePlan({ ...plan, optionVariants: undefined, activeOptionId: undefined }) }
              : v
          )
        : [
            {
              id: 'base',
              label: '기본 도면',
              plan: clonePlan({ ...plan, optionVariants: undefined, activeOptionId: undefined }),
            },
          ];

    const newOptId = `opt-${Date.now()}`;
    const cleanVariant = clonePlan({
      ...variantPlan,
      complexName: plan.complexName,
      optionVariants: undefined,
      activeOptionId: undefined,
    });
    const nextVariants = [
      ...currentVariants,
      { id: newOptId, label: label.trim() || `옵션 ${currentVariants.length}`, plan: cleanVariant },
    ];

    const nextActivePlan: FloorPlanTemplate = {
      ...clonePlan(cleanVariant),
      optionVariants: nextVariants,
      activeOptionId: newOptId,
    };

    localStorage.setItem('gangdong_interior_saved_plan', JSON.stringify(nextActivePlan));
    set({
      hasSelectedPlan: true,
      plan: nextActivePlan,
      past: [],
      future: [],
      selection: null,
    });
    get().showToast(`'${label}' 옵션 도면이 추가되어 적용되었습니다.`);
  },

  selectOptionVariant: (optionId) => {
    const { plan } = get();
    const variants = plan.optionVariants;
    if (!variants) return;
    const target = variants.find((v) => v.id === optionId);
    if (!target) return;

    // Save any edits made to the currently active variant before switching
    const updatedVariants = variants.map((v) =>
      v.id === (plan.activeOptionId || 'base')
        ? { ...v, plan: clonePlan({ ...plan, optionVariants: undefined, activeOptionId: undefined }) }
        : v
    );
    const targetFresh = updatedVariants.find((v) => v.id === optionId)!;
    const switched: FloorPlanTemplate = {
      ...clonePlan(targetFresh.plan),
      optionVariants: updatedVariants,
      activeOptionId: optionId,
    };

    localStorage.setItem('gangdong_interior_saved_plan', JSON.stringify(switched));
    set({
      plan: switched,
      past: [],
      future: [],
      selection: null,
    });
    get().showToast(`'${targetFresh.label}' 도면으로 전환했습니다.`);
  },

  goHome: () =>
    set({
      hasSelectedPlan: false,
      selection: null,
      editorTool: 'select',
    }),

  selectTarget: (target) => {
    set({ selection: target });
    if (!target) return;
    if (target.kind === 'room') set({ activeMaterialCategory: 'floor' });
    else if (target.kind === 'wall') set({ activeMaterialCategory: 'wallpaper' });
    else if (target.kind === 'opening') set({ activeMaterialCategory: 'film' });
    else if (target.kind === 'ceiling') set({ activeMaterialCategory: 'ceiling' });
    else if (target.kind === 'light') set({ activeMaterialCategory: 'lighting' });
  },

  setActiveMaterialCategory: (cat) => set({ activeMaterialCategory: cat }),
  setEditorTool: (tool) => set({ editorTool: tool }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setCameraPreset: (preset) => set({ cameraPreset: preset }),
  setLightingMode: (mode) => set({ lightingMode: mode }),
  setShowFurniture: (show) => set({ showFurniture: show }),
  setShowDimensions: (show) => set({ showDimensions: show }),
  setShowCeilingIn3D: (show) => set({ showCeilingIn3D: show }),
  setUnderlayImage: (url) => set({ underlayImage: url }),
  setUnderlayOpacity: (op) => set({ underlayOpacity: op }),

  applyMaterial: (mat) => {
    const { selection, plan, past } = get();
    if (!selection) {
      get().showToast('먼저 2D 도면 또는 3D 모델에서 영역(방/벽/문/천장)을 클릭하세요.');
      return;
    }

    const snap = takeSnapshot(plan);
    const next = clonePlan(plan);

    if (mat.category === 'floor') {
      if (selection.kind === 'room') {
        const room = next.rooms.find((r) => r.id === selection.id);
        if (room) room.floorMaterialId = mat.id;
      } else {
        get().showToast('바닥재는 방(거실/침실/주방 등)을 선택한 후 적용하세요.');
        return;
      }
    } else if (mat.category === 'wallpaper') {
      if (selection.kind === 'wall') {
        const wall = next.walls.find((w) => w.id === selection.id);
        if (wall) {
          if (selection.side === 'back') wall.backMaterialId = mat.id;
          else if (selection.side === 'front') wall.frontMaterialId = mat.id;
          else {
            wall.frontMaterialId = mat.id;
            wall.backMaterialId = mat.id;
          }
        }
      } else if (selection.kind === 'room') {
        // Apply wallpaper to walls bounding/near this room
        const room = next.rooms.find((r) => r.id === selection.id);
        if (room) {
          const xs = room.polygon.map((p) => p.x);
          const ys = room.polygon.map((p) => p.y);
          const minX = Math.min(...xs) - 0.15;
          const maxX = Math.max(...xs) + 0.15;
          const minY = Math.min(...ys) - 0.15;
          const maxY = Math.max(...ys) + 0.15;
          next.walls.forEach((w) => {
            const mx = (w.x1 + w.x2) / 2;
            const my = (w.y1 + w.y2) / 2;
            if (mx >= minX && mx <= maxX && my >= minY && my <= maxY) {
              w.frontMaterialId = mat.id;
              w.backMaterialId = mat.id;
            }
          });
        }
      } else {
        get().showToast('도배지는 벽면 또는 방을 선택한 후 적용하세요.');
        return;
      }
    } else if (mat.category === 'film') {
      if (selection.kind === 'opening') {
        const wall = next.walls.find((w) => w.id === selection.wallId);
        const op = wall?.openings.find((o) => o.id === selection.openingId);
        if (op) op.frameMaterialId = mat.id;
      } else if (selection.kind === 'wall') {
        const wall = next.walls.find((w) => w.id === selection.id);
        if (wall) {
          wall.frontMaterialId = mat.id;
          wall.openings.forEach((o) => (o.frameMaterialId = mat.id));
        }
      } else {
        get().showToast('인테리어 필름은 문/창문 프레임 또는 벽면을 선택해 적용하세요.');
        return;
      }
    } else if (mat.category === 'ceiling') {
      const roomId =
        selection.kind === 'ceiling'
          ? selection.roomId
          : selection.kind === 'room'
            ? selection.id
            : null;
      if (roomId) {
        const room = next.rooms.find((r) => r.id === roomId);
        if (room) room.ceilingMaterialId = mat.id;
        set({ showCeilingIn3D: true });
      } else {
        get().showToast('천장 자재는 방 또는 천장을 선택해 적용하세요.');
        return;
      }
    }

    set({
      plan: next,
      past: [...past.slice(-24), snap],
      future: [],
    });
    get().showToast(`${mat.brand} "${mat.name}" 적용 완료 (2D/3D 동기화)`);
  },

  applyMaterialToAllRooms: (mat) => {
    const { plan, past } = get();
    const snap = takeSnapshot(plan);
    const next = clonePlan(plan);

    if (mat.category === 'floor') {
      next.rooms.forEach((r) => {
        if (r.type !== 'bath' && r.type !== 'entrance') {
          r.floorMaterialId = mat.id;
        }
      });
    } else if (mat.category === 'wallpaper') {
      next.walls.forEach((w) => {
        w.frontMaterialId = mat.id;
        w.backMaterialId = mat.id;
      });
    } else if (mat.category === 'film') {
      next.walls.forEach((w) =>
        w.openings.forEach((o) => (o.frameMaterialId = mat.id))
      );
    } else if (mat.category === 'ceiling') {
      next.rooms.forEach((r) => (r.ceilingMaterialId = mat.id));
    }

    set({ plan: next, past: [...past.slice(-24), snap], future: [] });
    get().showToast(`전체 공간에 "${mat.name}" 일괄 적용 완료`);
  },

  toggleDemolishWall: (wallId, force = false) => {
    const { plan, past } = get();
    const wall = plan.walls.find((w) => w.id === wallId);
    if (!wall) return;

    if (wall.isExterior) {
      get().showToast('외벽(발코니 경계)은 안전상 철거할 수 없습니다.');
      return;
    }

    if (wall.isLoadBearing && !wall.demolished && !force) {
      get().showToast(
        '⚠️ 내력벽은 구조 안전상 철거가 불가합니다! 비내력벽(가벽)을 선택해 주세요.'
      );
      return;
    }

    const snap = takeSnapshot(plan);
    const next = clonePlan(plan);
    const target = next.walls.find((w) => w.id === wallId)!;
    target.demolished = !target.demolished;

    set({ plan: next, past: [...past.slice(-24), snap], future: [] });
    get().showToast(
      target.demolished
        ? '벽체 철거 완료 — 2D/3D 공간이 개방되었습니다.'
        : '벽체가 복구되었습니다.'
    );
  },

  toggleExtendedMode: () => {
    const { plan, past } = get();
    const snap = takeSnapshot(plan);
    const next = clonePlan(plan);
    const nextExt = !(next.isExtended ?? true);
    next.isExtended = nextExt;

    next.walls.forEach((w) => {
      if (
        w.id === 'w-bal-living' ||
        w.id === 'w-bal-bed2' ||
        w.id === 'w-bal-bed3'
      ) {
        w.demolished = nextExt;
      }
    });

    const livingFloor =
      next.rooms.find((r) => r.type === 'living')?.floorMaterialId ||
      'fl-dongwha-sahara-wide';
    const bedFloor =
      next.rooms.find((r) => r.type === 'bedroom')?.floorMaterialId ||
      'fl-kujung-natural-oak';

    next.rooms.forEach((r) => {
      if (r.id === 'room-bal-living') {
        r.name = nextExt ? '' : '발코니';
        r.floorMaterialId = nextExt ? livingFloor : 'fl-porcelain-concrete';
      } else if (r.id === 'room-bal-bed') {
        r.name = nextExt ? '' : '발코니';
        r.floorMaterialId = nextExt ? bedFloor : 'fl-porcelain-concrete';
      }
    });

    set({ plan: next, past: [...past.slice(-24), snap], future: [] });
    get().showToast(
      nextExt
        ? '확장형 평면으로 전환되었습니다 (거실·침실 전면 발코니 확장).'
        : '비확장형 평면으로 전환되었습니다 (전면 발코니 및 분합창 유지).'
    );
  },

  addWall: (x1, y1, x2, y2) => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    if (len < 0.3) return;
    const { plan, past } = get();
    const snap = takeSnapshot(plan);
    const next = clonePlan(plan);
    const newWall: Wall = {
      id: `wall-custom-${Date.now()}`,
      x1: Number(x1.toFixed(2)),
      y1: Number(y1.toFixed(2)),
      x2: Number(x2.toFixed(2)),
      y2: Number(y2.toFixed(2)),
      thickness: 0.12,
      height: 2.4,
      isLoadBearing: false,
      demolished: false,
      frontMaterialId: 'wp-lx-diamang-white',
      backMaterialId: 'wp-lx-diamang-white',
      openings: [],
    };
    next.walls.push(newWall);
    set({
      plan: next,
      past: [...past.slice(-24), snap],
      future: [],
      selection: { kind: 'wall', id: newWall.id },
    });
    get().showToast('새 가벽(비내력벽)이 2D/3D에 추가되었습니다.');
  },

  deleteWall: (wallId) => {
    const { plan, past } = get();
    const wall = plan.walls.find((w) => w.id === wallId);
    if (!wall || wall.isExterior) return;
    const snap = takeSnapshot(plan);
    const next = clonePlan(plan);
    next.walls = next.walls.filter((w) => w.id !== wallId);
    set({
      plan: next,
      past: [...past.slice(-24), snap],
      future: [],
      selection: null,
    });
  },

  flipOpeningSwing: (wallId, openingId) => {
    const { plan, past } = get();
    const snap = takeSnapshot(plan);
    const next = clonePlan(plan);
    const order: DoorSwing[] = [
      'in_left',
      'in_right',
      'out_left',
      'out_right',
      'in_double',
      'out_double',
    ];
    const wall = next.walls.find((w) => w.id === wallId);
    const op = wall?.openings.find((o) => o.id === openingId);
    if (!op) return;
    const curIdx = order.indexOf(op.swing || 'out_left');
    op.swing = order[(curIdx + 1) % order.length];
    set({ plan: next, past: [...past.slice(-24), snap], future: [] });
    get().showToast(`문 열림 방향 변경: ${op.swing}`);
  },

  deleteOpening: (wallId, openingId) => {
    const { plan, past } = get();
    const snap = takeSnapshot(plan);
    const next = clonePlan(plan);
    const wall = next.walls.find((w) => w.id === wallId);
    if (!wall) return;
    wall.openings = wall.openings.filter((o) => o.id !== openingId);
    set({ plan: next, past: [...past.slice(-24), snap], future: [] });
    get().showToast('개구부(문/창호)가 삭제되었습니다.');
  },

  renameRoom: (roomId, name, type) => {
    const { plan, past } = get();
    const snap = takeSnapshot(plan);
    const next = clonePlan(plan);
    const room = next.rooms.find((r) => r.id === roomId);
    if (!room) return;
    room.name = name;
    if (type) room.type = type;
    set({ plan: next, past: [...past.slice(-24), snap], future: [] });
  },

  resizeWallLength: (wallId, newLengthMm) => {
    const { plan, past } = get();
    const targetM = Math.min(25, Math.max(0.3, newLengthMm / 1000));
    const wall = plan.walls.find((w) => w.id === wallId);
    if (!wall) return;
    const dx = wall.x2 - wall.x1;
    const dy = wall.y2 - wall.y1;
    const curLen = Math.hypot(dx, dy);
    if (curLen < 0.05) return;

    const snap = takeSnapshot(plan);
    const next = clonePlan(plan);
    const nw = next.walls.find((w) => w.id === wallId)!;
    const oldX2 = nw.x2;
    const oldY2 = nw.y2;
    const newX2 = Number((nw.x1 + (dx / curLen) * targetM).toFixed(3));
    const newY2 = Number((nw.y1 + (dy / curLen) * targetM).toFixed(3));
    nw.x2 = newX2;
    nw.y2 = newY2;

    // Move connected wall endpoints that were attached to (oldX2, oldY2)
    next.walls.forEach((other) => {
      if (other.id === wallId) return;
      if (Math.hypot(other.x1 - oldX2, other.y1 - oldY2) < 0.06) {
        other.x1 = newX2;
        other.y1 = newY2;
      }
      if (Math.hypot(other.x2 - oldX2, other.y2 - oldY2) < 0.06) {
        other.x2 = newX2;
        other.y2 = newY2;
      }
    });

    set({ plan: next, past: [...past.slice(-24), snap], future: [] });
    get().showToast(`벽체 치수 변경: ${Math.round(targetM * 1000).toLocaleString()} mm`);
  },

  resizeFurniture: (id, widthMm, depthMm) => {
    const { plan, past } = get();
    const snap = takeSnapshot(plan);
    const next = clonePlan(plan);
    const f = next.furniture.find((item) => item.id === id);
    if (!f) return;
    f.width = Math.min(8, Math.max(0.2, Number((widthMm / 1000).toFixed(3))));
    f.depth = Math.min(8, Math.max(0.2, Number((depthMm / 1000).toFixed(3))));
    set({ plan: next, past: [...past.slice(-24), snap], future: [] });
    get().showToast(`가구 치수 변경: ${widthMm} × ${depthMm} mm`);
  },

  moveWallEndpoint: (wallId, end, x, y) => {
    const { plan } = get();
    const next = clonePlan(plan);
    const wall = next.walls.find((w) => w.id === wallId);
    if (!wall || wall.isExterior) return;
    const sx = Math.round(x * 10) / 10;
    const sy = Math.round(y * 10) / 10;
    if (end === 'start') {
      wall.x1 = sx;
      wall.y1 = sy;
    } else {
      wall.x2 = sx;
      wall.y2 = sy;
    }
    set({ plan: next });
  },

  addOpeningToWall: (wallId, type, offset) => {
    const { plan, past } = get();
    const snap = takeSnapshot(plan);
    const next = clonePlan(plan);
    const wall = next.walls.find((w) => w.id === wallId);
    if (!wall || wall.demolished) return;

    wall.openings.push({
      id: `op-${Date.now()}`,
      type,
      offset: Math.max(0.15, Math.min(0.85, offset)),
      width: type === 'window' ? 1.5 : 0.9,
      height: type === 'window' ? 1.3 : 2.1,
      sillHeight: type === 'window' ? 0.75 : 0,
      frameMaterialId: 'fm-hyundai-milkwhite',
    });

    set({ plan: next, past: [...past.slice(-24), snap], future: [] });
    get().showToast(
      type === 'window' ? '창문이 추가되었습니다.' : '도어가 추가되었습니다.'
    );
  },

  setRoomFloorDirection: (roomId, direction) => {
    const { plan, past } = get();
    const snap = takeSnapshot(plan);
    const next = clonePlan(plan);
    const room = next.rooms.find((r) => r.id === roomId);
    if (!room) return;
    room.floorDirection = direction;
    set({
      plan: next,
      past: [...past.slice(-24), snap],
      future: [],
    });
    get().showToast(
      `마루 결 방향이 ${direction === 'horizontal' ? '가로방향(↔)' : '세로방향(↕)'}으로 변경되었습니다.`
    );
  },

  setRoomCeiling: (roomId, patch) => {
    const { plan, past } = get();
    const snap = takeSnapshot(plan);
    const next = clonePlan(plan);
    const room = next.rooms.find((r) => r.id === roomId);
    if (!room) return;
    Object.assign(room, patch);
    set({
      plan: next,
      past: [...past.slice(-24), snap],
      future: [],
      showCeilingIn3D: true,
    });
  },

  addLightFixture: (roomId, type, x, y) => {
    const { plan, past } = get();
    const snap = takeSnapshot(plan);
    const next = clonePlan(plan);
    next.lights.push({
      id: `lt-${Date.now()}`,
      roomId,
      type,
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
      kelvin: '4000K',
      on: true,
    });
    set({ plan: next, past: [...past.slice(-24), snap], future: [] });
    get().showToast('조명이 2D/3D에 배치되었습니다.');
  },

  toggleLight: (lightId) => {
    const { plan } = get();
    const next = clonePlan(plan);
    const lt = next.lights.find((l) => l.id === lightId);
    if (lt) lt.on = !lt.on;
    set({ plan: next });
  },

  deleteLight: (lightId) => {
    const { plan, past } = get();
    const snap = takeSnapshot(plan);
    const next = clonePlan(plan);
    next.lights = next.lights.filter((l) => l.id !== lightId);
    set({
      plan: next,
      past: [...past.slice(-24), snap],
      future: [],
      selection: null,
    });
  },

  moveFurniture: (id, x, y) => {
    const { plan } = get();
    const next = clonePlan(plan);
    const item = next.furniture.find((f) => f.id === id);
    if (item) {
      item.x = Number(x.toFixed(2));
      item.y = Number(y.toFixed(2));
    }
    set({ plan: next });
  },

  applyThemeMaterials: (config) => {
    const { plan, past } = get();
    const snap = takeSnapshot(plan);
    const next = clonePlan(plan);

    next.walls.forEach((w) => {
      w.frontMaterialId = config.wallMaterialId;
      w.backMaterialId = config.wallMaterialId;
      w.openings.forEach((o) => {
        o.frameMaterialId = config.filmMaterialId;
      });
    });
    next.rooms.forEach((r) => {
      if (r.type !== 'bath' && r.type !== 'entrance') {
        r.floorMaterialId = config.floorMaterialId;
      }
      r.ceilingMaterialId = config.ceilingMaterialId;
      if (r.type === 'living') {
        r.ceilingType = config.ceilingType;
      }
      r.indirectLightColor = config.kelvin;
    });
    next.lights.forEach((l) => {
      l.kelvin = config.kelvin;
    });

    set({ plan: next, past: [...past.slice(-24), snap], future: [] });
    get().showToast('AI 추천 인테리어 스타일이 2D/3D 전체에 적용되었습니다!');
  },

  undo: () => {
    const { past, future, plan } = get();
    if (past.length === 0) return;
    const prev = past[past.length - 1];
    const currentSnap = takeSnapshot(plan);
    const next = clonePlan(plan);
    next.walls = prev.walls;
    next.rooms = prev.rooms;
    next.lights = prev.lights;
    next.furniture = prev.furniture;
    set({
      plan: next,
      past: past.slice(0, -1),
      future: [currentSnap, ...future],
    });
  },

  redo: () => {
    const { past, future, plan } = get();
    if (future.length === 0) return;
    const nextSnap = future[0];
    const currentSnap = takeSnapshot(plan);
    const next = clonePlan(plan);
    next.walls = nextSnap.walls;
    next.rooms = nextSnap.rooms;
    next.lights = nextSnap.lights;
    next.furniture = nextSnap.furniture;
    set({
      plan: next,
      past: [...past, currentSnap],
      future: future.slice(1),
    });
  },

  resetPlan: () => {
    const { plan } = get();
    for (const c of GANGDONG_COMPLEXES) {
      const found = c.plans.find((p) => p.id === plan.id);
      if (found) {
        get().loadPlanTemplate(found);
        return;
      }
    }
  },
}));
