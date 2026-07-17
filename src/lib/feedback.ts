import { postToGoogleChat } from "./chatWebhook";
import type { UserProfile } from "../components/BasicInfo";

export interface FeedbackInput {
  message: string;
  profile?: Partial<UserProfile>;
}

export function isFeedbackWebhookConfigured(): boolean {
  return Boolean(import.meta.env.VITE_GOOGLE_CHAT_WEBHOOK);
}

function buildFeedbackMessage({ message, profile }: FeedbackInput): string {
  const lines = ["【台灣設計產業 AI 資安自評檢核表】意見回饋", ""];

  if (profile?.name?.trim()) lines.push(`姓名：${profile.name.trim()}`);
  if (profile?.company?.trim()) lines.push(`公司：${profile.company.trim()}`);
  if (profile?.title?.trim()) lines.push(`職稱：${profile.title.trim()}`);
  if (profile?.email?.trim()) lines.push(`信箱：${profile.email.trim()}`);

  lines.push("", "意見內容：", message.trim());
  return lines.join("\n");
}

export async function sendFeedback(input: FeedbackInput): Promise<boolean> {
  if (!input.message.trim()) return false;
  if (!isFeedbackWebhookConfigured()) return false;
  return postToGoogleChat(buildFeedbackMessage(input));
}
