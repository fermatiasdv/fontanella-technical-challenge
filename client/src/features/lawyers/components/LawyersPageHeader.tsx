interface LawyersPageHeaderProps {
  onAddLawyer?: () => void;
}

export function LawyersPageHeader({ onAddLawyer }: LawyersPageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <span className="eyebrow">Management Portal</span>
        <h2 className="page-header__title">Firm Practitioners</h2>
        <p className="page-header__subtitle">
          Manage your legal team's digital credentials and system access. Maintain precision in
          jurisdictional assignments.
        </p>
      </div>
      <button onClick={onAddLawyer} className="btn-primary">
        <span className="material-symbols-outlined">person_add</span>
        Add New Lawyer
      </button>
    </div>
  );
}
