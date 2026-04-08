import SideNavBar from './components/layout/SideNavBar';
import LawyerManagementHome from './pages/LawyerManagementHome';
import ClientsPage from './pages/ClientsPage';
import SchedulerPage from './pages/SchedulerPage';
import AppointmentsPage from './pages/AppointmentsPage';

// TODO: replace with a proper router (e.g. react-router-dom) once navigation is wired up
const ACTIVE_PAGE = (new URLSearchParams(window.location.search).get('page') ?? 'lawyers') as
  | 'lawyers'
  | 'clients'
  | 'scheduler'
  | 'appointments';

export default function App() {
  return (
    <div className="app-root">
      <SideNavBar activePage={ACTIVE_PAGE} />
      {ACTIVE_PAGE === 'clients'      ? <ClientsPage />          :
       ACTIVE_PAGE === 'scheduler'    ? <SchedulerPage />         :
       ACTIVE_PAGE === 'appointments' ? <AppointmentsPage />      :
                                        <LawyerManagementHome />}
    </div>
  );
}
