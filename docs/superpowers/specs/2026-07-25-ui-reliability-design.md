# UI Reliability Repair Design

## Scope

Repair the six defects confirmed by the Playwright audit:

1. HeroUI utility CSS is not generated.
2. The autocomplete popover, icons, and field labels render outside their intended layout.
3. Interactive targets are smaller than 44 by 44 CSS pixels.
4. The 320px results experience is too dense and hides table content behind horizontal scrolling.
5. Local same-origin telemetry requests return HTTP 400 when `APP_ORIGIN` is unset.
6. Desktop and mobile UI regressions are not protected by layout-focused Playwright assertions.

## Design

Scan the HeroUI theme files at their actual npm-installed location under `@heroui/react/node_modules`. Installing the bundled theme directly is not compatible with this app's Tailwind 3 dependency because that package revision declares a Tailwind 4 peer. The corrected content path allows Tailwind to discover every class emitted by HeroUI components without forcing a framework migration. Remove CSS overrides that fight HeroUI's label and input positioning, retaining only project color and typography customizations.

Use HeroUI's native sizing for the current-role input and experience autocomplete. Give the theme toggle, autocomplete affordances, Add skill action, and results actions at least a 44px hit area. Preserve the existing form data model, validation, and accessible names.

At 760px and below, replace the six-column requirements table with stacked requirement cards using table semantics preserved in the DOM but mobile-specific presentation. Increase action and navigation sizing, keep the roadmap single-column, and avoid page-level horizontal overflow.

For telemetry, accept requests whose `Origin` matches the request URL origin when `APP_ORIGIN` is absent. When `APP_ORIGIN` is configured, continue enforcing that explicit origin.

## Verification

Playwright must verify generated HeroUI layout, autocomplete containment, 44px targets, mobile results without horizontal overflow, and successful same-origin telemetry. Vitest must cover the telemetry origin fallback. The final gate is the full unit/component suite, lint, typecheck, build, and Playwright on desktop Chromium and the 320px mobile project.
