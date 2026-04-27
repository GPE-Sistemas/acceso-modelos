import { IAcceso } from './acceso';
import { ICliente } from './cliente';
import { IComplejo } from './complejo';
import { IDispositivo } from './dispositivo';

export type IComportamientoCredencialValida =
  | 'Apertura Automática'
  | 'Aprobación Manual';
export type IComportamientoCredencialInvalida = 'Ignorar' | 'Crear Ingreso';

export interface IDispositivoAcceso {
  _id?: string;
  fechaCreacion?: string;
  idCliente?: string;
  idComplejo?: string;
  idDispositivo?: string;
  idAcceso?: string;
  /**
   * Cuando un dispositivo está en mas de un acceso representa como el reporte del dispositivo representa esté acceso.
   */
  canalDispositivo?: string;
  comportamientoCredencialValida?: IComportamientoCredencialValida;
  comportamientoCredencialInvalida?: IComportamientoCredencialInvalida;
  /**
   * Indica si el dispositivo puede recibir un comando para abrir el acceso
   */
  aperturaConComando?: boolean;
  // Populate
  cliente?: ICliente;
  complejo?: IComplejo;
  dispositivo?: IDispositivo;
  acceso?: IAcceso;
}

type OmitirPopulate = 'cliente' | 'complejo' | 'dispositivo' | 'acceso';

type OmitirCreate = '_id' | 'fechaCreacion' | OmitirPopulate;

export interface ICreateDispositivoAcceso extends Omit<
  Partial<IDispositivoAcceso>,
  OmitirCreate
> {}

type OmitirUpdate = '_id' | 'fechaCreacion' | OmitirPopulate;

export interface IUpdateDispositivoAcceso extends Omit<
  Partial<IDispositivoAcceso>,
  OmitirUpdate
> {}
