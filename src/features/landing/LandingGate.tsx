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
