# UI Reliability Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct all six Playwright-confirmed UI and local telemetry defects without changing roadmap generation behavior.

**Architecture:** Restore HeroUI's documented Tailwind integration at the dependency boundary, then remove compensating CSS and make responsive behavior explicit in the form and results modules. Protect the user-visible behavior with Vitest and Playwright regression assertions.

**Tech Stack:** Next.js 15, React 19, HeroUI 2.8.5, Tailwind CSS 3.4, CSS Modules, Vitest, Playwright.

## Global Constraints

- Preserve all existing uncommitted work and edit only files needed by the six repairs.
- Keep the existing `RoadmapDraft` and API contracts unchanged.
- Maintain keyboard operation and accessible names.
- Minimum interactive target size is 44 by 44 CSS pixels.
- Support a 320px viewport without page-level horizontal overflow.
- Do not commit automatically because the worktree contains pre-existing user changes.

---

### Task 1: HeroUI and form layout regression

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/features/generator/GeneratorForm.tsx`
- Modify: `src/features/generator/generator.module.css`
- Test: `e2e/devpath.spec.ts`

**Interfaces:**
- Consumes: HeroUI 2.8.5 `Input`, `Autocomplete`, and `Button` components.
- Produces: correctly generated HeroUI utilities and contained 42px form controls with 44px actions.

- [ ] Add Playwright assertions for HeroUI computed layout, autocomplete containment, and target sizes.
- [ ] Run the focused Playwright test and confirm it fails on the current CSS.
- [ ] Scan the bundled HeroUI theme at its actual nested npm path and remove conflicting form overrides.
- [ ] Run the focused Playwright test and confirm it passes.

### Task 2: Mobile results readability

**Files:**
- Modify: `src/features/results/RequirementTable.tsx`
- Modify: `src/features/results/results.module.css`
- Test: `e2e/devpath.spec.ts`

**Interfaces:**
- Consumes: existing `RoadmapResponse["requirements"]`.
- Produces: desktop table layout and mobile stacked requirement rows with readable typography and no hidden horizontal content.

- [ ] Add a 320px Playwright assertion for readable requirement content, 44px result actions, and no horizontal overflow.
- [ ] Run the mobile test and confirm it fails on the current dense table.
- [ ] Add mobile table presentation and responsive sizing rules.
- [ ] Run the mobile test and confirm it passes.

### Task 3: Same-origin telemetry fallback

**Files:**
- Modify: `src/app/api/events/route.ts`
- Test: `tests/route/events-route.test.ts`

**Interfaces:**
- Consumes: request URL origin, optional `Origin`, and optional `APP_ORIGIN`.
- Produces: status 204 for valid same-origin events without configuration and status 400 for cross-origin events.

- [ ] Add a route test for same-origin requests with `APP_ORIGIN` unset.
- [ ] Run the route test and confirm it fails with status 400.
- [ ] Use the configured origin when present; otherwise compare against `new URL(request.url).origin`.
- [ ] Run the route test and confirm it passes.

### Task 4: Full verification and visual audit

**Files:**
- Verify: all modified source and test files.

**Interfaces:**
- Consumes: completed tasks 1 through 3.
- Produces: fresh automated and screenshot evidence for all six repairs.

- [ ] Run `npm test`.
- [ ] Run `npm run lint -- --quiet`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Run the full Playwright suite in both configured projects.
- [ ] Capture desktop, autocomplete-open, mobile-form, and mobile-results screenshots and inspect them.
- [ ] Run `git diff --check` and review the focused diff without modifying unrelated user changes.
