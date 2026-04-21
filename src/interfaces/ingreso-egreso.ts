import { ICliente } from './cliente';
import { IComplejo } from './complejo';
import { IPermiso } from './permiso';
import { IUnidadFuncional } from './unidad-funcional';
import { IVehiculo } from './vehiculo';
import { IVisitante } from './visitante';

export interface IIngresoEgreso {
  _id?: string;
  fechaCreacion?: string;
  expireAt?: string;
  idCliente?: string;
  idComplejo?: string;
  idUnidadFuncional?: string;
  // Datos del evento
  fechaEvento?: string;
  tipo?: 'Ingreso' | 'Egreso';
  aprobado?: boolean;
  aprobadoPor?: 'Sistema' | 'Guardia';
  aprobadoPorIdPermiso?: string; // ID del permiso del usuario que aprobó, si es aprobadoPor === 'Guardia'
  idPermiso?: string;                    // responsable del ingreso (propietario, residente, empleado)
  idsPermisosAcompanantes?: string[];    // otros usuarios del sistema que acompañan
  idsVisitantes?: string[];              // visitantes identificados sin cuenta en el sistema
  visitantesAnonimos?: number;           // cantidad de acompañantes no identificados
  idVehiculo?: string;
  // Populate
  cliente?: ICliente;
  complejo?: IComplejo;
  unidadFuncional?: IUnidadFuncional;
  permiso?: IPermiso;
  permisosAcompanantes?: IPermiso[];
  visitantes?: IVisitante[];
  vehiculo?: IVehiculo;
  aprobadoPorPermiso?: IPermiso;
}

type OmitirPopulate =
  | 'cliente'
  | 'complejo'
  | 'unidadFuncional'
  | 'permiso'
  | 'permisosAcompanantes'
  | 'visitantes'
  | 'vehiculo'
  | 'aprobadoPorPermiso';

type OmitirCreate = '_id' | 'fechaCreacion' | OmitirPopulate;

export interface ICreateIngresoEgreso extends Omit<
  Partial<IIngresoEgreso>,
  OmitirCreate
> {}

type OmitirUpdate = '_id' | 'fechaCreacion' | OmitirPopulate;

export interface IUpdateIngresoEgreso extends Omit<
  Partial<IIngresoEgreso>,
  OmitirUpdate
> {}
