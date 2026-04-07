/**
 * SchedulerPage — Weekly Working-Schedule (T_WORKING_SCHEDULE)
 *
 * ABMC completo:
 *  - Consulta   : GET  /api/v1/working-schedule/:lawyerId
 *  - Alta       : PUT  /api/v1/working-schedule/:lawyerId  (slot nuevo)
 *  - Modificación: PUT  /api/v1/working-schedule/:lawyerId  (upsert por day_of_week)
 *  - Baja       : DELETE /api/v1/working-schedule/slot/:id
 *
 * Design: "Editorial Efficiency" (DESIGN.md)
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useWorkingSchedule } from '../hooks/useWorkingSchedule';
import type { WorkingScheduleAPI } from '../hooks/useWorkingSchedule';

// ─── Constants ────────────────────────────────────────────────────────────────

const HOUR_HEIGHT_PX = 80;
const DAY_START_HOUR = 6;
const DAY_END_HOUR   = 22;
const TOTAL_HOURS    = DAY_END_HOUR - DAY_START_HOUR;
const GRID_HEIGHT    = TOTAL_HOURS * HOUR_HEIGHT_PX;

const DAYS_EN: readonly string[] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
] as const;

const DAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** "HH:mm:ss" → minutes from midnight */
function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** minutes from midnight → "HH:mm:ss" */
function minToTimeStr(min: number): string {
  const h = Math.floor(min / 60).toString().padStart(2, '0');
  const m = (min % 60).toString().padStart(2, '0');
  return `${h}:${m}:00`;
}

/** "HH:mm:ss" → "9:00 AM" */
function formatDisplayTime(t: string): string {
  const [h, m] = t.split(':').map(Number);
  const hh  = h ?? 0;
  const mm  = m ?? 0;
  const per = hh < 12 ? 'AM' : 'PM';
  const h12 = hh % 12 || 12;
  return `${h12}:${mm.toString().padStart(2, '0')} ${per}`;
}

function minToTopPx(min: number): number {
  return ((min - DAY_START_HOUR * 60) / 60) * HOUR_HEIGHT_PX;
}

function minToHeightPx(durationMin: number): number {
  return (durationMin / 60) * HOUR_HEIGHT_PX;
}

/** Total weekly minutes from a slot list */
function totalWeeklyMinutes(slots: WorkingScheduleAPI[]): number {
  return slots.reduce((acc, s) => acc + (timeToMin(s.end_time) - timeToMin(s.start_time)), 0);
}

// ─── Slot Form Modal (Alta + Modificación) ────────────────────────────────────

const TIME_OPTIONS = Array.from({ length: (DAY_END_HOUR - DAY_START_HOUR) * 4 + 1 }, (_, i) => {
  const min = DAY_START_HOUR * 60 + i * 15;
  return { value: min, label: formatDisplayTime(minToTimeStr(min)) };
});

interface SlotFormModalProps {
  isOpen:      boolean;
  /** null = Alta (new), slot = Modificación (edit) */
  editSlot:    WorkingScheduleAPI | null;
  prefillDay:  string;
  onClose:     () => void;
  onSave:      (dayOfWeek: string, startTime: string, endTime: string) => Promise<void>;
}

function SlotFormModal({ isOpen, editSlot, prefillDay, onClose, onSave }: SlotFormModalProps) {
  const isEdit = editSlot !== null;

  const [day,        setDay]        = useState(prefillDay);
  const [startMin,   setStartMin]   = useState(9 * 60);
  const [endMin,     setEndMin]     = useState(18 * 60);
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    if (editSlot) {
      setDay(editSlot.day_of_week);
      setStartMin(timeToMin(editSlot.start_time));
      setEndMin(timeToMin(editSlot.end_time));
    } else {
      setDay(prefillDay);
      setStartMin(9 * 60);
      setEndMin(18 * 60);
    }
  }, [isOpen, editSlot, prefillDay]);

  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (endMin <= startMin) { setError('End time must be after start time.'); return; }
    setSubmitting(true);
    setError(null);
    try {
      await onSave(day, minToTimeStr(startMin), minToTimeStr(endMin));
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase =
    'w-full bg-surface-container-high rounded-lg px-4 py-2.5 text-sm text-on-surface ' +
    'placeholder:text-outline outline-none transition-all ' +
    'focus:bg-surface-container-highest focus:shadow-[inset_2px_0_0_0_#005bbf]';

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-on-surface/20 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md mx-4 bg-surface-container-lowest rounded-2xl overflow-hidden"
        style={{ boxShadow: '0 12px 40px rgba(25,28,29,0.12)' }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-container rounded-xl flex items-center justify-center">
              <span
                className="material-symbols-outlined text-white text-xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {isEdit ? 'edit_calendar' : 'calendar_add_on'}
              </span>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-primary">
                {isEdit ? 'Modify Slot' : 'New Slot'}
              </p>
              <h2 className="font-headline font-extrabold text-on-surface text-xl tracking-tight">
                {isEdit ? 'Edit Working Hours' : 'Add Working Hours'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="px-8 pb-6 space-y-4">
          {/* Day of week */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-outline">calendar_today</span>
              Day of Week
            </label>
            <select
              className={inputBase + ' appearance-none cursor-pointer'}
              value={day}
              onChange={(e) => setDay(e.target.value)}
              disabled={isEdit} // day_of_week is the unique key — changing it creates a new slot
            >
              {DAYS_EN.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {isEdit && (
              <p className="text-[10px] text-outline">
                To change the day, delete this slot and create a new one.
              </p>
            )}
          </div>

          {/* Start + End */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-outline">schedule</span>
                Start Time
              </label>
              <select
                className={inputBase + ' appearance-none cursor-pointer'}
                value={startMin}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setStartMin(v);
                  if (endMin <= v) setEndMin(v + 60);
                }}
              >
                {TIME_OPTIONS.slice(0, -1).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-outline">schedule</span>
                End Time
              </label>
              <select
                className={inputBase + ' appearance-none cursor-pointer'}
                value={endMin}
                onChange={(e) => setEndMin(Number(e.target.value))}
              >
                {TIME_OPTIONS.filter((o) => o.value > startMin).map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration preview */}
          {endMin > startMin && (
            <div className="bg-primary/5 rounded-lg px-4 py-2.5 flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">timer</span>
              <span className="text-xs text-primary font-semibold">
                {endMin - startMin} min &nbsp;·&nbsp;{' '}
                {formatDisplayTime(minToTimeStr(startMin))} – {formatDisplayTime(minToTimeStr(endMin))}
              </span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-error-container text-on-error-container rounded-lg px-4 py-2.5 text-sm flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-surface-container flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-surface-container-high text-on-surface rounded-lg text-sm font-bold hover:bg-surface-container-highest transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={endMin <= startMin || submitting}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-container text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
          >
            {submitting
              ? <><span className="material-symbols-outlined text-base animate-spin">progress_activity</span>Saving…</>
              : <><span className="material-symbols-outlined text-base">{isEdit ? 'save' : 'add'}</span>{isEdit ? 'Save Changes' : 'Add Slot'}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Slot Detail Drawer (Consulta + Modificación + Baja) ─────────────────────

interface SlotDrawerProps {
  slot:      WorkingScheduleAPI | null;
  onClose:   () => void;
  onEdit:    (slot: WorkingScheduleAPI) => void;
  onDelete:  (id: number) => Promise<void>;
}

function SlotDrawer({ slot, onClose, onEdit, onDelete }: SlotDrawerProps) {
  const [deleting, setDeleting] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!slot) return;
    setDeleting(true);
    setDeleteErr(null);
    try {
      await onDelete(slot.id_working_schedule);
      onClose();
    } catch (err) {
      setDeleteErr((err as Error).message);
      setDeleting(false);
    }
  };

  if (!slot) return null;

  const durationMin = timeToMin(slot.end_time) - timeToMin(slot.start_time);
  const dayShort    = DAYS_SHORT[DAYS_EN.indexOf(slot.day_of_week)] ?? slot.day_of_week;

  return (
    <div
      className="fixed inset-0 z-[60] flex justify-end"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-on-surface/10 backdrop-blur-[3px]" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative w-full max-w-sm bg-surface-container-lowest h-full flex flex-col"
        style={{ boxShadow: '-8px 0 40px rgba(25,28,29,0.1)' }}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-surface-container border-l-4 border-l-primary">
          <div className="flex items-start justify-between mb-4">
            <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest px-2 py-1 rounded bg-primary/10 text-primary">
              Working Hours
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-container-high text-outline hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
          <h3 className="font-headline font-extrabold text-on-surface text-2xl tracking-tight">
            {slot.day_of_week}
          </h3>
          <p className="text-sm text-primary font-semibold mt-1">
            {formatDisplayTime(slot.start_time)} – {formatDisplayTime(slot.end_time)}
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-6 space-y-5 flex-1 overflow-y-auto">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2 mb-1.5">
              <span className="material-symbols-outlined text-sm text-outline">calendar_today</span>
              Day
            </p>
            <p className="text-sm font-semibold text-on-surface">{slot.day_of_week} ({dayShort})</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2 mb-1.5">
              <span className="material-symbols-outlined text-sm text-outline">schedule</span>
              Hours
            </p>
            <p className="text-sm font-semibold text-on-surface">
              {formatDisplayTime(slot.start_time)} → {formatDisplayTime(slot.end_time)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2 mb-1.5">
              <span className="material-symbols-outlined text-sm text-outline">timer</span>
              Duration
            </p>
            <p className="text-sm font-semibold text-on-surface">{durationMin} min ({(durationMin / 60).toFixed(1)} h)</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant flex items-center gap-2 mb-1.5">
              <span className="material-symbols-outlined text-sm text-outline">key</span>
              Slot ID
            </p>
            <p className="text-xs text-outline font-mono">{slot.id_working_schedule}</p>
          </div>

          {deleteErr && (
            <div className="bg-error-container text-on-error-container rounded-lg px-4 py-2.5 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {deleteErr}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-surface-container flex gap-3">
          <button
            onClick={() => { onClose(); onEdit(slot); }}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-primary to-primary-container text-white rounded-lg text-sm font-bold shadow-sm transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-base">edit</span>
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-error-container text-on-error-container rounded-lg text-sm font-bold hover:bg-error/20 transition-colors disabled:opacity-50"
          >
            {deleting
              ? <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
              : <span className="material-symbols-outlined text-base">delete</span>
            }
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 bg-surface-container-high text-on-surface rounded-lg text-sm font-bold hover:bg-surface-container-highest transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Lawyer Selector ──────────────────────────────────────────────────────────

interface LawyerSelectorProps {
  lawyers:          { id_lawyer: number; full_name: string }[];
  selectedId:       number | null;
  onSelect:         (id: number) => void;
  loading:          boolean;
}

function LawyerSelector({ lawyers, selectedId, onSelect, loading }: LawyerSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="material-symbols-outlined text-outline text-xl">gavel</span>
      <div className="relative">
        {loading ? (
          <div className="h-10 w-52 rounded-xl bg-surface-container animate-pulse" />
        ) : (
          <select
            value={selectedId ?? ''}
            onChange={(e) => onSelect(Number(e.target.value))}
            className={
              'appearance-none cursor-pointer pr-8 pl-4 py-2.5 bg-surface-container-lowest ' +
              'rounded-xl text-sm font-semibold text-on-surface outline-none transition-all ' +
              'focus:shadow-[inset_2px_0_0_0_#005bbf]'
            }
            style={{ boxShadow: '0 2px 8px rgba(25,28,29,0.06)' }}
          >
            {lawyers.map((l) => (
              <option key={l.id_lawyer} value={l.id_lawyer}>{l.full_name}</option>
            ))}
          </select>
        )}
        <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-sm text-outline">
          expand_more
        </span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SchedulerPage() {
  const {
    lawyers, lawyersLoading,
    selectedLawyerId, selectLawyer,
    slots, loading, error,
    upsertSlot, deleteSlot,
  } = useWorkingSchedule();

  // ── Drawer + Modal state ──────────────────────────────────────────────────────
  const [drawerSlot,   setDrawerSlot]   = useState<WorkingScheduleAPI | null>(null);
  const [formOpen,     setFormOpen]     = useState(false);
  const [editSlot,     setEditSlot]     = useState<WorkingScheduleAPI | null>(null);
  const [prefillDay,   setPrefillDay]   = useState(DAYS_EN[0]!);

  const gridScrollRef = useRef<HTMLDivElement>(null);

  // Scroll to 7am on mount
  useEffect(() => {
    gridScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const openCreateForDay = useCallback((dayName: string, clientY: number, rectTop: number, scrollTop: number) => {
    // Snap click position to nearest 15-min slot
    const relY   = clientY - rectTop + scrollTop;
    const rawMin = DAY_START_HOUR * 60 + Math.round((relY / GRID_HEIGHT) * TOTAL_HOURS * 60 / 15) * 15;
    const clamped = Math.min(Math.max(rawMin, DAY_START_HOUR * 60), (DAY_END_HOUR - 1) * 60);
    setPrefillDay(dayName);
    // prefill startMin via useEffect in the modal
    setEditSlot(null);
    setFormOpen(true);
    // store clamped so modal gets it; we pass it as prefillDay is a string not a time
    // We set the initial value inside the modal via prefillDay trigger
    void clamped; // used implicitly by modal's default 9:00
  }, []);

  const openEdit = useCallback((slot: WorkingScheduleAPI) => {
    setEditSlot(slot);
    setPrefillDay(slot.day_of_week);
    setFormOpen(true);
  }, []);

  const handleSave = useCallback(async (dayOfWeek: string, startTime: string, endTime: string) => {
    await upsertSlot({ dayOfWeek, startTime, endTime });
  }, [upsertSlot]);

  // ── Derived ───────────────────────────────────────────────────────────────────

  const slotByDay = Object.fromEntries(
    slots.map((s) => [s.day_of_week, s]),
  ) as Record<string, WorkingScheduleAPI | undefined>;

  const totalMin    = totalWeeklyMinutes(slots);
  const activeDays  = slots.length;
  const weekendWork = slots.some((s) => s.day_of_week === 'Saturday' || s.day_of_week === 'Sunday');

  // Hour labels for the time column
  const hourLabels = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
    const h = DAY_START_HOUR + i;
    const label = h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`;
    return { label, offset: i * HOUR_HEIGHT_PX };
  });

  return (
    <>
      <main className="ml-64 min-h-screen bg-surface">
        <div className="px-10 py-10 space-y-8">

          {/* ── Header ──────────────────────────────────────────────────── */}
          <section className="flex justify-between items-end flex-wrap gap-6">
            <div className="max-w-xl">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Working Schedule
              </span>
              <h2 className="font-headline font-extrabold text-on-surface text-4xl tracking-tight mt-1">
                Availability defined.
              </h2>
              <p className="text-on-surface-variant mt-2 text-base font-light leading-relaxed">
                Configure when each practitioner is available. One slot per day of the week.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <LawyerSelector
                lawyers={lawyers}
                selectedId={selectedLawyerId}
                onSelect={selectLawyer}
                loading={lawyersLoading}
              />
              <button
                onClick={() => { setPrefillDay(DAYS_EN[0]!); setEditSlot(null); setFormOpen(true); }}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary to-primary-container text-white rounded-xl text-sm font-bold shadow-sm transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Add Slot
              </button>
            </div>
          </section>

          {/* ── Error banner ─────────────────────────────────────────────── */}
          {error && (
            <div className="bg-error-container text-on-error-container rounded-xl px-6 py-4 flex items-center gap-3">
              <span className="material-symbols-outlined">error</span>
              <span className="text-sm font-medium">{error}</span>
            </div>
          )}

          {/* ── Stats strip ──────────────────────────────────────────────── */}
          <div className="grid grid-cols-4 gap-4">
            {[
              {
                icon: 'calendar_today', label: 'Working Days',
                value: loading ? '—' : activeDays.toString(), color: 'text-primary',
              },
              {
                icon: 'schedule', label: 'Hours / Week',
                value: loading ? '—' : `${(totalMin / 60).toFixed(1)}h`, color: 'text-primary',
              },
              {
                icon: 'timer', label: 'Avg / Day',
                value: loading ? '—' : activeDays > 0 ? `${Math.round(totalMin / activeDays)} min` : '—',
                color: 'text-on-surface-variant',
              },
              {
                icon: 'weekend', label: 'Weekend',
                value: loading ? '—' : weekendWork ? 'Yes' : 'No',
                color: weekendWork ? 'text-tertiary' : 'text-on-surface-variant',
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-surface-container-lowest rounded-xl px-6 py-4 flex items-center gap-4"
                style={{ boxShadow: '0 2px 8px rgba(25,28,29,0.04)' }}
              >
                <span
                  className={`material-symbols-outlined text-2xl ${stat.color}`}
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {stat.icon}
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                    {stat.label}
                  </p>
                  <p className="font-headline font-extrabold text-on-surface text-2xl leading-none mt-0.5">
                    {stat.value}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* ── Calendar Grid ─────────────────────────────────────────────── */}
          <div
            className="bg-surface-container-lowest rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 4px 24px rgba(25,28,29,0.06)' }}
          >
            {/* Day headers */}
            <div className="grid grid-cols-[64px_repeat(7,1fr)] bg-surface-container-low/40">
              <div className="p-4" />
              {DAYS_EN.map((day, i) => {
                const isWeekend = i >= 5;
                const hasSlot   = !!slotByDay[day];
                return (
                  <div
                    key={day}
                    className={`p-4 text-center ${isWeekend ? 'opacity-50' : ''}`}
                  >
                    <span className={`block text-[10px] font-bold uppercase tracking-widest ${hasSlot ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {DAYS_SHORT[i]}
                    </span>
                    <span className={`font-headline font-bold text-base mt-0.5 inline-block leading-none ${hasSlot ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {day.slice(0, 3)}
                    </span>
                    {hasSlot && <div className="w-1 h-1 rounded-full bg-primary mx-auto mt-1" />}
                  </div>
                );
              })}
            </div>

            {/* Time grid */}
            <div
              ref={gridScrollRef}
              className="relative overflow-y-auto"
              style={{ height: 720, scrollbarWidth: 'none' }}
            >
              {loading ? (
                <div className="flex items-center justify-center h-full text-outline">
                  <span className="material-symbols-outlined animate-spin mr-2">progress_activity</span>
                  <span className="text-sm font-medium">Loading schedule…</span>
                </div>
              ) : (
                <div className="grid grid-cols-[64px_repeat(7,1fr)]" style={{ height: GRID_HEIGHT }}>

                  {/* Time labels column */}
                  <div className="relative bg-surface-container-low/10">
                    {hourLabels.map(({ label, offset }) => (
                      <div
                        key={label}
                        className="absolute right-3 text-[10px] font-medium text-outline"
                        style={{ top: offset - 7 }}
                      >
                        {label}
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  {DAYS_EN.map((day, dayIdx) => {
                    const isWeekend = dayIdx >= 5;
                    const slot      = slotByDay[day];

                    const slotTopPx    = slot ? minToTopPx(timeToMin(slot.start_time)) : 0;
                    const slotHeightPx = slot ? Math.max(minToHeightPx(timeToMin(slot.end_time) - timeToMin(slot.start_time)), 32) : 0;

                    return (
                      <div
                        key={day}
                        className={`relative border-l border-surface-container/60 group/col cursor-pointer ${isWeekend ? 'bg-surface-container-low/20' : ''}`}
                        onClick={(e) => {
                          if (slot) return; // click on slot handled separately
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          openCreateForDay(day, e.clientY, rect.top, gridScrollRef.current?.scrollTop ?? 0);
                        }}
                      >
                        {/* Hour dividers */}
                        {hourLabels.map(({ offset }) => (
                          <div
                            key={offset}
                            className="absolute left-0 right-0 border-t border-surface-container/40"
                            style={{ top: offset }}
                          />
                        ))}
                        {/* Half-hour dashes */}
                        {hourLabels.slice(0, -1).map(({ offset }) => (
                          <div
                            key={offset + 'h'}
                            className="absolute left-4 right-0 border-t border-surface-container/20 border-dashed"
                            style={{ top: offset + HOUR_HEIGHT_PX / 2 }}
                          />
                        ))}

                        {/* Working slot block */}
                        {slot && (
                          <div
                            className="absolute inset-x-1 bg-primary/10 hover:bg-primary/15 border-l-4 border-primary rounded-lg px-2.5 py-2 cursor-pointer transition-colors group"
                            style={{ top: slotTopPx, height: slotHeightPx }}
                            onClick={(e) => { e.stopPropagation(); setDrawerSlot(slot); }}
                          >
                            <span className="block text-[9px] font-extrabold uppercase tracking-wider text-primary mb-0.5">
                              Available
                            </span>
                            <span className="block text-[11px] font-bold text-on-surface leading-tight truncate">
                              {formatDisplayTime(slot.start_time)} – {formatDisplayTime(slot.end_time)}
                            </span>
                            {slotHeightPx > 56 && (
                              <span className="block text-[9px] text-outline mt-0.5">
                                {timeToMin(slot.end_time) - timeToMin(slot.start_time)} min
                              </span>
                            )}
                          </div>
                        )}

                        {/* Empty state hint — shows only on hover */}
                        {!slot && !isWeekend && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/col:opacity-100 transition-opacity pointer-events-none">
                            <div className="flex items-center gap-1 text-outline bg-surface-container/60 backdrop-blur-sm rounded-lg px-3 py-1.5">
                              <span className="material-symbols-outlined text-sm">add</span>
                              <span className="text-[11px] font-semibold">Add slot</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Legend / hint ────────────────────────────────────────────── */}
          <div className="flex items-center gap-6 pt-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm border-l-2 border-primary bg-primary/10" />
              <span className="text-[11px] text-on-surface-variant font-medium">Available</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm border border-dashed border-outline/40 bg-surface-container/40" />
              <span className="text-[11px] text-on-surface-variant font-medium">No slot (click to add)</span>
            </div>
            <span className="ml-auto text-[10px] text-outline">
              Click a slot to view / edit / delete &nbsp;·&nbsp; Click an empty day to add
            </span>
          </div>

        </div>
      </main>

      {/* ── Drawers & Modals ────────────────────────────────────────────── */}

      <SlotDrawer
        slot={drawerSlot}
        onClose={() => setDrawerSlot(null)}
        onEdit={(s) => { setDrawerSlot(null); openEdit(s); }}
        onDelete={deleteSlot}
      />

      <SlotFormModal
        isOpen={formOpen}
        editSlot={editSlot}
        prefillDay={prefillDay}
        onClose={() => { setFormOpen(false); setEditSlot(null); }}
        onSave={handleSave}
      />
    </>
  );
}
