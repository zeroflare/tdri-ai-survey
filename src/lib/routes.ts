import type { StepId } from "../components/StepNav";

export const STEP_PATHS: Record<StepId, string> = {
  intro: "/intro",
  consent: "/consent",
  profile: "/profile",
  prescreen: "/prescreen",
  survey: "/survey",
  result: "/result",
};

const VALID_STEPS = new Set<string>(Object.keys(STEP_PATHS));

export function pathnameToStep(pathname: string): StepId | null {
  const segment = pathname.replace(/^\/+|\/+$/g, "");
  if (!segment) return "intro";
  if (VALID_STEPS.has(segment)) return segment as StepId;
  return null;
}

export function stepToPath(step: StepId): string {
  return STEP_PATHS[step];
}
