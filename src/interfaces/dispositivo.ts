import { ICliente } from './cliente';
import { IComplejo } from './complejo';

export type ITipoDispositivo =
  | 'Terminal de reconocimiento facial'
  | 'Lector de huella digital'
  | 'Lector de tarjeta'
  | 'Teclado numérico'
  | 'Otro';

export interface IConfigDispositivo {
  username?: string;
  password?: string;
  apikey?: string;
  //
  /**
   * Representa si el dispositivo fisico abre automáticamente al detectar una credencial válida
   * En caso de ser false, el dispositivo requerirá una acción manual (como presionar un botón) para abrir.
   * Esto sirve para que al momento de registrar un ingreso/egreso en el sistema:
   * En caso de ser false este sea atendible (campo aprobadoPor === 'Guardia')
   * En case de ser true, el sistema lo aprueba automáticamente (campo aprobadoPor === 'Sistema') y se registra el evento sin intervención humana, lo que es ideal para dispositivos de acceso rápido o sin supervisión.
   */
  aperturaAutomatica?: boolean;
}

export interface IDispositivo {
  _id?: string;
  fechaCreacion?: string;
  idCliente?: string;
  idComplejo?: string;
  // Datos específicos del dispositivo
  tipo?: ITipoDispositivo;
  serialNumber?: string;
  marca?: string;
  modelo?: string;
  config?: IConfigDispositivo;

  // Populate
  cliente?: ICliente;
  complejo?: IComplejo;
}

type OmitirCreate = '_id' | 'fechaCreacion';

export interface ICreateDispositivo extends Omit<
  Partial<IDispositivo>,
  OmitirCreate
> {}

type OmitirUpdate = '_id' | 'fechaCreacion';

export interface IUpdateDispositivo extends Omit<
  Partial<IDispositivo>,
  OmitirUpdate
> {}
