import { useState, useEffect, useMemo } from 'react';
import { contactService } from '@/services/contact.service';
import type { ContactAPI, MethodType } from '@/shared/types/common.types';

interface UseAppointmentFormOptions {
  isOpen:            boolean;
  lawyerId:          number | '';
  clientId:          number | '';
  initialContactId?: number | '';
}

export interface CommonMethod {
  methodType:    MethodType;
  lawyerContact: ContactAPI;
}

function resolveCommonContacts(lawyerContacts: ContactAPI[], clientContacts: ContactAPI[]): CommonMethod[] {
  const lawyerByMethod = new Map(lawyerContacts.map((c) => [c.method_type, c]));
  return clientContacts
    .filter((c) => lawyerByMethod.has(c.method_type))
    .map((c) => ({ methodType: c.method_type as MethodType, lawyerContact: lawyerByMethod.get(c.method_type)! }));
}

export function useAppointmentForm({ isOpen, lawyerId, clientId, initialContactId }: UseAppointmentFormOptions) {
  const [lawyerContacts,    setLawyerContacts]    = useState<ContactAPI[]>([]);
  const [clientContacts,    setClientContacts]    = useState<ContactAPI[]>([]);
  const [contactsLoading,   setContactsLoading]   = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<number | ''>('');

  useEffect(() => {
    if (!isOpen || lawyerId === '' || clientId === '') {
      setLawyerContacts([]); setClientContacts([]); setSelectedContactId('');
      return;
    }
    const controller = new AbortController();
    setContactsLoading(true);
    Promise.all([
      contactService.listByLawyer(Number(lawyerId), controller.signal),
      contactService.listByClient(Number(clientId), controller.signal),
    ])
      .then(([lc, cc]) => {
        if (controller.signal.aborted) return;
        setLawyerContacts(lc); setClientContacts(cc);
        const common = resolveCommonContacts(lc, cc);
        const preselected =
          initialContactId !== '' && initialContactId !== undefined
            ? common.find((m) => m.lawyerContact.id_contact === initialContactId)?.lawyerContact.id_contact
            : undefined;
        setSelectedContactId(preselected ?? common[0]?.lawyerContact.id_contact ?? '');
      })
      .catch(() => {})
      .finally(() => { if (!controller.signal.aborted) setContactsLoading(false); });
    return () => controller.abort();
  // initialContactId is intentionally excluded: it's only used as the seed value
  // when contacts first load and should not trigger a re-fetch on its own.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, lawyerId, clientId]);

  const commonMethods = useMemo<CommonMethod[]>(
    () => resolveCommonContacts(lawyerContacts, clientContacts),
    [lawyerContacts, clientContacts],
  );

  return { commonMethods, contactsLoading, selectedContactId, setSelectedContactId };
}
