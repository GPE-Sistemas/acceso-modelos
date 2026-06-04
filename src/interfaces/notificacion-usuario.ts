import { z } from "zod";
import { NotificacionSchema } from "./notificacion";
import { PermisoSchema } from "./permiso";
import { UsuarioSchema } from "./usuario";

/**
 * Estado por destinatario de una notificación push manual (entidad hija). Se
 * materializa un documento por permiso UF destinatario al momento del envío.
 * Soporta la bandeja del residente (leída / no leída) y el soft-delete del
 * residente (`eliminada`) — la madre y el resto de hijos persisten siempre,
 * por lo que el historial del complejo queda intacto.
 */
export const NotificacionUsuarioSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  // Solo presente para notificaciones manuales del complejo (link a la madre +
  // desglose de lecturas). Las notificaciones de eventos (turno/visita/ticket/
  // encuesta/publicación) NO tienen madre — la entrada es autocontenida.
  idNotificacion: z.string().optional(),
  idPermiso: z.string().optional(),
  idUsuario: z.string().optional(),
  // Tenant (scope)
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  // Contenido autocontenido (inbox unificado). `tipo` = categoría push
  // (notificacion | turno_* | visita_* | ticket_* | encuesta_* | publication...).
  // `data` lleva los ids de deep-link para que mobile navegue al tocar (reusa el
  // mismo routing que el push: PushEvents.fromData(data)).
  tipo: z.string().optional(),
  titulo: z.string().optional(),
  cuerpo: z.string().optional(),
  data: z.record(z.string(), z.string()).optional(),
  // Estado del residente
  leida: z.boolean().optional(),
  fechaLeida: z.string().optional(),
  eliminada: z.boolean().optional(),
  // Populate
  notificacion: NotificacionSchema.optional(),
  permiso: PermisoSchema.optional(),
  usuario: UsuarioSchema.optional(),
});

export const CreateNotificacionUsuarioSchema = NotificacionUsuarioSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  fechaLeida: true,
  notificacion: true,
  permiso: true,
  usuario: true,
});

export const UpdateNotificacionUsuarioSchema =
  CreateNotificacionUsuarioSchema.partial();

export type INotificacionUsuario = z.infer<typeof NotificacionUsuarioSchema>;
export type ICreateNotificacionUsuario = z.infer<
  typeof CreateNotificacionUsuarioSchema
>;
export type IUpdateNotificacionUsuario = z.infer<
  typeof UpdateNotificacionUsuarioSchema
>;
