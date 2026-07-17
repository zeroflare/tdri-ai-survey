import { compressToEncodedURIComponent, decompressFromEncodedURIComponent } from "lz-string";
import type { AnswerValue, PrescreenAnswer } from "../data/survey";
import {
  compactSurveyVersion,
  CURRENT_SURVEY_VERSION,
  expandSurveyVersion,
  resolveReportSurveyVersion,
} from "../data/survey";
import type { UserProfile } from "../components/BasicInfo";

export interface ReportPayload {
  surveyVersion: string;
  profile: UserProfile;
  prescreen: Record<string, PrescreenAnswer>;
  answers: Record<string, AnswerValue>;
}

/** v2 精簡格式：短 key + 短 value + lz-string 壓縮 */
interface CompactReportV2 {
  v: 2;
  /** 問卷版本日期，如 20260717 */
  s?: string;
  /** [姓名, 公司, 職稱, 信箱] */
  p: [string, string, string, string];
  /** 前導分流 01–06，6 bit 遮罩（1=是） */
  r: number;
  /** 答案字串，如 a1da2pb3n（題號 + 單字元答案） */
  a: string;
}

const ANSWER_TO_CHAR: Record<AnswerValue, string> = {
  done: "d",
  partial: "p",
  not_done: "n",
  unknown: "u",
  na: "x",
};

const CHAR_TO_ANSWER: Record<string, AnswerValue> = {
  d: "done",
  p: "partial",
  n: "not_done",
  u: "unknown",
  x: "na",
};

const ANSWER_PATTERN = /([a-h]\d+)([dpxnu])/gi;

function questionIdToShort(id: string): string {
  const match = id.match(/^([A-H])-(\d+)$/i);
  if (!match) return id.toLowerCase();
  return match[1].toLowerCase() + parseInt(match[2], 10);
}

function shortToQuestionId(short: string): string {
  const match = short.match(/^([a-h])(\d+)$/i);
  if (!match) return short;
  return `${match[1].toUpperCase()}-${String(parseInt(match[2], 10)).padStart(2, "0")}`;
}

function encodePrescreen(prescreen: Record<string, PrescreenAnswer>): number {
  let bits = 0;
  for (let i = 1; i <= 6; i++) {
    const id = String(i).padStart(2, "0");
    if (prescreen[id] === true) {
      bits |= 1 << (i - 1);
    }
  }
  return bits;
}

function decodePrescreen(bits: number): Record<string, PrescreenAnswer> {
  const result: Record<string, PrescreenAnswer> = {};
  for (let i = 1; i <= 6; i++) {
    const id = String(i).padStart(2, "0");
    result[id] = (bits & (1 << (i - 1))) !== 0;
  }
  return result;
}

function encodeAnswers(answers: Record<string, AnswerValue>): string {
  return Object.entries(answers)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, value]) => questionIdToShort(id) + ANSWER_TO_CHAR[value])
    .join("");
}

function decodeAnswers(encoded: string): Record<string, AnswerValue> {
  const result: Record<string, AnswerValue> = {};
  for (const match of encoded.matchAll(ANSWER_PATTERN)) {
    const answer = CHAR_TO_ANSWER[match[2].toLowerCase()];
    if (answer) {
      result[shortToQuestionId(match[1])] = answer;
    }
  }
  return result;
}

function toCompact(payload: ReportPayload): CompactReportV2 {
  const { profile, prescreen, answers, surveyVersion } = payload;
  return {
    v: 2,
    s: compactSurveyVersion(surveyVersion),
    p: [profile.name, profile.company, profile.title, profile.email],
    r: encodePrescreen(prescreen),
    a: encodeAnswers(answers),
  };
}

function fromCompact(compact: CompactReportV2): ReportPayload {
  const [name, company, title, email] = compact.p;
  const surveyVersion = compact.s
    ? expandSurveyVersion(compact.s)
    : CURRENT_SURVEY_VERSION;
  return {
    surveyVersion,
    profile: { name, company, title, email },
    prescreen: decodePrescreen(compact.r),
    answers: decodeAnswers(compact.a),
  };
}

function fromBase64Url(encoded: string): Uint8Array {
  const padded = encoded.replace(/-/g, "+").replace(/_/g, "/");
  const pad = (4 - (padded.length % 4)) % 4;
  const binary = atob(padded + "=".repeat(pad));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** v1：未壓縮 JSON + base64url（相容舊連結） */
function decodeLegacyV1(encoded: string): ReportPayload | null {
  try {
    const json = new TextDecoder().decode(fromBase64Url(encoded));
    const parsed = JSON.parse(json) as ReportPayload & { surveyVersion?: string };
    if (!parsed.profile || !parsed.prescreen || !parsed.answers) return null;
    return {
      surveyVersion: parsed.surveyVersion ?? CURRENT_SURVEY_VERSION,
      profile: parsed.profile,
      prescreen: parsed.prescreen,
      answers: parsed.answers,
    };
  } catch {
    return null;
  }
}

export function encodeReportPayload(payload: ReportPayload): string {
  const json = JSON.stringify(toCompact(payload));
  return compressToEncodedURIComponent(json);
}

export function decodeReportPayload(encoded: string): ReportPayload | null {
  if (!encoded) return null;

  try {
    const json = decompressFromEncodedURIComponent(encoded);
    if (json) {
      const parsed = JSON.parse(json) as CompactReportV2;
      if (parsed.v === 2 && parsed.p && typeof parsed.r === "number" && typeof parsed.a === "string") {
        return fromCompact(parsed);
      }
    }
  } catch {
    // fall through to legacy
  }

  return decodeLegacyV1(encoded);
}

export function isReportPayloadValid(payload: ReportPayload): boolean {
  return resolveReportSurveyVersion(payload.surveyVersion) !== null;
}

export function buildReportUrl(payload: ReportPayload): string {
  const basePath = import.meta.env.BASE_URL.replace(/\/?$/, "/");
  const encoded = encodeReportPayload(payload);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}${basePath}report?d=${encoded}`;
}

export function createReportPayload(
  profile: UserProfile,
  prescreen: Record<string, PrescreenAnswer>,
  answers: Record<string, AnswerValue>,
  surveyVersion: string = CURRENT_SURVEY_VERSION,
): ReportPayload {
  return { surveyVersion, profile, prescreen, answers };
}
