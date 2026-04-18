export interface TrendingTopic {
  title: string;
  reason: string;
  audience: string;
}

export interface TopicOutline {
  topic: string;
  angle: string;
  audience: string;
  tone: string;
  outline: Record<string, unknown>;
}

export interface GenerateResponse {
  run_id: string;
  final_post: string;
  char_count: number;
  hashtags: string[];
  topic_plan?: TopicOutline;
  steps_completed: string[];
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function getTrendingTopics(): Promise<{ topics: TrendingTopic[] }> {
  const res = await fetch(`${API_URL}/api/trending`);
  if (!res.ok) throw new Error("Failed to fetch trending topics");
  return res.json() as Promise<{ topics: TrendingTopic[] }>;
}

export async function submitFeedback(
  runId: string,
  action: "approve" | "reject" | "edit",
  editedPost?: string
): Promise<void> {
  const res = await fetch(`${API_URL}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ run_id: runId, action, edited_post: editedPost }),
  });
  if (!res.ok) throw new Error("Failed to submit feedback");
}
