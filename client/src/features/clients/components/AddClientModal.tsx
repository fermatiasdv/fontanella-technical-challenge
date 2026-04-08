import { useState, useCallback, useEffect } from 'react';
import type { FormEvent } from 'react';
import type { CreateClientDto } from '@/features/clients/types/client.types';
import type { MethodType } from '@/shared/types/common.types';
import {
  ContactMethodsSection,
  EMPTY_CONTACTS,
  getActiveContacts,
} from '@/shared/components/ContactMethodsSection';
import type { ContactsState } from '@/shared/components/ContactMethodsSection';

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

interface FormState { company_id: string; trade_name: string; location: string; timezone: string; }
interface FormErrors { company_id?: string; trade_name?: string; location?: string; timezone?: string; }

export interface AddClientModalProps {
  isOpen:   boolean;
  onClose:  () => void;
  onSubmit: (dto: CreateClientDto, contacts: ReturnType<typeof getActiveContacts>) => Promise<void>;
}

const EMPTY_FORM: FormState = { company_id: '', trade_name: '', location: '', timezone: 'America/Argentina/Buenos_Aires' };

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.company_id.trim()) errors.company_id = 'Company ID is required.';
  if (!form.trade_name.trim()) errors.trade_name = 'Trade name is required.';
  else if (form.trade_name.trim().length < 2) errors.trade_name = 'Must be at least 2 characters.';
  if (!form.location.trim()) errors.location = 'Location is required.';
  if (!form.timezone) errors.timezone = 'Please select a timezone.';
  return errors;
}

function Field({ label, icon, error, children }: { label: string; icon: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="form-field">
      <label className="form-field__label"><span className="material-symbols-outlined">{icon}</span>{label}</label>
      {children}
      {error && <p className="form-field__error"><span className="material-symbols-outlined">error</span>{error}</p>}
    </div>
  );
}

export function AddClientModal({ isOpen, onClose, onSubmit }: AddClientModalProps) {
  const [form, setForm]               = useState<FormState>(EMPTY_FORM);
  const [contacts, setContacts]       = useState<ContactsState>(EMPTY_CONTACTS);
  const [errors, setErrors]           = useState<FormErrors>({});
  const [submitting, setSubmitting]   = useState(false);
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

  const setField = useCallback((field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }, []);

  const toggleMethod = useCallback((type: MethodType) => {
    setContacts((prev) => ({ ...prev, [type]: { ...prev[type], enabled: !prev[type].enabled, value: prev[type].enabled ? '' : prev[type].value } }));
  }, []);

  const setMethodValue = useCallback((type: MethodType, value: string) => {
    setContacts((prev) => ({ ...prev, [type]: { ...prev[type], value } }));
  }, []);

  const activeContacts  = getActiveContacts(contacts);
  const hasValidContact = activeContacts.length > 0;
  const canSubmit       = hasValidContact && !submitting;
  const initials        = form.trade_name.trim().split(/\s+/).slice(0, 2).map((n) => n[0]).join('').toUpperCase();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const validation = validate(form);
    if (Object.keys(validation).length > 0) { setErrors(validation); return; }
    if (!hasValidContact) return;
    setSubmitting(true); setSubmitError(null);
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
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-card">
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '3rem', height: '3rem', background: 'linear-gradient(135deg, var(--c-primary), var(--c-primary-container))', borderRadius: 'var(--r-xl)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ color: 'white', fontSize: '1.5rem', fontVariationSettings: "'FILL' 1" }}>domain_add</span>
            </div>
            <div>
              <p className="eyebrow" style={{ color: 'var(--c-primary)', marginBottom: '0.125rem' }}>Client Management</p>
              <h2 style={{ fontFamily: 'var(--font-headline)', fontWeight: 800, color: 'var(--c-on-surface)', fontSize: '1.5rem', letterSpacing: '-0.02em' }}>New Client</h2>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" aria-label="Close"><span className="material-symbols-outlined">close</span></button>
        </div>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
          <div className="modal-body">
            <Field label="Trade Name" icon="badge" error={errors.trade_name}>
              <input type="text" className="form-input" placeholder="e.g. Stark Industries" value={form.trade_name} onChange={setField('trade_name')} autoFocus />
            </Field>
            <div className="form-grid-2">
              <Field label="Company ID" icon="tag" error={errors.company_id}>
                <input type="text" className="form-input" placeholder="e.g. CORP-101" value={form.company_id} onChange={setField('company_id')} />
              </Field>
              <Field label="Location" icon="location_on" error={errors.location}>
                <input type="text" className="form-input" placeholder="e.g. Los Angeles, USA" value={form.location} onChange={setField('location')} />
              </Field>
            </div>
            <Field label="Timezone" icon="schedule" error={errors.timezone}>
              <div className="form-select-wrap">
                <select className="form-select" value={form.timezone} onChange={setField('timezone')}>
                  {TIMEZONE_OPTIONS.map((tz) => <option key={tz.value} value={tz.value}>{tz.label}</option>)}
                </select>
              </div>
            </Field>
            <ContactMethodsSection contacts={contacts} onToggle={toggleMethod} onValueChange={setMethodValue} activeCount={activeContacts.length} />
            {submitError && <div className="error-box"><span className="material-symbols-outlined">error</span>{submitError}</div>}
          </div>
          <div className="modal-footer modal-footer--between">
            {form.trade_name.trim() ? (
              <div className="preview-initials"><div className="preview-initials__avatar">{initials}</div><span className="preview-initials__name">{form.trade_name.trim()}</span></div>
            ) : (
              <span style={{ fontSize: '0.75rem', color: 'var(--c-outline)' }}>Fill the form to preview</span>
            )}
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={!canSubmit} title={!hasValidContact ? 'Add at least one contact method' : undefined} className="btn-primary">
                {submitting ? <><span className="material-symbols-outlined anim-spin">progress_activity</span>Saving…</> : <><span className="material-symbols-outlined">domain_add</span>Add Client</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
