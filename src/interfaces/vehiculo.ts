import { ICliente } from './cliente';
import { IComplejo } from './complejo';
import { IUnidadFuncional } from './unidad-funcional';

export interface IDatosVehiculo {
  marca?: string;
  modelo?: string;
  color?: string;
  patente?: string;
}

export interface IVehiculo {
  _id?: string;
  fechaCreacion?: string;
  idCliente?: string;
  idComplejo?: string;
  idUnidadFuncional?: string;
  datosVehiculo?: IDatosVehiculo;
  // Populate
  cliente?: ICliente;
  complejo?: IComplejo;
  unidadFuncional?: IUnidadFuncional;
}

type OmitirPopulate = 'cliente' | 'complejo' | 'unidadFuncional';

type OmitirCreate = '_id' | 'fechaCreacion' | OmitirPopulate;

export interface ICreateVehiculo extends Omit<
  Partial<IVehiculo>,
  OmitirCreate
> {}

type OmitirUpdate = '_id' | 'fechaCreacion' | OmitirPopulate;

export interface IUpdateVehiculo extends Omit<
  Partial<IVehiculo>,
  OmitirUpdate
> {}
