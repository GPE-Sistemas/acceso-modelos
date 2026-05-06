import { z } from "zod";
import type { ICliente } from "./cliente";
import { ClienteSchema } from "./cliente";
import type { IComplejo } from "./complejo";
import { ComplejoSchema } from "./complejo";
import type { IEmergencia } from "./emergencia";
import { EmergenciaSchema } from "./emergencia";
import type { IEventoVisita } from "./evento-visita";
import { EventoVisitaSchema } from "./evento-visita";
import type { IIngresoEgreso } from "./ingreso-egreso";
import { IngresoEgresoSchema } from "./ingreso-egreso";
import type { IPublicacion } from "./publicacion";
import { PublicacionSchema } from "./publicacion";
import type { IVehiculo } from "./vehiculo";
import { VehiculoSchema } from "./vehiculo";
import type { IVinculoVehiculo } from "./vinculo-vehiculo";
import { VinculoVehiculoSchema } from "./vinculo-vehiculo";

// ─── Dashboard nivel Complejo ────────────────────────────────────────────────

export const DashboardComplejoMovimientosPorHoraSchema = z
  .object({
    /** ISO inicio de hora */
    hora: z.string(),
    ingresos: z.number(),
    egresos: z.number(),
  })
  .passthrough();
export type IDashboardComplejoMovimientosPorHora = z.infer<
  typeof DashboardComplejoMovimientosPorHoraSchema
>;

export interface IDashboardComplejoMovimientos {
  hoyIngresos: number;
  hoyEgresos: number;
  personasDentroEstimado: number;
  esperandoResolucion: number;
  porHora: IDashboardComplejoMovimientosPorHora[];
  ultimos: IIngresoEgreso[];
}

const _DashboardComplejoMovimientosSchema = z
  .object({
    hoyIngresos: z.number(),
    hoyEgresos: z.number(),
    personasDentroEstimado: z.number(),
    esperandoResolucion: z.number(),
    porHora: z.array(DashboardComplejoMovimientosPorHoraSchema),
    ultimos: z.array(IngresoEgresoSchema),
  })
  .passthrough();
export const DashboardComplejoMovimientosSchema: z.ZodType<IDashboardComplejoMovimientos> =
  _DashboardComplejoMovimientosSchema as unknown as z.ZodType<IDashboardComplejoMovimientos>;

export interface IDashboardComplejoVisitas {
  activas: number;
  pendientesAprobacion: number;
  proximas: IEventoVisita[];
}

const _DashboardComplejoVisitasSchema = z
  .object({
    activas: z.number(),
    pendientesAprobacion: z.number(),
    proximas: z.array(EventoVisitaSchema),
  })
  .passthrough();
export const DashboardComplejoVisitasSchema: z.ZodType<IDashboardComplejoVisitas> =
  _DashboardComplejoVisitasSchema as unknown as z.ZodType<IDashboardComplejoVisitas>;

export interface IDashboardComplejoEmergencias {
  activas: number;
  porEstado: { Pendiente: number; EnAtencion: number };
  lista: IEmergencia[];
}

const _DashboardComplejoEmergenciasSchema = z
  .object({
    activas: z.number(),
    porEstado: z
      .object({
        Pendiente: z.number(),
        EnAtencion: z.number(),
      })
      .passthrough(),
    lista: z.array(EmergenciaSchema),
  })
  .passthrough();
export const DashboardComplejoEmergenciasSchema: z.ZodType<IDashboardComplejoEmergencias> =
  _DashboardComplejoEmergenciasSchema as unknown as z.ZodType<IDashboardComplejoEmergencias>;

export const DashboardComplejoHardwareItemSchema = z
  .object({
    _id: z.string(),
    nombre: z.string().optional(),
    tipo: z.string().optional(),
    ultimoEvento: z.string().optional(),
  })
  .passthrough();
export type IDashboardComplejoHardwareItem = z.infer<
  typeof DashboardComplejoHardwareItemSchema
>;

export const DashboardComplejoHardwareSchema = z
  .object({
    dispositivosTotal: z.number(),
    dispositivosOnline: z.number(),
    dispositivosOffline: z.array(DashboardComplejoHardwareItemSchema),
  })
  .passthrough();
export type IDashboardComplejoHardware = z.infer<
  typeof DashboardComplejoHardwareSchema
>;

export interface IDashboardComplejoPublicaciones {
  activas: number;
  proximaAVencer?: IPublicacion;
}

const _DashboardComplejoPublicacionesSchema = z
  .object({
    activas: z.number(),
    proximaAVencer: PublicacionSchema.optional(),
  })
  .passthrough();
export const DashboardComplejoPublicacionesSchema: z.ZodType<IDashboardComplejoPublicaciones> =
  _DashboardComplejoPublicacionesSchema as unknown as z.ZodType<IDashboardComplejoPublicaciones>;

export interface IDashboardComplejo {
  idComplejo: string;
  /** ISO timestamp del cálculo */
  generadoEn: string;
  movimientos: IDashboardComplejoMovimientos;
  visitas: IDashboardComplejoVisitas;
  emergencias: IDashboardComplejoEmergencias;
  hardware: IDashboardComplejoHardware;
  publicaciones: IDashboardComplejoPublicaciones;
}

const _DashboardComplejoSchema = z
  .object({
    idComplejo: z.string(),
    generadoEn: z.string(),
    movimientos: _DashboardComplejoMovimientosSchema,
    visitas: _DashboardComplejoVisitasSchema,
    emergencias: _DashboardComplejoEmergenciasSchema,
    hardware: DashboardComplejoHardwareSchema,
    publicaciones: _DashboardComplejoPublicacionesSchema,
  })
  .passthrough();
export const DashboardComplejoSchema: z.ZodType<IDashboardComplejo> =
  _DashboardComplejoSchema as unknown as z.ZodType<IDashboardComplejo>;

// ─── Dashboard nivel Unidad Funcional ────────────────────────────────────────

export interface IDashboardUFVisitas {
  /** Eventos creados por mí, estado in [Pendiente, Activa] */
  misActivas: number;
  /** Eventos creados por mí con estadoAprobacion = Pendiente */
  misPendientesAprobacion: number;
  /** Eventos pendientes destinados a mi UF (acción aprobar) */
  paraAprobarPorMi: number;
  /** Mis próximas (top N) */
  proximas: IEventoVisita[];
}

const _DashboardUFVisitasSchema = z
  .object({
    misActivas: z.number(),
    misPendientesAprobacion: z.number(),
    paraAprobarPorMi: z.number(),
    proximas: z.array(EventoVisitaSchema),
  })
  .passthrough();
export const DashboardUFVisitasSchema: z.ZodType<IDashboardUFVisitas> =
  _DashboardUFVisitasSchema as unknown as z.ZodType<IDashboardUFVisitas>;

export interface IDashboardUFMovimientos {
  /** Ingresos donde idPermiso = mi permiso */
  misRecientes: IIngresoEgreso[];
}

const _DashboardUFMovimientosSchema = z
  .object({
    misRecientes: z.array(IngresoEgresoSchema),
  })
  .passthrough();
export const DashboardUFMovimientosSchema: z.ZodType<IDashboardUFMovimientos> =
  _DashboardUFMovimientosSchema as unknown as z.ZodType<IDashboardUFMovimientos>;

export interface IDashboardUFVehiculos {
  total: number;
  lista: IVehiculo[];
  /** Populated con vehiculo */
  vinculos: IVinculoVehiculo[];
}

const _DashboardUFVehiculosSchema = z
  .object({
    total: z.number(),
    lista: z.array(VehiculoSchema),
    vinculos: z.array(VinculoVehiculoSchema),
  })
  .passthrough();
export const DashboardUFVehiculosSchema: z.ZodType<IDashboardUFVehiculos> =
  _DashboardUFVehiculosSchema as unknown as z.ZodType<IDashboardUFVehiculos>;

export interface IDashboardUFPublicaciones {
  activas: number;
  /** Top N del complejo */
  recientes: IPublicacion[];
}

const _DashboardUFPublicacionesSchema = z
  .object({
    activas: z.number(),
    recientes: z.array(PublicacionSchema),
  })
  .passthrough();
export const DashboardUFPublicacionesSchema: z.ZodType<IDashboardUFPublicaciones> =
  _DashboardUFPublicacionesSchema as unknown as z.ZodType<IDashboardUFPublicaciones>;

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

const _DashboardUFSchema = z
  .object({
    idPermiso: z.string(),
    idUnidadFuncional: z.string(),
    idComplejo: z.string(),
    generadoEn: z.string(),
    visitas: _DashboardUFVisitasSchema,
    movimientos: _DashboardUFMovimientosSchema,
    vehiculos: _DashboardUFVehiculosSchema,
    publicaciones: _DashboardUFPublicacionesSchema,
  })
  .passthrough();
export const DashboardUFSchema: z.ZodType<IDashboardUF> =
  _DashboardUFSchema as unknown as z.ZodType<IDashboardUF>;

// ─── Dashboard nivel Cliente (Cliente final) ─────────────────────────────────

export const DashboardClienteComplejoRowSchema = z
  .object({
    _id: z.string(),
    nombre: z.string().optional(),
    ingresosHoy: z.number(),
    visitasActivas: z.number(),
    emergenciasAbiertas: z.number(),
    dispositivosTotal: z.number(),
  })
  .passthrough();
export type IDashboardClienteComplejoRow = z.infer<
  typeof DashboardClienteComplejoRowSchema
>;

export const DashboardClienteSchema = z
  .object({
    idCliente: z.string(),
    generadoEn: z.string(),
    totales: z
      .object({
        complejos: z.number(),
        unidadesFuncionales: z.number(),
        unidadesPrivadas: z.number(),
        unidadesComunes: z.number(),
        dispositivos: z.number(),
        permisosActivos: z.number(),
      })
      .passthrough(),
    pendientes: z
      .object({
        emergenciasActivas: z.number(),
        visitasPendientesAprobacion: z.number(),
      })
      .passthrough(),
    porComplejo: z.array(DashboardClienteComplejoRowSchema),
  })
  .passthrough();
export type IDashboardCliente = z.infer<typeof DashboardClienteSchema>;

// ─── Dashboard Proveedor (visión global GPE Sistemas) ────────────────────────

export const DashboardProveedorClienteRowSchema = z
  .object({
    _id: z.string(),
    nombre: z.string().optional(),
    complejos: z.number(),
    ingresosHoy: z.number(),
    emergenciasAbiertas: z.number(),
  })
  .passthrough();
export type IDashboardProveedorClienteRow = z.infer<
  typeof DashboardProveedorClienteRowSchema
>;

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

const _DashboardProveedorSchema = z
  .object({
    generadoEn: z.string(),
    totales: z
      .object({
        clientes: z.number(),
        complejos: z.number(),
        unidadesFuncionales: z.number(),
        dispositivos: z.number(),
        permisosActivos: z.number(),
      })
      .passthrough(),
    pendientes: z
      .object({
        emergenciasActivas: z.number(),
        visitasPendientesAprobacion: z.number(),
      })
      .passthrough(),
    topClientes: z.array(DashboardProveedorClienteRowSchema),
    emergenciasRecientes: z.array(EmergenciaSchema),
    clientesRecientes: z.array(ClienteSchema),
    complejosRecientes: z.array(ComplejoSchema),
  })
  .passthrough();
export const DashboardProveedorSchema: z.ZodType<IDashboardProveedor> =
  _DashboardProveedorSchema as unknown as z.ZodType<IDashboardProveedor>;
