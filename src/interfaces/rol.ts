import { IComplejo } from './complejo';
import { ICliente } from './cliente';

export type AccionesRol =
  // *******************************************
  // MODULO ADMINISTRACIÓN
  // *******************************************
  // Clientes
  | 'Administración - Ver clientes'
  | 'Administración - Crear clientes'
  | 'Administración - Editar clientes'
  | 'Administración - Eliminar clientes'
  | 'Administración - Deshabilitar / habilitar clientes'
  // Usuarios
  | 'Administración - Ver usuarios'
  | 'Administración - Crear usuarios'
  | 'Administración - Editar usuarios'
  | 'Administración - Eliminar usuarios';

export type IAlcanceRol = 'Global' | 'Cliente' | 'Complejo';

interface IRolBase {
  _id?: string;
  fechaCreacion?: string;
  nombre?: string;
  acciones?: AccionesRol[];
}

export interface IRolGlobal extends IRolBase {
  alcance: 'Global';
}

export interface IRolCliente extends IRolBase {
  alcance: 'Cliente';
  idCliente: string;
  // Virtual
  cliente?: ICliente;
}

export interface IRolComplejo extends IRolBase {
  alcance: 'Complejo';
  idCliente: string;
  idComplejo: string;
  // Virtuals
  cliente?: ICliente;
  complejo?: IComplejo;
}

export type IRol = IRolGlobal | IRolCliente | IRolComplejo;

type OmitirVirtuales = '_id' | 'fechaCreacion' | 'cliente' | 'complejo';

export type ICreateRol =
  | Omit<IRolGlobal, OmitirVirtuales>
  | Omit<IRolCliente, OmitirVirtuales>
  | Omit<IRolComplejo, OmitirVirtuales>;

export type IUpdateRol =
  | (Partial<Omit<IRolGlobal, OmitirVirtuales>> & { alcance: 'Global' })
  | (Partial<Omit<IRolCliente, OmitirVirtuales>> & { alcance: 'Cliente' })
  | (Partial<Omit<IRolComplejo, OmitirVirtuales>> & { alcance: 'Complejo' });
