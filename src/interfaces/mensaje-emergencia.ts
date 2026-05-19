import { z } from "zod";
import { PermisoSchema } from "./permiso";

/**
 * Mensaje de chat acotado a una emergencia. Vive y muere con la emergencia.
 * No reutiliza el chat general del sistema.
 */
export const MensajeEmergenciaSchema = z.object({
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
    idEmergencia: z.string().optional(),
    /** Autor */
    idPermiso: z.string().optional(),
    texto: z.string().optional(),
    /** idsPermisos que ya leyeron */
    leidoPor: z.array(z.string()).optional(),
    // Populate
    permiso: PermisoSchema.optional(),
  });

export const CreateMensajeEmergenciaSchema = MensajeEmergenciaSchema.omit({
  _id: true,
  fechaCreacion: true,
  leidoPor: true,
  permiso: true,
});

export const UpdateMensajeEmergenciaSchema = MensajeEmergenciaSchema.omit({
  _id: true,
  fechaCreacion: true,
  idEmergencia: true,
  idPermiso: true,
  permiso: true,
}).partial();

export type IMensajeEmergencia = z.infer<typeof MensajeEmergenciaSchema>;
export type ICreateMensajeEmergencia = z.infer<
  typeof CreateMensajeEmergenciaSchema
>;
export type IUpdateMensajeEmergencia = z.infer<
  typeof UpdateMensajeEmergenciaSchema
>;
