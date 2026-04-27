import { IComplejo } from './complejo';
import { IPermiso } from './permiso';

export type ETipoBloque =
  | 'texto'
  | 'imagen'
  | 'link'
  | 'archivo'
  | 'video'
  | 'ubicacion';

export type ECategoriaPublicacion =
  | 'aviso'
  | 'evento'
  | 'mantenimiento'
  | 'urgente'
  | 'informacion';

export type EEstadoPublicacion = 'activa' | 'inactiva';

export interface IBloque {
  tipo?: ETipoBloque;
  orden?: number;
  contenido?: string;    // texto
  url?: string;          // imagen, archivo, video
  nombre?: string;       // imagen, archivo (nombre original)
  mimeType?: string;     // imagen, archivo
  href?: string;         // link
  descripcion?: string;  // link (texto visible), video (caption)
  latitud?: number;      // ubicacion
  longitud?: number;     // ubicacion
  direccion?: string;    // ubicacion (label legible)
}

export interface IPublicacion {
  _id?: string;
  fechaCreacion?: string;
  idCliente?: string;
  idComplejo?: string;
  titulo?: string;
  categoria?: ECategoriaPublicacion;
  estado?: EEstadoPublicacion;
  prioridad?: number;
  fechaInicio?: string;
  fechaFin?: string | null;  // null = permanente
  bloques?: IBloque[];
  idPermisoCarga?: string;
  // Populate
  complejo?: IComplejo;
  permisoCarga?: IPermiso;
}

type OmitirPopulate = 'complejo' | 'permisoCarga';

type OmitirCreate = '_id' | 'fechaCreacion' | OmitirPopulate;

export interface ICreatePublicacion extends Omit<Partial<IPublicacion>, OmitirCreate> {}

type OmitirUpdate = '_id' | 'fechaCreacion' | OmitirPopulate;

export interface IUpdatePublicacion extends Omit<Partial<IPublicacion>, OmitirUpdate> {}
