import { ICliente } from './cliente';
import { IComplejo } from './complejo';
import { IUnidadFuncional } from './unidad-funcional';
import { IDatosPersonales } from './usuario';

export interface IVisitante {
  _id?: string;
  fechaCreacion?: string;
  idCliente?: string;
  idComplejo?: string;
  idUnidadFuncional?: string;
  datosPersonales?: IDatosPersonales;
  // Populate
  cliente?: ICliente;
  complejo?: IComplejo;
  unidadFuncional?: IUnidadFuncional;
}

type OmitirPopulate = 'cliente' | 'complejo' | 'unidadFuncional';

type OmitirCreate = '_id' | 'fechaCreacion' | OmitirPopulate;

export interface ICreateVisitante extends Omit<
  Partial<IVisitante>,
  OmitirCreate
> {}

type OmitirUpdate = '_id' | 'fechaCreacion' | OmitirPopulate;

export interface IUpdateVisitante extends Omit<
  Partial<IVisitante>,
  OmitirUpdate
> {}
