import { z } from "zod";
import type { ICliente } from "./cliente";
import { ClienteSchema } from "./cliente";
import type { IComplejo } from "./complejo";
import { ComplejoSchema } from "./complejo";
import type { IPermiso } from "./permiso";
import { PermisoSchema } from "./permiso";
import type { IUnidadFuncional } from "./unidad-funcional";
import { UnidadFuncionalSchema } from "./unidad-funcional";
import type { IVehiculo } from "./vehiculo";
import { VehiculoSchema } from "./vehiculo";
import type { IVisitante } from "./visitante";
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

export const RecurrenciaEventoVisitaSchema = z
  .object({
    /** 0..6 (0=domingo). Si incluye los 7, equivale a "todos los días". */
    diasSemana: z.array(z.number()),
    /** 'HH:mm' — ventana intra-día opcional */
    horaDesde: z.string().optional(),
    /** 'HH:mm' — si horaHasta < horaDesde se interpreta cruzando medianoche. */
    horaHasta: z.string().optional(),
  })
  .passthrough();

export type ITipoEventoVisita = z.infer<typeof TipoEventoVisitaSchema>;
export type IEstadoEventoVisita = z.infer<typeof EstadoEventoVisitaSchema>;
export type ICreadoPorEventoVisita = z.infer<typeof CreadoPorEventoVisitaSchema>;
export type IEstadoAprobacionEventoVisita = z.infer<
  typeof EstadoAprobacionEventoVisitaSchema
>;
export type IRecurrenciaEventoVisita = z.infer<
  typeof RecurrenciaEventoVisitaSchema
>;

export interface IEventoVisita {
  _id?: string;
  fechaCreacion?: string;
  idCliente?: string;
  idComplejo?: string;
  /** Unidad del propietario que autoriza (contexto del creador) */
  idUnidadFuncional?: string;
  /** Destino real de la visita (puede diferir de idUnidadFuncional) */
  idUnidadFuncionalDestino?: string;
  /** Quien creó el evento (propietario o guardia) */
  idPermiso?: string;
  creadoPor?: ICreadoPorEventoVisita;
  tipo?: ITipoEventoVisita;
  idsVisitantes?: string[];
  idsVehiculos?: string[];
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: IEstadoEventoVisita;
  /** Si true: egreso no cierra el evento; cierre solo por vencimiento de ventana */
  permiteAccesoMultiple?: boolean;
  /** Cache: unión de idsVisitantesAplicados de los vínculos tipo 'Ingreso' */
  idsVisitantesIngresados?: string[];
  /** Cache: idsVisitantesIngresados − idsVisitantesEgresados (quienes están actualmente adentro) */
  idsVisitantesAdentro?: string[];
  observaciones?: string;
  /** Recurrencia (presencia => evento recurrente). Reusa fechaDesde/fechaHasta del evento. */
  recurrencia?: IRecurrenciaEventoVisita;
  // Aprobación UF (regla actual)
  estadoAprobacion?: IEstadoAprobacionEventoVisita;
  aprobadoPorIdPermiso?: string;
  fechaAprobacion?: string;
  motivoRechazo?: string;
  // Aprobación recurrente (admin Complejo). Sólo aplica si recurrencia presente.
  estadoAprobacionRecurrente?: IEstadoAprobacionEventoVisita;
  aprobadoRecurrentePorIdPermiso?: string;
  fechaAprobacionRecurrente?: string;
  motivoRechazoRecurrente?: string;
  // Populate
  cliente?: ICliente;
  complejo?: IComplejo;
  unidadFuncional?: IUnidadFuncional;
  unidadFuncionalDestino?: IUnidadFuncional;
  permiso?: IPermiso;
  visitantes?: IVisitante[];
  vehiculos?: IVehiculo[];
  aprobadoPorPermiso?: IPermiso;
  aprobadoRecurrentePorPermiso?: IPermiso;
  [key: string]: any;
}

type EventoVisitaPopulateKey =
  | "cliente"
  | "complejo"
  | "unidadFuncional"
  | "unidadFuncionalDestino"
  | "permiso"
  | "visitantes"
  | "vehiculos"
  | "aprobadoPorPermiso"
  | "aprobadoRecurrentePorPermiso";

export type ICreateEventoVisita = Omit<
  Partial<IEventoVisita>,
  "_id" | "fechaCreacion" | EventoVisitaPopulateKey
>;
export type IUpdateEventoVisita = ICreateEventoVisita;

const _EventoVisitaSchema = z
  .object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    idCliente: z.string().optional(),
    idComplejo: z.string().optional(),
    idUnidadFuncional: z.string().optional(),
    idUnidadFuncionalDestino: z.string().optional(),
    idPermiso: z.string().optional(),
    creadoPor: CreadoPorEventoVisitaSchema.optional(),
    tipo: TipoEventoVisitaSchema.optional(),
    idsVisitantes: z.array(z.string()).optional(),
    idsVehiculos: z.array(z.string()).optional(),
    fechaDesde: z.string().optional(),
    fechaHasta: z.string().optional(),
    estado: EstadoEventoVisitaSchema.optional(),
    permiteAccesoMultiple: z.boolean().optional(),
    idsVisitantesIngresados: z.array(z.string()).optional(),
    idsVisitantesAdentro: z.array(z.string()).optional(),
    observaciones: z.string().optional(),
    recurrencia: RecurrenciaEventoVisitaSchema.optional(),
    estadoAprobacion: EstadoAprobacionEventoVisitaSchema.optional(),
    aprobadoPorIdPermiso: z.string().optional(),
    fechaAprobacion: z.string().optional(),
    motivoRechazo: z.string().optional(),
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
  })
  .passthrough();

const _CreateEventoVisitaSchema = _EventoVisitaSchema
  .omit({
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

const _UpdateEventoVisitaSchema = _CreateEventoVisitaSchema.partial();

export const EventoVisitaSchema: z.ZodType<IEventoVisita> =
  _EventoVisitaSchema as unknown as z.ZodType<IEventoVisita>;
export const CreateEventoVisitaSchema: z.ZodType<ICreateEventoVisita> =
  _CreateEventoVisitaSchema as unknown as z.ZodType<ICreateEventoVisita>;
export const UpdateEventoVisitaSchema: z.ZodType<IUpdateEventoVisita> =
  _UpdateEventoVisitaSchema as unknown as z.ZodType<IUpdateEventoVisita>;
