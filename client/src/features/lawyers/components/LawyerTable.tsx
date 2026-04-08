import type { LawyerAPI } from '@/features/lawyers/types/lawyer.types';
import { LawyerRow } from '@/features/lawyers/components/LawyerRow';

interface LawyerTableProps {
  lawyers:        LawyerAPI[];
  activeLawyerId?: number;
  onSelectLawyer?: (lawyer: LawyerAPI) => void;
  onEditLawyer?:   (lawyer: LawyerAPI) => void;
  onDeleteLawyer?: (lawyer: LawyerAPI) => void;
}

const TABLE_HEADERS = ['Practitioner Name', 'DNI', 'Location', 'Timezone', ''];

export function LawyerTable({
  lawyers,
  activeLawyerId,
  onSelectLawyer,
  onEditLawyer,
  onDeleteLawyer,
}: LawyerTableProps) {
  return (
    <div className="lawyer-table">
      <div className="lawyer-table__head">
        {TABLE_HEADERS.map((h, i) => (
          <div key={i} className="lawyer-table__th">{h}</div>
        ))}
      </div>
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
