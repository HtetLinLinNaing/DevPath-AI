# DevPath-AI Landing Curtain Design

**Date:** 2026-07-25

**Status:** Approved for implementation planning

## Objective

Add a compact landing experience that explains DevPath-AI, identifies its intended audience, demonstrates the product, and directs visitors into the roadmap builder. The landing experience must match the existing interface and must not modify the generator, its form, its state machine, its API client, or its result components.

## Non-goals

- Do not change `GeneratorExperience` or any generator or result feature.
- Do not add an application route or API route.
- Do not store or serve the demo video from GitHub or the application deployment.
- Do not add a video-player package, database, account system, or persistent user preference.
- Do not redesign the existing product header or generator interface.

## Audience and Message

The primary audience is junior developers and career switchers targeting a specific technology role.

The landing page communicates that DevPath-AI compares a target job with the evidence a person can provide today, then produces prioritized skills, portfolio projects, and a realistic application timeline.

## Content Hierarchy

The landing curtain contains these compact sections:

1. **Header**
   - Existing DevPath-AI brand treatment.
   - Existing theme toggle.
   - Compact `Open builder` CTA.
2. **Hero**
   - Eyebrow: `Evidence-based career planning`
   - Heading: `Turn a target role into a credible path forward.`
   - A brief product explanation.
   - Primary CTA: `Build my roadmap`
   - Secondary anchor: `See how it works`
3. **Demo**
   - A local, optimized 16:9 WebP poster with an accessible Play control.
   - Click-to-load privacy-enhanced YouTube player.
4. **Audience**
   - Junior developers.
   - Career switchers.
   - Developers targeting a specific role.
5. **How it works**
   1. Add the target job.
   2. Describe current experience.
   3. Receive priorities, projects, and an application timeline.
6. **Closing CTA**
   - Heading: `Find your shortest credible path.`
   - CTA: `Build my roadmap`

## Interaction Model

The landing page is a full-viewport curtain on the existing `/` route. It covers the application instead of introducing a separate landing route.

On a first visit in a browser tab:

1. Render the landing curtain.
2. Do not mount the generator beneath it.
3. Keep the curtain vertically scrollable when its content exceeds the viewport.

When a visitor selects either primary CTA:

1. Mount the unchanged generator beneath the curtain.
2. Store a dismissal flag in `sessionStorage`.
3. Animate the curtain upward out of the viewport.
4. Remove the curtain on `transitionend`, with a short timeout fallback so an interrupted transition cannot leave it blocking the generator.
5. Move keyboard focus to the generator's main heading.

When reduced motion is requested, skip the slide and reveal the generator immediately.

On reload in the same tab, the dismissal flag opens the generator directly. A new tab has a new session and shows the landing curtain again. If storage is unavailable, dismissal still works for the current render, but the curtain may return after a reload.

## Component Boundaries

Introduce a client-side landing shell at the top-level page composition. It owns:

- reading and writing the session dismissal flag;
- the reveal state and transition lifecycle;
- mounting the generator at the start of dismissal;
- removing the curtain after the transition;
- focus handoff after reveal.

Introduce an isolated `LandingCurtain` component. It owns:

- landing content and navigation;
- CTA callbacks;
- demo poster and click-to-load video state;
- accessible YouTube fallback behavior;
- curtain-specific responsive styling.

The existing `GeneratorExperience` remains an opaque child. Its code and public behavior are not changed.

## Video Hosting

YouTube hosts and streams the video. The repository stores only landing code and a small optimized poster image, not the video binary.

- Video ID: `mDVlat1dtDY`
- Embed origin: `https://www.youtube-nocookie.com`
- Embed URL: `https://www.youtube-nocookie.com/embed/mDVlat1dtDY`
- Public fallback: `https://www.youtube.com/watch?v=mDVlat1dtDY`

The iframe is not created until the visitor selects Play. The embed:

- retains visible player controls;
- permits fullscreen and picture-in-picture;
- has an accessible title;
- uses strict-origin-when-cross-origin referrer behavior;
- does not request autoplay before user interaction;
- remains responsive at a 16:9 aspect ratio.

If the iframe fails or embedding is unavailable, the visible fallback opens the public video on YouTube.

## Visual Compatibility

The landing curtain reuses the current design language:

- existing light and dark theme variables;
- 1240px maximum content shell;
- blue primary actions;
- neutral raised surfaces and restrained borders;
- existing typography and compact control sizing;
- current product header height and brand treatment;
- visible keyboard focus;
- existing mobile breakpoints and 320px minimum viewport support.

The layout is compact rather than a long marketing site. Desktop uses a balanced hero/demo composition. Narrow screens stack content in reading order without horizontal overflow.

## Accessibility

- The landing content uses semantic header, main, section, heading, and navigation structure.
- The underlying generator is not mounted until dismissal begins, so it cannot receive premature keyboard or assistive-technology access.
- CTA controls are native buttons or links with visible focus.
- The video poster has an explicit Play label and the iframe has a descriptive title.
- Focus moves to the generator after reveal.
- Reduced-motion preferences disable the curtain transition.
- Content remains readable and operable at 200% zoom and a 320px viewport.

## Security Policy

Update the site Content Security Policy with:

```text
frame-src https://www.youtube-nocookie.com
```

Keep all existing directives, including `connect-src 'self'`, unchanged. A local poster avoids adding a remote image host to `img-src`.

No YouTube API key, server credential, new API route, or backend request is required.

## Failure Handling

- **Unavailable session storage:** reveal the generator normally and retain the dismissal only in component state.
- **Interrupted transition:** the generator is already mounted, and the timeout fallback removes a curtain that does not emit `transitionend`.
- **Video embed unavailable:** keep a direct YouTube fallback visible.
- **Poster unavailable:** preserve the Play control and text label without depending on the image.

## Telemetry and Performance

The generator is not mounted before dismissal, preventing premature `generator_viewed` telemetry and avoiding generator-side session restoration work behind the curtain.

The YouTube iframe is lazy by interaction, preventing its network and rendering cost for visitors who do not watch the demo. The local poster must be compressed and kept small enough to have negligible repository and initial-page impact.

No new telemetry event is required for the first implementation.

## Verification

### Component tests

- First visit renders the curtain and does not mount the generator.
- CTA dismissal mounts the generator and stores the session flag.
- An existing session flag opens directly to the generator.
- Storage read or write failures do not block dismissal.
- Play creates the privacy-enhanced iframe only after interaction.
- The public YouTube fallback is present.

### Browser tests

- Desktop and Mobile Safari 320 layouts remain within the viewport.
- Keyboard focus cannot reach the generator before dismissal.
- Focus moves into the generator after dismissal.
- Reduced-motion mode reveals without animation.
- The video maintains a 16:9 layout and does not overflow.
- The embed URL uses `youtube-nocookie.com`.
- The existing generator flow remains functional after reveal.

### Release gate

- Existing unit and component tests.
- Existing Playwright suite.
- New landing component and browser tests.
- ESLint.
- TypeScript typecheck.
- Next.js production build.

## Acceptance Criteria

The feature is complete when a first-time tab visitor sees a compact, responsive landing curtain; can understand the product and audience; can play the hosted demo without any video binary in Git; can reveal the unchanged generator through a clear CTA; and remains on the generator for subsequent reloads in that tab.
