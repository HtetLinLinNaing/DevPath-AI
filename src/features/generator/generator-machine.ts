import type { ApiError } from "@/lib/contracts/api-error";
import type { RoadmapRequest, RoadmapResponse } from "@/lib/contracts/roadmap";

export type RoadmapDraft = Omit<RoadmapRequest, "consentToAIProcessing"> & {
  consentToAIProcessing: boolean;
};

export type GeneratorState =
  | { status: "editing"; input: RoadmapDraft; error: null }
  | { status: "submitting"; input: RoadmapDraft; requestId: string; startedAt: number; error: null }
  | { status: "success"; input: RoadmapDraft; result: RoadmapResponse; error: null }
  | { status: "error"; input: RoadmapDraft; error: ApiError; canRetry: boolean };

export type GeneratorAction =
  | { type: "UPDATE"; input: RoadmapDraft }
  | { type: "SUBMIT"; requestId: string; startedAt: number }
  | { type: "SUCCEED"; requestId: string; result: RoadmapResponse }
  | { type: "FAIL"; requestId: string; error: ApiError }
  | { type: "CANCEL" }
  | { type: "EDIT" }
  | { type: "RESTORE"; input: RoadmapRequest; result: RoadmapResponse }
  | { type: "RESET" };

export function createInitialRequest(): RoadmapDraft {
  return {
    jobDescription: "",
    profile: {
      currentRole: "",
      yearsExperience: "0",
      skills: [{ name: "", proficiency: "aware" }],
      education: "",
      weeklyHours: "6-10",
      targetApplicationDate: "",
      learningBudget: "free-only",
      constraints: "",
    },
    targetRole: "",
    consentToAIProcessing: true,
  };
}

export function generatorReducer(state: GeneratorState, action: GeneratorAction): GeneratorState {
  switch (action.type) {
    case "UPDATE":
      return { status: "editing", input: action.input, error: null };
    case "SUBMIT":
      return { status: "submitting", input: state.input, requestId: action.requestId, startedAt: action.startedAt, error: null };
    case "SUCCEED":
      if (state.status !== "submitting" || state.requestId !== action.requestId) return state;
      return { status: "success", input: state.input, result: action.result, error: null };
    case "FAIL":
      if (state.status !== "submitting" || state.requestId !== action.requestId) return state;
      return { status: "error", input: state.input, error: action.error, canRetry: action.error.retryable };
    case "CANCEL":
    case "EDIT":
      return { status: "editing", input: state.input, error: null };
    case "RESTORE":
      return { status: "success", input: action.input, result: action.result, error: null };
    case "RESET":
      return { status: "editing", input: createInitialRequest(), error: null };
  }
}
