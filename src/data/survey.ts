import surveyData from "./survey.json";

export type AnswerValue = "done" | "partial" | "not_done" | "unknown" | "na";

export type PrescreenAnswer = boolean | null;

export interface PrescreenQuestion {
  id: string;
  text: string;
  moduleLabel?: string;
  triggersModule?: string;
}

export interface SurveyQuestion {
  id: string;
  text: string;
  hint: string;
  weight: 1 | 2 | 3;
  redLine: boolean;
  riskDescription: string;
}

export interface SurveyModule {
  id: string;
  title: string;
  subtitle: string;
  prescreenId: string;
  questions: SurveyQuestion[];
}

export const ANSWER_OPTIONS = surveyData.answerOptions as {
  value: AnswerValue;
  label: string;
}[];

export const PRESCREEN_QUESTIONS = surveyData.prescreenQuestions as PrescreenQuestion[];

export const DATA_CLASSIFICATION = surveyData.dataClassification;

export const SCORE_TIERS = surveyData.scoreTiers;

export const SURVEY_MODULES = surveyData.modules as SurveyModule[];

export function isModuleActive(
  module: SurveyModule,
  prescreen: Record<string, PrescreenAnswer>,
): boolean {
  return prescreen[module.prescreenId] === true;
}

export function getActiveModules(prescreen: Record<string, PrescreenAnswer>): SurveyModule[] {
  return SURVEY_MODULES.filter((module) => isModuleActive(module, prescreen));
}

export function getInactiveModules(prescreen: Record<string, PrescreenAnswer>): SurveyModule[] {
  return SURVEY_MODULES.filter((module) => !isModuleActive(module, prescreen));
}

export function getModuleMaxScore(module: SurveyModule): number {
  return module.questions.reduce((sum, q) => sum + q.weight, 0);
}

export function getFullMaxScore(): number {
  return SURVEY_MODULES.reduce((sum, module) => sum + getModuleMaxScore(module), 0);
}

export function getMaxScore(prescreen: Record<string, PrescreenAnswer>): number {
  return getActiveModules(prescreen).reduce(
    (sum, module) => sum + module.questions.reduce((s, q) => s + q.weight, 0),
    0,
  );
}
