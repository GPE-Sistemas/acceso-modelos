import { z } from "zod";
import { EstadoTicketSchema } from "./ticket";
import { PermisoSchema } from "./permiso";

/**
 * Tipos de interacción sobre un ticket.
 * - CambioEstado: cambio de estado del ticket (Pendiente → EnAtencion, etc.)
 * - Comentario: nota libre del atendedor o del emisor
 * - AccionExterna: acción predefinida (policía/ambulancia/bomberos enviados, etc.)
 */
export const TipoInteraccionTicketSchema = z.enum([
  "CambioEstado",
  "Comentario",
  "AccionExterna",
]);

export const AccionExternaTicketSchema = z.enum([
  "PoliciaEnviada",
  "AmbulanciaEnviada",
  "BomberosEnviados",
  "SeguridadPrivadaEnviada",
  "ContactadoPropietario",
  "Otro",
]);

export const InteraccionTicketSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idTicket: z.string().optional(),
  /** Autor (emisor o atendedor) */
  idPermiso: z.string().optional(),
  tipo: TipoInteraccionTicketSchema.optional(),
  /** CambioEstado */
  estadoAnterior: EstadoTicketSchema.optional(),
  /** CambioEstado */
  estadoNuevo: EstadoTicketSchema.optional(),
  /** AccionExterna */
  accion: AccionExternaTicketSchema.optional(),
  /** Texto libre (cualquier tipo) */
  comentario: z.string().optional(),
  // Populate
  permiso: PermisoSchema.optional(),
});

export const CreateInteraccionTicketSchema = InteraccionTicketSchema.omit({
  _id: true,
  fechaCreacion: true,
  permiso: true,
});

export const UpdateInteraccionTicketSchema = InteraccionTicketSchema.omit({
  _id: true,
  fechaCreacion: true,
  idTicket: true,
  idPermiso: true,
  permiso: true,
}).partial();

export type ITipoInteraccionTicket = z.infer<typeof TipoInteraccionTicketSchema>;
export type IAccionExternaTicket = z.infer<typeof AccionExternaTicketSchema>;
export type IInteraccionTicket = z.infer<typeof InteraccionTicketSchema>;
export type ICreateInteraccionTicket = z.infer<
  typeof CreateInteraccionTicketSchema
>;
export type IUpdateInteraccionTicket = z.infer<
  typeof UpdateInteraccionTicketSchema
>;
