import { z } from "zod";

/**
 * Bloqueo de disponibilidad sobre uno o varios recursos (UF Común) en un rango horario.
 * Mantenimiento, feriado, cierre de temporada, etc.
 *
 * Política: `acceso-api` rechaza la creación si hay turnos activos
 * (`estado in {Pendiente confirmación, Reservado}`) que caigan dentro del rango
 * sobre los recursos afectados. El admin debe cancelar primero.
 */
export const BloqueoTurnosSchema = z.object({
  _id: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  fechaCreacion: z.string().optional(),
  /** Recursos afectados. Todas deben pertenecer al `idComplejo`. */
  idsUnidadesFuncionales: z.array(z.string()).optional(),
  fechaInicio: z.string().optional(),
  fechaFin: z.string().optional(),
  motivo: z.string().optional(),
  creadoPorIdPermiso: z.string().optional(),
  // Populate — pesados van como `z.any()` para no inflar inferencia.
  cliente: z.any().optional(),
  complejo: z.any().optional(),
  unidadesFuncionales: z.any().optional(),
  creadoPorPermiso: z.any().optional(),
});

export const CreateBloqueoTurnosSchema = BloqueoTurnosSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
  unidadesFuncionales: true,
  creadoPorPermiso: true,
});

export const UpdateBloqueoTurnosSchema = CreateBloqueoTurnosSchema.partial();

export type IBloqueoTurnos = z.infer<typeof BloqueoTurnosSchema>;
export type ICreateBloqueoTurnos = z.infer<typeof CreateBloqueoTurnosSchema>;
export type IUpdateBloqueoTurnos = z.infer<typeof UpdateBloqueoTurnosSchema>;
