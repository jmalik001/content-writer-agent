"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface PostPreviewProps {
  post: string;
  charCount: number;
  hashtags: string[];
}

export default function PostPreview({ post, charCount, hashtags }: PostPreviewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(post);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const charWarning = charCount > 1300;

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
          LinkedIn Post Preview
        </h3>
        <button
          onClick={handleCopy}
          aria-label="Copy post to clipboard"
          className={cn(
            "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            copied
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
              : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          )}
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Post content */}
      <div className="flex-1 rounded-xl border border-gray-200 bg-white p-5 shadow-sm overflow-y-auto dark:border-gray-700 dark:bg-gray-800">
        <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap text-gray-900 dark:text-gray-100 leading-relaxed">
          {post}
        </div>
      </div>

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span className={cn(charWarning && "text-amber-600 dark:text-amber-400 font-medium")}>
          {charCount} / 1300 chars {charWarning && "⚠️ over recommended"}
        </span>
        {hashtags.length > 0 && (
          <span className="text-blue-600 dark:text-blue-400">
            {hashtags.length} hashtag{hashtags.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Hashtags */}
      {hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {hashtags.map((tag, i) => (
            <span
              key={i}
              className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
