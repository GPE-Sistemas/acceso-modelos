import { ICliente } from './cliente';
import { IComplejo } from './complejo';
import { IPermiso } from './permiso';
import { IUnidadFuncional } from './unidad-funcional';
import { IBotonEmergencia } from './boton-emergencia';

export type IEstadoEmergencia = 'Pendiente' | 'EnAtencion' | 'Resuelta' | 'Descartada';

export interface IUbicacionEmergencia {
  lat: number;
  lng: number;
  accuracy?: number;     // metros
  fuente?: 'gps' | 'network' | 'cache';
}

export interface IEmergencia {
  _id?: string;
  fechaCreacion?: string;
  idCliente?: string;
  idComplejo?: string;
  idUnidadFuncional?: string;       // de la UF emisora (si el emisor es UF)
  idBoton?: string;                 // botón que disparó la emergencia
  idPermiso?: string;               // emisor (mobile)
  ubicacion?: IUbicacionEmergencia; // obligatoria al crear
  imagenes?: string[];              // URLs GCS, opcional, se agregan post-creación
  estado?: IEstadoEmergencia;
  idPermisoAtencion?: string;       // guardia que tomó el caso
  fechaTomado?: string;
  fechaResolucion?: string;
  observacionesCierre?: string;
  // Populate
  cliente?: ICliente;
  complejo?: IComplejo;
  unidadFuncional?: IUnidadFuncional;
  boton?: IBotonEmergencia;
  permiso?: IPermiso;             // emisor populado
  permisoAtencion?: IPermiso;
}

type OmitirPopulate =
  | 'cliente'
  | 'complejo'
  | 'unidadFuncional'
  | 'boton'
  | 'permiso'
  | 'permisoAtencion';

type OmitirCreate =
  | '_id'
  | 'fechaCreacion'
  | 'estado'
  | 'idPermisoAtencion'
  | 'fechaTomado'
  | 'fechaResolucion'
  | 'observacionesCierre'
  | OmitirPopulate;

export interface ICreateEmergencia extends Omit<
  Partial<IEmergencia>,
  OmitirCreate
> {}

type OmitirUpdate = '_id' | 'fechaCreacion' | OmitirPopulate;

export interface IUpdateEmergencia extends Omit<
  Partial<IEmergencia>,
  OmitirUpdate
> {}
