interface PageHeaderProps {
  onAddLawyer?: () => void;
}

export default function PageHeader({ onAddLawyer }: PageHeaderProps) {
  return (
    <div className="flex justify-between items-end mb-12">
      <div className="max-w-2xl">
        <span className="all-caps-label text-primary font-bold mb-2 block">
          Management Portal
        </span>
        <h2 className="editorial-headline text-on-surface text-4xl font-extrabold mb-4">
          Firm Practitioners
        </h2>
        <p className="text-on-surface-variant text-lg leading-relaxed">
          Manage your legal team's digital credentials and system access. Maintain precision in
          jurisdictional assignments.
        </p>
      </div>

      <button
        onClick={onAddLawyer}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary-container text-white rounded-lg font-headline font-bold text-sm shadow-md transition-all active:scale-95"
      >
        <span className="material-symbols-outlined text-lg">person_add</span>
        Add New Lawyer
      </button>
    </div>
  );
}
