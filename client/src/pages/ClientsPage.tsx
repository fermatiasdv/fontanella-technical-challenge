import { useState } from 'react';
import { useClients } from '../hooks/useClients';
import type { ClientAPI, CreateClientDto } from '../types/client';
import { contactApi } from '../api/contact';
import type { ContactMethodInput } from '../components/clients/AddClientModal';

import ClientsPageHeader from '../components/clients/ClientsPageHeader';
import ClientSearchBar   from '../components/clients/ClientSearchBar';
import ClientTable       from '../components/clients/ClientTable';
import AddClientModal    from '../components/clients/AddClientModal';

const PAGE_SIZE = 4;

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function TableSkeleton() {
  return <div className="table-skeleton table-skeleton--clients anim-pulse" />;
}

// ─── Error banner ─────────────────────────────────────────────────────────────
function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="error-banner">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <span className="material-symbols-outlined">error</span>
        <span>{message}</span>
      </div>
      <button
        onClick={onRetry}
        style={{ fontSize: '0.75rem', fontWeight: 700, textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}
      >
        Retry
      </button>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ClientsPage() {
  const {
    clients,
    totalClients,
    loading,
    error,
    currentPage,
    totalPages,
    setCurrentPage,
    search,
    setSearch,
    refetch,
    createClient,
    deleteClient,
  } = useClients();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleCreateClient = async (
    dto: CreateClientDto,
    contacts: ContactMethodInput[],
  ) => {
    const created = await createClient(dto);
    for (const contact of contacts) {
      await contactApi.create({
        idClient:   created.id_client,
        methodType: contact.method_type,
        value:      contact.value,
        isDefault:  contact.is_default,
      });
    }
  };

  const handleDeleteClient = async (client: ClientAPI) => {
    if (!confirm(`Delete ${client.trade_name}? This action cannot be undone.`)) return;
    try {
      await deleteClient(client.id_client);
    } catch (err) {
      alert(`Error deleting client: ${(err as Error).message}`);
    }
  };

  return (
    <>
      <main className="page">
        <ClientsPageHeader onAddClient={() => setIsAddModalOpen(true)} />

        <ClientSearchBar value={search} onChange={setSearch} />

        {error ? (
          <ErrorBanner message={error} onRetry={refetch} />
        ) : loading ? (
          <TableSkeleton />
        ) : (
          <ClientTable
            clients={clients}
            totalClients={totalClients}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={PAGE_SIZE}
            onPageChange={setCurrentPage}
            onEditClient={(c) => console.log('TODO: open Edit modal for', c.id_client)}
            onDeleteClient={handleDeleteClient}
          />
        )}
      </main>

      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreateClient}
      />
    </>
  );
}
