/**
 * Pure helper functions for lawyer display logic.
 * No side-effects, no imports from React.
 */

/**
 * Returns up to two uppercase initials from a full name.
 * e.g. "Horacio Altamirano" → "HA"
 *      "Madonna"            → "MA"
 */
export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/**
 * Formats a raw national ID string for display.
 * The backend stores it without dots; we format it for readability.
 * e.g. "28495102" → "28.495.102"
 * If already formatted or non-numeric, returns as-is.
 */
export function formatNationalId(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits || digits.length !== raw.replace(/\./g, '').length) return raw;
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
