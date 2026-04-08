import { useState } from 'react';
import { useLawyers } from '@/features/lawyers/hooks/useLawyers';
import { createLawyerWithDetails, updateLawyerWithDetails } from '@/features/lawyers/services/lawyerService';
import { LawyersPageHeader } from '@/features/lawyers/components/LawyersPageHeader';
import { LawyerTable } from '@/features/lawyers/components/LawyerTable';
import { CreateLawyerModal } from '@/features/lawyers/components/CreateLawyerModal';
import { ErrorBanner } from '@/shared/components/ErrorBanner';
import { TableSkeleton } from '@/shared/components/TableSkeleton';
import { Pagination } from '@/shared/components/Pagination';
import type { LawyerAPI } from '@/features/lawyers/types/lawyer.types';

export function LawyerManagement() {
  const {
    lawyers, totalLawyers, loading, error,
    currentPage, totalPages, setCurrentPage,
    refetch, deleteLawyer,
  } = useLawyers();

  const [activeLawyerId,   setActiveLawyerId]   = useState<number | undefined>(undefined);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingLawyer,    setEditingLawyer]    = useState<LawyerAPI | null>(null);

  const handleCreateFull: React.ComponentProps<typeof CreateLawyerModal>['onSubmit'] = async (
    dto, contacts, schedule, vacations,
  ) => {
    await createLawyerWithDetails(dto, contacts, schedule, vacations);
    refetch();
  };

  const handleEditFull: React.ComponentProps<typeof CreateLawyerModal>['onSubmit'] = async (
    dto, contacts, schedule, vacations,
  ) => {
    if (!editingLawyer) return;
    await updateLawyerWithDetails(editingLawyer.id_lawyer, dto, contacts, schedule, vacations);
    refetch();
  };

  const handleDelete = async (lawyer: LawyerAPI) => {
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
      <main className="page">
        <LawyersPageHeader onAddLawyer={() => setIsCreateModalOpen(true)} />

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
            onDeleteLawyer={handleDelete}
          />
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalLawyers}
          itemsPerPage={4}
          onPageChange={setCurrentPage}
        />
      </main>

      <CreateLawyerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateFull}
      />

      <CreateLawyerModal
        isOpen={editingLawyer !== null}
        onClose={() => setEditingLawyer(null)}
        onSubmit={handleEditFull}
        initialLawyer={editingLawyer ?? undefined}
      />
    </>
  );
}
