# OpenRouter Provider Replacement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fully replace direct OpenAI provider configuration with OpenRouter using `xiaomi/mimo-v2.5-pro`, while preserving the roadmap response contract and fixing the local origin configuration.

**Architecture:** Keep the installed OpenAI TypeScript SDK solely as OpenRouter's compatible transport, configured with OpenRouter's base URL, credential, and attribution headers. Rename the application client boundary to OpenRouter, retain the existing Responses API plus Zod validation pipeline, and remove all runtime `OPENAI_*` configuration.

**Tech Stack:** Next.js 15, TypeScript, OpenAI JavaScript SDK 6 as compatible transport, OpenRouter Responses API, Zod 4, Vitest.

## Global Constraints

- Execute inline in the current session; do not dispatch subagents.
- Use `xiaomi/mimo-v2.5-pro` as the default and only configured provider model.
- Use `https://openrouter.ai/api/v1` as the default base URL.
- Preserve the existing request, roadmap response, error, retry, timeout, telemetry privacy, and semantic-validation contracts.
- Keep the `OPENROUTER_API_KEY` value server-only and absent from committed files.
- Set local `APP_ORIGIN` to the exact documented browser URL: `http://localhost:3000`.
- Follow red-green TDD for every runtime behavior change.

---

### Task 1: OpenRouter Configuration And Client Boundary

**Files:**
- Modify: `src/lib/ai/config.ts`
- Create: `src/lib/ai/openrouter-client.ts`
- Delete: `src/lib/ai/openai-client.ts`
- Create: `tests/unit/openrouter-client.test.ts`
- Delete: `tests/unit/openai-client.test.ts`

**Interfaces:**
- Produces: `configuredOpenRouterModel(): string`
- Produces: `configuredOpenRouterBaseUrl(): string`
- Produces: `openRouterDefaultHeaders(): Record<string, string>`
- Preserves: `generationTimeoutMs(): number`
- Produces: `createOpenRouterClient(): OpenAI`

- [ ] **Step 1: Replace the client test with failing OpenRouter construction tests**

Create `tests/unit/openrouter-client.test.ts`:

```ts
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
```

Delete `tests/unit/openai-client.test.ts`.

- [ ] **Step 2: Run the client test and verify RED**

Run:

```bash
npm test -- --run tests/unit/openrouter-client.test.ts
```

Expected: FAIL because `@/lib/ai/openrouter-client` does not exist.

- [ ] **Step 3: Implement OpenRouter configuration and client**

Replace `src/lib/ai/config.ts` with:

```ts
const DEFAULT_OPENROUTER_MODEL = "xiaomi/mimo-v2.5-pro";
const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const DEFAULT_GENERATION_TIMEOUT_MS = 120_000;

export function configuredOpenRouterModel(): string {
  return process.env.OPENROUTER_MODEL?.trim() || DEFAULT_OPENROUTER_MODEL;
}

export function configuredOpenRouterBaseUrl(): string {
  return process.env.OPENROUTER_BASE_URL?.trim() || DEFAULT_OPENROUTER_BASE_URL;
}

export function openRouterDefaultHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const siteUrl = process.env.OPENROUTER_SITE_URL?.trim();
  const appName = process.env.OPENROUTER_APP_NAME?.trim();
  if (siteUrl) headers["HTTP-Referer"] = siteUrl;
  if (appName) headers["X-Title"] = appName;
  return headers;
}

export function generationTimeoutMs(): number {
  const configured = Number(process.env.GENERATION_TIMEOUT_MS);
  return Number.isFinite(configured) && configured >= 1_000
    ? configured
    : DEFAULT_GENERATION_TIMEOUT_MS;
}
```

Create `src/lib/ai/openrouter-client.ts`:

```ts
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
```

Delete `src/lib/ai/openai-client.ts`.

- [ ] **Step 4: Run the client test and verify GREEN**

Run:

```bash
npm test -- --run tests/unit/openrouter-client.test.ts
```

Expected: 2 tests PASS.

- [ ] **Step 5: Commit the client boundary**

```bash
git add src/lib/ai/config.ts src/lib/ai/openrouter-client.ts src/lib/ai/openai-client.ts tests/unit/openrouter-client.test.ts tests/unit/openai-client.test.ts
git commit -m "feat: configure OpenRouter client"
```

### Task 2: Roadmap Generation And Telemetry Migration

**Files:**
- Modify: `src/lib/ai/generate-roadmap.ts`
- Modify: `src/app/api/generate-roadmap/route.ts`
- Modify: `tests/unit/generate-roadmap.test.ts`
- Modify: `tests/route/generate-roadmap-route.test.ts`

**Interfaces:**
- Consumes: `createOpenRouterClient(): OpenAI`
- Consumes: `configuredOpenRouterModel(): string`
- Preserves: `generateRoadmap(request, dependencies): Promise<GenerationResult>`
- Preserves: `POST(request): Promise<Response>`

- [ ] **Step 1: Change tests to require the OpenRouter model and telemetry**

In `tests/unit/generate-roadmap.test.ts`, change the default-model test to:

```ts
it("uses the configured OpenRouter model by default", async () => {
  vi.stubEnv("OPENROUTER_MODEL", "");
  const parse = vi.fn().mockResolvedValue(response());
  await generateRoadmap(request, dependencies(parse));
  expect(parse.mock.calls[0]?.[0]).toMatchObject({
    model: "xiaomi/mimo-v2.5-pro",
  });
});
```

Change the fixture provider model from `gpt-5.6-2026-07-01` to `xiaomi/mimo-v2.5-pro`, including the telemetry expectation.

In `tests/route/generate-roadmap-route.test.ts`, change mocked and expected telemetry model values from `gpt-5.6` to `xiaomi/mimo-v2.5-pro`. Add:

```ts
it("logs the OpenRouter model for generation failures", async () => {
  vi.stubEnv("OPENROUTER_MODEL", "");
  mockedGenerate.mockRejectedValueOnce(new Error("provider secret"));

  await POST(request(JSON.stringify(validRequest), { ip: "203.0.113.19" }));

  expect(JSON.parse(vi.mocked(console.info).mock.calls.at(-1)?.[0] as string)).toMatchObject({
    name: "generation_failed",
    metadata: { model: "xiaomi/mimo-v2.5-pro" },
  });
});
```

- [ ] **Step 2: Run generator and route tests and verify RED**

Run:

```bash
npm test -- --run tests/unit/generate-roadmap.test.ts tests/route/generate-roadmap-route.test.ts
```

Expected: FAIL because runtime code still reads `OPENAI_MODEL`, defaults to `gpt-5.6-sol`, and imports `createOpenAIClient`.

- [ ] **Step 3: Migrate generator and route imports**

In `src/lib/ai/generate-roadmap.ts`:

```ts
import { configuredOpenRouterModel } from "@/lib/ai/config";
import { createOpenRouterClient } from "@/lib/ai/openrouter-client";
```

Construct the default client with:

```ts
const client = dependencies.client
  ?? (createOpenRouterClient() as unknown as RoadmapAIClient);
```

Use `configuredOpenRouterModel()` for the request model and telemetry fallback.

In `src/app/api/generate-roadmap/route.ts`, import:

```ts
import {
  configuredOpenRouterModel,
  generationTimeoutMs,
} from "@/lib/ai/config";
```

Use `configuredOpenRouterModel()` in failure telemetry.

- [ ] **Step 4: Run generator and route tests and verify GREEN**

Run:

```bash
npm test -- --run tests/unit/generate-roadmap.test.ts tests/route/generate-roadmap-route.test.ts
```

Expected: 18 tests PASS.

- [ ] **Step 5: Commit generator migration**

```bash
git add src/lib/ai/generate-roadmap.ts src/app/api/generate-roadmap/route.ts tests/unit/generate-roadmap.test.ts tests/route/generate-roadmap-route.test.ts
git commit -m "feat: generate roadmaps through OpenRouter"
```

### Task 3: Environment Migration, Origin Correction, And Release Verification

**Files:**
- Modify: `.env.example`
- Modify locally, do not commit: `.env.local`
- Modify: `README.md`

**Interfaces:**
- Documents: exact OpenRouter environment contract
- Preserves: local URL `http://localhost:3000`

- [ ] **Step 1: Replace committed environment examples**

Set `.env.example` to:

```env
OPENROUTER_API_KEY=
OPENROUTER_MODEL=xiaomi/mimo-v2.5-pro
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_APP_NAME=DevPath AI
GENERATION_TIMEOUT_MS=120000
APP_ORIGIN=http://localhost:3000
RATE_LIMIT_SALT=
```

Set the ignored `.env.local` to the same local values with an empty `OPENROUTER_API_KEY=` placeholder. Preserve any non-provider local setting not listed above only if it remains valid.

- [ ] **Step 2: Update runtime documentation**

In `README.md`:

- Replace the OpenAI prerequisite with an OpenRouter API key.
- Replace environment-table rows with the five `OPENROUTER_*` variables.
- State that only `OPENROUTER_API_KEY` must be filled for the documented defaults.
- Replace the architecture node with `OpenRouter Responses API`.
- Replace security and deployment references to direct OpenAI access.
- State that `APP_ORIGIN` must exactly equal the browser origin and use `http://localhost:3000` locally.
- Preserve all existing privacy, rate-limit, smoke-test, and rollback requirements.

- [ ] **Step 3: Verify legacy runtime configuration is absent**

Run:

```bash
rg -n "OPENAI_API_KEY|OPENAI_MODEL|createOpenAIClient|openai-client|gpt-5\\.6" src .env.example README.md tests
```

Expected: no matches.

The `openai` package import and `openai/helpers/zod` import remain valid because the SDK is the OpenRouter-compatible transport.

- [ ] **Step 4: Run complete automated verification**

Run each command and require exit code 0:

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Expected:

- All Vitest suites pass.
- ESLint reports no errors.
- TypeScript reports no errors.
- Next.js production build completes successfully.

- [ ] **Step 5: Start the local server and verify origin behavior**

Start:

```bash
npm run dev
```

Open `http://localhost:3000`, submit a valid synthetic request, and confirm:

- `/api/events` no longer returns `400` for the documented origin.
- `/api/generate-roadmap` reaches the provider boundary.
- With the key still blank, the browser receives a safe provider error and no credential/configuration detail.

Do not claim live roadmap generation until the user fills `OPENROUTER_API_KEY`.

- [ ] **Step 6: Commit environment and documentation migration**

```bash
git add .env.example README.md
git commit -m "docs: configure OpenRouter environment"
```

- [ ] **Step 7: Inspect final repository state**

Run:

```bash
git status --short
git log -5 --oneline
```

Expected: tracked worktree clean; `.env.local` remains ignored and uncommitted.
