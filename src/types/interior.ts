export type MaterialCategory =
  | 'wallpaper'
  | 'floor'
  | 'film'
  | 'ceiling'
  | 'lighting';

export type MaterialPattern =
  | 'solid'
  | 'linen'
  | 'plaster'
  | 'oak_plank'
  | 'herringbone'
  | 'wide_plank'
  | 'marble_tile'
  | 'concrete_tile'
  | 'wood_film'
  | 'matte_film'
  | 'louver';

export interface MaterialItem {
  id: string;
  category: MaterialCategory;
  brand: string;
  productLine?: string;
  name: string;
  spec: string;
  pricePerUnit: number; // KRW
  unitLabel: string;
  baseColor: string;
  secondaryColor?: string;
  pattern: MaterialPattern;
  roughness: number;
  metalness?: number;
  tags: string[];
}

export type OpeningType = 'door' | 'sliding_door' | 'window' | 'entrance';

export type DoorSwing =
  | 'in_left'
  | 'in_right'
  | 'out_left'
  | 'out_right'
  | 'in_double'
  | 'out_double';

export interface Opening {
  id: string;
  type: OpeningType;
  offset: number; // 0..1 normalized position along wall
  width: number; // meters
  height: number; // meters
  sillHeight: number; // meters
  frameMaterialId: string;
  swing?: DoorSwing;
}

export interface Wall {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
  height: number;
  isLoadBearing: boolean; // 내력벽(true) vs 비내력벽/가벽(false)
  demolished: boolean; // 철거 여부
  isExterior?: boolean;
  frontMaterialId: string;
  backMaterialId: string;
  openings: Opening[];
}

export type CeilingType = 'well_rect' | 'well_round' | 'flat';
export type KelvinTemp = '3000K' | '4000K' | '5700K';

export type RoomType =
  | 'living'
  | 'kitchen'
  | 'master'
  | 'bedroom'
  | 'alpha'
  | 'bath'
  | 'entrance'
  | 'dress'
  | 'balcony'
  | 'utility';

export interface Room {
  id: string;
  name: string;
  type: RoomType;
  polygon: { x: number; y: number }[];
  floorMaterialId: string;
  floorDirection?: 'horizontal' | 'vertical';
  ceilingType: CeilingType;
  ceilingMaterialId: string;
  indirectLightColor: KelvinTemp;
  indirectLightOn: boolean;
}

export type LightFixtureType =
  | 'downlight_2'
  | 'downlight_3'
  | 'ceiling_fan'
  | 'pendant'
  | 'line_light';

export interface LightFixture {
  id: string;
  roomId: string;
  type: LightFixtureType;
  x: number;
  y: number;
  kelvin: KelvinTemp;
  on: boolean;
}

export type FurnitureCategory =
  | 'sofa'
  | 'bed'
  | 'dining'
  | 'kitchen_counter'
  | 'island'
  | 'wardrobe'
  | 'tv_stand'
  | 'toilet'
  | 'vanity'
  | 'shower'
  | 'bathtub';

export interface FurnitureItem {
  id: string;
  name: string;
  category: FurnitureCategory;
  x: number;
  y: number;
  width: number;
  depth: number;
  height: number;
  rotation: number; // radians
  color: string;
}

export interface OptionVariant {
  id: string;
  label: string;
  plan: FloorPlanTemplate;
}

export interface FloorPlanTemplate {
  id: string;
  complexId: string;
  complexName: string;
  district: string;
  region: 'seoul' | 'gyeonggi';
  typeName: string; // e.g. '84㎡A (34평 판상형 4Bay)'
  areaSqm: number;
  pyeong: number;
  bayInfo: string;
  isExtended?: boolean; // 확장형(true) vs 비확장형(false)
  description: string;
  width: number;
  depth: number;
  walls: Wall[];
  rooms: Room[];
  lights: LightFixture[];
  furniture: FurnitureItem[];
  optionVariants?: OptionVariant[];
  activeOptionId?: string;
}

export interface ApartmentComplex {
  id: string;
  name: string;
  dong: string;
  district: string;
  region: 'seoul' | 'gyeonggi';
  households: number;
  year: number;
  status: 'active' | 'coming_soon';
  plans: FloorPlanTemplate[];
}

export type SelectionTarget =
  | { kind: 'room'; id: string }
  | { kind: 'wall'; id: string; side?: 'front' | 'back' }
  | { kind: 'opening'; wallId: string; openingId: string }
  | { kind: 'ceiling'; roomId: string }
  | { kind: 'light'; id: string }
  | { kind: 'furniture'; id: string }
  | null;

export type EditorTool =
  | 'select'
  | 'draw_wall'
  | 'demolish'
  | 'add_door'
  | 'add_window'
  | 'add_light'
  | 'measure';

export type ViewMode = 'split' | '2d' | '3d';
export type CameraPreset = 'iso' | 'living' | 'kitchen' | 'master' | 'first_person';
