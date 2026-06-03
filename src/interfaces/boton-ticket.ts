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

/**
 * Tipo de campo del formulario configurable que el usuario UF completa al pulsar
 * un botón de solicitud (mobile). Mirror reducido de TipoPreguntaEncuesta.
 */
export const TipoCampoFormularioSchema = z.enum([
  "Texto",
  "Número",
  "Opción única",
  "Opción múltiple",
]);

/** Tope de campos por botón y de opciones por campo. */
export const MAX_CAMPOS_FORMULARIO_BOTON = 20;
export const MAX_OPCIONES_CAMPO_FORMULARIO = 20;

/**
 * Definición de un campo del formulario dinámico de un botón (subdoc embedded).
 * El `_id` estable sobrevive a reorden y es referenciado por la respuesta en el ticket.
 */
export const CampoFormularioBotonSchema = z.object({
  _id: z.string().optional(),
  orden: z.number(),
  tipo: TipoCampoFormularioSchema,
  label: z.string(),
  requerido: z.boolean().optional(),
  /** Solo Opción única / múltiple. */
  opciones: z
    .array(z.string())
    .max(MAX_OPCIONES_CAMPO_FORMULARIO)
    .optional(),
});

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
  /**
   * Costo de la solicitud. `cobrable` se deriva de `costo > 0`. El valor cobrado
   * se congela en el ticket al crearlo (snapshot); este campo es solo el precio
   * vigente del catálogo (mismo patrón que plantilla→turno.costoTotal).
   */
  costo: z.number().nonnegative().optional(),
  /** Descripción breve mostrada en la pantalla de detalle mobile. */
  descripcion: z.string().optional(),
  /** Información extendida del servicio mostrada en el detalle mobile. */
  infoServicio: z.string().optional(),
  /**
   * Formulario dinámico que el usuario completa al pulsar (mobile). Las
   * respuestas se persisten en `ITicket.datosFormulario` con snapshot del label.
   */
  camposFormulario: z
    .array(CampoFormularioBotonSchema)
    .max(MAX_CAMPOS_FORMULARIO_BOTON)
    .optional(),
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
export type ETipoCampoFormulario = z.infer<typeof TipoCampoFormularioSchema>;
export type ICampoFormularioBoton = z.infer<typeof CampoFormularioBotonSchema>;
export type IConfigBotonTicket = z.infer<typeof ConfigBotonTicketSchema>;
export type IBotonTicket = z.infer<typeof BotonTicketSchema>;
export type ICreateBotonTicket = z.infer<typeof CreateBotonTicketSchema>;
export type IUpdateBotonTicket = z.infer<typeof UpdateBotonTicketSchema>;
