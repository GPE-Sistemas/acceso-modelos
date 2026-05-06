import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";

export const ConfigBotonEmergenciaSchema = z
  .object({
    permiteImagenes: z.boolean().optional(),
    // Extensible: futuras flags (permiteAudio, requiereConfirmacion, etc.)
  })
  .passthrough();

export const BotonEmergenciaSchema = z
  .object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    habilitado: z.boolean().optional(),
    /** true => visible para todos los complejos. Solo Proveedor crea globales. */
    global: z.boolean().optional(),
    /** Requerido si global=false */
    idCliente: z.string().optional(),
    /** Requerido si global=false */
    idComplejo: z.string().optional(),
    texto: z.string().optional(),
    /** Nombre de ícono Material (ej: 'local_police', 'medical_services') */
    icono: z.string().optional(),
    /** hex (#rrggbb) */
    color: z.string().optional(),
    config: ConfigBotonEmergenciaSchema.optional(),
    // Populate
    cliente: ClienteSchema.optional(),
    complejo: ComplejoSchema.optional(),
  })
  .passthrough();

export const CreateBotonEmergenciaSchema = BotonEmergenciaSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
});

export const UpdateBotonEmergenciaSchema = BotonEmergenciaSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
}).partial();

export type IConfigBotonEmergencia = z.infer<
  typeof ConfigBotonEmergenciaSchema
> & { [key: string]: any };
export type IBotonEmergencia = z.infer<typeof BotonEmergenciaSchema>;
export type ICreateBotonEmergencia = z.infer<
  typeof CreateBotonEmergenciaSchema
>;
export type IUpdateBotonEmergencia = z.infer<
  typeof UpdateBotonEmergenciaSchema
>;
