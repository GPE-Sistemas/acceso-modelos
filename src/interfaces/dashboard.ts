import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { EmergenciaSchema } from "./emergencia";
import { EventoVisitaSchema } from "./evento-visita";
import { IngresoEgresoSchema } from "./ingreso-egreso";
import { PublicacionSchema } from "./publicacion";
import { VehiculoSchema } from "./vehiculo";
import { VinculoVehiculoSchema } from "./vinculo-vehiculo";

// ─── Dashboard nivel Complejo ────────────────────────────────────────────────

export const DashboardComplejoMovimientosPorHoraSchema = z.looseObject({
  /** ISO inicio de hora */
  hora: z.string(),
  ingresos: z.number(),
  egresos: z.number(),
});

export const DashboardComplejoMovimientosSchema = z.looseObject({
  hoyIngresos: z.number(),
  hoyEgresos: z.number(),
  personasDentroEstimado: z.number(),
  esperandoResolucion: z.number(),
  porHora: z.array(DashboardComplejoMovimientosPorHoraSchema),
  ultimos: z.array(IngresoEgresoSchema),
});

export const DashboardComplejoVisitasSchema = z.looseObject({
  activas: z.number(),
  pendientesAprobacion: z.number(),
  proximas: z.array(EventoVisitaSchema),
});

export const DashboardComplejoEmergenciasSchema = z.looseObject({
  activas: z.number(),
  porEstado: z.looseObject({
    Pendiente: z.number(),
    EnAtencion: z.number(),
  }),
  lista: z.array(EmergenciaSchema),
});

export const DashboardComplejoHardwareItemSchema = z.looseObject({
  _id: z.string(),
  nombre: z.string().optional(),
  tipo: z.string().optional(),
  ultimoEvento: z.string().optional(),
});

export const DashboardComplejoHardwareSchema = z.looseObject({
  dispositivosTotal: z.number(),
  dispositivosOnline: z.number(),
  dispositivosOffline: z.array(DashboardComplejoHardwareItemSchema),
});

export const DashboardComplejoPublicacionesSchema = z.looseObject({
  activas: z.number(),
  proximaAVencer: PublicacionSchema.optional(),
});

export const DashboardComplejoSchema = z.looseObject({
  idComplejo: z.string(),
  /** ISO timestamp del cálculo */
  generadoEn: z.string(),
  movimientos: DashboardComplejoMovimientosSchema,
  visitas: DashboardComplejoVisitasSchema,
  emergencias: DashboardComplejoEmergenciasSchema,
  hardware: DashboardComplejoHardwareSchema,
  publicaciones: DashboardComplejoPublicacionesSchema,
});

// ─── Dashboard nivel Unidad Funcional ────────────────────────────────────────

export const DashboardUFVisitasSchema = z.looseObject({
  /** Eventos creados por mí, estado in [Pendiente, Activa] */
  misActivas: z.number(),
  /** Eventos creados por mí con estadoAprobacion = Pendiente */
  misPendientesAprobacion: z.number(),
  /** Eventos pendientes destinados a mi UF (acción aprobar) */
  paraAprobarPorMi: z.number(),
  /** Mis próximas (top N) */
  proximas: z.array(EventoVisitaSchema),
});

export const DashboardUFMovimientosSchema = z.looseObject({
  /** Ingresos donde idPermiso = mi permiso */
  misRecientes: z.array(IngresoEgresoSchema),
});

export const DashboardUFVehiculosSchema = z.looseObject({
  total: z.number(),
  lista: z.array(VehiculoSchema),
  /** Populated con vehiculo */
  vinculos: z.array(VinculoVehiculoSchema),
});

export const DashboardUFPublicacionesSchema = z.looseObject({
  activas: z.number(),
  /** Top N del complejo */
  recientes: z.array(PublicacionSchema),
});

export const DashboardUFSchema = z.looseObject({
  idPermiso: z.string(),
  idUnidadFuncional: z.string(),
  idComplejo: z.string(),
  generadoEn: z.string(),
  visitas: DashboardUFVisitasSchema,
  movimientos: DashboardUFMovimientosSchema,
  vehiculos: DashboardUFVehiculosSchema,
  publicaciones: DashboardUFPublicacionesSchema,
});

// ─── Dashboard nivel Cliente (Cliente final) ─────────────────────────────────

export const DashboardClienteComplejoRowSchema = z.looseObject({
  _id: z.string(),
  nombre: z.string().optional(),
  ingresosHoy: z.number(),
  visitasActivas: z.number(),
  emergenciasAbiertas: z.number(),
  dispositivosTotal: z.number(),
});

export const DashboardClienteSchema = z.looseObject({
  idCliente: z.string(),
  generadoEn: z.string(),
  totales: z.looseObject({
    complejos: z.number(),
    unidadesFuncionales: z.number(),
    unidadesPrivadas: z.number(),
    unidadesComunes: z.number(),
    dispositivos: z.number(),
    permisosActivos: z.number(),
  }),
  pendientes: z.looseObject({
    emergenciasActivas: z.number(),
    visitasPendientesAprobacion: z.number(),
  }),
  porComplejo: z.array(DashboardClienteComplejoRowSchema),
});

// ─── Dashboard Proveedor (visión global GPE Sistemas) ────────────────────────

export const DashboardProveedorClienteRowSchema = z.looseObject({
  _id: z.string(),
  nombre: z.string().optional(),
  complejos: z.number(),
  ingresosHoy: z.number(),
  emergenciasAbiertas: z.number(),
});

export const DashboardProveedorSchema = z.looseObject({
  generadoEn: z.string(),
  totales: z.looseObject({
    clientes: z.number(),
    complejos: z.number(),
    unidadesFuncionales: z.number(),
    dispositivos: z.number(),
    permisosActivos: z.number(),
  }),
  pendientes: z.looseObject({
    emergenciasActivas: z.number(),
    visitasPendientesAprobacion: z.number(),
  }),
  topClientes: z.array(DashboardProveedorClienteRowSchema),
  emergenciasRecientes: z.array(EmergenciaSchema),
  clientesRecientes: z.array(ClienteSchema),
  complejosRecientes: z.array(ComplejoSchema),
});

// ─── Type exports ───────────────────────────────────────────────────────────

export type IDashboardComplejoMovimientosPorHora = z.infer<
  typeof DashboardComplejoMovimientosPorHoraSchema
>;
export type IDashboardComplejoMovimientos = z.infer<
  typeof DashboardComplejoMovimientosSchema
>;
export type IDashboardComplejoVisitas = z.infer<
  typeof DashboardComplejoVisitasSchema
>;
export type IDashboardComplejoEmergencias = z.infer<
  typeof DashboardComplejoEmergenciasSchema
>;
export type IDashboardComplejoHardwareItem = z.infer<
  typeof DashboardComplejoHardwareItemSchema
>;
export type IDashboardComplejoHardware = z.infer<
  typeof DashboardComplejoHardwareSchema
>;
export type IDashboardComplejoPublicaciones = z.infer<
  typeof DashboardComplejoPublicacionesSchema
>;
export type IDashboardComplejo = z.infer<typeof DashboardComplejoSchema>;
export type IDashboardUFVisitas = z.infer<typeof DashboardUFVisitasSchema>;
export type IDashboardUFMovimientos = z.infer<
  typeof DashboardUFMovimientosSchema
>;
export type IDashboardUFVehiculos = z.infer<typeof DashboardUFVehiculosSchema>;
export type IDashboardUFPublicaciones = z.infer<
  typeof DashboardUFPublicacionesSchema
>;
export type IDashboardUF = z.infer<typeof DashboardUFSchema>;
export type IDashboardClienteComplejoRow = z.infer<
  typeof DashboardClienteComplejoRowSchema
>;
export type IDashboardCliente = z.infer<typeof DashboardClienteSchema>;
export type IDashboardProveedorClienteRow = z.infer<
  typeof DashboardProveedorClienteRowSchema
>;
export type IDashboardProveedor = z.infer<typeof DashboardProveedorSchema>;
