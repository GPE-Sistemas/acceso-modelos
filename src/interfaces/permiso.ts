import { IComplejo } from './complejo';
import { ICliente } from './cliente';
import { IRol } from './rol';
import { IUnidadFuncional } from './unidad-funcional';
import { IUsuario } from './usuario';

export interface IConfigPermiso {
  [key: string]: any;
}

export type INivelPermiso = 'Cliente' | 'Complejo' | 'Unidad Funcional';

interface IPermisoBase {
  _id?: string;
  fechaCreacion?: string;
  habilitado?: boolean;
  fechaExpiracion?: string;
  idUsuario?: string;
  idsRoles?: string[];
  config?: IConfigPermiso;
  // Virtuals
  usuario?: IUsuario;
  roles?: IRol[];
}

export interface IPermisoCliente extends IPermisoBase {
  nivel: 'Cliente';
  idCliente: string;
  // Virtual
  cliente?: ICliente;
}

export interface IPermisoComplejo extends IPermisoBase {
  nivel: 'Complejo';
  idCliente: string;
  idComplejo: string;
  // Virtuals
  cliente?: ICliente;
  complejo?: IComplejo;
}

export interface IPermisoUnidadFuncional extends IPermisoBase {
  nivel: 'Unidad Funcional';
  idCliente: string;
  idComplejo: string;
  idUnidadFuncional: string;
  // Virtuals
  cliente?: ICliente;
  complejo?: IComplejo;
  unidadFuncional?: IUnidadFuncional;
}

export type IPermiso =
  | IPermisoCliente
  | IPermisoComplejo
  | IPermisoUnidadFuncional;

type OmitirVirtuales =
  | '_id'
  | 'fechaCreacion'
  | 'usuario'
  | 'roles'
  | 'cliente'
  | 'complejo'
  | 'unidadFuncional';

export type ICreatePermiso =
  | (Omit<IPermisoCliente, OmitirVirtuales> & { password?: string })
  | (Omit<IPermisoComplejo, OmitirVirtuales> & { password?: string })
  | (Omit<IPermisoUnidadFuncional, OmitirVirtuales> & { password?: string });

export type IUpdatePermiso =
  | (Partial<Omit<IPermisoCliente, OmitirVirtuales>> & { nivel: 'Cliente' })
  | (Partial<Omit<IPermisoComplejo, OmitirVirtuales>> & { nivel: 'Complejo' })
  | (Partial<Omit<IPermisoUnidadFuncional, OmitirVirtuales>> & {
      nivel: 'Unidad Funcional';
    });
