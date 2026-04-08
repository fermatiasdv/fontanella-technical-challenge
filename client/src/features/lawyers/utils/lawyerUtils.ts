/**
 * Pure helper functions for lawyer display logic.
 * No side-effects, no React imports.
 */

export function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return (parts[0] ?? '').slice(0, 2).toUpperCase();
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase();
}

export function formatNationalId(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits || digits.length !== raw.replace(/\./g, '').length) return raw;
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
