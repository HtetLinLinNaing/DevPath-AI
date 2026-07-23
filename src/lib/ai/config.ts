const DEFAULT_MODEL = "gpt-5.6-sol";
const DEFAULT_GENERATION_TIMEOUT_MS = 120_000;

export function configuredModel(): string {
  return process.env.OPENAI_MODEL?.trim() || DEFAULT_MODEL;
}

export function generationTimeoutMs(): number {
  const configured = Number(process.env.GENERATION_TIMEOUT_MS);
  return Number.isFinite(configured) && configured >= 1_000
    ? configured
    : DEFAULT_GENERATION_TIMEOUT_MS;
}
