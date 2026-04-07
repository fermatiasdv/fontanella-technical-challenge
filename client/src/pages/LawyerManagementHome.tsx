import { useState } from 'react';
import { useLawyers } from '../hooks/useLawyers';
import type { LawyerAPI, ActiveContext, CreateLawyerDto } from '../types/lawyer';

import PageHeader from '../components/lawyers/PageHeader';
import LawyerTable from '../components/lawyers/LawyerTable';
import Pagination from '../components/lawyers/Pagination';
import CreateLawyerModal from '../components/lawyers/CreateLawyerModal';
import ActiveContextCard from '../components/sidebar/ActiveContextCard';

function buildActiveContext(lawyer: LawyerAPI): ActiveContext {
  return {
    lawyer,
    appointments: 0,                 // TODO: derive from appointments endpoint
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
    updateLawyer,
    deleteLawyer,
  } = useLawyers();

  const [activeLawyerId, setActiveLawyerId] = useState<number | undefined>(undefined);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLawyer, setEditingLawyer]         = useState<LawyerAPI | null>(null);

  const selectedLawyer =
    lawyers.find((l) => l.id_lawyer === activeLawyerId) ?? lawyers[0];

  const handleCreateLawyer = async (dto: CreateLawyerDto) => {
    await createLawyer(dto);
  };

  const handleEditLawyer = async (dto: CreateLawyerDto) => {
    if (!editingLawyer) return;
    await updateLawyer(editingLawyer.id_lawyer, dto);
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
                onEditLawyer={(l) => setEditingLawyer(l)}
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
          </div>
        </div>
      </main>

      {/* Create modal */}
      <CreateLawyerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateLawyer}
      />

      {/* Edit modal — reuses the same component, pre-filled */}
      <CreateLawyerModal
        isOpen={editingLawyer !== null}
        onClose={() => setEditingLawyer(null)}
        onSubmit={handleEditLawyer}
        initialLawyer={editingLawyer ?? undefined}
      />
    </>
  );
}
