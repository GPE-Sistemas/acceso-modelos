import { IDatosPersonales } from './usuario';

export interface IVisitante {
  _id?: string;
  fechaCreacion?: string;
  datosPersonales?: IDatosPersonales;
}

type OmitirCreate = '_id' | 'fechaCreacion';

export interface ICreateVisitante extends Omit<
  Partial<IVisitante>,
  OmitirCreate
> {}

type OmitirUpdate = '_id' | 'fechaCreacion';

export interface IUpdateVisitante extends Omit<
  Partial<IVisitante>,
  OmitirUpdate
> {}
