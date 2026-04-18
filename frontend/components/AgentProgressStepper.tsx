"use client";

import { CheckCircle, Circle, Loader2 } from "lucide-react";
import { cn, AGENT_STEPS } from "@/lib/utils";

interface AgentProgressStepperProps {
  currentStep: string | null;
  stepsCompleted: string[];
  status: "idle" | "running" | "completed" | "failed";
}

export default function AgentProgressStepper({
  currentStep,
  stepsCompleted,
  status,
}: AgentProgressStepperProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
        Agent Progress
      </h3>
      <ol className="space-y-2">
        {AGENT_STEPS.map((step) => {
          const isDone = stepsCompleted.includes(step.id);
          const isActive = currentStep === step.id && !isDone;
          const isPending = !isDone && !isActive;

          return (
            <li
              key={step.id}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isDone && "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400",
                isActive && "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
                isPending && "text-gray-400 dark:text-gray-600"
              )}
            >
              {isDone ? (
                <CheckCircle className="h-4 w-4 shrink-0" />
              ) : isActive ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              ) : (
                <Circle className="h-4 w-4 shrink-0" />
              )}
              <span className={cn("font-medium", isPending && "font-normal")}>
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>

      {status === "completed" && (
        <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
          ✅ Post generated successfully!
        </p>
      )}
      {status === "failed" && (
        <p className="text-xs text-red-500 font-medium mt-1">
          ❌ Generation failed. Please try again.
        </p>
      )}
    </div>
  );
}
