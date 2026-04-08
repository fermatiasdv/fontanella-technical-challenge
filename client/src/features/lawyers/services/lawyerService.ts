/**
 * Lawyer orchestration service.
 * Handles multi-step create/edit flows that span several API endpoints.
 * Pure async functions — no React, fully testable.
 */

import { lawyersService }        from '@/services/lawyers.service';
import { contactService }        from '@/services/contact.service';
import { workingScheduleService} from '@/services/workingSchedule.service';
import { vacationsService }      from '@/services/vacations.service';
import type { CreateLawyerDto, ScheduleSlotInput, VacationInput } from '@/features/lawyers/types/lawyer.types';
import type { ContactMethodInputI } from '@/shared/types/common.types';

export async function createLawyerWithDetails(
  dto:       CreateLawyerDto,
  contacts:  ContactMethodInputI[],
  schedule:  ScheduleSlotInput[],
  vacations: VacationInput[],
) {
  const created = await lawyersService.create(dto);
  const id = created.id_lawyer;

  if (contacts.length > 0) {
    await Promise.all(
      contacts.map((c, idx) =>
        contactService.create({
          idLawyer:   id,
          methodType: c.method_type,
          value:      c.value,
          isDefault:  idx === 0,
        }),
      ),
    );
  }

  if (schedule.length > 0) {
    await workingScheduleService.upsertSlots(id, schedule);
  }

  if (vacations.length > 0) {
    await Promise.all(
      vacations.map((v) => vacationsService.add(id, { startDate: v.startDate, endDate: v.endDate })),
    );
  }

  return created;
}

export async function updateLawyerWithDetails(
  id:        number,
  dto:       CreateLawyerDto,
  contacts:  ContactMethodInputI[],
  schedule:  ScheduleSlotInput[],
  vacations: VacationInput[],
) {
  await lawyersService.update(id, dto);

  // ── Contacts: match by method_type → update | create | try-delete removed ──
  const existingContacts = await contactService.listByLawyer(id);

  await Promise.all(
    contacts.map((c, idx) => {
      const match = existingContacts.find((e) => e.method_type === c.method_type);
      if (match) {
        return contactService.update(match.id_contact, { value: c.value, isDefault: idx === 0 });
      }
      return contactService.create({ idLawyer: id, methodType: c.method_type, value: c.value, isDefault: idx === 0 });
    }),
  );

  const newMethodTypes = new Set(contacts.map((c) => c.method_type));
  const toDelete = existingContacts.filter((e) => !newMethodTypes.has(e.method_type));
  await Promise.allSettled(toDelete.map((c) => contactService.remove(c.id_contact)));

  // ── Schedule: delete all → upsert active days ─────────────────────────────
  const existingSlots = await workingScheduleService.getByLawyer(id);
  await Promise.all(existingSlots.map((s) => workingScheduleService.deleteSlot(s.id_working_schedule)));
  if (schedule.length > 0) {
    await workingScheduleService.upsertSlots(id, schedule);
  }

  // ── Vacations: delete all → re-create ─────────────────────────────────────
  const existingVacs = await vacationsService.getByLawyer(id);
  await Promise.all(existingVacs.map((v) => vacationsService.remove(v.id_vacation)));
  await Promise.all(
    vacations.map((v) => vacationsService.add(id, { startDate: v.startDate, endDate: v.endDate })),
  );
}
