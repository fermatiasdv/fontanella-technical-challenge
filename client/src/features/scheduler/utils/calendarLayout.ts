import {
  DAY_START_HOUR,
  DAY_END_HOUR,
  HOUR_HEIGHT_PX,
  TOTAL_HOURS,
  GRID_HEIGHT,
} from '@/features/scheduler/constants/scheduler.constants';

export { GRID_HEIGHT };

export function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function minToTimeStr(min: number): string {
  const h = Math.floor(min / 60).toString().padStart(2, '0');
  const m = (min % 60).toString().padStart(2, '0');
  return `${h}:${m}:00`;
}

export function formatDisplayTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const hh  = h ?? 0;
  const mm  = m ?? 0;
  const per = hh < 12 ? 'AM' : 'PM';
  const h12 = hh % 12 || 12;
  return `${h12}:${mm.toString().padStart(2, '0')} ${per}`;
}

export function minToTopPx(min: number): number {
  return ((min - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT_PX;
}

export function minToHeightPx(durationMin: number): number {
  return (durationMin / 60) * HOUR_HEIGHT_PX;
}

/** Extracts HH:MM total minutes from a UTC ISO string, in local time. */
export function isoToLocalMin(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

export function formatApptTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const per = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${per}`;
}

/** Time options every 15 min between DAY_START_HOUR and DAY_END_HOUR. */
export const TIME_OPTIONS = Array.from(
  { length: (DAY_END_HOUR - DAY_START_HOUR) * 4 + 1 },
  (_, i) => {
    const min = DAY_START_HOUR * 60 + i * 15;
    return { value: min, label: formatDisplayTime(minToTimeStr(min)) };
  },
);

/** Hour label rows for the time column. */
export const HOUR_LABELS = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
  const h = DAY_START_HOUR + i;
  const label =
    h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`;
  return { label, offset: i * HOUR_HEIGHT_PX };
});

/** Clamp a click-y-position on the grid to the nearest valid 15-min slot. */
export function clickYToStartMin(
  clientY: number,
  rectTop: number,
  scrollTop: number,
): number {
  const relY   = clientY - rectTop + scrollTop;
  const rawMin = DAY_START_HOUR * 60 + Math.round((relY / GRID_HEIGHT) * TOTAL_HOURS * 60 / 15) * 15;
  return Math.min(Math.max(rawMin, DAY_START_HOUR * 60), (DAY_END_HOUR - 1) * 60);
}
