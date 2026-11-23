import { create } from 'zustand';
import {
  ComputedRoom,
  FloorProject,
  MaterialItem,
  MaterialKind,
  PlannerTool,
  PropKind,
  SceneItem,
  SelectionTarget,
  WallEdge,
  WallNode,
  WallOpening,
} from '../types/planner';
import { computeRoomsFromGraph, distPointToSeg } from '../engine/cadGraph';
import { create34PyeongPlan, create25PyeongPlan, createBlankProject } from '../data/aptTemplates';
import { getMat } from '../data/materialsDb';

export type ViewMode = 'split' | '2d' | '3d' | 'walk';

const STORAGE_PROJECTS_KEY = 'yulha_v4_saved_projects';

export interface SavedProjectEntry {
  id: string;
  title: string;
  updatedAt: string;
  project: FloorProject;
}

function cloneProject(p: FloorProject): FloorProject {
  return JSON.parse(JSON.stringify(p)) as FloorProject;
}

function recomputeRooms(p: FloorProject): ComputedRoom[] {
  return computeRoomsFromGraph(p.nodes, p.walls, p.roomOverrides);
}

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 8)}`;
}

export interface PlannerState {
  project: FloorProject;
  rooms: ComputedRoom[];
  tool: PlannerTool;
  pendingPropKind: PropKind;
  selection: SelectionTarget;
  sidebarTab: 'build' | 'props' | 'materials';
  materialFilter: MaterialKind | 'all';
  viewMode: ViewMode;
  showCeiling: boolean;
  underlayUrl: string | null;
  underlayOpacity: number;
  underlayScaleMmPerPx: number;
  past: FloorProject[];
  future: FloorProject[];
  snapshotTrigger: number;

  setTool: (tool: PlannerTool, propKind?: PropKind) => void;
  setSidebarTab: (tab: 'build' | 'props' | 'materials') => void;
  setMaterialFilter: (kind: MaterialKind | 'all') => void;
  setViewMode: (mode: ViewMode) => void;
  setShowCeiling: (show: boolean) => void;
  setSelection: (sel: SelectionTarget) => void;
  setUnderlay: (url: string | null, opacity?: number) => void;
  triggerSnapshot: () => void;

  loadPreset: (preset: '34py' | '25py' | 'blank') => void;
  setProjectTitle: (title: string) => void;
  listSavedProjects: () => SavedProjectEntry[];
  saveCurrentProject: (customTitle?: string) => SavedProjectEntry;
  loadSavedProject: (id: string) => void;
  deleteSavedProject: (id: string) => void;

  undo: () => void;
  redo: () => void;

  moveNode: (nodeId: string, x: number, y: number, commitHistory?: boolean) => void;
  pushHistorySnapshot: (prevProject: FloorProject) => void;
  addWallSegment: (x1: number, y1: number, x2: number, y2: number) => void;
  drawRoomBox: (x1: number, y1: number, x2: number, y2: number) => void;
  addOpeningAtPoint: (wx: number, wy: number, kind: 'door' | 'window' | 'sliding_glass') => boolean;
  addSceneItem: (kind: PropKind, x: number, y: number) => void;
  moveSceneItem: (id: string, x: number, y: number, commitHistory?: boolean) => void;
  updateSceneItem: (id: string, patch: Partial<SceneItem>) => void;
  updateOpening: (id: string, patch: Partial<WallOpening>) => void;
  updateWall: (id: string, patch: Partial<WallEdge>) => void;
  updateRoomOverride: (
    roomKey: string,
    patch: { name?: string; floorMaterialId?: string; ceilingType?: 'well_cove' | 'flat'; coveLightOn?: boolean },
  ) => void;

  applyMaterial: (mat: MaterialItem) => void;
  applyMaterialToAll: (mat: MaterialItem) => void;

  deleteSelected: () => void;
  rotateSelected: (deltaDeg?: number) => void;
}

const initialProject = create34PyeongPlan();

export const usePlannerStore = create<PlannerState>((set, get) => ({
  project: initialProject,
  rooms: recomputeRooms(initialProject),
  tool: 'select',
  pendingPropKind: 'sofa_modular',
  selection: null,
  sidebarTab: 'materials',
  materialFilter: 'all',
  viewMode: 'split',
  showCeiling: false,
  underlayUrl: null,
  underlayOpacity: 0.45,
  underlayScaleMmPerPx: 15,
  past: [],
  future: [],
  snapshotTrigger: 0,

  setTool: (tool, propKind) =>
    set((s) => ({
      tool,
      pendingPropKind: propKind ?? s.pendingPropKind,
    })),

  setSidebarTab: (sidebarTab) => set({ sidebarTab }),
  setMaterialFilter: (materialFilter) => set({ materialFilter }),
  setViewMode: (viewMode) => set({ viewMode }),
  setShowCeiling: (showCeiling) => set({ showCeiling }),
  setSelection: (selection) =>
    set((s) => {
      if (!selection) return { selection };
      let nextFilter: MaterialKind | 'all' = s.materialFilter;
      if (selection.kind === 'wall') {
        nextFilter = 'wall';
      } else if (selection.kind === 'room') {
        const rm = s.rooms.find((r) => r.key === selection.key);
        const curMat = getMat(rm?.floorMaterialId);
        nextFilter = curMat.kind === 'tile' ? 'tile' : 'floor';
      } else if (selection.kind === 'opening') {
        nextFilter = 'film';
      } else if (selection.kind === 'item') {
        const it = s.project.items.find((x) => x.id === selection.id);
        if (it) {
          if (it.kind === 'ceiling_fan' || it.kind === 'downlight') nextFilter = 'lighting';
          else if (it.kind === 'outlet_2' || it.kind === 'switch_2' || it.kind === 'wallpad') nextFilter = 'electrical';
          else if (it.kind === 'fridge_4door' || it.kind === 'induction_3' || it.kind === 'aircon_stand' || it.kind === 'wall_tv')
            nextFilter = 'appliance';
          else if (it.kind === 'dining_set' || it.kind === 'desk_set') nextFilter = 'floor';
          else if (it.kind === 'sofa_modular' || it.kind === 'bed_queen' || it.kind === 'rug_round') nextFilter = 'wall';
          else nextFilter = 'film';
        }
      }
      return {
        selection,
        sidebarTab: 'materials',
        materialFilter: nextFilter,
      };
    }),
  setUnderlay: (underlayUrl, opacity) =>
    set((s) => ({
      underlayUrl,
      underlayOpacity: opacity !== undefined ? opacity : s.underlayOpacity,
    })),
  triggerSnapshot: () => set((s) => ({ snapshotTrigger: s.snapshotTrigger + 1 })),

  loadPreset: (preset) => {
    const prev = cloneProject(get().project);
    const next =
      preset === '34py'
        ? create34PyeongPlan()
        : preset === '25py'
          ? create25PyeongPlan()
          : createBlankProject();
    set((s) => ({
      project: next,
      rooms: recomputeRooms(next),
      selection: null,
      past: [...s.past.slice(-24), prev],
      future: [],
    }));
  },

  setProjectTitle: (title) =>
    set((s) => ({
      project: { ...s.project, title },
    })),

  listSavedProjects: () => {
    try {
      const raw = localStorage.getItem(STORAGE_PROJECTS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as SavedProjectEntry[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  saveCurrentProject: (customTitle) => {
    const state = get();
    const list = state.listSavedProjects();
    const title = (customTitle || state.project.title).trim() || '내 인테리어 프로젝트';
    const entry: SavedProjectEntry = {
      id: state.project.id,
      title,
      updatedAt: new Date().toISOString(),
      project: cloneProject({ ...state.project, title }),
    };
    const nextList = [entry, ...list.filter((e) => e.id !== entry.id)].slice(0, 30);
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(nextList));
    set((s) => ({ project: { ...s.project, title } }));
    return entry;
  },

  loadSavedProject: (id) => {
    const list = get().listSavedProjects();
    const found = list.find((e) => e.id === id);
    if (!found) return;
    const prev = cloneProject(get().project);
    const next = cloneProject(found.project);
    set((s) => ({
      project: next,
      rooms: recomputeRooms(next),
      selection: null,
      past: [...s.past.slice(-24), prev],
      future: [],
    }));
  },

  deleteSavedProject: (id) => {
    const list = get().listSavedProjects().filter((e) => e.id !== id);
    localStorage.setItem(STORAGE_PROJECTS_KEY, JSON.stringify(list));
  },

  undo: () =>
    set((s) => {
      if (s.past.length === 0) return s;
      const previous = s.past[s.past.length - 1];
      const nextPast = s.past.slice(0, -1);
      return {
        project: previous,
        rooms: recomputeRooms(previous),
        past: nextPast,
        future: [cloneProject(s.project), ...s.future].slice(0, 25),
        selection: null,
      };
    }),

  redo: () =>
    set((s) => {
      if (s.future.length === 0) return s;
      const next = s.future[0];
      const nextFuture = s.future.slice(1);
      return {
        project: next,
        rooms: recomputeRooms(next),
        past: [...s.past.slice(-24), cloneProject(s.project)],
        future: nextFuture,
        selection: null,
      };
    }),

  pushHistorySnapshot: (prevProject) =>
    set((s) => ({
      past: [...s.past.slice(-24), cloneProject(prevProject)],
      future: [],
    })),

  moveNode: (nodeId, x, y, commitHistory = false) =>
    set((s) => {
      const prev = commitHistory ? cloneProject(s.project) : null;
      const nextNodes = s.project.nodes.map((n) => (n.id === nodeId ? { ...n, x, y } : n));
      const nextProj = { ...s.project, nodes: nextNodes };
      return {
        project: nextProj,
        rooms: recomputeRooms(nextProj),
        past: prev ? [...s.past.slice(-24), prev] : s.past,
        future: prev ? [] : s.future,
      };
    }),

  addWallSegment: (x1, y1, x2, y2) =>
    set((s) => {
      if (Math.hypot(x2 - x1, y2 - y1) < 0.15) return s;
      const prev = cloneProject(s.project);
      const nodes: WallNode[] = [...s.project.nodes];
      const walls: WallEdge[] = [...s.project.walls];

      const findOrCreateNode = (px: number, py: number): string => {
        const hit = nodes.find((n) => Math.hypot(n.x - px, n.y - py) < 0.22);
        if (hit) return hit.id;
        const id = uid('n');
        nodes.push({ id, x: Number(px.toFixed(3)), y: Number(py.toFixed(3)) });
        return id;
      };

      const startId = findOrCreateNode(x1, y1);
      const endId = findOrCreateNode(x2, y2);
      if (startId === endId) return s;

      const exists = walls.some(
        (w) => (w.startId === startId && w.endId === endId) || (w.startId === endId && w.endId === startId),
      );
      if (exists) return s;

      const newWall: WallEdge = {
        id: uid('w'),
        startId,
        endId,
        thickness: 0.14,
        height: 2.45,
        frontMaterialId: 'wl-lx-diamang-cream',
        backMaterialId: 'wl-lx-diamang-cream',
      };
      walls.push(newWall);

      const nextProj = { ...s.project, nodes, walls };
      return {
        project: nextProj,
        rooms: recomputeRooms(nextProj),
        past: [...s.past.slice(-24), prev],
        future: [],
        selection: { kind: 'wall', id: newWall.id },
      };
    }),

  drawRoomBox: (x1, y1, x2, y2) =>
    set((s) => {
      const minX = Number(Math.min(x1, x2).toFixed(3));
      const maxX = Number(Math.max(x1, x2).toFixed(3));
      const minY = Number(Math.min(y1, y2).toFixed(3));
      const maxY = Number(Math.max(y1, y2).toFixed(3));
      if (maxX - minX < 0.4 || maxY - minY < 0.4) return s;

      const prev = cloneProject(s.project);
      const nodes: WallNode[] = [...s.project.nodes];
      const walls: WallEdge[] = [...s.project.walls];

      const findOrCreate = (px: number, py: number): string => {
        const hit = nodes.find((n) => Math.hypot(n.x - px, n.y - py) < 0.22);
        if (hit) return hit.id;
        const id = uid('n');
        nodes.push({ id, x: px, y: py });
        return id;
      };

      const tl = findOrCreate(minX, minY);
      const tr = findOrCreate(maxX, minY);
      const br = findOrCreate(maxX, maxY);
      const bl = findOrCreate(minX, maxY);

      const pairs: [string, string][] = [
        [tl, tr],
        [tr, br],
        [br, bl],
        [bl, tl],
      ];

      for (const [a, b] of pairs) {
        if (a === b) continue;
        const dup = walls.some((w) => (w.startId === a && w.endId === b) || (w.startId === b && w.endId === a));
        if (!dup) {
          walls.push({
            id: uid('w'),
            startId: a,
            endId: b,
            thickness: 0.14,
            height: 2.45,
            frontMaterialId: 'wl-lx-diamang-cream',
            backMaterialId: 'wl-lx-diamang-cream',
          });
        }
      }

      const nextProj = { ...s.project, nodes, walls };
      return {
        project: nextProj,
        rooms: recomputeRooms(nextProj),
        past: [...s.past.slice(-24), prev],
        future: [],
      };
    }),

  addOpeningAtPoint: (wx, wy, kind) => {
    const s = get();
    const nodeMap = new Map(s.project.nodes.map((n) => [n.id, n]));
    let bestWall: WallEdge | null = null;
    let bestDist = 0.45;
    let bestT = 0.5;

    for (const w of s.project.walls) {
      const a = nodeMap.get(w.startId);
      const b = nodeMap.get(w.endId);
      if (!a || !b) continue;
      const { dist, t } = distPointToSeg(wx, wy, a.x, a.y, b.x, b.y);
      if (dist < bestDist) {
        bestDist = dist;
        bestWall = w;
        bestT = Math.max(0.12, Math.min(0.88, t));
      }
    }

    if (!bestWall) return false;
    const prev = cloneProject(s.project);
    const opening: WallOpening = {
      id: uid('op'),
      wallId: bestWall.id,
      kind,
      offset: bestT,
      width: kind === 'door' ? 0.9 : kind === 'sliding_glass' ? 1.4 : 2.0,
      height: kind === 'window' ? 1.4 : 2.1,
      sillHeight: kind === 'window' ? 0.85 : 0,
      frameMaterialId: kind === 'sliding_glass' ? 'fm-bodac-charcoal' : 'fm-bodac-walnut',
      hasBlind: kind === 'window',
    };
    const nextProj = {
      ...s.project,
      openings: [...s.project.openings, opening],
    };
    set({
      project: nextProj,
      past: [...s.past.slice(-24), prev],
      future: [],
      selection: { kind: 'opening', id: opening.id },
      tool: 'select',
    });
    return true;
  },

  addSceneItem: (kind, x, y) =>
    set((s) => {
      const prev = cloneProject(s.project);
      const defaults: Record<PropKind, { name: string; w: number; d: number; h: number; elev: number; mat: string }> = {
        sofa_modular: { name: '모듈 패브릭 소파', w: 2.8, d: 0.98, h: 0.76, elev: 0, mat: 'wl-lx-diamang-cream' },
        coffee_table: { name: '세라믹 소파 테이블', w: 1.2, d: 0.65, h: 0.38, elev: 0, mat: 'tl-yun-cream600' },
        rug_round: { name: '원형 부클레 러그', w: 2.0, d: 2.0, h: 0.02, elev: 0, mat: 'wl-shinhan-facade' },
        wall_tv: { name: '반매립 75인치 OLED TV', w: 1.68, d: 0.09, h: 0.96, elev: 0.85, mat: 'ap-bespoke-charcoal' },
        aircon_stand: { name: '비스포크 무풍 에어컨', w: 0.42, d: 0.34, h: 1.85, elev: 0, mat: 'ap-bespoke-white' },
        kitchen_sink: { name: '빌트인 싱크대 하부장', w: 2.6, d: 0.65, h: 0.86, elev: 0, mat: 'fm-lx-benif-cream' },
        island_counter: { name: '아일랜드 식탁', w: 2.2, d: 0.9, h: 0.86, elev: 0, mat: 'tl-yun-cream600' },
        induction_3: { name: '3구 인덕션 레인지', w: 0.6, d: 0.52, h: 0.06, elev: 0.86, mat: 'ap-bespoke-induction' },
        fridge_4door: { name: '키친핏 비스포크 냉장고', w: 0.92, d: 0.7, h: 1.86, elev: 0, mat: 'ap-bespoke-white' },
        tall_homebar: { name: '홈바 키큰장', w: 2.2, d: 0.65, h: 2.3, elev: 0, mat: 'fm-lx-benif-cashmere' },
        dining_set: { name: '6인 우드 다이닝 테이블', w: 1.8, d: 0.9, h: 0.75, elev: 0, mat: 'fl-dongwha-max-essence' },
        bed_queen: { name: '킹/퀸 호텔식 침대', w: 1.85, d: 2.15, h: 0.95, elev: 0, mat: 'wl-shinhan-facade' },
        wardrobe: { name: '빌트인 붙박이장', w: 2.4, d: 0.62, h: 2.35, elev: 0, mat: 'fm-lx-benif-cashmere' },
        desk_set: { name: '서재 우드 책상', w: 1.4, d: 0.7, h: 0.74, elev: 0, mat: 'fl-dongwha-max-essence' },
        bathtub: { name: '프리스탠딩 욕조', w: 1.6, d: 0.78, h: 0.58, elev: 0, mat: 'fm-bodac-white' },
        vanity: { name: '하부장 세면대 & 거울', w: 1.0, d: 0.52, h: 0.82, elev: 0, mat: 'tl-yun-cream600' },
        toilet: { name: '일체형 비데 양변기', w: 0.42, d: 0.68, h: 0.78, elev: 0, mat: 'fm-bodac-white' },
        shower_booth: { name: '유리 샤워부스', w: 1.0, d: 1.0, h: 2.1, elev: 0, mat: 'fm-bodac-charcoal' },
        ceiling_fan: { name: '루씨에어 실링팬', w: 1.32, d: 1.32, h: 0.32, elev: 2.15, mat: 'lt-lucci-wood' },
        downlight: { name: '2인치 COB 매입등', w: 0.11, d: 0.11, h: 0.04, elev: 2.43, mat: 'lt-philips-2inch' },
        outlet_2: { name: '유럽형 2구 콘센트', w: 0.16, d: 0.028, h: 0.085, elev: 0.35, mat: 'el-legrand-white' },
        switch_2: { name: '2구 매립 스위치', w: 0.095, d: 0.024, h: 0.095, elev: 1.15, mat: 'el-jung-silver' },
        wallpad: { name: '스마트 홈 월패드', w: 0.24, d: 0.026, h: 0.16, elev: 1.4, mat: 'el-jung-black' },
      };
      const d = defaults[kind];
      const item: SceneItem = {
        id: uid('it'),
        kind,
        name: d.name,
        x: Number(x.toFixed(3)),
        y: Number(y.toFixed(3)),
        rotation: 0,
        width: d.w,
        depth: d.d,
        height: d.h,
        elevation: d.elev,
        materialId: d.mat,
      };
      const nextProj = { ...s.project, items: [...s.project.items, item] };
      return {
        project: nextProj,
        past: [...s.past.slice(-24), prev],
        future: [],
        selection: { kind: 'item', id: item.id },
        tool: 'select',
      };
    }),

  moveSceneItem: (id, x, y, commitHistory = false) =>
    set((s) => {
      const prev = commitHistory ? cloneProject(s.project) : null;
      const items = s.project.items.map((it) =>
        it.id === id ? { ...it, x: Number(x.toFixed(3)), y: Number(y.toFixed(3)) } : it,
      );
      return {
        project: { ...s.project, items },
        past: prev ? [...s.past.slice(-24), prev] : s.past,
        future: prev ? [] : s.future,
      };
    }),

  updateSceneItem: (id, patch) =>
    set((s) => {
      const prev = cloneProject(s.project);
      const items = s.project.items.map((it) => (it.id === id ? { ...it, ...patch } : it));
      return {
        project: { ...s.project, items },
        past: [...s.past.slice(-24), prev],
        future: [],
      };
    }),

  updateOpening: (id, patch) =>
    set((s) => {
      const prev = cloneProject(s.project);
      const openings = s.project.openings.map((op) => (op.id === id ? { ...op, ...patch } : op));
      return {
        project: { ...s.project, openings },
        past: [...s.past.slice(-24), prev],
        future: [],
      };
    }),

  updateWall: (id, patch) =>
    set((s) => {
      const prev = cloneProject(s.project);
      const walls = s.project.walls.map((w) => (w.id === id ? { ...w, ...patch } : w));
      return {
        project: { ...s.project, walls },
        past: [...s.past.slice(-24), prev],
        future: [],
      };
    }),

  updateRoomOverride: (roomKey, patch) =>
    set((s) => {
      const prev = cloneProject(s.project);
      const cur = s.project.roomOverrides[roomKey] ?? {
        key: roomKey,
        name: s.rooms.find((r) => r.key === roomKey)?.name || '방',
        floorMaterialId: 'fl-kujung-zen-fantasy',
        ceilingType: 'well_cove' as const,
        coveLightOn: true,
      };
      const nextOverrides = {
        ...s.project.roomOverrides,
        [roomKey]: { ...cur, ...patch, key: roomKey },
      };
      const nextProj: FloorProject = { ...s.project, roomOverrides: nextOverrides };
      return {
        project: nextProj,
        rooms: recomputeRooms(nextProj),
        past: [...s.past.slice(-24), prev],
        future: [],
      };
    }),

  applyMaterial: (mat) => {
    const s = get();
    const sel = s.selection;
    if (!sel) {
      if ((mat.kind === 'floor' || mat.kind === 'tile') && s.rooms.length > 0) {
        s.updateRoomOverride(s.rooms[0].key, { floorMaterialId: mat.id });
      }
      return;
    }
    if (sel.kind === 'room') {
      if (mat.kind === 'floor' || mat.kind === 'tile') {
        s.updateRoomOverride(sel.key, { floorMaterialId: mat.id });
      }
    } else if (sel.kind === 'wall') {
      if (mat.kind === 'wall' || mat.kind === 'tile' || mat.kind === 'film') {
        s.updateWall(sel.id, { frontMaterialId: mat.id, backMaterialId: mat.id });
      }
    } else if (sel.kind === 'opening') {
      s.updateOpening(sel.id, { frameMaterialId: mat.id });
    } else if (sel.kind === 'item') {
      s.updateSceneItem(sel.id, { materialId: mat.id });
    }
  },

  applyMaterialToAll: (mat) =>
    set((s) => {
      const prev = cloneProject(s.project);
      if (mat.kind === 'floor' || mat.kind === 'tile') {
        const nextOverrides = { ...s.project.roomOverrides };
        for (const r of s.rooms) {
          const cur = nextOverrides[r.key] ?? {
            key: r.key,
            name: r.name,
            floorMaterialId: r.floorMaterialId,
            ceilingType: r.ceilingType,
            coveLightOn: r.coveLightOn,
          };
          nextOverrides[r.key] = { ...cur, floorMaterialId: mat.id };
        }
        const nextProj: FloorProject = { ...s.project, roomOverrides: nextOverrides };
        return {
          project: nextProj,
          rooms: recomputeRooms(nextProj),
          past: [...s.past.slice(-24), prev],
          future: [],
        };
      }
      if (mat.kind === 'wall' || mat.kind === 'film') {
        const walls = s.project.walls.map((w) => ({
          ...w,
          frontMaterialId: mat.id,
          backMaterialId: mat.id,
        }));
        return {
          project: { ...s.project, walls },
          past: [...s.past.slice(-24), prev],
          future: [],
        };
      }
      return s;
    }),

  deleteSelected: () =>
    set((s) => {
      const sel = s.selection;
      if (!sel || sel.kind === 'room') return s;
      const prev = cloneProject(s.project);
      if (sel.kind === 'wall') {
        const walls = s.project.walls.filter((w) => w.id !== sel.id);
        const openings = s.project.openings.filter((op) => op.wallId !== sel.id);
        const usedIds = new Set<string>();
        walls.forEach((w) => {
          usedIds.add(w.startId);
          usedIds.add(w.endId);
        });
        const nodes = s.project.nodes.filter((n) => usedIds.has(n.id));
        const nextProj = { ...s.project, nodes, walls, openings };
        return {
          project: nextProj,
          rooms: recomputeRooms(nextProj),
          selection: null,
          past: [...s.past.slice(-24), prev],
          future: [],
        };
      }
      if (sel.kind === 'opening') {
        const openings = s.project.openings.filter((op) => op.id !== sel.id);
        return {
          project: { ...s.project, openings },
          selection: null,
          past: [...s.past.slice(-24), prev],
          future: [],
        };
      }
      if (sel.kind === 'item') {
        const items = s.project.items.filter((it) => it.id !== sel.id);
        return {
          project: { ...s.project, items },
          selection: null,
          past: [...s.past.slice(-24), prev],
          future: [],
        };
      }
      return s;
    }),

  rotateSelected: (deltaDeg = 45) =>
    set((s) => {
      const sel = s.selection;
      if (!sel || sel.kind !== 'item') return s;
      const prev = cloneProject(s.project);
      const deltaRad = (deltaDeg * Math.PI) / 180;
      const items = s.project.items.map((it) =>
        it.id === sel.id ? { ...it, rotation: it.rotation + deltaRad } : it,
      );
      return {
        project: { ...s.project, items },
        past: [...s.past.slice(-24), prev],
        future: [],
      };
    }),
}));

export function getSelectedMaterialId(state: PlannerState): string | undefined {
  const sel = state.selection;
  if (!sel) return undefined;
  if (sel.kind === 'room') {
    return state.rooms.find((r) => r.key === sel.key)?.floorMaterialId;
  }
  if (sel.kind === 'wall') {
    return state.project.walls.find((w) => w.id === sel.id)?.frontMaterialId;
  }
  if (sel.kind === 'opening') {
    return state.project.openings.find((op) => op.id === sel.id)?.frameMaterialId;
  }
  if (sel.kind === 'item') {
    return state.project.items.find((it) => it.id === sel.id)?.materialId;
  }
  return undefined;
}

export { getMat };
