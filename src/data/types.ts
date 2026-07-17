export type AnswerValue = "done" | "partial" | "not_done" | "unknown" | "na";

export type PrescreenAnswer = boolean | null;

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

export interface PrescreenQuestion {
  id: string;
  text: string;
  moduleLabel?: string;
  triggersModule?: string;
}

export interface GlossaryTerm {
  term: string;
  aliases: string[];
  definition: string;
}

export interface ScoreTier {
  label: string;
  min: number;
  max: number;
  advice: string;
}

export interface DataClassificationRow {
  level: string;
  examples: string;
}

export interface SurveyData {
  answerOptions: { value: AnswerValue; label: string }[];
  prescreenQuestions: PrescreenQuestion[];
  dataClassification: DataClassificationRow[];
  glossaryTerms: GlossaryTerm[];
  scoreTiers: ScoreTier[];
  modules: SurveyModule[];
}
