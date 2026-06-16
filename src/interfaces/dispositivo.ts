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
  // en el propio device (smart events) o en el edge (RPi5+Hailo) — el proveedor
  // se declara por capacidad en `capacidades.video.<tipo>.proveedor` (D49).
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
 * Proveedor de UNA capacidad de video (D49, Capa 1). `Dispositivo` = el NVR/XVR
 * la produce con smart event propio (IVS/AcuSense). `Edge` = la inferencia la
 * corre el edge (RPi5+Hailo) sobre el stream. Reemplaza al viejo
 * `fuenteInferencia` per-device: el proveedor se modela POR capacidad, así un
 * mismo device puede tener persona on-device y ANPR via edge.
 */
export const ProveedorCapacidadSchema = z.enum(["Dispositivo", "Edge"]);

/**
 * Tipo de stream dentro de una cámara/canal. Main = alta calidad (identificación);
 * Sub = baja calidad (detección barata). Estrategia de dos etapas (ver doc 03).
 */
export const TipoStreamSchema = z.enum(["Main", "Sub", "Otro"]);

/**
 * Un stream de una cámara (= un perfil ONVIF). Una misma cámara expone varios
 * (main/sub) — distinta calidad del MISMO video, no cámaras distintas.
 */
export const StreamCanalSchema = z.object({
  tipo: TipoStreamSchema.optional(),
  // Token del perfil ONVIF (GetProfiles). Identifica el stream en el device.
  token: z.string(),
  rtspUri: z.string().optional(),
  codec: z.string().optional(), // H264 / H265 / ...
  width: z.number().int().optional(),
  height: z.number().int().optional(),
  // Mensaje si GetStreamUri de ESTE stream falló (el resto del canal igual sirve).
  uriError: z.string().optional(),
});

/**
 * Canal/cámara de un NVR/XVR (M1, reestructurado). Un grabador agrupa N cámaras
 * físicas; cada cámara expone uno o más `streams` (main/sub = misma cámara,
 * distinta calidad). El `canal` (id de la cámara física, derivado del
 * VideoSourceConfiguration.SourceToken de ONVIF) matchea
 * `IDispositivoAcceso.canalDispositivo` e `IDeteccion.canalDispositivo` — se
 * referencia la CÁMARA, no un stream puntual.
 */
export const CanalDispositivoSchema = z.object({
  canal: z.string(),
  nombre: z.string().optional(),
  habilitado: z.boolean().optional(),
  // Streams de esta cámara (main/sub). El edge elige sub para detección y main
  // para identificación (doc 03).
  streams: z.array(StreamCanalSchema).optional(),
  // Perfil de stream curado (codec/res/fps) — FK a IPerfilCamara (opcional).
  idPerfilCamara: z.string().optional(),
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
 * Una capacidad de video con proveedor explícito (D49, Capa 1). `soportada`
 * habilita la capacidad; `proveedor` declara quién la produce (device vs edge).
 * Granularidad por capacidad: cubre el caso híbrido (persona on-device + ANPR
 * via edge) que el viejo `fuenteInferencia` per-device no podía expresar.
 */
export const CapacidadVideoSchema = z.object({
  soportada: z.boolean(),
  proveedor: ProveedorCapacidadSchema,
});

/**
 * Capacidades de detección/identificación de video, una por tipo, cada una con
 * su proveedor (D49, Capa 1). `identificacionFacial`/`identificacionPatente`
 * son el GATE de negocio (decisión E): solo un device/edge que IDENTIFICA puede
 * configurarse con aprobado/apertura automática en `IDispositivoAcceso`. La
 * validación vive cloud-side en acceso-api (regla custom, no exportable a JSON
 * Schema). Las de identificación además requieren enrolamiento.
 */
export const CapacidadesVideoSchema = z.object({
  persona: CapacidadVideoSchema.optional(),
  vehiculo: CapacidadVideoSchema.optional(),
  // ANPR — lectura/OCR de la placa (presencia de patente).
  patente: CapacidadVideoSchema.optional(),
  // Presencia de rostro (no implica identificar).
  rostro: CapacidadVideoSchema.optional(),
  // Identificación facial 1:N contra credenciales enroladas. GATE decisión E.
  identificacionFacial: CapacidadVideoSchema.optional(),
  // Identificación de patente 1:N contra padrón. GATE decisión E.
  identificacionPatente: CapacidadVideoSchema.optional(),
});

/**
 * Capacidades del dispositivo (D49, Capa 1). Declara SOLO lo intrínseco del
 * hardware; la detección/identificación de video lleva proveedor por capacidad
 * (device vs edge) en `video`. La capacidad EFECTIVA de un canal (intrínseco
 * device ⊕ catálogo de inferencia del edge) la resuelve acceso-api, no se
 * persiste.
 *
 * - HIK DS-K1T344MBWX-E1: `{ credencial:{face,card,pin}, enrolamiento:true,
 *   aperturaComando:true, video:{ identificacionFacial:{soportada,Dispositivo},
 *   rostro:{soportada,Dispositivo} } }`.
 * - NVR/XVR "tonto": `{ fuenteVideo:true }` y `video` vacío (lo aporta el edge).
 */
export const CapacidadesDispositivoSchema = z.object({
  // Modalidades de credencial — siempre on-device; gatean enrolamiento. Para el
  // HIK relevable vía el endpoint ISAPI `capabilities` de cada recurso (evita
  // pegarle con una modalidad `notSupport` y arriesgar lockout).
  credencial: z
    .object({
      face: z.boolean().optional(),
      card: z.boolean().optional(),
      pin: z.boolean().optional(),
      fingerprint: z.boolean().optional(),
    })
    .optional(),
  // Intrínsecos del device (sin proveedor — siempre los aporta el hardware):
  // entrega de stream(s) RTSP.
  fuenteVideo: z.boolean().optional(),
  // Apertura por comando (relé / ISAPI open).
  aperturaComando: z.boolean().optional(),
  // Almacena padrón facial/credencial on-device (HIK). Prerrequisito de las
  // capacidades de identificación provistas por el device.
  enrolamiento: z.boolean().optional(),
  // Detección/identificación de video, proveedor POR capacidad. Presente en
  // cámara/NVR/XVR (o terminal facial); ausente en lectores de credencial puros.
  video: CapacidadesVideoSchema.optional(),
});

// Entrada del historial de IPs LAN (auditoría DHCP drift). Schema nombrado
// (no inline) para no inflar la inferencia de tipos de la cadena de populate
// IDispositivo ⊂ IIngresoEgreso ⊂ IVinculoEventoIngreso (evita TS7056).
export const IpLanHistoricoEntrySchema = z.object({
  ip: z.string(),
  visto: z.string(),
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
    // Historial de IPs LAN observadas (auditoría de DHCP drift). Lo mantiene el
    // self-heal de `ipAddress`: top 5 últimas. Espejo de
    // IDispositivoDescubierto.ipLanHistorico. Doc 28-discovery-lan-edge.md.
    ipLanHistorico: z.array(IpLanHistoricoEntrySchema).optional(),
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
    // Nombre legible para identificar el device en la UI (ej. "NVR Portería",
    // "Cámara Entrada"). Lo setea el integrador; default al modelo si falta.
    nombre: z.string().optional(),
    // Datos específicos del dispositivo
    tipo: TipoDispositivoSchema.optional(),
    serialNumber: z.string().optional(),
    marca: z.string().optional(),
    modelo: z.string().optional(),
    // MAC del device — identidad estable cross-discovery (espejo de
    // IDispositivoDescubierto.macAddress). Se persiste al adoptar (el edge la
    // extrae en AdoptarResult.macAddress) y es la CLAVE del self-heal de
    // `config.ipAddress` ante DHCP drift: el matching device-descubierto ↔
    // registrado va por MAC (y serial), NUNCA por IP (que es lo que cambia).
    // Cloud SoT — no debería cambiar salvo reemplazo físico de hardware.
    // Doc 28-discovery-lan-edge.md.
    mac: z.string().optional(),
    config: ConfigDispositivoSchema.optional(),
    // Capacidades del device (D49, Capa 1): credencial + intrínsecos
    // (fuenteVideo/aperturaComando/enrolamiento) + `video` con proveedor por
    // capacidad. El proveedor per-capacidad reemplaza al viejo `fuenteInferencia`
    // per-device.
    capacidades: CapacidadesDispositivoSchema.optional(),
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
export type IProveedorCapacidad = z.infer<typeof ProveedorCapacidadSchema>;
export type ITipoStream = z.infer<typeof TipoStreamSchema>;
export type IStreamCanal = z.infer<typeof StreamCanalSchema>;
export type ICanalDispositivo = z.infer<typeof CanalDispositivoSchema>;
export type IEstadoDispositivo = z.infer<typeof EstadoDispositivoSchema>;
export type IConfigDispositivo = z.infer<typeof ConfigDispositivoSchema>;
export type ICapacidadVideo = z.infer<typeof CapacidadVideoSchema>;
export type ICapacidadesVideo = z.infer<typeof CapacidadesVideoSchema>;
export type ICapacidadesDispositivo = z.infer<
  typeof CapacidadesDispositivoSchema
>;
export type IDispositivo = z.infer<typeof DispositivoSchema>;
export type ICreateDispositivo = z.infer<typeof CreateDispositivoSchema>;
export type IUpdateDispositivo = z.infer<typeof UpdateDispositivoSchema>;
