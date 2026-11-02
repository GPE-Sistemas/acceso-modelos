import { z } from "zod";
import { RecurrenciaEventoVisitaSchema, TipoEventoVisitaSchema } from "./evento-visita";

/**
 * Asistente IA de ColivingApp (D70, doc 56). Cloud-only: no viaja al edge.
 *
 * El modelo nunca escribe: las acciones salen como `propuesta` en un mensaje del
 * asistente y se ejecutan recién cuando el residente la confirma desde la app.
 */

/** Días que se conservan conversación y mensajes (índice TTL en `fechaExpiracion`). */
export const DIAS_RETENCION_ASISTENTE = 30;

/** Mensajes por día por residente cuando el complejo no configura otro cupo. */
export const MENSAJES_DIARIOS_ASISTENTE_DEFAULT = 30;

export const RolMensajeAsistenteSchema = z.enum(["Usuario", "Asistente"]);

export const EstadoPropuestaAsistenteSchema = z.enum([
  "Pendiente",
  "Confirmada",
  "Descartada",
]);

/** Visitante que el residente puede elegir cuando el nombre es ambiguo. */
export const CandidatoVisitanteAsistenteSchema = z.object({
  idVisitante: z.string(),
  nombre: z.string(),
  /** Últimos 3 dígitos del DNI, para distinguir sin exponerlo completo. */
  dniParcial: z.string().optional(),
  /** Global del complejo (`ambito: 'Complejo'`) y no de la UF. */
  global: z.boolean().optional(),
});

/**
 * Un visitante de la propuesta. Queda resuelto con `idVisitante` (existente) o
 * con `nombre` (+ `apellido`/`dni`) para darlo de alta al confirmar. Con
 * `candidatos` el residente elige en la tarjeta.
 */
export const VisitantePropuestaAsistenteSchema = z.object({
  idVisitante: z.string().optional(),
  nombre: z.string().optional(),
  apellido: z.string().optional(),
  dni: z.string().optional(),
  candidatos: z.array(CandidatoVisitanteAsistenteSchema).optional(),
});

export const PropuestaEventoVisitaAsistenteSchema = z.object({
  tipo: TipoEventoVisitaSchema.optional(),
  fechaDesde: z.string(),
  fechaHasta: z.string().optional(),
  recurrencia: RecurrenciaEventoVisitaSchema.optional(),
  permiteAccesoMultiple: z.boolean().optional(),
  observaciones: z.string().optional(),
  visitantes: z.array(VisitantePropuestaAsistenteSchema).min(1),
});

export const TipoPropuestaAsistenteSchema = z.enum(["EventoVisita"]);

export const PropuestaAsistenteSchema = z.object({
  tipo: TipoPropuestaAsistenteSchema,
  estado: EstadoPropuestaAsistenteSchema,
  eventoVisita: PropuestaEventoVisitaAsistenteSchema.optional(),
  /** `_id` de lo creado al confirmar (p. ej. el evento de visita). */
  idResultado: z.string().optional(),
  fechaResolucion: z.string().optional(),
});

/** Auditoría de una tool ejecutada en el turno. */
export const ToolMensajeAsistenteSchema = z.object({
  nombre: z.string(),
  ok: z.boolean(),
  ms: z.number().optional(),
  error: z.string().optional(),
});

export const ConversacionAsistenteSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  idUsuario: z.string().optional(),
  idPermiso: z.string().optional(),
  /** Primer mensaje del residente, recortado: lo que muestra el historial. */
  titulo: z.string().optional(),
  /** Se corre con cada mensaje; el índice TTL la borra al vencer. */
  fechaExpiracion: z.string().optional(),
});

export const MensajeAsistenteSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idConversacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  idUsuario: z.string().optional(),
  idPermiso: z.string().optional(),
  rol: RolMensajeAsistenteSchema.optional(),
  texto: z.string().optional(),
  propuesta: PropuestaAsistenteSchema.optional(),
  tools: z.array(ToolMensajeAsistenteSchema).optional(),
  modelo: z.string().optional(),
  tokensEntrada: z.number().optional(),
  tokensSalida: z.number().optional(),
  tokensCache: z.number().optional(),
  fechaExpiracion: z.string().optional(),
});

export const CreateConversacionAsistenteSchema = ConversacionAsistenteSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
});
export const UpdateConversacionAsistenteSchema =
  CreateConversacionAsistenteSchema.partial();

export const CreateMensajeAsistenteSchema = MensajeAsistenteSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
});
export const UpdateMensajeAsistenteSchema = CreateMensajeAsistenteSchema.partial();

/** Body de `POST /asistente/mensajes`. */
export const EnviarMensajeAsistenteSchema = z.object({
  texto: z.string().min(1).max(2000),
  /** Conversación a continuar. Ausente = conversación nueva. */
  idConversacion: z.string().optional(),
});

/** Largo máximo del título de una conversación (el primer mensaje, recortado). */
export const MAX_TITULO_CONVERSACION_ASISTENTE = 80;

// ─── Logs de uso (control y debug) ──────────────────────────────────────────

/**
 * Cómo terminó un turno:
 * - `Ok`: respondió.
 * - `Rechazo`: el modelo (y su fallback) se negó (`stop_reason: refusal`).
 * - `Error`: falló la API del modelo o una vuelta del loop.
 * - `Cancelado`: la app cortó la conexión a mitad del turno.
 * - `Cupo`: se rechazó antes de llamar al modelo por el límite diario.
 */
export const ResultadoUsoAsistenteSchema = z.enum([
  "Ok",
  "Rechazo",
  "Error",
  "Cancelado",
  "Cupo",
]);

/** Una vuelta del loop modelo↔tools (un request a la API de Claude). */
export const IteracionUsoAsistenteSchema = z.object({
  /** Modelo que respondió (difiere del pedido si actuó el fallback). */
  modelo: z.string().optional(),
  stopReason: z.string().optional(),
  tokensEntrada: z.number().optional(),
  tokensSalida: z.number().optional(),
  tokensCacheLectura: z.number().optional(),
  tokensCacheEscritura: z.number().optional(),
  ms: z.number().optional(),
});

/** Tool ejecutada en el turno, con su input (vence con el texto). */
export const ToolUsoAsistenteSchema = z.object({
  nombre: z.string(),
  ok: z.boolean(),
  ms: z.number().optional(),
  error: z.string().optional(),
  /** Input como JSON. Puede tener datos personales: vence con el texto. */
  input: z.string().optional(),
  /** Tamaño en caracteres del resultado que volvió al modelo. */
  caracteresResultado: z.number().optional(),
});

/**
 * Log de un turno del asistente (un mensaje del residente y su respuesta).
 * Las métricas no vencen; el texto, la respuesta y el input de las tools se
 * borran a `fechaExpiracionTexto` (30 días, lo que dice el aviso de
 * privacidad). Sobrevive al borrado de la conversación por el residente.
 * Solo lo ve el soporte GPE (Proveedor).
 */
export const UsoAsistenteSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  idUnidadFuncional: z.string().optional(),
  idUsuario: z.string().optional(),
  idPermiso: z.string().optional(),
  username: z.string().optional(),
  idConversacion: z.string().optional(),
  /** Mensaje del asistente que cerró el turno. */
  idMensaje: z.string().optional(),
  resultado: ResultadoUsoAsistenteSchema.optional(),
  error: z.string().optional(),
  /** Modelo pedido (`ASISTENTE_MODELO`). */
  modelo: z.string().optional(),
  effort: z.string().optional(),
  iteraciones: z.array(IteracionUsoAsistenteSchema).optional(),
  tools: z.array(ToolUsoAsistenteSchema).optional(),
  tokensEntrada: z.number().optional(),
  tokensSalida: z.number().optional(),
  tokensCacheLectura: z.number().optional(),
  tokensCacheEscritura: z.number().optional(),
  /** Estimado con la tabla de precios de acceso-api; null = modelo sin precio. */
  costoUsd: z.number().nullable().optional(),
  msTotal: z.number().optional(),
  /** Hasta el primer texto que vio el residente. */
  msPrimerTexto: z.number().optional(),
  caracteresTexto: z.number().optional(),
  caracteresRespuesta: z.number().optional(),
  /** Hubo propuesta de evento y cómo terminó (se actualiza al confirmar). */
  propuesta: EstadoPropuestaAsistenteSchema.optional(),
  idEventoVisita: z.string().optional(),
  /** Datos personales: se borran a `fechaExpiracionTexto`. */
  texto: z.string().optional(),
  respuesta: z.string().optional(),
  fechaExpiracionTexto: z.string().optional(),
  appVersion: z.string().optional(),
  plataforma: z.string().optional(),
  // Populate
  complejo: z.any().optional(),
  permiso: z.any().optional(),
});

export const CreateUsoAsistenteSchema = UsoAsistenteSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  complejo: true,
  permiso: true,
});
export const UpdateUsoAsistenteSchema = CreateUsoAsistenteSchema.partial();

/** Respuesta de `GET /asistente/usos/resumen`. */
export const ResumenUsoAsistenteSchema = z.object({
  turnos: z.number(),
  usuarios: z.number(),
  tokensEntrada: z.number(),
  tokensSalida: z.number(),
  tokensCacheLectura: z.number(),
  tokensCacheEscritura: z.number(),
  costoUsd: z.number(),
  porResultado: z.record(z.string(), z.number()),
  porComplejo: z.array(
    z.object({
      idComplejo: z.string(),
      nombre: z.string().optional(),
      turnos: z.number(),
      costoUsd: z.number(),
    }),
  ),
  porUsuario: z.array(
    z.object({
      idPermiso: z.string(),
      username: z.string().optional(),
      turnos: z.number(),
      tokensEntrada: z.number(),
      tokensSalida: z.number(),
      costoUsd: z.number(),
    }),
  ),
});

/**
 * Body de `POST /asistente/propuestas/:id/confirmar`: la propuesta tal como la
 * dejó el residente en la tarjeta (editada y con los candidatos elegidos).
 */
export const ConfirmarPropuestaAsistenteSchema = z.object({
  eventoVisita: PropuestaEventoVisitaAsistenteSchema.optional(),
});

/**
 * Body de `PUT /mensajes-asistente/:id/resolver-propuesta` en acceso-datos.
 * Condicional a `Pendiente`: lo resuelve una sola vez.
 */
export const ResolverPropuestaMensajeAsistenteSchema = z.object({
  estado: z.enum(["Confirmada", "Descartada"]),
  idResultado: z.string().optional(),
  /** La propuesta como quedó al confirmar (editada por el residente). */
  eventoVisita: PropuestaEventoVisitaAsistenteSchema.optional(),
});

export type IRolMensajeAsistente = z.infer<typeof RolMensajeAsistenteSchema>;
export type IEstadoPropuestaAsistente = z.infer<typeof EstadoPropuestaAsistenteSchema>;
export type ICandidatoVisitanteAsistente = z.infer<typeof CandidatoVisitanteAsistenteSchema>;
export type IVisitantePropuestaAsistente = z.infer<typeof VisitantePropuestaAsistenteSchema>;
export type IPropuestaEventoVisitaAsistente = z.infer<
  typeof PropuestaEventoVisitaAsistenteSchema
>;
export type ITipoPropuestaAsistente = z.infer<typeof TipoPropuestaAsistenteSchema>;
export type IPropuestaAsistente = z.infer<typeof PropuestaAsistenteSchema>;
export type IToolMensajeAsistente = z.infer<typeof ToolMensajeAsistenteSchema>;
export type IConversacionAsistente = z.infer<typeof ConversacionAsistenteSchema>;
export type ICreateConversacionAsistente = z.infer<
  typeof CreateConversacionAsistenteSchema
>;
export type IUpdateConversacionAsistente = z.infer<
  typeof UpdateConversacionAsistenteSchema
>;
export type IMensajeAsistente = z.infer<typeof MensajeAsistenteSchema>;
export type ICreateMensajeAsistente = z.infer<typeof CreateMensajeAsistenteSchema>;
export type IUpdateMensajeAsistente = z.infer<typeof UpdateMensajeAsistenteSchema>;
export type IEnviarMensajeAsistente = z.infer<typeof EnviarMensajeAsistenteSchema>;
export type IResolverPropuestaMensajeAsistente = z.infer<
  typeof ResolverPropuestaMensajeAsistenteSchema
>;
export type IResultadoUsoAsistente = z.infer<typeof ResultadoUsoAsistenteSchema>;
export type IIteracionUsoAsistente = z.infer<typeof IteracionUsoAsistenteSchema>;
export type IToolUsoAsistente = z.infer<typeof ToolUsoAsistenteSchema>;
export type IUsoAsistente = z.infer<typeof UsoAsistenteSchema>;
export type ICreateUsoAsistente = z.infer<typeof CreateUsoAsistenteSchema>;
export type IUpdateUsoAsistente = z.infer<typeof UpdateUsoAsistenteSchema>;
export type IResumenUsoAsistente = z.infer<typeof ResumenUsoAsistenteSchema>;
export type IConfirmarPropuestaAsistente = z.infer<
  typeof ConfirmarPropuestaAsistenteSchema
>;
