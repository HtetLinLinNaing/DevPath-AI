---
marp: true
paginate: true
transition: fade
# PechaKucha: 6 slides, 20s auto-advance. Do not change the count.
auto-advance: 20
---

<!-- slide 1 -->

# Who's my person?

- **Target User:** Junior developers, career switchers, and self-taught builders preparing for a specific tech role.
- **The Reality:** Job descriptions list a long mix of skills, tools, and expectations, but rarely explain what to learn first.
- **Their Goal:** Turn a target role and their current evidence into a focused, realistic path to job readiness.

---

<!-- slide 2 -->

# Their problem

- **Requirement Overload:** A single role can combine languages, frameworks, cloud tools, projects, and soft-skill expectations.
- **No Personal Gap Map:** Generic tutorials do not show which requirements the candidate already covers or which gaps matter most.
- **The Result:** Candidates lose time jumping between courses and still cannot tell when they are ready to apply.

---

<!-- slide 3 -->

# What I built

- **The Solution:** DevPath AI — a Next.js web app that converts a target job description and current profile evidence into a validated roadmap.
- **What it does:** Maps requirements, prioritizes gaps, creates four to six learning phases, defines exactly two portfolio projects, and adds an application timeline.
- **The Output:** A compact guided form and evidence-based roadmap with Markdown download, print support, saved browser-session state, and an in-app demo landing curtain.

---

<!-- slide 4 -->

# How I built it

- **Stack:** Built the App Router UI in Next.js and TypeScript, with Zod contracts shared across browser state, API validation, and model output.
- **AI Boundary:** Sends structured requests through a server-only OpenRouter integration, then validates and semantically checks the returned roadmap before display.
- **Reliability:** Added Playwright coverage for desktop and 320px mobile flows, strict origin and payload guards, content-free logging, and signed anonymous UUID rate limiting.

---

<!-- slide 5 -->

# Why it matters

- **Apply With Direction:** Candidates see the highest-impact gaps and the earliest realistic application point instead of waiting for perfect mastery.
- **Build Proof, Not Just Plans:** Each roadmap includes two portfolio projects tied to the role requirements and measurable evidence.
- **Trust the Workflow:** Privacy-first request handling, session-only browser persistence, no IP-based user bucket, and a click-to-load YouTube demo keep the experience focused and safer to operate.

---

<!-- slide 6 -->

# Done checklist

- [x] repo public with MIT license
- [x] landing curtain with YouTube demo and generator CTA
- [x] validated roadmap workflow with responsive Playwright coverage
- [x] README deployment, privacy, and staging guidance
