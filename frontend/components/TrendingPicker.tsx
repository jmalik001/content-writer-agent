"use client";

import { cn } from "@/lib/utils";
import type { TrendingTopic } from "@/lib/api";

interface TrendingPickerProps {
  topics: TrendingTopic[];
  loading?: boolean;
  onSelect: (topic: TrendingTopic) => void;
}

export default function TrendingPicker({
  topics,
  loading = false,
  onSelect,
}: TrendingPickerProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!topics.length) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400 italic">
        No trending topics found. Try refreshing or enter a topic manually.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {topics.map((topic, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(topic)}
          className={cn(
            "rounded-lg border border-gray-200 bg-white p-4 text-left",
            "hover:border-blue-400 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500",
            "dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700",
            "transition-colors cursor-pointer"
          )}
        >
          <p className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
            {topic.title}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
            {topic.reason}
          </p>
          <span className="mt-2 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-900 dark:text-blue-300">
            {topic.audience}
          </span>
        </button>
      ))}
    </div>
  );
}
