/**
 * AppointmentsPage — ABMC de Appointments (T_APPOINTMENTS)
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAppointments } from '../hooks/useAppointments';
import type { AppointmentAPI, CreateAppointmentDto } from '../types/appointment';
import type { LawyerAPI } from '../types/lawyer';
import type { ClientAPI } from '../types/client';
import { workingScheduleApi } from '../api/workingSchedule';
import type { WorkingScheduleAPI } from '../api/workingSchedule';
import { vacationsApi } from '../api/vacations';
import type { VacationAPI } from '../api/vacations';
import { contactApi } from '../api/contact';
import type { ContactAPI, MethodType } from '../api/contact';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

function fmtTime(t: string): string {
  const [hStr, mStr] = t.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = mStr ?? '00';
  const per = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${per}`;
}

function fmtDate(d: string): string {
  // "YYYY-MM-DD" → "DD/MM/YYYY"
  const [y, mo, day] = d.split('-');
  return `${day}/${mo}/${y}`;
}

function formatDatetime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
}

function localInputToISO(value: string): string {
  return new Date(value).toISOString();
}

// ─── Contact method helpers ───────────────────────────────────────────────────

const METHOD_LABEL: Record<MethodType, string> = {
  InPerson:  'Presencial',
  VideoCall: 'Videollamada',
  PhoneCall: 'Teléfono',
};

const METHOD_ICON: Record<MethodType, string> = {
  InPerson:  'location_on',
  VideoCall: 'videocam',
  PhoneCall: 'phone',
};

// ─── Availability Panel ───────────────────────────────────────────────────────

interface AvailabilityPanelProps {
  lawyerId: number | '';
}

function AvailabilityPanel({ lawyerId }: AvailabilityPanelProps) {
  const [schedule,  setSchedule]  = useState<WorkingScheduleAPI[]>([]);
  const [vacations, setVacations] = useState<VacationAPI[]>([]);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    if (lawyerId === '') { setSchedule([]); setVacations([]); return; }
    const controller = new AbortController();
    setLoading(true);

    Promise.all([
      workingScheduleApi.getByLawyer(lawyerId, controller.signal),
      vacationsApi.getByLawyer(lawyerId, controller.signal),
    ])
      .then(([sched, vacs]) => {
        if (controller.signal.aborted) return;
        const sorted = [...sched].sort(
          (a, b) => DAYS_ORDER.indexOf(a.day_of_week as typeof DAYS_ORDER[number]) -
                    DAYS_ORDER.indexOf(b.day_of_week as typeof DAYS_ORDER[number]),
        );
        setSchedule(sorted);
        setVacations(vacs);
      })
      .catch(() => {/* non-critical */})
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });

    return () => controller.abort();
  }, [lawyerId]);

  if (lawyerId === '') return null;

  return (
    <div className="avail-panel">
      <div className="avail-panel__header">
        <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--c-primary)' }}>info</span>
        <span className="avail-panel__title">Disponibilidad del abogado</span>
      </div>

      {loading ? (
        <div className="avail-panel__loading">
          <span className="material-symbols-outlined anim-spin" style={{ fontSize: '1rem' }}>progress_activity</span>
          Cargando…
        </div>
      ) : (
        <div className="avail-panel__body">

          {/* Working hours */}
          <div className="avail-panel__section">
            <p className="avail-panel__section-label">
              <span className="material-symbols-outlined">schedule</span>
              Horario laboral
            </p>
            {schedule.length === 0 ? (
              <p className="avail-panel__empty">Sin horario configurado</p>
            ) : (
              <ul className="avail-panel__schedule-list">
                {schedule.map((s) => (
                  <li key={s.id_working_schedule} className="avail-panel__schedule-row">
                    <span className="avail-panel__day">{s.day_of_week.slice(0, 3)}</span>
                    <span className="avail-panel__hours">
                      {fmtTime(s.start_time)} – {fmtTime(s.end_time)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Vacations */}
          <div className="avail-panel__section">
            <p className="avail-panel__section-label">
              <span className="material-symbols-outlined">beach_access</span>
              Vacaciones
            </p>
            {vacations.length === 0 ? (
              <p className="avail-panel__empty">Sin vacaciones registradas</p>
            ) : (
              <ul className="avail-panel__vac-list">
                {vacations.map((v) => (
                  <li key={v.id_vacation} className="avail-panel__vac-row">
                    <span className="material-symbols-outlined" style={{ fontSize: '0.875rem', color: 'var(--c-error)' }}>do_not_disturb_on</span>
                    <span>{fmtDate(v.start_date)} → {fmtDate(v.end_date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// ─── Appointment Form Modal ────────────────────────────────────────────────────

interface AppointmentFormModalProps {
  isOpen:          boolean;
  editAppointment: AppointmentAPI | null;
  lawyers:         LawyerAPI[];
  clients:         ClientAPI[];
  lawyersLoading:  boolean;
  clientsLoading:  boolean;
  onClose:         () => void;
  onSave:          (dto: CreateAppointmentDto) => Promise<void>;
}

function AppointmentFormModal({
  isOpen,
  editAppointment,
  lawyers,
  clients,
  lawyersLoading,
  clientsLoading,
  onClose,
  onSave,
}: AppointmentFormModalProps) {
  const isEdit = editAppointment !== null;

  const defaultStart = () => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 1);
    return toLocalInput(d.toISOString());
  };

  const defaultEnd = () => {
    const d = new Date();
    d.setMinutes(0, 0, 0);
    d.setHours(d.getHours() + 2);
    return toLocalInput(d.toISOString());
  };

  const [lawyerId,          setLawyerId]          = useState<number | ''>('');
  const [clientId,          setClientId]          = useState<number | ''>('');
  const [subject,           setSubject]           = useState('');
  const [description,       setDescription]       = useState('');
  const [startInput,        setStartInput]        = useState(defaultStart());
  const [endInput,          setEndInput]          = useState(defaultEnd());
  const [submitting,        setSubmitting]        = useState(false);
  const [error,             setError]             = useState<string | null>(null);
  const [lawyerContacts,    setLawyerContacts]    = useState<ContactAPI[]>([]);
  const [clientContacts,    setClientContacts]    = useState<ContactAPI[]>([]);
  const [contactsLoading,   setContactsLoading]   = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<number | ''>('');

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editAppointment) {
      setLawyerId(editAppointment.id_lawyer);
      setClientId(editAppointment.id_client);
      setSubject(editAppointment.subject);
      setDescription(editAppointment.description ?? '');
      setStartInput(toLocalInput(editAppointment.start_datetime));
      setEndInput(toLocalInput(editAppointment.end_datetime));
    } else {
      setLawyerId(lawyers[0]?.id_lawyer ?? '');
      setClientId(clients[0]?.id_client ?? '');
      setSubject('');
      setDescription('');
      setStartInput(defaultStart());
      setEndInput(defaultEnd());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, editAppointment]);

  useEffect(() => {
    if (!isOpen || isEdit) return;
    if (lawyerId === '' && lawyers.length > 0) setLawyerId(lawyers[0]!.id_lawyer);
  }, [lawyers, isOpen, isEdit, lawyerId]);

  useEffect(() => {
    if (!isOpen || isEdit) return;
    if (clientId === '' && clients.length > 0) setClientId(clients[0]!.id_client);
  }, [clients, isOpen, isEdit, clientId]);

  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  // ── Fetch contacts when lawyer or client changes ───────────────────────────
  useEffect(() => {
    if (!isOpen || lawyerId === '' || clientId === '') {
      setLawyerContacts([]);
      setClientContacts([]);
      setSelectedContactId('');
      return;
    }
    const controller = new AbortController();
    setContactsLoading(true);
    Promise.all([
      contactApi.listByLawyer(Number(lawyerId), controller.signal),
      contactApi.listByClient(Number(clientId), controller.signal),
    ])
      .then(([lc, cc]) => {
        if (controller.signal.aborted) return;
        setLawyerContacts(lc);
        setClientContacts(cc);

        // Auto-select: prefer the existing contact (edit mode) if still valid,
        // otherwise fall back to the first common method.
        const lawyerByMethod = new Map(lc.map((c) => [c.method_type, c]));
        const commonLawyerContacts = cc
          .filter((c) => lawyerByMethod.has(c.method_type))
          .map((c) => lawyerByMethod.get(c.method_type)!);

        if (commonLawyerContacts.length > 0) {
          setSelectedContactId((prev) => {
            const stillValid = commonLawyerContacts.some((c) => c.id_contact === prev);
            return stillValid ? prev : (commonLawyerContacts[0]?.id_contact ?? '');
          });
        } else {
          setSelectedContactId('');
        }
      })
      .catch(() => {/* non-critical */})
      .finally(() => { if (!controller.signal.aborted) setContactsLoading(false); });

    return () => controller.abort();
  }, [isOpen, lawyerId, clientId]);

  // Common contact methods (intersection by method_type, resolved to lawyer's contacts)
  const commonMethods = useMemo(() => {
    const lawyerByMethod = new Map(lawyerContacts.map((c) => [c.method_type, c]));
    return clientContacts
      .filter((c) => lawyerByMethod.has(c.method_type))
      .map((c) => ({ methodType: c.method_type as MethodType, lawyerContact: lawyerByMethod.get(c.method_type)! }));
  }, [lawyerContacts, clientContacts]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!lawyerId || !clientId || !subject.trim()) {
      setError('Lawyer, client and subject are required.');
      return;
    }
    if (commonMethods.length === 0) {
      setError('No se puede agendar la cita: el abogado y el cliente no tienen métodos de contacto en común.');
      return;
    }
    if (selectedContactId === '') {
      setError('Seleccioná un método de contacto para la cita.');
      return;
    }
    const start = localInputToISO(startInput);
    const end   = localInputToISO(endInput);
    if (new Date(start) >= new Date(end)) {
      setError('End date/time must be after start date/time.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSave({
        idLawyer:          Number(lawyerId),
        idClient:          Number(clientId),
        idSelectedContact: Number(selectedContactId),
        subject:           subject.trim(),
        description:       description.trim() || undefined,
        startDatetime:     start,
        endDatetime:       end,
      });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-card appt-modal">
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="appt-modal__icon">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {isEdit ? 'edit_calendar' : 'calendar_add_on'}
              </span>
            </div>
            <div>
              <p className="appt-modal__eyebrow">
                {isEdit ? 'Modify Appointment' : 'New Appointment'}
              </p>
              <h2 className="appt-modal__title">
                {isEdit ? 'Edit Appointment' : 'Schedule Appointment'}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* ── Body ──────────────────────────────────────────────────── */}
        <div className="modal-body">

          {/* Lawyer select */}
          <div className="form-field">
            <label className="form-field__label">
              <span className="material-symbols-outlined">gavel</span>
              Lawyer
            </label>
            {lawyersLoading ? (
              <div className="appt-modal__select-skeleton" />
            ) : lawyers.length === 0 ? (
              <p className="appt-modal__empty-select">
                No lawyers found. Please add a lawyer first.
              </p>
            ) : (
              <div className="form-select-wrap">
                <select
                  className="form-select"
                  value={lawyerId}
                  onChange={(e) => setLawyerId(Number(e.target.value))}
                >
                  {lawyers.map((l) => (
                    <option key={l.id_lawyer} value={l.id_lawyer}>
                      {l.full_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Client select */}
          <div className="form-field">
            <label className="form-field__label">
              <span className="material-symbols-outlined">business</span>
              Client
            </label>
            {clientsLoading ? (
              <div className="appt-modal__select-skeleton" />
            ) : clients.length === 0 ? (
              <p className="appt-modal__empty-select">
                No clients found. Please add a client first.
              </p>
            ) : (
              <div className="form-select-wrap">
                <select
                  className="form-select"
                  value={clientId}
                  onChange={(e) => setClientId(Number(e.target.value))}
                >
                  {clients.map((c) => (
                    <option key={c.id_client} value={c.id_client}>
                      {c.trade_name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="form-field">
            <label className="form-field__label">
              <span className="material-symbols-outlined">title</span>
              Subject
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Initial consultation"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="form-field">
            <label className="form-field__label">
              <span className="material-symbols-outlined">notes</span>
              Description
              <span style={{ color: 'var(--c-outline)', fontWeight: 400, textTransform: 'none', letterSpacing: 'normal' }}>(optional)</span>
            </label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Additional notes…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Start + End datetime */}
          <div className="form-grid-2">
            <div className="form-field">
              <label className="form-field__label">
                <span className="material-symbols-outlined">play_arrow</span>
                Start
              </label>
              <input
                type="datetime-local"
                className="form-datetime"
                value={startInput}
                onChange={(e) => {
                  setStartInput(e.target.value);
                  if (e.target.value >= endInput) {
                    const d = new Date(e.target.value);
                    d.setHours(d.getHours() + 1);
                    setEndInput(toLocalInput(d.toISOString()));
                  }
                }}
              />
            </div>
            <div className="form-field">
              <label className="form-field__label">
                <span className="material-symbols-outlined">stop</span>
                End
              </label>
              <input
                type="datetime-local"
                className="form-datetime"
                value={endInput}
                onChange={(e) => setEndInput(e.target.value)}
              />
            </div>
          </div>

          {/* Contact method selector */}
          {lawyerId !== '' && clientId !== '' && (
            <div className="form-field">
              <label className="form-field__label">
                <span className="material-symbols-outlined">connect_without_contact</span>
                Método de contacto
              </label>

              {contactsLoading ? (
                <div className="appt-modal__select-skeleton" />
              ) : commonMethods.length === 0 ? (
                <div className="error-box">
                  <span className="material-symbols-outlined">block</span>
                  El abogado y el cliente no tienen métodos de contacto en común. No es posible agendar una cita entre ellos.
                </div>
              ) : (
                <div className="contact-method-list">
                  {commonMethods.map(({ methodType, lawyerContact }) => (
                    <button
                      key={methodType}
                      type="button"
                      onClick={() => setSelectedContactId(lawyerContact.id_contact)}
                      className={`contact-method-option${selectedContactId === lawyerContact.id_contact ? ' contact-method-option--selected' : ''}`}
                    >
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {METHOD_ICON[methodType]}
                      </span>
                      <span>{METHOD_LABEL[methodType]}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Availability info for the selected lawyer */}
          <AvailabilityPanel lawyerId={lawyerId} />

          {error && (
            <div className="error-box">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}
        </div>

        {/* ── Footer ────────────────────────────────────────────────── */}
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={submitting || lawyersLoading || clientsLoading}
            className="btn-primary"
          >
            {submitting
              ? <><span className="material-symbols-outlined anim-spin">progress_activity</span>Saving…</>
              : <><span className="material-symbols-outlined">{isEdit ? 'save' : 'add'}</span>{isEdit ? 'Save Changes' : 'Schedule'}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Appointment Row ──────────────────────────────────────────────────────────

interface AppointmentRowProps {
  appointment: AppointmentAPI;
  lawyerName:  string;
  clientName:  string;
  onEdit:      (a: AppointmentAPI) => void;
  onDelete:    (id: number) => Promise<void>;
}

function AppointmentRow({ appointment, lawyerName, clientName, onEdit, onDelete }: AppointmentRowProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete appointment "${appointment.subject}"?`)) return;
    setDeleting(true);
    try {
      await onDelete(appointment.id_appointment);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <tr className="appt-row">
      <td className="appt-row__cell">
        <p className="appt-row__subject">{appointment.subject}</p>
        {appointment.description && (
          <p className="appt-row__desc">{appointment.description}</p>
        )}
      </td>
      <td className="appt-row__cell">
        <div className="appt-row__person appt-row__person--lawyer">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
          <span>{lawyerName}</span>
        </div>
      </td>
      <td className="appt-row__cell">
        <div className="appt-row__person appt-row__person--client">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>business</span>
          <span>{clientName}</span>
        </div>
      </td>
      <td className="appt-row__cell">
        <span className="appt-row__datetime">{formatDatetime(appointment.start_datetime)}</span>
      </td>
      <td className="appt-row__cell">
        <span className="appt-row__datetime">{formatDatetime(appointment.end_datetime)}</span>
      </td>
      <td className="appt-row__cell">
        <div className="appt-row__actions">
          <button
            onClick={() => onEdit(appointment)}
            className="appt-row__btn appt-row__btn--edit"
            title="Edit"
          >
            <span className="material-symbols-outlined">edit</span>
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="appt-row__btn appt-row__btn--delete"
            title="Delete"
          >
            {deleting
              ? <span className="material-symbols-outlined anim-spin">progress_activity</span>
              : <span className="material-symbols-outlined">delete</span>
            }
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AppointmentsPage() {
  const {
    appointments,
    lawyers,
    clients,
    loading,
    lawyersLoading,
    clientsLoading,
    error,
    createAppointment,
    updateAppointment,
    deleteAppointment,
  } = useAppointments();

  const [formOpen,        setFormOpen]        = useState(false);
  const [editAppointment, setEditAppointment] = useState<AppointmentAPI | null>(null);

  const lawyerMap = useCallback(
    (id: number) => lawyers.find((l) => l.id_lawyer === id)?.full_name ?? `Lawyer #${id}`,
    [lawyers],
  );
  const clientMap = useCallback(
    (id: number) => clients.find((c) => c.id_client === id)?.trade_name ?? `Client #${id}`,
    [clients],
  );

  const openCreate = () => { setEditAppointment(null); setFormOpen(true); };
  const openEdit   = (a: AppointmentAPI) => { setEditAppointment(a); setFormOpen(true); };

  const handleSave = async (dto: CreateAppointmentDto) => {
    if (editAppointment) {
      await updateAppointment(editAppointment.id_appointment, dto);
    } else {
      await createAppointment(dto);
    }
  };

  return (
    <>
      <main className="page">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* ── Header ───────────────────────────────────────────────── */}
          <section className="section-header">
            <div>
              <span className="eyebrow">Appointments</span>
              <h2 className="section-header__title">Scheduled meetings.</h2>
              <p className="section-header__subtitle">
                Create, review and manage all appointments between lawyers and clients.
              </p>
            </div>
            <button onClick={openCreate} className="btn-primary">
              <span className="material-symbols-outlined">add</span>
              New Appointment
            </button>
          </section>

          {/* ── Error banner ─────────────────────────────────────────── */}
          {error && (
            <div className="error-banner">
              <span className="material-symbols-outlined">error</span>
              <span>{error}</span>
            </div>
          )}


          {/* ── Table ────────────────────────────────────────────────── */}
          <div className="appt-table">
            {loading ? (
              <div className="appt-table__loading">
                <span className="material-symbols-outlined anim-spin">progress_activity</span>
                Loading appointments…
              </div>
            ) : appointments.length === 0 ? (
              <div className="appt-table__empty">
                <span
                  className="material-symbols-outlined appt-table__empty-icon"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  event_busy
                </span>
                <p className="appt-table__empty-text">No appointments yet.</p>
                <button onClick={openCreate} className="appt-table__empty-cta">
                  Schedule the first one →
                </button>
              </div>
            ) : (
              <div className="appt-table__scroll">
                <table>
                  <thead className="appt-table__head">
                    <tr>
                      {['Subject', 'Lawyer', 'Client', 'Start', 'End', ''].map((h) => (
                        <th key={h} className="appt-table__th">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((a) => (
                      <AppointmentRow
                        key={a.id_appointment}
                        appointment={a}
                        lawyerName={lawyerMap(a.id_lawyer)}
                        clientName={clientMap(a.id_client)}
                        onEdit={openEdit}
                        onDelete={deleteAppointment}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>

      <AppointmentFormModal
        isOpen={formOpen}
        editAppointment={editAppointment}
        lawyers={lawyers}
        clients={clients}
        lawyersLoading={lawyersLoading}
        clientsLoading={clientsLoading}
        onClose={() => { setFormOpen(false); setEditAppointment(null); }}
        onSave={handleSave}
      />
    </>
  );
}
