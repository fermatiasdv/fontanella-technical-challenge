/**
 * CreateLawyerModal
 *
 * Fields match CreateLawyerDto exactly:
 *   full_name | national_id | location | timezone
 *
 * Design rules (from DESIGN.md):
 *  - Glassmorphism backdrop (backdrop-blur-sm + bg-on-surface/20)
 *  - Modal card: surface-container-lowest, ambient shadow (no drop-shadow on cards)
 *  - Inputs: surface-container-high fill, no border, 2px primary left-accent on focus
 *  - Primary CTA: gradient primary → primary-container
 *  - No dividers — use spacing and tonal shifts
 */

import { useState, useCallback, useEffect} from 'react';
import type { FormEvent } from 'react';
import type { CreateLawyerDto } from '../../types/lawyer';

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
  { value: 'Europe/Madrid',                  label: 'Madrid (CET, UTC+1/+2)' },
  { value: 'UTC',                            label: 'UTC (Universal, UTC+0)' },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormState {
  full_name: string;
  national_id: string;
  location: string;
  timezone: string;
}

interface FormErrors {
  full_name?: string;
  national_id?: string;
  location?: string;
  timezone?: string;
}

interface CreateLawyerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateLawyerDto) => Promise<void>;
}

// ─── Field sub-component ──────────────────────────────────────────────────────

interface FieldProps {
  label: string;
  icon: string;
  error?: string;
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

// ─── Input style (shared) ─────────────────────────────────────────────────────
// Per design system: surface-container-high fill, no border, focus = primary left accent
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

// ─── Modal ────────────────────────────────────────────────────────────────────

const EMPTY_FORM: FormState = {
  full_name:   '',
  national_id: '',
  location:    '',
  timezone:    'America/Argentina/Buenos_Aires',
};

export default function CreateLawyerModal({ isOpen, onClose, onSubmit }: CreateLawyerModalProps) {
  const [form, setForm]         = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors]     = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reset state when the modal opens
  useEffect(() => {
    if (isOpen) {
      setForm(EMPTY_FORM);
      setErrors({});
      setSubmitError(null);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const set = useCallback((field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear the field error as the user types
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validation = validate(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        full_name:   form.full_name.trim(),
        national_id: form.national_id.trim(),
        location:    form.location.trim(),
        timezone:    form.timezone,
      });
      onClose();
    } catch (err) {
      setSubmitError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-on-surface/20 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal card — ambient lift shadow, no drop-shadow per design system */}
      <div
        className="w-full max-w-lg mx-4 bg-surface-container-lowest rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 12px 40px rgba(25, 28, 29, 0.12)' }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="px-8 pt-8 pb-6 flex items-start justify-between">
          <div className="flex items-center gap-4">
            {/* Icon badge */}
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center shadow-sm">
              <span
                className="material-symbols-outlined text-white text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                person_add
              </span>
            </div>
            <div>
              <p className="all-caps-label text-primary font-bold mb-0.5">Management Portal</p>
              <h2 className="editorial-headline text-on-surface text-2xl font-extrabold">
                New Practitioner
              </h2>
            </div>
          </div>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 text-outline hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* ── Form ───────────────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="px-8 pb-6 space-y-5">

            {/* Full Name */}
            <Field label="Full Name" icon="badge" error={errors.full_name}>
              <input
                type="text"
                className={inputBase}
                placeholder="e.g. Horacio Altamirano"
                value={form.full_name}
                onChange={set('full_name')}
                autoFocus
              />
            </Field>

            {/* Two-column row: DNI + Location */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="National ID (DNI)" icon="fingerprint" error={errors.national_id}>
                <input
                  type="text"
                  className={inputBase}
                  placeholder="e.g. 28.495.102"
                  value={form.national_id}
                  onChange={set('national_id')}
                />
              </Field>

              <Field label="Location" icon="location_on" error={errors.location}>
                <input
                  type="text"
                  className={inputBase}
                  placeholder="e.g. Buenos Aires, AR"
                  value={form.location}
                  onChange={set('location')}
                />
              </Field>
            </div>

            {/* Timezone */}
            <Field label="Timezone" icon="schedule" error={errors.timezone}>
              <select
                className={inputBase + ' cursor-pointer appearance-none'}
                value={form.timezone}
                onChange={set('timezone')}
              >
                {TIMEZONE_OPTIONS.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </Field>

            {/* Server error */}
            {submitError && (
              <div className="bg-error-container text-on-error-container rounded-lg px-4 py-3 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                {submitError}
              </div>
            )}
          </div>

          {/* ── Footer ─────────────────────────────────────────────────────── */}
          <div className="px-8 pb-8 flex items-center justify-between gap-3">
            {/* Preview of initials badge */}
            {form.full_name.trim() ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-headline font-bold text-sm">
                  {form.full_name
                    .trim()
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()}
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
                disabled={submitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-container text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <span className="material-symbols-outlined text-base animate-spin">
                      progress_activity
                    </span>
                    Saving…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-base">person_add</span>
                    Add Practitioner
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
