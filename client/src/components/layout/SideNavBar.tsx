interface NavItem {
  icon: string;
  label: string;
  href: string;
  active?: boolean;
}

const navItems: NavItem[] = [
  { icon: 'home', label: 'Home', href: '#', active: true },
  { icon: 'calendar_today', label: 'Dashboard', href: '#' },
  { icon: 'group', label: 'Clients', href: '#' },
];

export default function SideNavBar() {
  return (
    <nav className="fixed left-0 top-0 bottom-0 flex flex-col py-8 px-6 bg-slate-50 h-screen w-64 z-50">
      {/* Logo */}
      <div className="mb-10 px-4">
        <h1 className="font-headline font-bold text-slate-900 text-lg tracking-tighter">
          FONTANELLA SRL
        </h1>
        
      </div>

      {/* Navigation Links */}
      <div className="space-y-2 flex-grow">
        {navItems.map((item) =>
          item.active ? (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 py-3 text-blue-700 font-bold border-l-2 border-blue-600 pl-4 transition-all"
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-headline text-sm tracking-tight">{item.label}</span>
            </a>
          ) : (
            <a
              key={item.label}
              href={item.href}
              className="flex items-center gap-3 py-3 text-slate-500 hover:text-slate-900 pl-4 transition-colors hover:bg-slate-100"
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span className="font-headline text-sm tracking-tight">{item.label}</span>
            </a>
          )
        )}
      </div>

      {/* New Appointment CTA */}
      <div className="mt-auto px-4">
        <button className="w-full py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-lg font-headline text-sm font-bold shadow-sm transition-transform active:scale-95">
          New Appointment
        </button>
      </div>
    </nav>
  );
}
