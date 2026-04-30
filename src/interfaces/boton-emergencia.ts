import { ICliente } from './cliente';
import { IComplejo } from './complejo';

export interface IConfigBotonEmergencia {
  permiteImagenes?: boolean;
  // Extensible: futuras flags (permiteAudio, requiereConfirmacion, etc.)
  [key: string]: any;
}

export interface IBotonEmergencia {
  _id?: string;
  fechaCreacion?: string;
  habilitado?: boolean;
  global?: boolean;            // true => visible para todos los complejos. Solo Proveedor crea globales.
  idCliente?: string;          // requerido si global=false
  idComplejo?: string;         // requerido si global=false
  texto?: string;
  icono?: string;              // nombre de ícono Material (ej: 'local_police', 'medical_services')
  color?: string;              // hex (#rrggbb)
  config?: IConfigBotonEmergencia;
  // Populate
  cliente?: ICliente;
  complejo?: IComplejo;
}

type OmitirPopulate = 'cliente' | 'complejo';

type OmitirCreate = '_id' | 'fechaCreacion' | OmitirPopulate;

export interface ICreateBotonEmergencia extends Omit<
  Partial<IBotonEmergencia>,
  OmitirCreate
> {}

type OmitirUpdate = '_id' | 'fechaCreacion' | OmitirPopulate;

export interface IUpdateBotonEmergencia extends Omit<
  Partial<IBotonEmergencia>,
  OmitirUpdate
> {}
