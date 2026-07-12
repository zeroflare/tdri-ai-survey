import type { GlossaryTerm } from "../data/survey";

interface GlossaryNotesProps {
  terms: GlossaryTerm[];
}

export function GlossaryNotes({ terms }: GlossaryNotesProps) {
  if (terms.length === 0) return null;

  return (
    <div className="glossary-notes">
      <p className="glossary-notes__label">名詞說明</p>
      <dl className="glossary-notes__list">
        {terms.map((term) => (
          <div key={term.term} className="glossary-notes__item">
            <dt>{term.term}</dt>
            <dd>{term.definition}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
