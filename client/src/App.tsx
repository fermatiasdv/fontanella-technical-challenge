import SideNavBar from './components/layout/SideNavBar';
import TopAppBar from './components/layout/TopAppBar';
import LawyerManagementHome from './pages/LawyerManagementHome';

export default function App() {
  return (
    <div className="bg-background text-on-background min-h-screen">
      <SideNavBar />
      <TopAppBar />
      <LawyerManagementHome />
    </div>
  );
}
