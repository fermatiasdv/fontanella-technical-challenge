/**
 * CreateLawyerModal — create & edit mode
 */

import { useState, useCallback, useEffect } from 'react';
import type { FormEvent } from 'react';
import type { CreateLawyerDto, LawyerAPI } from '../../types/lawyer';
import { contactApi } from '../../api/contact';
import type { MethodType } from '../../api/contact';
import ContactMethodsSection, {
  EMPTY_CONTACTS,
  getActiveContacts,
} from '../common/ContactMethodsSection';
import type { ContactMethodInput, ContactsState } from '../common/ContactMethodsSection';

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

interface CreateLawyerModalProps {
  isOpen:         boolean;
  onClose:        () => void;
  onSubmit:       (dto: CreateLawyerDto, contacts: ContactMethodInput[]) => Promise<void>;
  initialLawyer?: LawyerAPI;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_FORM: FormState = {
  full_name:   '',
  national_id: '',
  location:    '',
  timezone:    'America/Argentina/Buenos_Aires',
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

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setSubmitError(null);

    if (initialLawyer) {
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
      setForm(EMPTY_FORM);
      setContacts(EMPTY_CONTACTS);
    }
  }, [isOpen, initialLawyer]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

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

  const activeContacts  = getActiveContacts(contacts);
  const hasValidContact = activeContacts.length > 0;
  const canSubmit       = hasValidContact && !submitting && !loadingContacts;

  const initials = form.full_name
    .trim().split(/\s+/).slice(0, 2).map((n) => n[0]).join('').toUpperCase();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validation = validate(form);
    if (Object.keys(validation).length > 0) { setErrors(validation); return; }
    if (!isEditMode && !hasValidContact) return;

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
