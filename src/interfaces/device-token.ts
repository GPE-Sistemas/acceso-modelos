export type IDevicePlatform = 'ios' | 'android';

export interface IDeviceToken {
  _id?: string;
  fechaCreacion?: string;
  idUsuario?: string;
  token?: string;
  platform?: IDevicePlatform;
  locale?: string;
  appVersion?: string;
  ultimaActividad?: string;
}

type OmitirCreate = '_id' | 'fechaCreacion';

export interface ICreateDeviceToken extends Omit<Partial<IDeviceToken>, OmitirCreate> {}

type OmitirUpdate = '_id' | 'fechaCreacion' | 'idUsuario' | 'token';

export interface IUpdateDeviceToken extends Omit<Partial<IDeviceToken>, OmitirUpdate> {}
