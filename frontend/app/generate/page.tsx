"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import TopicInput from "@/components/TopicInput";
import TrendingPicker from "@/components/TrendingPicker";
import AgentProgressStepper from "@/components/AgentProgressStepper";
import PostPreview from "@/components/PostPreview";
import FeedbackPanel from "@/components/FeedbackPanel";
import { useGenerationStore } from "@/store/generationStore";
import { getTrendingTopics } from "@/lib/api";
import { connectGenerateWs } from "@/lib/ws";
import type { TrendingTopic } from "@/lib/api";
import { cn } from "@/lib/utils";

type Mode = "topic" | "trending";

function GeneratePageInner() {
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get("mode") as Mode) || "topic";
  const [mode, setMode] = useState<Mode>(initialMode);
  const [editedPost, setEditedPost] = useState<string | null>(null);

  const {
    status,
    error,
    runId,
    currentStep,
    stepsCompleted,
    finalPost,
    charCount,
    hashtags,
    trendingTopics,
    trendingLoading,
    setStatus,
    setRunId,
    setStep,
    setResult,
    setError,
    setTrendingTopics,
    setTrendingLoading,
    resetGeneration,
  } = useGenerationStore();

  // Load trending topics when mode switches to trending
  useEffect(() => {
    if (mode === "trending" && trendingTopics.length === 0) {
      setTrendingLoading(true);
      getTrendingTopics()
        .then((res) => setTrendingTopics(res.topics))
        .catch(() => setTrendingTopics([]))
        .finally(() => setTrendingLoading(false));
    }
  }, [mode, trendingTopics.length, setTrendingTopics, setTrendingLoading]);

  const startGeneration = useCallback(
    (topic?: string) => {
      resetGeneration();
      setStatus("running");

      const cleanup = connectGenerateWs(
        { topic, mode },
        (event) => {
          if (event.type === "run_started" && event.run_id) {
            setRunId(event.run_id);
          } else if (event.type === "step_update") {
            setStep(event.step ?? "", event.steps_completed ?? []);
          } else if (event.type === "completed") {
            setResult({
              run_id: event.run_id ?? "",
              final_post: event.final_post ?? "",
              char_count: event.char_count ?? 0,
              hashtags: event.hashtags ?? [],
              steps_completed: event.steps_completed ?? [],
            });
          } else if (event.type === "error") {
            setError(event.message ?? "An unexpected error occurred");
          }
        },
        () => {
          // WebSocket closed without completion — mark as failed if still running
          useGenerationStore.getState().status === "running" &&
            setError("Connection closed unexpectedly");
        }
      );

      return cleanup;
    },
    [mode, resetGeneration, setStatus, setRunId, setStep, setResult, setError]
  );

  const handleTopicSubmit = (topic: string) => {
    startGeneration(topic);
  };

  const handleTrendingSelect = (topic: TrendingTopic) => {
    startGeneration(topic.title);
  };

  const displayPost = editedPost ?? finalPost ?? "";

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Generate LinkedIn Post
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Choose a mode and generate a professional LinkedIn post powered by AI agents.
        </p>
      </div>

      {/* Mode selector */}
      <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1 dark:border-gray-700 dark:bg-gray-800">
        {(["topic", "trending"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "rounded-md px-5 py-2 text-sm font-medium transition-colors",
              mode === m
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            )}
          >
            {m === "topic" ? "✍️ My Topic" : "🔥 Trending"}
          </button>
        ))}
      </div>

      {/* Input section */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        {mode === "topic" ? (
          <TopicInput onSubmit={handleTopicSubmit} loading={status === "running"} />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Select a trending topic to generate a post about:
            </p>
            <TrendingPicker
              topics={trendingTopics}
              loading={trendingLoading}
              onSelect={handleTrendingSelect}
            />
          </div>
        )}
      </div>

      {/* Results — shown once generation starts */}
      {status !== "idle" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Agent progress */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <AgentProgressStepper
              currentStep={currentStep}
              stepsCompleted={stepsCompleted}
              status={status}
            />

            {error && (
              <div className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}
          </div>

          {/* Right: Post preview */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800 min-h-[400px] flex flex-col">
            {status === "running" && !displayPost && (
              <div className="flex-1 flex items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                <span className="animate-pulse">Agents are working…</span>
              </div>
            )}

            {displayPost && (
              <>
                <PostPreview
                  post={displayPost}
                  charCount={charCount}
                  hashtags={hashtags}
                />

                {runId && status === "completed" && (
                  <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <FeedbackPanel
                      runId={runId}
                      currentPost={displayPost}
                      onPostEdited={setEditedPost}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GeneratePage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-gray-400">Loading…</div>}>
      <GeneratePageInner />
    </Suspense>
  );
}
