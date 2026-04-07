/**
 * CreateLawyerModal — create & edit mode
 *
 * Create fields: full_name | national_id | location | timezone
 *   + Contact Methods: InPerson | VideoCall | PhoneCall (at least 1 required on create)
 *
 * Edit mode (initialLawyer prop provided):
 *   - Pre-fills the form fields
 *   - Hides the Contact Methods section (contacts are managed separately)
 *   - Submit calls onSubmit with the updated DTO
 *
 * Design rules (DESIGN.md):
 *  - Glassmorphism backdrop
 *  - surface-container-lowest card, ambient shadow
 *  - Inputs: surface-container-high fill, no border, 2px primary left-accent on focus
 *  - Primary CTA: gradient primary → primary-container
 */

import { useState, useCallback, useEffect } from 'react';
import type { FormEvent } from 'react';
import type { CreateLawyerDto, LawyerAPI } from '../../types/lawyer';
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
  /** Create mode: receives (dto, contacts). Edit mode: receives (dto, []) */
  onSubmit:       (dto: CreateLawyerDto, contacts: ContactMethodInput[]) => Promise<void>;
  /** When provided, opens in edit mode (no contact section) */
  initialLawyer?: LawyerAPI;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_FORM: FormState = {
  full_name:   '',
  national_id: '',
  location:    '',
  timezone:    'America/Argentina/Buenos_Aires',
};

// ─── Shared styles ────────────────────────────────────────────────────────────

const inputBase =
  'w-full bg-surface-container-high rounded-lg px-4 py-3 text-sm text-on-surface ' +
  'placeholder:text-outline outline-none transition-all ' +
  'focus:bg-surface-container-highest focus:ring-0 focus:shadow-[inset_2px_0_0_0_#005bbf]';

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
    <div className="space-y-1.5">
      <label className="all-caps-label text-on-surface-variant font-bold flex items-center gap-2">
        <span className="material-symbols-outlined text-sm text-outline">{icon}</span>
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs text-error flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">error</span>
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

  const [form, setForm]             = useState<FormState>(EMPTY_FORM);
  const [contacts, setContacts]     = useState<ContactsState>(EMPTY_CONTACTS);
  const [errors, setErrors]         = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Seed form on open
  useEffect(() => {
    if (isOpen) {
      setForm(
        initialLawyer
          ? {
              full_name:   initialLawyer.full_name,
              national_id: initialLawyer.national_id,
              location:    initialLawyer.location,
              timezone:    initialLawyer.timezone,
            }
          : EMPTY_FORM,
      );
      setContacts(EMPTY_CONTACTS);
      setErrors({});
      setSubmitError(null);
    }
  }, [isOpen, initialLawyer]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // ─── Handlers ──────────────────────────────────────────────────────────
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

  // ─── Derived ───────────────────────────────────────────────────────────
  const activeContacts  = getActiveContacts(contacts);
  const hasValidContact = activeContacts.length > 0;
  // In edit mode contacts are not required
  const canSubmit = (isEditMode || hasValidContact) && !submitting;

  const initials = form.full_name
    .trim().split(/\s+/).slice(0, 2).map((n) => n[0]).join('').toUpperCase();

  // ─── Submit ────────────────────────────────────────────────────────────
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
        isEditMode ? [] : activeContacts,
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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-on-surface/20 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg mx-4 bg-surface-container-lowest rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
        style={{ boxShadow: '0 12px 40px rgba(25, 28, 29, 0.12)' }}
      >
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="px-8 pt-8 pb-6 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center shadow-sm">
              <span
                className="material-symbols-outlined text-white text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {isEditMode ? 'edit' : 'person_add'}
              </span>
            </div>
            <div>
              <p className="all-caps-label text-primary font-bold mb-0.5">Management Portal</p>
              <h2 className="editorial-headline text-on-surface text-2xl font-extrabold">
                {isEditMode ? 'Edit Practitioner' : 'New Practitioner'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-outline hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* ── Scrollable form body ─────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 overflow-hidden">
          <div className="px-8 pb-2 space-y-5 overflow-y-auto flex-1">

            {/* Full Name */}
            <Field label="Full Name" icon="badge" error={errors.full_name}>
              <input
                type="text"
                className={inputBase}
                placeholder="e.g. Horacio Altamirano"
                value={form.full_name}
                onChange={setField('full_name')}
                autoFocus
              />
            </Field>

            {/* National ID + Location */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="National ID (DNI)" icon="fingerprint" error={errors.national_id}>
                <input
                  type="text"
                  className={inputBase}
                  placeholder="e.g. 28.495.102"
                  value={form.national_id}
                  onChange={setField('national_id')}
                />
              </Field>
              <Field label="Location" icon="location_on" error={errors.location}>
                <input
                  type="text"
                  className={inputBase}
                  placeholder="e.g. Buenos Aires, AR"
                  value={form.location}
                  onChange={setField('location')}
                />
              </Field>
            </div>

            {/* Timezone */}
            <Field label="Timezone" icon="schedule" error={errors.timezone}>
              <select
                className={inputBase + ' cursor-pointer appearance-none'}
                value={form.timezone}
                onChange={setField('timezone')}
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz.value} value={tz.value}>{tz.label}</option>
                ))}
              </select>
            </Field>

            {/* ── Contact Methods (create mode only) ──────────────────────── */}
            {!isEditMode && (
              <ContactMethodsSection
                contacts={contacts}
                onToggle={toggleMethod}
                onValueChange={setMethodValue}
                activeCount={activeContacts.length}
              />
            )}

            {/* Server error */}
            {submitError && (
              <div className="bg-error-container text-on-error-container rounded-lg px-4 py-3 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                {submitError}
              </div>
            )}
          </div>

          {/* ── Footer ──────────────────────────────────────────────────────── */}
          <div className="px-8 py-6 shrink-0 flex items-center justify-between gap-3 border-t border-surface-container">
            {/* Initials preview */}
            {form.full_name.trim() ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-headline font-bold text-sm">
                  {initials}
                </div>
                <span className="text-xs text-on-surface-variant font-medium truncate max-w-[140px]">
                  {form.full_name.trim()}
                </span>
              </div>
            ) : (
              <span className="text-xs text-outline">Fill the form to preview</span>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-surface-container-high text-on-surface rounded-lg text-sm font-bold hover:bg-surface-container-highest transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit}
                title={!isEditMode && !hasValidContact ? 'Add at least one contact method' : undefined}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-container text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                    Saving…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">
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
