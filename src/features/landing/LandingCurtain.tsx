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
    if (
      event.target === event.currentTarget &&
      event.propertyName === "transform"
    ) {
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
        <a
          href="#landing-main"
          className="brand"
          aria-label="DevPath-AI landing page"
        >
          DevPath-<span>AI</span>
        </a>
        <nav className={styles.headerActions} aria-label="Landing actions">
          <button
            type="button"
            className={styles.headerCta}
            onClick={onOpenBuilder}
          >
            Open builder
          </button>
          <ThemeToggle />
        </nav>
      </header>

      <main id="landing-main" className={styles.shell}>
        <section className={styles.hero} aria-labelledby="landing-title">
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}>
              Evidence-based career planning
            </span>
            <h1 id="landing-title">
              Turn a target role into a credible path forward.
            </h1>
            <p>
              DevPath-AI compares the role you want with what you can prove
              today, then turns the gap into focused skills, portfolio
              projects, and a realistic application point.
            </p>
            <div className={styles.heroActions}>
              <button
                type="button"
                className={styles.primaryCta}
                onClick={onOpenBuilder}
              >
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
                    <Play
                      size={20}
                      fill="currentColor"
                      aria-hidden="true"
                    />{" "}
                    Play demo
                  </span>
                </button>
              )}
            </div>
            <a
              href={WATCH_URL}
              target="_blank"
              rel="noreferrer"
              className={styles.watchLink}
            >
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

        <section
          id="how-it-works"
          className={styles.workflow}
          aria-labelledby="workflow-title"
        >
          <span className={styles.eyebrow}>How it works</span>
          <h2 id="workflow-title">From job post to focused execution.</h2>
          <ol>
            <li>
              <span>01</span>
              <strong>Add the target job.</strong>
            </li>
            <li>
              <span>02</span>
              <strong>Describe your current experience.</strong>
            </li>
            <li>
              <span>03</span>
              <strong>
                Receive priorities, projects, and an application timeline.
              </strong>
            </li>
          </ol>
        </section>

        <section className={styles.closing} aria-labelledby="closing-title">
          <div>
            <span className={styles.eyebrow}>Start with evidence</span>
            <h2 id="closing-title">Find your shortest credible path.</h2>
          </div>
          <button
            type="button"
            className={styles.primaryCta}
            onClick={onOpenBuilder}
          >
            Build my roadmap <ArrowRight size={17} aria-hidden="true" />
          </button>
        </section>
      </main>
    </div>
  );
}
