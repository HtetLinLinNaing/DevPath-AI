import { afterEach, describe, expect, it, vi } from "vitest";

const { openAIConstructor } = vi.hoisted(() => ({ openAIConstructor: vi.fn() }));

vi.mock("openai", () => ({
  default: openAIConstructor,
}));

import { createOpenAIClient } from "@/lib/ai/openai-client";

describe("createOpenAIClient", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    openAIConstructor.mockReset();
  });

  it("uses the configured generation timeout for the SDK request", () => {
    vi.stubEnv("OPENAI_API_KEY", "test-key");
    vi.stubEnv("GENERATION_TIMEOUT_MS", "120000");

    createOpenAIClient();

    expect(openAIConstructor).toHaveBeenCalledWith({
      apiKey: "test-key",
      maxRetries: 0,
      timeout: 120_000,
    });
  });
});
