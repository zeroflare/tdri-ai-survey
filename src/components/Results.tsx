import { useEffect, useMemo, useState } from "react";
import type { AnswerValue, PrescreenAnswer } from "../data/survey";
import type { UserProfile } from "./BasicInfo";
import { notifySurveyCompleted } from "../lib/notify";
import { buildReportUrl, createReportPayload, type ReportPayload } from "../lib/report";
import { ReportView } from "./ReportView";
import { CURRENT_SURVEY_VERSION } from "../data/survey";

interface ResultsProps {
  profile: UserProfile;
  answers: Record<string, AnswerValue>;
  prescreen: Record<string, PrescreenAnswer>;
  onRestart: () => void;
}

export function Results({ profile, answers, prescreen, onRestart }: ResultsProps) {
  const payload = useMemo<ReportPayload>(
    () => createReportPayload(profile, prescreen, answers, CURRENT_SURVEY_VERSION),
    [profile, prescreen, answers],
  );
  const reportUrl = useMemo(() => buildReportUrl(payload), [payload]);
  const [notifyStatus, setNotifyStatus] = useState<"pending" | "sent" | "failed" | "skipped">(
    "pending",
  );

  useEffect(() => {
    let cancelled = false;

    void notifySurveyCompleted({ payload, reportUrl }).then((sent) => {
      if (cancelled) return;
      if (!import.meta.env.VITE_GOOGLE_CHAT_WEBHOOK) {
        setNotifyStatus("skipped");
      } else {
        setNotifyStatus(sent ? "sent" : "failed");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [payload, reportUrl]);

  const handleCopyReportUrl = async () => {
    try {
      await navigator.clipboard.writeText(reportUrl);
    } catch {
      window.prompt("複製報告連結：", reportUrl);
    }
  };

  return (
    <div>
      <div className="card">
        <h2 className="card__title">報告連結</h2>
        <p className="card__subtitle">
          連結包含填答者資料與完整答案，可分享或留存。
          {notifyStatus === "sent" && " 結果通知已送出。"}
          {notifyStatus === "failed" && " 結果通知未能送出，請確認網路或 webhook 設定。"}
        </p>
        <div className="btn-row">
          <button type="button" className="btn btn--secondary" onClick={handleCopyReportUrl}>
            複製報告連結
          </button>
        </div>
      </div>

      <ReportView
        profile={profile}
        answers={answers}
        prescreen={prescreen}
        surveyVersion={CURRENT_SURVEY_VERSION}
      />

      <div className="btn-row">
        <button type="button" className="btn btn--primary" onClick={onRestart}>
          重新填寫
        </button>
        <button type="button" className="btn btn--secondary" onClick={() => window.print()}>
          列印結果
        </button>
      </div>
    </div>
  );
}
