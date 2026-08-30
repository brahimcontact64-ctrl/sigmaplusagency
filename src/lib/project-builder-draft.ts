/**
 * Client-only draft persistence for the Project Builder. Deliberately
 * excludes contact fields (name/email/phone/message) from the persisted
 * draft — resuming a half-finished project shouldn't mean leaving PII
 * sitting in localStorage indefinitely. Those fields are re-entered at
 * the Contact step even after a resume; everything else survives.
 */

const STORAGE_KEY = "sigma-project-builder-draft";
const DRAFT_SCHEMA_VERSION = 1;
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export type DraftableFields = {
  projectType?: string;
  goals?: string[];
  capabilities?: string[];
  platforms?: string[];
  businessState?: string;
  currentWebsite?: string;
  timeline?: string;
  budgetRange?: string;
  stepIndex?: number;
};

type StoredDraft = {
  version: number;
  savedAt: number;
  data: DraftableFields;
};

export function saveDraft(data: DraftableFields): void {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredDraft = { version: DRAFT_SCHEMA_VERSION, savedAt: Date.now(), data };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage can fail (quota, private mode) — losing draft recovery is
    // not worth surfacing an error over.
  }
}

export function loadDraft(): DraftableFields | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as StoredDraft;
    if (parsed.version !== DRAFT_SCHEMA_VERSION) {
      clearDraft();
      return null;
    }
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      clearDraft();
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

export function clearDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing useful to do if this fails.
  }
}
