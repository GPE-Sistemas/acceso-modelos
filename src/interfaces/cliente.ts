export interface IConfigCliente {
  [key: string]: any;
}

/**
 * Admin Global: Tiene acceso a toda la información y configuración del sistema.
 * Cliente: Gestiona sus propios "Complejos".
 */
export type ITipoCliente = 'Admin Global' | 'Cliente';

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
