import { ClientEventSchema, type ClientEvent } from "@/lib/telemetry/events";

const METADATA_KEYS = [
  "timestamp",
  "requestId",
  "errorCode",
  "exportFormat",
  "sectionId",
  "durationMs",
  "model",
  "schemaVersion",
  "inputTokens",
  "outputTokens",
  "reasoningTokens",
  "retryCount",
] as const;

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? value as Record<string, unknown> : {};
}

export function projectTelemetry(input: unknown): ClientEvent {
  const source = record(input);
  const metadataSource = record(source.metadata);
  const metadata = Object.fromEntries(
    METADATA_KEYS.flatMap((key) => metadataSource[key] === undefined ? [] : [[key, metadataSource[key]]]),
  );
  return ClientEventSchema.parse({ name: source.name, metadata });
}

export function serializeTelemetry(input: unknown): string {
  return JSON.stringify(projectTelemetry(input)) + "\n";
}

export function logTelemetry(input: unknown, sink: (line: string) => void = console.info): void {
  sink(serializeTelemetry(input).trimEnd());
}
