export type ICategoriaNotificacion =
  | 'visitor_entry'
  | 'visitor_exit'
  | 'pub_aviso'
  | 'pub_evento'
  | 'pub_mantenimiento'
  | 'pub_urgente'
  | 'pub_informacion';

export const CATEGORIAS_NOTIFICACION: ICategoriaNotificacion[] = [
  'visitor_entry',
  'visitor_exit',
  'pub_aviso',
  'pub_evento',
  'pub_mantenimiento',
  'pub_urgente',
  'pub_informacion',
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
};
