import { z } from "zod";
import {
  GeoJSONMultiPolygonSchema,
  GeoJSONPointSchema,
} from "../auxiliares/geojson";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { TicketSchema } from "./ticket";
import { EventoVisitaSchema } from "./evento-visita";
import { IngresoEgresoSchema } from "./ingreso-egreso";
import { PublicacionSchema } from "./publicacion";
import { VehiculoSchema } from "./vehiculo";
import { VinculoVehiculoSchema } from "./vinculo-vehiculo";

// ─── Dashboard nivel Complejo ────────────────────────────────────────────────

export const DashboardComplejoMovimientosPorCategoriaSchema = z.object({
  Propietario: z.number(),
  Visita: z.number(),
  "Administración": z.number(),
  Guardia: z.number(),
  "Prestador de Servicio": z.number(),
});

export const DashboardComplejoMovimientosPorHoraSchema = z.object({
  /** ISO inicio de hora */
  hora: z.string(),
  ingresos: z.number(),
  egresos: z.number(),
  /** Ingresos discriminados por categoría (suma == ingresos) */
  ingresosPorCategoria: DashboardComplejoMovimientosPorCategoriaSchema,
});

export const DashboardComplejoMovimientosPorDiaSchema = z.object({
  /** ISO inicio del día */
  dia: z.string(),
  ingresos: z.number(),
  egresos: z.number(),
});

export const DashboardComplejoMovimientosSchema = z.object({
  hoyIngresos: z.number(),
  hoyEgresos: z.number(),
  personasDentroEstimado: z.number(),
  esperandoResolucion: z.number(),
  porHora: z.array(DashboardComplejoMovimientosPorHoraSchema),
  /** Últimos 7 días (incluye hoy) ordenados ascendente */
  tendenciaSemana: z.array(DashboardComplejoMovimientosPorDiaSchema),
  /** Mismo rango de la semana anterior — para comparar tendencia */
  tendenciaSemanaAnterior: z.array(DashboardComplejoMovimientosPorDiaSchema),
  ultimos: z.array(IngresoEgresoSchema),
});

export const DashboardComplejoVisitasSchema = z.object({
  activas: z.number(),
  pendientesAprobacion: z.number(),
  proximas: z.array(EventoVisitaSchema),
});

export const DashboardComplejoEmergenciasSchema = z.object({
  activas: z.number(),
  porEstado: z.object({
    Pendiente: z.number(),
    EnAtencion: z.number(),
  }),
  lista: z.array(TicketSchema),
});

export const DashboardComplejoSolicitudesSchema = z.object({
  activas: z.number(),
  porEstado: z.object({
    Pendiente: z.number(),
    EnAtencion: z.number(),
  }),
  porCategoria: z.object({
    Solicitud: z.number(),
    Reclamo: z.number(),
  }),
  lista: z.array(z.any()),
});

export const DashboardComplejoHardwareItemSchema = z.object({
  _id: z.string(),
  nombre: z.string().optional(),
  tipo: z.string().optional(),
  ultimoEvento: z.string().optional(),
});

export const DashboardComplejoHardwareSchema = z.object({
  dispositivosTotal: z.number(),
  dispositivosOnline: z.number(),
  dispositivosOffline: z.array(DashboardComplejoHardwareItemSchema),
});

export const DashboardComplejoPublicacionesSchema = z.object({
  activas: z.number(),
  proximaAVencer: PublicacionSchema.optional(),
  /** Top N recientes activas. `z.any()` para evitar TS7056. */
  lista: z.array(z.any()),
});

export const DashboardComplejoArchivadosSchema = z.object({
  /** Total visitantes con activo=false (soft-archive) */
  visitantes: z.number(),
  /** Total vehículos con activo=false */
  vehiculos: z.number(),
});

export const DashboardComplejoTurnosSchema = z.object({
  hoy: z.number(),
  pendientesAprobacion: z.number(),
  enUso: z.number(),
  bloqueosVigentes: z.number(),
  /** Próximos turnos confirmados (top N). `any` para evitar TS7056. */
  proximos: z.array(z.any()),
});

// Type annotation explícita: los sub-schemas referencian populates profundos
// (Ticket → Permiso → Rol → AccionesRolSchema) cuya inferencia, agregada,
// supera el límite de serialización de TS (TS7056). Anotando como ZodObject
// con shape laxo se corta la cadena. Mismo patrón pragmático que `z.any()`
// usado en `proximos` arriba — dashboards son schemas de salida read-only.
export const DashboardComplejoSchema: z.ZodObject<z.ZodRawShape> = z.object({
  idComplejo: z.string(),
  /** ISO timestamp del cálculo */
  generadoEn: z.string(),
  movimientos: DashboardComplejoMovimientosSchema,
  visitas: DashboardComplejoVisitasSchema,
  emergencias: DashboardComplejoEmergenciasSchema,
  solicitudes: DashboardComplejoSolicitudesSchema,
  hardware: DashboardComplejoHardwareSchema,
  publicaciones: DashboardComplejoPublicacionesSchema,
  turnos: DashboardComplejoTurnosSchema,
  archivados: DashboardComplejoArchivadosSchema,
});

// ─── Dashboard mapa nivel Complejo ───────────────────────────────────────────

export const EstadoUFMapaSchema = z.enum([
  "sin",
  "pendiente",
  "activa",
  "emergencia",
]);

export const DashboardMapaUFSchema = z.object({
  _id: z.string(),
  nombre: z.string().optional(),
  ubicacion: GeoJSONMultiPolygonSchema.optional(),
  estado: EstadoUFMapaSchema,
  visitasActivas: z.number(),
  visitasPendientes: z.number(),
  emergenciasActivas: z.number(),
});

export const DashboardMapaAccesoSchema = z.object({
  _id: z.string(),
  nombre: z.string().optional(),
  tipo: z.enum(["Ingreso", "Egreso", "Ambos"]).optional(),
  ubicacion: GeoJSONPointSchema.optional(),
  dispositivosTotal: z.number(),
  dispositivosOnline: z.number(),
});

export const DashboardMapaEmergenciaSchema = z.object({
  _id: z.string(),
  ubicacion: GeoJSONPointSchema.optional(),
  idUnidadFuncional: z.string().optional(),
  idBoton: z.string().optional(),
  fechaCreacion: z.string().optional(),
  estado: z.enum(["Pendiente", "EnAtencion"]),
});

export const DashboardMapaComplejoSchema = z.object({
  idComplejo: z.string(),
  generadoEn: z.string(),
  ubicacion: GeoJSONMultiPolygonSchema.optional(),
  unidadesFuncionales: z.array(DashboardMapaUFSchema),
  accesos: z.array(DashboardMapaAccesoSchema),
  emergenciasActivas: z.array(DashboardMapaEmergenciaSchema),
});

// ─── Dashboard nivel Unidad Funcional ────────────────────────────────────────

export const DashboardUFVisitasSchema = z.object({
  /** Eventos creados por mí, estado in [Pendiente, Activa] */
  misActivas: z.number(),
  /** Eventos creados por mí con estadoAprobacion = Pendiente */
  misPendientesAprobacion: z.number(),
  /** Eventos pendientes destinados a mi UF (acción aprobar) */
  paraAprobarPorMi: z.number(),
  /** Mis próximas (top N) */
  proximas: z.array(EventoVisitaSchema),
});

export const DashboardUFMovimientosSchema = z.object({
  /** Ingresos donde idPermiso = mi permiso */
  misRecientes: z.array(IngresoEgresoSchema),
});

export const DashboardUFVehiculosSchema = z.object({
  total: z.number(),
  lista: z.array(VehiculoSchema),
  /** Populated con vehiculo */
  vinculos: z.array(VinculoVehiculoSchema),
});

export const DashboardUFPublicacionesSchema = z.object({
  activas: z.number(),
  /** Top N del complejo */
  recientes: z.array(PublicacionSchema),
});

export const DashboardUFContactosSchema = z.object({
  /** Contactos aceptados (red de emergencia) */
  activos: z.number(),
  /** Invitaciones recibidas con estado Pendiente */
  invitacionesRecibidasPendientes: z.number(),
  /** Invitaciones enviadas con estado Pendiente */
  invitacionesEnviadasPendientes: z.number(),
});

export const DashboardUFTicketsSchema = z.object({
  /** Tickets emitidos por el usuario, abiertos (Pendiente | EnAtencion) */
  misAbiertos: z.number(),
  porCategoria: z.object({
    Emergencia: z.number(),
    Solicitud: z.number(),
    Reclamo: z.number(),
  }),
  /** Lista compacta top N */
  recientes: z.array(z.any()),
});

export const DashboardUFTurnosSchema = z.object({
  /** Turnos donde el usuario participa (creador o participante propietario) en estado Reservado, futuros. */
  misProximos: z.array(z.any()),
  /** Mis turnos con estadoAprobacion=Pendiente */
  misPendientes: z.number(),
  /** Turnos de la UF para aprobar (cuando el permiso tiene Aprobar turnos) */
  paraAprobarPorMi: z.number(),
});

// Type annotation explícita (mismo motivo que DashboardComplejoSchema): los
// sub-schemas referencian populates profundos (turnos/visitas → Permiso → Rol →
// AccionesRolSchema) cuya inferencia agregada supera el límite de serialización
// de TS (TS7056). Anotar como ZodObject con shape laxo corta la cadena.
export const DashboardUFSchema: z.ZodObject<z.ZodRawShape> = z.object({
  idPermiso: z.string(),
  idUnidadFuncional: z.string(),
  idComplejo: z.string(),
  generadoEn: z.string(),
  visitas: DashboardUFVisitasSchema,
  movimientos: DashboardUFMovimientosSchema,
  vehiculos: DashboardUFVehiculosSchema,
  publicaciones: DashboardUFPublicacionesSchema,
  turnos: DashboardUFTurnosSchema,
  tickets: DashboardUFTicketsSchema,
  contactos: DashboardUFContactosSchema,
});

// ─── Dashboard nivel Cliente (Cliente final) ─────────────────────────────────

export const DashboardClienteComplejoRowSchema = z.object({
  _id: z.string(),
  nombre: z.string().optional(),
  ingresosHoy: z.number(),
  visitasActivas: z.number(),
  emergenciasAbiertas: z.number(),
  solicitudesAbiertas: z.number(),
  turnosHoy: z.number(),
  dispositivosTotal: z.number(),
  dispositivosOffline: z.number(),
  /** Ingresos últimos 7 días (incluye hoy), ascendente, para sparkline */
  tendencia7d: z.array(z.number()),
});

export const DashboardClientePermisosPorCategoriaSchema = z.object({
  Propietario: z.number(),
  "Administración": z.number(),
  Guardia: z.number(),
  "Prestador de Servicio": z.number(),
});

export const DashboardClienteSchema = z.object({
  idCliente: z.string(),
  generadoEn: z.string(),
  totales: z.object({
    complejos: z.number(),
    unidadesFuncionales: z.number(),
    unidadesPrivadas: z.number(),
    unidadesComunes: z.number(),
    dispositivos: z.number(),
    permisosActivos: z.number(),
    permisosPorCategoria: DashboardClientePermisosPorCategoriaSchema,
    ufsSinPermisoActivo: z.number(),
  }),
  pendientes: z.object({
    emergenciasActivas: z.number(),
    visitasPendientesAprobacion: z.number(),
  }),
  porComplejo: z.array(DashboardClienteComplejoRowSchema),
});

// ─── Dashboard Proveedor (visión global GPE Sistemas) ────────────────────────

export const DashboardProveedorClienteRowSchema = z.object({
  _id: z.string(),
  nombre: z.string().optional(),
  complejos: z.number(),
  ingresosHoy: z.number(),
  emergenciasAbiertas: z.number(),
  solicitudesAbiertas: z.number(),
});

export const DashboardProveedorSchema = z.object({
  generadoEn: z.string(),
  totales: z.object({
    clientes: z.number(),
    complejos: z.number(),
    unidadesFuncionales: z.number(),
    dispositivos: z.number(),
    permisosActivos: z.number(),
    turnosHoy: z.number(),
    complejosConOffline: z.number(),
  }),
  pendientes: z.object({
    emergenciasActivas: z.number(),
    solicitudesActivas: z.number(),
    visitasPendientesAprobacion: z.number(),
  }),
  topClientes: z.array(DashboardProveedorClienteRowSchema),
  emergenciasRecientes: z.array(TicketSchema),
  clientesRecientes: z.array(ClienteSchema),
  complejosRecientes: z.array(ComplejoSchema),
  /** Permisos creados últimos 7d — señal onboarding. `z.any()` para evitar TS7056. */
  permisosRecientes: z.array(z.any()),
});

// ─── Type exports ───────────────────────────────────────────────────────────

export type IDashboardComplejoMovimientosPorHora = z.infer<
  typeof DashboardComplejoMovimientosPorHoraSchema
>;
export type IDashboardComplejoMovimientosPorCategoria = z.infer<
  typeof DashboardComplejoMovimientosPorCategoriaSchema
>;
export type IDashboardComplejoMovimientosPorDia = z.infer<
  typeof DashboardComplejoMovimientosPorDiaSchema
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
export type IDashboardComplejoSolicitudes = z.infer<
  typeof DashboardComplejoSolicitudesSchema
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
export type IDashboardComplejoTurnos = z.infer<
  typeof DashboardComplejoTurnosSchema
>;
export type IDashboardComplejoArchivados = z.infer<
  typeof DashboardComplejoArchivadosSchema
>;
// `DashboardComplejoSchema` está anotado como `z.ZodObject<z.ZodRawShape>` (ver
// arriba) para evitar TS7056 — eso colapsa `z.infer<>` a `Record<string, unknown>`.
// Re-declaramos el tipo manualmente componiéndolo de los sub-tipos, que sí
// conservan inferencia precisa. La forma debe seguir el shape del schema.
export interface IDashboardComplejo {
  idComplejo: string;
  generadoEn: string;
  movimientos: IDashboardComplejoMovimientos;
  visitas: IDashboardComplejoVisitas;
  emergencias: IDashboardComplejoEmergencias;
  solicitudes: IDashboardComplejoSolicitudes;
  hardware: IDashboardComplejoHardware;
  publicaciones: IDashboardComplejoPublicaciones;
  turnos: IDashboardComplejoTurnos;
  archivados: IDashboardComplejoArchivados;
}
export type IEstadoUFMapa = z.infer<typeof EstadoUFMapaSchema>;
export type IDashboardMapaUF = z.infer<typeof DashboardMapaUFSchema>;
export type IDashboardMapaAcceso = z.infer<typeof DashboardMapaAccesoSchema>;
export type IDashboardMapaEmergencia = z.infer<
  typeof DashboardMapaEmergenciaSchema
>;
export type IDashboardMapaComplejo = z.infer<typeof DashboardMapaComplejoSchema>;
export type IDashboardUFVisitas = z.infer<typeof DashboardUFVisitasSchema>;
export type IDashboardUFMovimientos = z.infer<
  typeof DashboardUFMovimientosSchema
>;
export type IDashboardUFVehiculos = z.infer<typeof DashboardUFVehiculosSchema>;
export type IDashboardUFPublicaciones = z.infer<
  typeof DashboardUFPublicacionesSchema
>;
export type IDashboardUFTurnos = z.infer<typeof DashboardUFTurnosSchema>;
export type IDashboardUFTickets = z.infer<typeof DashboardUFTicketsSchema>;
export type IDashboardUFContactos = z.infer<typeof DashboardUFContactosSchema>;
export type IDashboardUF = z.infer<typeof DashboardUFSchema>;
export type IDashboardClienteComplejoRow = z.infer<
  typeof DashboardClienteComplejoRowSchema
>;
export type IDashboardClientePermisosPorCategoria = z.infer<
  typeof DashboardClientePermisosPorCategoriaSchema
>;
export type IDashboardCliente = z.infer<typeof DashboardClienteSchema>;
export type IDashboardProveedorClienteRow = z.infer<
  typeof DashboardProveedorClienteRowSchema
>;
export type IDashboardProveedor = z.infer<typeof DashboardProveedorSchema>;
