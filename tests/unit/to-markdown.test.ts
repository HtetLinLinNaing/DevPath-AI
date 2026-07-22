import { describe, expect, it } from "vitest";

import { RoadmapResponseSchema } from "@/lib/contracts/roadmap";
import { roadmapToMarkdown } from "@/lib/roadmap/to-markdown";
import { validModelOutput } from "../fixtures/roadmap";

const result = RoadmapResponseSchema.parse({ ...validModelOutput, schemaVersion: "1.0", generatedAt: "2026-07-22T12:00:00.000Z" });

describe("roadmapToMarkdown", () => {
  it("serializes every non-empty roadmap section deterministically", () => {
    const markdown = roadmapToMarkdown(result);
    ["# Backend Engineer Roadmap", "## Readiness Summary", "## Requirement Coverage", "## Priority Gaps", "## Learning Roadmap", "## Proof-of-Readiness Projects", "## Timeline", "## Final Advice"].forEach((heading) => expect(markdown).toContain(heading));
    expect(markdown).not.toContain("## Certifications");
    expect(markdown).toContain("Job requirement 1");
    expect(markdown).toContain("Automated tests pass.");
    expect(markdown).toContain("### Project 1: Containerized API");
    expect(markdown).toContain("### Project 2: AWS Delivery Capstone");
    expect(markdown).toContain("Week 6");
    expect(markdown).toContain("Start applying after the focused project.");
    expect(markdown).toContain("guidance, not a hiring guarantee");
    expect(roadmapToMarkdown(result)).toBe(markdown);
  });

  it("escapes Markdown control characters and emits no HTML", () => {
    const unsafe = RoadmapResponseSchema.parse({
      ...result,
      readiness: { ...result.readiness, rationale: "Use A | B \\ C <script>alert(1)</script>" },
    });
    const markdown = roadmapToMarkdown(unsafe);
    expect(markdown).toContain("A \\| B \\\\ C \\<script\\>");
    expect(markdown).not.toContain("<script>");
    expect(markdown).not.toContain("</script>");
  });
});
