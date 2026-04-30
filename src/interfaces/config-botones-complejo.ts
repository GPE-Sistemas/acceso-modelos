import { ICliente } from './cliente';
import { IComplejo } from './complejo';
import { IBotonEmergencia } from './boton-emergencia';

/**
 * Configuración de botones de emergencia visibles en la app mobile de un complejo.
 * Una por complejo (índice único en idComplejo). El orden del array idsBotones
 * define el orden de aparición en la pantalla de emergencias del mobile.
 */
export interface IConfigBotonesComplejo {
  _id?: string;
  fechaCreacion?: string;
  fechaActualizacion?: string;
  idCliente?: string;
  idComplejo?: string;
  idsBotones?: string[];   // botones (globales + del complejo) seleccionados, en orden
  // Populate
  cliente?: ICliente;
  complejo?: IComplejo;
  botones?: IBotonEmergencia[];
}

type OmitirPopulate = 'cliente' | 'complejo' | 'botones';

type OmitirCreate = '_id' | 'fechaCreacion' | 'fechaActualizacion' | OmitirPopulate;

export interface ICreateConfigBotonesComplejo extends Omit<
  Partial<IConfigBotonesComplejo>,
  OmitirCreate
> {}

type OmitirUpdate = '_id' | 'fechaCreacion' | 'fechaActualizacion' | 'idCliente' | 'idComplejo' | OmitirPopulate;

export interface IUpdateConfigBotonesComplejo extends Omit<
  Partial<IConfigBotonesComplejo>,
  OmitirUpdate
> {}
