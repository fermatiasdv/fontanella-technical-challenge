/**
 * AddClientModal
 *
 * Fields: company_id | trade_name | location | timezone
 *       + Contact Methods (InPerson select, VideoCall / PhoneCall inputs)
 *
 * onSubmit receives (clientDto, contacts[]) — parent handles both API calls.
 */

import { useState, useCallback, useEffect } from 'react';
import type { FormEvent } from 'react';
import type { CreateClientDto } from '../../types/client';
import type { MethodType } from '../../api/contact';
import ContactMethodsSection, {
  EMPTY_CONTACTS,
  getActiveContacts,
} from '../common/ContactMethodsSection';
import type { ContactsState } from '../common/ContactMethodsSection';

// ─── Re-export so other files that import from here still work ────────────────
export type { ContactMethodInput } from '../common/ContactMethodsSection';

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
  company_id: string;
  trade_name: string;
  location:   string;
  timezone:   string;
}

interface FormErrors {
  company_id?: string;
  trade_name?: string;
  location?:   string;
  timezone?:   string;
}

export interface AddClientModalProps {
  isOpen:   boolean;
  onClose:  () => void;
  onSubmit: (dto: CreateClientDto, contacts: ContactMethodInput[]) => Promise<void>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EMPTY_FORM: FormState = {
  company_id: '',
  trade_name: '',
  location:   '',
  timezone:   'America/Argentina/Buenos_Aires',
};

const inputBase =
  'w-full bg-surface-container-high rounded-lg px-4 py-3 text-sm text-on-surface ' +
  'placeholder:text-outline outline-none transition-all ' +
  'focus:bg-surface-container-highest focus:ring-0 focus:shadow-[inset_2px_0_0_0_#005bbf]';

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.company_id.trim()) errors.company_id = 'Company ID is required.';
  if (!form.trade_name.trim()) errors.trade_name = 'Trade name is required.';
  else if (form.trade_name.trim().length < 2) errors.trade_name = 'Must be at least 2 characters.';
  if (!form.location.trim()) errors.location = 'Location is required.';
  if (!form.timezone) errors.timezone = 'Please select a timezone.';
  return errors;
}

// ─── Field ────────────────────────────────────────────────────────────────────

interface FieldProps { label: string; icon: string; error?: string; children: React.ReactNode; }

function Field({ label, icon, error, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
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

export default function AddClientModal({ isOpen, onClose, onSubmit }: AddClientModalProps) {
  const [form, setForm]             = useState<FormState>(EMPTY_FORM);
  const [contacts, setContacts]     = useState<ContactsState>(EMPTY_CONTACTS);
  const [errors, setErrors]         = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) { setForm(EMPTY_FORM); setContacts(EMPTY_CONTACTS); setErrors({}); setSubmitError(null); }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  const setField = useCallback(
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }, [],
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
  const canSubmit       = hasValidContact && !submitting;

  const initials = form.trade_name.trim().split(/\s+/).slice(0, 2).map((n) => n[0]).join('').toUpperCase();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validation = validate(form);
    if (Object.keys(validation).length > 0) { setErrors(validation); return; }
    if (!hasValidContact) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit(
        { company_id: form.company_id.trim(), trade_name: form.trade_name.trim(), location: form.location.trim(), timezone: form.timezone },
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
      className="fixed inset-0 z-[60] flex items-center justify-center bg-on-surface/20 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg mx-4 bg-surface-container-lowest rounded-2xl overflow-hidden max-h-[90vh] flex flex-col"
        style={{ boxShadow: '0 12px 40px rgba(25, 28, 29, 0.12)' }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 flex items-start justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>domain_add</span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">Client Management</p>
              <h2 className="font-headline text-on-surface text-2xl font-extrabold tracking-tight">New Client</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-outline hover:text-on-surface hover:bg-surface-container-high rounded-lg transition-colors" aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 overflow-hidden">
          <div className="px-8 pb-2 space-y-5 overflow-y-auto flex-1">

            <Field label="Trade Name" icon="badge" error={errors.trade_name}>
              <input type="text" className={inputBase} placeholder="e.g. Stark Industries"
                value={form.trade_name} onChange={setField('trade_name')} autoFocus />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Company ID" icon="tag" error={errors.company_id}>
                <input type="text" className={inputBase} placeholder="e.g. CORP-101"
                  value={form.company_id} onChange={setField('company_id')} />
              </Field>
              <Field label="Location" icon="location_on" error={errors.location}>
                <input type="text" className={inputBase} placeholder="e.g. Los Angeles, USA"
                  value={form.location} onChange={setField('location')} />
              </Field>
            </div>

            <Field label="Timezone" icon="schedule" error={errors.timezone}>
              <select className={inputBase + ' cursor-pointer appearance-none'} value={form.timezone} onChange={setField('timezone')}>
                {TIMEZONE_OPTIONS.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
              </select>
            </Field>

            <ContactMethodsSection
              contacts={contacts}
              onToggle={toggleMethod}
              onValueChange={setMethodValue}
              activeCount={activeContacts.length}
            />

            {submitError && (
              <div className="bg-error-container text-on-error-container rounded-lg px-4 py-3 text-sm flex items-center gap-2">
                <span className="material-symbols-outlined text-base">error</span>
                {submitError}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-8 py-6 shrink-0 flex items-center justify-between gap-3 border-t border-surface-container">
            {form.trade_name.trim() ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-fixed flex items-center justify-center text-primary font-headline font-bold text-sm">{initials}</div>
                <span className="text-xs text-on-surface-variant font-medium truncate max-w-[130px]">{form.trade_name.trim()}</span>
              </div>
            ) : (
              <span className="text-xs text-outline">Fill the form to preview</span>
            )}
            <div className="flex gap-3">
              <button type="button" onClick={onClose}
                className="px-5 py-2.5 bg-surface-container-high text-on-surface rounded-lg text-sm font-bold hover:bg-surface-container-highest transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={!canSubmit}
                title={!hasValidContact ? 'Add at least one contact method' : undefined}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-container text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100">
                {submitting
                  ? <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span>Saving…</>
                  : <><span className="material-symbols-outlined text-base">domain_add</span>Add Client</>
                }
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
