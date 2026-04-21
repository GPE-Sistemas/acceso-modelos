import { IGeoJSONPolygon } from '../auxiliares/geojson';
import { ICliente } from './cliente';
import { IComplejo } from './complejo';

export type ITipoUnidadFuncional = 'Privada' | 'Común';

export interface IConfigUnidadFuncional {
  [key: string]: any;
}

export interface IUnidadFuncional {
  _id?: string;
  idCliente?: string;
  idComplejo?: string;
  fechaCreacion?: string;
  habilitado?: boolean;
  nombre?: string;
  tipo?: ITipoUnidadFuncional;
  ubicacion?: IGeoJSONPolygon;
  config?: IConfigUnidadFuncional;
  // Populate
  cliente?: ICliente;
  complejo?: IComplejo;
}

type OmitirCreate = '_id' | 'fechaCreacion' | 'complejo' | 'cliente';

export interface ICreateUnidadFuncional extends Omit<
  Partial<IUnidadFuncional>,
  OmitirCreate
> {}

type OmitirUpdate = '_id' | 'fechaCreacion' | 'complejo' | 'cliente';

export interface IUpdateUnidadFuncional extends Omit<
  Partial<IUnidadFuncional>,
  OmitirUpdate
> {}
