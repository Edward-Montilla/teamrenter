/**
 * Client-only shortlist until `user_property_shortlist` + API land (Phase 5).
 * Survives full page refresh; cleared when the user clears site data.
 * Dashboard and comparison read/write this key — keep in sync when changing shape.
 */
export const SHORTLIST_STORAGE_KEY = "livedin_facelift_shortlist_v1";

export function readShortlistIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SHORTLIST_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

export function writeShortlistIds(ids: string[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SHORTLIST_STORAGE_KEY, JSON.stringify(ids));
}

export function toggleShortlistId(id: string): string[] {
  const current = readShortlistIds();
  const next = current.includes(id)
    ? current.filter((x) => x !== id)
    : [...current, id];
  writeShortlistIds(next);
  return next;
}
