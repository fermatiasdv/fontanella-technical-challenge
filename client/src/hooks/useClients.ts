/**
 * useClients — central hook for the Clients screen.
 *
 * Responsibilities:
 *  - Fetches the full list from the backend on mount.
 *  - Exposes loading / error states.
 *  - Handles client-side pagination and search filtering.
 *  - Exposes create / update / remove mutations that optimistically update
 *    the local list without a full refetch.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { clientsApi } from '../api/clients';
import type { ClientAPI, CreateClientDto, UpdateClientDto } from '../types/client';

const PAGE_SIZE = 4;

export interface UseClientsResult {
  /** Clients for the current page (already filtered by search) */
  clients: ClientAPI[];
  /** Total items matching the current search */
  totalClients: number;
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  search: string;
  setSearch: (q: string) => void;
  /** Re-fetch the full list from the server */
  refetch: () => void;
  /** CRUD mutations — each returns a Promise so callers can await */
  createClient: (dto: CreateClientDto) => Promise<ClientAPI>;
  updateClient: (id: number, dto: UpdateClientDto) => Promise<void>;
  deleteClient: (id: number) => Promise<void>;
}

export function useClients(): UseClientsResult {
  const [allClients, setAllClients] = useState<ClientAPI[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch]         = useState('');
  const [fetchKey, setFetchKey]     = useState(0);

  // ─── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    clientsApi
      .list(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setAllClients(data);
          setCurrentPage(1);
        }
      })
      .catch((err: Error) => {
        if (!controller.signal.aborted) {
          setError(err.message);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [fetchKey]);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  // ─── Search filter ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allClients;
    return allClients.filter(
      (c) =>
        c.trade_name.toLowerCase().includes(q) ||
        c.company_id.toLowerCase().includes(q) ||
        c.location.toLowerCase().includes(q),
    );
  }, [allClients, search]);

  // Reset to page 1 whenever search changes
  const handleSetSearch = useCallback((q: string) => {
    setSearch(q);
    setCurrentPage(1);
  }, []);

  // ─── Pagination (client-side) ─────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const clients    = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  // ─── Mutations ────────────────────────────────────────────────────────────
  const createClient = useCallback(async (dto: CreateClientDto): Promise<ClientAPI> => {
    const created = await clientsApi.create(dto);
    setAllClients((prev) =>
      [...prev, created].sort((a, b) => a.trade_name.localeCompare(b.trade_name)),
    );
    return created;
  }, []);

  const updateClient = useCallback(async (id: number, dto: UpdateClientDto) => {
    const updated = await clientsApi.update(id, dto);
    setAllClients((prev) => prev.map((c) => (c.id_client === id ? updated : c)));
  }, []);

  const deleteClient = useCallback(async (id: number) => {
    await clientsApi.remove(id);
    setAllClients((prev) => {
      const next = prev.filter((c) => c.id_client !== id);
      const newTotalPages = Math.max(1, Math.ceil(next.length / PAGE_SIZE));
      setCurrentPage((p) => Math.min(p, newTotalPages));
      return next;
    });
  }, []);

  return {
    clients,
    totalClients: filtered.length,
    loading,
    error,
    currentPage: safePage,
    totalPages,
    setCurrentPage,
    search,
    setSearch: handleSetSearch,
    refetch,
    createClient,
    updateClient,
    deleteClient,
  };
}
