import type { SurveyData } from "./types";

/**
 * 問卷版本管理（JSON 置於 public/data/，檔名 survey-YYYYMMDD.json）
 *
 * 更新題目時：
 * 1. 新增 public/data/survey-YYYYMMDD.json
 * 2. 在 SURVEY_VERSION_FILES 註冊新版（保留舊版以支援舊報告）
 * 3. 更新 CURRENT_SURVEY_VERSION
 */
export const SURVEY_VERSION_FILES = ["20260717"] as const;

export type SurveyVersionId = (typeof SURVEY_VERSION_FILES)[number];

/** 目前填寫中的問卷版本 */
export const CURRENT_SURVEY_VERSION: SurveyVersionId = "20260717";

const cache = new Map<string, SurveyData>();

export function getSurveyJsonUrl(version: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, "/");
  return `${base}data/survey-${expandSurveyVersion(version)}.json`;
}

export async function loadSurveyData(version?: string | null): Promise<SurveyData> {
  const normalized = getSurveyVersion(version);
  const cached = cache.get(normalized);
  if (cached) return cached;

  const response = await fetch(getSurveyJsonUrl(normalized));
  if (!response.ok) {
    throw new Error(`無法載入問卷 ${normalized}`);
  }

  const data = (await response.json()) as SurveyData;
  cache.set(normalized, data);
  return data;
}

export function isSurveyDataLoaded(version?: string | null): boolean {
  return cache.has(getSurveyVersion(version));
}

export function getSurveyData(version?: string | null): SurveyData {
  const normalized = getSurveyVersion(version);
  const data = cache.get(normalized);
  if (!data) {
    throw new Error(`問卷 ${normalized} 尚未載入`);
  }
  return data;
}

/** 正規化版號為 YYYYMMDD（如 20260717） */
export function compactSurveyVersion(version: string): string {
  return version.replace(/-/g, "");
}

/** 還原版號為 YYYYMMDD 註冊 key */
export function expandSurveyVersion(compact: string): string {
  return compact.replace(/-/g, "");
}

export function isKnownSurveyVersion(version: string): boolean {
  const normalized = expandSurveyVersion(version);
  return (SURVEY_VERSION_FILES as readonly string[]).includes(normalized);
}

export function getSurveyVersion(version?: string | null): string {
  const normalized = version ? expandSurveyVersion(version) : CURRENT_SURVEY_VERSION;
  if (isKnownSurveyVersion(normalized)) return normalized;
  return CURRENT_SURVEY_VERSION;
}

/** 報告解碼用：未知版本回傳 null（不 fallback） */
export function resolveReportSurveyVersion(version?: string | null): string | null {
  if (!version) return CURRENT_SURVEY_VERSION;
  const normalized = expandSurveyVersion(version);
  return isKnownSurveyVersion(normalized) ? normalized : null;
}

export function listSurveyVersions(): string[] {
  return [...SURVEY_VERSION_FILES];
}

/** 顯示用：20260717 → 2026-07-17 */
export function formatSurveyVersionLabel(version: string): string {
  const v = expandSurveyVersion(version);
  if (/^\d{8}$/.test(v)) {
    return `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}`;
  }
  return v;
}
