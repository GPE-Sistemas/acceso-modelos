import { z } from "zod";
import { BotonTicketSchema } from "./boton-ticket";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";

/**
 * Configuración de botones de ticket visibles en la app mobile de un complejo.
 * Una por complejo (índice único en idComplejo). El orden del array idsBotones
 * define el orden de aparición en la pantalla de tickets del mobile, agrupado
 * por categoría (Emergencia primero, después Solicitud, después Reclamo).
 */
export const ConfigBotonesTicketComplejoSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  /** Botones (globales + del complejo) seleccionados, en orden. */
  idsBotones: z.array(z.string()).optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  botones: z.array(BotonTicketSchema).optional(),
});

export const CreateConfigBotonesTicketComplejoSchema =
  ConfigBotonesTicketComplejoSchema.omit({
    _id: true,
    fechaCreacion: true,
    fechaActualizacion: true,
    cliente: true,
    complejo: true,
    botones: true,
  });

export const UpdateConfigBotonesTicketComplejoSchema =
  ConfigBotonesTicketComplejoSchema.omit({
    _id: true,
    fechaCreacion: true,
    fechaActualizacion: true,
    idCliente: true,
    idComplejo: true,
    cliente: true,
    complejo: true,
    botones: true,
  }).partial();

export type IConfigBotonesTicketComplejo = z.infer<
  typeof ConfigBotonesTicketComplejoSchema
>;
export type ICreateConfigBotonesTicketComplejo = z.infer<
  typeof CreateConfigBotonesTicketComplejoSchema
>;
export type IUpdateConfigBotonesTicketComplejo = z.infer<
  typeof UpdateConfigBotonesTicketComplejoSchema
>;
