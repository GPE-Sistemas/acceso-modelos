import { ICliente } from './cliente';
import { IComplejo } from './complejo';
import { IPermiso } from './permiso';
import { IUnidadFuncional } from './unidad-funcional';
import { IVehiculo } from './vehiculo';
import { IVisitante } from './visitante';

export type ITipoEventoVisita = 'Particular' | 'Servicio' | 'Retiro' | 'Entrega';
export type IEstadoEventoVisita = 'Pendiente' | 'Activa' | 'Parcial' | 'Cerrada' | 'Vencida';
export type ICreadoPorEventoVisita = 'Propietario' | 'Guardia';
export type IEstadoAprobacionEventoVisita = 'Pendiente' | 'Aprobado' | 'Rechazado';

export interface IRecurrenciaEventoVisita {
  diasSemana: number[];   // 0..6 (0=domingo). Lista de días que aplica. Si incluye los 7, equivale a "todos los días".
  horaDesde?: string;     // 'HH:mm' — ventana intra-día opcional
  horaHasta?: string;     // 'HH:mm' — opcional. Si horaHasta < horaDesde se interpreta cruzando medianoche.
}

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
  // Recurrencia (presencia => evento recurrente). Reusa fechaDesde/fechaHasta del evento.
  recurrencia?: IRecurrenciaEventoVisita;
  // Aprobación UF (regla actual)
  estadoAprobacion?: IEstadoAprobacionEventoVisita;
  aprobadoPorIdPermiso?: string;
  fechaAprobacion?: string;
  motivoRechazo?: string;
  // Aprobación recurrente (admin Complejo). Sólo aplica si recurrencia presente.
  estadoAprobacionRecurrente?: IEstadoAprobacionEventoVisita;
  aprobadoRecurrentePorIdPermiso?: string;
  fechaAprobacionRecurrente?: string;
  motivoRechazoRecurrente?: string;
  // Populate
  cliente?: ICliente;
  complejo?: IComplejo;
  unidadFuncional?: IUnidadFuncional;
  unidadFuncionalDestino?: IUnidadFuncional;
  permiso?: IPermiso;
  visitantes?: IVisitante[];
  vehiculos?: IVehiculo[];
  aprobadoPorPermiso?: IPermiso;
  aprobadoRecurrentePorPermiso?: IPermiso;
}

type OmitirPopulate =
  | 'cliente'
  | 'complejo'
  | 'unidadFuncional'
  | 'unidadFuncionalDestino'
  | 'permiso'
  | 'visitantes'
  | 'vehiculos'
  | 'aprobadoPorPermiso'
  | 'aprobadoRecurrentePorPermiso';

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
