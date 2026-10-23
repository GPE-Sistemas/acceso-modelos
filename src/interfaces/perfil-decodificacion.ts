import { z } from "zod";
import { ClienteSchema } from "./cliente";

/**
 * IPerfilDecodificacion — cómo leer y cómo aprovisionar un MODELO de equipo
 * LoRaWAN (D66.4 / D66.5, acceso-doc-general doc 53 §5.1 y §4.4).
 *
 * No describe tramas byte a byte (eso era D55 §8, reemplazado): nombra el
 * decodificador Go registrado en el edge (`cjt188`, `hac-mlw`, …) y le pasa
 * `parametros`. Un modelo nuevo de una familia existente es un perfil nuevo; una
 * familia nueva pide release del edge.
 *
 * Es catálogo de PLATAFORMA (un perfil mal cargado corrompe la ingesta de todos
 * los equipos de ese modelo): lo administra `Hardware - Administrar perfiles de
 * decodificación`. Sin `idCliente` = perfil global (Proveedor). Se replica al
 * edge (lo necesitan el reconciliador del NS y la ingesta) SIN los campos
 * cifrados: la clave que el edge necesita la resuelve el cloud por dispositivo.
 */

/** Familias implementadas en el edge (`internal/lorawan/decodificador`). */
export const DecodificadorLoRaWANSchema = z.enum(["cjt188", "hac-mlw", "ml107a", "t1000", "nme"]);

/**
 * De dónde sale la AppKey de los equipos de este modelo (doc 53 §4.4). Es del
 * MODELO, no un fallback: sin clave y sin método, el alta se rechaza (Gas
 * derivaba una clave de cualquier equipo sin AppKey, también de los SML sin
 * lote, y quedaba incorrecta en silencio).
 *  - `PorDispositivo`: clave única de fábrica (etiqueta, planilla del
 *    proveedor, NFC). Se carga en cada equipo (`config.appKey`).
 *  - `FijaPorModelo`: el fabricante usa una sola clave para toda la flota
 *    (SML/HAC). Vive cifrada en el perfil.
 *  - `DerivadaDeLote`: equipos grabados con una llave maestra por lote:
 *    AES-128-CBC(llave del lote, IV fijo, PKCS7(devEUI)) — algoritmo de
 *    gas-admin. Las llaves viven cifradas en `lotes[]`.
 */
export const MetodoClaveLoRaWANSchema = z.enum(["PorDispositivo", "FijaPorModelo", "DerivadaDeLote"]);

export const ClaseLoRaWANSchema = z.enum(["A", "B", "C"]);
export const ActivacionLoRaWANSchema = z.enum(["OTAA", "ABP"]);
/** Versiones LoRaWAN que acepta ChirpStack v4 (`commonMacVersion`). */
export const MacVersionLoRaWANSchema = z.enum([
  "LORAWAN_1_0_0",
  "LORAWAN_1_0_1",
  "LORAWAN_1_0_2",
  "LORAWAN_1_0_3",
  "LORAWAN_1_0_4",
  "LORAWAN_1_1_0",
]);
/** Revisión de Regional Parameters (`commonRegParamsRevision`). */
export const RegParamsRevisionLoRaWANSchema = z.enum(["A", "B", "RP002_1_0_0", "RP002_1_0_1", "RP002_1_0_2", "RP002_1_0_3"]);

export const LotePerfilDecodificacionSchema = z.object({
  /** Lo que identifica el lote en el alta del equipo (`conectividad.lora.lote`). */
  nombre: z.string(),
  /** En claro SOLO en el body de alta/edición; acceso-api la cifra. */
  llave: z.string().optional(),
  llaveCifrada: z.string().optional(),
  tieneLlave: z.boolean().optional(),
});

export const PerfilDecodificacionSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  /** Ausente = perfil global de la plataforma. */
  idCliente: z.string().optional(),
  nombre: z.string(),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  variante: z.string().optional(),
  /** Sube con cada cambio de `parametros`/`decodificador`: las mediciones
   *  guardan la versión que las produjo (sin eso, un perfil corregido vuelve
   *  inexplicable el histórico). */
  version: z.number().int().positive(),
  habilitado: z.boolean().optional(),
  decodificador: DecodificadorLoRaWANSchema,
  /** fPorts con datos; los demás uplinks se guardan crudos sin decodificar. */
  fPortDatos: z.array(z.number().int().min(1).max(223)).optional(),
  /** Parámetros del decodificador (ej. `zonaHorariaMinutos` del EUW300). Los
   *  valida el decodificador, no el modelo. */
  parametros: z.record(z.string(), z.any()).optional(),
  metodoClave: MetodoClaveLoRaWANSchema,
  /** `FijaPorModelo`: en claro SOLO en el body; acceso-api la cifra. */
  appKey: z.string().optional(),
  appKeyCifrada: z.string().optional(),
  tieneAppKey: z.boolean().optional(),
  /** `DerivadaDeLote`. */
  lotes: z.array(LotePerfilDecodificacionSchema).optional(),
  /** Device profile de ChirpStack que arma el edge. Los defaults se relevan en
   *  el banco por modelo (doc 53 Etapa 0.4): no están en el código de Gas. */
  lorawan: z
    .object({
      clase: ClaseLoRaWANSchema.optional(),
      activacion: ActivacionLoRaWANSchema.optional(),
      macVersion: MacVersionLoRaWANSchema.optional(),
      regParamsRevision: RegParamsRevisionLoRaWANSchema.optional(),
      /** Intervalo esperado de uplinks, en segundos: ChirpStack lo usa para el
       *  estado del equipo y la UI para "no reporta". */
      uplinkIntervalSegundos: z.number().int().positive().optional(),
    })
    .optional(),
  /** Factor por defecto de la asignación (unidades del servicio por unidad
   *  cruda): SML en gas 0.001 m3, MRA en agua 0.01 m3 (doc 53 §4.1). */
  factorDefault: z.number().positive().optional(),
  /** El contador del equipo ES la lectura del dial (en la unidad del equipo):
   *  un lector del display de un medidor digital, como el NME. La instalación
   *  no pide lecturas — la lectura del dial es siempre contador × factor, y la
   *  lectura base sale del propio equipo. Un contador de pulsos (SML) no lo es:
   *  arranca en 0 y necesita la lectura del dial al instalar. */
  lecturaDirecta: z.boolean().optional(),
  // Populate
  cliente: ClienteSchema.optional(),
});

export const CreatePerfilDecodificacionSchema = PerfilDecodificacionSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  cliente: true,
  appKeyCifrada: true,
  tieneAppKey: true,
});

/** `idCliente: null` pasa el perfil a alcance Plataforma (global): un campo
 *  ausente del JSON no se distingue de "no lo cambio". Solo un Proveedor. */
export const UpdatePerfilDecodificacionSchema = CreatePerfilDecodificacionSchema.partial().extend({
  idCliente: z.string().nullable().optional(),
});

export type IDecodificadorLoRaWAN = z.infer<typeof DecodificadorLoRaWANSchema>;
export type IMetodoClaveLoRaWAN = z.infer<typeof MetodoClaveLoRaWANSchema>;
export type IClaseLoRaWAN = z.infer<typeof ClaseLoRaWANSchema>;
export type IActivacionLoRaWAN = z.infer<typeof ActivacionLoRaWANSchema>;
export type IMacVersionLoRaWAN = z.infer<typeof MacVersionLoRaWANSchema>;
export type IRegParamsRevisionLoRaWAN = z.infer<typeof RegParamsRevisionLoRaWANSchema>;
export type ILotePerfilDecodificacion = z.infer<typeof LotePerfilDecodificacionSchema>;
export type IPerfilDecodificacion = z.infer<typeof PerfilDecodificacionSchema>;
export type ICreatePerfilDecodificacion = z.infer<typeof CreatePerfilDecodificacionSchema>;
export type IUpdatePerfilDecodificacion = z.infer<typeof UpdatePerfilDecodificacionSchema>;
