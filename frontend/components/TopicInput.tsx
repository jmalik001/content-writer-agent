"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface TopicInputProps {
  onSubmit: (topic: string) => void;
  loading?: boolean;
}

export default function TopicInput({ onSubmit, loading = false }: TopicInputProps) {
  const [topic, setTopic] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) {
      onSubmit(topic.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label
        htmlFor="topic-input"
        className="text-sm font-medium text-gray-700 dark:text-gray-300"
      >
        Enter your topic
      </label>
      <div className="flex gap-2">
        <input
          id="topic-input"
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. The future of AI in software development"
          disabled={loading}
          className={cn(
            "flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm",
            "placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500",
            "dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        />
        <button
          type="submit"
          disabled={loading || !topic.trim()}
          className={cn(
            "rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white",
            "hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
            "disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          )}
        >
          {loading ? "Generating…" : "Generate"}
        </button>
      </div>
    </form>
  );
}
