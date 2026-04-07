import type { ClientAPI } from '../../types/client';
import ClientRow from './ClientRow';

interface ClientTableProps {
  clients: ClientAPI[];
  totalClients: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange?: (page: number) => void;
  onEditClient?: (client: ClientAPI) => void;
  onDeleteClient?: (client: ClientAPI) => void;
}

const TABLE_HEADERS = [
  { label: 'Client Name' },
  { label: 'Location' },
  { label: 'Timezone' },
  { label: '' },
];

export default function ClientTable({
  clients,
  totalClients,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  onEditClient,
  onDeleteClient,
}: ClientTableProps) {
  const showing = Math.min(itemsPerPage, totalClients);

  return (
    <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-surface-container">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-surface-container-low">
            <tr>
              {TABLE_HEADERS.map((h, i) => (
                <th
                  key={i}
                  className="px-6 py-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant border-b border-surface-container first:px-8 last:px-8"
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-surface-container">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-8 py-16 text-center text-on-surface-variant text-sm">
                  <span className="material-symbols-outlined text-4xl block mb-3 text-outline">
                    person_search
                  </span>
                  No clients match your search.
                </td>
              </tr>
            ) : (
              clients.map((client, index) => (
                <ClientRow
                  key={client.id_client}
                  client={client}
                  colorIndex={index}
                  onEdit={onEditClient}
                  onDelete={onDeleteClient}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="px-8 py-4 bg-surface-container-low border-t border-surface-container flex justify-between items-center">
        <span className="text-xs text-on-surface-variant">
          Showing{' '}
          <span className="font-bold text-on-surface">{showing}</span> of{' '}
          <span className="font-bold text-on-surface">{totalClients}</span> clients
        </span>

        <div className="flex gap-2">
          <button
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border border-surface-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
          </button>
          <button
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded bg-surface-container-lowest text-on-surface-variant hover:text-on-surface border border-surface-container transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
