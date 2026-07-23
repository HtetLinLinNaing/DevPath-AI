import { describe, expect, it } from "vitest";

import { ClientEventSchema } from "@/lib/telemetry/events";
import { serializeTelemetry } from "@/lib/telemetry/logger";

describe("privacy-safe telemetry", () => {
  it("accepts only named events and allowlisted metadata", () => {
    expect(ClientEventSchema.safeParse({ name: "roadmap_exported", metadata: { timestamp: "2026-07-22T12:00:00.000Z", exportFormat: "markdown", schemaVersion: "1.0" } }).success).toBe(true);
    expect(ClientEventSchema.safeParse({ name: "profile_submitted", metadata: {} }).success).toBe(false);
    expect(ClientEventSchema.safeParse({ name: "generation_started", metadata: { jobDescription: "secret" } }).success).toBe(false);
    expect(ClientEventSchema.safeParse({ name: "generator_viewed", metadata: {}, skills: ["secret"] }).success).toBe(false);
  });

  it("serializes one projected JSON line without product content", () => {
    const line = serializeTelemetry({
      name: "generation_succeeded",
      metadata: {
        timestamp: "2026-07-22T12:00:00.000Z",
        requestId: "req-1",
        durationMs: 1250,
        model: "xiaomi/mimo-v2.5-pro",
        inputTokens: 100,
        outputTokens: 200,
        reasoningTokens: 30,
        retryCount: 1,
        jobDescription: "PRIVATE JOB",
        skills: ["PRIVATE SKILL"],
        prompt: "PRIVATE PROMPT",
        roadmap: "PRIVATE ROADMAP",
      },
      jobDescription: "PRIVATE ROOT",
    });
    expect(line.endsWith("\n")).toBe(true);
    const parsed = JSON.parse(line);
    expect(parsed).toEqual({
      name: "generation_succeeded",
      metadata: {
        timestamp: "2026-07-22T12:00:00.000Z",
        requestId: "req-1",
        durationMs: 1250,
        model: "xiaomi/mimo-v2.5-pro",
        inputTokens: 100,
        outputTokens: 200,
        reasoningTokens: 30,
        retryCount: 1,
      },
    });
    expect(line).not.toMatch(/PRIVATE|jobDescription|skills|prompt|roadmap/);
  });
});
