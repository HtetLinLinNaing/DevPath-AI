import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GeneratorExperience } from "@/features/generator/GeneratorExperience";
import { saveSession, SESSION_KEY } from "@/features/generator/session-store";
import { RoadmapRequestSchema, RoadmapResponseSchema } from "@/lib/contracts/roadmap";
import { validModelOutput, validRequest } from "../fixtures/roadmap";

const request = RoadmapRequestSchema.parse(validRequest);
const result = RoadmapResponseSchema.parse({ ...validModelOutput, schemaVersion: "1.0", generatedAt: "2026-07-22T12:00:00.000Z" });

describe("result actions", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    sessionStorage.clear();
    saveSession(request, result);
    vi.restoreAllMocks();
  });

  it("downloads Markdown and opens the print dialog", async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn(() => "blob:roadmap");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("URL", { ...URL, createObjectURL, revokeObjectURL });
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    const print = vi.spyOn(window, "print").mockImplementation(() => undefined);

    render(<GeneratorExperience />);
    await screen.findByRole("article", { name: "Backend Engineer roadmap" });
    await user.click(screen.getByRole("button", { name: "Download Markdown" }));
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(anchorClick).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:roadmap");

    await user.click(screen.getByRole("button", { name: "Print / Save PDF" }));
    expect(print).toHaveBeenCalledOnce();
  });

  it("requires confirmation before clearing local data, then resets and focuses the form", async () => {
    const user = userEvent.setup();
    const confirm = vi.spyOn(window, "confirm").mockReturnValueOnce(false).mockReturnValueOnce(true);
    render(<GeneratorExperience />);
    await screen.findByRole("article", { name: "Backend Engineer roadmap" });

    await user.click(screen.getByRole("button", { name: "Clear my data" }));
    expect(sessionStorage.getItem(SESSION_KEY)).not.toBeNull();
    expect(screen.getByRole("article", { name: "Backend Engineer roadmap" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Clear my data" }));
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    await waitFor(() => expect(screen.getByLabelText("Job description")).toHaveFocus());
  });
});
