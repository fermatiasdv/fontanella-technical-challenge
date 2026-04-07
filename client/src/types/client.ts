// ─── Backend shape (matches T_CLIENTS exactly) ───────────────────────────────

export interface ClientAPI {
  id_client: number;
  company_id: string;   // e.g. "CORP-101"
  trade_name: string;   // display name / company name
  location:   string;   // e.g. "Los Angeles, USA"
  timezone:   string;   // e.g. "America/Los_Angeles"
}

// ─── DTOs (what we send to the API) ──────────────────────────────────────────

export type CreateClientDto = Omit<ClientAPI, 'id_client'>;
export type UpdateClientDto = Partial<CreateClientDto>;
