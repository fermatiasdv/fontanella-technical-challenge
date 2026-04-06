interface FABProps {
  onClick?: () => void;
  icon?: string;
  label?: string;
}

export default function FAB({ onClick, icon = 'add', label = 'New action' }: FABProps) {
  return (
    <div className="fixed bottom-10 right-10 z-50">
      <button
        onClick={onClick}
        aria-label={label}
        className="w-16 h-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-transform"
      >
        <span
          className="material-symbols-outlined text-3xl"
          style={{ fontVariationSettings: "'wght' 700" }}
        >
          {icon}
        </span>
      </button>
    </div>
  );
}
