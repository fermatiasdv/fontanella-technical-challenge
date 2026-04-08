export interface LawyerSelectorProps {
  lawyers:    { id_lawyer: number; full_name: string }[];
  selectedId: number | null;
  onSelect:   (id: number) => void;
  loading:    boolean;
}

export function LawyerSelector({ lawyers, selectedId, onSelect, loading }: LawyerSelectorProps) {
  return (
    <div className="lawyer-selector">
      <span className="lawyer-selector__icon material-symbols-outlined">gavel</span>
      <div className="lawyer-selector__wrap">
        {loading ? (
          <div className="lawyer-selector__skeleton" />
        ) : (
          <select
            value={selectedId ?? ''}
            onChange={(e) => onSelect(Number(e.target.value))}
            className="lawyer-selector__select"
          >
            {lawyers.map((l) => (
              <option key={l.id_lawyer} value={l.id_lawyer}>{l.full_name}</option>
            ))}
          </select>
        )}
        <span className="lawyer-selector__chevron material-symbols-outlined">expand_more</span>
      </div>
    </div>
  );
}
