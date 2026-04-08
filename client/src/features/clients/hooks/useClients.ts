import { useState, useEffect, useCallback, useMemo } from 'react';
import { clientsService } from '@/services/clients.service';
import type { ClientAPI, CreateClientDto, UpdateClientDto } from '@/features/clients/types/client.types';

const PAGE_SIZE = 4;

export function useClients() {
  const [allClients, setAllClients]     = useState<ClientAPI[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [currentPage, setCurrentPage]   = useState(1);
  const [search, setSearch]             = useState('');
  const [fetchKey, setFetchKey]         = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(null);
    clientsService
      .list(controller.signal)
      .then((data) => { if (!controller.signal.aborted) { setAllClients(data); setCurrentPage(1); } })
      .catch((err: Error) => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [fetchKey]);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allClients;
    return allClients.filter(
      (c) => c.trade_name.toLowerCase().includes(q) || c.company_id.toLowerCase().includes(q) || c.location.toLowerCase().includes(q),
    );
  }, [allClients, search]);

  const handleSetSearch = useCallback((q: string) => { setSearch(q); setCurrentPage(1); }, []);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(currentPage, totalPages);
  const clients    = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const createClient = useCallback(async (dto: CreateClientDto): Promise<ClientAPI> => {
    const created = await clientsService.create(dto);
    setAllClients((prev) => [...prev, created].sort((a, b) => a.trade_name.localeCompare(b.trade_name)));
    return created;
  }, []);

  const updateClient = useCallback(async (id: number, dto: UpdateClientDto) => {
    const updated = await clientsService.update(id, dto);
    setAllClients((prev) => prev.map((c) => (c.id_client === id ? updated : c)));
  }, []);

  const deleteClient = useCallback(async (id: number) => {
    await clientsService.remove(id);
    setAllClients((prev) => {
      const next = prev.filter((c) => c.id_client !== id);
      setCurrentPage((p) => Math.min(p, Math.max(1, Math.ceil(next.length / PAGE_SIZE))));
      return next;
    });
  }, []);

  return {
    clients, totalClients: filtered.length, loading, error,
    currentPage: safePage, totalPages, setCurrentPage,
    search, setSearch: handleSetSearch, refetch,
    createClient, updateClient, deleteClient,
  };
}
