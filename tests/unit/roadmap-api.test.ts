import { describe, expect, it, vi } from "vitest";

import { requestRoadmap } from "@/features/generator/roadmap-api";
import { RoadmapRequestSchema, RoadmapResponseSchema } from "@/lib/contracts/roadmap";
import { validModelOutput, validRequest } from "../fixtures/roadmap";

const input = RoadmapRequestSchema.parse(validRequest);
const result = RoadmapResponseSchema.parse({
  ...validModelOutput,
  schemaVersion: "1.0",
  generatedAt: "2026-07-22T10:00:00.000Z",
});

describe("requestRoadmap", () => {
  it("returns only a schema-valid success response", async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json(result));
    await expect(requestRoadmap(input, undefined, fetcher)).resolves.toEqual(result);
  });

  it("throws a validated API error", async () => {
    const apiError = {
      error: { code: "RATE_LIMITED", message: "Wait.", retryable: true, requestId: "req" },
    };
    const fetcher = vi.fn().mockResolvedValue(Response.json(apiError, { status: 429 }));
    await expect(requestRoadmap(input, undefined, fetcher)).rejects.toEqual(apiError.error);
  });

  it("rejects invalid success JSON and maps network failures", async () => {
    const invalid = vi.fn().mockResolvedValue(Response.json({ unexpected: true }));
    await expect(requestRoadmap(input, undefined, invalid)).rejects.toMatchObject({ code: "INVALID_MODEL_OUTPUT" });

    const network = vi.fn().mockRejectedValue(new TypeError("network detail"));
    await expect(requestRoadmap(input, undefined, network)).rejects.toMatchObject({ code: "PROVIDER_UNAVAILABLE" });
  });

  it("maps aborts to generation timeout", async () => {
    const abort = new DOMException("Aborted", "AbortError");
    const fetcher = vi.fn().mockRejectedValue(abort);
    await expect(requestRoadmap(input, undefined, fetcher)).rejects.toMatchObject({ code: "GENERATION_TIMEOUT" });
  });
});
