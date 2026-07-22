import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RoadmapResults } from "@/features/results/RoadmapResults";
import { RoadmapResponseSchema } from "@/lib/contracts/roadmap";
import { validModelOutput } from "../fixtures/roadmap";

const result = RoadmapResponseSchema.parse({
  ...validModelOutput,
  schemaVersion: "1.0",
  generatedAt: "2026-07-22T12:00:00.000Z",
});

const callbacks = {
  onEdit: vi.fn(),
  onRegenerate: vi.fn(),
  onDownload: vi.fn(),
  onPrint: vi.fn(),
  onClear: vi.fn(),
};

describe("RoadmapResults", () => {
  it("renders a navigable, evidence-complete roadmap", () => {
    render(<RoadmapResults result={result} {...callbacks} />);

    expect(screen.getByRole("article", { name: "Backend Engineer roadmap" })).toBeInTheDocument();
    expect(screen.getByText("Developing", { selector: "span" })).toBeInTheDocument();
    result.readiness.topActions.forEach((action) => expect(screen.getByText(action)).toBeInTheDocument());
    expect(screen.getByText(result.readiness.applicationRecommendation)).toBeInTheDocument();

    const table = screen.getByRole("table", { name: /job requirement coverage/i });
    ["Requirement", "Evidence from job", "Importance", "Coverage", "Confidence", "Assessment"].forEach((header) => {
      expect(within(table).getByRole("columnheader", { name: header })).toBeInTheDocument();
    });
    result.requirements.forEach((requirement) => {
      expect(within(table).getByText(requirement.sourceEvidence)).toBeInTheDocument();
      expect(within(table).getAllByText(requirement.coverage, { exact: false }).length).toBeGreaterThan(0);
      expect(within(table).getAllByText(requirement.confidence, { exact: false }).length).toBeGreaterThan(0);
    });

    result.gaps.forEach((gap) => {
      expect(screen.getByRole("heading", { name: gap.name })).toBeInTheDocument();
      expect(screen.getAllByText(gap.priority, { exact: false }).length).toBeGreaterThan(0);
      gap.assumptions.forEach((assumption) => expect(screen.getByText(assumption)).toBeInTheDocument());
    });

    const phases = screen.getAllByTestId("roadmap-phase");
    expect(phases).toHaveLength(4);
    result.roadmap.forEach((phase, index) => {
      expect(within(phases[index]!).getByText(phase.acceptanceCriteria[0]!)).toBeInTheDocument();
      expect(within(phases[index]!).getByText(phase.interviewChecks[0]!)).toBeInTheDocument();
    });
    expect(screen.getAllByTestId("portfolio-project")).toHaveLength(2);
    result.projects.forEach((project) => {
      expect(screen.getByRole("heading", { name: project.title })).toBeInTheDocument();
      expect(screen.getByText(project.demonstrationMethod)).toBeInTheDocument();
    });

    expect(screen.getByText("6-10 hours per week")).toBeInTheDocument();
    expect(screen.getByText("Start applying in week 6")).toBeInTheDocument();
    expect(screen.getByText(result.timeline.targetDateExplanation)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Certifications" })).not.toBeInTheDocument();
    result.finalAdvice.forEach((advice) => expect(screen.getByText(advice)).toBeInTheDocument());

    const nav = screen.getByRole("navigation", { name: "Roadmap sections" });
    ["summary", "requirements", "gaps", "roadmap", "projects", "timeline", "advice"].forEach((section) => {
      expect(within(nav).getByRole("link", { name: new RegExp(section, "i") })).toHaveAttribute("href", `#${section}`);
      expect(document.getElementById(section)).toBeInTheDocument();
    });
  });
});
