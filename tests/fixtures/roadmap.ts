export const validRequest = {
  jobDescription: "Backend Engineer role requiring Node.js, Docker, AWS, CI/CD, testing, observability, and clear technical communication. ".repeat(4),
  profile: {
    currentRole: "Junior Developer",
    yearsExperience: "2",
    skills: [
      { name: "JavaScript", proficiency: "applied" },
      { name: "Express", proficiency: "practiced" },
    ],
    education: "BSc Computer Science",
    weeklyHours: "6-10",
    targetApplicationDate: "2099-11-01",
    learningBudget: "free-only",
    constraints: "Prefer project-based learning",
  },
  targetRole: "Backend Engineer",
  consentToAIProcessing: true,
} as const;

const requirementIds = [
  "req_node",
  "req_docker",
  "req_aws",
  "req_cicd",
  "req_testing",
  "req_communication",
] as const;

export const validModelOutput = {
  readiness: {
    targetRole: "Backend Engineer",
    seniority: "mid-level",
    roleFocus: "Build and operate tested Node.js services on AWS.",
    band: "developing",
    rationale: "Backend foundations exist, but delivery and cloud gaps are material.",
    topActions: ["Learn Docker", "Build CI/CD", "Deploy to AWS"],
    applicationRecommendation: "Begin applying after phase 2 and the focused project.",
  },
  requirements: requirementIds.map((id, index) => ({
    id,
    name: ["Node.js", "Docker", "AWS", "CI/CD", "Testing", "Communication"][index],
    sourceEvidence: `Job requirement ${index + 1}`,
    importance: index < 4 ? "required" : "preferred",
    coverage: ["covered", "missing", "missing", "partial", "uncertain", "covered"][index],
    confidence: index === 4 ? "medium" : "high",
    rationale: "Assessment is grounded in the supplied profile and job description.",
  })),
  gaps: [
    {
      requirementIds: ["req_docker"],
      name: "Containerization",
      priority: "high",
      employabilityImpact: "Required for deployment workflows.",
      prerequisites: ["HTTP services"],
      timing: "before-applying",
      confidence: "high",
      assumptions: [],
    },
    {
      requirementIds: ["req_aws", "req_cicd"],
      name: "Cloud delivery",
      priority: "high",
      employabilityImpact: "Required to operate the target service.",
      prerequisites: ["Containerization"],
      timing: "while-applying",
      confidence: "high",
      assumptions: ["The role uses AWS for deployment."],
    },
  ],
  roadmap: [1, 2, 3, 4].map((phase) => ({
    phase,
    title: `Phase ${phase}`,
    objective: `Complete phase ${phase} objective.`,
    sequenceReason: "Builds on the previous phase.",
    estimatedHours: { minimum: 10, maximum: 16 },
    estimatedWeeks: { minimum: 1, maximum: 2 },
    topics: ["Core topic"],
    outOfScope: ["Advanced orchestration"],
    handsOnActivity: "Complete a focused implementation exercise.",
    deliverable: "A tested repository artifact.",
    acceptanceCriteria: ["Automated tests pass.", "Setup is documented."],
    interviewChecks: ["Explain the main design decision."],
    requirementIds: [requirementIds[phase - 1]],
  })),
  projects: [
    {
      title: "Containerized API",
      problemStatement: "Ship a reproducible backend API.",
      requirementIds: ["req_node", "req_docker", "req_testing"],
      technologies: [
        { name: "Node.js", reason: "Implements the target backend." },
        { name: "Docker", reason: "Creates reproducible delivery evidence." },
      ],
      coreFeatures: ["REST endpoints", "Automated tests"],
      nonGoals: ["Kubernetes"],
      demonstrationMethod: "Public repository and recorded demonstration.",
      acceptanceCriteria: ["Starts with one command.", "Tests pass in CI."],
      portfolioEvidence: ["Source code", "Test report", "README"],
    },
    {
      title: "AWS Delivery Capstone",
      problemStatement: "Deploy and operate the backend service.",
      requirementIds: ["req_aws", "req_cicd", "req_communication"],
      technologies: [
        { name: "AWS", reason: "Matches the target platform." },
        { name: "GitHub Actions", reason: "Demonstrates automated delivery." },
      ],
      coreFeatures: ["Automated deployment", "Health monitoring"],
      nonGoals: ["Multi-region failover"],
      demonstrationMethod: "Live service and architecture walkthrough.",
      acceptanceCriteria: ["Deployment is automated.", "Runbook covers recovery."],
      portfolioEvidence: ["Architecture notes", "Pipeline", "Runbook"],
    },
  ],
  timeline: {
    weeklyHoursAssumption: "6-10",
    estimatedWeeks: { minimum: 8, maximum: 10 },
    applicationStartWeek: 6,
    targetDateAssessment: "achievable",
    targetDateExplanation: "The target date leaves enough time for the priority work.",
    weeks: Array.from({ length: 8 }, (_, index) => ({
      week: index + 1,
      focus: `Week ${index + 1} focus`,
      deliverables: [`Week ${index + 1} artifact`],
      phaseNumbers: [Math.min(4, Math.floor(index / 2) + 1)],
    })),
  },
  certifications: [] as Array<{
    name: string;
    provider: string;
    relevance: string;
    requirementIds: string[];
    difficulty: "foundational" | "intermediate" | "advanced";
    estimatedStudyHours: { minimum: number; maximum: number };
    timing: "before-applying" | "while-applying" | "later";
    verificationWarning: string;
  }>,
  finalAdvice: [
    "Start applying after the focused project.",
    "Use project evidence in interviews.",
    "Keep advanced orchestration out of scope.",
    "Validate uncertain requirements with the employer.",
  ],
};
