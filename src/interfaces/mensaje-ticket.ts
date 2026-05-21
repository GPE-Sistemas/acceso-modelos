import { z } from "zod";
import { PermisoSchema } from "./permiso";

/**
 * Mensaje de chat acotado a un ticket. Vive y muere con el ticket.
 * No reutiliza el chat general del sistema.
 */
export const MensajeTicketSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idTicket: z.string().optional(),
  /** Autor */
  idPermiso: z.string().optional(),
  texto: z.string().optional(),
  /** idsPermisos que ya leyeron */
  leidoPor: z.array(z.string()).optional(),
  // Populate
  permiso: PermisoSchema.optional(),
});

export const CreateMensajeTicketSchema = MensajeTicketSchema.omit({
  _id: true,
  fechaCreacion: true,
  leidoPor: true,
  permiso: true,
});

export const UpdateMensajeTicketSchema = MensajeTicketSchema.omit({
  _id: true,
  fechaCreacion: true,
  idTicket: true,
  idPermiso: true,
  permiso: true,
}).partial();

export type IMensajeTicket = z.infer<typeof MensajeTicketSchema>;
export type ICreateMensajeTicket = z.infer<typeof CreateMensajeTicketSchema>;
export type IUpdateMensajeTicket = z.infer<typeof UpdateMensajeTicketSchema>;
