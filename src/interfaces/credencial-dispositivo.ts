import { ICliente } from './cliente';
import { IComplejo } from './complejo';
import { IDispositivo } from './dispositivo';
import { IPermiso } from './permiso';

export interface ICredencialDispositivo {
  _id?: string;
  fechaCreacion?: string;
  idCliente?: string;
  idComplejo?: string;
  idDispositivo?: string;
  identificador?: string; // valor propio del dispositivo (id de cara, número de tarjeta, QR, PIN, etc.)
  idPermiso?: string;
  // Populate
  cliente?: ICliente;
  complejo?: IComplejo;
  dispositivo?: IDispositivo;
  permiso?: IPermiso;
}

type OmitirPopulate = 'cliente' | 'complejo' | 'dispositivo' | 'permiso';

type OmitirCreate = '_id' | 'fechaCreacion' | OmitirPopulate;

export interface ICreateCredencialDispositivo extends Omit<
  Partial<ICredencialDispositivo>,
  OmitirCreate
> {}

type OmitirUpdate = '_id' | 'fechaCreacion' | OmitirPopulate;

export interface IUpdateCredencialDispositivo extends Omit<
  Partial<ICredencialDispositivo>,
  OmitirUpdate
> {}
