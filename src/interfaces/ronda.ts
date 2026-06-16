import { z } from "zod";
import { GeoJSONPointSchema } from "../auxiliares/geojson";
import { TipoPuntoControlSchema } from "./punto-control";

/**
 * Ciclo de vida de una ronda (instancia generada desde una plantilla).
 * - `Programada`: creada por el scheduler, esperando que un guardia la inicie.
 * - `EnCurso`: iniciada, el guardia está marcando puntos.
 * - `Completada`: cerrada con todos los puntos marcados.
 * - `Incompleta`: cerrada (manual o por fin de ventana) con puntos sin marcar.
 * - `NoRealizada`: venció la ventana de inicio sin que nadie la arranque.
 * - `Cancelada`: anulada por un supervisor.
 */
export const EstadoRondaSchema = z.enum([
  "Programada",
  "EnCurso",
  "Completada",
  "Incompleta",
  "NoRealizada",
  "Cancelada",
]);
export type IEstadoRonda = z.infer<typeof EstadoRondaSchema>;

/**
 * Snapshot defensivo de un punto esperado en la ronda, congelado al generar la
 * instancia. Sobrevive a ediciones/archivado del catálogo de puntos.
 */
export const PuntoEsperadoRondaSchema = z.object({
  idPuntoControl: z.string(),
  orden: z.number().int().positive(),
  ventanaMinutos: z.number().int().positive().optional(),
  /** Snapshot del nombre del punto para render histórico. */
  nombre: z.string().optional(),
  tipo: TipoPuntoControlSchema.optional(),
});
export type IPuntoEsperadoRonda = z.infer<typeof PuntoEsperadoRondaSchema>;

/**
 * Marca de un punto durante la ejecución. Append-only. Una marca fuera de orden
 * (si `ordenEstricto`) o fuera de la geocerca queda con `valida=false` +
 * `motivoExcepcion` — no bloquea la ronda, deja flag para el reporte.
 */
export const MarcaRondaSchema = z.object({
  _id: z.string().optional(),
  idPuntoControl: z.string(),
  fecha: z.string(),
  metodo: TipoPuntoControlSchema,
  /** Geolocalización del teléfono al marcar. */
  geo: GeoJSONPointSchema.optional(),
  /** Precisión reportada por el GPS (m). */
  accuracy: z.number().nonnegative().optional(),
  /** True si pasó las validaciones (geocerca + orden + ventana). */
  valida: z.boolean(),
  /** Motivo si `valida=false` (ej. "Fuera de la geocerca", "Fuera de orden"). */
  motivoExcepcion: z.string().optional(),
});
export type IMarcaRonda = z.infer<typeof MarcaRondaSchema>;

/**
 * Novedad reportada durante la ronda (incidencia): foto + nota + geo. Conecta
 * con el libro de novedades / tickets a futuro. Append-only.
 */
export const NovedadRondaSchema = z.object({
  _id: z.string().optional(),
  texto: z.string(),
  /** ObjectNames GCS (bucket público, carpeta `rondas`). */
  fotos: z.array(z.string()).optional(),
  geo: GeoJSONPointSchema.optional(),
  fecha: z.string(),
  /** Permiso del guardia que la reportó. */
  idPermiso: z.string().optional(),
  /** Punto asociado (opcional — la novedad puede no estar en un checkpoint). */
  idPuntoControl: z.string().optional(),
});
export type INovedadRonda = z.infer<typeof NovedadRondaSchema>;

/**
 * Instancia de ronda. Generada por el scheduler desde una `IPlantillaRonda`
 * (`origen='Programada'`) o creada manualmente (futuro). El guardia la inicia,
 * marca los puntos esperados y la cierra.
 *
 * Asignación: `idPermisoAsignado` (de la plantilla) la reserva a un guardia; si
 * null, cualquier guardia con la acción de realizar rondas la toma — al iniciar
 * se setea `idPermisoEjecutor`.
 */
export const RondaSchema = z.object({
  _id: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  fechaCreacion: z.string().optional(),
  idPlantilla: z.string().optional(),
  /** Snapshot mínimo de la plantilla al generar. */
  plantillaNombre: z.string().optional(),
  ordenEstricto: z.boolean().optional(),
  /** Puntos esperados, snapshot inmutable de la plantilla al generar. */
  puntosEsperados: z.array(PuntoEsperadoRondaSchema).optional(),
  /** Inicio esperado de la ronda. */
  fechaProgramada: z.string().optional(),
  /** Fin de la ventana de inicio; pasado esto sin iniciar → `NoRealizada`. */
  fechaLimiteInicio: z.string().optional(),
  estado: EstadoRondaSchema.optional(),
  /** Guardia asignado de antemano (de la plantilla). Null = libre. */
  idPermisoAsignado: z.string().optional(),
  /** Guardia que efectivamente la ejecutó (se setea al iniciar). */
  idPermisoEjecutor: z.string().optional(),
  fechaInicioReal: z.string().optional(),
  fechaFinReal: z.string().optional(),
  marcas: z.array(MarcaRondaSchema).optional(),
  novedades: z.array(NovedadRondaSchema).optional(),
  /** Cancelación por supervisor. */
  canceladoPorIdPermiso: z.string().optional(),
  fechaCancelacion: z.string().optional(),
  motivoCancelacion: z.string().optional(),
  // Populate
  cliente: z.any().optional(),
  complejo: z.any().optional(),
  plantilla: z.any().optional(),
  permisoAsignado: z.any().optional(),
  permisoEjecutor: z.any().optional(),
  puntosControl: z.any().optional(),
});

export const CreateRondaSchema = RondaSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
  plantilla: true,
  permisoAsignado: true,
  permisoEjecutor: true,
  puntosControl: true,
});

export const UpdateRondaSchema = CreateRondaSchema.partial();

export type IRonda = z.infer<typeof RondaSchema>;
export type ICreateRonda = z.infer<typeof CreateRondaSchema>;
export type IUpdateRonda = z.infer<typeof UpdateRondaSchema>;
