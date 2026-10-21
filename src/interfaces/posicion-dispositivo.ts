import { z } from "zod";
import { GeoJSONPointSchema } from "../auxiliares/geojson";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { DecodificadorLoRaWANSchema } from "./perfil-decodificacion";

/**
 * IPosicionDispositivo — serie de posiciones de un tracker LoRaWAN (D54/D55
 * §4.4, D66 Etapa 7, acceso-doc-general doc 38 §4.4 y doc 53 §7).
 *
 * La produce la ingesta del edge (decodificador `t1000`) y viaja al cloud por
 * outbox (`posicion-dispositivo`, append, `_id` determinístico). En el cloud vive
 * 90 días (`expireAt`, lo fija el productor); el recorrido histórico tiene su
 * propia acción porque expone dato personal de un tercero.
 *
 * Separada de `IMedicionDispositivo` a propósito: índice `2dsphere`, atribución a
 * una asignación y consulta de recorrido propias (doc 38 §4.5). La batería, la
 * temperatura y la luz del mismo uplink van como mediciones.
 */

/**
 * Cómo se obtuvo la posición.
 *  - `GNSS`: coordenadas calculadas por el propio equipo (tramas `06`/`09` del
 *    T1000). Es la única que el edge resuelve sin internet.
 *  - `WiFi` / `BLE`: coordenadas resueltas desde un escaneo (solver externo o
 *    balizas propias). Reservado: hoy ningún productor las emite.
 *  - `SinResolver`: el equipo reportó pero sin coordenadas — un escaneo WiFi/BLE
 *    sin solver o una falla de posicionamiento. NO es basura: distingue
 *    "tarjeta apagada" de "tarjeta bajo techo".
 */
export const TipoPosicionSchema = z.enum(["GNSS", "WiFi", "BLE", "SinResolver"]);

/**
 * Cómo se resolvió la asignación dueña de esta posición (doc 38 §5).
 *  - `Atribuida`: cayó dentro de la ventana de una asignación.
 *  - `SinAsignacion`: fuera de toda ventana (en el cajón, en carga). Se guarda.
 *  - `Sospechosa`: el reloj del equipo no es confiable (fecha futura, equipo sin
 *    hora): atribuir sería inventar.
 */
export const EstadoAtribucionPosicionSchema = z.enum([
  "Atribuida",
  "SinAsignacion",
  "Sospechosa",
]);

/** Escaneo WiFi/BLE que el equipo mandó en lugar de coordenadas. Sin las MAC:
 *  son de redes de terceros y sin solver no aportan nada. El uplink crudo queda
 *  en el edge (30 días) si hace falta reprocesarlo. */
export const EscaneoPosicionSchema = z.object({
  tecnologia: z.enum(["WiFi", "BLE"]),
  /** Puntos de acceso / balizas detectados. */
  cantidad: z.number().int().nonnegative(),
  /** RSSI del más fuerte, en dBm. */
  mejorRssi: z.number().optional(),
});

export const PosicionDispositivoSchema = z.object({
  /** Determinístico: hash de devEUI + payload + fechaDato + índice. Un replay
   *  del outbox (o la retransmisión del store-and-forward) es un upsert. */
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  /** TTL del cloud (90 días). Lo fija el edge. */
  expireAt: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  idEdgeAppliance: z.string().optional(),
  idDispositivo: z.string(),
  /** Asignación vigente según `fechaDato` — nunca según la recepción: el T1000
   *  hace store-and-forward y un uplink puede ser de una asignación ya cerrada. */
  idAsignacion: z.string().optional(),
  estadoAtribucion: EstadoAtribucionPosicionSchema.optional(),
  /** `collectTime` del PROPIO equipo. Única base válida de atribución. */
  fechaDato: z.string(),
  fechaRecepcion: z.string().optional(),
  /** fechaRecepcion − fechaDato. Grande = store-and-forward o reloj corrido. */
  desfaseSegundos: z.number().int().optional(),
  tipo: TipoPosicionSchema,
  /** Ausente cuando `tipo === 'SinResolver'`. coordinates = [lng, lat]. */
  ubicacion: GeoJSONPointSchema.optional(),
  escaneo: EscaneoPosicionSchema.optional(),
  /** Por qué no hay coordenadas (tramas `0D`/`11`): timeout de GNSS, sin hora
   *  UTC, almanaque viejo. Clave estable; el texto lo arma la UI. */
  estadoPosicionamiento: z.string().optional(),
  /** Código crudo del equipo para `estadoPosicionamiento`. */
  codigoError: z.number().int().optional(),
  /** Eventos que acompañan el reporte (`inicioMovimiento`, `finMovimiento`,
   *  `quieto`, `golpe`, `temperatura`, `luz`, `sos`, `boton`). */
  eventos: z.array(z.string()).optional(),
  /** Número de segmento de movimiento del equipo (agrupa un trayecto). */
  segmentoMovimiento: z.number().int().optional(),
  bateriaPorcentaje: z.number().optional(),
  decodificador: DecodificadorLoRaWANSchema.optional(),
  versionPerfil: z.number().int().optional(),
  devEUI: z.string().optional(),
  fPort: z.number().int().optional(),
  fCnt: z.number().int().optional(),
  rssi: z.number().optional(),
  snr: z.number().optional(),
  /** Zona resuelta al ingestar (geocercas, iteración siguiente). */
  idZona: z.string().optional(),
  // Populate — `dispositivo` como z.any() (cadena profunda de IDispositivo).
  dispositivo: z.any().optional(),
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
});

export const CreatePosicionDispositivoSchema = PosicionDispositivoSchema.omit({
  _id: true,
  fechaCreacion: true,
  dispositivo: true,
  cliente: true,
  complejo: true,
});

export type ITipoPosicion = z.infer<typeof TipoPosicionSchema>;
export type IEstadoAtribucionPosicion = z.infer<typeof EstadoAtribucionPosicionSchema>;
export type IEscaneoPosicion = z.infer<typeof EscaneoPosicionSchema>;
export type IPosicionDispositivo = z.infer<typeof PosicionDispositivoSchema>;
export type ICreatePosicionDispositivo = z.infer<typeof CreatePosicionDispositivoSchema>;
