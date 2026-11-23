export type MaterialKind =
  | 'floor'
  | 'tile'
  | 'wall'
  | 'film'
  | 'ceiling'
  | 'lighting'
  | 'electrical'
  | 'appliance';

export type TextureStyle =
  | 'solid'
  | 'stucco'
  | 'porcelain_600'
  | 'wide_oak'
  | 'louver_wood'
  | 'matte_pet'
  | 'fabric';

export interface MaterialItem {
  id: string;
  kind: MaterialKind;
  brand: string;
  series: string;
  name: string;
  spec: string;
  price: number;
  unit: string;
  color: string;
  subColor?: string;
  texture: TextureStyle;
  roughness: number;
  metalness: number;
}

export interface WallNode {
  id: string;
  x: number;
  y: number;
}

export interface WallEdge {
  id: string;
  startId: string;
  endId: string;
  thickness: number;
  height: number;
  frontMaterialId: string;
  backMaterialId: string;
}

export interface WallOpening {
  id: string;
  wallId: string;
  kind: 'door' | 'sliding_glass' | 'window' | 'entrance';
  offset: number; // 0..1
  width: number;
  height: number;
  sillHeight: number;
  frameMaterialId: string;
  hasBlind?: boolean;
}

export interface RoomOverride {
  key: string; // sorted node-id cycle key
  name: string;
  floorMaterialId: string;
  ceilingType: 'well_cove' | 'flat';
  coveLightOn: boolean;
}

export interface ComputedRoom {
  key: string;
  name: string;
  polygon: { x: number; y: number }[];
  areaSqm: number;
  centroid: { x: number; y: number };
  floorMaterialId: string;
  ceilingType: 'well_cove' | 'flat';
  coveLightOn: boolean;
}

export type PropKind =
  | 'sofa_modular'
  | 'coffee_table'
  | 'rug_round'
  | 'wall_tv'
  | 'aircon_stand'
  | 'kitchen_sink'
  | 'island_counter'
  | 'induction_3'
  | 'fridge_4door'
  | 'tall_homebar'
  | 'dining_set'
  | 'bed_queen'
  | 'wardrobe'
  | 'desk_set'
  | 'bathtub'
  | 'vanity'
  | 'toilet'
  | 'shower_booth'
  | 'ceiling_fan'
  | 'downlight'
  | 'outlet_2'
  | 'switch_2'
  | 'wallpad';

export interface SceneItem {
  id: string;
  name: string;
  kind: PropKind;
  x: number;
  y: number;
  elevation: number;
  width: number;
  depth: number;
  height: number;
  rotation: number;
  materialId: string;
  variant?: 'option1' | 'option2';
  powerOn?: boolean;
}

export interface FloorProject {
  id: string;
  title: string;
  areaSqm: number;
  nodes: WallNode[];
  walls: WallEdge[];
  openings: WallOpening[];
  roomOverrides: Record<string, RoomOverride>;
  items: SceneItem[];
}

export type SelectionTarget =
  | { kind: 'room'; key: string }
  | { kind: 'wall'; id: string; side?: 'front' | 'back' }
  | { kind: 'opening'; id: string }
  | { kind: 'item'; id: string }
  | null;

export type PlannerTool =
  | 'select'
  | 'draw_wall'
  | 'draw_room_box'
  | 'add_door'
  | 'add_window'
  | 'add_sliding'
  | 'place_item';
