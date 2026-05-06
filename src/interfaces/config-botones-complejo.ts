import { z } from "zod";
import { BotonEmergenciaSchema } from "./boton-emergencia";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";

/**
 * Configuración de botones de emergencia visibles en la app mobile de un complejo.
 * Una por complejo (índice único en idComplejo). El orden del array idsBotones
 * define el orden de aparición en la pantalla de emergencias del mobile.
 */
export const ConfigBotonesComplejoSchema = z.object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    fechaActualizacion: z.string().optional(),
    idCliente: z.string().optional(),
    idComplejo: z.string().optional(),
    /** Botones (globales + del complejo) seleccionados, en orden */
    idsBotones: z.array(z.string()).optional(),
    // Populate
    cliente: ClienteSchema.optional(),
    complejo: ComplejoSchema.optional(),
    botones: z.array(BotonEmergenciaSchema).optional(),
  });

export const CreateConfigBotonesComplejoSchema =
  ConfigBotonesComplejoSchema.omit({
    _id: true,
    fechaCreacion: true,
    fechaActualizacion: true,
    cliente: true,
    complejo: true,
    botones: true,
  });

export const UpdateConfigBotonesComplejoSchema =
  ConfigBotonesComplejoSchema.omit({
    _id: true,
    fechaCreacion: true,
    fechaActualizacion: true,
    idCliente: true,
    idComplejo: true,
    cliente: true,
    complejo: true,
    botones: true,
  }).partial();

export type IConfigBotonesComplejo = z.infer<
  typeof ConfigBotonesComplejoSchema
>;
export type ICreateConfigBotonesComplejo = z.infer<
  typeof CreateConfigBotonesComplejoSchema
>;
export type IUpdateConfigBotonesComplejo = z.infer<
  typeof UpdateConfigBotonesComplejoSchema
>;
