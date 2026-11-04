import { z } from "zod";

/**
 * Series de bombeo (D72, acceso-doc-general doc 58 §3.4 y §5). Las escribe
 * acceso-api (ingesta MQTT y job de derivados) vía acceso-datos. Cloud-only.
 *
 * - `IReporteBombeo`: lo que llegó, una fila por trama UCP. Auditoría, TTL 90 d.
 * - `IResumenHorarioBombeo`: agregado por estación y hora UTC, sin TTL.
 * - `ICicloBomba`: un período de marcha de una bomba, sin TTL.
 *
 * Los dos derivados se RECALCULAN desde el crudo (por hora completa): un
 * reporte atrasado, repetido o reprocesado no los corrompe.
 */

/** Tramas UCP que se persisten (F6 y las respuestas a comandos no). */
export const TipoTramaBombeoSchema = z.enum(["F2", "F3", "F4", "F7"]);

export const ValorCanalBombeoSchema = z.object({
  /** Ya escalado con la plantilla (crudo / divisor) o booleano. */
  valor: z.union([z.number(), z.boolean()]),
  /** false = valor cacheado por el RTU (bit 3 del canal en 0), no una lectura. */
  ok: z.boolean(),
});

export const ReporteBombeoSchema = z.object({
  /** Determinístico (ObjectId derivado de estación + tipo + timestamp del
   *  equipo): el mismo mensaje reenviado por Gas o reentregado por QoS 1 es un
   *  upsert, no un duplicado. */
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  /** TTL (90 días). Lo fija acceso-api. */
  expireAt: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  idEstacion: z.string(),
  idDispositivo: z.string(),
  /** SN del UC300 (tópico). */
  sn: z.string(),
  tipo: TipoTramaBombeoSchema,
  /** Instante de la medición (timestamp del equipo; el F4 se mide 1-3 s antes). */
  fechaDato: z.string(),
  fechaRecepcion: z.string(),
  /** El timestamp del equipo era implausible (reloj en 1970 por NTP mal
   *  configurado, o a más de 1 h de la recepción): `fechaDato` = recepción. */
  horaCorregida: z.boolean().optional(),
  /** Trama UCP cruda. */
  hex: z.string(),
  senalDbm: z.number().optional(),
  salidas: z.record(z.string(), z.boolean()).optional(),
  entradas: z.record(z.string(), z.boolean()).optional(),
  /** Clave completa (`pozo.nivel_m`) → valor. F4 y F2 (las DI mapeadas). */
  canales: z.record(z.string(), ValorCanalBombeoSchema).optional(),
  discrepancias: z.array(z.string()).optional(),
  idPlantillaRtu: z.string().optional(),
  versionPlantilla: z.number().int().optional(),
  /** F3: atributos del equipo. F7: texto de la regla IF-THEN. */
  atributos: z.record(z.string(), z.string()).optional(),
});

export const CreateReporteBombeoSchema = ReporteBombeoSchema.omit({ fechaCreacion: true });

export const EstadisticaSenalBombeoSchema = z.object({
  min: z.number(),
  max: z.number(),
  prom: z.number(),
  ultimo: z.number(),
  /** Muestras con lectura OK. */
  n: z.number().int(),
});

export const ResumenBombaHoraSchema = z.object({
  idBomba: z.string().optional(),
  numero: z.number().int(),
  arranques: z.number().int(),
  segundosMarcha: z.number(),
  segundosFalla: z.number(),
  /** Delta del acumulador de energía en la hora (con vuelta). */
  energiaKwh: z.number().optional(),
});

export const ResumenHorarioBombeoSchema = z.object({
  /** Determinístico (estación + hora). */
  _id: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  idEstacion: z.string(),
  /** Inicio de la hora, ISO UTC. */
  hora: z.string(),
  muestras: z.number().int(),
  muestrasEsperadas: z.number().int(),
  /** Tramos de más de 3 intervalos entre reportes. */
  segundosSinDato: z.number(),
  senalDbmProm: z.number().optional(),
  /** Señales numéricas con lectura OK, por clave completa. */
  senales: z.record(z.string(), EstadisticaSenalBombeoSchema),
  bombas: z.array(ResumenBombaHoraSchema),
  calculadoEn: z.string(),
});

export const CicloBombaSchema = z.object({
  /** Determinístico (estación + bomba + inicio). */
  _id: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  idEstacion: z.string(),
  idBomba: z.string().optional(),
  numeroBomba: z.number().int(),
  inicio: z.string(),
  /** Ausente = sigue en marcha. */
  fin: z.string().optional(),
  duracionSegundos: z.number().optional(),
  /** El arranque (o la parada) cayó dentro de un hueco sin datos: el instante
   *  es el primer (último) reporte conocido, no el real. */
  inicioIncierto: z.boolean().optional(),
  finIncierto: z.boolean().optional(),
});

/** Query de `GET /estaciones-bombeo/:id/resumen` (horario o diario). */
export const GranularidadResumenBombeoSchema = z.enum(["hora", "dia"]);

export type ITipoTramaBombeo = z.infer<typeof TipoTramaBombeoSchema>;
export type IValorCanalBombeo = z.infer<typeof ValorCanalBombeoSchema>;
export type IReporteBombeo = z.infer<typeof ReporteBombeoSchema>;
export type ICreateReporteBombeo = z.infer<typeof CreateReporteBombeoSchema>;
export type IEstadisticaSenalBombeo = z.infer<typeof EstadisticaSenalBombeoSchema>;
export type IResumenBombaHora = z.infer<typeof ResumenBombaHoraSchema>;
export type IResumenHorarioBombeo = z.infer<typeof ResumenHorarioBombeoSchema>;
export type ICicloBomba = z.infer<typeof CicloBombaSchema>;
export type IGranularidadResumenBombeo = z.infer<typeof GranularidadResumenBombeoSchema>;

/** Días que vive el crudo en el cloud (TTL de `IReporteBombeo`). */
export const DIAS_RETENCION_REPORTE_BOMBEO = 90;
