/**
 * CreateLawyerModal — create & edit mode
 *
 * In CREATE mode: also collects working schedule (entry/exit time + active days)
 * and vacation periods, which are saved to T_WORKING_SCHEDULE and T_VACATIONS
 * after the lawyer record is created.
 */

import { useState, useCallback, useEffect } from 'react';
import type { FormEvent } from 'react';
import type {
  CreateLawyerDto,
  LawyerAPI,
  ScheduleSlotInput,
  VacationInput,
} from '../../types/lawyer';
import { contactApi } from '../../api/contact';
import type { MethodType } from '../../api/contact';
import ContactMethodsSection, {
  EMPTY_CONTACTS,
  getActiveContacts,
} from '../common/ContactMethodsSection';
import type { ContactMethodInputI, ContactsState } from '../common/ContactMethodsSection';

// ─── Timezone options ─────────────────────────────────────────────────────────
const TIMEZONE_OPTIONS = [
  { value: 'America/Argentina/Buenos_Aires', label: 'Buenos Aires (ART, UTC−3)' },
  { value: 'America/Argentina/Cordoba',      label: 'Córdoba (ART, UTC−3)' },
  { value: 'America/Argentina/Mendoza',      label: 'Mendoza (ART, UTC−3)' },
  { value: 'America/Argentina/Rosario',      label: 'Rosario (ART, UTC−3)' },
  { value: 'America/Montevideo',             label: 'Montevideo (UYT, UTC−3)' },
  { value: 'America/Santiago',               label: 'Santiago (CLT, UTC−3/−4)' },
  { value: 'America/Sao_Paulo',              label: 'São Paulo (BRT, UTC−3)' },
  { value: 'America/Bogota',                 label: 'Bogotá (COT, UTC−5)' },
  { value: 'America/Lima',                   label: 'Lima (PET, UTC−5)' },
  { value: 'America/New_York',               label: 'New York (ET, UTC−5/−4)' },
  { value: 'America/Chicago',                label: 'Chicago (CT, UTC−6/−5)' },
  { value: 'America/Los_Angeles',            label: 'Los Angeles (PT, UTC−8/−7)' },
  { value: 'America/Denver',                 label: 'Denver (MT, UTC−7/−6)' },
  { value: 'Europe/Madrid',                  label: 'Madrid (CET, UTC+1/+2)' },
  { value: 'UTC',                            label: 'UTC (Universal, UTC+0)' },
];

// ─── Days of week ─────────────────────────────────────────────────────────────
const DAYS = [
  { key: 'Monday',    short: 'Lu' },
  { key: 'Tuesday',   short: 'Ma' },
  { key: 'Wednesday', short: 'Mi' },
  { key: 'Thursday',  short: 'Ju' },
  { key: 'Friday',    short: 'Vi' },
  { key: 'Saturday',  short: 'Sá' },
  { key: 'Sunday',    short: 'Do' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  full_name:   string;
  national_id: string;
  location:    string;
  timezone:    string;
}

interface FormErrors {
  full_name?:   string;
  national_id?: string;
  location?:    string;
  timezone?:    string;
}

interface ScheduleState {
  startTime:  string;   // "HH:mm"
  endTime:    string;   // "HH:mm"
  activeDays: string[]; // e.g. ['Monday','Tuesday',...]
}

interface VacationRow {
  id:        string;
  startDate: string; // "YYYY-MM-DD"
  endDate:   string; // "YYYY-MM-DD"
}

interface CreateLawyerModalProps {
  isOpen:         boolean;
  onClose:        () => void;
  /**
   * schedule and vacations are only sent in create mode.
   * In edit mode the arrays are empty.
   */
  onSubmit: (
    dto:       CreateLawyerDto,
    contacts:  ContactMethodInputI[],
    schedule:  ScheduleSlotInput[],
    vacations: VacationInput[],
  ) => Promise<void>;
  initialLawyer?: LawyerAPI;
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

const EMPTY_FORM: FormState = {
  full_name:   '',
  national_id: '',
  location:    '',
  timezone:    'America/Argentina/Buenos_Aires',
};

const EMPTY_SCHEDULE: ScheduleState = {
  startTime:  '09:00',
  endTime:    '18:00',
  activeDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
};

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.full_name.trim())
    errors.full_name = 'Full name is required.';
  else if (form.full_name.trim().length < 3)
    errors.full_name = 'Must be at least 3 characters.';
  if (!form.national_id.trim())
    errors.national_id = 'National ID is required.';
  else if (!/^[\d.\-/]+$/.test(form.national_id.trim()))
    errors.national_id = 'Only digits, dots, dashes and slashes are allowed.';
  if (!form.location.trim())
    errors.location = 'Location is required.';
  if (!form.timezone)
    errors.timezone = 'Please select a timezone.';
  return errors;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface FieldProps {
  label:    string;
  icon:     string;
  error?:   string;
  children: React.ReactNode;
}

function Field({ label, icon, error, children }: FieldProps) {
  return (
    <div className="form-field">
      <label className="form-field__label">
        <span className="material-symbols-outlined">{icon}</span>
        {label}
      </label>
      {children}
      {error && (
        <p className="form-field__error">
          <span className="material-symbols-outlined">error</span>
          {error}
        </p>
      )}
    </div>
  );
}

// ── Schedule section ──────────────────────────────────────────────────────────

interface ScheduleSectionProps {
  schedule:  ScheduleState;
  onChange:  (s: ScheduleState) => void;
}

function ScheduleSection({ schedule, onChange }: ScheduleSectionProps) {
  const toggleDay = (day: string) => {
    const active = schedule.activeDays.includes(day);
    onChange({
      ...schedule,
      activeDays: active
        ? schedule.activeDays.filter((d) => d !== day)
        : [...schedule.activeDays, day],
    });
  };

  return (
    <div className="section-card">
      <div className="section-card__header">
        <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>
          schedule
        </span>
        Horario de trabajo
        <span style={{ marginLeft: 'auto', fontWeight: 400, textTransform: 'none', letterSpacing: 'normal', opacity: 0.6 }}>
          Opcional
        </span>
      </div>
      <div className="section-card__body">
        {/* Entry / Exit times */}
        <div className="form-grid-2">
          <div className="form-field">
            <label className="form-field__label">
              <span className="material-symbols-outlined">login</span>
              Entrada
            </label>
            <input
              type="time"
              className="form-input"
              min="06:00"
              max="22:00"
              value={schedule.startTime}
              onChange={(e) => onChange({ ...schedule, startTime: e.target.value })}
            />
          </div>
          <div className="form-field">
            <label className="form-field__label">
              <span className="material-symbols-outlined">logout</span>
              Salida
            </label>
            <input
              type="time"
              className="form-input"
              min="06:00"
              max="22:00"
              value={schedule.endTime}
              onChange={(e) => onChange({ ...schedule, endTime: e.target.value })}
            />
          </div>
        </div>

        {/* Day pills */}
        <div>
          <p className="form-field__label" style={{ marginBottom: '0.5rem' }}>
            <span className="material-symbols-outlined">calendar_month</span>
            Días activos
          </p>
          <div className="day-pills">
            {DAYS.map(({ key, short }) => (
              <button
                key={key}
                type="button"
                onClick={() => toggleDay(key)}
                title={key}
                className={`day-pill${schedule.activeDays.includes(key) ? ' day-pill--active' : ''}`}
              >
                {short}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Vacations section ─────────────────────────────────────────────────────────

interface VacationsSectionProps {
  rows:     VacationRow[];
  onAdd:    () => void;
  onRemove: (id: string) => void;
  onChange: (id: string, field: 'startDate' | 'endDate', value: string) => void;
}

function VacationsSection({ rows, onAdd, onRemove, onChange }: VacationsSectionProps) {
  return (
    <div className="section-card">
      <div className="section-card__header">
        <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>
          beach_access
        </span>
        Vacaciones
        <span style={{ marginLeft: 'auto', fontWeight: 400, textTransform: 'none', letterSpacing: 'normal', opacity: 0.6 }}>
          Opcional
        </span>
        <button type="button" className="btn-add-row" onClick={onAdd} style={{ marginLeft: '0.5rem' }}>
          <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>add</span>
          Agregar
        </button>
      </div>
      <div className="section-card__body">
        {rows.length === 0 ? (
          <p className="vacation-empty">Sin períodos de vacaciones cargados.</p>
        ) : (
          <div className="vacation-rows">
            {rows.map((row) => (
              <div key={row.id} className="vacation-row">
                <div className="form-field">
                  <label className="form-field__label">
                    <span className="material-symbols-outlined">event</span>
                    Desde
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={row.startDate}
                    onChange={(e) => onChange(row.id, 'startDate', e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label className="form-field__label">
                    <span className="material-symbols-outlined">event</span>
                    Hasta
                  </label>
                  <input
                    type="date"
                    className="form-input"
                    value={row.endDate}
                    min={row.startDate || undefined}
                    onChange={(e) => onChange(row.id, 'endDate', e.target.value)}
                  />
                </div>
                <button
                  type="button"
                  className="btn-remove-row"
                  onClick={() => onRemove(row.id)}
                  title="Eliminar período"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
                    close
                  </span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────────────────

export default function CreateLawyerModal({
  isOpen,
  onClose,
  onSubmit,
  initialLawyer,
}: CreateLawyerModalProps) {
  const isEditMode = Boolean(initialLawyer);

  const [form, setForm]               = useState<FormState>(EMPTY_FORM);
  const [contacts, setContacts]       = useState<ContactsState>(EMPTY_CONTACTS);
  const [errors, setErrors]           = useState<FormErrors>({});
  const [submitting, setSubmitting]   = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Schedule & vacations state — only used in create mode
  const [schedule, setSchedule]       = useState<ScheduleState>(EMPTY_SCHEDULE);
  const [vacationRows, setVacationRows] = useState<VacationRow[]>([]);

  // ── Reset state when modal opens/closes ──────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setSubmitError(null);

    if (initialLawyer) {
      // Edit mode: populate existing lawyer data
      setForm({
        full_name:   initialLawyer.full_name,
        national_id: initialLawyer.national_id,
        location:    initialLawyer.location,
        timezone:    initialLawyer.timezone,
      });
      setContacts(EMPTY_CONTACTS);
      setLoadingContacts(true);
      contactApi
        .listByLawyer(initialLawyer.id_lawyer)
        .then((existing) => {
          const state = { ...EMPTY_CONTACTS };
          existing.forEach((c) => {
            state[c.method_type] = { enabled: true, value: c.value };
          });
          setContacts(state);
        })
        .catch(() => {})
        .finally(() => setLoadingContacts(false));
    } else {
      // Create mode: reset everything
      setForm(EMPTY_FORM);
      setContacts(EMPTY_CONTACTS);
      setSchedule(EMPTY_SCHEDULE);
      setVacationRows([]);
    }
  }, [isOpen, initialLawyer]);

  // ── Keyboard: Escape to close ────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // ── Field handlers ───────────────────────────────────────────────────────────
  const setField = useCallback(
    (field: keyof FormState) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [field]: e.target.value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      },
    [],
  );

  const toggleMethod = useCallback((type: MethodType) => {
    setContacts((prev) => ({
      ...prev,
      [type]: { ...prev[type], enabled: !prev[type].enabled, value: prev[type].enabled ? '' : prev[type].value },
    }));
  }, []);

  const setMethodValue = useCallback((type: MethodType, value: string) => {
    setContacts((prev) => ({ ...prev, [type]: { ...prev[type], value } }));
  }, []);

  // ── Vacation row handlers ────────────────────────────────────────────────────
  const handleAddVacation = useCallback(() => {
    setVacationRows((prev) => [
      ...prev,
      { id: `vac-${Date.now()}`, startDate: '', endDate: '' },
    ]);
  }, []);

  const handleRemoveVacation = useCallback((id: string) => {
    setVacationRows((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const handleVacationChange = useCallback(
    (id: string, field: 'startDate' | 'endDate', value: string) => {
      setVacationRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
      );
    },
    [],
  );

  // ── Derived ──────────────────────────────────────────────────────────────────
  const activeContacts  = getActiveContacts(contacts);
  const hasValidContact = activeContacts.length > 0;
  const canSubmit       = hasValidContact && !submitting && !loadingContacts;

  const initials = form.full_name
    .trim().split(/\s+/).slice(0, 2).map((n) => n[0]).join('').toUpperCase();

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validation = validate(form);
    if (Object.keys(validation).length > 0) { setErrors(validation); return; }
    if (!isEditMode && !hasValidContact) return;

    // Build schedule slots (only when both times and at least one day are set)
    const scheduleSlots: ScheduleSlotInput[] = [];
    if (!isEditMode && schedule.activeDays.length > 0 && schedule.startTime && schedule.endTime) {
      schedule.activeDays.forEach((day) => {
        scheduleSlots.push({
          dayOfWeek: day,
          startTime: `${schedule.startTime}:00`,
          endTime:   `${schedule.endTime}:00`,
        });
      });
    }

    // Build vacation inputs (only complete rows)
    const vacationInputs: VacationInput[] = isEditMode
      ? []
      : vacationRows
          .filter((r) => r.startDate && r.endDate)
          .map((r) => ({ startDate: r.startDate, endDate: r.endDate }));

    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(
        {
          full_name:   form.full_name.trim(),
          national_id: form.national_id.trim(),
          location:    form.location.trim(),
          timezone:    form.timezone,
        },
        activeContacts,
        scheduleSlots,
        vacationInputs,
      );
      onClose();
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-card">
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '3rem', height: '3rem',
              background: 'linear-gradient(135deg, var(--c-primary), var(--c-primary-container))',
              borderRadius: 'var(--r-xl)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span
                className="material-symbols-outlined"
                style={{ color: 'white', fontSize: '1.5rem', fontVariationSettings: "'FILL' 1" }}
              >
                {isEditMode ? 'edit' : 'person_add'}
              </span>
            </div>
            <div>
              <p className="eyebrow" style={{ color: 'var(--c-primary)', marginBottom: '0.125rem' }}>
                Management Portal
              </p>
              <h2 style={{
                fontFamily: 'var(--font-headline)', fontWeight: 800,
                color: 'var(--c-on-surface)', fontSize: '1.5rem', letterSpacing: '-0.02em',
              }}>
                {isEditMode ? 'Edit Practitioner' : 'New Practitioner'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* ── Scrollable form body ─────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body">

            {/* Full Name */}
            <Field label="Full Name" icon="badge" error={errors.full_name}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Horacio Altamirano"
                value={form.full_name}
                onChange={setField('full_name')}
                autoFocus
              />
            </Field>

            {/* National ID + Location */}
            <div className="form-grid-2">
              <Field label="National ID (DNI)" icon="fingerprint" error={errors.national_id}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 28.495.102"
                  value={form.national_id}
                  onChange={setField('national_id')}
                />
              </Field>
              <Field label="Location" icon="location_on" error={errors.location}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Buenos Aires, AR"
                  value={form.location}
                  onChange={setField('location')}
                />
              </Field>
            </div>

            {/* Timezone */}
            <Field label="Timezone" icon="schedule" error={errors.timezone}>
              <div className="form-select-wrap">
                <select
                  className="form-select"
                  value={form.timezone}
                  onChange={setField('timezone')}
                >
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>
            </Field>

            {/* ── Contact Methods ──────────────────────────────────────────── */}
            {loadingContacts ? (
              <div className="loading-contacts">
                <span className="material-symbols-outlined anim-spin">progress_activity</span>
                Loading contact methods…
              </div>
            ) : (
              <ContactMethodsSection
                contacts={contacts}
                onToggle={toggleMethod}
                onValueChange={setMethodValue}
                activeCount={activeContacts.length}
              />
            )}

            {/* ── Working Schedule (create mode only) ──────────────────────── */}
            {!isEditMode && (
              <ScheduleSection schedule={schedule} onChange={setSchedule} />
            )}

            {/* ── Vacations (create mode only) ─────────────────────────────── */}
            {!isEditMode && (
              <VacationsSection
                rows={vacationRows}
                onAdd={handleAddVacation}
                onRemove={handleRemoveVacation}
                onChange={handleVacationChange}
              />
            )}

            {/* Server error */}
            {submitError && (
              <div className="error-box">
                <span className="material-symbols-outlined">error</span>
                {submitError}
              </div>
            )}
          </div>

          {/* ── Footer ──────────────────────────────────────────────────────── */}
          <div className="modal-footer modal-footer--between">
            {form.full_name.trim() ? (
              <div className="preview-initials">
                <div className="preview-initials__avatar">{initials}</div>
                <span className="preview-initials__name">{form.full_name.trim()}</span>
              </div>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--c-outline)' }}>
                Fill the form to preview
              </span>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" onClick={onClose} className="btn-secondary">
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                title={!isEditMode && !hasValidContact ? 'Add at least one contact method' : undefined}
                className="btn-primary"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined anim-spin">progress_activity</span>
                    Saving…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined">
                      {isEditMode ? 'save' : 'person_add'}
                    </span>
                    {isEditMode ? 'Save Changes' : 'Add Practitioner'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
