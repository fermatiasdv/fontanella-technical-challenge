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

const TABLE_HEADERS = ['Client Name', 'Location', 'Timezone', ''];

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
    <div className="client-table">
      <div className="client-table__scroll" style={{ overflowX: 'auto' }}>
        <table>
          <thead className="client-table__head">
            <tr>
              {TABLE_HEADERS.map((h, i) => (
                <th key={i} className="client-table__th">{h}</th>
              ))}
            </tr>
          </thead>

          <tbody className="client-table__body">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={4} className="client-table__empty-cell">
                  <span className="material-symbols-outlined">person_search</span>
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
      <div className="client-table__footer">
        <span className="client-table__count">
          Showing <strong>{showing}</strong> of <strong>{totalClients}</strong> clients
        </span>

        <div className="client-table__pager">
          <button
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage <= 1}
            className="client-table__pager-btn"
            aria-label="Previous page"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="client-table__pager-btn"
            aria-label="Next page"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  );
}
