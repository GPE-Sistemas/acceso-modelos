import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { DecodificadorLoRaWANSchema } from "./perfil-decodificacion";

/**
 * IMedicionDispositivo — serie temporal ESCALAR de un dispositivo (D55 §4.5 +
 * D66, acceso-doc-general doc 53 §4.2).
 *
 * La produce la ingesta LoRaWAN del edge (uplink → decodificador por familia) y
 * viaja al cloud por outbox (`medicion-dispositivo`, append, `_id`
 * determinístico). En el cloud vive 90 días (`expireAt`, lo fija el productor,
 * molde `IDeteccion`); lo que se factura es el `IConsumoPeriodo`, no esto.
 *
 * Un medidor reporta su odómetro CRUDO (`magnitud: 'volumenAcumulado'`, en la
 * unidad del equipo). La lectura del servicio sale con la asignación vigente
 * según `fechaDato` y se denormaliza en `valorServicio`:
 *   lecturaInicial + (odometro − odometroInicial) × factor
 * Si se corrige la lectura inicial o el factor, se recalcula desde `valor`, que
 * nunca se pisa.
 */

/**
 * Magnitud medida. Enum CERRADO a propósito: es lo que la UI sabe rotular,
 * graficar y convertir. Un sensor cuya magnitud no está acá se suma al enum en
 * el mismo release que su decodificador — no hay string libre, porque un typo
 * en el productor genera una serie fantasma que nadie ve. Espejo de las
 * constantes `Magnitud*` de `acceso-edge/internal/lorawan/decodificador`.
 */
export const MagnitudMedicionSchema = z.enum([
  // D55 §4.5
  "bateria",
  "temperatura",
  "humedad",
  "luz",
  "nivel",
  "caudal",
  "volumenAcumulado",
  "presion",
  "tension",
  "corriente",
  "energiaAcumulada",
  "co2",
  "ruido",
  "conteo",
  // D66 §4.2 (medidores de agua y gas)
  "caudalMinimo",
  "caudalMaximo",
  "volumenInverso",
  "temperaturaAmbiente",
  "tiempoFuncionamiento",
  "intensidadSenal",
]);

/**
 * Calidad del dato.
 *  - `Valida`: valor real.
 *  - `Centinela`: el equipo reportó su valor de "no disponible". Se persiste la
 *    lectura con `valor: null` — nunca un cero.
 *  - `FueraDeRango`: pasó el decodificador pero el valor no es físicamente
 *    posible (BCD con nibble inválido, etc.).
 *  - `Sospechosa`: el valor es real pero su FECHA no es confiable: reloj del
 *    equipo basura (año 1900, fecha futura) o el edge todavía no sincronizó su
 *    hora desde el arranque (doc 53 §3.4). La lectura se guarda con la fecha de
 *    recepción y no entra a un cierre de período sin revisión.
 */
export const CalidadMedicionSchema = z.enum([
  "Valida",
  "Centinela",
  "FueraDeRango",
  "Sospechosa",
]);

export const MedicionDispositivoSchema = z.object({
  /** Determinístico, SIN `fCnt`: el EUW300 repite el mismo frame 3-4 veces con
   *  `fCnt` distinto (doc 53 §4.2). Hash de devEUI + payload + fechaDato +
   *  magnitud + índice. Un replay del outbox es un upsert, no un duplicado. */
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  /** TTL del cloud (90 días). Lo fija el edge. */
  expireAt: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  idEdgeAppliance: z.string().optional(),
  idDispositivo: z.string(),
  /** Asignación vigente según `fechaDato` (nunca según la hora de recepción).
   *  Ausente en un sensor fijo o en un medidor sin instalar. */
  idAsignacion: z.string().optional(),
  magnitud: MagnitudMedicionSchema,
  /** Distingue N lecturas de la misma magnitud en un uplink (las 12 del
   *  reporte horario del EUW300, dos sondas de temperatura). */
  indice: z.number().int().nonnegative().optional(),
  /** `null` cuando `calidad === 'Centinela'`. NUNCA 0 para representar ausencia. */
  valor: z.number().nullable(),
  /** Unidad del equipo (`m3`, `L`, `V`, `°C`). Viaja con el dato. */
  unidad: z.string().optional(),
  calidad: CalidadMedicionSchema.optional(),
  /** Lectura del servicio (unidad del servicio, `m3`/`kWh`) con la asignación
   *  vigente. Solo odómetros de un medidor instalado con baseline coherente. */
  valorServicio: z.number().optional(),
  fechaDato: z.string(),
  fechaRecepcion: z.string().optional(),
  /** fechaRecepcion − fechaDato. Grande = store-and-forward o reloj corrido. */
  desfaseSegundos: z.number().int().optional(),
  /** Tipo de reporte dentro de la familia (`diario`, `horario`, `evento`, `periodico`). */
  tipoReporte: z.string().optional(),
  decodificador: DecodificadorLoRaWANSchema.optional(),
  /** Versión del perfil que produjo la lectura: sin esto, un perfil corregido
   *  vuelve inexplicable el histórico anterior. */
  versionPerfil: z.number().int().optional(),
  devEUI: z.string().optional(),
  fPort: z.number().int().optional(),
  fCnt: z.number().int().optional(),
  rssi: z.number().optional(),
  snr: z.number().optional(),
  // Populate
  dispositivo: z.any().optional(),
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
});

export const CreateMedicionDispositivoSchema = MedicionDispositivoSchema.omit({
  _id: true,
  fechaCreacion: true,
  dispositivo: true,
  cliente: true,
  complejo: true,
});

/**
 * Body de `POST /perfiles-decodificacion/probar` (probador, doc 53 §5.1): el
 * edge corre el MISMO código Go de la ingesta sobre un payload pegado en la web.
 * Sin persistir nada.
 */
export const ProbarDecodificadorSchema = z.object({
  decodificador: DecodificadorLoRaWANSchema,
  /** Hex del FRMPayload, con o sin espacios. */
  payloadHex: z.string().min(2),
  fPort: z.number().int().min(0).max(255).optional(),
  parametros: z.record(z.string(), z.any()).optional(),
  /** Complejo cuyo edge ejecuta la prueba. Sin él, el primer edge online del
   *  alcance del permiso. */
  idComplejo: z.string().optional(),
});

export const LecturaProbadorSchema = z.object({
  magnitud: z.string(),
  indice: z.number().int().optional(),
  valor: z.number().nullable(),
  unidad: z.string().optional(),
  calidad: z.string().optional(),
  fechaDato: z.string().optional(),
});

export const ResultadoProbadorSchema = z.object({
  ok: z.boolean(),
  /** Error tipado del decodificador (`checksum inválido`, `trama cifrada`, …). */
  error: z.string().optional(),
  tipo: z.string().optional(),
  numeroMedidor: z.string().optional(),
  lecturas: z.array(LecturaProbadorSchema).optional(),
  estados: z.record(z.string(), z.boolean()).optional(),
  disparador: z.string().optional(),
  relojSospechoso: z.boolean().optional(),
  crudo: z.record(z.string(), z.any()).optional(),
  /** Edge que ejecutó la prueba (hostname). */
  edge: z.string().optional(),
});

export type IMagnitudMedicion = z.infer<typeof MagnitudMedicionSchema>;
export type ICalidadMedicion = z.infer<typeof CalidadMedicionSchema>;
export type IMedicionDispositivo = z.infer<typeof MedicionDispositivoSchema>;
export type ICreateMedicionDispositivo = z.infer<typeof CreateMedicionDispositivoSchema>;
export type IProbarDecodificador = z.infer<typeof ProbarDecodificadorSchema>;
export type ILecturaProbador = z.infer<typeof LecturaProbadorSchema>;
export type IResultadoProbador = z.infer<typeof ResultadoProbadorSchema>;
