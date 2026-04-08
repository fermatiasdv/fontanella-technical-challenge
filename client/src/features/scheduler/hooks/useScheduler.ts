/**
 * useScheduler — composite hook that owns the selected lawyer state
 * and composes useWorkingSchedule + useLawyerVacations + useLawyerList.
 */

import { useState, useEffect, useCallback } from 'react';
import { useLawyerList }      from '@/shared/hooks/useLawyerList';
import { useWorkingSchedule } from '@/features/scheduler/hooks/useWorkingSchedule';
import { useLawyerVacations } from '@/features/scheduler/hooks/useLawyerVacations';
import type { WorkingScheduleSlotDto } from '@/services/workingSchedule.service';

export function useScheduler() {
  const { lawyers, loading: lawyersLoading } = useLawyerList();

  const [selectedLawyerId, setSelectedLawyerId] = useState<number | null>(null);

  // Auto-select the first lawyer once the list loads
  useEffect(() => {
    if (!lawyersLoading && lawyers.length > 0 && selectedLawyerId === null) {
      setSelectedLawyerId(lawyers[0]!.id_lawyer);
    }
  }, [lawyersLoading, lawyers, selectedLawyerId]);

  const selectLawyer = useCallback((id: number) => {
    setSelectedLawyerId(id);
  }, []);

  const { slots, loading, error, upsertSlot, deleteSlot, refetch } =
    useWorkingSchedule(selectedLawyerId);

  const vacations = useLawyerVacations(selectedLawyerId);

  const handleUpsert = useCallback(
    async (dto: WorkingScheduleSlotDto) => upsertSlot(dto),
    [upsertSlot],
  );

  return {
    // lawyer picker
    lawyers,
    lawyersLoading,
    selectedLawyerId,
    selectLawyer,
    // schedule
    slots,
    loading,
    error,
    upsertSlot: handleUpsert,
    deleteSlot,
    refetch,
    // vacations
    vacations,
  };
}
