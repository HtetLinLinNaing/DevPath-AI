"use client";

import { RotateCcw } from "lucide-react";
import { useEffect, useReducer, useRef, useState } from "react";

import type { ApiError } from "@/lib/contracts/api-error";
import type { RoadmapRequest } from "@/lib/contracts/roadmap";
import { GeneratorForm } from "@/features/generator/GeneratorForm";
import { createInitialRequest, generatorReducer } from "@/features/generator/generator-machine";
import { requestRoadmap } from "@/features/generator/roadmap-api";
import { clearSession, loadSession, saveSession } from "@/features/generator/session-store";
import { RoadmapResults } from "@/features/results/RoadmapResults";
import { roadmapToMarkdown } from "@/lib/roadmap/to-markdown";
import styles from "./generator.module.css";

function normalizeError(error: unknown): ApiError {
  if (typeof error === "object" && error !== null && "code" in error && "message" in error) return error as ApiError;
  return { code: "INTERNAL_ERROR", message: "Something went wrong while generating your roadmap.", retryable: true, requestId: "client" };
}

function downloadMarkdown(markdown: string) {
  const url = URL.createObjectURL(new Blob([markdown], { type: "text/markdown;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "devpath-roadmap.md";
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function GeneratorExperience() {
  const [state, dispatch] = useReducer(generatorReducer, { status: "editing", input: createInitialRequest(), error: null });
  const [elapsed, setElapsed] = useState(0);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => {
    const restored = loadSession();
    if (restored) dispatch({ type: "RESTORE", ...restored });
  }, []);

  useEffect(() => {
    if (state.status !== "submitting") { setElapsed(0); return; }
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - state.startedAt) / 1_000)), 1_000);
    return () => window.clearInterval(timer);
  }, [state]);

  const submit = async (input: RoadmapRequest) => {
    const requestId = crypto.randomUUID();
    controller.current?.abort();
    controller.current = new AbortController();
    dispatch({ type: "UPDATE", input });
    dispatch({ type: "SUBMIT", requestId, startedAt: Date.now() });
    try {
      const result = await requestRoadmap(input, controller.current.signal);
      saveSession(input, result);
      dispatch({ type: "SUCCEED", requestId, result });
    } catch (error) {
      if (controller.current.signal.aborted) {
        dispatch({ type: "CANCEL" });
      } else {
        dispatch({ type: "FAIL", requestId, error: normalizeError(error) });
      }
    }
  };

  if (state.status === "success") {
    const clear = () => {
      if (!window.confirm("Clear your saved roadmap and all form inputs?")) return;
      controller.current?.abort();
      clearSession();
      dispatch({ type: "RESET" });
      window.setTimeout(() => document.getElementById("job-description")?.focus(), 0);
    };
    return <RoadmapResults result={state.result} onEdit={() => dispatch({ type: "EDIT" })} onRegenerate={() => void submit(state.input as RoadmapRequest)} onDownload={() => downloadMarkdown(roadmapToMarkdown(state.result))} onPrint={() => window.print()} onClear={clear} />;
  }

  return (
    <>
      <header className={styles.intro}>
        <div><span className={styles.eyebrow}>Evidence-based career planning</span><h1>Build your shortest credible path to the role.</h1></div>
        <p>Compare the job with what you can prove today. Leave with priorities, projects, and a realistic application point.</p>
      </header>
      {state.status === "submitting" && <div className={styles.loading} role="status" aria-live="polite"><span className={styles.spinner} /> <span><strong>Analyzing your target role...</strong><small>Building an evidence-based roadmap - {elapsed}s</small></span></div>}
      {state.status === "error" && <div className={styles.requestError} role="alert"><div><strong>Roadmap generation failed</strong><p>{state.error.message}</p></div>{state.canRetry && <button type="button" className={styles.textButton} onClick={() => void submit(state.input as RoadmapRequest)}><RotateCcw size={16} /> Retry</button>}</div>}
      <GeneratorForm
        input={state.input}
        submitting={state.status === "submitting"}
        onChange={(input) => dispatch({ type: "UPDATE", input })}
        onSubmit={(input) => void submit(input)}
        onCancel={() => { controller.current?.abort(); dispatch({ type: "CANCEL" }); }}
      />
      <div className={styles.liveRegion} aria-live="polite">{state.status === "submitting" ? `Generating roadmap, ${elapsed} seconds elapsed.` : ""}</div>
    </>
  );
}
