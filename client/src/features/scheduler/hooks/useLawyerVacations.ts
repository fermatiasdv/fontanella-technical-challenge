/**
 * useLawyerVacations — data-only hook.
 *
 * Fetches vacation periods for a given lawyer ID.
 */

import { useState, useEffect } from 'react';
import { vacationsService } from '@/services/vacations.service';
import type { VacationAPI } from '@/services/vacations.service';

export type { VacationAPI };

export function useLawyerVacations(lawyerId: number | null): VacationAPI[] {
  const [vacations, setVacations] = useState<VacationAPI[]>([]);

  useEffect(() => {
    if (lawyerId === null) { setVacations([]); return; }
    const controller = new AbortController();
    vacationsService
      .getByLawyer(lawyerId, controller.signal)
      .then((data) => { if (!controller.signal.aborted) setVacations(data); })
      .catch(() => { /* non-critical */ });
    return () => controller.abort();
  }, [lawyerId]);

  return vacations;
}
