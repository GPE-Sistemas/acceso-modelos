import { z } from "zod";
import { EncuestaSchema } from "./encuesta";
import { PermisoSchema } from "./permiso";

/**
 * Respuesta a una pregunta — los campos opcionales se pueblan según el tipo de
 * la pregunta referenciada. Validación cruzada se hace en acceso-api al crear
 * la respuesta (no en Zod porque depende de la encuesta).
 */
export const RespuestaPreguntaEncuestaSchema = z.object({
  idPregunta: z.string(),
  // Opción única
  idOpcion: z.string().optional(),
  // Opción múltiple
  idsOpciones: z.array(z.string()).optional(),
  // Escala
  valorEscala: z.number().optional(),
  // Texto libre
  texto: z.string().optional(),
});

export const RespuestaEncuestaSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),

  idEncuesta: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  /** Siempre persistido. Si encuesta.anonima === true, render UI lo oculta — DB lo retiene */
  idUnidadFuncional: z.string().optional(),
  /** Siempre persistido. Idem anonimato render-only */
  idPermiso: z.string().optional(),

  respuestas: z.array(RespuestaPreguntaEncuestaSchema).optional(),

  // Populate
  encuesta: EncuestaSchema.optional(),
  permiso: PermisoSchema.optional(),
});

export const CreateRespuestaEncuestaSchema = RespuestaEncuestaSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  encuesta: true,
  permiso: true,
});

export const UpdateRespuestaEncuestaSchema = CreateRespuestaEncuestaSchema.partial();

export type IRespuestaPreguntaEncuesta = z.infer<typeof RespuestaPreguntaEncuestaSchema>;
export type IRespuestaEncuesta = z.infer<typeof RespuestaEncuestaSchema>;
export type ICreateRespuestaEncuesta = z.infer<typeof CreateRespuestaEncuestaSchema>;
export type IUpdateRespuestaEncuesta = z.infer<typeof UpdateRespuestaEncuestaSchema>;
