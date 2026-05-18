import { z } from "zod";
import { TipoActividadSchema } from "./tipo-actividad";

/**
 * Ventana de disponibilidad. Soporta horarios cortados (lunes 8-12 + 15-20) usando
 * múltiples bloques con los mismos `diasSemana` o bloques separados por día.
 */
export const HorarioPlantillaTurnoSchema = z.object({
  /** Días aplicables al bloque. 0 = Domingo ... 6 = Sábado. */
  diasSemana: z.array(z.number().int().min(0).max(6)),
  /** "HH:mm" local, inclusive. */
  horaDesde: z.string(),
  /** "HH:mm" local, exclusive. */
  horaHasta: z.string(),
});

/**
 * Modalidad de uso del recurso. Una plantilla puede ofrecer varias
 * (ej.: pádel 2 = 60 min, pádel 4 = 90 min). Subdoc con `_id` propio
 * para que `ITurno` referencie la modalidad concreta usada.
 */
export const ModalidadTurnoSchema = z.object({
  _id: z.string().optional(),
  nombre: z.string(),
  duracionMin: z.number().int().positive(),
  /** Cantidad estándar de participantes de la modalidad. */
  cantidadParticipantes: z.number().int().positive(),
  /** Capacidad simultánea para actividades grupales (gimnasio, clase). Si ausente = 1 grupo/turno. */
  cupoPersonasMaxSimultaneas: z.number().int().positive().optional(),
  costo: z.number().nonnegative().optional(),
  costoLuz: z.number().nonnegative().optional(),
  requiereLuz: z.boolean().optional(),
  requiereInstructor: z.boolean().optional(),
  idPermisoInstructorDefault: z.string().optional(),
});

/**
 * Plantilla de turnos configurada por el admin del complejo.
 * Define qué tipo de actividad ofrece, sobre qué recursos, en qué horarios,
 * con qué modalidades y reglas (cupos, anticipación, cancelación).
 *
 * La aprobación NO se modela acá — sigue el patrón de `IEventoVisita`:
 * si el creador del turno tiene la acción `Turnos - Aprobar turnos`, queda Aprobado;
 * si no, queda Pendiente y otro permiso UF de la misma UF con la acción lo aprueba.
 */
export const PlantillaTurnoSchema = z.object({
  _id: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  fechaCreacion: z.string().optional(),
  habilitado: z.boolean().optional(),
  nombre: z.string().optional(),
  idTipoActividad: z.string().optional(),
  /** Subset de `tipoActividad.idsUnidadesFuncionales` donde aplica esta plantilla. */
  idsUnidadesFuncionales: z.array(z.string()).optional(),
  /** Ventanas de disponibilidad. Soporta horarios cortados. */
  horarios: z.array(HorarioPlantillaTurnoSchema).optional(),
  modalidades: z.array(ModalidadTurnoSchema).optional(),
  /** Si true, los turnos creados con esta plantilla pueden tener `recurrencia`. */
  permiteRecurrencia: z.boolean().optional(),
  /** Si true, al reservar se exigen datos de participantes (no anónimos). */
  requiereDatosParticipantes: z.boolean().optional(),
  permiteInvitados: z.boolean().optional(),
  maxInvitados: z.number().int().nonnegative().optional(),
  costoPorInvitado: z.number().nonnegative().optional(),
  /** Cupos por UF reservante. */
  cupoMaxPorDia: z.number().int().positive().optional(),
  cupoMaxPorSemana: z.number().int().positive().optional(),
  cupoMaxPorMes: z.number().int().positive().optional(),
  /** Antelación mínima en horas para reservar (no se puede sacar a menos de X horas). */
  horasMinAnticipacion: z.number().nonnegative().optional(),
  /** Antelación máxima en días para reservar (no se puede sacar a más de X días). */
  diasMaxAnticipacion: z.number().nonnegative().optional(),
  /** Horas previas a `fechaInicio` dentro de las cuales cancelar cuenta como no-show. */
  horasLimiteCancelacionGratis: z.number().nonnegative().optional(),
  /** Días que la UF queda bloqueada para esta plantilla tras un no-show. */
  bloqueoDiasPorNoShow: z.number().int().nonnegative().optional(),
  // Populate — los pesados (UF, populates anidados) van como `z.any()` para no inflar inferencia.
  tipoActividad: TipoActividadSchema.optional(),
  cliente: z.any().optional(),
  complejo: z.any().optional(),
  unidadesFuncionales: z.any().optional(),
});

export const CreatePlantillaTurnoSchema = PlantillaTurnoSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
  tipoActividad: true,
  unidadesFuncionales: true,
});

export const UpdatePlantillaTurnoSchema = CreatePlantillaTurnoSchema.partial();

export type IHorarioPlantillaTurno = z.infer<typeof HorarioPlantillaTurnoSchema>;
export type IModalidadTurno = z.infer<typeof ModalidadTurnoSchema>;
export type IPlantillaTurno = z.infer<typeof PlantillaTurnoSchema>;
export type ICreatePlantillaTurno = z.infer<typeof CreatePlantillaTurnoSchema>;
export type IUpdatePlantillaTurno = z.infer<typeof UpdatePlantillaTurnoSchema>;
