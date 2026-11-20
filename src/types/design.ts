export type MaterialGroup =
  | 'floor'
  | 'tile'
  | 'wall'
  | 'film'
  | 'ceiling'
  | 'lighting'
  | 'electrical'
  | 'appliance';

export type FinishPattern =
  | 'solid'
  | 'stucco'
  | 'porcelain_600'
  | 'wide_oak'
  | 'louver_wood'
  | 'matte_pet'
  | 'fabric';

export interface MaterialCatalogItem {
  id: string;
  group: MaterialGroup;
  brand: string;
  series: string;
  name: string;
  spec: string;
  price: number;
  unit: string;
  color: string;
  subColor?: string;
  pattern: FinishPattern;
  roughness: number;
  metalness: number;
  isTrend2026?: boolean;
}

export type SpaceType =
  | 'living'
  | 'kitchen'
  | 'master'
  | 'bedroom'
  | 'bath'
  | 'entrance'
  | 'hallway'
  | 'dress'
  | 'balcony';

export interface SpaceZone {
  id: string;
  name: string;
  type: SpaceType;
  x: number; // meters
  y: number;
  width: number;
  depth: number;
  floorMaterialId: string;
  ceilingType: 'well_cove' | 'flat';
  ceilingMaterialId: string;
  coveLightOn: boolean;
  coveKelvin: '3000K' | '4000K' | '5700K';
}

export interface CadWall {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
  height: number;
  isExterior: boolean;
  materialId: string;
  displayMm?: number;
}

export type PortalType = 'door' | 'sliding_glass' | 'window_blind' | 'entrance';

export interface CadOpening {
  id: string;
  wallId: string;
  type: PortalType;
  offset: number; // 0..1
  width: number;
  height: number;
  sillHeight: number;
  frameMaterialId: string;
  hasBlind?: boolean;
}

export type ScenePropType =
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

export interface SceneProp {
  id: string;
  label: string;
  type: ScenePropType;
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

export interface BlueprintProject {
  id: string;
  name: string;
  areaSqm: number;
  width: number;
  depth: number;
  spaces: SpaceZone[];
  walls: CadWall[];
  openings: CadOpening[];
  props: SceneProp[];
}

export type SelectedItem =
  | { kind: 'space'; id: string }
  | { kind: 'wall'; id: string }
  | { kind: 'opening'; id: string }
  | { kind: 'prop'; id: string }
  | null;

export type CadTool =
  | 'select'
  | 'add_space'
  | 'draw_wall'
  | 'add_door'
  | 'add_window'
  | 'add_outlet'
  | 'add_light'
  | 'add_prop';
