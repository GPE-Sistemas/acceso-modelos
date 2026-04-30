import { IPermiso } from './permiso';
import { IEstadoEmergencia } from './emergencia';

/**
 * Tipos de interacción del guardia sobre una emergencia.
 * - CambioEstado: cambio de estado de la emergencia (Pendiente → EnAtencion, etc.)
 * - Comentario: nota libre del guardia
 * - AccionExterna: acción predefinida (policía/ambulancia/bomberos enviados, etc.)
 */
export type ITipoInteraccionEmergencia = 'CambioEstado' | 'Comentario' | 'AccionExterna';

export type IAccionExternaEmergencia =
  | 'PoliciaEnviada'
  | 'AmbulanciaEnviada'
  | 'BomberosEnviados'
  | 'SeguridadPrivadaEnviada'
  | 'ContactadoPropietario'
  | 'Otro';

export interface IInteraccionEmergencia {
  _id?: string;
  fechaCreacion?: string;
  idEmergencia?: string;
  idPermiso?: string;                 // autor (guardia)
  tipo?: ITipoInteraccionEmergencia;
  estadoAnterior?: IEstadoEmergencia; // CambioEstado
  estadoNuevo?: IEstadoEmergencia;    // CambioEstado
  accion?: IAccionExternaEmergencia;  // AccionExterna
  comentario?: string;                // texto libre (cualquier tipo)
  // Populate
  permiso?: IPermiso;
}

type OmitirPopulate = 'permiso';

type OmitirCreate = '_id' | 'fechaCreacion' | OmitirPopulate;

export interface ICreateInteraccionEmergencia extends Omit<
  Partial<IInteraccionEmergencia>,
  OmitirCreate
> {}

type OmitirUpdate = '_id' | 'fechaCreacion' | 'idEmergencia' | 'idPermiso' | OmitirPopulate;

export interface IUpdateInteraccionEmergencia extends Omit<
  Partial<IInteraccionEmergencia>,
  OmitirUpdate
> {}
