// ─── Contact ──────────────────────────────────────────────────────────────────

export type MethodType = 'InPerson' | 'VideoCall' | 'PhoneCall';

export interface ContactAPI {
  id_contact:  number;
  id_lawyer:   number | null;
  id_client:   number | null;
  method_type: MethodType;
  value:       string;
  is_default:  boolean;
}

export interface CreateContactDto {
  idClient?:  number;
  idLawyer?:  number;
  methodType: MethodType;
  value:      string;
  isDefault?: boolean;
}

export interface UpdateContactDto {
  value?:     string;
  isDefault?: boolean;
}

export interface ContactMethodInputI {
  method_type: MethodType;
  value:       string;
  is_default:  boolean;
}
