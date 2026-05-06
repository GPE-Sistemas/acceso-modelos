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
  /** Mobile UF: alguien creó un evento de visita que requiere mi aprobación */
  "visita_pendiente_aprobacion",
  /** Mobile UF: mi evento de visita fue aprobado o rechazado */
  "visita_resuelta",
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
  visita_pendiente_aprobacion: z.boolean(),
  visita_resuelta: z.boolean(),
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
  visita_pendiente_aprobacion: true,
  visita_resuelta: true,
};
