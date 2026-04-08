// ─── Grid Dimensions ──────────────────────────────────────────────────────────

export const HOUR_HEIGHT_PX = 80;
export const DAY_START_HOUR = 6;
export const DAY_END_HOUR   = 22;
export const TOTAL_HOURS    = DAY_END_HOUR - DAY_START_HOUR;
export const GRID_HEIGHT    = TOTAL_HOURS * HOUR_HEIGHT_PX;

// ─── Day / Month Labels ───────────────────────────────────────────────────────

export const DAYS_EN: readonly string[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
] as const;

export const DAYS_SHORT = [
  'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun',
] as const;

export const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;
