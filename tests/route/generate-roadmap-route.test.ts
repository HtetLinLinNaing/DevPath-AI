import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { generateRoadmap } from "@/lib/ai/generate-roadmap";
import { RoadmapResponseSchema } from "@/lib/contracts/roadmap";
import { AppError } from "@/lib/http/app-error";
import { validModelOutput, validRequest } from "../fixtures/roadmap";

vi.mock("@/lib/ai/generate-roadmap", () => ({ generateRoadmap: vi.fn() }));

import { POST } from "@/app/api/generate-roadmap/route";

const mockedGenerate = vi.mocked(generateRoadmap);
const roadmap = RoadmapResponseSchema.parse({
  ...validModelOutput,
  schemaVersion: "1.0",
  generatedAt: "2026-07-22T10:00:00.000Z",
});

function request(body: string, options: { ip?: string; origin?: string; contentLength?: string } = {}) {
  const headers = new Headers({
    "content-type": "application/json",
    "x-forwarded-for": options.ip ?? `203.0.113.${Math.floor(Math.random() * 200) + 1}`,
  });
  if (options.origin) headers.set("origin", options.origin);
  if (options.contentLength) headers.set("content-length", options.contentLength);
  return new Request("http://localhost:3000/api/generate-roadmap", { method: "POST", headers, body });
}

describe("POST /api/generate-roadmap", () => {
  beforeEach(() => {
    vi.stubEnv("APP_ORIGIN", "http://localhost:3000");
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    mockedGenerate.mockReset().mockResolvedValue({
      roadmap,
      telemetry: {
        model: "xiaomi/mimo-v2.5-pro",
        inputTokens: 1,
        outputTokens: 1,
        reasoningTokens: 0,
        retryCount: 0,
        durationMs: 10,
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("returns a validated roadmap with no-store and request ID headers", async () => {
    const response = await POST(request(JSON.stringify(validRequest), { ip: "203.0.113.10" }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("no-store");
    expect(response.headers.get("x-request-id")).toBeTruthy();
    expect(await response.json()).toEqual(roadmap);
    const log = JSON.parse(vi.mocked(console.info).mock.calls.at(-1)?.[0] as string);
    expect(log).toMatchObject({
      name: "generation_succeeded",
      metadata: {
        model: "xiaomi/mimo-v2.5-pro",
        durationMs: 10,
        inputTokens: 1,
        outputTokens: 1,
        reasoningTokens: 0,
        retryCount: 0,
        schemaVersion: "1.0",
      },
    });
    expect(JSON.stringify(log)).not.toContain(validRequest.jobDescription);
  });

  it("allows the configured generation window for strict roadmap output", async () => {
    vi.stubEnv("GENERATION_TIMEOUT_MS", "120000");
    const timeout = vi.spyOn(AbortSignal, "timeout");
    await POST(request(JSON.stringify(validRequest), { ip: "203.0.113.18" }));
    expect(timeout).toHaveBeenCalledWith(120_000);
  });

  it("logs the OpenRouter model for generation failures", async () => {
    vi.stubEnv("OPENROUTER_MODEL", "");
    mockedGenerate.mockRejectedValueOnce(new Error("provider secret"));

    await POST(request(JSON.stringify(validRequest), { ip: "203.0.113.19" }));

    expect(JSON.parse(vi.mocked(console.info).mock.calls.at(-1)?.[0] as string)).toMatchObject({
      name: "generation_failed",
      metadata: { model: "xiaomi/mimo-v2.5-pro" },
    });
  });

  it("rejects malformed JSON", async () => {
    const response = await POST(request("{broken", { ip: "203.0.113.11" }));
    expect(response.status).toBe(400);
    expect((await response.json()).error.code).toBe("INVALID_INPUT");
  });

  it("rejects invalid input with content-free field paths", async () => {
    const response = await POST(request(JSON.stringify({ ...validRequest, jobDescription: "short" }), { ip: "203.0.113.12" }));
    const body = await response.json();
    expect(response.status).toBe(400);
    expect(body.error.details).toContain("jobDescription");
    expect(JSON.stringify(body)).not.toContain("short");
  });

  it("rejects payloads over 50 KB before generation", async () => {
    const response = await POST(request("{}", { ip: "203.0.113.13", contentLength: "51201" }));
    expect(response.status).toBe(413);
    expect(mockedGenerate).not.toHaveBeenCalled();
  });

  it("rejects an unapproved browser origin", async () => {
    const response = await POST(request(JSON.stringify(validRequest), {
      ip: "203.0.113.14",
      origin: "https://attacker.example",
    }));
    expect(response.status).toBe(400);
  });

  it("rate limits the sixth request and supplies Retry-After", async () => {
    const ip = "203.0.113.15";
    for (let count = 0; count < 5; count += 1) {
      expect((await POST(request(JSON.stringify(validRequest), { ip }))).status).toBe(200);
    }
    const response = await POST(request(JSON.stringify(validRequest), { ip }));
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBeTruthy();
  });

  it("maps generation timeout and unexpected failure", async () => {
    mockedGenerate.mockRejectedValueOnce(
      new AppError("GENERATION_TIMEOUT", "Roadmap generation timed out. Please try again.", true, 504),
    );
    expect((await POST(request(JSON.stringify(validRequest), { ip: "203.0.113.16" }))).status).toBe(504);
    expect(JSON.parse(vi.mocked(console.info).mock.calls.at(-1)?.[0] as string)).toMatchObject({
      name: "generation_failed",
      metadata: { errorCode: "GENERATION_TIMEOUT" },
    });

    mockedGenerate.mockRejectedValueOnce(new Error("provider secret"));
    const response = await POST(request(JSON.stringify(validRequest), { ip: "203.0.113.17" }));
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("provider secret");
  });
});
