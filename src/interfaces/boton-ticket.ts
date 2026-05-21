import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";

/**
 * Categoría del ticket. Define routing al panel de atención + defaults de config.
 * - Emergencia → panel guardia (acción "Tickets - Atender emergencias")
 * - Solicitud | Reclamo → panel administración (acción "Tickets - Atender solicitudes")
 */
export const CategoriaTicketSchema = z.enum([
  "Emergencia",
  "Solicitud",
  "Reclamo",
]);

export const ConfigBotonTicketSchema = z.object({
  /** Permite adjuntar imágenes al ticket. Default false. */
  permiteImagenes: z.boolean().optional(),
  /** Pide ubicación GPS antes de crear el ticket. Default por categoría: Emergencia=true, otros=false. */
  requiereUbicacion: z.boolean().optional(),
  /**
   * Si requiereUbicacion=true, exige que la posición esté dentro del polígono del complejo
   * (con tolerancia por accuracy del GPS). Default por categoría: Emergencia=true, otros=false.
   */
  requiereDentroDelComplejo: z.boolean().optional(),
  /** Cuenta regresiva pre-envío en mobile. Default Emergencia=5, otros=0. */
  countdownSeg: z.number().int().nonnegative().optional(),
  // Extensible: prioridad, requiereConfirmacion, etc.
});

export const BotonTicketSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  habilitado: z.boolean().optional(),
  /** Categoría del botón. Inmutable post-creación. */
  categoria: CategoriaTicketSchema.optional(),
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
  config: ConfigBotonTicketSchema.optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
});

export const CreateBotonTicketSchema = BotonTicketSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
});

export const UpdateBotonTicketSchema = BotonTicketSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
}).partial();

export type ICategoriaTicket = z.infer<typeof CategoriaTicketSchema>;
export type IConfigBotonTicket = z.infer<typeof ConfigBotonTicketSchema>;
export type IBotonTicket = z.infer<typeof BotonTicketSchema>;
export type ICreateBotonTicket = z.infer<typeof CreateBotonTicketSchema>;
export type IUpdateBotonTicket = z.infer<typeof UpdateBotonTicketSchema>;
