import { z } from "zod";
import { ClienteSchema } from "./cliente";

/**
 * IServidorRedLorawan — network server LoRaWAN AJENO al que reportan equipos
 * del catálogo (D74, acceso-doc-general doc 59). Hoy: el ChirpStack v3 de Gas.
 *
 * El equipo tiene sesión en ese NS, no en el ChirpStack del edge. Los uplinks
 * llegan porque acceso-api se suma a la integración HTTP de cada application
 * del NS que tiene equipos nuestros (§4.5: leer, agregar la URL, guardar,
 * releer; nunca crear otra, hay una sola por application), y el edge del
 * complejo los procesa con la misma ingesta que los locales.
 *
 * Nivel Cliente, cloud-only: el edge solo necesita saber que un equipo es de
 * red externa (`conectividad.lora.red`). El token y el secreto de ingesta se
 * guardan cifrados (AES-256-GCM, `CIFRADO_CAMPOS_LLAVE`) y nunca salen en un
 * GET: se exponen `tieneToken`.
 */

export const TipoServidorRedLorawanSchema = z.enum(["ChirpStackV3", "ChirpStackV4"]);

/**
 * Estado de la integración HTTP de una application del NS, medido por el
 * reconciliador de acceso-api (se relee después de escribir).
 * - `Configurada`: nuestra URL está en la integración.
 * - `Error`: no se pudo leer o escribir (ver `error`).
 * - `Retirada`: la application ya no tiene equipos nuestros y se sacó la URL.
 */
export const EstadoIntegracionServidorRedSchema = z.enum(["Configurada", "Error", "Retirada"]);

export const IntegracionServidorRedSchema = z.object({
  applicationId: z.string(),
  estado: EstadoIntegracionServidorRedSchema,
  /** La application no tenía integración HTTP y la creamos nosotros: es la
   *  única que se puede borrar al retirarse. Con la de Gas solo se saca la URL. */
  creadaPorColiving: z.boolean().optional(),
  verificadaEn: z.string().optional(),
  /** Última vez que la URL faltaba (gas-admin recreó la integración) y se repuso. */
  repuestaEn: z.string().optional(),
  reposiciones: z.number().int().optional(),
  error: z.string().optional(),
});

export const DiagnosticoServidorRedSchema = z.object({
  ultimoUplinkEn: z.string().optional(),
  uplinksAceptados: z.number().int().optional(),
  /** devEUI que no está en el catálogo como red externa de este NS: la
   *  application del NS puede tener equipos de otros clientes. No se guardan. */
  descartadosDesconocido: z.number().int().optional(),
  /** devEUI del catálogo pero declarado con otra red: config cruzada. */
  descartadosRedCruzada: z.number().int().optional(),
  ultimoDescartadoDevEUI: z.string().optional(),
  reconciliadoEn: z.string().optional(),
  errorReconciliacion: z.string().optional(),
});

export const ServidorRedLorawanSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idCliente: z.string(),
  nombre: z.string(),
  tipo: TipoServidorRedLorawanSchema,
  /** Base de la API REST del NS (`https://lns.ejemplo.com`), sin `/api`. */
  url: z.string(),
  /** API key del NS (`Grpc-Metadata-Authorization: Bearer` en v3). Sin token
   *  no hay integración automática ni downlinks. Nunca sale en un GET. */
  tokenCifrado: z.string().optional(),
  tieneToken: z.boolean().optional(),
  /** Secreto del path de ingesta (`/lorawan/uplinks-externos/:id/:secreto`).
   *  Lo genera acceso-api; solo existe en la URL que el reconciliador escribe
   *  en el NS. Cifrado (no hash) porque el reconciliador tiene que reconstruir
   *  la URL para buscarla en la integración. Nunca sale en un GET. */
  secretoIngestaCifrado: z.string().optional(),
  /** Presupuesto de downlinks por hora para todo el NS (F2, doc 59 §5.2). */
  presupuestoDownlinksPorHora: z.number().int().positive().optional(),
  activo: z.boolean().optional(),
  /** Owner acceso-api (reconciliador / ingesta). */
  integraciones: z.array(IntegracionServidorRedSchema).optional(),
  diagnostico: DiagnosticoServidorRedSchema.optional(),
  // Populate
  cliente: ClienteSchema.optional(),
});

/** El token viaja en claro solo en el body; acceso-api lo cifra. */
export const CreateServidorRedLorawanSchema = ServidorRedLorawanSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  tokenCifrado: true,
  tieneToken: true,
  secretoIngestaCifrado: true,
  integraciones: true,
  diagnostico: true,
  cliente: true,
}).extend({
  token: z.string().min(1).optional(),
});

/** `token: null` borra el token (corta integración automática y downlinks). */
export const UpdateServidorRedLorawanSchema = CreateServidorRedLorawanSchema.partial().extend({
  token: z.string().min(1).nullable().optional(),
});

/** Estado de un equipo respecto de la ingesta externa: lo que el reconciliador
 *  resolvió en el NS (`GET /servidores-red-lorawan/:id/equipos`). */
export const EquipoServidorRedSchema = z.object({
  idDispositivo: z.string(),
  devEUI: z.string(),
  nombre: z.string().optional(),
  idComplejo: z.string().optional(),
  applicationId: z.string().optional(),
  error: z.string().optional(),
});

export type ITipoServidorRedLorawan = z.infer<typeof TipoServidorRedLorawanSchema>;
export type IEstadoIntegracionServidorRed = z.infer<typeof EstadoIntegracionServidorRedSchema>;
export type IIntegracionServidorRed = z.infer<typeof IntegracionServidorRedSchema>;
export type IDiagnosticoServidorRed = z.infer<typeof DiagnosticoServidorRedSchema>;
export type IServidorRedLorawan = z.infer<typeof ServidorRedLorawanSchema>;
export type ICreateServidorRedLorawan = z.infer<typeof CreateServidorRedLorawanSchema>;
export type IUpdateServidorRedLorawan = z.infer<typeof UpdateServidorRedLorawanSchema>;
export type IEquipoServidorRed = z.infer<typeof EquipoServidorRedSchema>;

// ── Uplinks recibidos del NS externo ─────────────────────────────────────────

/** Días que acceso-datos guarda un uplink externo (igual que `uplink_crudo`
 *  del edge): ventana para que un edge caído recupere lo pendiente. */
export const DIAS_RETENCION_UPLINK_EXTERNO = 30;

/**
 * Evento `up` normalizado al formato de la integración de ChirpStack v4 (lo
 * que el edge ya entiende, `UplinkChirpStack` en `internal/lorawan`): solo los
 * campos que usa la ingesta. EUI en minúsculas, `data` en base64.
 */
export const EventoUplinkNormalizadoSchema = z.object({
  deduplicationId: z.string(),
  time: z.string(),
  deviceInfo: z.object({
    devEui: z.string(),
    applicationId: z.string().optional(),
  }),
  fCnt: z.number().int(),
  fPort: z.number().int(),
  data: z.string(),
  rxInfo: z.array(
    z.object({
      gatewayId: z.string(),
      rssi: z.number(),
      snr: z.number(),
    }),
  ),
  txInfo: z.object({
    frequency: z.number().optional(),
    modulation: z
      .object({
        lora: z.object({ spreadingFactor: z.number().int().optional() }).optional(),
      })
      .optional(),
  }),
});

/**
 * Un uplink de un NS externo, pendiente de que lo procese el edge del complejo
 * (doc 59 §4.2). `_id` determinístico (devEUI + fCnt + hora): el NS reintenta
 * el webhook y la misma trama no se duplica. El edge la busca por cursor
 * (`recibidoEn` + `_id`) y la pasa por la misma ingesta que un uplink local.
 */
export const UplinkExternoSchema = z.object({
  _id: z.string(),
  idCliente: z.string(),
  idComplejo: z.string(),
  idDispositivo: z.string(),
  idServidorRed: z.string(),
  devEUI: z.string(),
  /** Recepción en acceso-api (ISO): eje del cursor. */
  recibidoEn: z.string(),
  evento: EventoUplinkNormalizadoSchema,
  expireAt: z.string().optional(),
});

/** Respuesta de `GET /sync/lorawan/uplinks-externos` (edge). */
export const PaginaUplinksExternosSchema = z.object({
  datos: z.array(UplinkExternoSchema),
  /** Hay más después del último: el edge vuelve a pedir enseguida. */
  hayMas: z.boolean(),
});

export type IEventoUplinkNormalizado = z.infer<typeof EventoUplinkNormalizadoSchema>;
export type IUplinkExterno = z.infer<typeof UplinkExternoSchema>;
export type IPaginaUplinksExternos = z.infer<typeof PaginaUplinksExternosSchema>;
