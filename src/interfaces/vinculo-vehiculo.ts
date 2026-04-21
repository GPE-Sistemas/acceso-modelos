import { ICliente } from './cliente';
import { IComplejo } from './complejo';
import { IUsuario } from './usuario';
import { IVehiculo } from './vehiculo';
import { IVisitante } from './visitante';

export type ITipoVinculoVehiculo = 'Titular' | 'Autorizado';

export interface IVinculoVehiculo {
  _id?: string;
  fechaCreacion?: string;
  idCliente?: string;
  idComplejo?: string;
  idVehiculo?: string;
  idUsuario?: string;    // mutuamente excluyente con idVisitante
  idVisitante?: string;  // mutuamente excluyente con idUsuario
  tipo?: ITipoVinculoVehiculo;
  // Populate
  cliente?: ICliente;
  complejo?: IComplejo;
  vehiculo?: IVehiculo;
  usuario?: IUsuario;
  visitante?: IVisitante;
}

type OmitirCreate = '_id' | 'fechaCreacion' | 'cliente' | 'complejo' | 'vehiculo' | 'usuario' | 'visitante';

export interface ICreateVinculoVehiculo extends Omit<
  Partial<IVinculoVehiculo>,
  OmitirCreate
> {}

type OmitirUpdate = '_id' | 'fechaCreacion' | 'cliente' | 'complejo' | 'vehiculo' | 'usuario' | 'visitante';

export interface IUpdateVinculoVehiculo extends Omit<
  Partial<IVinculoVehiculo>,
  OmitirUpdate
> {}
