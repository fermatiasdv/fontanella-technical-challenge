export default function TopAppBar() {
  return (
    <header className="flex justify-between items-center px-10 ml-64 sticky top-0 z-40 w-[calc(100%-16rem)] h-16 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="flex items-center gap-6 flex-grow">
        {/* App Title */}
        <span className="font-headline font-black text-slate-900 tracking-wide text-sm">
          Legal Scheduler
        </span>

        {/* Search Bar */}
        <div className="relative w-96 ml-4">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-sm">
            search
          </span>
          <input
            className="w-full bg-surface-container-high border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
            placeholder="Search lawyers by name or DNI..."
            type="text"
          />
        </div>
      </div>

      {/* Action Icons */}
      <div className="flex items-center gap-6">
        <button className="text-slate-500 hover:text-blue-700 transition-colors">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="text-slate-500 hover:text-blue-700 transition-colors">
          <span className="material-symbols-outlined">help_outline</span>
        </button>
        <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center overflow-hidden">
          <span className="material-symbols-outlined text-on-surface-variant">person</span>
        </div>
      </div>
    </header>
  );
}
