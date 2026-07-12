import { useMemo, useState } from "react";
import {
  CHANGELOG_REVISIONS,
  getChangelogRevision,
  type ChangeKind,
  type ChangelogData,
  type ChangelogRevision,
  type DiffPart,
  type QuestionChange,
} from "../lib/changelog";

const KIND_META: Record<ChangeKind, { label: string; className: string }> = {
  unchanged: { label: "未變更", className: "chg-badge--muted" },
  modified: { label: "內容調整", className: "chg-badge--mod" },
  moved: { label: "換題號／順序", className: "chg-badge--move" },
  merged: { label: "合併", className: "chg-badge--merge" },
  added: { label: "新增", className: "chg-badge--add" },
  removed: { label: "刪除", className: "chg-badge--del" },
};

type FilterKey = "all" | ChangeKind;

function DiffText({ parts }: { parts: DiffPart[] }) {
  return (
    <pre className="diff-text">
      {parts.map((part, i) => (
        <span key={i} className={`diff-text__${part.type}`}>
          {part.text}
        </span>
      ))}
    </pre>
  );
}

function ChangeCard({ change }: { change: QuestionChange }) {
  const meta = KIND_META[change.kind];
  const primaryId = change.newIds[0] ?? change.oldIds[0];
  const neu = change.newQuestions[0];
  const old = change.oldQuestions[0];
  const idChanged =
    change.oldIds.length === 1 &&
    change.newIds.length === 1 &&
    change.oldIds[0] !== change.newIds[0];

  const title =
    change.kind === "merged"
      ? `${change.oldIds.join("、")} → ${change.newIds[0]}`
      : change.kind === "modified" && idChanged
        ? `${change.oldIds[0]} → ${change.newIds[0]}`
        : primaryId;

  return (
    <article className={`chg-card chg-card--${change.kind}`} id={`chg-${primaryId}`}>
      <header className="chg-card__head">
        <div className="chg-card__ids">
          <code>{title}</code>
          <span className={`chg-badge ${meta.className}`}>{meta.label}</span>
        </div>
        {neu && (
          <p className="chg-card__module">
            題組 {neu.moduleId}｜{neu.moduleSubtitle}
            {idChanged && change.kind === "modified" ? `（由 ${change.oldIds[0]} 調整）` : ""}
          </p>
        )}
        {!neu && old && (
          <p className="chg-card__module">
            原題組 {old.moduleId}｜{old.moduleSubtitle}
          </p>
        )}
      </header>

      {change.kind === "added" && neu && (
        <div className="diff-block">
          <div className="diff-block__label diff-block__label--add">+ 新題目</div>
          <p className="chg-card__preview">{neu.text}</p>
          <p className="chg-card__meta">
            權重 {neu.weight}
            {neu.redLine ? "（高風險）" : ""} · 可參考：{neu.hint}
          </p>
          <p className="chg-card__meta">風險：{neu.riskDescription}</p>
        </div>
      )}

      {change.kind === "removed" && old && (
        <div className="diff-block">
          <div className="diff-block__label diff-block__label--del">− 已刪除</div>
          <p className="chg-card__preview">{old.text}</p>
        </div>
      )}

      {change.kind === "merged" && (
        <div className="diff-block">
          <div className="diff-block__label diff-block__label--merge">合併說明</div>
          <p className="chg-card__preview">
            以下舊題整併為新題 <code>{change.newIds[0]}</code>：
          </p>
          <ul className="chg-merge-list">
            {change.oldQuestions.map((q) => (
              <li key={q.id}>
                <code>{q.id}</code> {q.text}
              </li>
            ))}
          </ul>
          {neu && (
            <>
              <div className="diff-block__label diff-block__label--add" style={{ marginTop: "0.75rem" }}>
                + 合併後題目
              </div>
              <p className="chg-card__preview">{neu.text}</p>
            </>
          )}
        </div>
      )}

      {change.kind === "modified" &&
        change.fields.map((field) => (
          <div key={field.field} className="diff-block">
            <div className="diff-block__label">{field.label}</div>
            {field.parts ? (
              <DiffText parts={field.parts} />
            ) : (
              <p className="chg-card__preview">
                <span className="diff-text__remove">{field.before}</span>
                {" → "}
                <span className="diff-text__add">{field.after}</span>
              </p>
            )}
          </div>
        ))}

      {change.kind === "unchanged" && (
        <p className="chg-card__preview chg-card__preview--muted">{neu?.text}</p>
      )}
    </article>
  );
}

function RevisionDetail({
  revision,
  onBackToList,
  onBackToSurvey,
}: {
  revision: ChangelogRevision;
  onBackToList: () => void;
  onBackToSurvey: () => void;
}) {
  const [filter, setFilter] = useState<FilterKey>("all");
  const data: ChangelogData = revision.data;

  const filtered = useMemo(() => {
    if (filter === "all") {
      return data.changes.filter((c) => c.kind !== "unchanged" && c.kind !== "moved");
    }
    return data.changes.filter((c) => c.kind === filter);
  }, [data.changes, filter]);

  const filters: { key: FilterKey; label: string; count: number }[] = [
    {
      key: "all",
      label: "有變更",
      count: data.changes.filter((c) => c.kind !== "unchanged" && c.kind !== "moved").length,
    },
    { key: "modified", label: "內容調整", count: data.summary.modified },
    { key: "merged", label: "合併", count: data.summary.merged },
    { key: "added", label: "新增", count: data.summary.added },
    { key: "removed", label: "刪除", count: data.summary.removed },
    { key: "unchanged", label: "未變更", count: data.summary.unchanged },
  ];

  return (
    <div className="changelog">
      <div className="card">
        <div className="changelog__top">
          <div>
            <h2 className="card__title">{revision.title}</h2>
            <p className="card__subtitle">
              對照上一版與目前版本，整理題組調整、合併、新增與文案改寫；僅內容有變者才以 Diff 呈現。
            </p>
          </div>
          <div className="changelog__top-actions">
            <button type="button" className="btn btn--secondary" onClick={onBackToList}>
              所有改版
            </button>
            <button type="button" className="btn btn--secondary" onClick={onBackToSurvey}>
              返回問卷
            </button>
          </div>
        </div>

        <div className="changelog__stats">
          <div className="changelog__stat">
            <span className="changelog__stat-num">
              {data.summary.oldQuestionCount} → {data.summary.newQuestionCount}
            </span>
            <span className="changelog__stat-label">題數</span>
          </div>
          <div className="changelog__stat">
            <span className="changelog__stat-num">
              {data.summary.oldMaxScore} → {data.summary.newMaxScore}
            </span>
            <span className="changelog__stat-label">滿分</span>
          </div>
          <div className="changelog__stat">
            <span className="changelog__stat-num">{data.summary.modified}</span>
            <span className="changelog__stat-label">內容調整</span>
          </div>
          <div className="changelog__stat">
            <span className="changelog__stat-num">{data.summary.merged}</span>
            <span className="changelog__stat-label">合併</span>
          </div>
          <div className="changelog__stat">
            <span className="changelog__stat-num changelog__stat-num--add">
              +{data.summary.added}
            </span>
            <span className="changelog__stat-label">新增</span>
          </div>
          <div className="changelog__stat">
            <span className="changelog__stat-num changelog__stat-num--del">
              −{data.summary.removed}
            </span>
            <span className="changelog__stat-label">刪除</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="card__title">主要調整摘要</h2>
        <ul className="changelog__highlights">
          <li>
            <strong>題數：</strong>
            由 50 題精簡為 {data.summary.newQuestionCount} 題（滿分 100 → {data.summary.newMaxScore}
            ）。五組合併將 13 題併成 5 題（淨減 8），另新增 3 題，故為 50 − 8 + 3 ={" "}
            {data.summary.newQuestionCount}。
          </li>
          <li>
            <strong>題組結構：</strong>
            題組 A／B 對調——帳號與登入管理改為題組 A，AI 使用盤點與基本規則改為題組 B。
          </li>
          <li>
            <strong>五組合併：</strong>
            相近題目整併為一題；合併後權重多採較高風險等級。
            <table className="info-table changelog__merge-table">
              <thead>
                <tr>
                  <th>合併後</th>
                  <th>合併前</th>
                  <th>原題數</th>
                  <th>原主題</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>B-04</th>
                  <td>A-04、C-02</td>
                  <td>2</td>
                  <td>資料不可輸入 AI、定期提醒</td>
                </tr>
                <tr>
                  <th>D-01</th>
                  <td>D-01、D-02、D-03</td>
                  <td>3</td>
                  <td>上傳前檢查、遮蔽、避免整份上傳</td>
                </tr>
                <tr>
                  <th>E-01</th>
                  <td>E-01、E-02</td>
                  <td>2</td>
                  <td>產出審核（人工確認／查核正確性）</td>
                </tr>
                <tr>
                  <th>E-02</th>
                  <td>E-03、E-04</td>
                  <td>2</td>
                  <td>侵權與商用風險檢查</td>
                </tr>
                <tr>
                  <th>G-02</th>
                  <td>G-02、G-03、G-04、G-05</td>
                  <td>4</td>
                  <td>採購前費用、條款、訓練與刪除等確認</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <th>合計</th>
                  <td />
                  <td>13 → 5</td>
                  <td>淨減 8 題</td>
                </tr>
              </tfoot>
            </table>
          </li>
          <li>
            <strong>新增題目：</strong>
            A-04（付費／多人版帳號集中管理）、C-07（定期抽查使用情形）、C-08（AI 中斷時的備援作法）。
          </li>
          <li>
            <strong>內容改寫：</strong>
            多處題幹、判斷參考與風險說明更新；其中 F-05 由「室內或產品實景（含住家…）」改為聚焦未上市產品／原型／未公開設計上傳前的遮蔽與確認。
          </li>
          <li>
            <strong>常見名詞白話對照：</strong>
            新增 NDA、存取金鑰、訓練模型、圖生圖、CRM、ISO 27001／ISMS、DLP、跨境傳輸等說明；檢核表說明頁有完整對照表，題目出現該名詞時也會顯示白話解釋。
          </li>
          <li>
            <strong>閱讀說明：</strong>
            下方 Diff 只列出內容有變、合併、新增或刪除的題目；題號對調但文案不變者不另列出。
          </li>
        </ul>

        <h3 className="changelog__section-title">題組名稱對照</h3>
        <table className="info-table">
          <thead>
            <tr>
              <th>題組</th>
              <th>舊版</th>
              <th>新版</th>
            </tr>
          </thead>
          <tbody>
            {data.moduleChanges.map((m) => (
              <tr key={m.id}>
                <th>{m.id}</th>
                <td className={m.swapped ? "diff-text__remove" : undefined}>{m.beforeSubtitle}</td>
                <td className={m.swapped ? "diff-text__add" : undefined}>{m.afterSubtitle}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 className="card__title">題目 Diff</h2>
        <p className="card__subtitle">
          以題目文字相似度自動對照舊新版本；綠色為新增文字，紅色刪除線為移除文字。
        </p>

        <div className="changelog__filters" role="tablist" aria-label="篩選變更類型">
          {filters.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              className={`changelog__filter${filter === f.key ? " changelog__filter--active" : ""}`}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
              <span className="changelog__filter-count">{f.count}</span>
            </button>
          ))}
        </div>

        <div className="changelog__list">
          {filtered.map((change) => (
            <ChangeCard
              key={`${change.kind}-${change.oldIds.join("-")}-${change.newIds.join("-")}`}
              change={change}
            />
          ))}
          {filtered.length === 0 && <p className="changelog__empty">此篩選條件下沒有項目。</p>}
        </div>
      </div>

      <div className="changelog__bottom">
        <button type="button" className="btn btn--secondary" onClick={onBackToList}>
          所有改版
        </button>
        <button type="button" className="btn btn--primary" onClick={onBackToSurvey}>
          返回問卷
        </button>
      </div>
    </div>
  );
}

function parseRevisionIdFromHash(): string | null {
  const match = window.location.hash.match(/^#changelog(?:\/([^/]+))?$/);
  return match?.[1] ?? null;
}

interface ChangelogProps {
  onBack: () => void;
}

export function Changelog({ onBack }: ChangelogProps) {
  const [selectedId, setSelectedId] = useState<string | null>(() => parseRevisionIdFromHash());

  const selected = getChangelogRevision(selectedId);

  const selectRevision = (id: string) => {
    setSelectedId(id);
    window.history.replaceState(null, "", `#changelog/${id}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const backToList = () => {
    setSelectedId(null);
    window.history.replaceState(null, "", "#changelog");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (selected) {
    return (
      <RevisionDetail revision={selected} onBackToList={backToList} onBackToSurvey={onBack} />
    );
  }

  return (
    <div className="changelog">
      <div className="card">
        <div className="changelog__top">
          <div>
            <h2 className="card__title">改版說明</h2>
            <p className="card__subtitle">選擇要查看的改版紀錄。</p>
          </div>
          <button type="button" className="btn btn--secondary" onClick={onBack}>
            返回問卷
          </button>
        </div>

        <ul className="changelog__revision-list">
          {CHANGELOG_REVISIONS.map((revision) => (
            <li key={revision.id}>
              <button
                type="button"
                className="changelog__revision-item"
                onClick={() => selectRevision(revision.id)}
              >
                <span className="changelog__revision-title">{revision.title}</span>
                <span className="changelog__revision-summary">{revision.summary}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
