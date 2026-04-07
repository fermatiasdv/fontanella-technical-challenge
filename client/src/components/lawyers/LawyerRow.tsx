import type { LawyerAPI } from '../../types/lawyer';
import { getInitials, formatNationalId } from '../../lib/lawyerUtils';

interface LawyerRowProps {
  lawyer: LawyerAPI;
  isActive?: boolean;
  onSelect?: (lawyer: LawyerAPI) => void;
  onEdit?: (lawyer: LawyerAPI) => void;
  onDelete?: (lawyer: LawyerAPI) => void;
}

export default function LawyerRow({ lawyer, isActive, onSelect, onEdit, onDelete }: LawyerRowProps) {
  const initials = getInitials(lawyer.full_name);

  return (
    <div className={`lawyer-row${isActive ? ' lawyer-row--active' : ''}`}>
      {/* Name + badge */}
      <div className="lawyer-row__name-cell">
        <div className={`lawyer-row__avatar${isActive ? ' lawyer-row__avatar--active' : ''}`}>
          {initials}
        </div>
        <div>
          <p className="lawyer-row__name">{lawyer.full_name}</p>
          <span className={`lawyer-row__badge${isActive ? ' lawyer-row__badge--active' : ''}`}>
            {isActive ? 'Active Practitioner' : 'Practitioner'}
          </span>
        </div>
      </div>

      {/* DNI */}
      <div className="lawyer-row__field">{formatNationalId(lawyer.national_id)}</div>

      {/* Location */}
      <div className="lawyer-row__field">{lawyer.location}</div>

      {/* Timezone */}
      <div className="lawyer-row__field">{lawyer.timezone}</div>

      {/* Row actions */}
      <div className="lawyer-row__actions">
        <button
          onClick={() => onSelect?.(lawyer)}
          className="lawyer-row__action-btn"
          title="Select"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
        </button>
        <button
          onClick={() => onEdit?.(lawyer)}
          className="lawyer-row__action-btn"
          title="Edit"
        >
          <span className="material-symbols-outlined">edit</span>
        </button>
        <button
          onClick={() => onDelete?.(lawyer)}
          className="lawyer-row__action-btn lawyer-row__action-btn--delete"
          title="Delete"
        >
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>
    </div>
  );
}
