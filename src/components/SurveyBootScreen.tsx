interface SurveyBootScreenProps {
  message: string;
  error?: boolean;
}

export function SurveyBootScreen({ message, error }: SurveyBootScreenProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <p className="app-header__org">台灣設計研究院</p>
          <h1 className="app-header__title">台灣設計產業 AI 資安自評檢核表</h1>
        </div>
      </header>
      <main className="app-main">
        <div className={`card survey-boot${error ? " survey-boot--error" : ""}`}>
          <p>{message}</p>
        </div>
      </main>
      <footer className="app-footer">
        <p>台灣設計研究院</p>
      </footer>
    </div>
  );
}
