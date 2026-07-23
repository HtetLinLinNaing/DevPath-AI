import { z } from "zod";

import { ErrorCodeSchema } from "@/lib/contracts/api-error";

export const EVENT_NAMES = [
  "generator_viewed",
  "generation_started",
  "generation_succeeded",
  "generation_failed",
  "roadmap_section_viewed",
  "roadmap_exported",
  "local_data_cleared",
] as const;

export const EventMetadataSchema = z.strictObject({
  timestamp: z.iso.datetime().optional(),
  requestId: z.string().min(1).max(100).optional(),
  errorCode: ErrorCodeSchema.optional(),
  exportFormat: z.enum(["markdown", "pdf"]).optional(),
  sectionId: z.string().regex(/^[a-z0-9-]+$/).max(60).optional(),
  durationMs: z.number().int().nonnegative().optional(),
  model: z.string().min(1).max(100).optional(),
  schemaVersion: z.string().min(1).max(20).optional(),
  inputTokens: z.number().int().nonnegative().optional(),
  outputTokens: z.number().int().nonnegative().optional(),
  reasoningTokens: z.number().int().nonnegative().optional(),
  retryCount: z.number().int().nonnegative().max(10).optional(),
});

export const ClientEventSchema = z.strictObject({
  name: z.enum(EVENT_NAMES),
  metadata: EventMetadataSchema,
});

export type EventName = z.infer<typeof ClientEventSchema>["name"];
export type EventMetadata = z.infer<typeof EventMetadataSchema>;
export type ClientEvent = z.infer<typeof ClientEventSchema>;

export function sendClientEvent(name: EventName, metadata: EventMetadata = {}): void {
  if (typeof window === "undefined") return;
  const parsed = ClientEventSchema.safeParse({
    name,
    metadata: { timestamp: new Date().toISOString(), ...metadata },
  });
  if (!parsed.success) return;
  try {
    void fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(parsed.data),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Analytics must never interrupt the product workflow.
  }
}
