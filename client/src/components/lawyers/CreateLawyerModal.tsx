/**
 * CreateLawyerModal — create (2-step) & edit (2-step) mode
 *
 * CREATE — Step 1: datos básicos + métodos de contacto
 *        — Step 2: horario laboral por día (requerido) + vacaciones (opcional)
 * EDIT   — Step 1: datos básicos + métodos de contacto  (precargados)
 *        — Step 2: horario laboral + vacaciones          (precargados)
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
import { workingScheduleApi } from '../../api/workingSchedule';
import { vacationsApi } from '../../api/vacations';
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
const DAYS: { key: string; short: string; label: string }[] = [
  { key: 'Monday',    short: 'Lu', label: 'Lunes'     },
  { key: 'Tuesday',   short: 'Ma', label: 'Martes'    },
  { key: 'Wednesday', short: 'Mi', label: 'Miércoles' },
  { key: 'Thursday',  short: 'Ju', label: 'Jueves'    },
  { key: 'Friday',    short: 'Vi', label: 'Viernes'   },
  { key: 'Saturday',  short: 'Sá', label: 'Sábado'    },
  { key: 'Sunday',    short: 'Do', label: 'Domingo'   },
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

/** Per-day schedule entry. Times are preserved even when active = false. */
interface DaySchedule {
  active:    boolean;
  startTime: string; // "HH:mm"
  endTime:   string; // "HH:mm"
}

/** Full weekly schedule: one entry per day key. */
type ScheduleState = Record<string, DaySchedule>;

interface VacationRow {
  id:        string;
  startDate: string; // "YYYY-MM-DD"
  endDate:   string; // "YYYY-MM-DD"
}

interface CreateLawyerModalProps {
  isOpen:         boolean;
  onClose:        () => void;
  /**
   * schedule and vacations are only sent in create mode (step 2).
   * In edit mode the arrays are always empty.
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
  Monday:    { active: true,  startTime: '09:00', endTime: '18:00' },
  Tuesday:   { active: true,  startTime: '09:00', endTime: '18:00' },
  Wednesday: { active: true,  startTime: '09:00', endTime: '18:00' },
  Thursday:  { active: true,  startTime: '09:00', endTime: '18:00' },
  Friday:    { active: true,  startTime: '09:00', endTime: '18:00' },
  Saturday:  { active: false, startTime: '09:00', endTime: '18:00' },
  Sunday:    { active: false, startTime: '09:00', endTime: '18:00' },
};

// ─── Validation ───────────────────────────────────────────────────────────────

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.full_name.trim())
    errors.full_name = 'El nombre es requerido.';
  else if (form.full_name.trim().length < 3)
    errors.full_name = 'Debe tener al menos 3 caracteres.';
  if (!form.national_id.trim())
    errors.national_id = 'El DNI es requerido.';
  else if (!/^[\d.\-/]+$/.test(form.national_id.trim()))
    errors.national_id = 'Solo dígitos, puntos, guiones y barras.';
  if (!form.location.trim())
    errors.location = 'La ubicación es requerida.';
  if (!form.timezone)
    errors.timezone = 'Seleccioná un huso horario.';
  return errors;
}

/** Real-time readiness check for step 1 (no side-effects). */
function isStep1Ready(form: FormState, hasValidContact: boolean): boolean {
  return (
    form.full_name.trim().length >= 3 &&
    /^[\d.\-/]+$/.test(form.national_id.trim()) &&
    form.location.trim().length > 0 &&
    Boolean(form.timezone) &&
    hasValidContact
  );
}

/** At least one day must be active with both times set. */
function scheduleIsValid(schedule: ScheduleState): boolean {
  return Object.values(schedule).some(
    (d) => d.active && Boolean(d.startTime) && Boolean(d.endTime),
  );
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

// ── Step indicator ────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: 1 | 2 }) {
  return (
    <div className="step-indicator">
      <div className={`step-dot${current === 1 ? ' step-dot--active' : ' step-dot--done'}`}>
        {current > 1
          ? <span className="material-symbols-outlined" style={{ fontSize: '0.75rem', fontVariationSettings: "'FILL' 1" }}>check</span>
          : '1'}
      </div>
      <div className={`step-line${current === 2 ? ' step-line--active' : ''}`} />
      <div className={`step-dot${current === 2 ? ' step-dot--active' : ''}`}>2</div>
    </div>
  );
}

// ── Schedule section ──────────────────────────────────────────────────────────

interface ScheduleSectionProps {
  schedule:       ScheduleState;
  onChange:       (s: ScheduleState) => void;
  scheduleError?: string;
}

function ScheduleSection({ schedule, onChange, scheduleError }: ScheduleSectionProps) {
  const [selectedKey, setSelectedKey] = useState<string>('Monday');

  const current = schedule[selectedKey] ?? { active: false, startTime: '09:00', endTime: '18:00' };
  const selectedLabel = DAYS.find((d) => d.key === selectedKey)?.label ?? selectedKey;

  const setDayField = (field: keyof DaySchedule, value: boolean | string) => {
    onChange({ ...schedule, [selectedKey]: { ...current, [field]: value } });
  };

  return (
    <div className={`section-card${scheduleError ? ' section-card--error' : ''}`}>
      <div className="section-card__header">
        <span className="material-symbols-outlined" style={{ fontSize: '0.875rem' }}>
          schedule
        </span>
        Horario de trabajo
        <span style={{ marginLeft: 'auto', fontWeight: 400, textTransform: 'none', letterSpacing: 'normal', color: 'var(--c-error)', opacity: 0.8 }}>
          Requerido
        </span>
      </div>

      <div className="section-card__body">

        {/* ── Day selector row ────────────────────────────────────────────── */}
        <div className="day-selector">
          {DAYS.map(({ key, short }) => {
            const day   = schedule[key];
            const isSelected = key === selectedKey;
            const isLoaded   = day?.active === true;

            let pillClass = 'day-selector__pill';
            if (isSelected) pillClass += ' day-selector__pill--selected';
            else if (isLoaded) pillClass += ' day-selector__pill--loaded';

            return (
              <button
                key={key}
                type="button"
                title={DAYS.find((d) => d.key === key)?.label}
                className={pillClass}
                onClick={() => setSelectedKey(key)}
              >
                <span className={`day-selector__dot${isLoaded ? ' day-selector__dot--active' : ''}`} />
                {short}
              </button>
            );
          })}
        </div>

        {/* ── Day editor panel ────────────────────────────────────────────── */}
        <div className="day-editor">
          <div className="day-editor__header">
            <span className="day-editor__title">{selectedLabel}</span>
            <label className="day-editor__toggle">
              <input
                type="checkbox"
                checked={current.active}
                onChange={(e) => setDayField('active', e.target.checked)}
              />
              <span>Trabaja este día</span>
            </label>
          </div>

          {current.active ? (
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
                  value={current.startTime}
                  onChange={(e) => setDayField('startTime', e.target.value)}
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
                  value={current.endTime}
                  onChange={(e) => setDayField('endTime', e.target.value)}
                />
              </div>
            </div>
          ) : (
            <p className="day-editor__rest">
              <span className="material-symbols-outlined">block</span>
              Sin citas disponibles este día.
            </p>
          )}
        </div>

        {scheduleError && (
          <p className="form-field__error">
            <span className="material-symbols-outlined">error</span>
            {scheduleError}
          </p>
        )}
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

  const [step, setStep]                       = useState<1 | 2>(1);
  const [form, setForm]                       = useState<FormState>(EMPTY_FORM);
  const [contacts, setContacts]               = useState<ContactsState>(EMPTY_CONTACTS);
  const [errors, setErrors]                   = useState<FormErrors>({});
  const [scheduleError, setScheduleError]     = useState<string | undefined>(undefined);
  const [submitting, setSubmitting]           = useState(false);
  const [submitError, setSubmitError]         = useState<string | null>(null);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  const [schedule, setSchedule]         = useState<ScheduleState>(EMPTY_SCHEDULE);
  const [vacationRows, setVacationRows] = useState<VacationRow[]>([]);

  // ── Reset on open ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    setStep(1);
    setErrors({});
    setScheduleError(undefined);
    setSubmitError(null);

    if (initialLawyer) {
      // ── Basic fields ──────────────────────────────────────────────────────
      setForm({
        full_name:   initialLawyer.full_name,
        national_id: initialLawyer.national_id,
        location:    initialLawyer.location,
        timezone:    initialLawyer.timezone,
      });

      // ── Contacts ──────────────────────────────────────────────────────────
      setContacts(EMPTY_CONTACTS);
      setLoadingContacts(true);
      contactApi
        .listByLawyer(initialLawyer.id_lawyer)
        .then((existing) => {
          const state = { ...EMPTY_CONTACTS };
          existing.forEach((c) => { state[c.method_type] = { enabled: true, value: c.value }; });
          setContacts(state);
        })
        .catch(() => {})
        .finally(() => setLoadingContacts(false));

      // ── Working schedule ──────────────────────────────────────────────────
      setSchedule(EMPTY_SCHEDULE);
      setLoadingSchedule(true);
      workingScheduleApi
        .getByLawyer(initialLawyer.id_lawyer)
        .then((slots) => {
          const s: ScheduleState = DAYS.reduce<ScheduleState>((acc, { key }) => {
            acc[key] = { active: false, startTime: '09:00', endTime: '18:00' };
            return acc;
          }, {});
          slots.forEach((slot) => {
            s[slot.day_of_week] = {
              active:    true,
              startTime: slot.start_time.slice(0, 5), // "HH:mm:ss" → "HH:mm"
              endTime:   slot.end_time.slice(0, 5),
            };
          });
          setSchedule(s);
        })
        .catch(() => {})
        .finally(() => setLoadingSchedule(false));

      // ── Vacations ─────────────────────────────────────────────────────────
      setVacationRows([]);
      vacationsApi
        .getByLawyer(initialLawyer.id_lawyer)
        .then((vacs) => {
          setVacationRows(
            vacs.map((v) => ({
              id:        `vac-${v.id_vacation}`,
              startDate: v.start_date,
              endDate:   v.end_date,
            })),
          );
        })
        .catch(() => {});
    } else {
      setForm(EMPTY_FORM);
      setContacts(EMPTY_CONTACTS);
      setSchedule(EMPTY_SCHEDULE);
      setVacationRows([]);
    }
  }, [isOpen, initialLawyer]);

  // ── Escape to close ──────────────────────────────────────────────────────────
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

  // ── Vacation handlers ────────────────────────────────────────────────────────
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
  const activeContacts   = getActiveContacts(contacts);
  const hasValidContact  = activeContacts.length > 0;
  const hasValidSchedule = scheduleIsValid(schedule);

  const canGoNext = isStep1Ready(form, hasValidContact) && !loadingContacts && !loadingSchedule;
  const canSubmit = hasValidSchedule && !submitting;

  const initials = form.full_name
    .trim().split(/\s+/).slice(0, 2).map((n) => n[0]).join('').toUpperCase();

  // ── Step 1 → 2 ──────────────────────────────────────────────────────────────
  const handleNext = (e: FormEvent) => {
    e.preventDefault();
    const validation = validate(form);
    if (Object.keys(validation).length > 0) { setErrors(validation); return; }
    if (!hasValidContact) return;
    setStep(2);
  };

  // ── Final submit ─────────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!hasValidSchedule) {
      setScheduleError('Activá al menos un día y completá los horarios de entrada y salida.');
      return;
    }

    // Build schedule slots — only active days with valid times
    const scheduleSlots: ScheduleSlotInput[] = Object.entries(schedule)
      .filter(([, d]) => d.active && d.startTime && d.endTime)
      .map(([day, d]) => ({
        dayOfWeek: day,
        startTime: `${d.startTime}:00`,
        endTime:   `${d.endTime}:00`,
      }));

    // Build vacation inputs — only complete rows
    const vacationInputs: VacationInput[] = vacationRows
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

  const currentStep = step;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-card">

        {/* ── Header ────────────────────────────────────────────────────────── */}
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

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.625rem' }}>
            <StepIndicator current={currentStep} />
            <button onClick={onClose} className="btn-icon" aria-label="Close">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>

        {/* ── Form ──────────────────────────────────────────────────────────── */}
        <form
          onSubmit={currentStep === 1 ? handleNext : handleSubmit}
          noValidate
          style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}
        >
          <div className="modal-body">

            {/* ── Step 1 ────────────────────────────────────────────────────── */}
            {currentStep === 1 && (
              <>
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
              </>
            )}

            {/* ── Step 2 ────────────────────────────────────────────────────── */}
            {currentStep === 2 && (
              <>
                <ScheduleSection
                  schedule={schedule}
                  onChange={(s) => { setSchedule(s); setScheduleError(undefined); }}
                  scheduleError={scheduleError}
                />
                <VacationsSection
                  rows={vacationRows}
                  onAdd={handleAddVacation}
                  onRemove={handleRemoveVacation}
                  onChange={handleVacationChange}
                />
              </>
            )}

            {/* Server error */}
            {submitError && (
              <div className="error-box">
                <span className="material-symbols-outlined">error</span>
                {submitError}
              </div>
            )}
          </div>

          {/* ── Footer ────────────────────────────────────────────────────────── */}
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
              {currentStep === 2 ? (
                <button type="button" onClick={() => setStep(1)} className="btn-secondary">
                  <span className="material-symbols-outlined">arrow_back</span>
                  Volver
                </button>
              ) : (
                <button type="button" onClick={onClose} className="btn-secondary">
                  Cancelar
                </button>
              )}

              {currentStep === 1 && (
                <button type="submit" disabled={!canGoNext} className="btn-primary">
                  Siguiente
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
              )}

              {currentStep === 2 && (
                <button type="submit" disabled={!canSubmit} className="btn-primary">
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined anim-spin">progress_activity</span>
                      Guardando…
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">
                        {isEditMode ? 'save' : 'person_add'}
                      </span>
                      {isEditMode ? 'Guardar cambios' : 'Add Practitioner'}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
