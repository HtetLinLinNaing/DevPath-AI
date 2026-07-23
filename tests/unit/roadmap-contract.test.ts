import { describe, expect, it } from "vitest";

import {
  CERTIFICATION_ALLOWLIST,
  RoadmapModelOutputSchema,
  RoadmapRequestSchema,
  RoadmapResponseSchema,
} from "@/lib/contracts/roadmap";
import { validateRoadmapSemantics } from "@/lib/roadmap/semantic-validation";
import { validModelOutput, validRequest } from "../fixtures/roadmap";

describe("RoadmapRequestSchema", () => {
  it("accepts a complete valid request", () => {
    expect(RoadmapRequestSchema.safeParse(validRequest).success).toBe(true);
  });

  it("enforces job-description bounds", () => {
    expect(RoadmapRequestSchema.safeParse({ ...validRequest, jobDescription: "short" }).success).toBe(false);
    expect(RoadmapRequestSchema.safeParse({ ...validRequest, jobDescription: "x".repeat(20_001) }).success).toBe(false);
  });

  it("requires at least one skill and explicit consent", () => {
    expect(RoadmapRequestSchema.safeParse({ ...validRequest, profile: { ...validRequest.profile, skills: [] } }).success).toBe(false);
    expect(RoadmapRequestSchema.safeParse({ ...validRequest, consentToAIProcessing: false }).success).toBe(false);
  });

  it("rejects unknown keys and duplicate skill names", () => {
    expect(RoadmapRequestSchema.safeParse({ ...validRequest, unexpected: true }).success).toBe(false);
    const duplicate = {
      ...validRequest,
      profile: {
        ...validRequest.profile,
        skills: [
          { name: "Node.js", proficiency: "aware" },
          { name: " node.JS ", proficiency: "production" },
        ],
      },
    };
    expect(RoadmapRequestSchema.safeParse(duplicate).success).toBe(false);
  });

  it("rejects a target application date in the past", () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    expect(RoadmapRequestSchema.safeParse({
      ...validRequest,
      profile: { ...validRequest.profile, targetApplicationDate: yesterday },
    }).success).toBe(false);
  });
});

describe("roadmap output contracts", () => {
  it("accepts a complete model output and server response", () => {
    expect(RoadmapModelOutputSchema.safeParse(validModelOutput).success).toBe(true);
    expect(RoadmapResponseSchema.safeParse({
      ...validModelOutput,
      schemaVersion: "1.0",
      generatedAt: "2026-07-22T10:00:00.000Z",
    }).success).toBe(true);
  });

  it("requires four to six phases and exactly two projects", () => {
    expect(RoadmapModelOutputSchema.safeParse({ ...validModelOutput, roadmap: validModelOutput.roadmap.slice(0, 3) }).success).toBe(false);
    expect(RoadmapModelOutputSchema.safeParse({ ...validModelOutput, projects: validModelOutput.projects.slice(0, 1) }).success).toBe(false);
  });

  it("detects duplicate and unresolved requirement references", () => {
    const duplicate = structuredClone(validModelOutput);
    duplicate.requirements[1]!.id = duplicate.requirements[0]!.id;
    expect(validateRoadmapSemantics(duplicate).success).toBe(false);

    const unresolved = structuredClone(validModelOutput);
    unresolved.gaps[0]!.requirementIds = ["req_missing"];
    expect(validateRoadmapSemantics(unresolved).success).toBe(false);
  });

  it("requires sequential phases and a bounded application week", () => {
    const badPhases = structuredClone(validModelOutput);
    badPhases.roadmap[2]!.phase = 8;
    expect(validateRoadmapSemantics(badPhases).success).toBe(false);

    const badWeek = structuredClone(validModelOutput);
    badWeek.timeline.applicationStartWeek = 11;
    expect(validateRoadmapSemantics(badWeek).success).toBe(false);
  });

  it("allows only maintained certification names", () => {
    const invalid = structuredClone(validModelOutput);
    invalid.certifications.push({
      name: "Imaginary Cloud Wizard",
      provider: "Unknown",
      relevance: "Not grounded.",
      requirementIds: ["req_aws"],
      difficulty: "foundational",
      estimatedStudyHours: { minimum: 5, maximum: 10 },
      timing: "later",
      verificationWarning: "Verify details on the provider's official website.",
    });
    expect(validateRoadmapSemantics(invalid).success).toBe(false);
    expect(CERTIFICATION_ALLOWLIST).toContain("AWS Certified Cloud Practitioner");
  });
});
