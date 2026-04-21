export interface IDatosVehiculo {
  marca?: string;
  modelo?: string;
  color?: string;
  patente?: string;
}

export interface IVehiculo {
  _id?: string;
  fechaCreacion?: string;
  datosVehiculo?: IDatosVehiculo;
}

type OmitirCreate = '_id' | 'fechaCreacion';

export interface ICreateVehiculo extends Omit<
  Partial<IVehiculo>,
  OmitirCreate
> {}

type OmitirUpdate = '_id' | 'fechaCreacion';

export interface IUpdateVehiculo extends Omit<
  Partial<IVehiculo>,
  OmitirUpdate
> {}
