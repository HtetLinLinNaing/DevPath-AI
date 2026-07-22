import { zodTextFormat } from "openai/helpers/zod";

import { createOpenAIClient } from "@/lib/ai/openai-client";
import {
  SYSTEM_INSTRUCTIONS,
  buildDeveloperPrompt,
  buildUserPrompt,
} from "@/lib/ai/prompts";
import {
  RoadmapModelOutputSchema,
  RoadmapResponseSchema,
  type RoadmapRequest,
  type RoadmapResponse,
} from "@/lib/contracts/roadmap";
import { AppError } from "@/lib/http/app-error";
import { validateRoadmapSemantics } from "@/lib/roadmap/semantic-validation";

type ProviderResponse = {
  output_parsed: unknown | null;
  output: Array<{
    type: string;
    content?: Array<{ type: string; refusal?: string }>;
  }>;
  model?: string;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    output_tokens_details?: { reasoning_tokens?: number };
  } | null;
};

export type RoadmapAIClient = {
  responses: {
    parse: (body: unknown, options?: { signal?: AbortSignal }) => Promise<ProviderResponse>;
  };
};

export type GenerationTelemetry = {
  model: string;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  retryCount: 0 | 1;
  durationMs: number;
};

export type GenerationResult = {
  roadmap: RoadmapResponse;
  telemetry: GenerationTelemetry;
};

type GenerationDependencies = {
  client?: RoadmapAIClient;
  clock?: () => Date;
  now?: () => number;
  requestId?: string;
  signal?: AbortSignal;
};

function hasRefusal(response: ProviderResponse): boolean {
  return response.output.some(
    (item) => item.type === "message" && item.content?.some((content) => content.type === "refusal"),
  );
}

function providerStatus(error: unknown): number | undefined {
  if (typeof error !== "object" || error === null || !("status" in error)) return undefined;
  return typeof error.status === "number" ? error.status : undefined;
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && (error.name === "AbortError" || error.name === "TimeoutError");
}

function isRetryableProviderError(error: unknown): boolean {
  const status = providerStatus(error);
  return status === 429 || (status !== undefined && status >= 500) || isAbortError(error);
}

function modelOutputError(retryable: boolean): AppError {
  return new AppError(
    "INVALID_MODEL_OUTPUT",
    "The generated roadmap could not be validated. Please try again.",
    retryable,
    502,
  );
}

export async function generateRoadmap(
  request: RoadmapRequest,
  dependencies: GenerationDependencies = {},
): Promise<GenerationResult> {
  const client = dependencies.client
    ?? (createOpenAIClient() as unknown as RoadmapAIClient);
  const clock = dependencies.clock ?? (() => new Date());
  const now = dependencies.now ?? Date.now;
  const startedAt = now();
  void dependencies.requestId;

  if (dependencies.signal?.aborted) {
    throw new AppError("GENERATION_TIMEOUT", "Roadmap generation timed out. Please try again.", true, 504);
  }

  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      const response = await client.responses.parse(
        {
          model: process.env.OPENAI_MODEL ?? "gpt-5.6",
          instructions: SYSTEM_INSTRUCTIONS,
          input: [
            { role: "developer", content: buildDeveloperPrompt() },
            { role: "user", content: buildUserPrompt(request) },
          ],
          text: { format: zodTextFormat(RoadmapModelOutputSchema, "devpath_roadmap") },
          store: false,
        },
        { signal: dependencies.signal },
      );

      if (hasRefusal(response)) throw modelOutputError(false);
      if (response.output_parsed === null) throw modelOutputError(true);

      const structural = RoadmapModelOutputSchema.safeParse(response.output_parsed);
      if (!structural.success) throw modelOutputError(true);
      const semantic = validateRoadmapSemantics(structural.data);
      if (!semantic.success) throw modelOutputError(true);

      const roadmap = RoadmapResponseSchema.parse({
        ...structural.data,
        schemaVersion: "1.0",
        generatedAt: clock().toISOString(),
      });
      const usage = response.usage;
      return {
        roadmap,
        telemetry: {
          model: response.model ?? process.env.OPENAI_MODEL ?? "gpt-5.6",
          inputTokens: usage?.input_tokens ?? 0,
          outputTokens: usage?.output_tokens ?? 0,
          reasoningTokens: usage?.output_tokens_details?.reasoning_tokens ?? 0,
          retryCount: attempt as 0 | 1,
          durationMs: Math.max(0, now() - startedAt),
        },
      };
    } catch (error) {
      if (error instanceof AppError && !error.retryable) throw error;
      lastError = error;
      const retryable = error instanceof AppError ? error.retryable : isRetryableProviderError(error);
      if (!retryable || attempt === 1) break;
    }
  }

  if (lastError instanceof AppError) {
    throw new AppError(lastError.code, lastError.message, true, lastError.status);
  }
  if (isAbortError(lastError) || dependencies.signal?.aborted) {
    throw new AppError("GENERATION_TIMEOUT", "Roadmap generation timed out. Please try again.", true, 504);
  }
  throw new AppError(
    "PROVIDER_UNAVAILABLE",
    "The roadmap service is temporarily unavailable. Please try again.",
    true,
    503,
  );
}
