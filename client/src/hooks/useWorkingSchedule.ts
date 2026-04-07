/**
 * useWorkingSchedule
 *
 * Manages the full ABMC lifecycle for T_WORKING_SCHEDULE:
 *  - Consulta : fetches all slots for the selected lawyer
 *  - Alta     : upserts a new slot (PUT with single entry)
 *  - Modificación: upserts an updated slot (PUT overwrites by day_of_week)
 *  - Baja     : deletes a slot by PK (DELETE /slot/:id)
 *
 * Also fetches the lawyer list so the UI can show a picker.
 */

import { useState, useEffect, useCallback } from 'react';
import { workingScheduleApi } from '../api/workingSchedule';
import type { WorkingScheduleAPI, WorkingScheduleSlotDto } from '../api/workingSchedule';
import { lawyersApi } from '../api/lawyers';
import type { LawyerAPI } from '../types/lawyer';

export type { WorkingScheduleAPI };

export interface UseWorkingScheduleResult {
  // ── Lawyer picker ───────────────────────────────────────────────────────────
  lawyers:         LawyerAPI[];
  lawyersLoading:  boolean;
  selectedLawyerId: number | null;
  selectLawyer:    (id: number) => void;

  // ── Schedule data ───────────────────────────────────────────────────────────
  slots:        WorkingScheduleAPI[];
  loading:      boolean;
  error:        string | null;

  // ── ABMC ────────────────────────────────────────────────────────────────────
  /** Alta / Modificación — upsert one slot for the selected lawyer */
  upsertSlot:  (dto: WorkingScheduleSlotDto) => Promise<void>;
  /** Baja — delete one slot by its PK */
  deleteSlot:  (id: number) => Promise<void>;
  /** Manual re-fetch */
  refetch:     () => void;
}

export function useWorkingSchedule(): UseWorkingScheduleResult {
  // ── Lawyer list ──────────────────────────────────────────────────────────────
  const [lawyers, setLawyers]               = useState<LawyerAPI[]>([]);
  const [lawyersLoading, setLawyersLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    lawyersApi
      .list(controller.signal)
      .then((data) => { if (!controller.signal.aborted) setLawyers(data); })
      .catch(() => {/* non-critical */})
      .finally(() => { if (!controller.signal.aborted) setLawyersLoading(false); });
    return () => controller.abort();
  }, []);

  // ── Selected lawyer + schedule ───────────────────────────────────────────────
  const [selectedLawyerId, setSelectedLawyerId] = useState<number | null>(null);
  const [slots, setSlots]                       = useState<WorkingScheduleAPI[]>([]);
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState<string | null>(null);
  const [fetchKey, setFetchKey]                 = useState(0);

  // Auto-select first lawyer once list loads
  useEffect(() => {
    if (!lawyersLoading && lawyers.length > 0 && selectedLawyerId === null) {
      setSelectedLawyerId(lawyers[0]!.id_lawyer);
    }
  }, [lawyersLoading, lawyers, selectedLawyerId]);

  // Fetch schedule whenever selected lawyer or fetchKey changes
  useEffect(() => {
    if (selectedLawyerId === null) return;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    workingScheduleApi
      .getByLawyer(selectedLawyerId, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setSlots(data); })
      .catch((err: Error) => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });

    return () => controller.abort();
  }, [selectedLawyerId, fetchKey]);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  const selectLawyer = useCallback((id: number) => {
    setSelectedLawyerId(id);
    setSlots([]);
    setFetchKey((k) => k + 1);
  }, []);

  // ── Mutations ────────────────────────────────────────────────────────────────

  /** Alta + Modificación: upsert one slot */
  const upsertSlot = useCallback(async (dto: WorkingScheduleSlotDto): Promise<void> => {
    if (selectedLawyerId === null) return;
    const updated = await workingScheduleApi.upsertSlots(selectedLawyerId, [dto]);
    // Merge into local state: replace matching day_of_week or append
    setSlots((prev) => {
      const withoutDay = prev.filter((s) => s.day_of_week !== dto.dayOfWeek);
      return [...withoutDay, ...updated].sort((a, b) =>
        a.day_of_week.localeCompare(b.day_of_week),
      );
    });
  }, [selectedLawyerId]);

  /** Baja: delete one slot */
  const deleteSlot = useCallback(async (id: number): Promise<void> => {
    await workingScheduleApi.deleteSlot(id);
    setSlots((prev) => prev.filter((s) => s.id_working_schedule !== id));
  }, []);

  return {
    lawyers,
    lawyersLoading,
    selectedLawyerId,
    selectLawyer,
    slots,
    loading,
    error,
    upsertSlot,
    deleteSlot,
    refetch,
  };
}
