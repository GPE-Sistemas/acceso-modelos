import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { PermisoSchema } from "./permiso";
import { UnidadFuncionalSchema } from "./unidad-funcional";
import { VehiculoSchema } from "./vehiculo";
import { VisitanteSchema } from "./visitante";

export const TipoEventoVisitaSchema = z.enum([
  "Particular",
  "Servicio",
  "Retiro",
  "Entrega",
]);
export const EstadoEventoVisitaSchema = z.enum([
  "Pendiente",
  "Activa",
  "Parcial",
  "Cerrada",
  "Vencida",
]);
export const CreadoPorEventoVisitaSchema = z.enum(["Propietario", "Guardia"]);
export const EstadoAprobacionEventoVisitaSchema = z.enum([
  "Pendiente",
  "Aprobado",
  "Rechazado",
]);

export const RecurrenciaEventoVisitaSchema = z.object({
  /** 0..6 (0=domingo). Si incluye los 7, equivale a "todos los días". */
  diasSemana: z.array(z.number()),
  /** 'HH:mm' — ventana intra-día opcional */
  horaDesde: z.string().optional(),
  /** 'HH:mm' — si horaHasta < horaDesde se interpreta cruzando medianoche. */
  horaHasta: z.string().optional(),
});

export type ITipoEventoVisita = z.infer<typeof TipoEventoVisitaSchema>;
export type IEstadoEventoVisita = z.infer<typeof EstadoEventoVisitaSchema>;
export type ICreadoPorEventoVisita = z.infer<typeof CreadoPorEventoVisitaSchema>;
export type IEstadoAprobacionEventoVisita = z.infer<
  typeof EstadoAprobacionEventoVisitaSchema
>;
export type IRecurrenciaEventoVisita = z.infer<
  typeof RecurrenciaEventoVisitaSchema
>;

export const EventoVisitaSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  /**
   * Timestamp de la última mutación (ISO 8601). Anti-eco cross-edge:
   * el caller (edge) puede setearlo explícito para preservar el momento
   * exacto del write original a través del bridge; si se omite, el
   * server (acceso-datos) lo defaultea a `new Date().toISOString()`.
   * Doc 17 § Tipo A — último-write-wins por este campo.
   */
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  /** Unidad del propietario que autoriza (contexto del creador) */
  idUnidadFuncional: z.string().optional(),
  /** Destino real de la visita (puede diferir de idUnidadFuncional) */
  idUnidadFuncionalDestino: z.string().optional(),
  /** Quien creó el evento (propietario o guardia) */
  idPermiso: z.string().optional(),
  creadoPor: CreadoPorEventoVisitaSchema.optional(),
  tipo: TipoEventoVisitaSchema.optional(),
  idsVisitantes: z.array(z.string()).optional(),
  idsVehiculos: z.array(z.string()).optional(),
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  estado: EstadoEventoVisitaSchema.optional(),
  /** Si true: egreso no cierra el evento; cierre solo por vencimiento de ventana */
  permiteAccesoMultiple: z.boolean().optional(),
  /** Cache: unión de idsVisitantesAplicados de los vínculos tipo 'Ingreso' */
  idsVisitantesIngresados: z.array(z.string()).optional(),
  /** Cache: idsVisitantesIngresados − idsVisitantesEgresados */
  idsVisitantesAdentro: z.array(z.string()).optional(),
  observaciones: z.string().optional(),
  /** Recurrencia (presencia => evento recurrente). Reusa fechaDesde/fechaHasta del evento. */
  recurrencia: RecurrenciaEventoVisitaSchema.optional(),
  // Aprobación UF (regla actual)
  estadoAprobacion: EstadoAprobacionEventoVisitaSchema.optional(),
  aprobadoPorIdPermiso: z.string().optional(),
  fechaAprobacion: z.string().optional(),
  motivoRechazo: z.string().optional(),
  // Aprobación recurrente (admin Complejo). Sólo aplica si recurrencia presente.
  estadoAprobacionRecurrente: EstadoAprobacionEventoVisitaSchema.optional(),
  aprobadoRecurrentePorIdPermiso: z.string().optional(),
  fechaAprobacionRecurrente: z.string().optional(),
  motivoRechazoRecurrente: z.string().optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  unidadFuncional: UnidadFuncionalSchema.optional(),
  unidadFuncionalDestino: UnidadFuncionalSchema.optional(),
  permiso: PermisoSchema.optional(),
  visitantes: z.array(VisitanteSchema).optional(),
  vehiculos: z.array(VehiculoSchema).optional(),
  aprobadoPorPermiso: PermisoSchema.optional(),
  aprobadoRecurrentePorPermiso: PermisoSchema.optional(),
});

export const CreateEventoVisitaSchema = EventoVisitaSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
  unidadFuncional: true,
  unidadFuncionalDestino: true,
  permiso: true,
  visitantes: true,
  vehiculos: true,
  aprobadoPorPermiso: true,
  aprobadoRecurrentePorPermiso: true,
});

export const UpdateEventoVisitaSchema = CreateEventoVisitaSchema.partial();

export type IEventoVisita = z.infer<typeof EventoVisitaSchema>;
export type ICreateEventoVisita = z.infer<typeof CreateEventoVisitaSchema>;
export type IUpdateEventoVisita = z.infer<typeof UpdateEventoVisitaSchema>;
