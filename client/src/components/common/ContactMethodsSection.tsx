/**
 * ContactMethodsSection — shared UI for InPerson / VideoCall / PhoneCall
 *
 * InPerson uses a <select> with predefined cities.
 * VideoCall and PhoneCall use free-text inputs.
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

// ─── State shape (exported so modals can use it) ──────────────────────────────
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

// ─── Shared input styles ──────────────────────────────────────────────────────
const inputEnabled =
  'flex-1 text-sm rounded-lg px-3 py-2 outline-none transition-all ' +
  'bg-surface-container-high text-on-surface placeholder:text-outline ' +
  'focus:bg-surface-container-highest focus:ring-0 focus:shadow-[inset_2px_0_0_0_#005bbf]';

const inputDisabledCls =
  'flex-1 text-sm rounded-lg px-3 py-2 outline-none ' +
  'bg-surface-container text-outline placeholder:text-outline cursor-not-allowed';

const selectEnabled =
  'flex-1 text-sm rounded-lg px-3 py-2 outline-none transition-all appearance-none cursor-pointer ' +
  'bg-surface-container-high text-on-surface ' +
  'focus:bg-surface-container-highest focus:ring-0 focus:shadow-[inset_2px_0_0_0_#005bbf]';

const selectDisabledCls =
  'flex-1 text-sm rounded-lg px-3 py-2 outline-none appearance-none ' +
  'bg-surface-container text-outline cursor-not-allowed';

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
    <div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2 mb-3">
        <span className="material-symbols-outlined text-sm text-outline">contacts</span>
        Contact Methods
        <span className={`ml-auto text-[10px] font-semibold normal-case tracking-normal ${activeCount > 0 ? 'text-primary' : 'text-outline'}`}>
          {activeCount > 0 ? `${activeCount} selected` : 'At least 1 required'}
        </span>
      </p>

      <div className="rounded-xl overflow-hidden border border-surface-container divide-y divide-surface-container">
        {METHOD_CONFIGS.map((method) => {
          const state = contacts[method.type];

          return (
            <div
              key={method.type}
              className={`flex items-center gap-4 px-4 py-3 transition-colors ${state.enabled ? 'bg-surface-container-lowest' : 'bg-surface-container-low/60'}`}
            >
              {/* Checkbox */}
              <button
                type="button"
                onClick={() => onToggle(method.type)}
                className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition-colors border ${
                  state.enabled
                    ? 'bg-primary border-primary'
                    : 'bg-surface-container border-outline-variant hover:border-primary'
                }`}
                aria-label={`Toggle ${method.label}`}
              >
                {state.enabled && (
                  <span
                    className="material-symbols-outlined text-white text-[14px]"
                    style={{ fontVariationSettings: "'FILL' 1, 'wght' 600" }}
                  >
                    check
                  </span>
                )}
              </button>

              {/* Icon + Label */}
              <div className={`flex items-center gap-2 w-28 shrink-0 transition-opacity ${state.enabled ? 'opacity-100' : 'opacity-40'}`}>
                <span className="material-symbols-outlined text-[16px] text-outline">{method.icon}</span>
                <span className="text-xs font-bold text-on-surface">{method.label}</span>
              </div>

              {/* Value — select for InPerson, input for the rest */}
              {method.type === 'InPerson' ? (
                <select
                  disabled={!state.enabled}
                  value={state.value}
                  onChange={(e) => onValueChange(method.type, e.target.value)}
                  className={state.enabled ? selectEnabled : selectDisabledCls}
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
                  className={state.enabled ? inputEnabled : inputDisabledCls}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
