import type { ClientAPI } from '@/features/clients/types/client.types';

const AVATAR_MODIFIERS = ['--blue', '--slate', '--amber'] as const;

function getInitials(name?: string): string {
  if (!name?.trim()) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

interface ClientRowProps {
  client:      ClientAPI;
  colorIndex:  number;
  onEdit?:     (client: ClientAPI) => void;
  onDelete?:   (client: ClientAPI) => void;
}

export function ClientRow({ client, colorIndex, onEdit, onDelete }: ClientRowProps) {
  const initials       = getInitials(client.trade_name);
  const avatarModifier = AVATAR_MODIFIERS[colorIndex % AVATAR_MODIFIERS.length];

  return (
    <tr className="client-row">
      <td className="client-row__name-cell">
        <div className="client-row__name-wrap">
          <div className={`client-avatar client-avatar${avatarModifier}`}>{initials}</div>
          <div>
            <div className="client-row__trade-name">{client.trade_name}</div>
            <div className="client-row__company-id">{client.company_id}</div>
          </div>
        </div>
      </td>
      <td className="client-row__cell">
        <div className="client-row__field">
          <span className="material-symbols-outlined">location_on</span>
          {client.location}
        </div>
      </td>
      <td className="client-row__cell">
        <div className="client-row__field client-row__field--muted">
          <span className="material-symbols-outlined">schedule</span>
          {client.timezone}
        </div>
      </td>
      <td className="client-row__actions-cell">
        <div className="client-row__actions">
          <button onClick={() => onEdit?.(client)} className="client-row__action-btn client-row__action-btn--edit" title="Edit">
            <span className="material-symbols-outlined">edit</span>
          </button>
          <button onClick={() => onDelete?.(client)} className="client-row__action-btn client-row__action-btn--delete" title="Delete">
            <span className="material-symbols-outlined">delete</span>
          </button>
        </div>
      </td>
    </tr>
  );
}
