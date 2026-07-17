import type { AnswerValue, PrescreenAnswer } from "../data/survey";
import { getMaxScore, getSurveyData, isModuleActive } from "../data/survey";

export interface QuestionResult {
  id: string;
  moduleId: string;
  moduleTitle: string;
  text: string;
  weight: number;
  answer: AnswerValue;
  points: number;
  maxPoints: number;
}

export interface ScoreResult {
  score: number;
  maxScore: number;
  scorePercent: number;
  answeredCount: number;
  totalQuestions: number;
  needsPriority: boolean;
  highRiskFailures: QuestionResult[];
  lowScoreQuestions: QuestionResult[];
  tier: { label: string; min: number; max: number; advice: string };
  activeModules: string[];
  inactiveModules: string[];
}

/** 依風險權重（3=高、2=中、1=低）與回答計算該題得分 */
export function getQuestionPoints(answer: AnswerValue, weight: 1 | 2 | 3): number {
  switch (answer) {
    case "done":
    case "na":
      return weight;
    case "partial":
      return weight / 2;
    case "not_done":
    case "unknown":
      return 0;
  }
}

export function formatPoints(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export function calculateScore(
  answers: Record<string, AnswerValue>,
  prescreen: Record<string, PrescreenAnswer>,
  surveyVersion?: string | null,
): ScoreResult {
  const survey = getSurveyData(surveyVersion);
  let score = 0;
  let answeredCount = 0;
  let totalQuestions = 0;
  const highRiskFailures: QuestionResult[] = [];
  const lowScoreQuestions: QuestionResult[] = [];
  const activeModules: string[] = [];
  const inactiveModules: string[] = [];

  for (const module of survey.modules) {
    const active = isModuleActive(module, prescreen);
    if (active) {
      activeModules.push(`${module.title}｜${module.subtitle}`);
    } else {
      inactiveModules.push(`${module.title}｜${module.subtitle}`);
      continue;
    }

    for (const question of module.questions) {
      totalQuestions++;
      const answer = answers[question.id];
      if (!answer) continue;

      answeredCount++;
      const points = getQuestionPoints(answer, question.weight);
      score += points;

      const result: QuestionResult = {
        id: question.id,
        moduleId: module.id,
        moduleTitle: `${module.title}｜${module.subtitle}`,
        text: question.text,
        weight: question.weight,
        answer,
        points,
        maxPoints: question.weight,
      };

      if (points < question.weight) {
        lowScoreQuestions.push(result);
      }

      if (question.weight === 3 && answer === "not_done") {
        highRiskFailures.push(result);
      }
    }
  }

  const maxScore = getMaxScore(prescreen, surveyVersion);
  const roundedScore = Math.round(score * 10) / 10;
  const scorePercent = maxScore > 0 ? Math.round((roundedScore / maxScore) * 1000) / 10 : 0;
  const needsPriority = highRiskFailures.length > 0;
  const tier =
    survey.scoreTiers.find((t) => scorePercent >= t.min && scorePercent <= t.max) ??
    survey.scoreTiers[survey.scoreTiers.length - 1];

  return {
    score: roundedScore,
    maxScore,
    scorePercent,
    answeredCount,
    totalQuestions,
    needsPriority,
    highRiskFailures,
    lowScoreQuestions: lowScoreQuestions.sort(
      (a, b) => b.maxPoints - b.points - (a.maxPoints - a.points),
    ),
    tier,
    activeModules,
    inactiveModules,
  };
}

export function getAnswerLabel(answer: AnswerValue, surveyVersion?: string | null): string {
  const option = getSurveyData(surveyVersion).answerOptions.find((o) => o.value === answer);
  return option?.label ?? answer;
}

export function getRiskLabel(weight: 1 | 2 | 3): string {
  switch (weight) {
    case 3:
      return "高風險題";
    case 2:
      return "中風險題";
    case 1:
      return "低風險題";
  }
}

export { getMaxScore };
