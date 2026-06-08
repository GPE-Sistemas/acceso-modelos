import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";

export const TipoDispositivoSchema = z.enum([
  "Terminal de reconocimiento facial",
  "Lector de huella digital",
  "Lector de tarjeta",
  "Teclado numérico",
  // Fuentes de video / inferencia (módulo IA-video, M1). La cámara entrega
  // stream; el NVR/XVR agrupa N canales de cámara. La inferencia puede correr
  // en el propio device (smart events) o en el edge (RPi5+Hailo) — ver
  // `fuenteInferencia`.
  "Cámara IP",
  "NVR",
  "XVR",
  "Otro",
]);

/**
 * Protocolo por el que el sistema habla con el device de video (M1). ONVIF es el
 * baseline agnóstico al fabricante; RTSP directo cuando se conoce la URI; los
 * SDK propietarios (Dahua HTTP API, Hikvision ISAPI) como fallback cuando ONVIF
 * no expone lo necesario. Doc: acceso-ia-video/docs/investigacion/01-onvif-nvr-xvr.md.
 */
export const ProtocoloDispositivoSchema = z.enum([
  "ONVIF",
  "RTSP",
  "SDK-Dahua",
  "ISAPI-Hikvision",
]);

/**
 * Quién infiere sobre el stream (M1, def #3 del doc 01). `Dispositivo` = el
 * NVR/XVR emite smart events propios (IVS/AcuSense). `Edge` = el NVR/XVR solo
 * entrega stream y la inferencia la corre el edge (RPi5+Hailo). Baseline del
 * proyecto: `Edge` (soportar NVR de solo-stream).
 */
export const FuenteInferenciaSchema = z.enum(["Dispositivo", "Edge"]);

/**
 * Canal de un NVR/XVR (M1). Un grabador agrupa N canales; cada canal es una
 * cámara con su propio stream y, opcionalmente, su perfil. El `canal` matchea
 * `IDispositivoAcceso.canalDispositivo` para ligar un canal a un acceso.
 */
export const CanalDispositivoSchema = z.object({
  canal: z.string(),
  nombre: z.string().optional(),
  // Override de la URI RTSP de este canal (si no, se deriva de config.rtspUriPlantilla).
  rtspUri: z.string().optional(),
  // Perfil de stream (codec/res/fps) de este canal — FK a IPerfilCamara.
  idPerfilCamara: z.string().optional(),
  habilitado: z.boolean().optional(),
});

// Estado runtime reportado por el agent edge (H-DEV-5 / H-DEV-8).
// Owner único del estado: el agent edge Go (acceso-edge), que ya mide
// reachability via ISAPI UserCheck (60s) + lockout (401) + drift. acceso-dispositivos
// (Node) solo aporta `ultimaVistaHeartbeat` desde el HTTP Push del terminal.
// - `Pendiente Adopción`: el IDispositivo existe en cloud pero el edge todavía
//   no completó el handshake (test cred + reconfig push).
// - `Online`: reachable (ISAPI userCheck OK).
// - `Degradado`: reachable pero con fallos parciales (N fallos < umbral Offline,
//   drift de hora detectado, o errores intermitentes). Entre Online y Offline.
// - `Offline`: 5 fails consecutivos de reachability.
// - `Locked`: device reporta `lockStatus=lock` (lockout por intentos cred).
// - `Desconocido`: el edge dejó de reportar este dispositivo (staleness cloud-side,
//   análogo al lag>90s de IEdgeAppliance). No es lo mismo que Offline: el cloud
//   no sabe el estado real porque su única fuente (el edge) no reporta.
// Doc: acceso-doc-general/29-hik-terminal-adopcion.md § Monitoreo runtime.
export const EstadoDispositivoSchema = z.enum([
  "Pendiente Adopción",
  "Online",
  "Degradado",
  "Offline",
  "Locked",
  "Desconocido",
]);

/**
 * Capacidades del dispositivo: qué modalidades de credencial soporta (spec §3.3).
 * Gatea el enrolamiento — el edge solo intenta materializar lo compatible (evita
 * pegarle al device con una modalidad `notSupport` y arriesgar lockout).
 * Derivable de marca/modelo (catálogo) o relevable vía el endpoint ISAPI
 * `capabilities` de cada recurso.
 * Para el HIK DS-K1T344MBWX-E1: `{ face:true, card:true, pin:true, fingerprint:false }`.
 */
/**
 * Capacidades de detección/inferencia de video (M1). Qué puede inferir el device
 * sobre el stream — sea por smart event propio o vía edge+Hailo. Escalón del doc 01:
 * persona → vehiculo → patente → rostro → identificacionRostro.
 *
 * `identificacionRostro` es el GATE de negocio (decisión E): solo un device que
 * identifica (matchea contra credencial) puede configurarse con aprobado/apertura
 * automática en `IDispositivoAcceso`. Un device que solo detecta genera evento
 * pendiente de guardia. La validación vive cloud-side en acceso-api (regla custom,
 * no exportable a JSON Schema).
 */
export const CapacidadesDeteccionSchema = z.object({
  persona: z.boolean().optional(),
  vehiculo: z.boolean().optional(),
  patente: z.boolean().optional(),
  // Detecta presencia de rostro (no implica identificar).
  rostro: z.boolean().optional(),
  // Identifica el rostro contra credenciales enroladas (1:N). GATE decisión E.
  identificacionRostro: z.boolean().optional(),
});

export const CapacidadesDispositivoSchema = z.object({
  // Modalidades de credencial (gatean enrolamiento, terminal de acceso).
  face: z.boolean().optional(),
  card: z.boolean().optional(),
  pin: z.boolean().optional(),
  fingerprint: z.boolean().optional(),
  // Capacidades de detección de video (módulo IA-video). Presente en
  // cámara/NVR/XVR; ausente en terminales de credencial.
  deteccion: CapacidadesDeteccionSchema.optional(),
});

export const ConfigDispositivoSchema = z.object({
    username: z.string().optional(),
    password: z.string().optional(),
    apikey: z.string().optional(),
    // IP LAN del device. La resuelve discovery (MAC↔IP) + adopción la persiste.
    // Mutable por DHCP del integrador — discovery refresca cuando detecta cambio.
    ipAddress: z.string().optional(),
    // Puerto HTTPS ISAPI; default 443. Algunos firmwares HIK escuchan en 80
    // (forzar via `useHttp=true`).
    port: z.number().int().positive().optional(),
    useHttp: z.boolean().optional(),
    // --- Video / inferencia (M1) — presente en cámara/NVR/XVR ---
    // Protocolo de integración del stream/eventos.
    protocolo: ProtocoloDispositivoSchema.optional(),
    // Plantilla de URI RTSP para derivar el stream por canal
    // (ej. 'rtsp://{ip}:554/cam/realmonitor?channel={canal}&subtype=1').
    // Un canal puede overridear con su propia `rtspUri`.
    rtspUriPlantilla: z.string().optional(),
    // Perfil de stream por default (codec/res/fps) — FK a IPerfilCamara.
    idPerfilCamara: z.string().optional(),
    // Canales del grabador (NVR/XVR). Vacío/ausente en cámara IP de un solo canal.
    canales: z.array(CanalDispositivoSchema).optional(),
  });

export const DispositivoSchema = z.object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    habilitado: z.boolean().optional(),
    idCliente: z.string().optional(),
    idComplejo: z.string().optional(),
    // Datos específicos del dispositivo
    tipo: TipoDispositivoSchema.optional(),
    serialNumber: z.string().optional(),
    marca: z.string().optional(),
    modelo: z.string().optional(),
    config: ConfigDispositivoSchema.optional(),
    // Modalidades de credencial que soporta el device (spec §3.3). Gatea el
    // enrolamiento por compatibilidad. Para cámara/NVR/XVR incluye además el
    // bloque `deteccion` (capacidades de inferencia de video, M1).
    capacidades: CapacidadesDispositivoSchema.optional(),
    // Quién infiere sobre el stream (M1, def #3). `Dispositivo` = smart events
    // propios del NVR/XVR; `Edge` = inferencia en el edge (RPi5+Hailo). Solo
    // aplica a cámara/NVR/XVR.
    fuenteInferencia: FuenteInferenciaSchema.optional(),
    // Sharding edge — qué appliance recibe el HTTP Push del terminal.
    // Vacío en complejos N=1 (Standalone): el único edge es dueño implícito.
    idEdgeAppliancePrimario: z.string().optional(),
    idEdgeApplianceSecundario: z.string().optional(),
    // Estado runtime reportado por el agent edge (H-DEV-5 / H-DEV-8).
    estado: EstadoDispositivoSchema.optional(),
    // --- Telemetría de liveness por dispositivo (H-DEV-8) ---
    // El edge (owner del estado) reporta estos campos al cloud por un canal/endpoint
    // hermano del heartbeat del appliance. El cloud materializa; la web los lee y
    // recalcula el lag client-side (Date.now() vs estadoActualizado) para que el
    // badge "envejezca" sin esperar el próximo evento. NO hay polling cloud→terminal.
    //
    // Timestamp ISO del último refresh de `estado`. Habilita detección de staleness
    // en la UI ("Online ¿desde cuándo?") y el corte a `Desconocido` cloud-side.
    estadoActualizado: z.string().optional(),
    // Timestamp ISO del último heartbeat visto. Doble fuente: el HTTP Push del
    // terminal (eventType=heartBeat, ~30s, lo aporta acceso-dispositivos) y/o el
    // UserCheck OK del edge (~60s).
    ultimaVistaHeartbeat: z.string().optional(),
    // Segundos desde `ultimaVistaHeartbeat`/último check OK (espejo de IEdgeAppliance).
    lagHeartbeatSegundos: z.number().optional(),
    // Contador de fallos de reachability consecutivos. El edge corta a Offline a los
    // 5; exponerlo habilita el estado intermedio Degradado y el troubleshooting.
    consecutivosFallos: z.number().int().nonnegative().optional(),
    // Último mensaje de error del check ISAPI fallido (para el detalle de la UI).
    ultimoHeartbeatError: z.string().optional(),
    // Detalle de lockout cuando estado=Locked (derivado del UserCheck/401 del edge).
    // Coherente con AdoptarResult.lockStatus/unlockTime (dispositivo-descubierto.ts).
    lockout: z
      .object({
        unlockTimeRemainingSec: z.number().int().nonnegative().optional(),
        lockedSince: z.string().optional(),
      })
      .optional(),
    // --- Diagnóstico de enrolamiento por device (spec 32 §10.3, espejo H-DEV-8) ---
    // El edge (owner) reporta los contadores reales del terminal vía outbox
    // (upsert merge — no pisa config). La web muestra capacidad usada (N/3000).
    enrolamiento: z
      .object({
        // ISAPI AccessControl/UserInfo/Count → userNumber.
        userNumber: z.number().int().nonnegative().optional(),
        // ISAPI Intelligent/FDLib/Count → faceNumber.
        faceNumber: z.number().int().nonnegative().optional(),
        // Capacidad facial del modelo (datasheet; DS-K1T344 = 3000).
        capacidadFaces: z.number().int().positive().optional(),
        // Timestamp ISO del último refresh de los contadores.
        actualizadoEn: z.string().optional(),
      })
      .optional(),
    // Populate
    cliente: ClienteSchema.optional(),
    complejo: ComplejoSchema.optional(),
  });

export const CreateDispositivoSchema = DispositivoSchema.omit({
  _id: true,
  fechaCreacion: true,
});

export const UpdateDispositivoSchema = DispositivoSchema.omit({
  _id: true,
  fechaCreacion: true,
}).partial();

export type ITipoDispositivo = z.infer<typeof TipoDispositivoSchema>;
export type IProtocoloDispositivo = z.infer<typeof ProtocoloDispositivoSchema>;
export type IFuenteInferencia = z.infer<typeof FuenteInferenciaSchema>;
export type ICanalDispositivo = z.infer<typeof CanalDispositivoSchema>;
export type IEstadoDispositivo = z.infer<typeof EstadoDispositivoSchema>;
export type IConfigDispositivo = z.infer<typeof ConfigDispositivoSchema>;
export type ICapacidadesDeteccion = z.infer<
  typeof CapacidadesDeteccionSchema
>;
export type ICapacidadesDispositivo = z.infer<
  typeof CapacidadesDispositivoSchema
>;
export type IDispositivo = z.infer<typeof DispositivoSchema>;
export type ICreateDispositivo = z.infer<typeof CreateDispositivoSchema>;
export type IUpdateDispositivo = z.infer<typeof UpdateDispositivoSchema>;
