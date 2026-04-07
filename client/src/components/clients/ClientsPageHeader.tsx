interface ClientsPageHeaderProps {
  onAddClient?: () => void;
}

export default function ClientsPageHeader({ onAddClient }: ClientsPageHeaderProps) {
  return (
    <div className="clients-header">
      <div>
        <h2 className="clients-header__title">Clients.</h2>
        <p className="clients-header__subtitle">
          Manage your firm's professional relationships and upcoming litigation schedules.
        </p>
      </div>

      <button onClick={onAddClient} className="btn-primary">
        <span className="material-symbols-outlined">person_add</span>
        Add Client
      </button>
    </div>
  );
}
