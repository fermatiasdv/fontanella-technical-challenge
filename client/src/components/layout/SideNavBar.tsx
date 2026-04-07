type PageKey = 'lawyers' | 'clients' | 'scheduler';

interface NavItem {
  icon:    string;
  label:   string;
  pageKey: PageKey;
}

const navItems: NavItem[] = [
  { icon: 'gavel',          label: 'Practitioners', pageKey: 'lawyers'   },
  { icon: 'calendar_month', label: 'Scheduler',     pageKey: 'scheduler' },
  { icon: 'group',          label: 'Clients',       pageKey: 'clients'   },
];

interface SideNavBarProps {
  activePage?: PageKey;
}

export default function SideNavBar({ activePage = 'lawyers' }: SideNavBarProps) {
  return (
    <nav className="fixed left-0 top-0 bottom-0 flex flex-col py-8 px-6 bg-slate-50 h-screen w-64 z-50">
      {/* Logo */}
      <div className="mb-10 px-4">
        <h1 className="font-headline font-bold text-slate-900 text-lg tracking-tighter">
          FONTANELLA SRL
        </h1>
      </div>

      {/* Navigation Links */}
      <div className="space-y-1 flex-grow">
        {navItems.map((item) => {
          const isActive = item.pageKey === activePage;
          return isActive ? (
            <a
              key={item.label}
              href={`?page=${item.pageKey}`}
              className="flex items-center gap-3 py-3 text-blue-700 font-bold border-l-2 border-blue-600 pl-4 transition-all"
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-headline text-sm tracking-tight">{item.label}</span>
            </a>
          ) : (
            <a
              key={item.label}
              href={`?page=${item.pageKey}`}
              className="flex items-center gap-3 py-3 text-slate-500 hover:text-slate-900 pl-4 transition-colors hover:bg-slate-100 rounded-r-lg"
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-headline text-sm tracking-tight">{item.label}</span>
            </a>
          );
        })}
      </div>

      {/* New Appointment CTA */}
      <div className="mt-auto px-4">
        <a
          href="?page=scheduler"
          className="w-full py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-lg font-headline text-sm font-bold shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          New Appointment
        </a>
      </div>
    </nav>
  );
}
