/**
 * useWorkingSchedule — data-only hook.
 *
 * Receives the selected lawyerId as a parameter (no lawyer list management).
 * Responsible for fetching, upserting, and deleting schedule slots.
 */

import { useState, useEffect, useCallback } from 'react';
import { workingScheduleService } from '@/services/workingSchedule.service';
import type { WorkingScheduleAPI, WorkingScheduleSlotDto } from '@/services/workingSchedule.service';

export type { WorkingScheduleAPI };

export interface UseWorkingScheduleResult {
  slots:      WorkingScheduleAPI[];
  loading:    boolean;
  error:      string | null;
  upsertSlot: (dto: WorkingScheduleSlotDto) => Promise<void>;
  deleteSlot: (id: number) => Promise<void>;
  refetch:    () => void;
}

export function useWorkingSchedule(lawyerId: number | null): UseWorkingScheduleResult {
  const [slots,    setSlots]    = useState<WorkingScheduleAPI[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  useEffect(() => {
    if (lawyerId === null) { setSlots([]); return; }
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    workingScheduleService
      .getByLawyer(lawyerId, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setSlots(data); })
      .catch((err: Error) => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });

    return () => controller.abort();
  }, [lawyerId, fetchKey]);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  const upsertSlot = useCallback(async (dto: WorkingScheduleSlotDto): Promise<void> => {
    if (lawyerId === null) return;
    const updated = await workingScheduleService.upsertSlots(lawyerId, [dto]);
    setSlots((prev) => {
      const withoutDay = prev.filter((s) => s.day_of_week !== dto.dayOfWeek);
      return [...withoutDay, ...updated].sort((a, b) =>
        a.day_of_week.localeCompare(b.day_of_week),
      );
    });
  }, [lawyerId]);

  const deleteSlot = useCallback(async (id: number): Promise<void> => {
    await workingScheduleService.deleteSlot(id);
    setSlots((prev) => prev.filter((s) => s.id_working_schedule !== id));
  }, []);

  return { slots, loading, error, upsertSlot, deleteSlot, refetch };
}
