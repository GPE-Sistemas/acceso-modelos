import { IUsuario } from './usuario';

export type IEstadoContactoUsuario =
  | 'Pendiente'
  | 'Aceptado'
  | 'Rechazado'
  | 'Bloqueado';

export interface IContactoUsuario {
  _id?: string;
  fechaCreacion?: string;
  idUsuarioEmisor?: string;
  idUsuarioReceptor?: string;
  estado?: IEstadoContactoUsuario;
  fechaResolucion?: string;
  silenciadoPorReceptor?: boolean;
  // Populate
  usuarioEmisor?: IUsuario;
  usuarioReceptor?: IUsuario;
}

type OmitirPopulate = 'usuarioEmisor' | 'usuarioReceptor';

type OmitirCreate =
  | '_id'
  | 'fechaCreacion'
  | 'estado'
  | 'fechaResolucion'
  | 'silenciadoPorReceptor'
  | OmitirPopulate;

export interface ICreateContactoUsuario
  extends Omit<Partial<IContactoUsuario>, OmitirCreate> {}

type OmitirUpdate =
  | '_id'
  | 'fechaCreacion'
  | 'idUsuarioEmisor'
  | 'idUsuarioReceptor'
  | OmitirPopulate;

export interface IUpdateContactoUsuario
  extends Omit<Partial<IContactoUsuario>, OmitirUpdate> {}
