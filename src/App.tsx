import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { AnswerValue, PrescreenAnswer } from "./data/survey";
import {
  CURRENT_SURVEY_VERSION,
  getActiveModules,
  loadSurveyData,
} from "./data/survey";
import { BasicInfo, EMPTY_PROFILE, isProfileValid, type UserProfile } from "./components/BasicInfo";
import { ConsentNotice, isConsentValid } from "./components/ConsentNotice";
import { Instructions } from "./components/Instructions";
import { Prescreening, isPrescreenComplete } from "./components/Prescreening";
import { hasActiveModules, isSurveyComplete, Questionnaire } from "./components/Questionnaire";
import { Results } from "./components/Results";
import { StepNav, type StepId } from "./components/StepNav";
import { SurveyBootScreen } from "./components/SurveyBootScreen";
import { FeedbackButton } from "./components/FeedbackButton";
import { pathnameToStep, stepToPath } from "./lib/routes";

const STORAGE_KEY = "tdri-ai-survey-state";
const PRESCREEN_IDS = ["01", "02", "03", "04", "05", "06"] as const;

interface SurveyState {
  consentAccepted: boolean;
  profile: UserProfile;
  prescreen: Record<string, PrescreenAnswer>;
  answers: Record<string, AnswerValue>;
}

function loadState(): SurveyState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SurveyState & { step?: StepId };
    return {
      consentAccepted: Boolean(parsed.consentAccepted),
      profile: parsed.profile,
      prescreen: parsed.prescreen,
      answers: parsed.answers,
    };
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
  const result = { ...defaults };
  for (const id of PRESCREEN_IDS) {
    if (prescreen[id] !== null && prescreen[id] !== undefined) {
      result[id] = prescreen[id];
    }
  }
  return result;
}

function normalizeProfile(profile: UserProfile | undefined): UserProfile {
  if (!profile) return { ...EMPTY_PROFILE };
  return {
    name: profile.name ?? "",
    company: profile.company ?? "",
    title: profile.title ?? "",
    email: profile.email ?? "",
  };
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
  const location = useLocation();
  const navigate = useNavigate();
  const step = pathnameToStep(location.pathname);

  const [bootState, setBootState] = useState<"loading" | "ready" | "error">("loading");
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({ ...EMPTY_PROFILE });
  const [prescreen, setPrescreen] = useState<Record<string, PrescreenAnswer>>(defaultPrescreen());
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [validationMsg, setValidationMsg] = useState("");

  useEffect(() => {
    let cancelled = false;

    loadSurveyData(CURRENT_SURVEY_VERSION)
      .then(() => {
        if (cancelled) return;
        const saved = loadState();
        const nextPrescreen = normalizePrescreen(saved?.prescreen);
        setConsentAccepted(Boolean(saved?.consentAccepted));
        setProfile(normalizeProfile(saved?.profile));
        setPrescreen(nextPrescreen);
        setAnswers(pruneAnswersForPrescreen(saved?.answers ?? {}, nextPrescreen));
        setBootState("ready");
      })
      .catch(() => {
        if (!cancelled) setBootState("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!step) {
      navigate(stepToPath("intro"), { replace: true });
    }
  }, [step, navigate]);

  const completed = new Set<StepId>();
  if (step && step !== "intro") completed.add("intro");
  if (step === "profile" || step === "prescreen" || step === "survey" || step === "result") {
    completed.add("consent");
  }
  if (step === "prescreen" || step === "survey" || step === "result") completed.add("profile");
  if (step === "survey" || step === "result") completed.add("prescreen");
  if (step === "result") completed.add("survey");

  const persist = useCallback(
    (next: Partial<SurveyState>) => {
      const state: SurveyState = {
        consentAccepted,
        profile,
        prescreen,
        answers,
        ...next,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    },
    [consentAccepted, profile, prescreen, answers],
  );

  const goTo = (next: StepId) => {
    setValidationMsg("");
    navigate(stepToPath(next));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleConsentChange = (accepted: boolean) => {
    setConsentAccepted(accepted);
    persist({ consentAccepted: accepted });
  };

  const handleProfileChange = (field: keyof UserProfile, value: string) => {
    const next = { ...profile, [field]: value };
    setProfile(next);
    persist({ profile: next });
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
    setConsentAccepted(false);
    setProfile({ ...EMPTY_PROFILE });
    setPrescreen(defaultPrescreen());
    setAnswers({});
    setValidationMsg("");
    navigate(stepToPath("intro"));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleNext = () => {
    if (!step) return;

    if (step === "intro") {
      goTo("consent");
      return;
    }

    if (step === "consent") {
      if (!isConsentValid(consentAccepted)) {
        setValidationMsg("請勾選同意個資蒐集聲明後再繼續。");
        return;
      }
      goTo("profile");
      return;
    }

    if (step === "profile") {
      if (!isProfileValid(profile)) {
        setValidationMsg("若填寫信箱，請輸入有效格式，或留空即可。");
        return;
      }
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
    if (!step) return;
    if (step === "consent") goTo("intro");
    else if (step === "profile") goTo("consent");
    else if (step === "prescreen") goTo("profile");
    else if (step === "survey") goTo("prescreen");
    else if (step === "result") goTo("survey");
  };

  if (bootState === "loading") {
    return (
      <>
        <SurveyBootScreen message="載入問卷資料…" />
        <FeedbackButton />
      </>
    );
  }

  if (bootState === "error") {
    return (
      <>
        <SurveyBootScreen message="問卷資料載入失敗，請重新整理頁面。" error />
        <FeedbackButton />
      </>
    );
  }

  if (!step) return null;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <p className="app-header__org">台灣設計研究院</p>
          <h1 className="app-header__title">
            <button
              type="button"
              className="app-header__title-link"
              onClick={() => goTo("intro")}
            >
              台灣設計產業 AI 資安自評檢核表
            </button>
          </h1>
          <p className="app-header__subtitle">
            協助設計業自我檢視運用 AI 工具時的資通安全與法令遵循風險
          </p>
        </div>
      </header>

      <main className="app-main">
        <StepNav current={step} completed={completed} onSelect={goTo} />

        {validationMsg && <div className="validation-msg">{validationMsg}</div>}

        <div key={step} className="step-transition">
          {step === "intro" && <Instructions />}
          {step === "consent" && (
            <ConsentNotice accepted={consentAccepted} onChange={handleConsentChange} />
          )}
          {step === "profile" && <BasicInfo profile={profile} onChange={handleProfileChange} />}
          {step === "prescreen" && (
            <Prescreening answers={prescreen} onChange={handlePrescreenChange} />
          )}
          {step === "survey" && (
            <Questionnaire answers={answers} prescreen={prescreen} onChange={handleAnswerChange} />
          )}
          {step === "result" && (
            <Results
              profile={profile}
              answers={answers}
              prescreen={prescreen}
              onRestart={handleRestart}
            />
          )}
        </div>

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
      </main>

      <footer className="app-footer">
        <p>台灣設計研究院</p>
      </footer>

      <FeedbackButton />
    </div>
  );
}
