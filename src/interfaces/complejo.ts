import { ICliente } from './cliente';
import { IGeoJSONMultiPolygon } from '../auxiliares/geojson';

export interface IConfigEmergenciasComplejo {
  /** Si false, las emergencias enviadas desde mobile deben validarse contra el polígono del complejo. Default: true. */
  permitirFueraDelComplejo?: boolean;
}

export interface IConfigComplejo {
  imagenes?: {
    logo?: string;
    banner?: string;
  };
  emergencias?: IConfigEmergenciasComplejo;
  /** Polígono(s) que delimita(n) el complejo. Usado para geo-fence de emergencias. */
  geoJson?: IGeoJSONMultiPolygon;
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
