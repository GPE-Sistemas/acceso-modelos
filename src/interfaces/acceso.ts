import { IGeoJSONPoint } from '../auxiliares/geojson';
import { ICliente } from './cliente';
import { IComplejo } from './complejo';

export type ITipoAcceso = 'Ingreso' | 'Egreso' | 'Ambos';
export type ITipoPersonaAcceso = 'Propietarios' | 'Visitas' | 'Ambos';

export interface IAcceso {
  _id?: string;
  fechaCreacion?: string;
  idCliente?: string;
  idComplejo?: string;
  nombre?: string;
  habilitado?: boolean;
  tipo?: ITipoAcceso;
  tipoPersona?: ITipoPersonaAcceso;
  ubicacion?: IGeoJSONPoint;
  // Populate
  cliente?: ICliente;
  complejo?: IComplejo;
}

type OmitirPopulate = 'cliente' | 'complejo';

type OmitirCreate = '_id' | 'fechaCreacion' | OmitirPopulate;

export interface ICreateAcceso extends Omit<Partial<IAcceso>, OmitirCreate> {}

type OmitirUpdate = '_id' | 'fechaCreacion' | OmitirPopulate;

export interface IUpdateAcceso extends Omit<Partial<IAcceso>, OmitirUpdate> {}
