import { describe, expect, it } from "vitest";

import {
  createInitialRequest,
  generatorReducer,
  type GeneratorState,
} from "@/features/generator/generator-machine";
import { RoadmapRequestSchema, RoadmapResponseSchema } from "@/lib/contracts/roadmap";
import { validModelOutput, validRequest } from "../fixtures/roadmap";

const input = RoadmapRequestSchema.parse(validRequest);
const result = RoadmapResponseSchema.parse({
  ...validModelOutput,
  schemaVersion: "1.0",
  generatedAt: "2026-07-22T10:00:00.000Z",
});

describe("generatorReducer", () => {
  it("moves from editing to submitting to success", () => {
    let state: GeneratorState = { status: "editing", input, error: null };
    state = generatorReducer(state, { type: "SUBMIT", requestId: "one", startedAt: 10 });
    expect(state.status).toBe("submitting");
    state = generatorReducer(state, { type: "SUCCEED", requestId: "one", result });
    expect(state).toMatchObject({ status: "success", result });
  });

  it("moves from submitting to retryable error while preserving input", () => {
    const submitting: GeneratorState = {
      status: "submitting",
      input,
      requestId: "one",
      startedAt: 10,
      error: null,
    };
    const state = generatorReducer(submitting, {
      type: "FAIL",
      requestId: "one",
      error: { code: "PROVIDER_UNAVAILABLE", message: "Try again.", retryable: true, requestId: "server" },
    });
    expect(state).toMatchObject({ status: "error", canRetry: true, input });
  });

  it("ignores stale completion and cancels the active request", () => {
    const submitting: GeneratorState = {
      status: "submitting",
      input,
      requestId: "current",
      startedAt: 10,
      error: null,
    };
    expect(generatorReducer(submitting, { type: "SUCCEED", requestId: "old", result })).toBe(submitting);
    expect(generatorReducer(submitting, { type: "CANCEL" })).toMatchObject({ status: "editing", input });
  });

  it("creates an empty form draft with the approved defaults", () => {
    expect(createInitialRequest()).toMatchObject({
      jobDescription: "",
      targetRole: "",
      consentToAIProcessing: false,
      profile: {
        skills: [{ name: "", proficiency: "aware" }],
        weeklyHours: "6-10",
        learningBudget: "free-only",
      },
    });
  });
});

