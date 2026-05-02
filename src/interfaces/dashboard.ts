import { ICliente } from './cliente';
import { IComplejo } from './complejo';
import { IEmergencia } from './emergencia';
import { IEventoVisita } from './evento-visita';
import { IIngresoEgreso } from './ingreso-egreso';
import { IPublicacion } from './publicacion';
import { IVehiculo } from './vehiculo';
import { IVinculoVehiculo } from './vinculo-vehiculo';

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

// ─── Dashboard nivel Unidad Funcional ────────────────────────────────────────

export interface IDashboardUFVisitas {
  misActivas: number;            // eventos creados por mí, estado in [Pendiente, Activa]
  misPendientesAprobacion: number; // eventos creados por mí con estadoAprobacion = Pendiente
  paraAprobarPorMi: number;      // eventos pendientes destinados a mi UF (acción aprobar)
  proximas: IEventoVisita[];     // mis próximas (top N)
}

export interface IDashboardUFMovimientos {
  misRecientes: IIngresoEgreso[]; // ingresos donde idPermiso = mi permiso
}

export interface IDashboardUFVehiculos {
  total: number;
  lista: IVehiculo[];
  vinculos: IVinculoVehiculo[]; // populated con vehiculo
}

export interface IDashboardUFPublicaciones {
  activas: number;
  recientes: IPublicacion[]; // top N del complejo
}

export interface IDashboardUF {
  idPermiso: string;
  idUnidadFuncional: string;
  idComplejo: string;
  generadoEn: string;
  visitas: IDashboardUFVisitas;
  movimientos: IDashboardUFMovimientos;
  vehiculos: IDashboardUFVehiculos;
  publicaciones: IDashboardUFPublicaciones;
}

// ─── Dashboard nivel Cliente (Cliente final) ─────────────────────────────────

export interface IDashboardClienteComplejoRow {
  _id: string;
  nombre?: string;
  ingresosHoy: number;
  visitasActivas: number;
  emergenciasAbiertas: number;
  dispositivosTotal: number;
}

export interface IDashboardCliente {
  idCliente: string;
  generadoEn: string;
  totales: {
    complejos: number;
    unidadesFuncionales: number;
    unidadesPrivadas: number;
    unidadesComunes: number;
    dispositivos: number;
    permisosActivos: number;
  };
  pendientes: {
    emergenciasActivas: number;
    visitasPendientesAprobacion: number;
  };
  porComplejo: IDashboardClienteComplejoRow[];
}

// ─── Dashboard Proveedor (visión global GPE Sistemas) ────────────────────────

export interface IDashboardProveedorClienteRow {
  _id: string;
  nombre?: string;
  complejos: number;
  ingresosHoy: number;
  emergenciasAbiertas: number;
}

export interface IDashboardProveedor {
  generadoEn: string;
  totales: {
    clientes: number;
    complejos: number;
    unidadesFuncionales: number;
    dispositivos: number;
    permisosActivos: number;
  };
  pendientes: {
    emergenciasActivas: number;
    visitasPendientesAprobacion: number;
  };
  topClientes: IDashboardProveedorClienteRow[];
  emergenciasRecientes: IEmergencia[];
  clientesRecientes: ICliente[];
  complejosRecientes: IComplejo[];
}
