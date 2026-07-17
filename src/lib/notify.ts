import type { ReportPayload } from "./report";
import { calculateScore, formatPoints } from "./scoring";

const NOTIFY_SESSION_PREFIX = "tdri-ai-survey-notified:";

interface NotifyOptions {
  payload: ReportPayload;
  reportUrl: string;
}

function buildMessage({ payload, reportUrl }: NotifyOptions): string {
  const { profile } = payload;
  const result = calculateScore(payload.answers, payload.prescreen, payload.surveyVersion);
  const tierLabel = result.needsPriority ? "需優先處理" : result.tier.label;

  return [
    "【台灣設計產業 AI 資安自評檢核表】新填答完成",
    "",
    `姓名：${profile.name}`,
    `公司：${profile.company}`,
    `職稱：${profile.title}`,
    `信箱：${profile.email}`,
    "",
    `評估結果：${formatPoints(result.score)} / ${result.maxScore} 分（${result.scorePercent}%）— ${tierLabel}`,
    "",
    `報告連結：<${reportUrl}|查看評估報告>`,
  ].join("\n");
}

export async function notifySurveyCompleted(options: NotifyOptions): Promise<boolean> {
  const webhookUrl = import.meta.env.VITE_GOOGLE_CHAT_WEBHOOK;
  if (!webhookUrl) return false;

  const dedupeKey = `${NOTIFY_SESSION_PREFIX}${options.reportUrl}`;
  if (sessionStorage.getItem(dedupeKey)) return false;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=UTF-8" },
      body: JSON.stringify({ text: buildMessage(options) }),
    });

    if (!response.ok) {
      console.warn("Google Chat 通知失敗", response.status, await response.text());
      return false;
    }

    sessionStorage.setItem(dedupeKey, "1");
    return true;
  } catch (error) {
    console.warn("Google Chat 通知失敗", error);
    return false;
  }
}
