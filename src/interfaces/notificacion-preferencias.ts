import { z } from "zod";

export const CategoriaNotificacionSchema = z.enum([
  "visitor_entry",
  "visitor_exit",
  "pub_aviso",
  "pub_evento",
  "pub_mantenimiento",
  "pub_urgente",
  "pub_informacion",
  /** Mobile guardia + contactos de emergencia (uso futuro) */
  "emergencia_recibida",
  /** Mobile UF: nuevo mensaje en chat de emergencia propia */
  "emergencia_mensaje",
  /** Mobile UF: cambio de estado en emergencia propia */
  "emergencia_estado",
  /** Mobile Complejo: nueva emergencia recibida (guardia atendedor) */
  "ticket_emergencia_recibido",
  /** Mobile Complejo: nueva solicitud/reclamo recibido (admin atendedor) */
  "ticket_solicitud_recibido",
  /** Mobile UF: alguien creó un evento de visita que requiere mi aprobación */
  "visita_pendiente_aprobacion",
  /** Mobile UF: mi evento de visita fue aprobado o rechazado */
  "visita_resuelta",
  /** Mobile UF: mi turno quedó confirmado (auto-aprobado) */
  "turno_reservado",
  /** Mobile UF: alguien de mi UF creó un turno que requiere mi aprobación */
  "turno_pendiente_aprobacion",
  /** Mobile UF: mi turno fue aprobado */
  "turno_aprobado",
  /** Mobile UF: mi turno fue rechazado */
  "turno_rechazado",
  /** Mobile UF: mi turno fue cancelado (por mí, otro participante, admin o cancelación tardía/no-show) */
  "turno_cancelado",
  /** Mobile UF: nueva encuesta disponible para responder */
  "encuesta_abierta",
  /** Mobile UF: recordatorio antes del cierre de una encuesta que no respondí */
  "encuesta_recordatorio",
  /** Mobile UF: encuesta donde respondí ya cerró (resultados disponibles si aplica) */
  "encuesta_cerrada",
]);

export const CATEGORIAS_NOTIFICACION =
  CategoriaNotificacionSchema.options;

export const CategoriasNotificacionMapSchema = z.object({
  visitor_entry: z.boolean(),
  visitor_exit: z.boolean(),
  pub_aviso: z.boolean(),
  pub_evento: z.boolean(),
  pub_mantenimiento: z.boolean(),
  pub_urgente: z.boolean(),
  pub_informacion: z.boolean(),
  emergencia_recibida: z.boolean(),
  emergencia_mensaje: z.boolean(),
  emergencia_estado: z.boolean(),
  ticket_emergencia_recibido: z.boolean(),
  ticket_solicitud_recibido: z.boolean(),
  visita_pendiente_aprobacion: z.boolean(),
  visita_resuelta: z.boolean(),
  turno_reservado: z.boolean(),
  turno_pendiente_aprobacion: z.boolean(),
  turno_aprobado: z.boolean(),
  turno_rechazado: z.boolean(),
  turno_cancelado: z.boolean(),
  encuesta_abierta: z.boolean(),
  encuesta_recordatorio: z.boolean(),
  encuesta_cerrada: z.boolean(),
});

export const NotificacionPreferenciasSchema = z.object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    fechaActualizacion: z.string().optional(),
    idPermiso: z.string().optional(),
    pushEnabled: z.boolean().optional(),
    categorias: CategoriasNotificacionMapSchema.optional(),
  });

export const CreateNotificacionPreferenciasSchema =
  NotificacionPreferenciasSchema.omit({
    _id: true,
    fechaCreacion: true,
    fechaActualizacion: true,
  });

export const UpdateNotificacionPreferenciasSchema =
  NotificacionPreferenciasSchema.omit({
    _id: true,
    fechaCreacion: true,
    fechaActualizacion: true,
    idPermiso: true,
  }).partial();

export type ICategoriaNotificacion = z.infer<typeof CategoriaNotificacionSchema>;
export type ICategoriasNotificacionMap = z.infer<
  typeof CategoriasNotificacionMapSchema
>;
export type INotificacionPreferencias = z.infer<
  typeof NotificacionPreferenciasSchema
>;
export type ICreateNotificacionPreferencias = z.infer<
  typeof CreateNotificacionPreferenciasSchema
>;
export type IUpdateNotificacionPreferencias = z.infer<
  typeof UpdateNotificacionPreferenciasSchema
>;

export const NOTIF_PREFERENCIAS_DEFAULT: ICategoriasNotificacionMap = {
  visitor_entry: true,
  visitor_exit: true,
  pub_aviso: true,
  pub_evento: true,
  pub_mantenimiento: true,
  pub_urgente: true,
  pub_informacion: true,
  emergencia_recibida: true,
  emergencia_mensaje: true,
  emergencia_estado: true,
  ticket_emergencia_recibido: true,
  ticket_solicitud_recibido: true,
  visita_pendiente_aprobacion: true,
  visita_resuelta: true,
  turno_reservado: true,
  turno_pendiente_aprobacion: true,
  turno_aprobado: true,
  turno_rechazado: true,
  turno_cancelado: true,
  encuesta_abierta: true,
  encuesta_recordatorio: true,
  encuesta_cerrada: true,
};
