import type { AnswerValue, PrescreenAnswer } from "../data/survey";
import { getActiveModules, getSurveyData, formatSurveyVersionLabel } from "../data/survey";
import type { UserProfile } from "./BasicInfo";
import {
  calculateScore,
  formatPoints,
  getAnswerLabel,
  getQuestionPoints,
  getRiskLabel,
} from "../lib/scoring";

interface ReportViewProps {
  profile: UserProfile;
  answers: Record<string, AnswerValue>;
  prescreen: Record<string, PrescreenAnswer>;
  surveyVersion: string;
}

export function ReportView({ profile, answers, prescreen, surveyVersion }: ReportViewProps) {
  const survey = getSurveyData(surveyVersion);
  const result = calculateScore(answers, prescreen, surveyVersion);
  const activeModules = getActiveModules(prescreen, surveyVersion);

  const heroClass =
    result.needsPriority || result.scorePercent < 60
      ? "result-hero result-hero--bad"
      : result.scorePercent < 75
        ? "result-hero result-hero--warn"
        : "result-hero result-hero--good";

  return (
    <div>
      {result.needsPriority && (
        <div className="priority-banner">
          ⚠ 有 {result.highRiskFailures.length}{" "}
          項高風險題為「尚未做到」— 不論總分高低，整體標示「需優先處理」，應優先補強。
        </div>
      )}

      <div className={heroClass}>
        <div className="result-hero__score">{formatPoints(result.score)}</div>
        <div className="result-hero__label">
          {result.tier.label}（{formatPoints(result.score)} / {result.maxScore} 分）
        </div>
        <p className="result-hero__advice">{result.tier.advice}</p>
      </div>

      <div className="card">
        <h2 className="card__title">填答者資料</h2>
        <p className="card__subtitle">問卷版本：{formatSurveyVersionLabel(surveyVersion)}</p>
        <dl className="profile-summary">
          <div>
            <dt>姓名</dt>
            <dd>{profile.name || "—"}</dd>
          </div>
          <div>
            <dt>公司</dt>
            <dd>{profile.company || "—"}</dd>
          </div>
          <div>
            <dt>職稱</dt>
            <dd>{profile.title || "—"}</dd>
          </div>
          <div>
            <dt>信箱</dt>
            <dd>{profile.email || "—"}</dd>
          </div>
        </dl>
      </div>

      <div className="card">
        <h2 className="card__title">計分摘要</h2>
        <table className="info-table">
          <tbody>
            <tr>
              <th>本次滿分</th>
              <td>{result.maxScore} 分</td>
            </tr>
            <tr>
              <th>你的得分</th>
              <td>
                <strong>{formatPoints(result.score)} 分</strong>
              </td>
            </tr>
            <tr>
              <th>得分率</th>
              <td>{result.scorePercent}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 className="card__title">得分率與建議</h2>
        <p className="card__subtitle">
          請依得分率對照下表；無論落於何一級距，凡標示「需優先處理」之高風險題均應最先處理。
        </p>
        <table className="info-table">
          <thead>
            <tr>
              <th>得分率</th>
              <th>建議注意事項</th>
            </tr>
          </thead>
          <tbody>
            {survey.scoreTiers.map((tier) => (
              <tr
                key={tier.label}
                className={
                  result.scorePercent >= tier.min && result.scorePercent <= tier.max
                    ? "info-table__row--current"
                    : undefined
                }
              >
                <th>{tier.label}</th>
                <td>{tier.advice}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 className="card__title">適用題組</h2>
        <p className="card__subtitle">以下題組已納入計分</p>
        <ul>
          {result.activeModules.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
        {result.inactiveModules.length > 0 && (
          <>
            <p className="card__subtitle" style={{ marginTop: "1rem" }}>
              未觸發題組（不顯示於問卷、不計入本次滿分）
            </p>
            <ul>
              {result.inactiveModules.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </>
        )}
      </div>

      {result.highRiskFailures.length > 0 && (
        <div className="card">
          <h2 className="card__title">需優先處理 — 高風險題</h2>
          <ul className="result-list">
            {result.highRiskFailures.map((q) => (
              <li key={q.id}>
                <div className="result-list__meta">
                  <span className="tag tag--red">{q.id}</span>
                  <span className="tag tag--module">{q.moduleTitle}</span>
                  <span className="tag tag--deduct">得 0 分</span>
                </div>
                {q.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.lowScoreQuestions.length > 0 && (
        <div className="card">
          <h2 className="card__title">未拿滿分的項目</h2>
          <p className="card__subtitle">依失分幅度排序，建議從高風險題開始補強</p>
          <ul className="result-list">
            {result.lowScoreQuestions.map((q) => (
              <li key={q.id}>
                <div className="result-list__meta">
                  <span className="tag tag--module">{q.id}</span>
                  {q.weight === 3 && (
                    <span className="tag tag--red">{getRiskLabel(3)}</span>
                  )}
                  <span className="tag tag--deduct">
                    {getAnswerLabel(q.answer, surveyVersion)} · 得 {formatPoints(q.points)} / {q.maxPoints} 分
                  </span>
                </div>
                {q.text}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <h2 className="card__title">填答明細</h2>
        <p className="card__subtitle">以下為本次所有題目與您的回答</p>
        {activeModules.map((module) => (
          <section key={module.id} className="answer-record-section">
            <h3 className="answer-record-section__title">
              {module.title}｜{module.subtitle}
            </h3>
            {module.questions.map((question) => {
              const answer = answers[question.id];
              const points = answer ? getQuestionPoints(answer, question.weight) : 0;
              return (
                <div key={question.id} className="answer-record">
                  <div className="answer-record__meta">
                    <span className="tag tag--module">{question.id}</span>
                    <span className="tag tag--module">{getRiskLabel(question.weight)}</span>
                    {answer && (
                      <span className="tag tag--deduct">
                        得 {formatPoints(points)} / {question.weight} 分
                      </span>
                    )}
                  </div>
                  <p className="answer-record__text">{question.text}</p>
                  <p className="answer-record__answer">
                    回答：<strong>{answer ? getAnswerLabel(answer, surveyVersion) : "未作答"}</strong>
                  </p>
                </div>
              );
            })}
          </section>
        ))}
      </div>
    </div>
  );
}
