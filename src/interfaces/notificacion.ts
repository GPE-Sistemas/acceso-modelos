import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { GrupoUnidadFuncionalSchema } from "./grupo-unidad-funcional";
import { UnidadFuncionalSchema } from "./unidad-funcional";

/**
 * Alcance de destinatarios de una notificación push manual enviada desde el
 * complejo. Todos los alcances resuelven a permisos nivel 'Unidad Funcional':
 * - Complejo: todas las UF del complejo.
 * - Grupo: las UF del grupo (`idGrupoUnidadFuncional`).
 * - UnidadFuncional: los permisos de una UF (`idUnidadFuncional`).
 * - Permiso: un permiso UF puntual (`idPermisoDestino`).
 */
export const AlcanceNotificacionSchema = z.enum([
  "Complejo",
  "Grupo",
  "UnidadFuncional",
  "Permiso",
]);

/**
 * Notificación push manual (entidad madre). Inmutable tras el envío — es el
 * historial del complejo. El estado por residente (leída / eliminada) vive en
 * `INotificacionUsuario` (entidad hija), uno por destinatario materializado al
 * enviar.
 */
export const NotificacionSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  habilitado: z.boolean().optional(),
  // Tenant (scope)
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  // Contenido
  titulo: z.string(),
  cuerpo: z.string(),
  // Targeting
  alcance: AlcanceNotificacionSchema,
  idGrupoUnidadFuncional: z.string().optional(), // alcance = 'Grupo'
  idUnidadFuncional: z.string().optional(), // alcance = 'UnidadFuncional'
  idPermisoDestino: z.string().optional(), // alcance = 'Permiso'
  // Auditoría — permiso del admin Complejo que envió (lo inyecta acceso-api)
  idPermisoEmisor: z.string().optional(),
  // Métrica de envío (la setea acceso-api tras materializar destinatarios)
  totalDestinatarios: z.number().optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  grupoUnidadFuncional: GrupoUnidadFuncionalSchema.optional(),
  unidadFuncional: UnidadFuncionalSchema.optional(),
});

export const CreateNotificacionSchema = NotificacionSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  idPermisoEmisor: true,
  totalDestinatarios: true,
  cliente: true,
  complejo: true,
  grupoUnidadFuncional: true,
  unidadFuncional: true,
});

export const UpdateNotificacionSchema = CreateNotificacionSchema.partial();

export type IAlcanceNotificacion = z.infer<typeof AlcanceNotificacionSchema>;
export type INotificacion = z.infer<typeof NotificacionSchema>;
export type ICreateNotificacion = z.infer<typeof CreateNotificacionSchema>;
export type IUpdateNotificacion = z.infer<typeof UpdateNotificacionSchema>;
