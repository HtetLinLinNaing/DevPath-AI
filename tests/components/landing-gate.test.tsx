import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  LANDING_SESSION_KEY,
  LandingGate,
} from "@/features/landing/LandingGate";

let reducedMotion = false;

function installMatchMedia() {
  vi.spyOn(window, "matchMedia").mockImplementation(
    () =>
      ({
        matches: reducedMotion,
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

function transitionEnd(element: HTMLElement, propertyName: string) {
  const event = new Event("transitionend", { bubbles: true });
  Object.defineProperty(event, "propertyName", { value: propertyName });
  fireEvent(element, event);
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
    vi.restoreAllMocks();
    vi.useRealTimers();
    sessionStorage.clear();
    reducedMotion = false;
    installMatchMedia();
  });

  it("shows the landing curtain without mounting the builder on first visit", async () => {
    render(
      <LandingGate>
        <Builder />
      </LandingGate>,
    );
    expect(
      await screen.findByRole("heading", {
        name: "Turn a target role into a credible path forward.",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Job description")).not.toBeInTheDocument();
  });

  it("mounts beneath the exit, persists the session, and hands off focus", async () => {
    const user = userEvent.setup();
    render(
      <LandingGate>
        <Builder />
      </LandingGate>,
    );
    await user.click(
      (await screen.findAllByRole("button", { name: "Build my roadmap" }))[0]!,
    );

    expect(screen.getByLabelText("Job description")).toBeInTheDocument();
    expect(sessionStorage.getItem(LANDING_SESSION_KEY)).toBe("1");
    transitionEnd(screen.getByTestId("landing-curtain"), "transform");

    await waitFor(() => {
      expect(screen.queryByTestId("landing-curtain")).not.toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: "Builder heading" }),
      ).toHaveFocus();
    });
  });

  it("opens directly to the builder when the tab session is dismissed", async () => {
    sessionStorage.setItem(LANDING_SESSION_KEY, "1");
    render(
      <LandingGate>
        <Builder />
      </LandingGate>,
    );

    expect(await screen.findByLabelText("Job description")).toBeInTheDocument();
    expect(screen.queryByTestId("landing-curtain")).not.toBeInTheDocument();
  });

  it("still reveals when session storage writes fail", async () => {
    reducedMotion = true;
    vi.spyOn(window.sessionStorage, "setItem").mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError");
    });
    const user = userEvent.setup();
    render(
      <LandingGate>
        <Builder />
      </LandingGate>,
    );

    await user.click(
      (await screen.findAllByRole("button", { name: "Build my roadmap" }))[0]!,
    );
    expect(await screen.findByLabelText("Job description")).toBeInTheDocument();
    expect(screen.queryByTestId("landing-curtain")).not.toBeInTheDocument();
  });

  it("falls back to the landing curtain when session storage reads fail", async () => {
    vi.spyOn(window.sessionStorage, "getItem").mockImplementation(() => {
      throw new DOMException("Storage blocked", "SecurityError");
    });
    render(
      <LandingGate>
        <Builder />
      </LandingGate>,
    );

    expect(
      await screen.findByRole("heading", {
        name: "Turn a target role into a credible path forward.",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Job description")).not.toBeInTheDocument();
  });

  it("uses the timeout fallback when transitionend is absent", async () => {
    vi.useFakeTimers();
    render(
      <LandingGate>
        <Builder />
      </LandingGate>,
    );
    fireEvent.click(
      screen.getAllByRole("button", { name: "Build my roadmap" })[0]!,
    );
    expect(screen.getByTestId("landing-curtain")).toBeInTheDocument();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(screen.queryByTestId("landing-curtain")).not.toBeInTheDocument();
  });
});
