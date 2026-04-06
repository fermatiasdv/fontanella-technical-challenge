import { useState } from 'react';
import { useLawyers } from '../hooks/useLawyers';
import type { LawyerAPI, ActiveContext, ScheduleConflict, CreateLawyerDto } from '../types/lawyer';

import PageHeader from '../components/lawyers/PageHeader';
import LawyerTable from '../components/lawyers/LawyerTable';
import Pagination from '../components/lawyers/Pagination';
import CreateLawyerModal from '../components/lawyers/CreateLawyerModal';
import ActiveContextCard from '../components/sidebar/ActiveContextCard';
import ScheduleConflictCard from '../components/sidebar/ScheduleConflictCard';
import FAB from '../components/common/FAB';

// ─── Static sidebar mock (will be replaced once those endpoints exist) ────────
const MOCK_CONFLICT: ScheduleConflict = {
  lawyerName: 'Mariana Rodriguez',
  description: 'Potential hearing overlap.',
  date: 'Oct 24th',
};

function buildActiveContext(lawyer: LawyerAPI): ActiveContext {
  return {
    lawyer,
    title: 'Lead Trial Lawyer',     // TODO: derive from a roles endpoint
    credentials: 'Verified',         // TODO: derive from backend
    appointments: 0,                 // TODO: derive from appointments endpoint
    systemRole: 'Administrator',     // TODO: derive from backend
  };
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function TableSkeleton() {
  return (
    <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm animate-pulse">
      <div className="h-12 bg-surface-container-low" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-8 py-6 border-l-4 border-transparent">
          <div className="w-10 h-10 rounded-full bg-surface-container-high" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-48 bg-surface-container-high rounded" />
            <div className="h-2 w-24 bg-surface-container rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Error banner ─────────────────────────────────────────────────────────────
function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="bg-error-container text-on-error-container rounded-xl px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined">error</span>
        <span className="text-sm font-medium">{message}</span>
      </div>
      <button onClick={onRetry} className="text-xs font-bold underline hover:no-underline">
        Retry
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LawyerManagementHome() {
  const {
    lawyers,
    totalLawyers,
    loading,
    error,
    currentPage,
    totalPages,
    setCurrentPage,
    refetch,
    createLawyer,
    deleteLawyer,
  } = useLawyers();

  const [activeLawyerId, setActiveLawyerId] = useState<number | undefined>(undefined);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const selectedLawyer =
    lawyers.find((l) => l.id_lawyer === activeLawyerId) ?? lawyers[0];

  const handleCreateLawyer = async (dto: CreateLawyerDto) => {
    await createLawyer(dto);
    // The hook already updates the local list; modal closes itself on success
  };

  const handleDeleteLawyer = async (lawyer: LawyerAPI) => {
    if (!confirm(`Delete ${lawyer.full_name}? This action cannot be undone.`)) return;
    try {
      await deleteLawyer(lawyer.id_lawyer);
      if (lawyer.id_lawyer === activeLawyerId) setActiveLawyerId(undefined);
    } catch (err) {
      alert(`Error deleting lawyer: ${(err as Error).message}`);
    }
  };

  return (
    <>
      <main className="ml-64 p-10 min-h-[calc(100vh-4rem)]">
        <PageHeader onAddLawyer={() => setIsCreateModalOpen(true)} />

        <div className="grid grid-cols-12 gap-8">
          {/* ── Main area ─────────────────────────────────────────── */}
          <div className="col-span-12 lg:col-span-9 space-y-6">
            {error ? (
              <ErrorBanner message={error} onRetry={refetch} />
            ) : loading ? (
              <TableSkeleton />
            ) : (
              <LawyerTable
                lawyers={lawyers}
                activeLawyerId={activeLawyerId ?? lawyers[0]?.id_lawyer}
                onSelectLawyer={(l) => setActiveLawyerId(l.id_lawyer)}
                onEditLawyer={(l) => console.log('TODO: open Edit modal for', l.id_lawyer)}
                onDeleteLawyer={handleDeleteLawyer}
              />
            )}

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalLawyers}
              itemsPerPage={4}
              onPageChange={setCurrentPage}
            />
          </div>

          {/* ── Contextual sidebar ────────────────────────────────── */}
          <div className="col-span-12 lg:col-span-3 space-y-8">
            {selectedLawyer && (
              <ActiveContextCard
                context={buildActiveContext(selectedLawyer)}
                onViewProfile={() => console.log('TODO: navigate to profile', selectedLawyer.id_lawyer)}
                onRevoke={() => console.log('TODO: revoke access', selectedLawyer.id_lawyer)}
              />
            )}
            <ScheduleConflictCard
              conflict={MOCK_CONFLICT}
              onResolve={() => console.log('TODO: open conflict resolution')}
            />
          </div>
        </div>
      </main>

      <FAB
        onClick={() => setIsCreateModalOpen(true)}
        icon="add"
        label="New Lawyer"
      />

      <CreateLawyerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateLawyer}
      />
    </>
  );
}
