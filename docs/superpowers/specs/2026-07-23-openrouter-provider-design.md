# OpenRouter Provider Replacement Design

**Date:** 2026-07-23  
**Status:** Approved for implementation

## Objective

Replace the direct OpenAI provider integration with OpenRouter while preserving the existing roadmap-generation contract, structured-output validation, retry behavior, telemetry privacy, and user experience.

The configured model is `xiaomi/mimo-v2.5-pro`. There is no direct OpenAI fallback.

## Current Failure Diagnosis

The reported `400 INVALID_INPUT` responses happen before provider invocation. Both POST routes compare the browser `Origin` header with `APP_ORIGIN`; a mismatch rejects the request. Provider replacement does not fix this independently, so local configuration must set `APP_ORIGIN` to the exact URL used in the browser.

## Architecture

The application will continue using the installed OpenAI TypeScript SDK as an OpenAI-compatible transport. The SDK client will be pointed at OpenRouter's `https://openrouter.ai/api/v1` base URL and renamed at the application boundary to reflect the actual provider.

This approach preserves the existing Responses API and Zod structured-output path:

1. The browser submits the validated roadmap request to `POST /api/generate-roadmap`.
2. The route validates origin, payload size, schema, and rate limits.
3. `generateRoadmap` calls an OpenRouter-configured SDK client.
4. OpenRouter routes the request to `xiaomi/mimo-v2.5-pro`.
5. The returned structured result passes structural and semantic validation.
6. The route returns the existing `RoadmapResponse` contract without provider-specific fields.

## Configuration

The provider configuration becomes:

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

`OPENROUTER_API_KEY` remains server-only and must never use a `NEXT_PUBLIC_` prefix. `OPENROUTER_SITE_URL` and `OPENROUTER_APP_NAME` populate OpenRouter's optional `HTTP-Referer` and `X-Title` attribution headers.

`OPENAI_API_KEY` and `OPENAI_MODEL` are removed from application configuration and documentation. The ignored local `.env.local` receives an empty OpenRouter key placeholder for the user to fill manually.

## Components

### Provider Configuration

`src/lib/ai/config.ts` will expose OpenRouter-specific model, base URL, attribution, and timeout accessors. Blank values fall back to documented defaults, except the API key, which is required.

### OpenRouter Client

`src/lib/ai/openai-client.ts` becomes `src/lib/ai/openrouter-client.ts` and exports `createOpenRouterClient`. It constructs the existing SDK with:

- `apiKey` from `OPENROUTER_API_KEY`
- `baseURL` from `OPENROUTER_BASE_URL`
- `defaultHeaders` for optional site attribution
- existing zero SDK retries
- the shared generation timeout

### Roadmap Generator

`generateRoadmap` will depend on `createOpenRouterClient` and use the OpenRouter model accessor. Prompt construction, Zod formatting, structural validation, semantic validation, one application-level retry, and timeout handling remain unchanged.

### Telemetry and Documentation

Success and failure telemetry will report the OpenRouter model slug but never prompts, roadmap content, or credentials. README architecture, prerequisites, environment tables, and deployment instructions will refer only to OpenRouter.

## Error Handling

- Missing `OPENROUTER_API_KEY` fails server-side without exposing configuration details to the browser.
- Provider 429 and 5xx responses retain the existing retry and `PROVIDER_UNAVAILABLE` behavior.
- Aborted SDK requests retain the existing `GENERATION_TIMEOUT` behavior without retry.
- Invalid or semantically inconsistent structured output retains the existing validation retry.
- Origin mismatch remains `INVALID_INPUT`; local documentation will require the browser URL and `APP_ORIGIN` to match exactly.

## Testing

Implementation follows red-green TDD:

1. Client tests require OpenRouter key, base URL, attribution headers, and shared timeout.
2. Generator tests require the default `xiaomi/mimo-v2.5-pro` model and OpenRouter client boundary.
3. Route tests confirm telemetry uses the OpenRouter model and origin mismatch remains independent of provider errors.
4. Repository search confirms production and runtime documentation contain no `OPENAI_*` configuration.
5. Full tests, lint, typecheck, and production build must pass.

A live provider request is not part of automated verification because the user will add the API key after implementation.

## Acceptance Criteria

- Direct OpenAI configuration is fully removed from runtime code and documentation.
- The application uses OpenRouter at `https://openrouter.ai/api/v1`.
- The default model is `xiaomi/mimo-v2.5-pro`.
- The user only needs to enter `OPENROUTER_API_KEY` in `.env.local`.
- `APP_ORIGIN` matches the documented local browser URL.
- Existing response contracts and privacy guarantees do not change.
- All automated verification gates pass.
