import { clientsService } from '@/services/clients.service';
import { contactService }  from '@/services/contact.service';
import type { CreateClientDto } from '@/features/clients/types/client.types';
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
