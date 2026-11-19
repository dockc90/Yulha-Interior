export type MaterialCategory =
  | 'floor'
  | 'wall'
  | 'film'
  | 'ceiling'
  | 'lighting'
  | 'electrical'
  | 'appliance';

export type TexturePattern =
  | 'solid'
  | 'stucco'
  | 'tile_600'
  | 'wide_oak'
  | 'louver_wood'
  | 'matte_pet'
  | 'fabric';

export interface MaterialSpec {
  id: string;
  category: MaterialCategory;
  brand: string;
  name: string;
  spec: string;
  pricePerUnit: number;
  unit: string;
  color: string;
  accentColor?: string;
  pattern: TexturePattern;
  roughness: number;
  metalness: number;
  tags: string[];
}

export type RoomKind =
  | 'living'
  | 'kitchen'
  | 'master'
  | 'bedroom'
  | 'bath'
  | 'entrance'
  | 'hallway'
  | 'dress'
  | 'balcony';

export interface RoomZone {
  id: string;
  name: string;
  kind: RoomKind;
  polygon: { x: number; y: number }[];
  floorMaterialId: string;
  ceilingType: 'well_cove' | 'flat';
  ceilingMaterialId: string;
  coveLightOn: boolean;
  coveKelvin: '3000K' | '4000K' | '5700K';
}

export interface WallSegment {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
  height: number;
  isExterior: boolean;
  frontMaterialId: string;
  backMaterialId: string;
}

export type OpeningKind = 'door' | 'sliding_glass_door' | 'window_blind' | 'entrance_door';

export interface OpeningItem {
  id: string;
  wallId: string;
  kind: OpeningKind;
  offset: number; // 0..1 along wall
  width: number;
  height: number;
  sillHeight: number;
  frameMaterialId: string;
  hasBlind?: boolean;
}

export type ObjectKind =
  | 'fridge_4door'
  | 'tall_homebar'
  | 'island_counter'
  | 'kitchen_sink'
  | 'induction_3'
  | 'dining_set'
  | 'sofa_modular'
  | 'bed_queen'
  | 'ceiling_fan'
  | 'downlight'
  | 'outlet_2'
  | 'switch_2'
  | 'wallpad'
  | 'wall_tv';

export interface InteriorObject {
  id: string;
  name: string;
  kind: ObjectKind;
  x: number;
  y: number;
  elevation: number; // height from floor (m)
  width: number;
  depth: number;
  height: number;
  rotation: number; // radians
  materialId: string;
  variant?: string; // e.g., 'option1' | 'option2' for tall_homebar
  on?: boolean; // for lights / fan
}

export interface ProjectData {
  id: string;
  title: string;
  areaSqm: number;
  width: number;
  depth: number;
  rooms: RoomZone[];
  walls: WallSegment[];
  openings: OpeningItem[];
  objects: InteriorObject[];
}

export type SelectionRef =
  | { kind: 'room'; id: string }
  | { kind: 'wall'; id: string; side?: 'front' | 'back' }
  | { kind: 'opening'; id: string }
  | { kind: 'object'; id: string }
  | null;

export type ToolMode =
  | 'select'
  | 'draw_wall'
  | 'add_door'
  | 'add_window'
  | 'add_outlet'
  | 'add_light'
  | 'add_furniture';
