import { FloorPlanTemplate } from '../types/interior';

const STORAGE_KEY = 'yulha_saved_naver_blueprints_v1';

function makeKey(complexId: string, typeName: string): string {
  return `${complexId}::${typeName.replace(/\s+/g, '')}`;
}

export function loadSavedBlueprintsMap(): Record<string, FloorPlanTemplate> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, FloorPlanTemplate>;
  } catch {
    return {};
  }
}

export function saveBlueprintForType(
  complexId: string,
  typeName: string,
  plan: FloorPlanTemplate
): void {
  try {
    const map = loadSavedBlueprintsMap();
    map[makeKey(complexId, typeName)] = plan;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore quota errors
  }
}

export function getSavedBlueprintForType(
  complexId: string,
  typeName: string
): FloorPlanTemplate | null {
  const map = loadSavedBlueprintsMap();
  return map[makeKey(complexId, typeName)] || null;
}

export function deleteSavedBlueprintForType(
  complexId: string,
  typeName: string
): void {
  try {
    const map = loadSavedBlueprintsMap();
    delete map[makeKey(complexId, typeName)];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore
  }
}
