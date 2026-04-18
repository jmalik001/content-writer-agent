import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export const AGENT_STEPS = [
  { id: "research_trends", label: "Research Trends" },
  { id: "plan_topic", label: "Plan Topic" },
  { id: "draft_content", label: "Draft Content" },
  { id: "edit_post", label: "Edit & Polish" },
];
