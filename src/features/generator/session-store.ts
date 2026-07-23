import { RoadmapRequestSchema, RoadmapResponseSchema, type RoadmapRequest, type RoadmapResponse } from "@/lib/contracts/roadmap";

export const SESSION_KEY = "devpath-ai:session:v1";

type StoredSession = {
  storageVersion: 1;
  savedAt: string;
  input: RoadmapRequest;
  result: RoadmapResponse;
};

export function saveSession(
  input: RoadmapRequest,
  result: RoadmapResponse,
  storage: Storage = sessionStorage,
): boolean {
  try {
    const session: StoredSession = {
      storageVersion: 1,
      savedAt: new Date().toISOString(),
      input,
      result,
    };
    storage.setItem(SESSION_KEY, JSON.stringify(session));
    return true;
  } catch {
    return false;
  }
}

export function loadSession(
  storage: Storage = sessionStorage,
): { input: RoadmapRequest; result: RoadmapResponse } | null {
  try {
    const raw = storage.getItem(SESSION_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (value.storageVersion !== 1) throw new Error("Unsupported session version");
    const input = RoadmapRequestSchema.parse(value.input);
    const result = RoadmapResponseSchema.parse(value.result);
    return { input, result };
  } catch {
    try {
      storage.removeItem(SESSION_KEY);
    } catch {
      // Storage may be unavailable; recovery remains optional.
    }
    return null;
  }
}

export function clearSession(storage: Storage = sessionStorage): void {
  try {
    storage.removeItem(SESSION_KEY);
  } catch {
    // Clearing unavailable storage is a no-op.
  }
}

