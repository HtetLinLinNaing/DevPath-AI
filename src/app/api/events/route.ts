import { ClientEventSchema } from "@/lib/telemetry/events";
import { logTelemetry } from "@/lib/telemetry/logger";

const MAX_BODY_BYTES = 4_096;
const HEADERS = { "Cache-Control": "no-store" };

function errorResponse(message: string, status: number): Response {
  return Response.json({ error: { code: "INVALID_INPUT", message, retryable: false, requestId: "events" } }, { status, headers: HEADERS });
}

export async function POST(request: Request): Promise<Response> {
  const origin = request.headers.get("origin");
  const allowedOrigin = process.env.APP_ORIGIN || new URL(request.url).origin;
  if (origin && origin !== allowedOrigin) {
    return errorResponse("The request origin is not allowed.", 400);
  }

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return errorResponse("The request is too large.", 413);
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    return errorResponse("The request is too large.", 413);
  }

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return errorResponse("The request body must be valid JSON.", 400);
  }
  const parsed = ClientEventSchema.safeParse(body);
  if (!parsed.success) return errorResponse("The event is invalid.", 400);

  logTelemetry(parsed.data);
  return new Response(null, { status: 204, headers: HEADERS });
}
