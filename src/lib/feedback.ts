import { postToGoogleChat } from "./chatWebhook";

export interface FeedbackInput {
  message: string;
  name?: string;
  email?: string;
}

export function isFeedbackWebhookConfigured(): boolean {
  return Boolean(import.meta.env.VITE_GOOGLE_CHAT_WEBHOOK);
}

function buildFeedbackMessage({ message, name, email }: FeedbackInput): string {
  const lines = ["【台灣設計產業 AI 資安自評檢核表】意見回饋", ""];

  if (name?.trim()) lines.push(`姓名：${name.trim()}`);
  if (email?.trim()) lines.push(`信箱：${email.trim()}`);

  lines.push("", "意見：", message.trim());
  return lines.join("\n");
}

export async function sendFeedback(input: FeedbackInput): Promise<boolean> {
  if (!input.message.trim()) return false;
  if (!isFeedbackWebhookConfigured()) return false;
  return postToGoogleChat(buildFeedbackMessage(input));
}
