# DevPath-AI Landing Curtain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a compact, session-scoped landing curtain with a click-to-load privacy-enhanced YouTube demo that reveals the existing roadmap generator without modifying generator code.

**Architecture:** A client-side `LandingGate` owns the session flag and four reveal phases: checking, landing, exiting, and builder. It mounts the unchanged generator only when the visitor starts dismissal, while an isolated `LandingCurtain` owns marketing content and lazy video state. The existing `/` route remains the only page, and the global CSP gains only the YouTube privacy-enhanced frame origin.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, CSS Modules, Lucide React, Testing Library/Vitest, Playwright, YouTube privacy-enhanced iframe embeds.

## Global Constraints

- Treat `src/features/generator/**`, `src/features/results/**`, `src/lib/ai/**`, and both API route implementations as a red zone; do not modify them.
- Keep the landing experience on `/`; do not add a page route or API route.
- Do not add a video-player dependency, database, server credential, or telemetry event.
- Use YouTube video ID `mDVlat1dtDY`.
- Use embed URL `https://www.youtube-nocookie.com/embed/mDVlat1dtDY`.
- Use fallback URL `https://www.youtube.com/watch?v=mDVlat1dtDY`.
- Store only a compressed poster image in Git; never store the video binary.
- Keep the poster at or below 250,000 bytes.
- Use session key `devpath-landing-dismissed` with value `1`.
- Support light and dark themes, reduced motion, keyboard navigation, 200% zoom, and a 320px-wide viewport.
- Preserve every existing CSP directive, including `connect-src 'self'`.
- Do not mount the generator during the initial storage check or while the landing curtain is idle.

---

## File Structure

- Create `src/features/landing/LandingCurtain.tsx`: semantic landing content, CTA callbacks, poster, lazy iframe, and YouTube fallback.
- Create `src/features/landing/LandingGate.tsx`: session lookup, reveal lifecycle, timeout fallback, generator mounting boundary, and focus handoff.
- Create `src/features/landing/landing.module.css`: curtain positioning, existing-design-token styling, responsive layout, and reduced-motion behavior.
- Create `public/images/devpath-demo-poster.webp`: compressed local poster derived from the public YouTube thumbnail.
- Create `tests/components/landing-curtain.test.tsx`: content, CTA, and click-to-load video tests.
- Create `tests/components/landing-gate.test.tsx`: mounting boundary, session persistence, failure fallback, transition, and focus tests.
- Modify `src/app/page.tsx`: wrap the current product header and generator shell in `LandingGate`; leave their existing markup intact.
- Modify `next.config.ts`: add the single `frame-src` directive for `youtube-nocookie.com`.
- Modify `e2e/devpath.spec.ts`: seed the session flag for legacy generator tests and add landing-specific browser coverage.
- Modify `README.md`: document external video hosting and the CSP exception.

---

### Task 1: Build the isolated landing curtain and lazy YouTube player

**Files:**
- Create: `src/features/landing/LandingCurtain.tsx`
- Create: `src/features/landing/landing.module.css`
- Create: `public/images/devpath-demo-poster.webp`
- Create: `tests/components/landing-curtain.test.tsx`

**Interfaces:**
- Consumes: `ThemeToggle` from `@/components/ThemeToggle`; Lucide icons `ArrowRight`, `Play`, and `ExternalLink`.
- Produces:
  ```ts
  export type LandingCurtainProps = {
    exiting: boolean;
    onOpenBuilder: () => void;
    onExitComplete: () => void;
  };

  export function LandingCurtain(props: LandingCurtainProps): React.JSX.Element;
  ```
- The root element exposes `data-testid="landing-curtain"` and invokes `onExitComplete` only when its own `transform` transition ends.

- [ ] **Step 1: Write the failing component tests**

Create `tests/components/landing-curtain.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LandingCurtain } from "@/features/landing/LandingCurtain";

describe("LandingCurtain", () => {
  it("explains the product, audience, workflow, and fallback", () => {
    render(
      <LandingCurtain
        exiting={false}
        onOpenBuilder={vi.fn()}
        onExitComplete={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", {
        name: "Turn a target role into a credible path forward.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Junior developers")).toBeInTheDocument();
    expect(screen.getByText("Career switchers")).toBeInTheDocument();
    expect(screen.getByText("Developers targeting a specific role")).toBeInTheDocument();
    expect(screen.getByText("Add the target job.")).toBeInTheDocument();
    expect(screen.getByText("Describe your current experience.")).toBeInTheDocument();
    expect(
      screen.getByText("Receive priorities, projects, and an application timeline."),
    ).toBeInTheDocument();
    expect(screen.queryByTitle("DevPath-AI product demonstration")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Watch on YouTube" })).toHaveAttribute(
      "href",
      "https://www.youtube.com/watch?v=mDVlat1dtDY",
    );
  });

  it("loads the privacy-enhanced iframe only after Play", async () => {
    const user = userEvent.setup();
    render(
      <LandingCurtain
        exiting={false}
        onOpenBuilder={vi.fn()}
        onExitComplete={vi.fn()}
      />,
    );

    expect(screen.queryByTitle("DevPath-AI product demonstration")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Play product demo" }));

    expect(screen.getByTitle("DevPath-AI product demonstration")).toHaveAttribute(
      "src",
      "https://www.youtube-nocookie.com/embed/mDVlat1dtDY?autoplay=1&playsinline=1&rel=0",
    );
  });

  it("routes CTAs and only completes the root transform transition", async () => {
    const user = userEvent.setup();
    const onOpenBuilder = vi.fn();
    const onExitComplete = vi.fn();
    const { rerender } = render(
      <LandingCurtain
        exiting={false}
        onOpenBuilder={onOpenBuilder}
        onExitComplete={onExitComplete}
      />,
    );

    await user.click(screen.getAllByRole("button", { name: "Build my roadmap" })[0]!);
    expect(onOpenBuilder).toHaveBeenCalledOnce();

    rerender(
      <LandingCurtain
        exiting
        onOpenBuilder={onOpenBuilder}
        onExitComplete={onExitComplete}
      />,
    );
    const curtain = screen.getByTestId("landing-curtain");
    fireEvent.transitionEnd(curtain, { propertyName: "opacity" });
    expect(onExitComplete).not.toHaveBeenCalled();
    fireEvent.transitionEnd(curtain, { propertyName: "transform" });
    expect(onExitComplete).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 2: Run the component test to verify it fails**

Run:

```powershell
npm test -- --run tests/components/landing-curtain.test.tsx
```

Expected: FAIL because `@/features/landing/LandingCurtain` does not exist.

- [ ] **Step 3: Create the local poster**

Resolve and verify the target path before writing:

```powershell
$landingPosterTarget = Resolve-Path -LiteralPath 'public' | ForEach-Object {
  Join-Path $_ 'images\devpath-demo-poster.webp'
}
$landingPosterRoot = [System.IO.Path]::GetFullPath((Resolve-Path -LiteralPath '.').Path)
$landingPosterFull = [System.IO.Path]::GetFullPath($landingPosterTarget)
if (-not $landingPosterFull.StartsWith($landingPosterRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw 'Poster target escaped the worktree.'
}
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $landingPosterFull) | Out-Null
$landingPosterSource = Join-Path ([System.IO.Path]::GetTempPath()) 'devpath-demo-maxres.jpg'
Invoke-WebRequest 'https://i.ytimg.com/vi/mDVlat1dtDY/maxresdefault.jpg' -OutFile $landingPosterSource
ffmpeg -y -i $landingPosterSource -vf 'scale=1280:-2' -c:v libwebp -quality 72 $landingPosterFull
(Get-Item -LiteralPath $landingPosterFull).Length
```

Expected: the last command prints a value no greater than `250000`. If it is larger, rerun only the `ffmpeg` command with `-quality 65` and verify again. Do not add the temporary JPEG to Git.

- [ ] **Step 4: Implement the semantic curtain and lazy iframe**

Create `src/features/landing/LandingCurtain.tsx`:

```tsx
"use client";

import { ArrowRight, ExternalLink, Play } from "lucide-react";
import Image from "next/image";
import { useState, type TransitionEvent } from "react";

import { ThemeToggle } from "@/components/ThemeToggle";
import styles from "./landing.module.css";

const EMBED_URL =
  "https://www.youtube-nocookie.com/embed/mDVlat1dtDY?autoplay=1&playsinline=1&rel=0";
const WATCH_URL = "https://www.youtube.com/watch?v=mDVlat1dtDY";

export type LandingCurtainProps = {
  exiting: boolean;
  onOpenBuilder: () => void;
  onExitComplete: () => void;
};

export function LandingCurtain({
  exiting,
  onOpenBuilder,
  onExitComplete,
}: LandingCurtainProps) {
  const [playing, setPlaying] = useState(false);

  const finishOwnTransform = (event: TransitionEvent<HTMLElement>) => {
    if (event.target === event.currentTarget && event.propertyName === "transform") {
      onExitComplete();
    }
  };

  return (
    <div
      className={`${styles.curtain} ${exiting ? styles.exiting : ""}`}
      data-testid="landing-curtain"
      aria-hidden={exiting || undefined}
      inert={exiting || undefined}
      onTransitionEnd={finishOwnTransform}
    >
      <header className={styles.header}>
        <a href="#landing-main" className="brand" aria-label="DevPath-AI landing page">
          DevPath-<span>AI</span>
        </a>
        <nav className={styles.headerActions} aria-label="Landing actions">
          <button type="button" className={styles.headerCta} onClick={onOpenBuilder}>
            Open builder
          </button>
          <ThemeToggle />
        </nav>
      </header>

      <main id="landing-main" className={styles.shell}>
        <section className={styles.hero} aria-labelledby="landing-title">
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>Evidence-based career planning</span>
            <h1 id="landing-title">Turn a target role into a credible path forward.</h1>
            <p>
              DevPath-AI compares the role you want with what you can prove today,
              then turns the gap into focused skills, portfolio projects, and a
              realistic application point.
            </p>
            <div className={styles.heroActions}>
              <button type="button" className={styles.primaryCta} onClick={onOpenBuilder}>
                Build my roadmap <ArrowRight size={17} aria-hidden="true" />
              </button>
              <a href="#how-it-works" className={styles.secondaryLink}>
                See how it works
              </a>
            </div>
          </div>

          <div className={styles.demo} aria-label="DevPath-AI demonstration">
            <div className={styles.videoFrame}>
              {playing ? (
                <iframe
                  src={EMBED_URL}
                  title="DevPath-AI product demonstration"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                <button
                  type="button"
                  className={styles.posterButton}
                  aria-label="Play product demo"
                  onClick={() => setPlaying(true)}
                >
                  <Image
                    src="/images/devpath-demo-poster.webp"
                    width={1280}
                    height={720}
                    sizes="(max-width: 900px) calc(100vw - 40px), 55vw"
                    alt=""
                    priority
                  />
                  <span className={styles.playBadge}>
                    <Play size={20} fill="currentColor" aria-hidden="true" /> Play demo
                  </span>
                </button>
              )}
            </div>
            <a href={WATCH_URL} target="_blank" rel="noreferrer" className={styles.watchLink}>
              Watch on YouTube <ExternalLink size={14} aria-hidden="true" />
            </a>
          </div>
        </section>

        <section className={styles.audience} aria-labelledby="audience-title">
          <h2 id="audience-title">Built for your next move</h2>
          <ul>
            <li>Junior developers</li>
            <li>Career switchers</li>
            <li>Developers targeting a specific role</li>
          </ul>
        </section>

        <section id="how-it-works" className={styles.workflow} aria-labelledby="workflow-title">
          <span className={styles.eyebrow}>How it works</span>
          <h2 id="workflow-title">From job post to focused execution.</h2>
          <ol>
            <li><span>01</span><strong>Add the target job.</strong></li>
            <li><span>02</span><strong>Describe your current experience.</strong></li>
            <li>
              <span>03</span>
              <strong>Receive priorities, projects, and an application timeline.</strong>
            </li>
          </ol>
        </section>

        <section className={styles.closing} aria-labelledby="closing-title">
          <div>
            <span className={styles.eyebrow}>Start with evidence</span>
            <h2 id="closing-title">Find your shortest credible path.</h2>
          </div>
          <button type="button" className={styles.primaryCta} onClick={onOpenBuilder}>
            Build my roadmap <ArrowRight size={17} aria-hidden="true" />
          </button>
        </section>
      </main>
    </div>
  );
}
```

- [ ] **Step 5: Add the compact responsive styles**

Create `src/features/landing/landing.module.css` with these required rules and values:

```css
.curtain {
  position: fixed;
  inset: 0;
  z-index: 100;
  overflow-y: auto;
  background: var(--surface-raised);
  color: var(--text);
  transform: translateY(0);
  transition: transform 420ms cubic-bezier(.22, 1, .36, 1);
}
.exiting { transform: translateY(-100%); pointer-events: none; }
.header {
  min-height: 82px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 max(20px, calc((100vw - 1240px) / 2));
  border-bottom: 1px solid var(--line);
  background: color-mix(in srgb, var(--surface-raised) 94%, transparent);
}
.headerActions, .heroActions, .watchLink {
  display: flex;
  align-items: center;
}
.headerActions { gap: 10px; }
.headerCta, .primaryCta {
  min-height: 44px;
  border: 0;
  border-radius: 5px;
  background: var(--blue);
  color: #fff;
  cursor: pointer;
  font: 650 .82rem/1 var(--sans);
}
.headerCta { padding: 0 14px; }
.primaryCta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 18px;
}
.shell { width: min(1240px, calc(100% - 40px)); margin: 0 auto; }
.hero {
  display: grid;
  grid-template-columns: minmax(0, .9fr) minmax(420px, 1.1fr);
  gap: clamp(28px, 5vw, 72px);
  align-items: center;
  padding: clamp(44px, 7vw, 84px) 0 46px;
  border-bottom: 1px solid var(--line);
}
.heroCopy h1 {
  max-width: 680px;
  margin: 10px 0 18px;
  font-size: clamp(2.45rem, 5.2vw, 4.7rem);
  line-height: .98;
  letter-spacing: -.055em;
  font-weight: 720;
}
.heroCopy > p {
  max-width: 620px;
  margin: 0;
  color: var(--muted);
  font-size: 1rem;
  line-height: 1.7;
}
.eyebrow {
  color: var(--blue);
  font-size: .76rem;
  font-weight: 750;
  text-transform: uppercase;
  letter-spacing: .08em;
}
.heroActions { flex-wrap: wrap; gap: 16px; margin-top: 26px; }
.secondaryLink, .watchLink { color: var(--blue); font-weight: 650; }
.videoFrame {
  position: relative;
  overflow: hidden;
  aspect-ratio: 16 / 9;
  border: 1px solid var(--line-strong);
  border-radius: 8px;
  background: #09090b;
}
.videoFrame iframe, .posterButton, .posterButton img {
  width: 100%;
  height: 100%;
}
.videoFrame iframe { display: block; border: 0; }
.posterButton { position: relative; display: block; border: 0; padding: 0; cursor: pointer; }
.posterButton img { display: block; object-fit: cover; }
.playBadge {
  position: absolute;
  left: 50%;
  top: 50%;
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  gap: 8px;
  transform: translate(-50%, -50%);
  border-radius: 999px;
  background: rgba(9, 9, 11, .88);
  color: #fff;
  padding: 0 16px;
  font: 700 .82rem/1 var(--sans);
}
.watchLink { justify-content: flex-end; gap: 5px; margin-top: 9px; font-size: .78rem; }
.audience, .workflow, .closing { padding: 34px 0; border-bottom: 1px solid var(--line); }
.audience { display: grid; grid-template-columns: 240px 1fr; gap: 28px; align-items: center; }
.audience h2, .workflow h2, .closing h2 { margin: 0; font-size: clamp(1.35rem, 2.5vw, 2rem); }
.audience ul, .workflow ol { list-style: none; padding: 0; margin: 0; }
.audience ul { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.audience li, .workflow li {
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--surface);
  padding: 16px;
}
.workflow h2 { margin-top: 7px; }
.workflow ol { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 22px; }
.workflow li { display: grid; gap: 12px; min-height: 116px; }
.workflow li span { color: var(--muted); font: 700 .72rem/1 var(--mono); }
.workflow li strong { line-height: 1.45; }
.closing {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  margin-bottom: 34px;
}
.closing h2 { margin-top: 7px; }
.loadingGate { position: fixed; inset: 0; background: var(--surface-raised); }
.builderLayer { display: contents; }
@media (max-width: 900px) {
  .hero { grid-template-columns: 1fr; }
  .demo { max-width: 760px; }
  .audience { grid-template-columns: 1fr; }
}
@media (max-width: 620px) {
  .header { padding-inline: 12px; }
  .headerCta { display: none; }
  .shell { width: min(100% - 24px, 1240px); }
  .hero { padding-top: 34px; gap: 30px; }
  .heroCopy h1 { font-size: 2.45rem; }
  .audience ul, .workflow ol { grid-template-columns: 1fr; }
  .closing { align-items: stretch; flex-direction: column; }
  .closing .primaryCta { width: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .curtain { transition-duration: .01ms; }
}
```

- [ ] **Step 6: Run the focused tests and static checks**

Run:

```powershell
npm test -- --run tests/components/landing-curtain.test.tsx
npm run lint -- --quiet
npm run typecheck
```

Expected: the focused test passes, and lint/typecheck exit with code 0.

- [ ] **Step 7: Commit Task 1**

```powershell
git add src/features/landing/LandingCurtain.tsx src/features/landing/landing.module.css public/images/devpath-demo-poster.webp tests/components/landing-curtain.test.tsx
git commit -m "feat: add landing curtain content and demo"
```

---

### Task 2: Add the session gate and wire the unchanged generator beneath it

**Files:**
- Create: `src/features/landing/LandingGate.tsx`
- Create: `tests/components/landing-gate.test.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `LandingCurtain` and arbitrary `ReactNode` children.
- Produces:
  ```ts
  export const LANDING_SESSION_KEY = "devpath-landing-dismissed";

  export type LandingGateProps = {
    children: React.ReactNode;
  };

  export function LandingGate({ children }: LandingGateProps): React.JSX.Element;
  ```
- Phase type is exactly:
  ```ts
  type LandingPhase = "checking" | "landing" | "exiting" | "builder";
  ```
- Reveal fallback is exactly `500` milliseconds, longer than the `420ms` CSS transition.

- [ ] **Step 1: Write the failing gate tests**

Create `tests/components/landing-gate.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  LANDING_SESSION_KEY,
  LandingGate,
} from "@/features/landing/LandingGate";

function installReducedMotion(matches: boolean) {
  vi.spyOn(window, "matchMedia").mockImplementation(
    () =>
      ({
        matches,
        media: "(prefers-reduced-motion: reduce)",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as MediaQueryList,
  );
}

function Builder() {
  return (
    <main id="main-content">
      <h1>Builder heading</h1>
      <label>
        Job description
        <textarea />
      </label>
    </main>
  );
}

describe("LandingGate", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
    installReducedMotion(false);
  });

  it("shows the landing curtain without mounting the builder on first visit", async () => {
    render(<LandingGate><Builder /></LandingGate>);
    expect(
      await screen.findByRole("heading", {
        name: "Turn a target role into a credible path forward.",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Job description")).not.toBeInTheDocument();
  });

  it("mounts beneath the exit, persists the session, and hands off focus", async () => {
    const user = userEvent.setup();
    render(<LandingGate><Builder /></LandingGate>);
    await user.click(await screen.findByRole("button", { name: "Build my roadmap" }));

    expect(screen.getByLabelText("Job description")).toBeInTheDocument();
    expect(sessionStorage.getItem(LANDING_SESSION_KEY)).toBe("1");
    fireEvent.transitionEnd(screen.getByTestId("landing-curtain"), {
      propertyName: "transform",
    });

    await waitFor(() => {
      expect(screen.queryByTestId("landing-curtain")).not.toBeInTheDocument();
      expect(screen.getByRole("heading", { name: "Builder heading" })).toHaveFocus();
    });
  });

  it("opens directly to the builder when the tab session is dismissed", async () => {
    sessionStorage.setItem(LANDING_SESSION_KEY, "1");
    render(<LandingGate><Builder /></LandingGate>);

    expect(await screen.findByLabelText("Job description")).toBeInTheDocument();
    expect(screen.queryByTestId("landing-curtain")).not.toBeInTheDocument();
  });

  it("still reveals when session storage writes fail", async () => {
    installReducedMotion(true);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError");
    });
    const user = userEvent.setup();
    render(<LandingGate><Builder /></LandingGate>);

    await user.click(await screen.findByRole("button", { name: "Build my roadmap" }));
    expect(await screen.findByLabelText("Job description")).toBeInTheDocument();
    expect(screen.queryByTestId("landing-curtain")).not.toBeInTheDocument();
  });

  it("falls back to the landing curtain when session storage reads fail", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError");
    });
    render(<LandingGate><Builder /></LandingGate>);

    expect(
      await screen.findByRole("heading", {
        name: "Turn a target role into a credible path forward.",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Job description")).not.toBeInTheDocument();
  });

  it("uses the timeout fallback when transitionend is absent", async () => {
    vi.useFakeTimers();
    render(<LandingGate><Builder /></LandingGate>);
    fireEvent.click(screen.getAllByRole("button", { name: "Build my roadmap" })[0]!);
    expect(screen.getByTestId("landing-curtain")).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(500);
    expect(screen.queryByTestId("landing-curtain")).not.toBeInTheDocument();
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run the gate test to verify it fails**

Run:

```powershell
npm test -- --run tests/components/landing-gate.test.tsx
```

Expected: FAIL because `@/features/landing/LandingGate` does not exist.

- [ ] **Step 3: Implement the phase and focus lifecycle**

Create `src/features/landing/LandingGate.tsx`:

```tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";

import { LandingCurtain } from "./LandingCurtain";
import styles from "./landing.module.css";

export const LANDING_SESSION_KEY = "devpath-landing-dismissed";
const REVEAL_FALLBACK_MS = 500;

type LandingPhase = "checking" | "landing" | "exiting" | "builder";

export type LandingGateProps = {
  children: ReactNode;
};

export function LandingGate({ children }: LandingGateProps) {
  const [phase, setPhase] = useState<LandingPhase>("checking");

  useEffect(() => {
    try {
      setPhase(
        sessionStorage.getItem(LANDING_SESSION_KEY) === "1"
          ? "builder"
          : "landing",
      );
    } catch {
      setPhase("landing");
    }
  }, []);

  useEffect(() => {
    if (phase !== "exiting") return;
    const fallback = window.setTimeout(
      () => setPhase("builder"),
      REVEAL_FALLBACK_MS,
    );
    return () => window.clearTimeout(fallback);
  }, [phase]);

  useEffect(() => {
    if (phase !== "builder") return;
    const heading = document.querySelector<HTMLElement>("#main-content h1");
    if (!heading) return;
    heading.tabIndex = -1;
    heading.focus();
  }, [phase]);

  const openBuilder = () => {
    try {
      sessionStorage.setItem(LANDING_SESSION_KEY, "1");
    } catch {
      // In-memory reveal still succeeds when storage is blocked.
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPhase("builder");
      return;
    }
    setPhase("exiting");
  };

  if (phase === "checking") {
    return <div className={styles.loadingGate} aria-label="Loading DevPath-AI" />;
  }

  const generatorMounted = phase === "exiting" || phase === "builder";

  return (
    <>
      <div
        className={styles.builderLayer}
        aria-hidden={phase !== "builder" || undefined}
        inert={phase !== "builder" || undefined}
      >
        {generatorMounted ? children : null}
      </div>
      {phase !== "builder" ? (
        <LandingCurtain
          exiting={phase === "exiting"}
          onOpenBuilder={openBuilder}
          onExitComplete={() => setPhase("builder")}
        />
      ) : null}
    </>
  );
}
```

- [ ] **Step 4: Wrap the current page composition without changing it**

Modify `src/app/page.tsx` to add only the import and outer gate:

```tsx
import { ThemeToggle } from "@/components/ThemeToggle";
import { GeneratorExperience } from "@/features/generator/GeneratorExperience";
import { LandingGate } from "@/features/landing/LandingGate";

export default function HomePage() {
  return (
    <LandingGate>
      <header className="productHeader">
        <h1>
          <a href="#main-content" className="brand" aria-label="devPathAI home">
            DevPath-<span>AI</span>
          </a>
        </h1>
        <ThemeToggle />
      </header>
      <main id="main-content" className="pageShell">
        <GeneratorExperience />
      </main>
    </LandingGate>
  );
}
```

Do not edit any imported generator or result file.

- [ ] **Step 5: Run focused and existing component tests**

Run:

```powershell
npm test -- --run tests/components/landing-gate.test.tsx tests/components/landing-curtain.test.tsx tests/components/generator-form.test.tsx tests/components/roadmap-results.test.tsx
npm run lint -- --quiet
npm run typecheck
git diff --name-only HEAD -- src/features/generator src/features/results src/lib/ai src/app/api
```

Expected:

- All focused and regression tests pass.
- Lint and typecheck exit with code 0.
- The red-zone diff command prints nothing.

- [ ] **Step 6: Commit Task 2**

```powershell
git add src/features/landing/LandingGate.tsx tests/components/landing-gate.test.tsx src/app/page.tsx
git commit -m "feat: reveal generator through session landing gate"
```

---

### Task 3: Permit the embed and add browser regression coverage

**Files:**
- Modify: `next.config.ts`
- Modify: `e2e/devpath.spec.ts`
- Modify: `README.md`

**Interfaces:**
- Consumes: `LANDING_SESSION_KEY` value `devpath-landing-dismissed`; the browser test must use the literal value because Playwright executes in the browser context.
- Produces:
  - Response CSP containing `frame-src https://www.youtube-nocookie.com`.
  - `gotoHydratedApp(page)` that seeds the landing dismissal flag before loading the legacy generator flow.
  - Landing tests that deliberately do not call `gotoHydratedApp`.

- [ ] **Step 1: Add failing landing browser tests**

At the top of `e2e/devpath.spec.ts`, add:

```ts
const LANDING_SESSION_KEY = "devpath-landing-dismissed";

async function gotoLanding(page: Page) {
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: "Turn a target role into a credible path forward.",
    }),
  ).toBeVisible();
}
```

Add these tests before the existing generator tests:

```ts
test("presents the landing curtain and lazy privacy-enhanced demo", async ({ page }) => {
  await gotoLanding(page);
  const response = await page.request.get("/");
  expect(response.headers()["content-security-policy"]).toContain(
    "frame-src https://www.youtube-nocookie.com",
  );
  expect(response.headers()["content-security-policy"]).toContain(
    "connect-src 'self'",
  );
  await expect(page.getByLabel("Job description")).toHaveCount(0);
  await expect(page.getByTitle("DevPath-AI product demonstration")).toHaveCount(0);

  await page.getByRole("button", { name: "Play product demo" }).click();
  await expect(page.getByTitle("DevPath-AI product demonstration")).toHaveAttribute(
    "src",
    /youtube-nocookie\.com\/embed\/mDVlat1dtDY/,
  );
  await expect(page.getByRole("link", { name: "Watch on YouTube" })).toHaveAttribute(
    "href",
    "https://www.youtube.com/watch?v=mDVlat1dtDY",
  );
});

test("reveals and remembers the unchanged generator for the tab session", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await gotoLanding(page);
  await page.getByRole("button", { name: "Build my roadmap" }).first().click();
  await expect(page.getByLabel("Job description")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Build your shortest credible path to the role." }),
  ).toBeFocused();
  expect(
    await page.evaluate((key) => sessionStorage.getItem(key), LANDING_SESSION_KEY),
  ).toBe("1");

  await page.reload();
  await expect(page.getByLabel("Job description")).toBeVisible();
  await expect(page.getByTestId("landing-curtain")).toHaveCount(0);
});

test("keeps the landing curtain within a 320px viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await gotoLanding(page);
  const dimensions = await page.evaluate(() => ({
    viewport: window.innerWidth,
    document: document.documentElement.scrollWidth,
  }));
  expect(dimensions).toEqual({ viewport: 320, document: 320 });

  const play = await page.getByRole("button", { name: "Play product demo" }).boundingBox();
  expect(play?.width).toBeLessThanOrEqual(296);
  expect(play?.height).toBeGreaterThanOrEqual(160);
});

test("keeps primary landing actions usable at a 200% zoom equivalent", async ({ page }) => {
  await page.setViewportSize({ width: 640, height: 450 });
  await gotoLanding(page);
  await expect(page.getByRole("button", { name: "Build my roadmap" }).first()).toBeVisible();
  await page.getByRole("heading", { name: "Find your shortest credible path." }).scrollIntoViewIfNeeded();
  await expect(page.getByRole("button", { name: "Build my roadmap" }).last()).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(640);
});
```

- [ ] **Step 2: Update the legacy helper before running the suite**

Change `gotoHydratedApp` to:

```ts
async function gotoHydratedApp(page: Page) {
  await page.addInitScript((key) => {
    sessionStorage.setItem(key, "1");
  }, LANDING_SESSION_KEY);
  const hydrated = page.waitForResponse((response) =>
    response.url().endsWith("/api/events") &&
    response.request().method() === "POST"
  );
  await page.goto("/");
  await hydrated;
}
```

This is a test setup adaptation, not an application bypass: landing-specific tests use `gotoLanding`, while existing tests continue to exercise the generator directly.

- [ ] **Step 3: Run the new E2E tests to verify the intended failures**

Run:

```powershell
npx playwright test e2e/devpath.spec.ts --grep "landing curtain|reveals and remembers|320px viewport|200% zoom" --project="Desktop Chromium"
```

Expected before the CSP change: FAIL because the response header does not contain `frame-src https://www.youtube-nocookie.com`.

- [ ] **Step 4: Add the surgical CSP permission**

Modify `next.config.ts` by inserting this directive after `connect-src 'self'`:

```ts
"frame-src https://www.youtube-nocookie.com",
```

Do not modify any other security directive.

- [ ] **Step 5: Document external hosting and privacy behavior**

Add this paragraph under `## Deployment` in `README.md`:

```markdown
The landing demo is hosted by YouTube and loaded through
`youtube-nocookie.com` only after the visitor selects Play. The repository
contains only a compressed poster image; do not commit the video binary.
Keep `frame-src https://www.youtube-nocookie.com` in the production Content
Security Policy.
```

- [ ] **Step 6: Run landing and legacy browser tests**

Run:

```powershell
npx playwright test e2e/devpath.spec.ts --project="Desktop Chromium"
npx playwright test e2e/devpath.spec.ts --project="Mobile Safari 320"
```

Expected: every landing test and every pre-existing generator test passes in both projects.

- [ ] **Step 7: Confirm the red zone is untouched and commit Task 3**

Run:

```powershell
git diff --name-only 092f48f -- src/features/generator src/features/results src/lib/ai src/app/api
git diff --check
```

Expected: the first command prints nothing; the second exits with code 0.

Commit:

```powershell
git add next.config.ts e2e/devpath.spec.ts README.md
git commit -m "test: cover landing reveal and video policy"
```

---

### Task 4: Run the complete release gate and inspect the feature boundary

**Files:**
- Verify only; do not create or modify files unless a failing check reveals a defect in Tasks 1–3.

**Interfaces:**
- Consumes: all Task 1–3 deliverables.
- Produces: a clean worktree with complete verification evidence and no red-zone changes.

- [ ] **Step 1: Run all unit and component tests**

```powershell
npm test
```

Expected: all test files and tests pass with zero failures.

- [ ] **Step 2: Run the complete two-project browser suite**

```powershell
npm run test:e2e
```

Expected: all Desktop Chromium and Mobile Safari 320 tests pass.

- [ ] **Step 3: Run static and production checks**

```powershell
npm run lint -- --quiet
npm run typecheck
npm run build
git diff --check
```

Expected: each command exits with code 0. The existing Next.js multiple-lockfile warning is informational if it remains unchanged.

- [ ] **Step 4: Verify assets, routes, dependencies, and red-zone integrity**

```powershell
(Get-Item -LiteralPath 'public\images\devpath-demo-poster.webp').Length
git diff --name-status 092f48f..HEAD
git diff --name-only 092f48f..HEAD -- src/features/generator src/features/results src/lib/ai src/app/api
git diff 092f48f..HEAD -- package.json package-lock.json
rg -n "mDVlat1dtDY|youtube-nocookie|devpath-landing-dismissed" src next.config.ts tests e2e README.md
```

Expected:

- Poster size is no greater than `250000`.
- No new `src/app/**/page.tsx` or `src/app/api/**` file appears.
- The red-zone command prints nothing.
- The dependency diff prints nothing.
- The final search shows the exact approved video ID, privacy-enhanced domain, and session key.

- [ ] **Step 5: Inspect Git status and commits**

```powershell
git status --short
git log --oneline -4
```

Expected: `git status --short` prints nothing. The recent history contains one focused commit for each implementation task plus the approved design and plan commits.

---

## Execution Notes

- This repository is already in the linked worktree `.worktrees/devpath-ai-mvp`; execution must confirm `git rev-parse --git-dir` differs from `git rev-parse --git-common-dir` and must not create another worktree.
- The existing PR is based on `feat/devpath-ai-mvp`. Do not push, amend the PR, merge, or delete the worktree unless the user explicitly requests that GitHub operation after implementation.
- If the YouTube thumbnail endpoint does not return `maxresdefault.jpg`, use `https://i.ytimg.com/vi/mDVlat1dtDY/hqdefault.jpg`, preserve the 16:9 output canvas with FFmpeg padding, and keep the same final WebP path and size ceiling:

```powershell
ffmpeg -y -i $landingPosterSource -vf "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2" -c:v libwebp -quality 72 $landingPosterFull
```
