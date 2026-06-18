import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { PermisoSchema } from "./permiso";
import { ProtocoloSchema } from "./protocolo";

/**
 * Ejecución de un protocolo ante un evento concreto. Solo se materializa cuando
 * el protocolo es `auditable`. Es la traza de auditoría: qué pasos marcó el
 * operador, cuándo y quién.
 *
 * El protocolo se congela en `protocoloSnapshot` al iniciar → la edición
 * in-place del catálogo no afecta ejecuciones en curso (resuelve versionado sin
 * versionar, mismo patrón que `ITicket.botonSnapshot`).
 */

export const EstadoEjecucionProtocoloSchema = z.enum([
  "EnCurso",
  "Completada",
  "Abandonada",
]);

/**
 * Origen del evento que dispara la ejecución (polimórfico, discriminado por `tipo`).
 */
export const OrigenEjecucionProtocoloSchema = z.discriminatedUnion("tipo", [
  z.object({ tipo: z.literal("Ticket"), idTicket: z.string() }),
  z.object({ tipo: z.literal("IngresoEgreso"), idIngresoEgreso: z.string() }),
  z.object({ tipo: z.literal("Generico") }),
]);

/**
 * Snapshot inmutable del protocolo congelado al iniciar la ejecución. Subset de
 * `IProtocolo` con lo necesario para render + validación de pasos.
 */
export const ProtocoloSnapshotSchema = ProtocoloSchema.pick({
  nombre: true,
  descripcion: true,
  pasos: true,
  archivo: true,
  archivoMeta: true,
  bloqueaCierre: true,
});

/** Estado de un paso dentro de la ejecución. */
export const PasoEjecutadoSchema = z.object({
  /** Referencia al `_id` del paso en el snapshot. */
  idPaso: z.string(),
  /** Snapshot del título (sobrevive a cambios del catálogo). */
  titulo: z.string(),
  completado: z.boolean().optional(),
  fechaCompletado: z.string().optional(),
  /** Permiso del operador que marcó el paso. */
  idPermiso: z.string().optional(),
  comentario: z.string().optional(),
  /** objectName GCS de la foto del paso (signed-url genérico, bucket privado). */
  foto: z.string().optional(),
});

export const EjecucionProtocoloSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),

  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),

  idProtocolo: z.string().optional(),
  protocoloSnapshot: ProtocoloSnapshotSchema.optional(),

  /** Evento que disparó la ejecución. */
  origen: OrigenEjecucionProtocoloSchema.optional(),

  /** Permiso del operador que ejecuta. */
  idPermiso: z.string().optional(),

  estado: EstadoEjecucionProtocoloSchema.optional(),
  pasos: z.array(PasoEjecutadoSchema).optional(),

  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),

  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  protocolo: ProtocoloSchema.optional(),
  permiso: PermisoSchema.optional(),
});

export const CreateEjecucionProtocoloSchema = EjecucionProtocoloSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  cliente: true,
  complejo: true,
  protocolo: true,
  permiso: true,
});

export const UpdateEjecucionProtocoloSchema =
  CreateEjecucionProtocoloSchema.partial();

export type EEstadoEjecucionProtocolo = z.infer<
  typeof EstadoEjecucionProtocoloSchema
>;
export type IOrigenEjecucionProtocolo = z.infer<
  typeof OrigenEjecucionProtocoloSchema
>;
export type IProtocoloSnapshot = z.infer<typeof ProtocoloSnapshotSchema>;
export type IPasoEjecutado = z.infer<typeof PasoEjecutadoSchema>;
export type IEjecucionProtocolo = z.infer<typeof EjecucionProtocoloSchema>;
export type ICreateEjecucionProtocolo = z.infer<
  typeof CreateEjecucionProtocoloSchema
>;
export type IUpdateEjecucionProtocolo = z.infer<
  typeof UpdateEjecucionProtocoloSchema
>;
