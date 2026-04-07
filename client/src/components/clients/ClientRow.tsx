import type { ClientAPI } from '../../types/client';

// ─── Avatar color palette (cycles by index) ───────────────────────────────────
const AVATAR_COLORS = [
  'bg-primary-fixed text-primary',
  'bg-secondary-fixed text-secondary',
  'bg-tertiary-fixed text-tertiary',
];

function getInitials(name?: string): string {
  if (!name?.trim()) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

interface ClientRowProps {
  client: ClientAPI;
  colorIndex: number;
  onEdit?: (client: ClientAPI) => void;
  onDelete?: (client: ClientAPI) => void;
}

export default function ClientRow({ client, colorIndex, onEdit, onDelete }: ClientRowProps) {
  const initials    = getInitials(client.trade_name);
  const avatarColor = AVATAR_COLORS[colorIndex % AVATAR_COLORS.length];

  return (
    <tr className="hover:bg-surface-container-low/50 transition-colors group">

      {/* Client Name */}
      <td className="px-8 py-6">
        <div className="flex items-center gap-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-headline font-bold text-sm shrink-0 ${avatarColor}`}
          >
            {initials}
          </div>
          <div>
            <div className="font-headline font-bold text-on-surface tracking-tight">
              {client.trade_name}
            </div>
            <div className="text-[11px] text-on-surface-variant">{client.company_id}</div>
          </div>
        </div>
      </td>

      {/* Location */}
      <td className="px-6 py-6">
        <div className="flex items-center gap-2 text-sm text-on-surface font-medium">
          <span className="material-symbols-outlined text-[14px] text-outline">location_on</span>
          {client.location}
        </div>
      </td>

      {/* Timezone */}
      <td className="px-6 py-6">
        <div className="flex items-center gap-2 text-sm text-on-surface-variant font-medium">
          <span className="material-symbols-outlined text-[14px] text-outline">schedule</span>
          {client.timezone}
        </div>
      </td>

      {/* Row actions (visible on hover) */}
      <td className="px-8 py-6 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit?.(client)}
            className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-lg hover:bg-surface-container"
            title="Edit"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button
            onClick={() => onDelete?.(client)}
            className="p-2 text-on-surface-variant hover:text-error transition-colors rounded-lg hover:bg-surface-container"
            title="Delete"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      </td>
    </tr>
  );
}
