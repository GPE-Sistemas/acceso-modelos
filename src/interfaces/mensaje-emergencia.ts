import { IPermiso } from './permiso';

/**
 * Mensaje de chat acotado a una emergencia. Vive y muere con la emergencia.
 * No reutiliza el chat general del sistema.
 */
export interface IMensajeEmergencia {
  _id?: string;
  fechaCreacion?: string;
  idEmergencia?: string;
  idPermiso?: string;       // autor
  texto?: string;
  leidoPor?: string[];      // idsPermisos que ya leyeron
  // Populate
  permiso?: IPermiso;
}

type OmitirPopulate = 'permiso';

type OmitirCreate = '_id' | 'fechaCreacion' | 'leidoPor' | OmitirPopulate;

export interface ICreateMensajeEmergencia extends Omit<
  Partial<IMensajeEmergencia>,
  OmitirCreate
> {}

type OmitirUpdate = '_id' | 'fechaCreacion' | 'idEmergencia' | 'idPermiso' | OmitirPopulate;

export interface IUpdateMensajeEmergencia extends Omit<
  Partial<IMensajeEmergencia>,
  OmitirUpdate
> {}
