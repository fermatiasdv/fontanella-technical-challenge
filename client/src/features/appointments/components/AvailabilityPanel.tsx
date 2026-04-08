import { useState, useEffect } from 'react';
import { workingScheduleService } from '@/services/workingSchedule.service';
import { vacationsService } from '@/services/vacations.service';
import type { WorkingScheduleAPI } from '@/services/workingSchedule.service';
import type { VacationAPI } from '@/services/vacations.service';

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;

function fmtTime(t: string): string {
  const [hStr, mStr] = t.split(':');
  const h = parseInt(hStr ?? '0', 10);
  const m = mStr ?? '00';
  const per = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${per}`;
}

function fmtDate(d: string): string {
  const [y, mo, day] = d.split('-');
  return `${day}/${mo}/${y}`;
}

interface AvailabilityPanelProps {
  lawyerId: number | '';
}

export function AvailabilityPanel({ lawyerId }: AvailabilityPanelProps) {
  const [schedule,  setSchedule]  = useState<WorkingScheduleAPI[]>([]);
  const [vacations, setVacations] = useState<VacationAPI[]>([]);
  const [loading,   setLoading]   = useState(false);

  useEffect(() => {
    if (lawyerId === '') { setSchedule([]); setVacations([]); return; }
    const controller = new AbortController();
    setLoading(true);
    Promise.all([
      workingScheduleService.getByLawyer(lawyerId, controller.signal),
      vacationsService.getByLawyer(lawyerId, controller.signal),
    ])
      .then(([sched, vacs]) => {
        if (controller.signal.aborted) return;
        const sorted = [...sched].sort(
          (a, b) => DAYS_ORDER.indexOf(a.day_of_week as typeof DAYS_ORDER[number]) -
                    DAYS_ORDER.indexOf(b.day_of_week as typeof DAYS_ORDER[number]),
        );
        setSchedule(sorted);
        setVacations(vacs);
      })
      .catch(() => {})
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [lawyerId]);

  if (lawyerId === '') return null;

  return (
    <div className="avail-panel">
      <div className="avail-panel__header">
        <span className="material-symbols-outlined" style={{ fontSize: '1rem', color: 'var(--c-primary)' }}>info</span>
        <span className="avail-panel__title">Disponibilidad del abogado</span>
      </div>

      {loading ? (
        <div className="avail-panel__loading">
          <span className="material-symbols-outlined anim-spin" style={{ fontSize: '1rem' }}>progress_activity</span>
          Cargando…
        </div>
      ) : (
        <div className="avail-panel__body">
          <div className="avail-panel__section">
            <p className="avail-panel__section-label">
              <span className="material-symbols-outlined">schedule</span>Horario laboral
            </p>
            {schedule.length === 0 ? (
              <p className="avail-panel__empty">Sin horario configurado</p>
            ) : (
              <ul className="avail-panel__schedule-list">
                {schedule.map((s) => (
                  <li key={s.id_working_schedule} className="avail-panel__schedule-row">
                    <span className="avail-panel__day">{s.day_of_week.slice(0, 3)}</span>
                    <span className="avail-panel__hours">{fmtTime(s.start_time)} – {fmtTime(s.end_time)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="avail-panel__section">
            <p className="avail-panel__section-label">
              <span className="material-symbols-outlined">beach_access</span>Vacaciones
            </p>
            {vacations.length === 0 ? (
              <p className="avail-panel__empty">Sin vacaciones registradas</p>
            ) : (
              <ul className="avail-panel__vac-list">
                {vacations.map((v) => (
                  <li key={v.id_vacation} className="avail-panel__vac-row">
                    <span className="material-symbols-outlined" style={{ fontSize: '0.875rem', color: 'var(--c-error)' }}>do_not_disturb_on</span>
                    <span>{fmtDate(v.start_date)} → {fmtDate(v.end_date)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
