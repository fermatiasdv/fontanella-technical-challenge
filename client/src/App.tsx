import SideNavBar      from '@/components/layout/SideNavBar';
import LawyersPage      from '@/pages/LawyersPage';
import ClientsPage      from '@/pages/ClientsPage';
import SchedulerPage    from '@/pages/SchedulerPage';
import AppointmentsPage from '@/pages/AppointmentsPage';

type PageKey = 'lawyers' | 'clients' | 'scheduler' | 'appointments';

const ACTIVE_PAGE = (new URLSearchParams(window.location.search).get('page') ?? 'lawyers') as PageKey;

export default function App() {
  return (
    <div className="app-root">
      <SideNavBar activePage={ACTIVE_PAGE} />
      {ACTIVE_PAGE === 'clients'      ? <ClientsPage />      :
       ACTIVE_PAGE === 'scheduler'    ? <SchedulerPage />    :
       ACTIVE_PAGE === 'appointments' ? <AppointmentsPage /> :
                                        <LawyersPage />}
    </div>
  );
}
