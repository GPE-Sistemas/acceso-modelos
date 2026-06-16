import { z } from "zod";

/**
 * Punto de la plantilla de ronda: referencia a un `IPuntoControl` con su orden
 * dentro del recorrido y una ventana de tolerancia opcional para marcarlo.
 * Subdoc con `_id` propio.
 */
export const PuntoPlantillaRondaSchema = z.object({
  _id: z.string().optional(),
  idPuntoControl: z.string(),
  /** Posición en el recorrido (1..N). Solo relevante si `ordenEstricto`. */
  orden: z.number().int().positive(),
  /**
   * Minutos esperados desde el inicio de la ronda para alcanzar este punto.
   * Marcar fuera de esta ventana genera una marca con excepción (no bloquea).
   * Opcional — si ausente, no se evalúa tolerancia por punto.
   */
  ventanaMinutos: z.number().int().positive().optional(),
});
export type IPuntoPlantillaRonda = z.infer<typeof PuntoPlantillaRondaSchema>;

/**
 * Recurrencia de la plantilla: define cuándo se generan instancias `IRonda`
 * programadas. Un job (BullMQ, como encuestas) expande esto a una ronda por
 * cada (día válido × hora de inicio).
 *
 * `horariosInicio` son las horas de arranque dentro del día (ej. una ronda cada
 * 2h entre 22:00 y 06:00 = `["22:00","00:00","02:00","04:00","06:00"]`). Modelo
 * explícito en vez de intervalo: simple de mostrar y editar en la web.
 */
export const RecurrenciaRondaSchema = z.object({
  /** 0=Domingo .. 6=Sábado. */
  diasSemana: z.array(z.number().int().min(0).max(6)),
  /** Horas de arranque "HH:mm" local. Una ronda programada por cada una. */
  horariosInicio: z.array(z.string()),
  /** Si ausente: indefinida. */
  fechaHasta: z.string().optional(),
});
export type IRecurrenciaRonda = z.infer<typeof RecurrenciaRondaSchema>;

/**
 * Plantilla de ronda configurada por el admin/supervisor del complejo. Define el
 * recorrido (puntos ordenados), las reglas (orden estricto, duración estimada,
 * ventana de inicio) y la programación (recurrencia). Patrón plantilla→instancia
 * de Turnos: la plantilla NO es una ronda; el scheduler genera `IRonda` desde ella.
 *
 * Asignación: `idPermisoAsignadoDefault` fija un guardia; si ausente, la ronda
 * queda "libre" y cualquier guardia habilitado la toma al iniciarla.
 */
export const PlantillaRondaSchema = z.object({
  _id: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  fechaCreacion: z.string().optional(),
  habilitado: z.boolean().optional(),
  nombre: z.string(),
  descripcion: z.string().optional(),
  /** Recorrido. Al menos 1 punto. */
  puntos: z.array(PuntoPlantillaRondaSchema),
  /** Si true, los puntos deben marcarse en el `orden` indicado (fuera de orden = excepción). */
  ordenEstricto: z.boolean().optional(),
  /** Duración estimada del recorrido completo (min). Informativa + base de la ventana. */
  duracionEstimadaMin: z.number().int().positive().optional(),
  /**
   * Minutos de tolerancia para iniciar la ronda respecto de `fechaProgramada`.
   * Pasado este margen sin iniciarse, el job de vencimiento marca `NoRealizada`.
   */
  toleranciaInicioMin: z.number().int().positive().optional(),
  /** Programación. Si ausente, la plantilla no genera rondas automáticas (alta manual futura). */
  recurrencia: RecurrenciaRondaSchema.optional(),
  /** Guardia fijo asignado. Si ausente, ronda libre (cualquier guardia habilitado). */
  idPermisoAsignadoDefault: z.string().optional(),
  // Populate
  cliente: z.any().optional(),
  complejo: z.any().optional(),
  /** Puntos de control populados (resueltos desde `puntos[].idPuntoControl`). */
  puntosControl: z.any().optional(),
  permisoAsignadoDefault: z.any().optional(),
});

export const CreatePlantillaRondaSchema = PlantillaRondaSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
  puntosControl: true,
  permisoAsignadoDefault: true,
});

export const UpdatePlantillaRondaSchema = CreatePlantillaRondaSchema.partial();

export type IPlantillaRonda = z.infer<typeof PlantillaRondaSchema>;
export type ICreatePlantillaRonda = z.infer<typeof CreatePlantillaRondaSchema>;
export type IUpdatePlantillaRonda = z.infer<typeof UpdatePlantillaRondaSchema>;
