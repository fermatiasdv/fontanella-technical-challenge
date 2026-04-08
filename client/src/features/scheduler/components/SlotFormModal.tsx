import { useState, useEffect } from 'react';
import {
  TIME_OPTIONS,
  timeToMin,
  minToTimeStr,
  formatDisplayTime,
} from '@/features/scheduler/utils/calendarLayout';
import { DAYS_EN } from '@/features/scheduler/constants/scheduler.constants';
import type { WorkingScheduleAPI } from '@/services/workingSchedule.service';

export interface SlotFormModalProps {
  isOpen:     boolean;
  editSlot:   WorkingScheduleAPI | null;
  prefillDay: string;
  onClose:    () => void;
  onSave:     (dayOfWeek: string, startTime: string, endTime: string) => Promise<void>;
}

export function SlotFormModal({ isOpen, editSlot, prefillDay, onClose, onSave }: SlotFormModalProps) {
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
