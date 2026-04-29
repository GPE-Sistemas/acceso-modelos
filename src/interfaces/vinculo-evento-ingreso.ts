import { ICliente } from './cliente';
import { IComplejo } from './complejo';
import { IEventoVisita } from './evento-visita';
import { IIngresoEgreso } from './ingreso-egreso';
import { IVisitante } from './visitante';

export type ITipoVinculoEventoIngreso = 'Ingreso' | 'Egreso';

export interface IVinculoEventoIngreso {
  _id?: string;
  fechaCreacion?: string;
  idCliente?: string;
  idComplejo?: string;
  idEventoVisita?: string;
  idIngresoEgreso?: string;
  tipo?: ITipoVinculoEventoIngreso;
  idsVisitantesAplicados?: string[]; // subset de IEventoVisita.idsVisitantes que entró/salió en este vínculo
  // Populate
  cliente?: ICliente;
  complejo?: IComplejo;
  eventoVisita?: IEventoVisita;
  ingresoEgreso?: IIngresoEgreso;
  visitantesAplicados?: IVisitante[];
}

type OmitirPopulate =
  | 'cliente'
  | 'complejo'
  | 'eventoVisita'
  | 'ingresoEgreso'
  | 'visitantesAplicados';

type OmitirCreate = '_id' | 'fechaCreacion' | OmitirPopulate;

export interface ICreateVinculoEventoIngreso extends Omit<
  Partial<IVinculoEventoIngreso>,
  OmitirCreate
> {}

type OmitirUpdate = '_id' | 'fechaCreacion' | OmitirPopulate;

export interface IUpdateVinculoEventoIngreso extends Omit<
  Partial<IVinculoEventoIngreso>,
  OmitirUpdate
> {}
