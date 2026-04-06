import * as repository from './contact.repository';
import { nowUTC } from '../../shared/utils/dateUtils';
import { HttpError } from '../../shared/types';
import type { ContactMessage, SubmitMessageDto } from '../../shared/types';

export async function submitMessage(dto: SubmitMessageDto): Promise<ContactMessage> {
  const { name, email, message } = dto;

  if (!name || !email || !message) {
    throw new HttpError('name, email and message are required', 400);
  }

  return repository.create({
    name,
    email,
    message,
    created_at: nowUTC(),
    status: 'unread',
  });
}

export async function listMessages(): Promise<ContactMessage[]> {
  return repository.findAll();
}
