import type  { LawyerAPI } from '../../types/lawyer';
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
    <div
      className={`grid grid-cols-12 px-8 py-6 items-center hover:bg-surface-container-low transition-colors group relative border-l-4 ${
        isActive ? 'border-primary' : 'border-transparent'
      }`}
    >
      {/* Name + badge */}
      <div className="col-span-4 flex items-center gap-4">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center font-headline font-bold text-sm ${
            isActive
              ? 'bg-primary-fixed text-primary'
              : 'bg-surface-container-high text-on-surface-variant'
          }`}
        >
          {initials}
        </div>
        <div>
          <p className="font-headline font-bold text-on-surface">{lawyer.full_name}</p>
          {isActive ? (
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Active Practitioner
            </span>
          ) : (
            <span className="text-[10px] text-on-surface-variant px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
              Practitioner
            </span>
          )}
        </div>
      </div>

      {/* DNI */}
      <div className="col-span-2 text-sm text-on-surface-variant font-medium">
        {formatNationalId(lawyer.national_id)}
      </div>

      {/* Location */}
      <div className="col-span-2 text-sm text-on-surface-variant font-medium">
        {lawyer.location}
      </div>

      {/* Timezone */}
      <div className="col-span-3 text-sm text-on-surface-variant font-medium">
        {lawyer.timezone}
      </div>

      {/* Row actions (visible on hover) */}
      <div className="col-span-1 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onSelect?.(lawyer)}
          className="p-2 text-on-surface-variant hover:text-primary transition-colors"
          title="Select"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            check_circle
          </span>
        </button>
        <button
          onClick={() => onEdit?.(lawyer)}
          className="p-2 text-on-surface-variant hover:text-primary transition-colors"
          title="Edit"
        >
          <span className="material-symbols-outlined">edit</span>
        </button>
        <button
          onClick={() => onDelete?.(lawyer)}
          className="p-2 text-on-surface-variant hover:text-error transition-colors"
          title="Delete"
        >
          <span className="material-symbols-outlined">delete</span>
        </button>
      </div>
    </div>
  );
}
