import { useState, useEffect } from 'react';
import { useAppointmentForm } from '@/features/appointments/hooks/useAppointmentForm';
import { AvailabilityPanel } from '@/features/appointments/components/AvailabilityPanel';
import { toLocalInput, localInputToISO } from '@/features/appointments/utils/datetimeUtils';
import type { AppointmentAPI, CreateAppointmentDto } from '@/features/appointments/types/appointment.types';
import type { LawyerAPI } from '@/features/lawyers/types/lawyer.types';
import type { ClientAPI } from '@/features/clients/types/client.types';

const METHOD_LABEL = { InPerson: 'Presencial', VideoCall: 'Videollamada', PhoneCall: 'Teléfono' } as const;
const METHOD_ICON  = { InPerson: 'location_on', VideoCall: 'videocam', PhoneCall: 'phone' } as const;

export interface AppointmentFormModalProps {
  isOpen:          boolean;
  editAppointment: AppointmentAPI | null;
  lawyers:         LawyerAPI[];
  clients:         ClientAPI[];
  lawyersLoading:  boolean;
  clientsLoading:  boolean;
  onClose:         () => void;
  onSave:          (dto: CreateAppointmentDto) => Promise<void>;
}

export function AppointmentFormModal({
  isOpen, editAppointment, lawyers, clients,
  lawyersLoading, clientsLoading, onClose, onSave,
}: AppointmentFormModalProps) {
  const isEdit = editAppointment !== null;

  const defaultStart = () => { const d = new Date(); d.setMinutes(0, 0, 0); d.setHours(d.getHours() + 1); return toLocalInput(d.toISOString()); };
  const defaultEnd   = () => { const d = new Date(); d.setMinutes(0, 0, 0); d.setHours(d.getHours() + 2); return toLocalInput(d.toISOString()); };

  const [lawyerId,    setLawyerId]    = useState<number | ''>('');
  const [clientId,    setClientId]    = useState<number | ''>('');
  const [subject,     setSubject]     = useState('');
  const [description, setDescription] = useState('');
  const [startInput,  setStartInput]  = useState(defaultStart());
  const [endInput,    setEndInput]    = useState(defaultEnd());
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  const { commonMethods, contactsLoading, selectedContactId, setSelectedContactId } =
    useAppointmentForm({ isOpen, lawyerId, clientId });

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
      setSubject(''); setDescription('');
      setStartInput(defaultStart()); setEndInput(defaultEnd());
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

  const handleSave = async () => {
    if (!lawyerId || !clientId || !subject.trim()) { setError('Lawyer, client and subject are required.'); return; }
    if (commonMethods.length === 0) { setError('El abogado y el cliente no tienen métodos de contacto en común.'); return; }
    if (selectedContactId === '') { setError('Seleccioná un método de contacto para la cita.'); return; }
    const start = localInputToISO(startInput);
    const end   = localInputToISO(endInput);
    if (new Date(start) >= new Date(end)) { setError('End date/time must be after start date/time.'); return; }
    setSubmitting(true); setError(null);
    try {
      await onSave({
        idLawyer: Number(lawyerId), idClient: Number(clientId),
        idSelectedContact: Number(selectedContactId),
        subject: subject.trim(), description: description.trim() || undefined,
        startDatetime: start, endDatetime: end,
      });
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card appt-modal">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="appt-modal__icon">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isEdit ? 'edit_calendar' : 'calendar_add_on'}
              </span>
            </div>
            <div>
              <p className="appt-modal__eyebrow">{isEdit ? 'Modify Appointment' : 'New Appointment'}</p>
              <h2 className="appt-modal__title">{isEdit ? 'Edit Appointment' : 'Schedule Appointment'}</h2>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon"><span className="material-symbols-outlined">close</span></button>
        </div>

        <div className="modal-body">
          {/* Lawyer select */}
          <div className="form-field">
            <label className="form-field__label"><span className="material-symbols-outlined">gavel</span>Lawyer</label>
            {lawyersLoading ? <div className="appt-modal__select-skeleton" /> : lawyers.length === 0 ? (
              <p className="appt-modal__empty-select">No lawyers found. Please add a lawyer first.</p>
            ) : (
              <div className="form-select-wrap">
                <select className="form-select" value={lawyerId} onChange={(e) => setLawyerId(Number(e.target.value))}>
                  {lawyers.map((l) => <option key={l.id_lawyer} value={l.id_lawyer}>{l.full_name}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Client select */}
          <div className="form-field">
            <label className="form-field__label"><span className="material-symbols-outlined">business</span>Client</label>
            {clientsLoading ? <div className="appt-modal__select-skeleton" /> : clients.length === 0 ? (
              <p className="appt-modal__empty-select">No clients found. Please add a client first.</p>
            ) : (
              <div className="form-select-wrap">
                <select className="form-select" value={clientId} onChange={(e) => setClientId(Number(e.target.value))}>
                  {clients.map((c) => <option key={c.id_client} value={c.id_client}>{c.trade_name}</option>)}
                </select>
              </div>
            )}
          </div>

          {/* Subject */}
          <div className="form-field">
            <label className="form-field__label"><span className="material-symbols-outlined">title</span>Subject</label>
            <input type="text" className="form-input" placeholder="e.g. Initial consultation" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>

          {/* Description */}
          <div className="form-field">
            <label className="form-field__label">
              <span className="material-symbols-outlined">notes</span>Description
              <span style={{ color: 'var(--c-outline)', fontWeight: 400, textTransform: 'none', letterSpacing: 'normal' }}>(optional)</span>
            </label>
            <textarea className="form-textarea" rows={3} placeholder="Additional notes…" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          {/* Start + End */}
          <div className="form-grid-2">
            <div className="form-field">
              <label className="form-field__label"><span className="material-symbols-outlined">play_arrow</span>Start</label>
              <input type="datetime-local" className="form-datetime" value={startInput}
                onChange={(e) => {
                  setStartInput(e.target.value);
                  if (e.target.value >= endInput) {
                    const d = new Date(e.target.value); d.setHours(d.getHours() + 1);
                    setEndInput(toLocalInput(d.toISOString()));
                  }
                }} />
            </div>
            <div className="form-field">
              <label className="form-field__label"><span className="material-symbols-outlined">stop</span>End</label>
              <input type="datetime-local" className="form-datetime" value={endInput} onChange={(e) => setEndInput(e.target.value)} />
            </div>
          </div>

          {/* Contact method selector */}
          {lawyerId !== '' && clientId !== '' && (
            <div className="form-field">
              <label className="form-field__label"><span className="material-symbols-outlined">connect_without_contact</span>Método de contacto</label>
              {contactsLoading ? <div className="appt-modal__select-skeleton" /> :
               commonMethods.length === 0 ? (
                <div className="error-box">
                  <span className="material-symbols-outlined">block</span>
                  El abogado y el cliente no tienen métodos de contacto en común.
                </div>
               ) : (
                <div className="contact-method-list">
                  {commonMethods.map(({ methodType, lawyerContact }) => (
                    <button key={methodType} type="button"
                      onClick={() => setSelectedContactId(lawyerContact.id_contact)}
                      className={`contact-method-option${selectedContactId === lawyerContact.id_contact ? ' contact-method-option--selected' : ''}`}>
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{METHOD_ICON[methodType]}</span>
                      <span>{METHOD_LABEL[methodType]}</span>
                    </button>
                  ))}
                </div>
               )}
            </div>
          )}

          <AvailabilityPanel lawyerId={lawyerId} />

          {error && <div className="error-box"><span className="material-symbols-outlined">error</span>{error}</div>}
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button type="button" onClick={handleSave} disabled={submitting || lawyersLoading || clientsLoading} className="btn-primary">
            {submitting
              ? <><span className="material-symbols-outlined anim-spin">progress_activity</span>Saving…</>
              : <><span className="material-symbols-outlined">{isEdit ? 'save' : 'add'}</span>{isEdit ? 'Save Changes' : 'Schedule'}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
