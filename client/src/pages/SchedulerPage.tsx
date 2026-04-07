/**
 * SchedulerPage — Weekly Working-Schedule (T_WORKING_SCHEDULE) + Appointments
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useWorkingSchedule } from '../hooks/useWorkingSchedule';
import type { WorkingScheduleAPI } from '../hooks/useWorkingSchedule';
import { useAppointments } from '../hooks/useAppointments';
import type { AppointmentAPI } from '../types/appointment';

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

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;

// ─── Week / Date Helpers ──────────────────────────────────────────────────────

/** Returns the Monday of the ISO week that contains `date`. */
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay(); // 0 = Sun
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diff);
  return d;
}

/** Returns the 7 Date objects [Mon … Sun] for the week starting at `monday`. */
function getWeekDates(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return d;
  });
}

/** Returns true when two Date objects fall on the same calendar day. */
function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  );
}

/**
 * Produces a human-readable month / year label for a 7-day week.
 * Handles cross-month and cross-year weeks gracefully.
 */
function formatWeekLabel(dates: Date[]): string {
  const first = dates[0]!;
  const last  = dates[6]!;
  const m1    = MONTHS_ES[first.getMonth()]!;
  const m2    = MONTHS_ES[last.getMonth()]!;
  const y1    = first.getFullYear();
  const y2    = last.getFullYear();

  if (y1 !== y2) return `${m1} ${y1} – ${m2} ${y2}`;
  if (m1 !== m2) return `${m1} – ${m2} ${y1}`;
  return `${m1} ${y1}`;
}

// ─── Week Navigator ───────────────────────────────────────────────────────────

interface WeekNavigatorProps {
  weekDates: Date[];
  onPrev:    () => void;
  onNext:    () => void;
  onToday:   () => void;
}

function WeekNavigator({ weekDates, onPrev, onNext, onToday }: WeekNavigatorProps) {
  const label   = formatWeekLabel(weekDates);
  const today   = new Date();
  const isToday = weekDates.some((d) => isSameDay(d, today));

  return (
    <div className="week-navigator">
      <button
        className="week-navigator__arrow"
        onClick={onPrev}
        aria-label="Semana anterior"
        title="Semana anterior"
      >
        <span className="material-symbols-outlined">chevron_left</span>
      </button>

      <div className="week-navigator__center">
        <span className="week-navigator__label">{label}</span>
        {!isToday && (
          <button className="week-navigator__today-btn" onClick={onToday}>
            Hoy
          </button>
        )}
      </div>

      <button
        className="week-navigator__arrow"
        onClick={onNext}
        aria-label="Semana siguiente"
        title="Semana siguiente"
      >
        <span className="material-symbols-outlined">chevron_right</span>
      </button>
    </div>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeToMin(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function minToTimeStr(min: number): string {
  const h = Math.floor(min / 60).toString().padStart(2, '0');
  const m = (min % 60).toString().padStart(2, '0');
  return `${h}:${m}:00`;
}

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

// ─── Appointment helpers ──────────────────────────────────────────────────────

/** Filters an appointment list to only those whose start falls on the given Date. */
function appointmentsForDay(appointments: AppointmentAPI[], day: Date): AppointmentAPI[] {
  return appointments.filter((a) => isSameDay(new Date(a.start_datetime), day));
}

/** Extracts HH:MM total minutes from a UTC ISO string, in local time. */
function isoToLocalMin(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

function formatApptTime(iso: string): string {
  const d = new Date(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  const per = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, '0')} ${per}`;
}

// ─── Slot Form Modal ──────────────────────────────────────────────────────────

const TIME_OPTIONS = Array.from({ length: (DAY_END_HOUR - DAY_START_HOUR) * 4 + 1 }, (_, i) => {
  const min = DAY_START_HOUR * 60 + i * 15;
  return { value: min, label: formatDisplayTime(minToTimeStr(min)) };
});

interface SlotFormModalProps {
  isOpen:      boolean;
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

  return (
    <div
      className="modal-overlay"
      style={{ zIndex: 'var(--z-modal)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="modal-card slot-modal">
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.5rem', height: '2.5rem',
              background: 'linear-gradient(135deg, var(--c-primary), var(--c-primary-container))',
              borderRadius: 'var(--r-xl)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span
                className="material-symbols-outlined"
                style={{ color: 'white', fontSize: '1.25rem', fontVariationSettings: "'FILL' 1" }}
              >
                {isEdit ? 'edit_calendar' : 'calendar_add_on'}
              </span>
            </div>
            <div>
              <p className="eyebrow" style={{ color: 'var(--c-primary)' }}>
                {isEdit ? 'Modify Slot' : 'New Slot'}
              </p>
              <h2 style={{ fontFamily: 'var(--font-headline)', fontWeight: 800, color: 'var(--c-on-surface)', fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
                {isEdit ? 'Edit Working Hours' : 'Add Working Hours'}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Day of week */}
          <div className="form-field">
            <label className="form-field__label">
              <span className="material-symbols-outlined">calendar_today</span>
              Day of Week
            </label>
            <div className="form-select-wrap">
              <select
                className="form-select"
                value={day}
                onChange={(e) => setDay(e.target.value)}
                disabled={isEdit}
              >
                {DAYS_EN.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            {isEdit && (
              <p style={{ fontSize: '0.625rem', color: 'var(--c-outline)' }}>
                To change the day, delete this slot and create a new one.
              </p>
            )}
          </div>

          {/* Start + End */}
          <div className="slot-modal__time-grid">
            <div className="form-field">
              <label className="form-field__label">
                <span className="material-symbols-outlined">schedule</span>
                Start Time
              </label>
              <div className="form-select-wrap">
                <select
                  className="form-select"
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
            </div>
            <div className="form-field">
              <label className="form-field__label">
                <span className="material-symbols-outlined">schedule</span>
                End Time
              </label>
              <div className="form-select-wrap">
                <select
                  className="form-select"
                  value={endMin}
                  onChange={(e) => setEndMin(Number(e.target.value))}
                >
                  {TIME_OPTIONS.filter((o) => o.value > startMin).map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Duration preview */}
          {endMin > startMin && (
            <div className="slot-modal__duration-preview">
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>timer</span>
              <span>
                {endMin - startMin} min &nbsp;·&nbsp;{' '}
                {formatDisplayTime(minToTimeStr(startMin))} – {formatDisplayTime(minToTimeStr(endMin))}
              </span>
            </div>
          )}

          {error && (
            <div className="error-box">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
          <button
            type="button"
            onClick={handleSave}
            disabled={endMin <= startMin || submitting}
            className="btn-primary"
          >
            {submitting
              ? <><span className="material-symbols-outlined anim-spin">progress_activity</span>Saving…</>
              : <><span className="material-symbols-outlined">{isEdit ? 'save' : 'add'}</span>{isEdit ? 'Save Changes' : 'Add Slot'}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Slot Detail Drawer ───────────────────────────────────────────────────────

interface SlotDrawerProps {
  slot:      WorkingScheduleAPI | null;
  onClose:   () => void;
  onEdit:    (slot: WorkingScheduleAPI) => void;
  onDelete:  (id: number) => Promise<void>;
}

function SlotDrawer({ slot, onClose, onEdit, onDelete }: SlotDrawerProps) {
  const [deleting,  setDeleting]  = useState(false);
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
    <div className="slot-drawer">
      <div className="slot-drawer__backdrop" onClick={onClose} />

      <div className="slot-drawer__panel">
        {/* Header */}
        <div className="slot-drawer__header">
          <div className="slot-drawer__header-top">
            <span className="slot-drawer__badge">Working Hours</span>
            <button onClick={onClose} className="btn-icon">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <h3 className="slot-drawer__day">{slot.day_of_week}</h3>
          <p className="slot-drawer__time">
            {formatDisplayTime(slot.start_time)} – {formatDisplayTime(slot.end_time)}
          </p>
        </div>

        {/* Body */}
        <div className="slot-drawer__body">
          <div>
            <p className="slot-drawer__field-label">
              <span className="material-symbols-outlined">calendar_today</span>
              Day
            </p>
            <p className="slot-drawer__field-value">{slot.day_of_week} ({dayShort})</p>
          </div>
          <div>
            <p className="slot-drawer__field-label">
              <span className="material-symbols-outlined">schedule</span>
              Hours
            </p>
            <p className="slot-drawer__field-value">
              {formatDisplayTime(slot.start_time)} → {formatDisplayTime(slot.end_time)}
            </p>
          </div>
          <div>
            <p className="slot-drawer__field-label">
              <span className="material-symbols-outlined">timer</span>
              Duration
            </p>
            <p className="slot-drawer__field-value">{durationMin} min ({(durationMin / 60).toFixed(1)} h)</p>
          </div>
          <div>
            <p className="slot-drawer__field-label">
              <span className="material-symbols-outlined">key</span>
              Slot ID
            </p>
            <p className="slot-drawer__field-mono">{slot.id_working_schedule}</p>
          </div>

          {deleteErr && (
            <div className="error-box">
              <span className="material-symbols-outlined">error</span>
              {deleteErr}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="slot-drawer__footer">
          <button
            onClick={() => { onClose(); onEdit(slot); }}
            className="slot-drawer__btn-edit"
          >
            <span className="material-symbols-outlined">edit</span>
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="slot-drawer__btn-delete"
          >
            {deleting
              ? <span className="material-symbols-outlined anim-spin">progress_activity</span>
              : <span className="material-symbols-outlined">delete</span>
            }
          </button>
          <button onClick={onClose} className="slot-drawer__btn-close">Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Lawyer Selector ──────────────────────────────────────────────────────────

interface LawyerSelectorProps {
  lawyers:    { id_lawyer: number; full_name: string }[];
  selectedId: number | null;
  onSelect:   (id: number) => void;
  loading:    boolean;
}

function LawyerSelector({ lawyers, selectedId, onSelect, loading }: LawyerSelectorProps) {
  return (
    <div className="lawyer-selector">
      <span className="lawyer-selector__icon material-symbols-outlined">gavel</span>
      <div className="lawyer-selector__wrap">
        {loading ? (
          <div className="lawyer-selector__skeleton" />
        ) : (
          <select
            value={selectedId ?? ''}
            onChange={(e) => onSelect(Number(e.target.value))}
            className="lawyer-selector__select"
          >
            {lawyers.map((l) => (
              <option key={l.id_lawyer} value={l.id_lawyer}>{l.full_name}</option>
            ))}
          </select>
        )}
        <span className="lawyer-selector__chevron material-symbols-outlined">expand_more</span>
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

  // ── Appointments for the current week ─────────────────────────────────────
  const { appointments, loading: apptLoading } = useAppointments();

  const [drawerSlot, setDrawerSlot] = useState<WorkingScheduleAPI | null>(null);
  const [formOpen,   setFormOpen]   = useState(false);
  const [editSlot,   setEditSlot]   = useState<WorkingScheduleAPI | null>(null);
  const [prefillDay, setPrefillDay] = useState(DAYS_EN[0]!);

  // ── Week navigation ────────────────────────────────────────────────────────
  const [weekMonday, setWeekMonday] = useState<Date>(() => getMondayOfWeek(new Date()));
  const weekDates = getWeekDates(weekMonday);
  const today     = new Date();

  const goToPrevWeek = useCallback(() => {
    setWeekMonday((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }, []);

  const goToNextWeek = useCallback(() => {
    setWeekMonday((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }, []);

  const goToToday = useCallback(() => {
    setWeekMonday(getMondayOfWeek(new Date()));
  }, []);

  const gridScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gridScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openCreateForDay = useCallback((dayName: string, clientY: number, rectTop: number, scrollTop: number) => {
    const relY   = clientY - rectTop + scrollTop;
    const rawMin = DAY_START_HOUR * 60 + Math.round((relY / GRID_HEIGHT) * TOTAL_HOURS * 60 / 15) * 15;
    const clamped = Math.min(Math.max(rawMin, DAY_START_HOUR * 60), (DAY_END_HOUR - 1) * 60);
    setPrefillDay(dayName);
    setEditSlot(null);
    setFormOpen(true);
    void clamped;
  }, []);

  const openEdit = useCallback((slot: WorkingScheduleAPI) => {
    setEditSlot(slot);
    setPrefillDay(slot.day_of_week);
    setFormOpen(true);
  }, []);

  const handleSave = useCallback(async (dayOfWeek: string, startTime: string, endTime: string) => {
    await upsertSlot({ dayOfWeek, startTime, endTime });
  }, [upsertSlot]);

  const slotByDay = Object.fromEntries(
    slots.map((s) => [s.day_of_week, s]),
  ) as Record<string, WorkingScheduleAPI | undefined>;

  const hourLabels = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
    const h = DAY_START_HOUR + i;
    const label = h < 12 ? `${h}:00 AM` : h === 12 ? '12:00 PM' : `${h - 12}:00 PM`;
    return { label, offset: i * HOUR_HEIGHT_PX };
  });

  return (
    <>
      <main className="page">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* ── Header ──────────────────────────────────────────────────── */}
          <section className="section-header">
            <div>
              <span className="eyebrow">Working Schedule</span>
              <h2 className="section-header__title">Availability defined.</h2>
              <p className="section-header__subtitle">
                Configure when each practitioner is available. One slot per day of the week.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <LawyerSelector
                lawyers={lawyers}
                selectedId={selectedLawyerId}
                onSelect={selectLawyer}
                loading={lawyersLoading}
              />
              <button
                onClick={() => { setPrefillDay(DAYS_EN[0]!); setEditSlot(null); setFormOpen(true); }}
                className="btn-primary"
              >
                <span className="material-symbols-outlined">add</span>
                Add Slot
              </button>
            </div>
          </section>

          {/* ── Error banner ─────────────────────────────────────────────── */}
          {error && (
            <div className="error-banner">
              <span className="material-symbols-outlined">error</span>
              <span>{error}</span>
            </div>
          )}


          {/* ── Calendar Grid ─────────────────────────────────────────────── */}
          <div className="calendar-grid">
            {/* Week navigator */}
            <WeekNavigator
              weekDates={weekDates}
              onPrev={goToPrevWeek}
              onNext={goToNextWeek}
              onToday={goToToday}
            />

            {/* Day headers */}
            <div className="calendar-grid__day-headers">
              <div className="calendar-grid__day-head-spacer" />
              {DAYS_EN.map((day, i) => {
                const isWeekend  = i >= 5;
                const hasSlot    = !!slotByDay[day];
                const dateObj    = weekDates[i]!;
                const isToday    = isSameDay(dateObj, today);
                const dayNum     = dateObj.getDate();

                return (
                  <div key={day} className={`calendar-grid__day-head${isWeekend ? ' calendar-grid__day-head--weekend' : ''}${isToday ? ' calendar-grid__day-head--today' : ''}`}>
                    <span className={`calendar-grid__day-short${hasSlot ? ' calendar-grid__day-short--active' : ''}${isToday ? ' calendar-grid__day-short--today' : ''}`}>
                      {DAYS_SHORT[i]}
                    </span>
                    <span className={`calendar-grid__day-num${isToday ? ' calendar-grid__day-num--today' : ''}${hasSlot ? ' calendar-grid__day-num--active' : ''}`}>
                      {dayNum}
                    </span>
                    {hasSlot && <div className="calendar-grid__day-dot" />}
                  </div>
                );
              })}
            </div>

            {/* Time grid */}
            <div className="time-grid" ref={gridScrollRef}>
              {loading ? (
                <div className="time-grid__loading">
                  <span className="material-symbols-outlined anim-spin">progress_activity</span>
                  Loading schedule…
                </div>
              ) : (
                <div className="time-grid__inner" style={{ height: GRID_HEIGHT }}>
                  {/* Time labels column */}
                  <div className="time-col">
                    {hourLabels.map(({ label, offset }) => (
                      <div key={label} className="time-label" style={{ top: offset }}>
                        {label}
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  {DAYS_EN.map((day, dayIdx) => {
                    const isWeekend = dayIdx >= 5;
                    const slot      = slotByDay[day];
                    const dateObj   = weekDates[dayIdx]!;

                    const slotTopPx    = slot ? minToTopPx(timeToMin(slot.start_time)) : 0;
                    const slotHeightPx = slot ? Math.max(minToHeightPx(timeToMin(slot.end_time) - timeToMin(slot.start_time)), 32) : 0;

                    // Appointments that fall on this specific calendar day (filtered by lawyer)
                    const dayAppts = appointmentsForDay(appointments, dateObj).filter(
                      (a) => selectedLawyerId === null || a.id_lawyer === selectedLawyerId,
                    );

                    return (
                      <div
                        key={day}
                        className={`day-col${isWeekend ? ' day-col--weekend' : ''}`}
                        onClick={(e) => {
                          if (slot) return;
                          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                          openCreateForDay(day, e.clientY, rect.top, gridScrollRef.current?.scrollTop ?? 0);
                        }}
                      >
                        {/* Hour dividers */}
                        {hourLabels.map(({ offset }) => (
                          <div key={offset} className="hour-divider" style={{ top: offset }} />
                        ))}
                        {/* Half-hour dashes */}
                        {hourLabels.slice(0, -1).map(({ offset }) => (
                          <div key={offset + 'h'} className="half-hour-divider" style={{ top: offset + HOUR_HEIGHT_PX / 2 }} />
                        ))}

                        {/* Working slot block 
                        {slot && (
                          <div
                            className="slot-block"
                            style={{ top: slotTopPx, height: slotHeightPx }}
                            onClick={(e) => { e.stopPropagation(); setDrawerSlot(slot); }}
                          >
                            <span className="slot-block__label">Available</span>
                            <span className="slot-block__time">
                              {formatDisplayTime(slot.start_time)} – {formatDisplayTime(slot.end_time)}
                            </span>
                            {slotHeightPx > 56 && (
                              <span className="slot-block__duration">
                                {timeToMin(slot.end_time) - timeToMin(slot.start_time)} min
                              </span>
                            )}
                          </div>
                        )}*/}

                        {/* Appointment blocks for this calendar day */}
                        {!apptLoading && dayAppts.map((appt) => {
                          const startMin    = isoToLocalMin(appt.start_datetime);
                          const endMin      = isoToLocalMin(appt.end_datetime);
                          const apptTop     = minToTopPx(startMin);
                          const apptHeight  = Math.max(minToHeightPx(endMin - startMin), 28);
                          return (
                            <div
                              key={appt.id_appointment}
                              className="appt-block"
                              style={{ top: apptTop, height: apptHeight }}
                              onClick={(e) => e.stopPropagation()}
                              title={appt.subject}
                            >
                              <span className="appt-block__subject">{appt.subject}</span>
                              {apptHeight > 40 && (
                                <span className="appt-block__time">
                                  {formatApptTime(appt.start_datetime)} – {formatApptTime(appt.end_datetime)}
                                </span>
                              )}
                            </div>
                          );
                        })}

                        {/* Empty hint on hover */}
                        {!slot && !isWeekend && (
                          <div className="slot-block-hint">
                            <div className="slot-block-hint__pill">
                              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>add</span>
                              <span>Add slot</span>
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

          {/* ── Legend ───────────────────────────────────────────────────── */}
          <div className="scheduler-legend">
            <div className="scheduler-legend__item">
              <div className="scheduler-legend__swatch-available" />
              <span className="scheduler-legend__label">Available</span>
            </div>
            <div className="scheduler-legend__item">
              <div className="scheduler-legend__swatch-appointment" />
              <span className="scheduler-legend__label">Appointment</span>
            </div>
            <div className="scheduler-legend__item">
              <div className="scheduler-legend__swatch-empty" />
              <span className="scheduler-legend__label">No slot (click to add)</span>
            </div>
            <span className="scheduler-legend__hint">
              Click a slot to view / edit / delete &nbsp;·&nbsp; Click an empty day to add
            </span>
          </div>

        </div>
      </main>

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
