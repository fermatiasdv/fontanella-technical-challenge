import { useState } from 'react';
import { useLawyers } from '../hooks/useLawyers';
import { contactApi } from '../api/contact';
import { workingScheduleApi } from '../api/workingSchedule';
import { vacationsApi } from '../api/vacations';
import type { LawyerAPI, CreateLawyerDto, ScheduleSlotInput, VacationInput } from '../types/lawyer';
import type { ContactMethodInputI } from '../components/common/ContactMethodsSection';

import PageHeader from '../components/lawyers/PageHeader';
import LawyerTable from '../components/lawyers/LawyerTable';
import Pagination from '../components/lawyers/Pagination';
import CreateLawyerModal from '../components/lawyers/CreateLawyerModal';

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function TableSkeleton() {
  return <div className="table-skeleton anim-pulse" />;
}

// ─── Error banner ─────────────────────────────────────────────────────────────
function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="error-banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span className="material-symbols-outlined">error</span>
        <span>{message}</span>
      </div>
      <button onClick={onRetry} style={{ fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
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

  const handleCreateLawyer = async (
    dto:       CreateLawyerDto,
    contacts:  ContactMethodInputI[],
    schedule:  ScheduleSlotInput[],
    vacations: VacationInput[],
  ) => {
    // 1. Create the lawyer record and get its generated ID
    const created = await createLawyer(dto);

    // 2. Save contact methods
    if (contacts.length > 0) {
      await Promise.all(
        contacts.map((c, idx) =>
          contactApi.create({
            idLawyer:   created.id_lawyer,
            methodType: c.method_type,
            value:      c.value,
            isDefault:  idx === 0,
          }),
        ),
      );
    }

    // 3. Save working schedule (T_WORKING_SCHEDULE)
    if (schedule.length > 0) {
      await workingScheduleApi.upsertSlots(created.id_lawyer, schedule);
    }

    // 4. Save vacation periods (T_VACATIONS)
    if (vacations.length > 0) {
      await Promise.all(
        vacations.map((v) =>
          vacationsApi.addVacation(created.id_lawyer, {
            startDate: v.startDate,
            endDate:   v.endDate,
          }),
        ),
      );
    }
  };

  const handleEditLawyer = async (
    dto:       CreateLawyerDto,
    contacts:  ContactMethodInputI[],
    schedule:  ScheduleSlotInput[],
    vacations: VacationInput[],
  ) => {
    if (!editingLawyer) return;
    const id = editingLawyer.id_lawyer;

    // 1. Update basic lawyer data
    await updateLawyer(id, dto);

    // 2. Update contacts in-place to avoid FK violations with existing appointments.
    //    Strategy: match by method_type → update existing | create new | try-delete removed.
    const existingContacts = await contactApi.listByLawyer(id);

    // Update or create each enabled contact
    await Promise.all(
      contacts.map((c, idx) => {
        const match = existingContacts.find((e) => e.method_type === c.method_type);
        if (match) {
          return contactApi.update(match.id_contact, { value: c.value, isDefault: idx === 0 });
        }
        return contactApi.create({ idLawyer: id, methodType: c.method_type, value: c.value, isDefault: idx === 0 });
      }),
    );

    // Remove contacts that were disabled — silently ignore FK errors
    // (a contact referenced by an existing appointment cannot be deleted)
    const newMethodTypes = new Set(contacts.map((c) => c.method_type));
    const toDelete = existingContacts.filter((e) => !newMethodTypes.has(e.method_type));
    await Promise.allSettled(toDelete.map((c) => contactApi.remove(c.id_contact)));

    // 3. Replace working schedule (delete all → upsert active days)
    const existingSlots = await workingScheduleApi.getByLawyer(id);
    await Promise.all(existingSlots.map((s) => workingScheduleApi.deleteSlot(s.id_working_schedule)));
    if (schedule.length > 0) {
      await workingScheduleApi.upsertSlots(id, schedule);
    }

    // 4. Replace vacations (delete all → re-create)
    const existingVacs = await vacationsApi.getByLawyer(id);
    await Promise.all(existingVacs.map((v) => vacationsApi.removeVacation(v.id_vacation)));
    await Promise.all(
      vacations.map((v) =>
        vacationsApi.addVacation(id, { startDate: v.startDate, endDate: v.endDate }),
      ),
    );
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
      <main className="page">
        <PageHeader onAddLawyer={() => setIsCreateModalOpen(true)} />

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
      </main>

      <CreateLawyerModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateLawyer}
      />

      <CreateLawyerModal
        isOpen={editingLawyer !== null}
        onClose={() => setEditingLawyer(null)}
        onSubmit={handleEditLawyer}
        initialLawyer={editingLawyer ?? undefined}
      />
    </>
  );
}
