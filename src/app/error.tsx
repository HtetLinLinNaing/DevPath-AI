"use client";

import { RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Application render failed", { digest: error.digest });
  }, [error]);

  return (
    <main className="errorBoundary">
      <span>DevPathAI</span>
      <h1>We could not show this page.</h1>
      <p>Your saved browser session has not been changed.</p>
      <button type="button" onClick={reset}><RotateCcw size={17} /> Try again</button>
    </main>
  );
}
