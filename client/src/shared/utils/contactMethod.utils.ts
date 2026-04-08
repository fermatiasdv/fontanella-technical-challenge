import type { MethodType } from '@/shared/types/common.types';

export function contactMethodIcon(method: MethodType): string {
  switch (method) {
    case 'InPerson':  return 'location_on';
    case 'VideoCall': return 'videocam';
    case 'PhoneCall': return 'phone';
    default:          return 'contact_support';
  }
}

export function contactMethodLabel(method: MethodType): string {
  switch (method) {
    case 'InPerson':  return 'In Person';
    case 'VideoCall': return 'Video Call';
    case 'PhoneCall': return 'Phone Call';
    default:          return method;
  }
}
