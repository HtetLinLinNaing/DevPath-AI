import { z } from "zod";

export const PROFICIENCY_VALUES = ["aware", "practiced", "applied", "production"] as const;
export const EXPERIENCE_VALUES = ["0", "1", "2", "3", "4-5", "6+"] as const;
export const WEEKLY_HOURS_VALUES = ["1-5", "6-10", "11-15", "16-20", "20+"] as const;
export const BUDGET_VALUES = ["free-only", "limited-paid", "flexible"] as const;
export const IMPORTANCE_VALUES = ["required", "preferred", "inferred"] as const;
export const COVERAGE_VALUES = ["covered", "partial", "missing", "uncertain"] as const;
export const CONFIDENCE_VALUES = ["high", "medium", "low"] as const;
export const READINESS_VALUES = ["early", "developing", "nearly-ready", "ready-to-apply"] as const;
export const PRIORITY_VALUES = ["high", "medium", "low"] as const;
export const TIMING_VALUES = ["before-applying", "while-applying", "later"] as const;

export const CERTIFICATION_ALLOWLIST = [
  "AWS Certified Cloud Practitioner",
  "AWS Certified Developer - Associate",
  "Microsoft Certified: Azure Fundamentals",
  "Google Cloud Digital Leader",
  "HashiCorp Certified: Terraform Associate",
] as const;

const Text = z.string().trim().min(1);
const StringList = z.array(Text).min(1);
const PositiveRangeSchema = z
  .strictObject({ minimum: z.number().int().nonnegative(), maximum: z.number().int().positive() })
  .refine(({ minimum, maximum }) => minimum <= maximum, { message: "minimum must not exceed maximum" });

export const SkillSchema = z.strictObject({
  name: z.string().trim().min(1).max(80),
  proficiency: z.enum(PROFICIENCY_VALUES),
});

const ProfileSchema = z
  .strictObject({
    currentRole: z.string().trim().min(1).max(120),
    yearsExperience: z.enum(EXPERIENCE_VALUES),
    skills: z.array(SkillSchema).min(1).max(50),
    education: z.string().trim().max(300).default(""),
    weeklyHours: z.enum(WEEKLY_HOURS_VALUES),
    targetApplicationDate: z.union([z.iso.date(), z.literal("")]),
    learningBudget: z.enum(BUDGET_VALUES),
    constraints: z.string().trim().max(1_000).default(""),
  })
  .superRefine(({ skills, targetApplicationDate }, context) => {
    const seen = new Set<string>();
    skills.forEach((skill, index) => {
      const normalized = skill.name.trim().toLocaleLowerCase("en-US");
      if (seen.has(normalized)) {
        context.addIssue({
          code: "custom",
          message: "Skill names must be unique",
          path: ["skills", index, "name"],
        });
      }
      seen.add(normalized);
    });

    const today = new Date().toISOString().slice(0, 10);
    if (targetApplicationDate && targetApplicationDate < today) {
      context.addIssue({
        code: "custom",
        message: "Target application date cannot be in the past",
        path: ["targetApplicationDate"],
      });
    }
  });

export const RoadmapRequestSchema = z.strictObject({
  jobDescription: z.string().trim().min(300).max(20_000),
  profile: ProfileSchema,
  targetRole: z.string().trim().min(1).max(120),
  consentToAIProcessing: z.literal(true),
});

const ReadinessSchema = z.strictObject({
  targetRole: Text,
  seniority: Text,
  roleFocus: Text,
  band: z.enum(READINESS_VALUES),
  rationale: Text,
  topActions: z.array(Text).length(3),
  applicationRecommendation: Text,
});

const RequirementSchema = z.strictObject({
  id: z.string().regex(/^req_[a-z0-9_]+$/),
  name: Text,
  sourceEvidence: Text,
  importance: z.enum(IMPORTANCE_VALUES),
  coverage: z.enum(COVERAGE_VALUES),
  confidence: z.enum(CONFIDENCE_VALUES),
  rationale: Text,
});

const GapSchema = z.strictObject({
  requirementIds: z.array(z.string()).min(1),
  name: Text,
  priority: z.enum(PRIORITY_VALUES),
  employabilityImpact: Text,
  prerequisites: z.array(Text),
  timing: z.enum(TIMING_VALUES),
  confidence: z.enum(CONFIDENCE_VALUES),
  assumptions: z.array(Text),
});

const PhaseSchema = z.strictObject({
  phase: z.number().int().positive(),
  title: Text,
  objective: Text,
  sequenceReason: Text,
  estimatedHours: PositiveRangeSchema,
  estimatedWeeks: PositiveRangeSchema,
  topics: StringList,
  outOfScope: z.array(Text),
  handsOnActivity: Text,
  deliverable: Text,
  acceptanceCriteria: StringList,
  interviewChecks: StringList,
  requirementIds: z.array(z.string()).min(1),
});

const ProjectSchema = z.strictObject({
  title: Text,
  problemStatement: Text,
  requirementIds: z.array(z.string()).min(1),
  technologies: z.array(z.strictObject({ name: Text, reason: Text })).min(1),
  coreFeatures: StringList,
  nonGoals: StringList,
  demonstrationMethod: Text,
  acceptanceCriteria: StringList,
  portfolioEvidence: StringList,
});

const TimelineSchema = z.strictObject({
  weeklyHoursAssumption: z.enum(WEEKLY_HOURS_VALUES),
  estimatedWeeks: PositiveRangeSchema,
  applicationStartWeek: z.number().int().positive(),
  targetDateAssessment: z.enum(["achievable", "aggressive", "unrealistic", "not-provided"]),
  targetDateExplanation: Text,
  weeks: z.array(
    z.strictObject({
      week: z.number().int().positive(),
      focus: Text,
      deliverables: StringList,
      phaseNumbers: z.array(z.number().int().positive()).min(1),
    }),
  ).min(1),
});

const CertificationSchema = z.strictObject({
  name: Text,
  provider: Text,
  relevance: Text,
  requirementIds: z.array(z.string()).min(1),
  difficulty: z.enum(["foundational", "intermediate", "advanced"]),
  estimatedStudyHours: PositiveRangeSchema,
  timing: z.enum(TIMING_VALUES),
  verificationWarning: Text,
});

export const RoadmapModelOutputSchema = z.strictObject({
  readiness: ReadinessSchema,
  requirements: z.array(RequirementSchema).min(1).max(50),
  gaps: z.array(GapSchema).max(30),
  roadmap: z.array(PhaseSchema).min(4).max(6),
  projects: z.array(ProjectSchema).length(2),
  timeline: TimelineSchema,
  certifications: z.array(CertificationSchema).max(5),
  finalAdvice: z.array(Text).min(3).max(5),
});

export const RoadmapResponseSchema = RoadmapModelOutputSchema.extend({
  schemaVersion: z.literal("1.0"),
  generatedAt: z.iso.datetime(),
});

export type RoadmapRequest = z.infer<typeof RoadmapRequestSchema>;
export type RoadmapModelOutput = z.infer<typeof RoadmapModelOutputSchema>;
export type RoadmapResponse = z.infer<typeof RoadmapResponseSchema>;

