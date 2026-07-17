import { useState } from "react";
import type { AnswerValue, PrescreenAnswer } from "../data/survey";
import { ANSWER_OPTIONS, getActiveModules, getGlossaryMatches } from "../data/survey";
import { calculateScore, formatPoints, getQuestionPoints, getRiskLabel } from "../lib/scoring";
import { GlossaryNotes } from "./GlossaryNotes";

interface QuestionCardProps {
  id: string;
  text: string;
  hint: string;
  weight: 1 | 2 | 3;
  riskDescription: string;
  answer: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
}

export function QuestionCard({
  id,
  text,
  hint,
  weight,
  riskDescription,
  answer,
  onChange,
}: QuestionCardProps) {
  const [showRisk, setShowRisk] = useState(false);
  const points = answer ? getQuestionPoints(answer, weight) : null;
  const glossaryTerms = getGlossaryMatches(text, hint);

  return (
    <div
      className={`question-card${!answer ? " question-card--unanswered" : ""}`}
      id={`question-${id}`}
    >
      <div className="question-card__top">
        <span className="question-card__id">{id}</span>
        <span className="question-card__risk-weight">{getRiskLabel(weight)}</span>
        <p className="question-card__text">{text}</p>
      </div>
      <p className="question-card__hint">可參考：{hint}</p>
      <GlossaryNotes terms={glossaryTerms} />

      <div className="answer-options">
        {ANSWER_OPTIONS.map((opt) => (
          <div className="radio-option" key={opt.value}>
            <input
              type="radio"
              id={`${id}-${opt.value}`}
              name={id}
              value={opt.value}
              checked={answer === opt.value}
              onChange={() => onChange(opt.value)}
            />
            <label htmlFor={`${id}-${opt.value}`}>
              {opt.label}
              <span className="answer-option__pts">
                {formatPoints(getQuestionPoints(opt.value, weight))} 分
              </span>
            </label>
          </div>
        ))}
      </div>

      {points !== null && (
        <div className="question-card__points">
          本題得分：<strong>{formatPoints(points)}</strong> / {weight} 分
        </div>
      )}

      <div className="question-card__risk">
        <button
          type="button"
          className="question-card__risk-toggle"
          onClick={() => setShowRisk((v) => !v)}
          aria-expanded={showRisk}
        >
          {showRisk ? "隱藏風險說明" : "查看風險說明"}
        </button>
        {showRisk && <div className="question-card__risk-content">{riskDescription}</div>}
      </div>
    </div>
  );
}

interface QuestionnaireProps {
  answers: Record<string, AnswerValue>;
  prescreen: Record<string, PrescreenAnswer>;
  onChange: (questionId: string, value: AnswerValue) => void;
}

export function Questionnaire({ answers, prescreen, onChange }: QuestionnaireProps) {
  const activeModules = getActiveModules(prescreen);
  const scoreResult = calculateScore(answers, prescreen);

  const allQuestions = activeModules.flatMap((m) => m.questions);
  const answeredCount = allQuestions.filter((q) => answers[q.id]).length;
  const progress = allQuestions.length > 0 ? (answeredCount / allQuestions.length) * 100 : 0;

  return (
    <div>
      <div className="score-panel">
        <div className="score-panel__main">
          <span className="score-panel__label">目前總分</span>
          <span className="score-panel__value">
            {formatPoints(scoreResult.score)}
            <span className="score-panel__max"> / {scoreResult.maxScore} 分</span>
          </span>
        </div>
        <p className="score-panel__hint">
          已作答 {answeredCount} / {allQuestions.length} 題 · 未作答題目計 0 分
          {scoreResult.inactiveModules.length > 0 &&
            ` · 未觸發 ${scoreResult.inactiveModules.length} 個題組不計分`}
        </p>
      </div>

      <div className="card">
        <h2 className="card__title">七、完整題目與參照</h2>
        <p>逐題在「回答」欄勾選五選一（已做到／部分做到／尚未做到／不知道／不適用）。</p>
        {allQuestions.length === 0 ? (
          <p className="validation-msg" style={{ marginTop: "1rem" }}>
            依前導分流結果，目前無需填寫任何題組。請返回前導分流調整答案。
          </p>
        ) : (
          <>
            <div
              className="progress-bar"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div className="progress-bar__fill" style={{ width: `${progress}%` }} />
            </div>
            <p className="progress-text">
              已完成 {answeredCount} / {allQuestions.length} 題
            </p>
          </>
        )}
      </div>

      {activeModules.map((module) => (
        <section key={module.id}>
          <div className="module-header">
            <div className="module-header__title">
              {module.title}｜{module.subtitle}
            </div>
            <span className="module-badge module-badge--active">需填寫</span>
          </div>
          {module.questions.map((q) => (
            <QuestionCard
              key={q.id}
              id={q.id}
              text={q.text}
              hint={q.hint}
              weight={q.weight}
              riskDescription={q.riskDescription}
              answer={answers[q.id]}
              onChange={(v) => onChange(q.id, v)}
            />
          ))}
        </section>
      ))}
    </div>
  );
}

export function getAllQuestionIds(prescreen: Record<string, PrescreenAnswer>): string[] {
  return getActiveModules(prescreen).flatMap((m) => m.questions.map((q) => q.id));
}

export function isSurveyComplete(
  answers: Record<string, AnswerValue>,
  prescreen: Record<string, PrescreenAnswer>,
): boolean {
  const ids = getAllQuestionIds(prescreen);
  if (ids.length === 0) return false;
  return ids.every((id) => answers[id] !== undefined);
}

export function hasActiveModules(prescreen: Record<string, PrescreenAnswer>): boolean {
  return getActiveModules(prescreen).length > 0;
}
