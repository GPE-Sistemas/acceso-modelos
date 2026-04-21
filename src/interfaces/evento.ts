import { ICliente } from './cliente';
import { IComplejo } from './complejo';
import { IPermiso } from './permiso';
import { IUnidadFuncional } from './unidad-funcional';

export interface IEvento {
  _id?: string;
  fechaCreacion?: string;
  expireAt?: string;
  idCliente?: string;
  idComplejo?: string;
  idUnidadFuncional?: string;
  // Datos del evento
  fechaEvento?: string;
  idPermiso?: string; // Cuando es un usuario del sistema (propietario, residente, empleado)
  // TODO agregar datos específicos del evento, como tipo de evento, descripción, etc.

  // Populate
  cliente?: ICliente;
  complejo?: IComplejo;
  unidadFuncional?: IUnidadFuncional;
  permiso?: IPermiso;
}

type OmitirCreate = '_id' | 'fechaCreacion';

export interface ICreateEvento extends Omit<Partial<IEvento>, OmitirCreate> {}

type OmitirUpdate = '_id' | 'fechaCreacion';

export interface IUpdateEvento extends Omit<Partial<IEvento>, OmitirUpdate> {}
