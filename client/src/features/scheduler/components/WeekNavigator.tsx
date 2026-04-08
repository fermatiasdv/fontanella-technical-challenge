import { formatWeekLabel, isSameDay } from '@/features/scheduler/utils/dateHelpers';

export interface WeekNavigatorProps {
  weekDates: Date[];
  onPrev:    () => void;
  onNext:    () => void;
  onToday:   () => void;
}

export function WeekNavigator({ weekDates, onPrev, onNext, onToday }: WeekNavigatorProps) {
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
