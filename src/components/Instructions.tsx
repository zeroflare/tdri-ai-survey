import { DATA_CLASSIFICATION, getFullMaxScore, getModuleMaxScore, SCORE_TIERS, SURVEY_MODULES } from "../data/survey";

export function Instructions() {
  return (
    <div>
      <div className="card">
        <h2 className="card__title">一、檢核表說明</h2>
        <p>
          本檢核表用於協助台灣設計產業（含室內、平面、品牌、網頁、產品、影像等領域）自我檢視運用 AI
          工具時的資通安全與法令遵循風險，以辨識並優先補強風險較高的項目。本表定位為自評與持續改善工具，得分宜作為自我檢視與追蹤改善之依據。
        </p>
      </div>

      <div className="card">
        <h2 className="card__title">問卷題組</h2>
        <p className="card__subtitle">
          本檢核表共分八個題組，題組 A、B、C 依分流-01 觸發；題組 D 至 H 依前導分流結果觸發。選「否」的題組不會出現在問卷中，也不計入本次滿分。
        </p>
        <table className="info-table info-table--group-list">
          <tbody>
            {SURVEY_MODULES.map((group) => (
              <tr key={group.id}>
                <th>題組 {group.id}</th>
                <td>{group.subtitle}</td>
                <td className="score-col">{getModuleMaxScore(group)} 分</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <th>總分</th>
              <td />
              <td className="score-col">{getFullMaxScore()} 分</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="card">
        <h2 className="card__title">二、填寫說明</h2>
        <ul>
          <li>
            <strong>填答人員：</strong>
            由負責或熟悉本單位 AI 使用情形之人員填寫，個人接案者就自身作業情形填答。
          </li>
          <li>
            <strong>題組適用：</strong>
            各題組依前導分流結果觸發；選「否」的題組不顯示於問卷、不計入滿分。題組 A、B、C 由分流-01 觸發，題組 D 至 H 由分流-02 至 06 觸發。
          </li>
          <li>
            <strong>作答方式：</strong>
            每一題於「回答」欄勾選一項——已做到、部分做到、尚未做到、不知道或不適用。
          </li>
        </ul>
      </div>

      <div className="card">
        <h2 className="card__title">三、資料分級參考</h2>
        <p className="card__subtitle">
          填答前請先依下列四級對齊認知，以統一對「敏感資料」的判斷標準；問卷多處需據此判斷資料分級。
        </p>
        <table className="info-table">
          <thead>
            <tr>
              <th>分級</th>
              <th>設計業常見例子</th>
            </tr>
          </thead>
          <tbody>
            {DATA_CLASSIFICATION.map((row) => (
              <tr key={row.level}>
                <th>{row.level}</th>
                <td>{row.examples}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h2 className="card__title">四、計算說明</h2>
        <p>本表採加分制，滿分 {getFullMaxScore()} 分，逐題累加得分，規則如下：</p>
        <ul>
          <li>
            <strong>風險權重：</strong>
            每題依風險程度——低風險題 1 分、中風險題 2 分、高風險題 3 分。
          </li>
          <li>
            <strong>加分方式：</strong>
            依下表計算各題得分後加總；選完選項後即時顯示該題與目前總分。
          </li>
          <li>
            <strong>未觸發題組：</strong>
            前導分流選「否」的題組不顯示於問卷，也不計入本次滿分。
          </li>
          <li>
            <strong>高風險題：</strong>
            任一高風險題為「尚未做到」（得 0 分）時，不論總分高低，整體均標示「需優先處理」。
          </li>
        </ul>

        <table className="info-table">
          <thead>
            <tr>
              <th>回答</th>
              <th>高風險題</th>
              <th>中風險題</th>
              <th>低風險題</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th>已做到</th>
              <td>3</td>
              <td>2</td>
              <td>1</td>
            </tr>
            <tr>
              <th>部分做到</th>
              <td>1.5</td>
              <td>1</td>
              <td>0.5</td>
            </tr>
            <tr>
              <th>尚未做到</th>
              <td>0</td>
              <td>0</td>
              <td>0</td>
            </tr>
            <tr>
              <th>不知道</th>
              <td>0</td>
              <td>0</td>
              <td>0</td>
            </tr>
            <tr>
              <th>不適用</th>
              <td>3</td>
              <td>2</td>
              <td>1</td>
            </tr>
          </tbody>
        </table>

        <div className="example-box">
          <strong>計算範例</strong>
          <p style={{ marginTop: "0.5rem" }}>
            某設計工作室經前導分流後，觸發題組 A、B、C 與題組 D、E、F（題組 G、H 選「否」，不顯示也不計分）。
          </p>
          <ol>
            <li>本次滿分 77 分（題組 G 5 分、題組 H 10 分不計入）。</li>
            <li>題組 G、H 不顯示於問卷。</li>
            <li>
              作答後，「尚未做到」的題目權重合計 8 分 → 得 0 分；「部分做到」的題目權重合計 6 分 → 得一半 3 分。
            </li>
            <li>最終得分 = 77 − 8 − 3 = 66 分（得分率 85.7%）。</li>
            <li>若其中有任一高風險題為「尚未做到」，則不論得分多少，整體仍標示「需優先處理」。</li>
          </ol>
        </div>
      </div>

      <div className="card">
        <h2 className="card__title">五、得分率與建議</h2>
        <p className="card__subtitle">
          請依得分率對照下表；無論落於何一級距，凡標示「需優先處理」之高風險題均應最先處理。
        </p>
        <table className="info-table">
          <thead>
            <tr>
              <th>得分率</th>
              <th>建議注意事項</th>
            </tr>
          </thead>
          <tbody>
            {SCORE_TIERS.map((tier) => (
              <tr key={tier.label}>
                <th>{tier.label}</th>
                <td>{tier.advice}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
