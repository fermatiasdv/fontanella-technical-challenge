import { useState, useEffect } from 'react';
import { clientsService } from '@/services/clients.service';
import type { ClientAPI } from '@/features/clients/types/client.types';

export function useClientList() {
  const [clients, setClients] = useState<ClientAPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    clientsService
      .list(controller.signal)
      .then((data) => { if (!controller.signal.aborted) setClients(data); })
      .catch(() => {})
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  return { clients, loading };
}
