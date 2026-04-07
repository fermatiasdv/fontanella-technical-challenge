interface ClientsPageHeaderProps {
  onAddClient?: () => void;
}

export default function ClientsPageHeader({ onAddClient }: ClientsPageHeaderProps) {
  return (
    <div className="flex justify-between items-end mb-10">
      <div>
        <h2 className="font-headline font-extrabold text-[3.5rem] leading-none tracking-tighter text-on-surface">
          Clients.
        </h2>
        <p className="text-on-surface-variant font-body mt-2 max-w-md">
          Manage your firm's professional relationships and upcoming litigation schedules.
        </p>
      </div>

      <button
        onClick={onAddClient}
        className="flex items-center gap-2 px-6 py-3 bg-on-primary-fixed text-white rounded-xl font-headline font-bold text-sm shadow-lg shadow-blue-900/5 transition-all active:scale-95"
      >
        <span className="material-symbols-outlined text-[18px]">person_add</span>
        Add Client
      </button>
    </div>
  );
}
