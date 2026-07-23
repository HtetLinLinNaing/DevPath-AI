import { ApiErrorResponseSchema, ErrorCodeSchema, type ApiError } from "@/lib/contracts/api-error";
import { RoadmapResponseSchema, type RoadmapRequest, type RoadmapResponse } from "@/lib/contracts/roadmap";

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

function clientError(code: ApiError["code"], message: string, retryable: boolean): ApiError {
  return { code, message, retryable, requestId: "client" };
}

function isApiError(value: unknown): value is ApiError {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<ApiError>;
  return ErrorCodeSchema.safeParse(candidate.code).success
    && typeof candidate.message === "string"
    && typeof candidate.retryable === "boolean"
    && typeof candidate.requestId === "string";
}

export async function requestRoadmap(
  input: RoadmapRequest,
  signal?: AbortSignal,
  fetcher: Fetcher = fetch,
): Promise<RoadmapResponse> {
  try {
    const response = await fetcher("/api/generate-roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
      signal,
    });
    const body: unknown = await response.json();

    if (!response.ok) {
      const parsedError = ApiErrorResponseSchema.safeParse(body);
      throw parsedError.success
        ? parsedError.data.error
        : clientError("INTERNAL_ERROR", "The server returned an unexpected error.", true);
    }

    const parsed = RoadmapResponseSchema.safeParse(body);
    if (!parsed.success) {
      throw clientError("INVALID_MODEL_OUTPUT", "The generated roadmap could not be validated. Please try again.", true);
    }
    return parsed.data;
  } catch (error) {
    if (isApiError(error)) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw clientError("GENERATION_TIMEOUT", "Roadmap generation was cancelled or timed out.", true);
    }
    throw clientError("PROVIDER_UNAVAILABLE", "Unable to reach the roadmap service. Please try again.", true);
  }
}
