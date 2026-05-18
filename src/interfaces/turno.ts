import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { PermisoSchema } from "./permiso";
import { PlantillaTurnoSchema } from "./plantilla-turno";
import { UnidadFuncionalSchema } from "./unidad-funcional";
import { DatosPersonalesSchema } from "./usuario";
import { VisitanteSchema } from "./visitante";

/**
 * Ciclo de vida del turno.
 * `Pendiente confirmación` = pre-reserva temporal con TTL (5 min). Si el cliente no confirma,
 * MongoDB lo borra automáticamente vía `expireAt`.
 */
export const EstadoTurnoSchema = z.enum([
  "Pendiente confirmación",
  "Reservado",
  "Cancelado por usuario",
  "Cancelado por admin",
  "Completado",
  "No show",
]);
export type IEstadoTurno = z.infer<typeof EstadoTurnoSchema>;

/**
 * Aprobación del turno. Sigue el patrón de `IEventoVisita`:
 * si el creador tiene la acción `Turnos - Aprobar turnos`, queda Aprobado;
 * si no, queda Pendiente y otro permiso UF de la misma UF con la acción aprueba.
 */
export const EstadoAprobacionTurnoSchema = z.enum([
  "Pendiente",
  "Aprobado",
  "Rechazado",
]);
export type IEstadoAprobacionTurno = z.infer<typeof EstadoAprobacionTurnoSchema>;

/**
 * Recurrencia. Modelada pero **no se generan turnos hijos** en MVP — la lógica de
 * expansión (`idTurnoPadre` + creación periódica) queda para fase 2 junto con la
 * UI mobile y la aprobación recurrente por nivel Complejo.
 */
export const RecurrenciaTurnoSchema = z.object({
  /** 0..6 (0=domingo). */
  diasSemana: z.array(z.number().int().min(0).max(6)),
  /** Si ausente: indefinida. */
  fechaHasta: z.string().optional(),
});
export type IRecurrenciaTurno = z.infer<typeof RecurrenciaTurnoSchema>;

/**
 * Participante propietario del turno. Referencia un `IPermiso` nivel UF + snapshot
 * inmutable mínimo (nombre, foto) para sobrevivir a edits/deshabilitaciones.
 */
export const ParticipantePropietarioTurnoSchema = z.object({
  idPermiso: z.string(),
  snapshot: z.object({
    nombre: z.string().optional(),
    foto: z.string().optional(),
  }),
});
export type IParticipantePropietarioTurno = z.infer<
  typeof ParticipantePropietarioTurnoSchema
>;

/**
 * Participante invitado del turno. Referencia un `IVisitante` de la UF reservante +
 * snapshot de `DatosPersonales`.
 */
export const ParticipanteInvitadoTurnoSchema = z.object({
  idVisitante: z.string(),
  snapshot: z.object({
    datosPersonales: DatosPersonalesSchema.optional(),
  }),
});
export type IParticipanteInvitadoTurno = z.infer<
  typeof ParticipanteInvitadoTurnoSchema
>;

/**
 * Snapshot defensivo de la plantilla / modalidad al momento de reservar.
 * Permite que ediciones posteriores de la plantilla no rompan el render de turnos pasados.
 */
export const PlantillaTurnoSnapshotSchema = z.object({
  nombre: z.string().optional(),
  tipoActividadNombre: z.string().optional(),
  modalidadNombre: z.string().optional(),
  duracionMin: z.number().int().positive().optional(),
  bloqueoDiasPorNoShow: z.number().int().nonnegative().optional(),
  horasLimiteCancelacionGratis: z.number().nonnegative().optional(),
});
export type IPlantillaTurnoSnapshot = z.infer<typeof PlantillaTurnoSnapshotSchema>;

/**
 * Instancia de turno tomada por un propietario.
 *
 * Atomicidad de la reserva: índice único parcial en `acceso-datos`
 * `(idUnidadFuncionalRecurso, fechaInicio)` filtrado por estados que ocupan slot
 * (`Pendiente confirmación`, `Reservado`) y `estadoAprobacion != 'Rechazado'`.
 *
 * Pre-reserva temporal: al tocar un slot, se crea con `estado='Pendiente confirmación'`
 * y `expireAt = now + 5 min`. MongoDB TTL borra si no se confirma. El cliente confirma
 * vía `PUT /turnos/:id/confirmar`, transición a `estado='Reservado'` + `expireAt` removido.
 */
export const TurnoSchema = z.object({
  _id: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  fechaCreacion: z.string().optional(),
  /** UF del reservante. Cuenta a esta UF para los cupos diarios/semanales/mensuales. */
  idUnidadFuncional: z.string().optional(),
  /** Permiso UF del reservante (creador). */
  idPermiso: z.string().optional(),
  idPlantilla: z.string().optional(),
  /** Subdoc `_id` dentro de `IPlantillaTurno.modalidades`. */
  idModalidad: z.string().optional(),
  /** UF Común reservada (la cancha / espacio físico). */
  idUnidadFuncionalRecurso: z.string().optional(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
  estado: EstadoTurnoSchema.optional(),
  estadoAprobacion: EstadoAprobacionTurnoSchema.optional(),
  aprobadoPorIdPermiso: z.string().optional(),
  fechaAprobacion: z.string().optional(),
  motivoRechazo: z.string().optional(),
  // Recurrencia — relación padre/hijos (lógica de generación: fase 2)
  /** Si presente, este turno es una ocurrencia de la serie indicada. */
  idTurnoPadre: z.string().optional(),
  /** Solo en el turno padre. Si presente, el turno es una serie recurrente. */
  recurrencia: RecurrenciaTurnoSchema.optional(),
  estadoAprobacionRecurrente: EstadoAprobacionTurnoSchema.optional(),
  aprobadoRecurrentePorIdPermiso: z.string().optional(),
  fechaAprobacionRecurrente: z.string().optional(),
  motivoRechazoRecurrente: z.string().optional(),
  // Participantes
  participantesPropietarios: z
    .array(ParticipantePropietarioTurnoSchema)
    .optional(),
  participantesInvitados: z.array(ParticipanteInvitadoTurnoSchema).optional(),
  // Instructor
  idPermisoInstructor: z.string().optional(),
  instructorSnapshot: z
    .object({
      nombre: z.string().optional(),
      foto: z.string().optional(),
    })
    .optional(),
  // Costos (snapshot al confirmar — el cobro/expensas se enchufa en fase posterior)
  costoBase: z.number().nonnegative().optional(),
  costoLuz: z.number().nonnegative().optional(),
  costoInvitados: z.number().nonnegative().optional(),
  costoTotal: z.number().nonnegative().optional(),
  luzActivada: z.boolean().optional(),
  // Marcado operativo
  noShowMarcadoPorIdPermiso: z.string().optional(),
  fechaNoShow: z.string().optional(),
  canceladoPorIdPermiso: z.string().optional(),
  fechaCancelacion: z.string().optional(),
  motivoCancelacion: z.string().optional(),
  /** True si la cancelación cayó dentro de `horasLimiteCancelacionGratis` → cuenta como no-show. */
  cancelacionTardia: z.boolean().optional(),
  /**
   * TTL Mongo. Solo presente cuando `estado='Pendiente confirmación'`. Al confirmar
   * el documento, el service de acceso-api lo limpia para que el doc persista.
   */
  expireAt: z.string().optional(),
  /** Snapshot defensivo del catálogo al momento de reservar. */
  plantillaSnapshot: PlantillaTurnoSnapshotSchema.optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  unidadFuncional: UnidadFuncionalSchema.optional(),
  unidadFuncionalRecurso: UnidadFuncionalSchema.optional(),
  permiso: PermisoSchema.optional(),
  plantilla: PlantillaTurnoSchema.optional(),
  aprobadoPorPermiso: PermisoSchema.optional(),
  aprobadoRecurrentePorPermiso: PermisoSchema.optional(),
  permisoInstructor: PermisoSchema.optional(),
  visitantes: z.array(VisitanteSchema).optional(),
});

export const CreateTurnoSchema = TurnoSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
  unidadFuncional: true,
  unidadFuncionalRecurso: true,
  permiso: true,
  plantilla: true,
  aprobadoPorPermiso: true,
  aprobadoRecurrentePorPermiso: true,
  permisoInstructor: true,
  visitantes: true,
});

export const UpdateTurnoSchema = CreateTurnoSchema.partial();

export type ITurno = z.infer<typeof TurnoSchema>;
export type ICreateTurno = z.infer<typeof CreateTurnoSchema>;
export type IUpdateTurno = z.infer<typeof UpdateTurnoSchema>;
