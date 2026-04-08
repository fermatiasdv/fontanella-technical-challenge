import { clientsService } from '@/services/clients.service';
import { contactService }  from '@/services/contact.service';
import type { CreateClientDto, UpdateClientDto } from '@/features/clients/types/client.types';
import type { ContactMethodInputI } from '@/shared/types/common.types';

export async function createClientWithContacts(
  dto:      CreateClientDto,
  contacts: ContactMethodInputI[],
) {
  const created = await clientsService.create(dto);
  if (contacts.length > 0) {
    await Promise.all(
      contacts.map((c) =>
        contactService.create({
          idClient:   created.id_client,
          methodType: c.method_type,
          value:      c.value,
          isDefault:  c.is_default,
        }),
      ),
    );
  }
  return created;
}

export async function updateClientWithContacts(
  id:       number,
  dto:      UpdateClientDto,
  contacts: ContactMethodInputI[],
) {
  // Update basic client info
  await clientsService.update(id, dto);

  // Replace all contacts: delete existing, then create the new set
  const existing = await contactService.listByClient(id);
  await Promise.all(existing.map((c) => contactService.remove(c.id_contact)));
  if (contacts.length > 0) {
    await Promise.all(
      contacts.map((c) =>
        contactService.create({
          idClient:   id,
          methodType: c.method_type,
          value:      c.value,
          isDefault:  c.is_default,
        }),
      ),
    );
  }
}
