import { generateRoadmap } from "@/lib/ai/generate-roadmap";
import {
  configuredOpenRouterModel,
  generationTimeoutMs,
} from "@/lib/ai/config";
import { RoadmapRequestSchema } from "@/lib/contracts/roadmap";
import { AppError } from "@/lib/http/app-error";
import {
  resolveClientSession,
  type ClientSession,
} from "@/lib/http/client-session";
import { checkRateLimit } from "@/lib/http/rate-limit";
import { toErrorResponse } from "@/lib/http/route-response";
import { logTelemetry } from "@/lib/telemetry/logger";

const MAX_BODY_BYTES = 51_200;

function responseHeaders(requestId: string, session?: ClientSession): Headers {
  const headers = new Headers({
    "Cache-Control": "no-store, max-age=0",
    "X-Request-Id": requestId,
  });
  if (session?.setCookie) headers.append("Set-Cookie", session.setCookie);
  return headers;
}

function validateOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) return;
  if (!process.env.APP_ORIGIN || origin !== process.env.APP_ORIGIN) {
    throw new AppError("INVALID_INPUT", "The request origin is not allowed.", false, 400);
  }
}

async function parseRequest(request: Request) {
  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new AppError("INVALID_INPUT", "The request is too large.", false, 413);
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    throw new AppError("INVALID_INPUT", "The request is too large.", false, 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    throw new AppError("INVALID_INPUT", "The request body must be valid JSON.", false, 400);
  }

  const parsed = RoadmapRequestSchema.safeParse(body);
  if (!parsed.success) {
    const details = [...new Set(parsed.error.issues.map((issue) => issue.path.join(".")))];
    throw new AppError("INVALID_INPUT", "Please correct the highlighted fields.", false, 400, undefined, details);
  }
  return parsed.data;
}

export async function POST(request: Request): Promise<Response> {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();
  let clientSession: ClientSession | undefined;
  try {
    validateOrigin(request);

    clientSession = resolveClientSession(request.headers);
    const rateLimit = checkRateLimit(clientSession.identity);
    if (!rateLimit.allowed) {
      throw new AppError(
        "RATE_LIMITED",
        "Too many roadmap requests. Please wait and try again.",
        true,
        429,
        rateLimit.retryAfterSeconds,
      );
    }

    const input = await parseRequest(request);
    const result = await generateRoadmap(input, {
      requestId,
      signal: AbortSignal.timeout(generationTimeoutMs()),
    });
    logTelemetry({
      name: "generation_succeeded",
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        schemaVersion: result.roadmap.schemaVersion,
        ...result.telemetry,
      },
    });
    return Response.json(result.roadmap, {
      status: 200,
      headers: responseHeaders(requestId, clientSession),
    });
  } catch (error) {
    const mapped = toErrorResponse(error, requestId);
    logTelemetry({
      name: "generation_failed",
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        errorCode: mapped.body.error.code,
        durationMs: Math.max(0, Date.now() - startedAt),
        model: configuredOpenRouterModel(),
        retryCount: 0,
      },
    });
    const headers = responseHeaders(requestId, clientSession);
    if (mapped.retryAfterSeconds !== undefined) {
      headers.set("Retry-After", String(mapped.retryAfterSeconds));
    }
    return Response.json(mapped.body, { status: mapped.status, headers });
  }
}
