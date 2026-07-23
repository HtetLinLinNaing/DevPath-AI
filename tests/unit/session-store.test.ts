import { beforeEach, describe, expect, it } from "vitest";

import { RoadmapRequestSchema, RoadmapResponseSchema } from "@/lib/contracts/roadmap";
import {
  SESSION_KEY,
  clearSession,
  loadSession,
  saveSession,
} from "@/features/generator/session-store";
import { validModelOutput, validRequest } from "../fixtures/roadmap";

const input = RoadmapRequestSchema.parse(validRequest);
const result = RoadmapResponseSchema.parse({
  ...validModelOutput,
  schemaVersion: "1.0",
  generatedAt: "2026-07-22T10:00:00.000Z",
});

describe("session store", () => {
  beforeEach(() => sessionStorage.clear());

  it("saves and restores a valid successful session", () => {
    expect(saveSession(input, result, sessionStorage)).toBe(true);
    expect(loadSession(sessionStorage)).toEqual({ input, result });
  });

  it("deletes corrupt or incompatible data", () => {
    sessionStorage.setItem(SESSION_KEY, "not-json");
    expect(loadSession(sessionStorage)).toBeNull();
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();

    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ storageVersion: 2, input, result }));
    expect(loadSession(sessionStorage)).toBeNull();
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it("clears stored roadmap data", () => {
    saveSession(input, result, sessionStorage);
    clearSession(sessionStorage);
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
  });
});

