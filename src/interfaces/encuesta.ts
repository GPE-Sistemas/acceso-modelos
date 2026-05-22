import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { GrupoUnidadFuncionalSchema } from "./grupo-unidad-funcional";
import { PermisoSchema } from "./permiso";

// ─── Enums display-ready (texto humano, no códigos) ──────────────────────────

export const EstadoEncuestaSchema = z.enum([
  "Borrador",
  "Abierta",
  "Cerrada",
]);

export const AlcanceEncuestaSchema = z.enum([
  "Todas las UF",
  "Grupo",
]);

export const SujetoRespuestaEncuestaSchema = z.enum([
  "Por permiso",
  "Por UF",
]);

export const TipoPreguntaEncuestaSchema = z.enum([
  "Opción única",
  "Opción múltiple",
  "Escala",
  "Texto libre",
]);

// ─── Límites duros ───────────────────────────────────────────────────────────

export const MAX_PREGUNTAS_ENCUESTA = 50;
export const MAX_OPCIONES_PREGUNTA = 20;
export const MAX_TEXTO_LIBRE_CHARS = 2000;

// ─── Opciones (subdoc embedded) ──────────────────────────────────────────────

export const OpcionPreguntaEncuestaSchema = z.object({
  /** id estable del subdoc — sobrevive a reorden, referenciado por IRespuestaEncuesta */
  _id: z.string().optional(),
  texto: z.string(),
});

// ─── Pregunta (subdoc embedded) ──────────────────────────────────────────────

export const PreguntaEncuestaSchema = z.object({
  _id: z.string().optional(),
  orden: z.number(),
  tipo: TipoPreguntaEncuestaSchema,
  enunciado: z.string(),
  obligatoria: z.boolean(),
  // Opción única / múltiple
  opciones: z.array(OpcionPreguntaEncuestaSchema).max(MAX_OPCIONES_PREGUNTA).optional(),
  // Opción múltiple
  minSelecciones: z.number().int().min(0).optional(),
  maxSelecciones: z.number().int().min(1).optional(),
  // Escala
  escalaMin: z.number().int().optional(),
  escalaMax: z.number().int().optional(),
  escalaEtiquetaMin: z.string().optional(),
  escalaEtiquetaMax: z.string().optional(),
  // Texto libre
  maxLength: z.number().int().min(1).max(MAX_TEXTO_LIBRE_CHARS).optional(),
});

// ─── Encuesta ────────────────────────────────────────────────────────────────

export const EncuestaSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),

  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  idPermisoCarga: z.string().optional(),

  titulo: z.string().optional(),
  descripcion: z.string().optional(),

  estado: EstadoEncuestaSchema.optional(),
  /** ISO 8601 — futura = no visible UF (filtrada en scope) */
  fechaInicio: z.string().optional(),
  /** ISO 8601 — scheduler auto-cierra al cruzar */
  fechaCierre: z.string().optional(),

  // Targeting
  alcance: AlcanceEncuestaSchema.optional(),
  idGrupoUnidadFuncional: z.string().optional(),

  // Modo respuesta
  sujetoRespuesta: SujetoRespuestaEncuestaSchema.optional(),
  /** Render-only — DB siempre persiste idPermiso+idUF en respuesta */
  anonima: z.boolean().optional(),
  permiteModificarRespuesta: z.boolean().optional(),
  resultadosVisiblesUF: z.boolean().optional(),
  /** UF debe responder antes de seguir usando la app mobile */
  obligatoria: z.boolean().optional(),
  /** Horas antes de fechaCierre para disparar recordatorio push (null/ausente = sin recordatorio) */
  recordatorioAntesDeCierreHs: z.number().int().min(1).optional(),

  preguntas: z.array(PreguntaEncuestaSchema).max(MAX_PREGUNTAS_ENCUESTA).optional(),

  /** Counter denormalizado mantenido por acceso-datos al crear/borrar respuestas */
  totalRespuestas: z.number().int().min(0).optional(),
  /** Soft hide post-cerrada (hard delete solo en Borrador) */
  habilitado: z.boolean().optional(),

  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  grupoUnidadFuncional: GrupoUnidadFuncionalSchema.optional(),
  permisoCarga: PermisoSchema.optional(),
});

export const CreateEncuestaSchema = EncuestaSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  totalRespuestas: true,
  cliente: true,
  complejo: true,
  grupoUnidadFuncional: true,
  permisoCarga: true,
});

export const UpdateEncuestaSchema = CreateEncuestaSchema.partial();

export type EEstadoEncuesta = z.infer<typeof EstadoEncuestaSchema>;
export type EAlcanceEncuesta = z.infer<typeof AlcanceEncuestaSchema>;
export type ESujetoRespuestaEncuesta = z.infer<typeof SujetoRespuestaEncuestaSchema>;
export type ETipoPreguntaEncuesta = z.infer<typeof TipoPreguntaEncuestaSchema>;
export type IOpcionPreguntaEncuesta = z.infer<typeof OpcionPreguntaEncuestaSchema>;
export type IPreguntaEncuesta = z.infer<typeof PreguntaEncuestaSchema>;
export type IEncuesta = z.infer<typeof EncuestaSchema>;
export type ICreateEncuesta = z.infer<typeof CreateEncuestaSchema>;
export type IUpdateEncuesta = z.infer<typeof UpdateEncuestaSchema>;
