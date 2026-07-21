interface ConsentNoticeProps {
  accepted: boolean;
  onChange: (accepted: boolean) => void;
}

const CLAUSES = [
  "蒐集目的：本院依「個資法之特定目的及個人資料之類別」內「第69類-契約、類似契約或其他法律關係事務」與「第172類-其他公共部門（包括行政法人、政府捐助財團法人及其他公法人）執行相關業務」之目的，蒐集、處理及利用您的個人資料",
  "資料類別：自然人之姓名、職業、聯絡方式(包括但不限於電話號碼、E-mail、 居住或工作地址)、其他得以直接或間接方式識別您個人之資料",
  "利用期間：在前述蒐集目的之必要範圍內，以合理方式利用至蒐集目的消失為止",
  "利用地區：除蒐集之目的涉及國際業務或活動外，僅於中華民國領域內利用您的個人資料",
  "利用對象：本院、經濟部、本院為執行計畫目的授權之合作單位",
  "利用方式：在不違反蒐集目的前提下，以網際網路、電子郵件、書面、傳真及其他合法方式利用之",
  "當事人權利：您可依個人資料保護法第3條規定，就您的個人資料進行以下權利，如欲行使以下權利，請洽執行單位專線(02)2745-8199 #283或來信至 jessica_guo@tdri.org.tw、查詢、或請求閱覽、請求製給複製本、請求補充或更正、請求停止蒐集、處理或利用請求刪除您的個人資料。",
  "不提供個人資料之權益影響若您未提供正確資訊或拒提供個資，本院將無法為您提供本計畫之相關服務",
  "本院因業務需要而委託其他單位處理您的個人資料時，將善盡監督之責",
  "您已瞭解本線上同意書符合個人資料保護法及相關法規之要求，並同意本院留存本線上同意書電子紀錄以利查驗，再請按下送出",
] as const;

export function isConsentValid(accepted: boolean): boolean {
  return accepted;
}

export function ConsentNotice({ accepted, onChange }: ConsentNoticeProps) {
  return (
    <div>
      <div className="card">
        <h2 className="card__title">個資蒐集聲明告知</h2>
        <p>
          財團法人台灣設計研究院(以下簡稱本院)為執行經濟部「設計科技研發暨產研共創計畫」將蒐集、處理及利用您的個人資料，謹依據個人資料保護法(以下簡稱個資法)告知下列事項：
        </p>
        <ol className="consent-list">
          {CLAUSES.map((text, index) => (
            <li key={index}>
              <span className="consent-list__num">{index + 1}.</span>
              <span>{text}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="card">
        <label className="consent-check">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span>我已閱讀並同意上述個資蒐集聲明</span>
        </label>
      </div>
    </div>
  );
}
