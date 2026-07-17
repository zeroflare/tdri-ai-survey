const STEPS = [
  { id: "intro", label: "檢核表說明" },
  { id: "profile", label: "基本資料" },
  { id: "prescreen", label: "前導分流" },
  { id: "survey", label: "填寫問卷" },
  { id: "result", label: "評估結果" },
] as const;

export type StepId = (typeof STEPS)[number]["id"];

interface StepNavProps {
  current: StepId;
  completed: Set<StepId>;
}

export function StepNav({ current, completed }: StepNavProps) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <nav className="step-nav" aria-label="問卷步驟">
      {STEPS.map((step, index) => {
        const isActive = step.id === current;
        const isDone = completed.has(step.id) || index < currentIndex;
        const className = [
          "step-nav__item",
          isActive ? "step-nav__item--active" : "",
          isDone && !isActive ? "step-nav__item--done" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <div key={step.id} className={className} aria-current={isActive ? "step" : undefined}>
            <span className="step-nav__num">{index + 1}</span>
            {step.label}
          </div>
        );
      })}
    </nav>
  );
}

export { STEPS };
