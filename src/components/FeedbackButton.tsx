import { useEffect, useId, useState } from "react";
import type { UserProfile } from "./BasicInfo";
import { isFeedbackWebhookConfigured, sendFeedback } from "../lib/feedback";

const STORAGE_KEY = "tdri-ai-survey-state";

function loadSavedProfile(): Partial<UserProfile> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { profile?: UserProfile };
    return parsed.profile ?? {};
  } catch {
    return {};
  }
}

export function FeedbackButton() {
  const dialogId = useId();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "failed" | "unconfigured">(
    "idle",
  );

  useEffect(() => {
    if (!open) return;
    const saved = loadSavedProfile();
    setName(saved.name ?? "");
    setEmail(saved.email ?? "");
    setStatus("idle");
  }, [open]);

  const handleSubmit = async () => {
    if (!message.trim()) return;

    if (!isFeedbackWebhookConfigured()) {
      setStatus("unconfigured");
      return;
    }

    setStatus("sending");
    const saved = loadSavedProfile();

    const sent = await sendFeedback({
      message,
      profile: {
        name: name || saved.name,
        company: saved.company,
        title: saved.title,
        email: email || saved.email,
      },
    });

    if (sent) {
      setStatus("sent");
      setMessage("");
      window.setTimeout(() => setOpen(false), 1200);
      return;
    }

    setStatus("failed");
  };

  return (
    <>
      <button
        type="button"
        className="feedback-fab"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={dialogId}
      >
        意見回饋
      </button>

      {open && (
        <div className="feedback-overlay" onClick={() => setOpen(false)} role="presentation">
          <div
            id={dialogId}
            className="feedback-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${dialogId}-title`}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id={`${dialogId}-title`} className="feedback-dialog__title">
              意見回饋
            </h2>
            <p className="feedback-dialog__subtitle">
              請針對問卷題目、用語或網站操作提供意見。送出後將通知研究團隊（Google Chat）。
            </p>

            <label className="feedback-field">
              <span>您的意見</span>
              <textarea
                rows={5}
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="例如：B-04 題目用語不清楚、結果頁建議看不懂…"
                autoFocus
              />
            </label>

            <label className="feedback-field">
              <span>姓名（選填）</span>
              <input type="text" value={name} onChange={(event) => setName(event.target.value)} />
            </label>

            <label className="feedback-field">
              <span>信箱（選填）</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            {status === "sent" && (
              <p className="feedback-dialog__status feedback-dialog__status--ok">已送出，感謝您的回饋。</p>
            )}
            {status === "failed" && (
              <p className="feedback-dialog__status feedback-dialog__status--error">
                送出失敗，請稍後再試或改以訪談方式告知研究員。
              </p>
            )}
            {status === "unconfigured" && (
              <p className="feedback-dialog__status feedback-dialog__status--error">
                尚未設定 Google Chat webhook，無法送出意見。
              </p>
            )}

            <div className="btn-row">
              <button type="button" className="btn btn--secondary" onClick={() => setOpen(false)}>
                取消
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleSubmit}
                disabled={!message.trim() || status === "sending"}
              >
                {status === "sending" ? "送出中…" : "送出"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
