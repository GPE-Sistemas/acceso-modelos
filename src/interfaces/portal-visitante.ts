import { z } from "zod";
import {
  RecurrenciaEventoVisitaSchema,
  TipoEventoVisitaSchema,
} from "./evento-visita";
import { RecorridoVisitanteSchema } from "./recorrido-visitante";

/**
 * Contratos del portal del visitante recurrente con credencial (D63, doc 50).
 * Rutas `/portal-visitante/*` de acceso-api.
 */

/**
 * `POST /portal-visitante/reclamar` — el visitante, ya logueado (Google/Apple),
 * asocia su cuenta al permiso `Visitante` usando el token del link de invitación
 * de una visita recurrente. El DNI tiene que coincidir con el del visitante de
 * ese link: el link viaja por WhatsApp y podría reenviarse.
 */
export const ReclamarPermisoVisitanteSchema = z.object({
  token: z.string().min(1),
  dni: z.string().min(1),
});

/** Una visita recurrente vigente del visitante, tal como la ve él (§9). */
export const VisitaDeVisitanteSchema = z.object({
  idEventoVisita: z.string(),
  /** El `IVisitante` de esa UF que apunta al permiso. */
  idVisitante: z.string(),
  idUnidadFuncional: z.string().optional(),
  /** Número de la UF de destino (decisión 11). */
  numeroUnidadFuncional: z.number().optional(),
  nombreUnidadFuncional: z.string().optional(),
  /** Nombre de quien creó la visita (decisión 11). */
  invitadoPor: z.string().optional(),
  tipo: TipoEventoVisitaSchema.optional(),
  recurrencia: RecurrenciaEventoVisitaSchema.optional(),
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  /** Si la franja de la recurrencia contiene el momento de la consulta. */
  enHorario: z.boolean(),
  /** Si está dentro del destino marcado vigente. */
  marcada: z.boolean(),
});

/**
 * `PUT /portal-visitante/destino`. Reemplaza la lista completa: para sumar o
 * quitar un lote la app reenvía todos los marcados (D65 decisión 9). `hasta`
 * ausente = el fin de franja de hoy más tardío entre las visitas marcadas (o
 * fin del día si alguna no tiene horario).
 */
export const MarcarDestinoVisitanteSchema = z.object({
  idsEventosVisita: z.array(z.string()).min(1),
  hasta: z.string().optional(),
});

/**
 * `POST /portal-visitante/recorrido/paradas` — "Voy a este lote" (D65, doc 52).
 * Cierra la parada abierta (push de salida a esa UF) y abre una en este evento
 * (push de llegada). Mismo lote que la parada abierta = no-op.
 */
export const MarcarParadaRecorridoSchema = z.object({
  idEventoVisita: z.string().min(1),
});

/** Un lote que el visitante puede elegir estando adentro en modo recorrido. */
export const LoteRecorridoSchema = VisitaDeVisitanteSchema.extend({
  /** Estaba vinculado al ingreso. `false` = "Otros lotes en horario". */
  candidato: z.boolean(),
});

/**
 * `GET /portal-visitante/recorrido`. `recorrido` = `null` cuando no está
 * adentro en modo recorrido (afuera, o adentro con una sola UF): la app
 * muestra entonces "Mis lugares" como antes.
 */
export const RecorridoDeVisitanteSchema = z.object({
  recorrido: RecorridoVisitanteSchema.nullable(),
  /** Candidatos primero; vacío si `recorrido` es `null`. */
  lotes: z.array(LoteRecorridoSchema),
});

/**
 * Lugar en los terminales faciales del complejo (§6): `capacidad` es la menor
 * entre los terminales faciales habilitados; `ocupadas`, las credenciales
 * faciales no revocadas del complejo, contadas en el cloud.
 */
export const LugarFacialSchema = z.object({
  capacidad: z.number().int().nonnegative(),
  ocupadas: z.number().int().nonnegative(),
  disponibles: z.number().int(),
});

/** `POST /portal-visitante/credencial` — el propio visitante, desde su app. */
export const CargarMiCredencialVisitanteSchema = z.object({
  /** objectName en el bucket privado (`credenciales-faciales/...`). */
  fotoCredencial: z.string().min(1),
});

/**
 * `POST /portal-visitante/credencial-por-guardia` — el guardia, en el momento
 * de la visita (§5.2). Crea el permiso sin cuenta si la persona no lo tiene.
 */
export const CargarCredencialVisitantePorGuardiaSchema = z.object({
  idEventoVisita: z.string().min(1),
  idVisitante: z.string().min(1),
  fotoCredencial: z.string().min(1),
});

export type IReclamarPermisoVisitante = z.infer<
  typeof ReclamarPermisoVisitanteSchema
>;
export type IVisitaDeVisitante = z.infer<typeof VisitaDeVisitanteSchema>;
export type IMarcarDestinoVisitante = z.infer<
  typeof MarcarDestinoVisitanteSchema
>;
export type IMarcarParadaRecorrido = z.infer<
  typeof MarcarParadaRecorridoSchema
>;
export type ILoteRecorrido = z.infer<typeof LoteRecorridoSchema>;
export type IRecorridoDeVisitante = z.infer<typeof RecorridoDeVisitanteSchema>;
export type ILugarFacial = z.infer<typeof LugarFacialSchema>;
export type ICargarMiCredencialVisitante = z.infer<
  typeof CargarMiCredencialVisitanteSchema
>;
export type ICargarCredencialVisitantePorGuardia = z.infer<
  typeof CargarCredencialVisitantePorGuardiaSchema
>;
