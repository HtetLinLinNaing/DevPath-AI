import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LandingCurtain } from "@/features/landing/LandingCurtain";

function transitionEnd(element: HTMLElement, propertyName: string) {
  const event = new Event("transitionend", { bubbles: true });
  Object.defineProperty(event, "propertyName", { value: propertyName });
  fireEvent(element, event);
}

describe("LandingCurtain", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({
        matches: false,
        media: "",
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

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
    transitionEnd(curtain, "opacity");
    expect(onExitComplete).not.toHaveBeenCalled();
    transitionEnd(curtain, "transform");
    expect(onExitComplete).toHaveBeenCalledOnce();
  });
});
