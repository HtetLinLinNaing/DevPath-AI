---
marp: true
paginate: true
transition: fade
# PechaKucha: 6 slides, 20s auto-advance.
auto-advance: 20
---

<!-- slide 1 -->

# Product foundation

- **Framework:** Next.js App Router with React 19 and TypeScript.
- **Purpose:** Collect a target role and current evidence, then present a validated career roadmap.
- **UI:** Responsive dark interface with Tailwind CSS, HeroUI, Lucide icons, and Framer Motion.

---

<!-- slide 2 -->

# AI and contracts

- **Provider:** OpenRouter is called from server-only code; browser code never receives the API key.
- **Validation:** Zod contracts define request, response, error, event, and roadmap shapes.
- **Quality:** Semantic validation checks the generated roadmap before results reach the user.

---

<!-- slide 3 -->

# Agents and skills

- **Agent:** `.claude/agents/career-mentor.md` reviews roadmap changes for evidence, privacy, accessibility, and regressions.
- **Skill:** `.claude/skills/career-roadmap/SKILL.md` checks roadmap completeness, project evidence, application timing, and safety boundaries.
- **Trigger:** Ask to use the career-roadmap skill when reviewing roadmap output or generator-related changes.

---

<!-- slide 4 -->

# Methodology

- **Plan first:** Brainstorm the user outcome and preserve generator red zones before implementation.
- **Test first:** Add focused unit/component coverage, then verify responsive browser flows with Playwright.
- **Verify before handoff:** Run tests, lint, typecheck, build, diff checks, and inspect the final GitHub branch/PR state.

---

<!-- slide 5 -->

# Commands

- **Development:** `npm run dev`, `npm run lint`, and `npm run typecheck`.
- **Tests:** `npm test` and `npm run test:e2e` for Vitest and Playwright coverage.
- **Release:** `npm run build`, `git diff --check`, then `gh pr create` for review.

---

<!-- slide 6 -->

# Delivery safeguards

- **Privacy:** Content-free logs, no-store POST responses, exact-origin checks, and server-only provider credentials.
- **Fair use:** Signed anonymous UUID cookie rate limiting avoids shared-IP conflicts behind gateways.
- **Experience:** Session landing gate, click-to-load YouTube demo, keyboard focus handling, and mobile coverage.
