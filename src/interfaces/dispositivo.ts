import { ICliente } from './cliente';
import { IComplejo } from './complejo';

export type ITipoDispositivo =
  | 'Control de Acceso'
  | 'Camaras'
  | 'Intercomunicador'
  | 'Otro';

export interface IDispositivo {
  _id?: string;
  fechaCreacion?: string;
  idCliente?: string;
  idComplejo?: string;
  // Datos específicos del dispositivo
  tipo?: ITipoDispositivo;
  serialNumber?: string;
  marca?: string;
  modelo?: string;
  username?: string;
  password?: string;

  // Populate
  cliente?: ICliente;
  complejo?: IComplejo;
}

type OmitirCreate = '_id' | 'fechaCreacion';

export interface ICreateDispositivo extends Omit<
  Partial<IDispositivo>,
  OmitirCreate
> {}

type OmitirUpdate = '_id' | 'fechaCreacion';

export interface IUpdateDispositivo extends Omit<
  Partial<IDispositivo>,
  OmitirUpdate
> {}
