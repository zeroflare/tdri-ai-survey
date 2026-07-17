import { postToGoogleChat } from "./chatWebhook";
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
  const dedupeKey = `${NOTIFY_SESSION_PREFIX}${options.reportUrl}`;
  if (sessionStorage.getItem(dedupeKey)) return false;

  const sent = await postToGoogleChat(buildMessage(options));
  if (sent) sessionStorage.setItem(dedupeKey, "1");
  return sent;
}
