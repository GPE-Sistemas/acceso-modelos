import { ICliente } from './cliente';
import { IComplejo } from './complejo';
import { IPermiso } from './permiso';
import { IUnidadFuncional } from './unidad-funcional';
import { IVehiculo } from './vehiculo';
import { IVisitante } from './visitante';

export type ITipoEventoVisita = 'Particular' | 'Proveedor';
export type IEstadoEventoVisita = 'Pendiente' | 'Activa' | 'Parcial' | 'Cerrada' | 'Vencida';
export type ICreadoPorEventoVisita = 'Propietario' | 'Guardia';

export interface IEventoVisita {
  _id?: string;
  fechaCreacion?: string;
  idCliente?: string;
  idComplejo?: string;
  idUnidadFuncional?: string;        // unidad del propietario que autoriza (contexto del creador)
  idUnidadFuncionalDestino?: string; // destino real de la visita (puede diferir de la anterior)
  idPermiso?: string;                // quien creó el evento (propietario o guardia)
  creadoPor?: ICreadoPorEventoVisita;
  tipo?: ITipoEventoVisita;
  idsVisitantes?: string[];
  idsVehiculos?: string[];
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: IEstadoEventoVisita;
  permiteAccesoMultiple?: boolean;     // si true: egreso no cierra el evento; cierre solo por vencimiento de ventana
  idsVisitantesIngresados?: string[];  // cache: unión de idsVisitantesAplicados de los vínculos tipo 'Ingreso'
  idsVisitantesAdentro?: string[];     // cache: idsVisitantesIngresados − idsVisitantesEgresados (quienes están actualmente adentro)
  observaciones?: string;
  // Populate
  cliente?: ICliente;
  complejo?: IComplejo;
  unidadFuncional?: IUnidadFuncional;
  unidadFuncionalDestino?: IUnidadFuncional;
  permiso?: IPermiso;
  visitantes?: IVisitante[];
  vehiculos?: IVehiculo[];
}

type OmitirPopulate =
  | 'cliente'
  | 'complejo'
  | 'unidadFuncional'
  | 'unidadFuncionalDestino'
  | 'permiso'
  | 'visitantes'
  | 'vehiculos';

type OmitirCreate = '_id' | 'fechaCreacion' | OmitirPopulate;

export interface ICreateEventoVisita extends Omit<
  Partial<IEventoVisita>,
  OmitirCreate
> {}

type OmitirUpdate = '_id' | 'fechaCreacion' | OmitirPopulate;

export interface IUpdateEventoVisita extends Omit<
  Partial<IEventoVisita>,
  OmitirUpdate
> {}
