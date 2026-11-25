import { z } from "zod";

/**
 * Histórico de uso del alumbrado (D77, doc 61 §9).
 *
 * El nodo reporta su estado cada `frecReporteMin` (UL 101: encendida, potencia,
 * tensión, % de atenuación) y la energía acumulada cada hora (UL 102). La serie
 * cruda vive 90 días en `mediciones-dispositivo`. Sobre ella acceso-api arma un
 * `IResumenDiarioLuminaria` por luminaria y día local (job horario), que es lo
 * que leen la ficha y el dashboard: recorrer la serie cruda de cientos de
 * luminarias en cada consulta sería pesado, y el resumen no vence.
 *
 * Todo lo que se agrega entre días o entre luminarias se guarda como SUMA (y no
 * como promedio): los promedios se calculan al leer, ponderados.
 */

/** Rango de tensión sano de la red (220 V ± 10 %). Fuera de él la lectura cuenta. */
export const TENSION_MIN_NORMAL_V = 198;
export const TENSION_MAX_NORMAL_V = 242;

/**
 * Margen para marcar un día como anómalo (encendida de día o apagada de
 * noche). Por debajo es ruido del muestreo: el estado se conoce cada
 * `frecReporteMin` y el reloj del nodo calcula el sol con su propio GPS.
 */
export const TOLERANCIA_ANOMALIA_HORARIO_SEG = 30 * 60;

/** Vida útil de referencia de una luminaria LED (horas encendida, L70). */
export const VIDA_UTIL_LED_HORAS = 50_000;

/** Cenit del amanecer/atardecer oficial (el mismo que usa el firmware SSL-IDF). */
const CENIT_OFICIAL = 90.833;

const rad = (g: number) => (g * Math.PI) / 180;
const grad = (r: number) => (r * 180) / Math.PI;
const norm = (v: number, m: number) => ((v % m) + m) % m;

/**
 * Hora de salida o puesta del sol (algoritmo del *Almanac for Computers*,
 * error ~1-2 min) para el día local `dia` (`YYYY-MM-DD`) en `lat`/`lng`.
 * `offsetMin` es el desfase de la hora local respecto de UTC (ART = −180).
 * Devuelve `null` si ese día el sol no sale o no se pone (latitudes polares).
 */
export function horaSol(
  dia: string,
  lat: number,
  lng: number,
  salida: boolean,
  offsetMin: number,
): Date | null {
  const [y, m, d] = dia.split("-").map(Number);
  const inicioAnio = Date.UTC(y, 0, 1);
  const n = Math.floor((Date.UTC(y, m - 1, d) - inicioAnio) / 86_400_000) + 1;
  const lngHora = lng / 15;
  const t = n + ((salida ? 6 : 18) - lngHora) / 24;
  const M = 0.9856 * t - 3.289;
  const L = norm(M + 1.916 * Math.sin(rad(M)) + 0.02 * Math.sin(rad(2 * M)) + 282.634, 360);
  let RA = norm(grad(Math.atan(0.91764 * Math.tan(rad(L)))), 360);
  RA += Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90;
  RA /= 15;
  const sinDec = 0.39782 * Math.sin(rad(L));
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosH =
    (Math.cos(rad(CENIT_OFICIAL)) - sinDec * Math.sin(rad(lat))) / (cosDec * Math.cos(rad(lat)));
  if (cosH > 1 || cosH < -1) return null;
  const H = (salida ? 360 - grad(Math.acos(cosH)) : grad(Math.acos(cosH))) / 15;
  const T = H + RA - 0.06571 * t - 6.622;
  const ut = norm(T - lngHora, 24);
  // `ut` es la hora UTC módulo 24: se ubica dentro del día LOCAL pedido.
  const inicioLocal = Date.UTC(y, m - 1, d) - offsetMin * 60_000;
  let ms = Date.UTC(y, m - 1, d) + ut * 3_600_000;
  while (ms < inicioLocal) ms += 86_400_000;
  while (ms >= inicioLocal + 86_400_000) ms -= 86_400_000;
  return new Date(ms);
}

export const ResumenDiarioLuminariaSchema = z.object({
  /** Determinístico (luminaria + día): el recálculo es un upsert. */
  _id: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  idLuminaria: z.string(),
  /** Sector vigente al calcular (las agregaciones por sector lo usan). */
  idSector: z.string().optional(),
  /** Nodos que reportaron ese día (un cambio de nodo deja dos). */
  idsDispositivos: z.array(z.string()).optional(),
  /** Día LOCAL del complejo, `YYYY-MM-DD`. */
  dia: z.string(),
  /** Inicio del día local, ISO UTC. */
  inicio: z.string(),
  /** Día en curso: el resumen cubre hasta `calculadoEn`. */
  parcial: z.boolean(),

  // ── Comunicación ──
  /** Reportes de estado (UL 101) recibidos. */
  muestras: z.number().int(),
  /** Los que tendría que haber mandado con la frecuencia de su sector. */
  muestrasEsperadas: z.number().int(),
  /** Tiempo sin estado conocido (más de 2 intervalos sin reporte). */
  segundosSinDato: z.number(),

  // ── Horario ──
  segundosEncendida: z.number(),
  /** Oscuridad esperada (atardecer→amanecer con los desfases del sector).
   *  Ausente si no se conoce la ubicación de la luminaria ni del complejo. */
  segundosEsperados: z.number().optional(),
  /** Encendida dentro de la oscuridad esperada (base del cumplimiento). */
  segundosEncendidaDeNoche: z.number(),
  /** Encendida con luz de día, fuera de una orden manual de encender. */
  segundosEncendidaDeDia: z.number(),
  /** Apagada (estado conocido) de noche, fuera de una orden manual de apagar. */
  segundosApagadaDeNoche: z.number(),
  /** Tiempo bajo una orden manual (encender o apagar). */
  segundosOrdenManual: z.number(),
  /** Más de `TOLERANCIA_ANOMALIA_HORARIO_SEG` encendida de día. */
  anomaliaDeDia: z.boolean(),
  /** Más de `TOLERANCIA_ANOMALIA_HORARIO_SEG` apagada de noche. */
  anomaliaDeNoche: z.boolean(),
  /** Pasajes de apagada a encendida (desgaste del relé). */
  encendidos: z.number().int(),
  /** Primer encendido de la tarde/noche (desde las 12:00 locales), ISO. */
  horaEncendido: z.string().optional(),
  /** Primer apagado de la mañana (antes de las 12:00 locales), ISO. */
  horaApagado: z.string().optional(),
  /** Puesta y salida del sol de ese día, sin desfases, ISO. */
  atardecer: z.string().optional(),
  amanecer: z.string().optional(),

  // ── Eléctrico ──
  tensionMin: z.number().optional(),
  tensionMax: z.number().optional(),
  tensionSuma: z.number(),
  tensionN: z.number().int(),
  /** Lecturas fuera de `TENSION_MIN_NORMAL_V`..`TENSION_MAX_NORMAL_V`. */
  lecturasTensionFuera: z.number().int(),
  /** Σ potencia × segundos mientras estuvo encendida (W·s). */
  potenciaPonderadaWs: z.number(),
  /** Σ % de atenuación × segundos mientras estuvo encendida. */
  atenuacionPonderada: z.number(),
  /** Diferencia del contador de energía del nodo (UL 102). Ausente sin dos lecturas. */
  energiaContadorKwh: z.number().optional(),
  /** Integral de la potencia reportada. */
  energiaIntegradaKwh: z.number(),
  /** La que habría consumido al 100 % (potencia ÷ % de atenuación). */
  energiaPlenaKwh: z.number(),
  /** La que se informa: el contador si lo hay, si no la integrada. */
  energiaKwh: z.number(),

  // ── Alarmas ──
  /** Activaciones por bit (`corteEnergia`, `golpe`…). */
  alarmas: z.record(z.string(), z.number().int()),
  alarmasTotal: z.number().int(),
  segundosCorteEnergia: z.number(),

  calculadoEn: z.string(),
});

/** Por qué se agrupan los resúmenes al agregar (`GET .../agregado?por=`). */
export const AgrupacionUsoAlumbradoSchema = z.enum(["dia", "luminaria", "sector", "total"]);

/**
 * Suma de resúmenes diarios (acceso-datos `$group`). `clave` es el día, el
 * `idLuminaria`, el `idSector` (`""` = sin sector) o `"total"`.
 */
export const AgregadoUsoAlumbradoSchema = z.object({
  clave: z.string(),
  /** Resúmenes sumados (luminaria × día). */
  dias: z.number().int(),
  luminarias: z.number().int(),
  muestras: z.number(),
  muestrasEsperadas: z.number(),
  segundosSinDato: z.number(),
  segundosEncendida: z.number(),
  segundosEsperados: z.number(),
  segundosEncendidaDeNoche: z.number(),
  segundosEncendidaDeDia: z.number(),
  segundosApagadaDeNoche: z.number(),
  segundosOrdenManual: z.number(),
  diasAnomaliaDeDia: z.number().int(),
  diasAnomaliaDeNoche: z.number().int(),
  encendidos: z.number().int(),
  tensionMin: z.number().nullable(),
  tensionMax: z.number().nullable(),
  tensionSuma: z.number(),
  tensionN: z.number(),
  lecturasTensionFuera: z.number(),
  potenciaPonderadaWs: z.number(),
  atenuacionPonderada: z.number(),
  energiaKwh: z.number(),
  energiaIntegradaKwh: z.number(),
  energiaPlenaKwh: z.number(),
  alarmasTotal: z.number().int(),
  segundosCorteEnergia: z.number(),
});

/** Métricas legibles de un agregado (o de un resumen): lo que muestra la UI. */
export interface IMetricasUsoAlumbrado {
  horasEncendida: number;
  horasEsperadas: number | null;
  /** Encendida de noche ÷ oscuridad esperada (0..1). */
  cumplimiento: number | null;
  horasEncendidaDeDia: number;
  horasApagadaDeNoche: number;
  /** Reportes recibidos ÷ esperados (0..1). */
  comunicacion: number | null;
  tensionMin: number | null;
  tensionMax: number | null;
  tensionProm: number | null;
  lecturasTensionFuera: number;
  /** Potencia media mientras estuvo encendida (W). */
  potenciaMediaW: number | null;
  /** % de atenuación medio mientras estuvo encendida. */
  atenuacionMedia: number | null;
  energiaKwh: number;
  /** Lo que se ahorró por atenuar (energía plena − integrada). */
  ahorroKwh: number;
  /** Ahorro ÷ energía plena (0..1). */
  ahorro: number | null;
  encendidos: number;
  horasCorteEnergia: number;
  alarmasTotal: number;
}

const horas = (s: number) => s / 3600;

/** Deriva las métricas de una suma de resúmenes (un día o un agregado). */
export function metricasUsoAlumbrado(a: {
  muestras: number;
  muestrasEsperadas: number;
  segundosEncendida: number;
  segundosEsperados?: number;
  segundosEncendidaDeNoche: number;
  segundosEncendidaDeDia: number;
  segundosApagadaDeNoche: number;
  encendidos: number;
  tensionMin?: number | null;
  tensionMax?: number | null;
  tensionSuma: number;
  tensionN: number;
  lecturasTensionFuera: number;
  potenciaPonderadaWs: number;
  atenuacionPonderada: number;
  energiaKwh: number;
  energiaIntegradaKwh: number;
  energiaPlenaKwh: number;
  alarmasTotal: number;
  segundosCorteEnergia: number;
}): IMetricasUsoAlumbrado {
  const esperados = a.segundosEsperados ?? 0;
  const ahorroKwh = Math.max(0, a.energiaPlenaKwh - a.energiaIntegradaKwh);
  return {
    horasEncendida: horas(a.segundosEncendida),
    horasEsperadas: esperados > 0 ? horas(esperados) : null,
    cumplimiento: esperados > 0 ? Math.min(1, a.segundosEncendidaDeNoche / esperados) : null,
    horasEncendidaDeDia: horas(a.segundosEncendidaDeDia),
    horasApagadaDeNoche: horas(a.segundosApagadaDeNoche),
    comunicacion: a.muestrasEsperadas > 0 ? Math.min(1, a.muestras / a.muestrasEsperadas) : null,
    tensionMin: a.tensionMin ?? null,
    tensionMax: a.tensionMax ?? null,
    tensionProm: a.tensionN > 0 ? a.tensionSuma / a.tensionN : null,
    lecturasTensionFuera: a.lecturasTensionFuera,
    potenciaMediaW: a.segundosEncendida > 0 ? a.potenciaPonderadaWs / a.segundosEncendida : null,
    atenuacionMedia: a.segundosEncendida > 0 ? a.atenuacionPonderada / a.segundosEncendida : null,
    energiaKwh: a.energiaKwh,
    ahorroKwh,
    ahorro: a.energiaPlenaKwh > 0 ? ahorroKwh / a.energiaPlenaKwh : null,
    encendidos: a.encendidos,
    horasCorteEnergia: horas(a.segundosCorteEnergia),
    alarmasTotal: a.alarmasTotal,
  };
}

// ── Salidas de acceso-api ──────────────────────────────────────────────────

/** Precio con el que se estima el costo (tarifa de Electricidad del complejo). */
export const PrecioEnergiaAlumbradoSchema = z.object({
  /** $ por kWh: primer tramo de la tarifa vigente del período. */
  precioKwh: z.number(),
  /** Período (`YYYY-MM`) de la tarifa usada. */
  vigenteDesde: z.string(),
});

/** `GET /uso-alumbrado/luminarias/:id`. */
export const UsoLuminariaSchema = z.object({
  idLuminaria: z.string(),
  desde: z.string(),
  hasta: z.string(),
  /** Un resumen por día con datos, del más viejo al más nuevo. */
  dias: z.array(ResumenDiarioLuminariaSchema),
  /** Suma del período; `null` sin ningún día calculado. */
  totales: AgregadoUsoAlumbradoSchema.nullable(),
  /** Activaciones de alarma del período por bit. */
  alarmas: z.record(z.string(), z.number().int()),
  /** Desde el primer resumen guardado (desgaste). */
  acumulado: z.object({
    desde: z.string().nullable(),
    horasEncendida: z.number(),
    encendidos: z.number().int(),
    vidaUtilHoras: z.number(),
  }),
  potenciaNominalW: z.number().nullable(),
  precio: PrecioEnergiaAlumbradoSchema.nullable(),
});

export const LuminariaUsoDestacadaSchema = z.object({
  idLuminaria: z.string(),
  identificacion: z.string(),
  idSector: z.string().optional(),
  sector: z.string().optional(),
  agregado: AgregadoUsoAlumbradoSchema,
  /** Potencia media encendida vs. la nominal de la luminaria (1 = igual). */
  potenciaRelativa: z.number().nullable(),
  /** Motivos de la anomalía, en español (`"Encendida de día 3 días"`). */
  motivos: z.array(z.string()),
});

export const SectorUsoAlumbradoSchema = z.object({
  idSector: z.string(),
  nombre: z.string(),
  color: z.string().optional(),
  agregado: AgregadoUsoAlumbradoSchema,
});

/** `GET /uso-alumbrado/complejo`. */
export const UsoAlumbradoComplejoSchema = z.object({
  idComplejo: z.string(),
  desde: z.string(),
  hasta: z.string(),
  /** Luminarias del complejo hoy. */
  luminarias: z.number().int(),
  totales: AgregadoUsoAlumbradoSchema.nullable(),
  /** Un agregado por día, del más viejo al más nuevo. */
  porDia: z.array(AgregadoUsoAlumbradoSchema),
  porSector: z.array(SectorUsoAlumbradoSchema),
  /** Ventana de las anomalías (los últimos 7 días del período). */
  anomaliasDesde: z.string(),
  /** Encendidas de día, apagadas de noche, consumo o tensión fuera de lo normal. */
  anomalias: z.array(LuminariaUsoDestacadaSchema),
  /** Las que más consumieron en el período (hasta 5). */
  topConsumo: z.array(LuminariaUsoDestacadaSchema),
  /** Las de más alarmas y horas de corte (hasta 5). */
  topFallas: z.array(LuminariaUsoDestacadaSchema),
  precio: PrecioEnergiaAlumbradoSchema.nullable(),
});

export type IResumenDiarioLuminaria = z.infer<typeof ResumenDiarioLuminariaSchema>;
export type IAgrupacionUsoAlumbrado = z.infer<typeof AgrupacionUsoAlumbradoSchema>;
export type IAgregadoUsoAlumbrado = z.infer<typeof AgregadoUsoAlumbradoSchema>;
export type IPrecioEnergiaAlumbrado = z.infer<typeof PrecioEnergiaAlumbradoSchema>;
export type IUsoLuminaria = z.infer<typeof UsoLuminariaSchema>;
export type ILuminariaUsoDestacada = z.infer<typeof LuminariaUsoDestacadaSchema>;
export type ISectorUsoAlumbrado = z.infer<typeof SectorUsoAlumbradoSchema>;
export type IUsoAlumbradoComplejo = z.infer<typeof UsoAlumbradoComplejoSchema>;
