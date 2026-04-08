import { useState, useEffect } from 'react';
import { lawyersService } from '@/services/lawyers.service';
import type { LawyerAPI } from '@/features/lawyers/types/lawyer.types';

export function useLawyerList() {
  const [lawyers, setLawyers] = useState<LawyerAPI[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    lawyersService
      .list(controller.signal)
      .then((data) => { if (!controller.signal.aborted) setLawyers(data); })
      .catch(() => {})
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);

  return { lawyers, loading };
}
