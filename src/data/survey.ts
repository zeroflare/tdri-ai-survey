import { getSurveyData } from "./versions";
import type { GlossaryTerm, SurveyModule } from "./types";

export type {
  AnswerValue,
  DataClassificationRow,
  GlossaryTerm,
  PrescreenAnswer,
  PrescreenQuestion,
  ScoreTier,
  SurveyData,
  SurveyModule,
  SurveyQuestion,
} from "./types";

export {
  CURRENT_SURVEY_VERSION,
  compactSurveyVersion,
  expandSurveyVersion,
  formatSurveyVersionLabel,
  getSurveyData,
  getSurveyJsonUrl,
  getSurveyVersion,
  isKnownSurveyVersion,
  isSurveyDataLoaded,
  listSurveyVersions,
  loadSurveyData,
  resolveReportSurveyVersion,
  SURVEY_VERSION_FILES,
} from "./versions";

export function getGlossaryMatches(...texts: string[]): GlossaryTerm[] {
  const haystack = texts.join("\n");
  const matched: GlossaryTerm[] = [];
  for (const entry of getSurveyData().glossaryTerms) {
    const aliases = [...entry.aliases].sort((a, b) => b.length - a.length);
    if (aliases.some((alias) => haystack.includes(alias))) {
      matched.push(entry);
    }
  }
  return matched;
}

export function isModuleActive(
  module: SurveyModule,
  prescreen: Record<string, import("./types").PrescreenAnswer>,
): boolean {
  return prescreen[module.prescreenId] === true;
}

export function getActiveModules(
  prescreen: Record<string, import("./types").PrescreenAnswer>,
  surveyVersion?: string | null,
): SurveyModule[] {
  const data = getSurveyData(surveyVersion);
  return data.modules.filter((module) => isModuleActive(module, prescreen));
}

export function getInactiveModules(
  prescreen: Record<string, import("./types").PrescreenAnswer>,
  surveyVersion?: string | null,
): SurveyModule[] {
  const data = getSurveyData(surveyVersion);
  return data.modules.filter((module) => !isModuleActive(module, prescreen));
}

export function getModuleMaxScore(module: SurveyModule): number {
  return module.questions.reduce((sum, q) => sum + q.weight, 0);
}

export function getFullMaxScore(surveyVersion?: string | null): number {
  const data = getSurveyData(surveyVersion);
  return data.modules.reduce((sum, module) => sum + getModuleMaxScore(module), 0);
}

export function getMaxScore(
  prescreen: Record<string, import("./types").PrescreenAnswer>,
  surveyVersion?: string | null,
): number {
  return getActiveModules(prescreen, surveyVersion).reduce(
    (sum, module) => sum + module.questions.reduce((s, q) => s + q.weight, 0),
    0,
  );
}
