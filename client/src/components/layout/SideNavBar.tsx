type PageKey = 'lawyers' | 'clients' | 'scheduler' | 'appointments';

interface NavItem {
  icon:    string;
  label:   string;
  pageKey: PageKey;
}

const navItems: NavItem[] = [
  { icon: 'gavel',          label: 'Practitioners', pageKey: 'lawyers'      },
  { icon: 'event',          label: 'Appointments',  pageKey: 'appointments' },
  { icon: 'calendar_month', label: 'Scheduler',     pageKey: 'scheduler'    },
  { icon: 'group',          label: 'Clients',       pageKey: 'clients'      },
];

interface SideNavBarProps {
  activePage?: PageKey;
}

export default function SideNavBar({ activePage = 'lawyers' }: SideNavBarProps) {
  return (
    <nav className="sidebar">
      {/* Logo */}
      <div className="sidebar__logo">
        FONTANELLA SRL
      </div>

      {/* Navigation Links */}
      <div style={{ flexGrow: 1 }}>
        {navItems.map((item) => {
          const isActive = item.pageKey === activePage;
          return (
            <a
              key={item.label}
              href={`?page=${item.pageKey}`}
              className={`sidebar__nav-link${isActive ? ' sidebar__nav-link--active' : ''}`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.label}</span>
            </a>
          );
        })}
      </div>

      {/* New Appointment CTA */}
      <div style={{ marginTop: 'auto' }}>
        <a href="?page=appointments" className="sidebar__cta">
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span>
          New Appointment
        </a>
      </div>
    </nav>
  );
}
