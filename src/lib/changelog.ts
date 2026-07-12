import oldSurvey from "../data/survey.backup.json";
import newSurvey from "../data/survey.json";

export interface FlatQuestion {
  id: string;
  text: string;
  hint: string;
  weight: number;
  redLine: boolean;
  riskDescription: string;
  moduleId: string;
  moduleTitle: string;
  moduleSubtitle: string;
}

export type DiffPart = { type: "equal" | "add" | "remove"; text: string };

export type ChangeKind = "unchanged" | "modified" | "moved" | "added" | "removed" | "merged";

export interface FieldDiff {
  field: "text" | "hint" | "riskDescription" | "weight" | "redLine";
  label: string;
  before: string;
  after: string;
  parts?: DiffPart[];
}

export interface QuestionChange {
  kind: ChangeKind;
  oldIds: string[];
  newIds: string[];
  oldQuestions: FlatQuestion[];
  newQuestions: FlatQuestion[];
  fields: FieldDiff[];
  similarity: number;
}

export interface ModuleMetaChange {
  id: string;
  beforeSubtitle: string;
  afterSubtitle: string;
  swapped: boolean;
}

export interface ChangelogData {
  summary: {
    oldQuestionCount: number;
    newQuestionCount: number;
    oldMaxScore: number;
    newMaxScore: number;
    unchanged: number;
    moved: number;
    modified: number;
    merged: number;
    added: number;
    removed: number;
  };
  moduleChanges: ModuleMetaChange[];
  changes: QuestionChange[];
}

function flatten(
  modules: {
    id: string;
    title: string;
    subtitle: string;
    questions: {
      id: string;
      text: string;
      hint: string;
      weight: number;
      redLine: boolean;
      riskDescription: string;
    }[];
  }[],
): FlatQuestion[] {
  return modules.flatMap((m) =>
    m.questions.map((q) => ({
      ...q,
      moduleId: m.id,
      moduleTitle: m.title,
      moduleSubtitle: m.subtitle,
    })),
  );
}

function bigrams(text: string): Set<string> {
  const normalized = text.replace(/\s+/g, "");
  const set = new Set<string>();
  for (let i = 0; i < normalized.length - 1; i++) {
    set.add(normalized.slice(i, i + 2));
  }
  return set;
}

function jaccard(a: string, b: string): number {
  const A = bigrams(a);
  const B = bigrams(b);
  if (A.size === 0 && B.size === 0) return 1;
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

/** Character-level LCS diff (readable for Chinese). */
export function diffChars(before: string, after: string): DiffPart[] {
  const a = [...before];
  const b = [...after];
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    for (let j = 1; j <= m; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const raw: DiffPart[] = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      raw.push({ type: "equal", text: a[i - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      raw.push({ type: "add", text: b[j - 1] });
      j--;
    } else {
      raw.push({ type: "remove", text: a[i - 1] });
      i--;
    }
  }
  raw.reverse();

  const merged: DiffPart[] = [];
  for (const part of raw) {
    const last = merged[merged.length - 1];
    if (last && last.type === part.type) last.text += part.text;
    else merged.push({ ...part });
  }
  return merged;
}

function weightLabel(weight: number, redLine: boolean): string {
  const base = weight === 3 ? "高（3）" : weight === 2 ? "中（2）" : "低（1）";
  return redLine ? `★${base}` : base;
}

function buildFieldDiffs(oldQ: FlatQuestion, newQ: FlatQuestion): FieldDiff[] {
  const fields: FieldDiff[] = [];

  if (oldQ.text !== newQ.text) {
    fields.push({
      field: "text",
      label: "題目",
      before: oldQ.text,
      after: newQ.text,
      parts: diffChars(oldQ.text, newQ.text),
    });
  }
  if (oldQ.hint !== newQ.hint) {
    fields.push({
      field: "hint",
      label: "可參考什麼來判斷",
      before: oldQ.hint,
      after: newQ.hint,
      parts: diffChars(oldQ.hint, newQ.hint),
    });
  }
  if (oldQ.riskDescription !== newQ.riskDescription) {
    fields.push({
      field: "riskDescription",
      label: "風險",
      before: oldQ.riskDescription,
      after: newQ.riskDescription,
      parts: diffChars(oldQ.riskDescription, newQ.riskDescription),
    });
  }
  if (oldQ.weight !== newQ.weight || oldQ.redLine !== newQ.redLine) {
    fields.push({
      field: "weight",
      label: "權重",
      before: weightLabel(oldQ.weight, oldQ.redLine),
      after: weightLabel(newQ.weight, newQ.redLine),
    });
  }

  return fields;
}

function buildChangelog(): ChangelogData {
  const oldQs = flatten(oldSurvey.modules);
  const newQs = flatten(newSurvey.modules);
  const oldById = new Map(oldQs.map((q) => [q.id, q]));
  const newById = new Map(newQs.map((q) => [q.id, q]));

  const moduleChanges: ModuleMetaChange[] = oldSurvey.modules.map((oldMod, index) => {
    const newMod = newSurvey.modules[index];
    return {
      id: oldMod.id,
      beforeSubtitle: oldMod.subtitle,
      afterSubtitle: newMod.subtitle,
      swapped: oldMod.subtitle !== newMod.subtitle,
    };
  });

  // Known multi-question merges from this revision (old ids → new id).
  const curatedMerges: { oldIds: string[]; newId: string }[] = [
    { oldIds: ["A-04", "C-02"], newId: "B-04" },
    { oldIds: ["D-01", "D-02", "D-03"], newId: "D-01" },
    { oldIds: ["E-01", "E-02"], newId: "E-01" },
    { oldIds: ["E-03", "E-04"], newId: "E-02" },
    { oldIds: ["G-02", "G-03", "G-04", "G-05"], newId: "G-02" },
  ];

  // Content rewrites that similarity matching may miss.
  const curatedRewrites: { oldId: string; newId: string }[] = [{ oldId: "F-05", newId: "F-05" }];

  const usedOld = new Set<string>();
  const usedNew = new Set<string>();
  const changes: QuestionChange[] = [];

  for (const merge of curatedMerges) {
    const oldQuestions = merge.oldIds.map((id) => oldById.get(id)).filter(Boolean) as FlatQuestion[];
    const neu = newById.get(merge.newId);
    if (!neu || oldQuestions.length < 2) continue;
    for (const q of oldQuestions) usedOld.add(q.id);
    usedNew.add(neu.id);
    changes.push({
      kind: "merged",
      oldIds: oldQuestions.map((q) => q.id),
      newIds: [neu.id],
      oldQuestions,
      newQuestions: [neu],
      fields: [],
      similarity: 1,
    });
  }

  for (const rewrite of curatedRewrites) {
    const old = oldById.get(rewrite.oldId);
    const neu = newById.get(rewrite.newId);
    if (!old || !neu || usedOld.has(old.id) || usedNew.has(neu.id)) continue;
    usedOld.add(old.id);
    usedNew.add(neu.id);
    const fields = buildFieldDiffs(old, neu);
    changes.push({
      kind: fields.length ? "modified" : "unchanged",
      oldIds: [old.id],
      newIds: [neu.id],
      oldQuestions: [old],
      newQuestions: [neu],
      fields,
      similarity: 1,
    });
  }

  type Pair = { score: number; old: FlatQuestion; neu: FlatQuestion };
  const pairs: Pair[] = [];
  for (const old of oldQs) {
    if (usedOld.has(old.id)) continue;
    for (const neu of newQs) {
      if (usedNew.has(neu.id)) continue;
      const score = jaccard(old.text, neu.text);
      if (score >= 0.35) pairs.push({ score, old, neu });
    }
  }
  pairs.sort((a, b) => b.score - a.score);

  const oneToOne: Pair[] = [];

  // Prefer strong matches first so weak pairs can become merges later.
  for (const pair of pairs) {
    if (pair.score < 0.55) continue;
    if (usedOld.has(pair.old.id) || usedNew.has(pair.neu.id)) continue;
    usedOld.add(pair.old.id);
    usedNew.add(pair.neu.id);
    oneToOne.push(pair);
  }

  for (const pair of oneToOne) {
    const fields = buildFieldDiffs(pair.old, pair.neu);

    // Pure renumber / module swap with identical content: do not surface as a change.
    if (fields.length === 0) {
      changes.push({
        kind: "unchanged",
        oldIds: [pair.old.id],
        newIds: [pair.neu.id],
        oldQuestions: [pair.old],
        newQuestions: [pair.neu],
        fields: [],
        similarity: pair.score,
      });
      continue;
    }

    changes.push({
      kind: "modified",
      oldIds: [pair.old.id],
      newIds: [pair.neu.id],
      oldQuestions: [pair.old],
      newQuestions: [pair.neu],
      fields,
      similarity: pair.score,
    });
  }

  // Remaining new questions: try merge from multiple unmatched old questions
  const leftoverNew = newQs.filter((q) => !usedNew.has(q.id));
  const leftoverOld = () => oldQs.filter((q) => !usedOld.has(q.id));

  for (const neu of leftoverNew) {
    const candidates = leftoverOld()
      .map((old) => ({ old, score: jaccard(old.text, neu.text) }))
      .filter((c) => c.score >= 0.2)
      .sort((a, b) => b.score - a.score);

    if (candidates.length >= 2) {
      const sources = candidates.filter((c) => c.score >= 0.2).slice(0, 5);
      for (const s of sources) usedOld.add(s.old.id);
      usedNew.add(neu.id);
      changes.push({
        kind: "merged",
        oldIds: sources.map((s) => s.old.id),
        newIds: [neu.id],
        oldQuestions: sources.map((s) => s.old),
        newQuestions: [neu],
        fields: [],
        similarity: sources[0].score,
      });
    } else if (candidates.length === 1) {
      const old = candidates[0].old;
      usedOld.add(old.id);
      usedNew.add(neu.id);
      const fields = buildFieldDiffs(old, neu);
      changes.push({
        kind: fields.length ? "modified" : "unchanged",
        oldIds: [old.id],
        newIds: [neu.id],
        oldQuestions: [old],
        newQuestions: [neu],
        fields,
        similarity: candidates[0].score,
      });
    } else {
      usedNew.add(neu.id);
      changes.push({
        kind: "added",
        oldIds: [],
        newIds: [neu.id],
        oldQuestions: [],
        newQuestions: [neu],
        fields: [],
        similarity: 0,
      });
    }
  }

  for (const old of leftoverOld()) {
    changes.push({
      kind: "removed",
      oldIds: [old.id],
      newIds: [],
      oldQuestions: [old],
      newQuestions: [],
      fields: [],
      similarity: 0,
    });
  }

  const sortKey = (c: QuestionChange) => c.newIds[0] ?? c.oldIds[0] ?? "";
  changes.sort((a, b) => sortKey(a).localeCompare(sortKey(b), "en"));

  const oldMaxScore = oldQs.reduce((s, q) => s + q.weight, 0);
  const newMaxScore = newQs.reduce((s, q) => s + q.weight, 0);

  return {
    summary: {
      oldQuestionCount: oldQs.length,
      newQuestionCount: newQs.length,
      oldMaxScore,
      newMaxScore,
      unchanged: changes.filter((c) => c.kind === "unchanged").length,
      moved: changes.filter((c) => c.kind === "moved").length,
      modified: changes.filter((c) => c.kind === "modified").length,
      merged: changes.filter((c) => c.kind === "merged").length,
      added: changes.filter((c) => c.kind === "added").length,
      removed: changes.filter((c) => c.kind === "removed").length,
    },
    moduleChanges,
    changes,
  };
}

export const CHANGELOG = buildChangelog();

export interface ChangelogRevision {
  id: string;
  title: string;
  summary: string;
  data: ChangelogData;
}

/** Newest first. Add future revisions here. */
export const CHANGELOG_REVISIONS: ChangelogRevision[] = [
  {
    id: "20260713",
    title: "20260713 改版說明",
    summary: "題目精簡與改寫：50 → 45 題，題組 A／B 對調，五組合併並新增 A-04、C-07、C-08；另加常見名詞白話對照。",
    data: CHANGELOG,
  },
];

export function getChangelogRevision(id: string | null | undefined): ChangelogRevision | undefined {
  if (!id) return undefined;
  return CHANGELOG_REVISIONS.find((r) => r.id === id);
}
