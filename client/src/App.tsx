import SideNavBar from './components/layout/SideNavBar';
import TopAppBar from './components/layout/TopAppBar';
import LawyerManagementHome from './pages/LawyerManagementHome';
import ClientsPage from './pages/ClientsPage';

// TODO: replace with a proper router (e.g. react-router-dom) once navigation is wired up
const ACTIVE_PAGE = (new URLSearchParams(window.location.search).get('page') ?? 'lawyers') as
  | 'lawyers'
  | 'clients';

export default function App() {
  return (
    <div className="bg-background text-on-background min-h-screen">
      <SideNavBar />
      <TopAppBar />
      {ACTIVE_PAGE === 'clients' ? <ClientsPage /> : <LawyerManagementHome />}
    </div>
  );
}
