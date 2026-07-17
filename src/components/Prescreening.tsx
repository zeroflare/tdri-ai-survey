import type { PrescreenAnswer } from "../data/survey";
import { getGlossaryMatches, getSurveyData } from "../data/survey";
import { GlossaryNotes } from "./GlossaryNotes";

interface PrescreeningProps {
  answers: Record<string, PrescreenAnswer>;
  onChange: (id: string, value: boolean) => void;
}

export function Prescreening({ answers, onChange }: PrescreeningProps) {
  const prescreenQuestions = getSurveyData().prescreenQuestions;

  return (
    <div>
      <div className="card">
        <h2 className="card__title">六、前導分流</h2>
        <p>
          請於作答前先回答下列六題，據以判斷需填寫哪些題組。選「否」的題組不會出現在問卷中，也不計入本次滿分。
        </p>
      </div>

      {prescreenQuestions.map((q) => (
        <div key={q.id} className="prescreen-item">
          <div className="prescreen-item__header">
            <span className="prescreen-item__id">分流-{q.id}</span>
            <div>
              <div className="prescreen-item__text">{q.text}</div>
              {q.moduleLabel && (
                <div className="prescreen-item__module">包含回答{q.moduleLabel}</div>
              )}
              <GlossaryNotes terms={getGlossaryMatches(q.text)} />
            </div>
          </div>
          <div className="radio-group">
            <div className="radio-option">
              <input
                type="radio"
                id={`prescreen-${q.id}-yes`}
                name={`prescreen-${q.id}`}
                checked={answers[q.id] === true}
                onChange={() => onChange(q.id, true)}
              />
              <label htmlFor={`prescreen-${q.id}-yes`}>是</label>
            </div>
            <div className="radio-option">
              <input
                type="radio"
                id={`prescreen-${q.id}-no`}
                name={`prescreen-${q.id}`}
                checked={answers[q.id] === false}
                onChange={() => onChange(q.id, false)}
              />
              <label htmlFor={`prescreen-${q.id}-no`}>否</label>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function isPrescreenComplete(answers: Record<string, PrescreenAnswer>): boolean {
  return getSurveyData().prescreenQuestions.every(
    (q) => answers[q.id] !== null && answers[q.id] !== undefined,
  );
}
