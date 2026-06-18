import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { CategoriaTicketSchema } from "./boton-ticket";
import { CategoriaIngresoEgresoSchema } from "./ingreso-egreso";

/**
 * Protocolo configurable por complejo: guía operativa que el operador (guardia /
 * administración) consulta ante un evento/tarea. Combina, todos opcionales:
 *  - texto introductorio (`descripcion`),
 *  - PDF adjunto (`archivo`, bucket privado),
 *  - checklist de pasos ordenados (`pasos`).
 *
 * Catálogo de N protocolos por complejo (NO singleton config-by-complejo). La
 * asociación a qué evento aplica es polimórfica (`aplicaA`). Pueden coexistir
 * varios protocolos para un mismo tipo.
 */

/** Tope de pasos del checklist por protocolo. */
export const MAX_PASOS_PROTOCOLO = 50;

/**
 * Paso del checklist (subdoc embedded). El `_id` estable sobrevive a reorden y
 * es referenciado por `IPasoEjecutado` en la ejecución.
 */
export const PasoProtocoloSchema = z.object({
  _id: z.string().optional(),
  orden: z.number(),
  titulo: z.string(),
  descripcion: z.string().optional(),
  /** El operador debe completarlo. Si el protocolo tiene `bloqueaCierre`, los obligatorios incompletos bloquean el cierre del evento. */
  obligatorio: z.boolean().optional(),
  /** Pide un comentario al marcar el paso (solo ejecución auditable). */
  requiereComentario: z.boolean().optional(),
  /** Pide una foto al marcar el paso (solo ejecución auditable). */
  requiereFoto: z.boolean().optional(),
});

/**
 * Asociación polimórfica protocolo → evento/tarea (un solo target por protocolo).
 * Discriminada por `tipo`:
 *  - `Generico`        → consulta manual suelta, no atado a un evento concreto.
 *  - `BotonTicket`     → un botón de ticket específico (`idBoton`).
 *  - `CategoriaTicket` → todos los tickets de una categoría (Emergencia/Solicitud/Reclamo).
 *  - `IngresoEgreso`   → registro de ingreso/egreso de una categoría (Visita/Propietario/...).
 */
export const TipoAplicaProtocoloSchema = z.enum([
  "Generico",
  "BotonTicket",
  "CategoriaTicket",
  "IngresoEgreso",
]);

export const AplicaGenericoSchema = z.object({
  tipo: z.literal("Generico"),
});

export const AplicaBotonTicketSchema = z.object({
  tipo: z.literal("BotonTicket"),
  idBoton: z.string(),
});

export const AplicaCategoriaTicketSchema = z.object({
  tipo: z.literal("CategoriaTicket"),
  categoria: CategoriaTicketSchema,
});

export const AplicaIngresoEgresoSchema = z.object({
  tipo: z.literal("IngresoEgreso"),
  categoria: CategoriaIngresoEgresoSchema,
});

export const AplicaAProtocoloSchema = z.discriminatedUnion("tipo", [
  AplicaGenericoSchema,
  AplicaBotonTicketSchema,
  AplicaCategoriaTicketSchema,
  AplicaIngresoEgresoSchema,
]);

export const ProtocoloSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),

  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  idPermisoCarga: z.string().optional(),

  nombre: z.string().optional(),
  /** Texto introductorio / explicativo (textarea plano, sin rich-text). */
  descripcion: z.string().optional(),

  /** Checklist de pasos ordenados (combinable con texto/PDF). */
  pasos: z.array(PasoProtocoloSchema).max(MAX_PASOS_PROTOCOLO).optional(),

  /** objectName GCS del PDF adjunto (bucket privado, carpeta `protocolos/<idComplejo>`). 1 por protocolo. */
  archivo: z.string().optional(),
  archivoMeta: z
    .object({
      nombre: z.string(),
      contentType: z.string(),
      size: z.number(),
    })
    .optional(),

  /**
   * Si true, cada vez que se ejecuta el protocolo se materializa una
   * `IEjecucionProtocolo` (traza de auditoría: pasos marcados, quién, cuándo).
   * Si false/ausente, el protocolo es solo guía visual (no se persiste nada).
   */
  auditable: z.boolean().optional(),
  /**
   * Si true, los pasos `obligatorio` incompletos bloquean el cierre/resolución
   * del evento asociado (solo aplica con ejecución auditable). Default off.
   */
  bloqueaCierre: z.boolean().optional(),

  /** Asociación al evento/tarea (un solo target). */
  aplicaA: AplicaAProtocoloSchema.optional(),

  /** Estado activo/inactivo. Solo los activos se resuelven en `/protocolos/aplicables`. */
  activo: z.boolean().optional(),

  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
});

export const CreateProtocoloSchema = ProtocoloSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  cliente: true,
  complejo: true,
});

export const UpdateProtocoloSchema = CreateProtocoloSchema.partial();

export type ETipoAplicaProtocolo = z.infer<typeof TipoAplicaProtocoloSchema>;
export type IAplicaAProtocolo = z.infer<typeof AplicaAProtocoloSchema>;
export type IPasoProtocolo = z.infer<typeof PasoProtocoloSchema>;
export type IProtocolo = z.infer<typeof ProtocoloSchema>;
export type ICreateProtocolo = z.infer<typeof CreateProtocoloSchema>;
export type IUpdateProtocolo = z.infer<typeof UpdateProtocoloSchema>;
