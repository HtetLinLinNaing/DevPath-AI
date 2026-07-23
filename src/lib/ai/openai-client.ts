import OpenAI from "openai";

import { generationTimeoutMs } from "@/lib/ai/config";

export function createOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not configured");
  return new OpenAI({ apiKey, maxRetries: 0, timeout: generationTimeoutMs() });
}
