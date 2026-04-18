"use client";

import { useState } from "react";
import { ThumbsUp, ThumbsDown, Edit2, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitFeedback } from "@/lib/api";

interface FeedbackPanelProps {
  runId: string;
  currentPost: string;
  onPostEdited: (newPost: string) => void;
}

export default function FeedbackPanel({
  runId,
  currentPost,
  onPostEdited,
}: FeedbackPanelProps) {
  const [editMode, setEditMode] = useState(false);
  const [editedText, setEditedText] = useState(currentPost);
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: "approve" | "reject") => {
    setLoading(true);
    try {
      await submitFeedback(runId, action);
      setSubmitted(action);
    } catch {
      // ignore feedback errors silently — not critical
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    setLoading(true);
    try {
      await submitFeedback(runId, "edit", editedText);
      onPostEdited(editedText);
      setEditMode(false);
      setSubmitted("edit");
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <p className="text-sm text-green-600 dark:text-green-400 font-medium">
        {submitted === "approve" && "✅ Post approved!"}
        {submitted === "reject" && "❌ Post rejected."}
        {submitted === "edit" && "✏️ Edits saved!"}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
        Feedback
      </h3>

      {editMode ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            rows={8}
            className={cn(
              "w-full rounded-lg border border-gray-300 bg-white p-3 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-blue-500",
              "dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            )}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveEdit}
              disabled={loading}
              className={cn(
                "flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white font-medium",
                "hover:bg-blue-700 disabled:opacity-50 transition-colors"
              )}
            >
              <Save className="h-4 w-4" />
              Save edits
            </button>
            <button
              onClick={() => setEditMode(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleAction("approve")}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-green-100 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 disabled:opacity-50 transition-colors"
          >
            <ThumbsUp className="h-4 w-4" />
            Approve
          </button>
          <button
            onClick={() => handleAction("reject")}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 disabled:opacity-50 transition-colors"
          >
            <ThumbsDown className="h-4 w-4" />
            Reject
          </button>
          <button
            onClick={() => {
              setEditedText(currentPost);
              setEditMode(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            <Edit2 className="h-4 w-4" />
            Edit
          </button>
        </div>
      )}
    </div>
  );
}
