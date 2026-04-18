import { create } from "zustand";
import type { GenerateResponse, TrendingTopic, TopicOutline } from "@/lib/api";

type GenerationStatus = "idle" | "running" | "completed" | "failed";

interface GenerationState {
  // Status
  status: GenerationStatus;
  error: string | null;

  // Run tracking
  runId: string | null;
  currentStep: string | null;
  stepsCompleted: string[];

  // Result
  finalPost: string | null;
  charCount: number;
  hashtags: string[];
  topicPlan: TopicOutline | null;

  // Trending topics (cached)
  trendingTopics: TrendingTopic[];
  trendingLoading: boolean;

  // Actions
  setStatus: (status: GenerationStatus) => void;
  setRunId: (id: string) => void;
  setStep: (step: string, completed: string[]) => void;
  setResult: (result: GenerateResponse) => void;
  setError: (error: string) => void;
  setTrendingTopics: (topics: TrendingTopic[]) => void;
  setTrendingLoading: (loading: boolean) => void;
  resetGeneration: () => void;
}

export const useGenerationStore = create<GenerationState>((set) => ({
  status: "idle",
  error: null,
  runId: null,
  currentStep: null,
  stepsCompleted: [],
  finalPost: null,
  charCount: 0,
  hashtags: [],
  topicPlan: null,
  trendingTopics: [],
  trendingLoading: false,

  setStatus: (status) => set({ status }),
  setRunId: (runId) => set({ runId }),
  setStep: (currentStep, stepsCompleted) => set({ currentStep, stepsCompleted }),
  setResult: (result) =>
    set({
      finalPost: result.final_post,
      charCount: result.char_count,
      hashtags: result.hashtags,
      topicPlan: result.topic_plan ?? null,
      stepsCompleted: result.steps_completed,
      status: "completed",
    }),
  setError: (error) => set({ error, status: "failed" }),
  setTrendingTopics: (trendingTopics) => set({ trendingTopics }),
  setTrendingLoading: (trendingLoading) => set({ trendingLoading }),
  resetGeneration: () =>
    set({
      status: "idle",
      error: null,
      runId: null,
      currentStep: null,
      stepsCompleted: [],
      finalPost: null,
      charCount: 0,
      hashtags: [],
      topicPlan: null,
    }),
}));
