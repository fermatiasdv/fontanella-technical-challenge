interface ClientSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function ClientSearchBar({ value, onChange }: ClientSearchBarProps) {
  return (
    <div className="relative mb-8">
      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">
        search
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by trade name, company ID, or location..."
        className="w-full bg-surface-container-low border-none rounded-xl pl-12 pr-4 py-4 text-sm placeholder:text-outline-variant text-on-surface focus:ring-0 focus:outline-none transition-all"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface transition-colors"
          aria-label="Clear search"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      )}
    </div>
  );
}
