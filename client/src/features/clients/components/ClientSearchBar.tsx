interface ClientSearchBarProps { value: string; onChange: (value: string) => void; }
export function ClientSearchBar({ value, onChange }: ClientSearchBarProps) {
  return (
    <div className="search-bar">
      <span className="search-bar__icon material-symbols-outlined">search</span>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Search by trade name, company ID, or location..." className="search-bar__input" />
      {value && <button onClick={() => onChange('')} className="search-bar__clear" aria-label="Clear search"><span className="material-symbols-outlined">close</span></button>}
    </div>
  );
}
