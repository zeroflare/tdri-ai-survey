import { DATA_CLASSIFICATION, getFullMaxScore, getModuleMaxScore, SURVEY_MODULES } from "../data/survey";

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
    </div>
  );
}
