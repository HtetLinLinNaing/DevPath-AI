import { afterEach, describe, expect, it, vi } from "vitest";

const { openAIConstructor } = vi.hoisted(() => ({ openAIConstructor: vi.fn() }));

vi.mock("openai", () => ({ default: openAIConstructor }));

import { createOpenRouterClient } from "@/lib/ai/openrouter-client";

describe("createOpenRouterClient", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    openAIConstructor.mockReset();
  });

  it("configures the OpenAI-compatible SDK for OpenRouter", () => {
    vi.stubEnv("OPENROUTER_API_KEY", "test-openrouter-key");
    vi.stubEnv("OPENROUTER_BASE_URL", "");
    vi.stubEnv("OPENROUTER_SITE_URL", "http://localhost:3000");
    vi.stubEnv("OPENROUTER_APP_NAME", "DevPath AI");
    vi.stubEnv("GENERATION_TIMEOUT_MS", "120000");

    createOpenRouterClient();

    expect(openAIConstructor).toHaveBeenCalledWith({
      apiKey: "test-openrouter-key",
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "DevPath AI",
      },
      maxRetries: 0,
      timeout: 120_000,
    });
  });

  it("requires an OpenRouter API key", () => {
    vi.stubEnv("OPENROUTER_API_KEY", "");
    expect(() => createOpenRouterClient()).toThrow("OPENROUTER_API_KEY is not configured");
    expect(openAIConstructor).not.toHaveBeenCalled();
  });
});
