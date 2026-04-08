import { useState } from 'react';
import { timeToMin, formatDisplayTime } from '@/features/scheduler/utils/calendarLayout';
import { DAYS_EN, DAYS_SHORT } from '@/features/scheduler/constants/scheduler.constants';
import type { WorkingScheduleAPI } from '@/services/workingSchedule.service';

export interface SlotDrawerProps {
  slot:     WorkingScheduleAPI | null;
  onClose:  () => void;
  onEdit:   (slot: WorkingScheduleAPI) => void;
  onDelete: (id: number) => Promise<void>;
}

export function SlotDrawer({ slot, onClose, onEdit, onDelete }: SlotDrawerProps) {
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
