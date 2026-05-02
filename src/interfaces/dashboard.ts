import { IEmergencia } from './emergencia';
import { IEventoVisita } from './evento-visita';
import { IIngresoEgreso } from './ingreso-egreso';
import { IPublicacion } from './publicacion';

export interface IDashboardComplejoMovimientosPorHora {
  hora: string; // ISO inicio de hora
  ingresos: number;
  egresos: number;
}

export interface IDashboardComplejoMovimientos {
  hoyIngresos: number;
  hoyEgresos: number;
  personasDentroEstimado: number;
  esperandoResolucion: number;
  porHora: IDashboardComplejoMovimientosPorHora[];
  ultimos: IIngresoEgreso[];
}

export interface IDashboardComplejoVisitas {
  activas: number;
  pendientesAprobacion: number;
  proximas: IEventoVisita[];
}

export interface IDashboardComplejoEmergencias {
  activas: number;
  porEstado: { Pendiente: number; EnAtencion: number };
  lista: IEmergencia[];
}

export interface IDashboardComplejoHardwareItem {
  _id: string;
  nombre?: string;
  tipo?: string;
  ultimoEvento?: string;
}

export interface IDashboardComplejoHardware {
  dispositivosTotal: number;
  dispositivosOnline: number;
  dispositivosOffline: IDashboardComplejoHardwareItem[];
}

export interface IDashboardComplejoPublicaciones {
  activas: number;
  proximaAVencer?: IPublicacion;
}

export interface IDashboardComplejo {
  idComplejo: string;
  generadoEn: string; // ISO timestamp del cálculo
  movimientos: IDashboardComplejoMovimientos;
  visitas: IDashboardComplejoVisitas;
  emergencias: IDashboardComplejoEmergencias;
  hardware: IDashboardComplejoHardware;
  publicaciones: IDashboardComplejoPublicaciones;
}
