export type ICategoriaNotificacion =
  | 'visitor_entry'
  | 'visitor_exit'
  | 'pub_aviso'
  | 'pub_evento'
  | 'pub_mantenimiento'
  | 'pub_urgente'
  | 'pub_informacion'
  | 'emergencia_recibida'   // declarada para uso futuro: mobile guardia + contactos de emergencia
  | 'emergencia_mensaje'    // mobile UF: nuevo mensaje en chat de emergencia propia
  | 'emergencia_estado'     // mobile UF: cambio de estado en emergencia propia
  | 'visita_pendiente_aprobacion'  // mobile UF: alguien creó un evento de visita que requiere mi aprobación
  | 'visita_resuelta';      // mobile UF: mi evento de visita fue aprobado o rechazado

export const CATEGORIAS_NOTIFICACION: ICategoriaNotificacion[] = [
  'visitor_entry',
  'visitor_exit',
  'pub_aviso',
  'pub_evento',
  'pub_mantenimiento',
  'pub_urgente',
  'pub_informacion',
  'emergencia_recibida',
  'emergencia_mensaje',
  'emergencia_estado',
  'visita_pendiente_aprobacion',
  'visita_resuelta',
];

export type ICategoriasNotificacionMap = Record<ICategoriaNotificacion, boolean>;

export interface INotificacionPreferencias {
  _id?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  idPermiso?: string;
  pushEnabled?: boolean;
  categorias?: ICategoriasNotificacionMap;
}

type OmitirCreate = '_id' | 'fechaCreacion' | 'fechaActualizacion';

export interface ICreateNotificacionPreferencias
  extends Omit<Partial<INotificacionPreferencias>, OmitirCreate> {}

type OmitirUpdate = '_id' | 'fechaCreacion' | 'fechaActualizacion' | 'idPermiso';

export interface IUpdateNotificacionPreferencias
  extends Omit<Partial<INotificacionPreferencias>, OmitirUpdate> {}

export const NOTIF_PREFERENCIAS_DEFAULT: ICategoriasNotificacionMap = {
  visitor_entry: true,
  visitor_exit: true,
  pub_aviso: true,
  pub_evento: true,
  pub_mantenimiento: true,
  pub_urgente: true,
  pub_informacion: true,
  emergencia_recibida: true,
  emergencia_mensaje: true,
  emergencia_estado: true,
  visita_pendiente_aprobacion: true,
  visita_resuelta: true,
};
