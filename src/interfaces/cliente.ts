export interface IConfigCliente {
  [key: string]: any;
}

/**
 * Proveedor: el tenant del proveedor del software, con visibilidad global sobre todos los clientes.
 * Cliente: tenant de un cliente final, gestiona sus propios Complejos.
 */
export type ITipoCliente = 'Proveedor' | 'Cliente';

export interface ICliente {
  _id?: string;
  fechaCreacion?: string;
  habilitado?: boolean;
  nombre?: string;
  tipoCliente?: ITipoCliente;
  config?: IConfigCliente;
}

type OmitirCreate = '_id' | 'fechaCreacion';

export interface ICreateCliente extends Omit<Partial<ICliente>, OmitirCreate> {}

type OmitirUpdate = '_id' | 'fechaCreacion';

export interface IUpdateCliente extends Omit<Partial<ICliente>, OmitirUpdate> {}
