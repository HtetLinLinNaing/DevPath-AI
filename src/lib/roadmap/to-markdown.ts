import type { RoadmapResponse } from "@/lib/contracts/roadmap";

function escapeMarkdown(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("|", "\\|")
    .replaceAll("<", "\\<")
    .replaceAll(">", "\\>")
    .replace(/([#*_\[\]])/g, "\\$1");
}

function bulletList(items: string[]): string[] {
  return items.map((item) => "- " + escapeMarkdown(item));
}

function names(ids: string[], requirements: Map<string, string>): string {
  return ids.map((id) => escapeMarkdown(requirements.get(id) ?? id)).join(", ");
}

export function roadmapToMarkdown(result: RoadmapResponse): string {
  const lines: string[] = [];
  const requirementNames = new Map(result.requirements.map(({ id, name }) => [id, name]));

  lines.push(
    "# " + escapeMarkdown(result.readiness.targetRole) + " Roadmap",
    "",
    "Generated: " + escapeMarkdown(result.generatedAt),
    "",
    "## Readiness Summary",
    "",
    "- **Band:** " + escapeMarkdown(result.readiness.band),
    "- **Seniority:** " + escapeMarkdown(result.readiness.seniority),
    "- **Role focus:** " + escapeMarkdown(result.readiness.roleFocus),
    "",
    escapeMarkdown(result.readiness.rationale),
    "",
    "### Top Actions",
    "",
    ...bulletList(result.readiness.topActions),
    "",
    "**Application recommendation:** " + escapeMarkdown(result.readiness.applicationRecommendation),
    "",
    "## Requirement Coverage",
    "",
    "| Requirement | Evidence from job | Importance | Coverage | Confidence | Assessment |",
    "| --- | --- | --- | --- | --- | --- |",
  );

  result.requirements.forEach((item) => {
    lines.push("| " + [item.name, item.sourceEvidence, item.importance, item.coverage, item.confidence, item.rationale].map(escapeMarkdown).join(" | ") + " |");
  });

  lines.push("", "## Priority Gaps", "");
  result.gaps.forEach((gap) => {
    lines.push(
      "### " + escapeMarkdown(gap.name),
      "",
      escapeMarkdown(gap.employabilityImpact),
      "",
      "- **Priority:** " + escapeMarkdown(gap.priority),
      "- **Timing:** " + escapeMarkdown(gap.timing),
      "- **Confidence:** " + escapeMarkdown(gap.confidence),
      "- **Requirements:** " + names(gap.requirementIds, requirementNames),
      "- **Prerequisites:** " + (gap.prerequisites.length ? gap.prerequisites.map(escapeMarkdown).join(", ") : "None"),
    );
    if (gap.assumptions.length) lines.push("- **Assumptions:** " + gap.assumptions.map(escapeMarkdown).join("; "));
    lines.push("");
  });

  lines.push("## Learning Roadmap", "");
  result.roadmap.forEach((phase) => {
    lines.push(
      "### Phase " + phase.phase + ": " + escapeMarkdown(phase.title),
      "",
      escapeMarkdown(phase.objective),
      "",
      "- **Why this sequence:** " + escapeMarkdown(phase.sequenceReason),
      "- **Effort:** " + phase.estimatedHours.minimum + "-" + phase.estimatedHours.maximum + " hours across " + phase.estimatedWeeks.minimum + "-" + phase.estimatedWeeks.maximum + " weeks",
      "- **Requirements:** " + names(phase.requirementIds, requirementNames),
      "- **Topics:** " + phase.topics.map(escapeMarkdown).join(", "),
      "- **Out of scope:** " + (phase.outOfScope.length ? phase.outOfScope.map(escapeMarkdown).join(", ") : "None"),
      "- **Hands-on activity:** " + escapeMarkdown(phase.handsOnActivity),
      "- **Deliverable:** " + escapeMarkdown(phase.deliverable),
      "",
      "#### Acceptance Criteria",
      "",
      ...bulletList(phase.acceptanceCriteria),
      "",
      "#### Interview Checks",
      "",
      ...bulletList(phase.interviewChecks),
      "",
    );
  });

  lines.push("## Proof-of-Readiness Projects", "");
  result.projects.forEach((project, index) => {
    lines.push(
      "### Project " + (index + 1) + ": " + escapeMarkdown(project.title),
      "",
      escapeMarkdown(project.problemStatement),
      "",
      "- **Requirements:** " + names(project.requirementIds, requirementNames),
      "- **Technologies:** " + project.technologies.map(({ name, reason }) => escapeMarkdown(name) + " (" + escapeMarkdown(reason) + ")").join("; "),
      "- **Core features:** " + project.coreFeatures.map(escapeMarkdown).join(", "),
      "- **Non-goals:** " + project.nonGoals.map(escapeMarkdown).join(", "),
      "- **Demonstration:** " + escapeMarkdown(project.demonstrationMethod),
      "",
      "#### Acceptance Criteria",
      "",
      ...bulletList(project.acceptanceCriteria),
      "",
      "#### Portfolio Evidence",
      "",
      ...bulletList(project.portfolioEvidence),
      "",
    );
  });

  lines.push(
    "## Timeline",
    "",
    "- **Weekly hours:** " + escapeMarkdown(result.timeline.weeklyHoursAssumption),
    "- **Estimated duration:** " + result.timeline.estimatedWeeks.minimum + "-" + result.timeline.estimatedWeeks.maximum + " weeks",
    "- **Application start:** Week " + result.timeline.applicationStartWeek,
    "- **Target date assessment:** " + escapeMarkdown(result.timeline.targetDateAssessment),
    "",
    escapeMarkdown(result.timeline.targetDateExplanation),
    "",
  );
  result.timeline.weeks.forEach((week) => {
    lines.push("### Week " + week.week + ": " + escapeMarkdown(week.focus), "", "- **Phases:** " + week.phaseNumbers.join(", "), ...bulletList(week.deliverables), "");
  });

  if (result.certifications.length) {
    lines.push("## Certifications", "");
    result.certifications.forEach((certification) => {
      lines.push(
        "### " + escapeMarkdown(certification.name),
        "",
        "- **Provider:** " + escapeMarkdown(certification.provider),
        "- **Relevance:** " + escapeMarkdown(certification.relevance),
        "- **Requirements:** " + names(certification.requirementIds, requirementNames),
        "- **Difficulty:** " + escapeMarkdown(certification.difficulty),
        "- **Study estimate:** " + certification.estimatedStudyHours.minimum + "-" + certification.estimatedStudyHours.maximum + " hours",
        "- **Timing:** " + escapeMarkdown(certification.timing),
        "- **Verification:** " + escapeMarkdown(certification.verificationWarning),
        "",
      );
    });
  }

  lines.push("## Final Advice", "", ...bulletList(result.finalAdvice), "", "---", "", "This roadmap is guidance, not a hiring guarantee.", "");
  return lines.join("\n");
}
