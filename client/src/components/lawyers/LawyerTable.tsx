import type  { LawyerAPI } from '../../types/lawyer';
import LawyerRow from './LawyerRow';

interface LawyerTableProps {
  lawyers: LawyerAPI[];
  activeLawyerId?: number;
  onSelectLawyer?: (lawyer: LawyerAPI) => void;
  onEditLawyer?: (lawyer: LawyerAPI) => void;
  onDeleteLawyer?: (lawyer: LawyerAPI) => void;
}

const TABLE_HEADERS = [
  { label: 'Practitioner Name', colSpan: 'col-span-4' },
  { label: 'DNI',               colSpan: 'col-span-2' },
  { label: 'Location',          colSpan: 'col-span-2' },
  { label: 'Timezone',          colSpan: 'col-span-3' },
  { label: '',                  colSpan: 'col-span-1' },
];

export default function LawyerTable({
  lawyers,
  activeLawyerId,
  onSelectLawyer,
  onEditLawyer,
  onDeleteLawyer,
}: LawyerTableProps) {
  return (
    <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="grid grid-cols-12 px-8 py-4 bg-surface-container-low">
        {TABLE_HEADERS.map((h) => (
          <div key={h.label} className={`${h.colSpan} all-caps-label text-on-surface-variant font-bold`}>
            {h.label}
          </div>
        ))}
      </div>

      {/* Rows */}
      {lawyers.map((lawyer) => (
        <LawyerRow
          key={lawyer.id_lawyer}
          lawyer={lawyer}
          isActive={lawyer.id_lawyer === activeLawyerId}
          onSelect={onSelectLawyer}
          onEdit={onEditLawyer}
          onDelete={onDeleteLawyer}
        />
      ))}
    </div>
  );
}
