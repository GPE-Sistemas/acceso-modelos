import { ICliente } from './cliente';
import { IComplejo } from './complejo';
import { IPermiso } from './permiso';
import { IVehiculo } from './vehiculo';
import { IVisitante } from './visitante';

export type ITipoVinculoVehiculo = 'Titular' | 'Autorizado';

export interface IVinculoVehiculo {
  _id?: string;
  fechaCreacion?: string;
  idCliente?: string;
  idComplejo?: string;
  idVehiculo?: string;
  idPermiso?: string;    // mutuamente excluyente con idVisitante
  idVisitante?: string;  // mutuamente excluyente con idPermiso
  tipo?: ITipoVinculoVehiculo;
  // Populate
  cliente?: ICliente;
  complejo?: IComplejo;
  vehiculo?: IVehiculo;
  permiso?: IPermiso;
  visitante?: IVisitante;
}

type OmitirPopulate = 'cliente' | 'complejo' | 'vehiculo' | 'permiso' | 'visitante';

type OmitirCreate = '_id' | 'fechaCreacion' | OmitirPopulate;

export interface ICreateVinculoVehiculo extends Omit<
  Partial<IVinculoVehiculo>,
  OmitirCreate
> {}

type OmitirUpdate = '_id' | 'fechaCreacion' | OmitirPopulate;

export interface IUpdateVinculoVehiculo extends Omit<
  Partial<IVinculoVehiculo>,
  OmitirUpdate
> {}
