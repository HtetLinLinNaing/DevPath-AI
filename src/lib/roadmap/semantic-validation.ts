import {
  CERTIFICATION_ALLOWLIST,
  RoadmapModelOutputSchema,
  type RoadmapModelOutput,
} from "@/lib/contracts/roadmap";

export type SemanticValidationResult =
  | { success: true }
  | { success: false; issues: string[] };

export function validateRoadmapSemantics(value: unknown): SemanticValidationResult {
  const parsed = RoadmapModelOutputSchema.safeParse(value);
  if (!parsed.success) {
    return {
      success: false,
      issues: parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`),
    };
  }

  const roadmap: RoadmapModelOutput = parsed.data;
  const issues: string[] = [];
  const requirementIds = roadmap.requirements.map(({ id }) => id);
  const validRequirements = new Set(requirementIds);

  if (validRequirements.size !== requirementIds.length) {
    issues.push("Requirement IDs must be unique");
  }

  const checkReferences = (label: string, ids: string[]) => {
    for (const id of ids) {
      if (!validRequirements.has(id)) issues.push(`${label} references unknown requirement ${id}`);
    }
  };

  roadmap.gaps.forEach((gap) => checkReferences(`Gap ${gap.name}`, gap.requirementIds));
  roadmap.roadmap.forEach((phase, index) => {
    if (phase.phase !== index + 1) issues.push("Roadmap phases must be sequential starting at 1");
    checkReferences(`Phase ${phase.phase}`, phase.requirementIds);
  });
  roadmap.projects.forEach((project) => checkReferences(`Project ${project.title}`, project.requirementIds));
  roadmap.certifications.forEach((certification) => {
    checkReferences(`Certification ${certification.name}`, certification.requirementIds);
    if (!CERTIFICATION_ALLOWLIST.includes(certification.name as (typeof CERTIFICATION_ALLOWLIST)[number])) {
      issues.push(`Certification ${certification.name} is not allowlisted`);
    }
  });

  if (roadmap.timeline.applicationStartWeek > roadmap.timeline.estimatedWeeks.maximum) {
    issues.push("Application start week must be inside the estimated timeline");
  }

  const validPhases = new Set(roadmap.roadmap.map(({ phase }) => phase));
  const weeks = roadmap.timeline.weeks.map(({ week }) => week);
  roadmap.timeline.weeks.forEach((week) => {
    week.phaseNumbers.forEach((phase) => {
      if (!validPhases.has(phase)) issues.push(`Timeline week ${week.week} references unknown phase ${phase}`);
    });
  });
  if (weeks.some((week, index) => week !== index + 1)) {
    issues.push("Timeline weeks must be sequential starting at 1");
  }

  return issues.length === 0 ? { success: true } : { success: false, issues };
}
