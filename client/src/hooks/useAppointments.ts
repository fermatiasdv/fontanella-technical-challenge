/**
 * useAppointments — central hook for the Appointments screen.
 *
 * Responsibilities:
 *  - Fetches the full appointments list from the backend on mount.
 *  - Fetches the full lawyers list (for the lawyer <select>).
 *  - Fetches the full clients list (for the client <select>).
 *  - Exposes loading / error states.
 *  - Exposes create / update / remove mutations.
 */

import { useState, useEffect, useCallback } from 'react';
import { appointmentsApi } from '../api/appointments';
import { lawyersApi }      from '../api/lawyers';
import { clientsApi }      from '../api/clients';
import type { AppointmentAPI, CreateAppointmentDto, UpdateAppointmentDto } from '../types/appointment';
import type { LawyerAPI }  from '../types/lawyer';
import type { ClientAPI }  from '../types/client';

export interface UseAppointmentsResult {
  appointments:      AppointmentAPI[];
  lawyers:           LawyerAPI[];
  clients:           ClientAPI[];
  loading:           boolean;
  lawyersLoading:    boolean;
  clientsLoading:    boolean;
  error:             string | null;
  refetch:           () => void;
  createAppointment: (dto: CreateAppointmentDto) => Promise<AppointmentAPI>;
  updateAppointment: (id: number, dto: UpdateAppointmentDto) => Promise<void>;
  deleteAppointment: (id: number) => Promise<void>;
}

export function useAppointments(): UseAppointmentsResult {
  const [appointments, setAppointments] = useState<AppointmentAPI[]>([]);
  const [lawyers,      setLawyers]      = useState<LawyerAPI[]>([]);
  const [clients,      setClients]      = useState<ClientAPI[]>([]);

  const [loading,        setLoading]        = useState(true);
  const [lawyersLoading, setLawyersLoading] = useState(true);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [error,          setError]          = useState<string | null>(null);

  const [fetchKey, setFetchKey] = useState(0);

  // ─── Fetch appointments ────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    appointmentsApi
      .list(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setAppointments(data);
        }
      })
      .catch((err: Error) => {
        if (!controller.signal.aborted) setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [fetchKey]);

  // ─── Fetch lawyers (for select) ────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    setLawyersLoading(true);

    lawyersApi
      .list(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setLawyers(data);
      })
      .catch(() => { /* lawyers list failing doesn't block the whole page */ })
      .finally(() => {
        if (!controller.signal.aborted) setLawyersLoading(false);
      });

    return () => controller.abort();
  }, []);

  // ─── Fetch clients (for select) ───────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    setClientsLoading(true);

    clientsApi
      .list(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setClients(data);
      })
      .catch(() => { /* clients list failing doesn't block the whole page */ })
      .finally(() => {
        if (!controller.signal.aborted) setClientsLoading(false);
      });

    return () => controller.abort();
  }, []);

  const refetch = useCallback(() => setFetchKey((k) => k + 1), []);

  // ─── Mutations ────────────────────────────────────────────────────────────
  const createAppointment = useCallback(async (dto: CreateAppointmentDto): Promise<AppointmentAPI> => {
    const created = await appointmentsApi.create(dto);
    setAppointments((prev) =>
      [...prev, created].sort(
        (a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime(),
      ),
    );
    return created;
  }, []);

  const updateAppointment = useCallback(async (id: number, dto: UpdateAppointmentDto) => {
    const updated = await appointmentsApi.update(id, dto);
    setAppointments((prev) => prev.map((a) => (a.id_appointment === id ? updated : a)));
  }, []);

  const deleteAppointment = useCallback(async (id: number) => {
    await appointmentsApi.remove(id);
    setAppointments((prev) => prev.filter((a) => a.id_appointment !== id));
  }, []);

  return {
    appointments,
    lawyers,
    clients,
    loading,
    lawyersLoading,
    clientsLoading,
    error,
    refetch,
    createAppointment,
    updateAppointment,
    deleteAppointment,
  };
}
