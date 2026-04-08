export interface ClientAPI {
  id_client:  number;
  company_id: string;
  trade_name: string;
  location:   string;
  timezone:   string;
}

export type CreateClientDto = Omit<ClientAPI, 'id_client'>;
export type UpdateClientDto = Partial<CreateClientDto>;
