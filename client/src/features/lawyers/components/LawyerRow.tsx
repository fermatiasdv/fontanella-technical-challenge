import type { LawyerAPI } from '@/features/lawyers/types/lawyer.types';
import { getInitials, formatNationalId } from '@/features/lawyers/utils/lawyerUtils';

interface LawyerRowProps {
  lawyer:    LawyerAPI;
  isActive?: boolean;
  onSelect?: (lawyer: LawyerAPI) => void;
  onEdit?:   (lawyer: LawyerAPI) => void;
  onDelete?: (lawyer: LawyerAPI) => void;
}

export function LawyerRow({ lawyer, isActive, onSelect, onEdit, onDelete }: LawyerRowProps) {
  const initials = getInitials(lawyer.full_name);

  return (
    <div className={`lawyer-row${isActive ? ' lawyer-row--active' : ''}`}>
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

      <div className="lawyer-row__field">{formatNationalId(lawyer.national_id)}</div>
      <div className="lawyer-row__field">{lawyer.location}</div>
      <div className="lawyer-row__field">{lawyer.timezone}</div>

      <div className="lawyer-row__actions">
        <button onClick={() => onSelect?.(lawyer)} className="lawyer-row__action-btn" title="Select">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
        </button>
        <button onClick={() => onEdit?.(lawyer)} className="lawyer-row__action-btn" title="Edit">
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
