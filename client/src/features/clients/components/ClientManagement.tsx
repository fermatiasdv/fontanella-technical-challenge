import { useState } from 'react';
import { useClients } from '@/features/clients/hooks/useClients';
import { createClientWithContacts, updateClientWithContacts } from '@/features/clients/services/clientService';
import { ClientsPageHeader } from '@/features/clients/components/ClientsPageHeader';
import { ClientSearchBar }   from '@/features/clients/components/ClientSearchBar';
import { ClientTable }       from '@/features/clients/components/ClientTable';
import { AddClientModal }    from '@/features/clients/components/AddClientModal';
import { ErrorBanner }       from '@/shared/components/ErrorBanner';
import { TableSkeleton }     from '@/shared/components/TableSkeleton';
import { swal }              from '@/shared/utils/swal';
import type { ClientAPI }    from '@/features/clients/types/client.types';

export function ClientManagement() {
  const {
    clients, totalClients, loading, error,
    currentPage, totalPages, setCurrentPage,
    search, setSearch, refetch, deleteClient,
  } = useClients();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingClient,  setEditingClient]  = useState<ClientAPI | null>(null);

  const handleCreate: React.ComponentProps<typeof AddClientModal>['onSubmit'] = async (dto, contacts) => {
    await createClientWithContacts(dto, contacts);
    refetch();
    swal.success('Cliente creado correctamente');
  };

  const handleEditFull: React.ComponentProps<typeof AddClientModal>['onSubmit'] = async (dto, contacts) => {
    if (!editingClient) return;
    await updateClientWithContacts(editingClient.id_client, dto, contacts);
    refetch();
    swal.success('Cliente actualizado correctamente');
  };

  const handleDelete = async (client: ClientAPI) => {
    if (!await swal.confirmDelete(client.trade_name)) return;
    try {
      await deleteClient(client.id_client);
      swal.success('Cliente eliminado');
    } catch (err) {
      swal.errorDialog('Error al eliminar', (err as Error).message);
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
          <TableSkeleton variant="clients" />
        ) : (
          <ClientTable
            clients={clients}
            totalClients={totalClients}
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={4}
            onPageChange={setCurrentPage}
            onEditClient={(c) => setEditingClient(c)}
            onDeleteClient={handleDelete}
          />
        )}
      </main>

      <AddClientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreate}
      />

      <AddClientModal
        isOpen={editingClient !== null}
        onClose={() => setEditingClient(null)}
        onSubmit={handleEditFull}
        initialClient={editingClient ?? undefined}
      />
    </>
  );
}
