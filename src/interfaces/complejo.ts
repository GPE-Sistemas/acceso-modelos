import { ICliente } from './cliente';

export interface IConfigComplejo {
  imagenes?: {
    logo?: string;
    banner?: string;
  };
  [key: string]: any;
}

export type ITipoComplejo = 'Barrio' | 'Edificio' | 'Condominio';

export interface IComplejo {
  _id?: string;
  idCliente?: string;
  fechaCreacion?: string;
  habilitado?: boolean;
  nombre?: string;
  tipo?: ITipoComplejo;
  config?: IConfigComplejo;
  // Populate
  cliente?: ICliente;
}

type OmitirCreate = '_id' | 'fechaCreacion' | 'cliente';

export interface ICreateComplejo extends Omit<
  Partial<IComplejo>,
  OmitirCreate
> {}

type OmitirUpdate = '_id' | 'fechaCreacion' | 'cliente';

export interface IUpdateComplejo extends Omit<
  Partial<IComplejo>,
  OmitirUpdate
> {}
