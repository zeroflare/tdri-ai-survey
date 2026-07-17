import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { formatSurveyVersionLabel, loadSurveyData } from "../data/survey";
import { decodeReportPayload, isReportPayloadValid } from "../lib/report";
import { ReportView } from "./ReportView";
import { SurveyBootScreen } from "./SurveyBootScreen";
import { stepToPath } from "../lib/routes";

export function ReportPage() {
  const [searchParams] = useSearchParams();
  const payload = decodeReportPayload(searchParams.get("d") ?? "");
  const isValid = payload !== null && isReportPayloadValid(payload);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "ready" | "error">("idle");

  useEffect(() => {
    if (!payload || !isValid) {
      setLoadState("idle");
      return;
    }

    let cancelled = false;
    setLoadState("loading");

    loadSurveyData(payload.surveyVersion)
      .then(() => {
        if (!cancelled) setLoadState("ready");
      })
      .catch(() => {
        if (!cancelled) setLoadState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [payload, isValid]);

  if (payload && isValid && loadState === "loading") {
    return <SurveyBootScreen message="載入報告資料…" />;
  }

  if (payload && isValid && loadState === "error") {
    return (
      <SurveyBootScreen
        message={`問卷版本 ${formatSurveyVersionLabel(payload.surveyVersion)} 載入失敗，請確認 JSON 檔是否存在。`}
        error
      />
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <p className="app-header__org">台灣設計研究院</p>
          <h1 className="app-header__title">
            台灣設計產業 AI 資安自評檢核表
            <span className="app-header__beta">Beta</span>
          </h1>
          <p className="app-header__subtitle">評估報告</p>
        </div>
      </header>

      <main className="app-main">
        {!payload ? (
          <div className="card">
            <h2 className="card__title">無法載入報告</h2>
            <p className="card__subtitle">連結可能已損壞或過期，請重新填寫問卷。</p>
            <div className="btn-row">
              <Link to={stepToPath("intro")} className="btn btn--primary">
                開始填寫問卷
              </Link>
            </div>
          </div>
        ) : !isValid ? (
          <div className="card">
            <h2 className="card__title">無法載入報告</h2>
            <p className="card__subtitle">
              此報告的問卷版本（{formatSurveyVersionLabel(payload.surveyVersion)}）已無法載入，可能題目已更新且舊版資料尚未保留。
            </p>
            <div className="btn-row">
              <Link to={stepToPath("intro")} className="btn btn--primary">
                填寫最新版問卷
              </Link>
            </div>
          </div>
        ) : loadState === "ready" ? (
          <>
            <ReportView
              profile={payload.profile}
              answers={payload.answers}
              prescreen={payload.prescreen}
              surveyVersion={payload.surveyVersion}
            />
            <div className="btn-row">
              <Link to={stepToPath("intro")} className="btn btn--secondary">
                填寫新問卷
              </Link>
              <button type="button" className="btn btn--secondary" onClick={() => window.print()}>
                列印報告
              </button>
            </div>
          </>
        ) : null}
      </main>

      <footer className="app-footer">
        <p>台灣設計研究院</p>
      </footer>
    </div>
  );
}
