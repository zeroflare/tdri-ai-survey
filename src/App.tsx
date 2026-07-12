import { useCallback, useState } from "react";
import type { AnswerValue, PrescreenAnswer } from "./data/survey";
import { getActiveModules, PRESCREEN_QUESTIONS } from "./data/survey";
import { Changelog } from "./components/Changelog";
import { Instructions } from "./components/Instructions";
import { Prescreening, isPrescreenComplete } from "./components/Prescreening";
import { hasActiveModules, isSurveyComplete, Questionnaire } from "./components/Questionnaire";
import { Results } from "./components/Results";
import { StepNav, type StepId } from "./components/StepNav";

const STORAGE_KEY = "tdri-ai-survey-state";

interface SurveyState {
  step: StepId;
  prescreen: Record<string, PrescreenAnswer>;
  answers: Record<string, AnswerValue>;
}

function loadState(): SurveyState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SurveyState;
  } catch {
    return null;
  }
}

function defaultPrescreen(): Record<string, PrescreenAnswer> {
  return { "01": true, "02": true, "03": true, "04": true, "05": true, "06": true };
}

function normalizePrescreen(
  prescreen: Record<string, PrescreenAnswer> | undefined,
): Record<string, PrescreenAnswer> {
  const defaults = defaultPrescreen();
  if (!prescreen) return defaults;
  return Object.fromEntries(
    PRESCREEN_QUESTIONS.map((q) => [q.id, prescreen[q.id] ?? defaults[q.id]]),
  ) as Record<string, PrescreenAnswer>;
}

function pruneAnswersForPrescreen(
  answers: Record<string, AnswerValue>,
  prescreen: Record<string, PrescreenAnswer>,
): Record<string, AnswerValue> {
  const activeIds = new Set(
    getActiveModules(prescreen).flatMap((m) => m.questions.map((q) => q.id)),
  );
  return Object.fromEntries(Object.entries(answers).filter(([id]) => activeIds.has(id)));
}

export default function App() {
  const saved = loadState();
  const initialPrescreen = normalizePrescreen(saved?.prescreen);

  const [step, setStep] = useState<StepId>(saved?.step ?? "intro");
  const [prescreen, setPrescreen] = useState<Record<string, PrescreenAnswer>>(initialPrescreen);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>(
    pruneAnswersForPrescreen(saved?.answers ?? {}, initialPrescreen),
  );
  const [validationMsg, setValidationMsg] = useState("");
  const [showChangelog, setShowChangelog] = useState(
    () => typeof window !== "undefined" && window.location.hash.startsWith("#changelog"),
  );

  const completed = new Set<StepId>();
  if (step !== "intro") completed.add("intro");
  if (step === "survey" || step === "result") completed.add("prescreen");
  if (step === "result") completed.add("survey");

  const persist = useCallback(
    (next: Partial<SurveyState>) => {
      const state: SurveyState = {
        step,
        prescreen,
        answers,
        ...next,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    },
    [step, prescreen, answers],
  );

  const goTo = (next: StepId) => {
    setValidationMsg("");
    setStep(next);
    persist({ step: next });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openChangelog = () => {
    setShowChangelog(true);
    window.history.replaceState(null, "", "#changelog");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeChangelog = () => {
    setShowChangelog(false);
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePrescreenChange = (id: string, value: boolean) => {
    const nextPrescreen = { ...prescreen, [id]: value };
    const nextAnswers = pruneAnswersForPrescreen(answers, nextPrescreen);
    setPrescreen(nextPrescreen);
    setAnswers(nextAnswers);
    persist({ prescreen: nextPrescreen, answers: nextAnswers });
  };

  const handleAnswerChange = (questionId: string, value: AnswerValue) => {
    const next = { ...answers, [questionId]: value };
    setAnswers(next);
    persist({ answers: next });
  };

  const handleRestart = () => {
    localStorage.removeItem(STORAGE_KEY);
    setStep("intro");
    setPrescreen(defaultPrescreen());
    setAnswers({});
    setValidationMsg("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNext = () => {
    if (step === "intro") {
      goTo("prescreen");
      return;
    }

    if (step === "prescreen") {
      if (!isPrescreenComplete(prescreen)) {
        setValidationMsg("請完成全部六題前導分流後再繼續。");
        return;
      }
      if (!hasActiveModules(prescreen)) {
        setValidationMsg("依前導分流結果，無需填寫任何題組。請至少選擇一項「是」。");
        return;
      }
      goTo("survey");
      return;
    }

    if (step === "survey") {
      if (!isSurveyComplete(answers, prescreen)) {
        setValidationMsg("尚有題目未作答，請完成全部題目後再查看結果。");
        const firstMissing = document.querySelector(".question-card--unanswered");
        firstMissing?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      goTo("result");
    }
  };

  const handleBack = () => {
    if (step === "prescreen") goTo("intro");
    else if (step === "survey") goTo("prescreen");
    else if (step === "result") goTo("survey");
  };

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <p className="app-header__org">台灣設計研究院</p>
          <h1 className="app-header__title">
            台灣設計產業 AI 資安自評檢核表
            <span className="app-header__beta">Beta</span>
          </h1>
          <p className="app-header__subtitle">
            協助設計業自我檢視運用 AI 工具時的資通安全與法令遵循風險
          </p>
          <div className="app-header__links">
            <button type="button" className="app-header__link" onClick={openChangelog}>
              改版說明
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {showChangelog ? (
          <Changelog onBack={closeChangelog} />
        ) : (
          <>
            <StepNav current={step} completed={completed} />

            {validationMsg && <div className="validation-msg">{validationMsg}</div>}

            {step === "intro" && <Instructions />}
            {step === "prescreen" && (
              <Prescreening answers={prescreen} onChange={handlePrescreenChange} />
            )}
            {step === "survey" && (
              <Questionnaire answers={answers} prescreen={prescreen} onChange={handleAnswerChange} />
            )}
            {step === "result" && (
              <Results answers={answers} prescreen={prescreen} onRestart={handleRestart} />
            )}

            {step !== "result" && (
              <div className="sticky-footer">
                <div>
                  {step !== "intro" && (
                    <button type="button" className="btn btn--secondary" onClick={handleBack}>
                      上一步
                    </button>
                  )}
                </div>
                <button type="button" className="btn btn--primary" onClick={handleNext}>
                  {step === "survey" ? "查看評估結果" : "下一步"}
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>台灣設計研究院</p>
      </footer>
    </div>
  );
}
