import { useState } from 'react';
import type { AppointmentAPI } from '@/features/appointments/types/appointment.types';
import { formatDatetime } from '@/features/appointments/utils/datetimeUtils';

export interface AppointmentRowProps {
  appointment: AppointmentAPI;
  lawyerName:  string;
  clientName:  string;
  onEdit:      (a: AppointmentAPI) => void;
  onDelete:    (id: number) => Promise<void>;
}

export function AppointmentRow({ appointment, lawyerName, clientName, onEdit, onDelete }: AppointmentRowProps) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Delete appointment "${appointment.subject}"?`)) return;
    setDeleting(true);
    try { await onDelete(appointment.id_appointment); }
    finally { setDeleting(false); }
  };

  return (
    <tr className="appt-row">
      <td className="appt-row__cell">
        <p className="appt-row__subject">{appointment.subject}</p>
        {appointment.description && <p className="appt-row__desc">{appointment.description}</p>}
      </td>
      <td className="appt-row__cell">
        <div className="appt-row__person appt-row__person--lawyer">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>gavel</span>
          <span>{lawyerName}</span>
        </div>
      </td>
      <td className="appt-row__cell">
        <div className="appt-row__person appt-row__person--client">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>business</span>
          <span>{clientName}</span>
        </div>
      </td>
      <td className="appt-row__cell"><span className="appt-row__datetime">{formatDatetime(appointment.start_datetime)}</span></td>
      <td className="appt-row__cell"><span className="appt-row__datetime">{formatDatetime(appointment.end_datetime)}</span></td>
      <td className="appt-row__cell">
        <div className="appt-row__actions">
          <button onClick={() => onEdit(appointment)} className="appt-row__btn appt-row__btn--edit" title="Edit">
            <span className="material-symbols-outlined">edit</span>
          </button>
          <button onClick={handleDelete} disabled={deleting} className="appt-row__btn appt-row__btn--delete" title="Delete">
            {deleting ? <span className="material-symbols-outlined anim-spin">progress_activity</span> : <span className="material-symbols-outlined">delete</span>}
          </button>
        </div>
      </td>
    </tr>
  );
}
