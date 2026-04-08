import { useState, useRef, useEffect, useCallback } from 'react';

import { swal }               from '@/shared/utils/swal';
import { useScheduler }       from '@/features/scheduler/hooks/useScheduler';
import { useAppointments }    from '@/features/appointments/hooks/useAppointments';
import { WeekNavigator }      from '@/features/scheduler/components/WeekNavigator';
import { LawyerSelector }     from '@/features/scheduler/components/LawyerSelector';
import { SlotDrawer }         from '@/features/scheduler/components/SlotDrawer';
import { SlotFormModal }      from '@/features/scheduler/components/SlotFormModal';
import { AppointmentFormModal } from '@/features/appointments/components/AppointmentFormModal';
import { useLawyerList }      from '@/shared/hooks/useLawyerList';
import { useClientList }      from '@/shared/hooks/useClientList';

import {
  DAYS_EN,
  DAYS_SHORT,
  HOUR_HEIGHT_PX,
} from '@/features/scheduler/constants/scheduler.constants';
import {
  getMondayOfWeek,
  getWeekDates,
  isSameDay,
  toDateStr,
} from '@/features/scheduler/utils/dateHelpers';
import {
  HOUR_LABELS,
  GRID_HEIGHT,
  timeToMin,
  minToTopPx,
  minToHeightPx,
  isoToLocalMin,
  formatApptTime,
} from '@/features/scheduler/utils/calendarLayout';

import type { WorkingScheduleAPI } from '@/services/workingSchedule.service';
import type { VacationAPI }        from '@/services/vacations.service';
import type { AppointmentAPI, CreateAppointmentDto } from '@/features/appointments/types/appointment.types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isVacationDay(vacations: VacationAPI[], date: Date): boolean {
  const d = toDateStr(date);
  return vacations.some((v) => d >= v.start_date && d <= v.end_date);
}

function appointmentsForDay(appointments: AppointmentAPI[], day: Date): AppointmentAPI[] {
  return appointments.filter((a) => isSameDay(new Date(a.start_datetime), day));
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SchedulerManagement() {
  const {
    lawyers,
    lawyersLoading,
    selectedLawyerId,
    selectLawyer,
    slots,
    loading,
    error,
    upsertSlot,
    deleteSlot,
    vacations,
  } = useScheduler();

  // Appointments (for calendar overlay)
  const {
    appointments,
    loading: apptLoading,
    update:  updateAppointment,
  } = useAppointments();

  // Lawyer / client lists needed by the AppointmentFormModal
  const { lawyers: lawyerList, loading: lawyerListLoading } = useLawyerList();
  const { clients,             loading: clientsLoading }    = useClientList();

  // Fast lookup maps
  const clientMap = Object.fromEntries(clients.map((c) => [c.id_client, c]));

  // ── Slot interaction state ─────────────────────────────────────────────────
  const [drawerSlot, setDrawerSlot] = useState<WorkingScheduleAPI | null>(null);
  const [formOpen,   setFormOpen]   = useState(false);
  const [editSlot,   setEditSlot]   = useState<WorkingScheduleAPI | null>(null);
  const [prefillDay, setPrefillDay] = useState<string>(DAYS_EN[0]!);

  // ── Appointment edit modal ─────────────────────────────────────────────────
  const [apptModalOpen,  setApptModalOpen]  = useState(false);
  const [apptEditTarget, setApptEditTarget] = useState<AppointmentAPI | null>(null);

  const openApptEdit = useCallback((appt: AppointmentAPI) => {
    setApptEditTarget(appt);
    setApptModalOpen(true);
  }, []);

  const handleApptSave = useCallback(async (dto: CreateAppointmentDto) => {
    if (apptEditTarget) {
      await updateAppointment(apptEditTarget.id_appointment, dto);
      swal.success('Turno actualizado correctamente');
    }
  }, [apptEditTarget, updateAppointment]);

  // ── Week navigation ────────────────────────────────────────────────────────
  const [weekMonday, setWeekMonday] = useState<Date>(() => getMondayOfWeek(new Date()));
  const weekDates = getWeekDates(weekMonday);
  const today     = new Date();

  const goToPrevWeek = useCallback(() => {
    setWeekMonday((prev) => { const d = new Date(prev); d.setDate(d.getDate() - 7); return d; });
  }, []);

  const goToNextWeek = useCallback(() => {
    setWeekMonday((prev) => { const d = new Date(prev); d.setDate(d.getDate() + 7); return d; });
  }, []);

  const goToToday = useCallback(() => setWeekMonday(getMondayOfWeek(new Date())), []);

  // ── Grid scroll ref ────────────────────────────────────────────────────────
  const gridScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gridScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ── Slot CRUD callbacks ────────────────────────────────────────────────────
  const openCreateForDay = useCallback((dayName: string) => {
    setPrefillDay(dayName);
    setEditSlot(null);
    setFormOpen(true);
  }, []);

  const openEdit = useCallback((slot: WorkingScheduleAPI) => {
    setEditSlot(slot);
    setPrefillDay(slot.day_of_week);
    setFormOpen(true);
  }, []);

  const handleSlotSave = useCallback(
    async (dayOfWeek: string, startTime: string, endTime: string) => {
      await upsertSlot({ dayOfWeek, startTime, endTime });
      swal.success(editSlot ? 'Horario actualizado' : 'Horario agregado');
    },
    [upsertSlot, editSlot],
  );

  // ── Derived: slot-by-day map ───────────────────────────────────────────────
  const slotByDay = Object.fromEntries(
    slots.map((s) => [s.day_of_week, s]),
  ) as Record<string, WorkingScheduleAPI | undefined>;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <main className="page">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

          {/* ── Header ───────────────────────────────────────────────────── */}
          <section className="section-header">
            <div>
              <span className="eyebrow">Working Schedule</span>
              <h2 className="section-header__title">Availability defined.</h2>
              <p className="section-header__subtitle">
                Configure when each practitioner is available. One slot per day of the week.
              </p>
            </div>
            <LawyerSelector
              lawyers={lawyers}
              selectedId={selectedLawyerId}
              onSelect={selectLawyer}
              loading={lawyersLoading}
            />
          </section>

          {/* ── Error banner ─────────────────────────────────────────────── */}
          {error && (
            <div className="error-banner">
              <span className="material-symbols-outlined">error</span>
              <span>{error}</span>
            </div>
          )}

          {/* ── Calendar grid ────────────────────────────────────────────── */}
          <div className="calendar-grid">
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
                const isWeekend     = i >= 5;
                const hasSlot       = !!slotByDay[day];
                const dateObj       = weekDates[i]!;
                const isToday       = isSameDay(dateObj, today);
                const dayNum        = dateObj.getDate();
                const isUnavailable = !hasSlot || isVacationDay(vacations, dateObj);

                return (
                  <div
                    key={day}
                    className={[
                      'calendar-grid__day-head',
                      isWeekend     ? 'calendar-grid__day-head--weekend'     : '',
                      isToday       ? 'calendar-grid__day-head--today'       : '',
                      isUnavailable ? 'calendar-grid__day-head--unavailable' : '',
                    ].filter(Boolean).join(' ')}
                  >
                    <span className={[
                      'calendar-grid__day-short',
                      hasSlot ? 'calendar-grid__day-short--active' : '',
                      isToday ? 'calendar-grid__day-short--today'  : '',
                    ].filter(Boolean).join(' ')}>
                      {DAYS_SHORT[i]}
                    </span>
                    <span className={[
                      'calendar-grid__day-num',
                      isToday   ? 'calendar-grid__day-num--today'  : '',
                      hasSlot   ? 'calendar-grid__day-num--active' : '',
                    ].filter(Boolean).join(' ')}>
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
                    {HOUR_LABELS.map(({ label, offset }) => (
                      <div key={label} className="time-label" style={{ top: offset }}>
                        {label}
                      </div>
                    ))}
                  </div>

                  {/* Day columns */}
                  {DAYS_EN.map((day, dayIdx) => {
                    const isWeekend     = dayIdx >= 5;
                    const slot          = slotByDay[day];
                    const dateObj       = weekDates[dayIdx]!;
                    const isUnavailable = !slot || isVacationDay(vacations, dateObj);

                    const slotTopPx    = slot ? minToTopPx(timeToMin(slot.start_time)) : 0;
                    const slotHeightPx = slot
                      ? Math.max(minToHeightPx(timeToMin(slot.end_time) - timeToMin(slot.start_time)), 32)
                      : 0;

                    const dayAppts = appointmentsForDay(appointments, dateObj).filter(
                      (a) => selectedLawyerId === null || a.id_lawyer === selectedLawyerId,
                    );

                    return (
                      <div
                        key={day}
                        className={[
                          'day-col',
                          isWeekend     ? 'day-col--weekend'     : '',
                          isUnavailable ? 'day-col--unavailable' : '',
                        ].filter(Boolean).join(' ')}
                        onClick={isUnavailable ? undefined : () => {
                          if (slot) return;
                          openCreateForDay(day);
                        }}
                      >
                        {/* Hour dividers */}
                        {HOUR_LABELS.map(({ offset }) => (
                          <div key={offset} className="hour-divider" style={{ top: offset }} />
                        ))}
                        {/* Half-hour dashes */}
                        {HOUR_LABELS.slice(0, -1).map(({ offset }) => (
                          <div key={`${offset}h`} className="half-hour-divider" style={{ top: offset + HOUR_HEIGHT_PX / 2 }} />
                        ))}

                        {/* Working hours block */}
                        {slot && (
                          <div
                            className="working-slot"
                            style={{ top: slotTopPx, height: slotHeightPx }}
                            onClick={(e) => { e.stopPropagation(); setDrawerSlot(slot); }}
                          />
                        )}

                        {/* Appointment blocks */}
                        {!apptLoading && dayAppts.map((appt) => {
                          const startMin   = isoToLocalMin(appt.start_datetime);
                          const endMin     = isoToLocalMin(appt.end_datetime);
                          const apptTop    = minToTopPx(startMin);
                          const apptHeight = Math.max(minToHeightPx(endMin - startMin), 28);

                          const client = clientMap[appt.id_client];

                          const tooltipParts = [appt.subject];
                          if (client) tooltipParts.push(client.trade_name);

                          return (
                            <div
                              key={appt.id_appointment}
                              className="appt-block"
                              style={{ top: apptTop, height: apptHeight, cursor: 'pointer' }}
                              onClick={(e) => { e.stopPropagation(); openApptEdit(appt); }}
                              title={tooltipParts.join(' · ')}
                            >
                              <span className="appt-block__subject">{appt.subject}</span>
                              {apptHeight > 36 && client && (
                                <span className="appt-block__client">{client.trade_name}</span>
                              )}
                              {apptHeight > 52 && (
                                <span className="appt-block__time">
                                  {formatApptTime(appt.start_datetime)} – {formatApptTime(appt.end_datetime)}
                                </span>
                              )}
                            </div>
                          );
                        })}
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
              <div className="scheduler-legend__swatch-unavailable" />
              <span className="scheduler-legend__label">No disponible</span>
            </div>
            <span className="scheduler-legend__hint">
              Click a slot to view / edit / delete &nbsp;·&nbsp; Click an empty day to add
            </span>
          </div>

        </div>
      </main>

      {/* ── Overlays ─────────────────────────────────────────────────────── */}
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
        onSave={handleSlotSave}
      />

      <AppointmentFormModal
        isOpen={apptModalOpen}
        editAppointment={apptEditTarget}
        lawyers={lawyerList}
        clients={clients}
        lawyersLoading={lawyerListLoading}
        clientsLoading={clientsLoading}
        onClose={() => { setApptModalOpen(false); setApptEditTarget(null); }}
        onSave={handleApptSave}
      />
    </>
  );
}
