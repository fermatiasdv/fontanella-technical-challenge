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
  return (
    <div className="bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm animate-pulse border border-surface-container">
      <div className="h-12 bg-surface-container-low" />
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-8 py-6 border-b border-surface-container last:border-0">
          <div className="w-10 h-10 rounded-full bg-surface-container-high shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-48 bg-surface-container-high rounded" />
            <div className="h-2 w-24 bg-surface-container rounded" />
          </div>
          <div className="w-32 h-3 bg-surface-container rounded" />
        </div>
      ))}
    </div>
  );
}

// ─── Error banner ─────────────────────────────────────────────────────────────
function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="bg-error-container text-on-error-container rounded-xl px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="material-symbols-outlined">error</span>
        <span className="text-sm font-medium">{message}</span>
      </div>
      <button onClick={onRetry} className="text-xs font-bold underline hover:no-underline">
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

  /**
   * 1. POST /api/v1/clients  → creates the client, returns id_client
   * 2. For each contact method, POST /api/v1/contact
   *    Contacts are created sequentially so the first one can be is_default=true.
   */
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
      <main className="ml-64 p-10 min-h-[calc(100vh-4rem)]">
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
