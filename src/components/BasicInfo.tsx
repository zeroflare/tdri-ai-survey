export interface UserProfile {
  name: string;
  company: string;
  title: string;
  email: string;
}

export const EMPTY_PROFILE: UserProfile = {
  name: "",
  company: "",
  title: "",
  email: "",
};

export function isProfileValid(profile: UserProfile): boolean {
  const email = profile.email.trim();
  if (email === "") return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

interface BasicInfoProps {
  profile: UserProfile;
  onChange: (field: keyof UserProfile, value: string) => void;
}

const FIELDS: { key: keyof UserProfile; label: string; type: string; placeholder: string }[] = [
  { key: "name", label: "姓名", type: "text", placeholder: "請輸入您的姓名" },
  { key: "company", label: "公司", type: "text", placeholder: "請輸入公司或工作室名稱" },
  { key: "title", label: "職稱", type: "text", placeholder: "例如：設計師、專案經理、負責人" },
  { key: "email", label: "信箱", type: "email", placeholder: "name@example.com" },
];

export function BasicInfo({ profile, onChange }: BasicInfoProps) {
  return (
    <div className="card">
      <h2 className="card__title">基本資料</h2>
      <p className="card__subtitle">以下資料皆為選填，若有填寫有助於辨識填答者與留存紀錄。</p>
      <form className="profile-form" onSubmit={(e) => e.preventDefault()}>
        {FIELDS.map(({ key, label, type, placeholder }) => (
          <div className="profile-form__field" key={key}>
            <label className="profile-form__label" htmlFor={`profile-${key}`}>
              {label}
            </label>
            <input
              id={`profile-${key}`}
              className="profile-form__input"
              type={type}
              value={profile[key]}
              placeholder={placeholder}
              autoComplete={key === "email" ? "email" : key === "name" ? "name" : "organization"}
              onChange={(e) => onChange(key, e.target.value)}
            />
          </div>
        ))}
      </form>
    </div>
  );
}
