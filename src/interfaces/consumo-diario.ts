import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { DestinoAsignacionSchema, ServicioMedidoSchema } from "./asignacion-dispositivo";

/**
 * IConsumoDiario — consumo de un día por asignación de medidor (D66 Etapa 4,
 * acceso-doc-general doc 53 §4.3: "rollup diario por asignación, sin TTL").
 *
 * Lo calcula el edge desde el odómetro CRUDO de `medicion_dispositivo` y la
 * asignación vigente (no desde el `valorServicio` guardado): si se corrige la
 * lectura inicial o el factor, el edge recalcula todos los días de esa
 * asignación. Viaja al cloud por outbox (`consumo-diario`, `_id`
 * determinístico por asignación y día) y vive SIN TTL: es lo que alimenta los
 * gráficos de más de 90 días. Lo que se factura es `IConsumoPeriodo` (Etapa 5).
 *
 * Día = día calendario en la zona del complejo. El consumo del día es la
 * lectura del cierre (última del día) menos la del cierre del día anterior con
 * dato; el primer día de la asignación arranca de su `lecturaInicial`. Si un
 * equipo no reporta un día, ese consumo cae en el próximo día con lectura
 * (`diasSinDato` lo dice).
 */

/**
 * - `Completo`: dos lecturas válidas, consumo calculado.
 * - `Sospechoso`: calculado, pero alguna lectura tiene fecha no confiable.
 * - `Discontinuidad`: la lectura bajó (reset del equipo, wrap del contador,
 *   reemplazo sin retirar): no se inventa un consumo, queda null.
 * - `SinBaseline`: la asignación no tiene baseline usable (sin odómetro
 *   inicial o `Incoherente`): no se puede llevar el odómetro al dial.
 */
export const CalidadConsumoDiarioSchema = z.enum([
  "Completo",
  "Sospechoso",
  "Discontinuidad",
  "SinBaseline",
]);

export const ConsumoDiarioSchema = z.object({
  /** sha(idAsignacion + fecha), 24 hex. */
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string(),
  idEdgeAppliance: z.string().optional(),
  idAsignacion: z.string(),
  idDispositivo: z.string(),
  destino: DestinoAsignacionSchema,
  /** Destino `UnidadFuncional`. El medidor general (destino `Complejo`) no lo lleva. */
  idUnidadFuncional: z.string().optional(),
  servicio: ServicioMedidoSchema,
  /** Día en la zona del complejo, `YYYY-MM-DD`. */
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** Lectura del dial al cierre del día anterior con dato (o la inicial de la asignación). */
  lecturaInicial: z.number().nullable(),
  fechaLecturaInicial: z.string().optional(),
  /** Lectura del dial al cierre del día. */
  lecturaFinal: z.number().nullable(),
  fechaLecturaFinal: z.string().optional(),
  /** lecturaFinal − lecturaInicial, en la unidad del servicio. null = no se calcula. */
  consumo: z.number().nullable(),
  /** `m3` / `kWh`. */
  unidad: z.string().optional(),
  calidad: CalidadConsumoDiarioSchema,
  /** Lecturas del odómetro del día. */
  lecturas: z.number().int().nonnegative(),
  /** Días sin lectura que este consumo absorbe (equipo que no reportó). */
  diasSinDato: z.number().int().nonnegative().optional(),
  // Populate
  unidadFuncional: z.any().optional(),
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
});

export const CreateConsumoDiarioSchema = ConsumoDiarioSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  unidadFuncional: true,
  cliente: true,
  complejo: true,
});

// ── Resumen de consumos (dashboard, `GET /consumos-diarios/resumen`) ──────

export const ResumenConsumoQuerySchema = z.object({
  /** Obligatorio salvo nivel Complejo (se toma del permiso). */
  idComplejo: z.string().optional(),
  servicio: ServicioMedidoSchema,
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

/** Consumo de una unidad en el rango (suma de sus asignaciones). */
export const ConsumoUnidadResumenSchema = z.object({
  idUnidadFuncional: z.string(),
  /** `{ nombre, numero, tipo }` de la UF. */
  unidadFuncional: z.any().optional(),
  consumo: z.number(),
  /** Días con consumo calculado. */
  dias: z.number().int(),
  /** Días que no se pudieron calcular (discontinuidad / sin baseline). */
  diasSinCalcular: z.number().int(),
  /** Días con lecturas de fecha dudosa. */
  diasSospechosos: z.number().int(),
  ultimaLectura: z.number().nullable(),
  fechaUltimaLectura: z.string().optional(),
  idsAsignaciones: z.array(z.string()),
});

export const PuntoSerieConsumoSchema = z.object({
  fecha: z.string(),
  /** Σ de las unidades ese día. */
  unidades: z.number(),
  /** Medidor general ese día (null sin medidor general o sin dato). */
  general: z.number().nullable(),
});

export const ResumenConsumoSchema = z.object({
  idComplejo: z.string(),
  servicio: ServicioMedidoSchema,
  desde: z.string(),
  hasta: z.string(),
  unidad: z.string().optional(),
  porUnidad: z.array(ConsumoUnidadResumenSchema),
  /** Σ de las unidades en el rango. */
  totalUnidades: z.number(),
  /** Medidor(es) general(es) del complejo (destino `Complejo`). null = no hay. */
  general: z.number().nullable(),
  /** general − Σ unidades: lo que no llegó a ninguna unidad (pérdidas, áreas
   *  sin medidor, error de medición). null sin medidor general. */
  diferencia: z.number().nullable(),
  /** diferencia / general, 0-1. */
  diferenciaPorcentaje: z.number().nullable(),
  serieDiaria: z.array(PuntoSerieConsumoSchema),
});

export type ICalidadConsumoDiario = z.infer<typeof CalidadConsumoDiarioSchema>;
// ── Mi consumo (residente, `GET /consumos-diarios/mios`, D66 Etapa 6) ──────

/**
 * Bits de estado de un medidor que se le avisan al residente (push
 * `alarma_medidor`). Son los nombres que emite el decodificador del edge en el
 * evento `alarma` (`subtipo`): EUW300 (`cjt188`), SML en agua (`hac-mlw`) y el
 * medidor eléctrico NME. El resto (batería, válvula, falla del equipo) es
 * mantenimiento: lo ve la administración, no el residente.
 */
export const ALARMAS_MEDIDOR_RESIDENTE = [
  "goteo",
  "ingresoAgua",
  "alarmaFlujo",
  "sobreflujo",
  "flujoInverso",
  "tuboVacio",
  "sinEnergiaExterna",
] as const;

/** Rango opcional; default: los últimos 60 días. Nunca antes de la vigencia
 *  del permiso (un dueño nuevo no ve el consumo del anterior). */
export const MisConsumosQuerySchema = z.object({
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/** Un medidor instalado hoy en la unidad. */
export const MiMedidorSchema = z.object({
  idAsignacion: z.string(),
  servicio: ServicioMedidoSchema,
  /** `m3` / `kWh`. */
  unidad: z.string(),
  fechaDesde: z.string(),
  /** Lectura del dial del último reporte (null sin reportes). */
  lecturaActual: z.number().nullable(),
  fechaLectura: z.string().optional(),
  /** `Online` / `Offline` / … del equipo. */
  estado: z.string().optional(),
  /** Alarmas activas que le importan al residente (subset de
   *  `ALARMAS_MEDIDOR_RESIDENTE`). */
  alarmasActivas: z.array(z.string()),
});

export const MisConsumosSchema = z.object({
  desde: z.string(),
  hasta: z.string(),
  medidores: z.array(MiMedidorSchema),
  /** Días del rango de las asignaciones de la unidad (vigentes y cerradas). */
  dias: z.array(ConsumoDiarioSchema),
});

export type IConsumoDiario = z.infer<typeof ConsumoDiarioSchema>;
export type ICreateConsumoDiario = z.infer<typeof CreateConsumoDiarioSchema>;
export type IResumenConsumoQuery = z.infer<typeof ResumenConsumoQuerySchema>;
export type IConsumoUnidadResumen = z.infer<typeof ConsumoUnidadResumenSchema>;
export type IPuntoSerieConsumo = z.infer<typeof PuntoSerieConsumoSchema>;
export type IResumenConsumo = z.infer<typeof ResumenConsumoSchema>;
export type IAlarmaMedidorResidente = (typeof ALARMAS_MEDIDOR_RESIDENTE)[number];
export type IMisConsumosQuery = z.infer<typeof MisConsumosQuerySchema>;
export type IMiMedidor = z.infer<typeof MiMedidorSchema>;
export type IMisConsumos = z.infer<typeof MisConsumosSchema>;
