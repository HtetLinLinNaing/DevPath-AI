import OpenAI from "openai";

import {
  configuredOpenRouterBaseUrl,
  generationTimeoutMs,
  openRouterDefaultHeaders,
} from "@/lib/ai/config";

export function createOpenRouterClient(): OpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) throw new Error("OPENROUTER_API_KEY is not configured");
  return new OpenAI({
    apiKey,
    baseURL: configuredOpenRouterBaseUrl(),
    defaultHeaders: openRouterDefaultHeaders(),
    maxRetries: 0,
    timeout: generationTimeoutMs(),
  });
}
