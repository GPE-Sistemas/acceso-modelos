export interface IPreferenciasContactos {
  _id?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  idUsuario?: string;
  recibirAlertas?: boolean;       // master para push categoria 'alerta_contacto'
  recibirInvitaciones?: boolean;  // push categoria 'contacto_invitacion'
}

type OmitirCreate = '_id' | 'fechaCreacion' | 'fechaActualizacion';

export interface ICreatePreferenciasContactos
  extends Omit<Partial<IPreferenciasContactos>, OmitirCreate> {}

type OmitirUpdate =
  | '_id'
  | 'fechaCreacion'
  | 'fechaActualizacion'
  | 'idUsuario';

export interface IUpdatePreferenciasContactos
  extends Omit<Partial<IPreferenciasContactos>, OmitirUpdate> {}

export const PREFERENCIAS_CONTACTOS_DEFAULT: Required<
  Pick<IPreferenciasContactos, 'recibirAlertas' | 'recibirInvitaciones'>
> = {
  recibirAlertas: true,
  recibirInvitaciones: true,
};
