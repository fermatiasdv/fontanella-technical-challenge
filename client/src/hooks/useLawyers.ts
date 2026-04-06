/**
 * useLawyers — central hook for the Lawyer Management screen.
 *
 * Responsibilities:
 *  - Fetches the full list from the backend on mount.
 *  - Exposes loading / error states.
 *  - Handles client-side pagination (backend has no pagination endpoint yet).
 *  - Exposes create / update / remove mutations that optimistically update
 *    the local list without a full refetch.
 */

import { useState, useEffect, useCallback } from 'react';
import { lawyersApi } from '../api/lawyers';
import type { LawyerAPI, CreateLawyerDto, UpdateLawyerDto } from '../types/lawyer';

const PAGE_SIZE = 4;

export interface UseLawyersResult {
  /** Lawyers for the current page */
  lawyers: LawyerAPI[];
  /** Total items across all pages */
  totalLawyers: number;
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  /** Re-fetch the full list from the server */
  refetch: () => void;
  /** CRUD mutations — each returns a Promise so callers can await */
  createLawyer: (dto: CreateLawyerDto) => Promise<void>;
  updateLawyer: (id: number, dto: UpdateLawyerDto) => Promise<void>;
  deleteLawyer: (id: number) => Promise<void>;
}

export function useLawyers(): UseLawyersResult {
  const [allLawyers, setAllLawyers] = useState<LawyerAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  // A counter bump triggers a re-fetch without changing the dep array structure
  const [fetchKey, setFetchKey] = useState(0);

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    lawyersApi
      .list(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setAllLawyers(data);
          setCurrentPage(1); // reset to first page on every fetch
        }
      })
      .catch((err: Error) => {
        if (!controller.signal.aborted) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [fetchKey]);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  // ─── Pagination (client-side) ─────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(allLawyers.length / PAGE_SIZE));

  const safePage = Math.min(currentPage, totalPages);
  const lawyers = allLawyers.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // ─── Mutations ────────────────────────────────────────────────────────────
  const createLawyer = useCallback(async (dto: CreateLawyerDto) => {
    const created = await lawyersApi.create(dto);
    setAllLawyers((prev) =>
      [...prev, created].sort((a, b) => a.full_name.localeCompare(b.full_name)),
    );
  }, []);

  const updateLawyer = useCallback(async (id: number, dto: UpdateLawyerDto) => {
    const updated = await lawyersApi.update(id, dto);
    setAllLawyers((prev) => prev.map((l) => (l.id_lawyer === id ? updated : l)));
  }, []);

  const deleteLawyer = useCallback(async (id: number) => {
    await lawyersApi.remove(id);
    setAllLawyers((prev) => {
      const next = prev.filter((l) => l.id_lawyer !== id);
      // If the current page becomes empty after deletion, go one page back
      const newTotalPages = Math.max(1, Math.ceil(next.length / PAGE_SIZE));
      setCurrentPage((p) => Math.min(p, newTotalPages));
      return next;
    });
  }, []);

  return {
    lawyers,
    totalLawyers: allLawyers.length,
    loading,
    error,
    currentPage: safePage,
    totalPages,
    setCurrentPage,
    refetch,
    createLawyer,
    updateLawyer,
    deleteLawyer,
  };
}
