import { describe, expect, it, vi } from "vitest";

import { generateRoadmap } from "@/lib/ai/generate-roadmap";
import { RoadmapRequestSchema } from "@/lib/contracts/roadmap";
import { AppError } from "@/lib/http/app-error";
import { validModelOutput, validRequest } from "../fixtures/roadmap";

const request = RoadmapRequestSchema.parse(validRequest);

function response(overrides: Record<string, unknown> = {}) {
  return {
    output_parsed: structuredClone(validModelOutput),
    output: [],
    model: "gpt-5.6-2026-07-01",
    usage: {
      input_tokens: 120,
      output_tokens: 480,
      total_tokens: 600,
      input_tokens_details: { cached_tokens: 0, cache_write_tokens: 0 },
      output_tokens_details: { reasoning_tokens: 40 },
    },
    ...overrides,
  };
}

function dependencies(parse: ReturnType<typeof vi.fn>, signal?: AbortSignal) {
  return {
    client: { responses: { parse } },
    clock: () => new Date("2026-07-22T10:00:00.000Z"),
    requestId: "req_test",
    signal,
  };
}

describe("generateRoadmap", () => {
  it("returns a validated roadmap with content-free telemetry", async () => {
    const parse = vi.fn().mockResolvedValue(response());
    const result = await generateRoadmap(request, dependencies(parse));

    expect(result.roadmap.schemaVersion).toBe("1.0");
    expect(result.roadmap.generatedAt).toBe("2026-07-22T10:00:00.000Z");
    expect(result.telemetry).toMatchObject({
      model: "gpt-5.6-2026-07-01",
      inputTokens: 120,
      outputTokens: 480,
      reasoningTokens: 40,
      retryCount: 0,
    });
    expect(result.telemetry).not.toHaveProperty("roadmap");
  });

  it("does not retry a refusal", async () => {
    const parse = vi.fn().mockResolvedValue(response({
      output_parsed: null,
      output: [{ type: "message", content: [{ type: "refusal", refusal: "Cannot comply" }] }],
    }));

    await expect(generateRoadmap(request, dependencies(parse))).rejects.toMatchObject({
      code: "INVALID_MODEL_OUTPUT",
      retryable: false,
    } satisfies Partial<AppError>);
    expect(parse).toHaveBeenCalledTimes(1);
  });

  it("retries a missing parsed result once", async () => {
    const parse = vi.fn()
      .mockResolvedValueOnce(response({ output_parsed: null }))
      .mockResolvedValueOnce(response());
    const result = await generateRoadmap(request, dependencies(parse));
    expect(result.telemetry.retryCount).toBe(1);
    expect(parse).toHaveBeenCalledTimes(2);
  });

  it("retries semantically invalid output then rejects", async () => {
    const invalid = structuredClone(validModelOutput);
    invalid.requirements[1]!.id = invalid.requirements[0]!.id;
    const parse = vi.fn().mockResolvedValue(response({ output_parsed: invalid }));

    await expect(generateRoadmap(request, dependencies(parse))).rejects.toMatchObject({
      code: "INVALID_MODEL_OUTPUT",
    });
    expect(parse).toHaveBeenCalledTimes(2);
  });

  it("retries a transient provider error then succeeds", async () => {
    const parse = vi.fn()
      .mockRejectedValueOnce({ status: 503 })
      .mockResolvedValueOnce(response());
    const result = await generateRoadmap(request, dependencies(parse));
    expect(result.telemetry.retryCount).toBe(1);
  });

  it("maps two transient failures to provider unavailable", async () => {
    const parse = vi.fn().mockRejectedValue({ status: 500 });
    await expect(generateRoadmap(request, dependencies(parse))).rejects.toMatchObject({
      code: "PROVIDER_UNAVAILABLE",
      retryable: true,
    });
    expect(parse).toHaveBeenCalledTimes(2);
  });

  it("rejects an already-aborted deadline without calling the provider", async () => {
    const controller = new AbortController();
    controller.abort();
    const parse = vi.fn();
    await expect(generateRoadmap(request, dependencies(parse, controller.signal))).rejects.toMatchObject({
      code: "GENERATION_TIMEOUT",
    });
    expect(parse).not.toHaveBeenCalled();
  });
});
