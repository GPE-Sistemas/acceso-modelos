import { z } from "zod";
import { EstadoEmergenciaSchema } from "./emergencia";
import { PermisoSchema } from "./permiso";

/**
 * Tipos de interacción del guardia sobre una emergencia.
 * - CambioEstado: cambio de estado de la emergencia (Pendiente → EnAtencion, etc.)
 * - Comentario: nota libre del guardia
 * - AccionExterna: acción predefinida (policía/ambulancia/bomberos enviados, etc.)
 */
export const TipoInteraccionEmergenciaSchema = z.enum([
  "CambioEstado",
  "Comentario",
  "AccionExterna",
]);

export const AccionExternaEmergenciaSchema = z.enum([
  "PoliciaEnviada",
  "AmbulanciaEnviada",
  "BomberosEnviados",
  "SeguridadPrivadaEnviada",
  "ContactadoPropietario",
  "Otro",
]);

export const InteraccionEmergenciaSchema = z.object({
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
    /** Autor (guardia) */
    idPermiso: z.string().optional(),
    tipo: TipoInteraccionEmergenciaSchema.optional(),
    /** CambioEstado */
    estadoAnterior: EstadoEmergenciaSchema.optional(),
    /** CambioEstado */
    estadoNuevo: EstadoEmergenciaSchema.optional(),
    /** AccionExterna */
    accion: AccionExternaEmergenciaSchema.optional(),
    /** Texto libre (cualquier tipo) */
    comentario: z.string().optional(),
    // Populate
    permiso: PermisoSchema.optional(),
  });

export const CreateInteraccionEmergenciaSchema = InteraccionEmergenciaSchema.omit(
  {
    _id: true,
    fechaCreacion: true,
    permiso: true,
  },
);

export const UpdateInteraccionEmergenciaSchema = InteraccionEmergenciaSchema.omit(
  {
    _id: true,
    fechaCreacion: true,
    idEmergencia: true,
    idPermiso: true,
    permiso: true,
  },
).partial();

export type ITipoInteraccionEmergencia = z.infer<
  typeof TipoInteraccionEmergenciaSchema
>;
export type IAccionExternaEmergencia = z.infer<
  typeof AccionExternaEmergenciaSchema
>;
export type IInteraccionEmergencia = z.infer<typeof InteraccionEmergenciaSchema>;
export type ICreateInteraccionEmergencia = z.infer<
  typeof CreateInteraccionEmergenciaSchema
>;
export type IUpdateInteraccionEmergencia = z.infer<
  typeof UpdateInteraccionEmergenciaSchema
>;
