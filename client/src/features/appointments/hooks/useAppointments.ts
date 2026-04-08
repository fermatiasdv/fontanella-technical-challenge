import { useState, useEffect, useCallback } from 'react';
import { appointmentsService } from '@/services/appointments.service';
import type { AppointmentAPI, CreateAppointmentDto, UpdateAppointmentDto } from '@/features/appointments/types/appointment.types';

export function useAppointments() {
  const [appointments, setAppointments] = useState<AppointmentAPI[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [fetchKey, setFetchKey]         = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(null);
    appointmentsService
      .list(controller.signal)
      .then((data) => { if (!controller.signal.aborted) setAppointments(data); })
      .catch((err: Error) => { if (!controller.signal.aborted) setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [fetchKey]);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  const create = useCallback(async (dto: CreateAppointmentDto): Promise<AppointmentAPI> => {
    const created = await appointmentsService.create(dto);
    setAppointments((prev) =>
      [...prev, created].sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime()),
    );
    return created;
  }, []);

  const update = useCallback(async (id: number, dto: UpdateAppointmentDto) => {
    const updated = await appointmentsService.update(id, dto);
    setAppointments((prev) => prev.map((a) => (a.id_appointment === id ? updated : a)));
  }, []);

  const remove = useCallback(async (id: number) => {
    await appointmentsService.remove(id);
    setAppointments((prev) => prev.filter((a) => a.id_appointment !== id));
  }, []);

  return { appointments, loading, error, refetch, create, update, remove };
}
