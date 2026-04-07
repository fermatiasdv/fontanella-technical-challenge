/**
 * ContactMethodsSection — shared UI for InPerson / VideoCall / PhoneCall
 */

import type { MethodType } from '../../api/contact';

// ─── Type for a contact method to be sent to the API ─────────────────────────
export interface ContactMethodInput {
  method_type: MethodType;
  value:       string;
  is_default:  boolean;
}

// ─── Cities available for In-Person meetings ──────────────────────────────────
export const IN_PERSON_CITIES = [
  'Buenos Aires',
  'Santiago',
  'Madrid',
  'Ciudad de México',
  'Tokyo',
  'Prusia',
  'New York',
  'London',
  'São Paulo',
  'Paris',
] as const;

// ─── Method config ────────────────────────────────────────────────────────────
interface MethodConfig {
  type:        MethodType;
  label:       string;
  icon:        string;
  placeholder: string;
}

export const METHOD_CONFIGS: MethodConfig[] = [
  { type: 'InPerson',  label: 'In Person',  icon: 'storefront', placeholder: 'Select a city' },
  { type: 'VideoCall', label: 'Video Call', icon: 'videocam',   placeholder: 'e.g. https://zoom.us/j/...' },
  { type: 'PhoneCall', label: 'Phone Call', icon: 'phone',      placeholder: 'e.g. +1-555-0102' },
];

// ─── State shape ──────────────────────────────────────────────────────────────
export interface ContactMethodState {
  enabled: boolean;
  value:   string;
}

export type ContactsState = Record<MethodType, ContactMethodState>;

export const EMPTY_CONTACTS: ContactsState = {
  InPerson:  { enabled: false, value: '' },
  VideoCall: { enabled: false, value: '' },
  PhoneCall: { enabled: false, value: '' },
};

export function getActiveContacts(contacts: ContactsState): ContactMethodInput[] {
  return METHOD_CONFIGS
    .filter((m) => contacts[m.type].enabled && contacts[m.type].value.trim())
    .map((m, index) => ({
      method_type: m.type,
      value:       contacts[m.type].value.trim(),
      is_default:  index === 0,
    }));
}

// ─── Component ────────────────────────────────────────────────────────────────
interface Props {
  contacts:       ContactsState;
  onToggle:       (type: MethodType) => void;
  onValueChange:  (type: MethodType, value: string) => void;
  activeCount:    number;
}

export default function ContactMethodsSection({
  contacts,
  onToggle,
  onValueChange,
  activeCount,
}: Props) {
  return (
    <div className="contact-methods">
      <div className="contact-methods__header">
        <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>contacts</span>
        Contact Methods
        <span className={`contact-methods__count${activeCount > 0 ? ' contact-methods__count--active' : ' contact-methods__count--empty'}`}>
          {activeCount > 0 ? `${activeCount} selected` : 'At least 1 required'}
        </span>
      </div>

      <div className="contact-methods__list">
        {METHOD_CONFIGS.map((method) => {
          const state = contacts[method.type];

          return (
            <div
              key={method.type}
              className={`contact-method${state.enabled ? ' contact-method--enabled' : ''}`}
            >
              {/* Checkbox */}
              <button
                type="button"
                onClick={() => onToggle(method.type)}
                className={`contact-method__toggle${state.enabled ? ' contact-method__toggle--checked' : ''}`}
                aria-label={`Toggle ${method.label}`}
              >
                {state.enabled && (
                  <span
                    className="material-symbols-outlined"
                    style={{ color: 'white', fontSize: '0.875rem', fontVariationSettings: "'FILL' 1, 'wght' 600" }}
                  >
                    check
                  </span>
                )}
              </button>

              {/* Icon + Label */}
              <div className={`contact-method__meta${state.enabled ? '' : ' contact-method__meta--disabled'}`}>
                <span className="contact-method__icon material-symbols-outlined">{method.icon}</span>
                <span className="contact-method__label">{method.label}</span>
              </div>

              {/* Value input */}
              {method.type === 'InPerson' ? (
                <select
                  disabled={!state.enabled}
                  value={state.value}
                  onChange={(e) => onValueChange(method.type, e.target.value)}
                  className={`contact-method__select${state.enabled ? '' : ' contact-method__select--disabled'}`}
                >
                  <option value="">— Select a city —</option>
                  {IN_PERSON_CITIES.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  disabled={!state.enabled}
                  value={state.value}
                  onChange={(e) => onValueChange(method.type, e.target.value)}
                  placeholder={state.enabled ? method.placeholder : '—'}
                  className={`contact-method__input${state.enabled ? '' : ' contact-method__input--disabled'}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
