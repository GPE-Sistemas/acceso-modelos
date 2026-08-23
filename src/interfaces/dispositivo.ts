import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import {
  ConfigOperacionDispositivoSchema,
  ConfiguracionReportadaDispositivoSchema,
} from "./config-operacion-dispositivo";
import { PerfilDispositivoSchema } from "./perfil-dispositivo";

/**
 * Form-factor / familia física del dispositivo (eje físico, single-select). NO
 * confundir con `capacidades` (lo que el device HACE, multivalor): las
 * modalidades de credencial (facial / huella / tarjeta / PIN) ya NO viven acá —
 * un terminal puede tener varias a la vez y se modelan en `capacidades.credencial`.
 * Este enum solo categoriza el hardware para UI/agrupación/iconografía.
 *
 * - `Terminal de control de acceso`: cualquier terminal de credencial (HIK
 *   K1T344 facial+tarjeta+PIN, K1T502 tarjeta+huella+PIN, lectores, teclados…).
 *   Sus modalidades concretas viven en `capacidades.credencial`.
 * - `Cámara IP` / `NVR` / `XVR`: fuentes de video / inferencia (módulo IA-video,
 *   M1). La cámara entrega stream; el NVR/XVR agrupa N canales. La inferencia
 *   corre en el device (smart events) o en el edge (RPi5+Hailo) — el proveedor
 *   se declara por capacidad en `capacidades.video.<tipo>.proveedor` (D49).
 * - `Otro`: fallback.
 *
 * La coherencia formFactor↔capacidades (Terminal ⇒ ≥1 credencial; Cámara/NVR/XVR
 * ⇒ sin credencial) es una regla custom validada cloud-side en acceso-api — no se
 * exporta a JSON Schema (igual que el gate de `identificacionFacial`).
 */
export const FormFactorDispositivoSchema = z.enum([
  "Terminal de control de acceso",
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
 * - HIK DS-K1T502DBFWX-C (sin facial; tarjeta+huella+pin + video intercom):
 *   `{ credencial:{card,fingerprint,pin}, enrolamiento:true, aperturaComando:true,
 *   fuenteVideo:true }` (RTSP del terminal para portería; sin identificación).
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

/**
 * Nivel de soporte del firmware que corre el dispositivo. Lo resuelve el cloud
 * contra el catálogo de `acceso-modelos/auxiliares/firmware` cada vez que el
 * edge reporta una versión nueva — el edge NO reimplementa la política.
 *
 * - `Soportado`: dentro de las versiones con las que operamos.
 * - `Actualización recomendada`: opera, pero conviene subirlo.
 * - `No soportado`: por debajo de la mínima. **Bloquea el enrolamiento de
 *   credenciales**, nunca la adopción — un device que no se puede adoptar
 *   tampoco se puede actualizar.
 * - `Desconocido`: falta el dato o el modelo no está en el catálogo. No bloquea.
 */
export const NivelSoporteFirmwareSchema = z.enum([
  "Soportado",
  "Actualización recomendada",
  "No soportado",
  "Desconocido",
]);

/**
 * Veredicto de soporte del firmware — **owner: cloud**. Derivado de
 * `inventario.firmware.version` + el catálogo por modelo. Se persiste (en vez de
 * calcularse en cada lectura) porque el agent edge lo consume del documento
 * replicado para gatear el enrolamiento, y el edge no tiene el catálogo.
 */
/**
 * Estado de una actualización de firmware en curso o de la última ejecutada.
 *
 * La operación es irreversible —el downgrade está bloqueado por el fabricante— y
 * el único rescate conocido ante un fallo grave exige power-cycle físico. Por eso
 * se registra cada fase: si algo sale mal, la diferencia entre "no llegó a
 * enviarse" y "se cortó a mitad del flasheo" cambia por completo qué hacer.
 *
 * - `Solicitada`: el comando se emitió, el edge todavía no lo tomó.
 * - `Descargando`: el edge está bajando el paquete y verificando su hash.
 * - `Enviando`: el archivo está viajando al terminal. **Fase crítica**: un corte
 *   acá puede dejar el equipo inutilizable.
 * - `Reiniciando`: el terminal aceptó el firmware y se está reiniciando solo.
 * - `Verificando`: el edge está releyendo la versión para confirmar el resultado.
 * - `Completada`: el terminal reporta la versión de destino.
 * - `Fallida`: ver `mensaje`.
 */
export const EstadoActualizacionFirmwareSchema = z.enum([
  "Solicitada",
  "Descargando",
  "Enviando",
  "Reiniciando",
  "Verificando",
  "Completada",
  "Fallida",
]);

export const ActualizacionFirmwareSchema = z.object({
  estado: EstadoActualizacionFirmwareSchema.optional(),
  idPaquete: z.string().optional(),
  versionOrigen: z.string().optional(),
  versionDestino: z.string().optional(),
  // Progreso que reporta el propio terminal, cuando lo reporta. Informativo: no
  // se gatea ninguna decisión en él.
  progreso: z.number().int().min(0).max(100).optional(),
  mensaje: z.string().optional(),
  // Correlación con la auditoría del comando (IComandoEdge.correlationId).
  idComandoEdge: z.string().optional(),
  // Quién la disparó. La actualización siempre nace de una acción manual de un
  // administrador — nunca es automática.
  solicitadaPorIdPermiso: z.string().optional(),
  iniciadaEn: z.string().optional(),
  finalizadaEn: z.string().optional(),
});

export const FirmwareDispositivoSchema = z.object({
  soporte: NivelSoporteFirmwareSchema.optional(),
  // Versión sobre la que se emitió este veredicto. Si difiere de la que reporta
  // el inventario, el veredicto quedó viejo.
  versionEvaluada: z.string().optional(),
  minimaSoportada: z.string().optional(),
  minimaRecomendada: z.string().optional(),
  // Frase lista para mostrar en la UI y para el motivo del skip de enrolamiento.
  motivo: z.string().optional(),
  // `true` ⇒ el edge saltea este device en el loop de enrolamiento.
  bloqueaEnrolamiento: z.boolean().optional(),
  evaluadoEn: z.string().optional(),
  // Actualización en curso, o la última ejecutada sobre este dispositivo.
  actualizacion: ActualizacionFirmwareSchema.optional(),
});

// ── Inventario relevado por el edge (owner: edge) ──────────────────────
// Todo lo de abajo sale de GETs ISAPI contra el terminal. El edge pisa el objeto
// `inventario` COMPLETO en cada reporte (no hace merge por campo): lo que el
// device dejó de exponer tiene que desaparecer, no quedar pegado de un relevo
// anterior. Por eso el veredicto de soporte vive fuera, en `firmware`.

/** Versión de firmware tal cual la reporta el device. */
export const FirmwareRelevadoSchema = z.object({
  // `<firmwareVersion>` — ej. "V4.31.0".
  version: z.string().optional(),
  // `<firmwareReleasedDate>` — ej. "build 250421".
  build: z.string().optional(),
  // `<hardwareVersion>`.
  hardwareVersion: z.string().optional(),
  // `<bspVersion>`. Un sufijo `_S<fecha><n>` marca rama BSP especial de
  // fábrica: dos equipos del mismo modelo pueden no ser la misma plataforma.
  bspVersion: z.string().optional(),
  // `<deviceType>` / `<subDeviceType>`.
  deviceType: z.string().optional(),
});

/** Configuración de red del device (`/ISAPI/System/Network/interfaces/1/ipAddress`). */
export const RedRelevadaSchema = z.object({
  ipAddress: z.string().optional(),
  macAddress: z.string().optional(),
  // `<addressingType>`: dynamic ⇒ DHCP. Relevante para cualquier operación
  // larga contra el device: un renew a mitad de camino es un corte.
  direccionamiento: z.enum(["DHCP", "Estática"]).optional(),
  subnetMask: z.string().optional(),
  gateway: z.string().optional(),
  dnsPrimario: z.string().optional(),
  // `<DNSEnable>`. En false el device no resuelve FQDN — el push por hostname
  // no llega aunque el slot esté bien configurado.
  dnsHabilitado: z.boolean().optional(),
  puerto: z.number().int().positive().optional(),
  // `/ISAPI/System/Network/ssh` → `<enabled>`. Canal de consola habilitable sin
  // tocar el hardware; útil como red de seguridad ante una operación riesgosa.
  sshHabilitado: z.boolean().optional(),
});

/** Hora del device (`/ISAPI/System/time` + `/time/ntpServers`). */
export const HoraRelevadaSchema = z.object({
  // `<timeMode>`: NTP | manual. En manual el reloj driftea sin corrección.
  modo: z.string().optional(),
  zona: z.string().optional(),
  local: z.string().optional(),
  // Diferencia contra el reloj del edge al momento del relevo. El drift de hora
  // rompe la validación de credenciales con vigencia.
  driftSegundos: z.number().int().optional(),
  ntpServidor: z.string().optional(),
});

/** Cómo llegan los eventos del device al edge. */
export const IngestaRelevadaSchema = z.object({
  // `push` = el device postea al edge; `pull` = el edge poolea AcsEvent.
  clase: z.enum(["push", "pull"]).optional(),
  // Slot 1 de `/ISAPI/Event/notification/httpHosts` tal como está hoy en el
  // device — sirve para detectar drift contra lo que el edge cree haber puesto.
  host: z.string().optional(),
  puerto: z.number().int().positive().optional(),
  protocolo: z.string().optional(),
  formato: z.string().optional(),
  autenticacion: z.string().optional(),
});

/**
 * Vínculo del device con la nube del fabricante
 * (`/ISAPI/System/onlineUpgrade/server`). Con `servidorUpgradeConectado` en
 * true hay un segundo actor con capacidad de escribir el firmware del equipo
 * sin pasar por nosotros — es un dato de gobierno, no una curiosidad.
 */
export const NubeFabricanteRelevadaSchema = z.object({
  servidorUpgradeConectado: z.boolean().optional(),
  versionDisponible: z.string().optional(),
  hayVersionNueva: z.boolean().optional(),
});

/**
 * Inventario del device relevado por el agent edge — **owner: edge**. Se reporta
 * por outbox `dispositivo`/update en un tick lento, gateado a devices Online
 * (cada GET va autenticado; pegarle a un device con la credencial mal extiende
 * el lockout).
 */
export const InventarioDispositivoSchema = z.object({
  actualizadoEn: z.string().optional(),
  firmware: FirmwareRelevadoSchema.optional(),
  red: RedRelevadaSchema.optional(),
  hora: HoraRelevadaSchema.optional(),
  ingesta: IngestaRelevadaSchema.optional(),
  nube: NubeFabricanteRelevadaSchema.optional(),
  // Mensaje del relevo que falló parcialmente. El inventario es best-effort: un
  // endpoint que no responde no invalida el resto de lo relevado.
  error: z.string().optional(),
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
    // Form-factor / familia física (eje físico). Las modalidades de credencial
    // (facial/huella/tarjeta/PIN) NO van acá — viven en `capacidades.credencial`
    // (multivalor). Coherencia formFactor↔capacidades validada en acceso-api.
    formFactor: FormFactorDispositivoSchema.optional(),
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
        // ISAPI AccessControl/CardInfo/Count → cardNumber (terminal con tarjeta).
        cardNumber: z.number().int().nonnegative().optional(),
        // ISAPI AccessControl/FingerPrint count → fingerNumber (terminal con huella).
        fingerNumber: z.number().int().nonnegative().optional(),
        // Capacidad facial del modelo (datasheet; DS-K1T344 = 3000).
        capacidadFaces: z.number().int().positive().optional(),
        // Capacidad de tarjetas del modelo (datasheet; DS-K1T502 = 100000).
        capacidadCards: z.number().int().positive().optional(),
        // Capacidad de huellas del modelo (datasheet; DS-K1T502 = 10000).
        capacidadFingers: z.number().int().positive().optional(),
        // Timestamp ISO del último refresh de los contadores.
        actualizadoEn: z.string().optional(),
      })
      .optional(),
    // Inventario relevado por el edge (firmware, red, hora, ingesta, nube del
    // fabricante). Owner edge — se pisa entero en cada reporte.
    inventario: InventarioDispositivoSchema.optional(),
    // Veredicto de soporte del firmware. Owner cloud — lo deriva acceso-api del
    // `inventario.firmware.version` contra el catálogo por modelo. El edge lo lee
    // (no lo calcula) para gatear el enrolamiento de credenciales.
    firmware: FirmwareDispositivoSchema.optional(),
    // --- Configuración de operación del device (D51) ---
    // Doc 40-configuracion-dispositivos.md. Distinguir de `config` (credenciales
    // ISAPI + red + video, input del integrador): esto es la config OPERATIVA del
    // terminal (voz, pantalla, privacidad, imágenes por evento) modelada como
    // estado deseado que el edge persigue y verifica.
    //
    // Perfil asignado (cloud SoT). El deseado efectivo = perfil ⊕ configDeseada.
    idPerfilDispositivo: z.string().optional(),
    // Overrides por dispositivo: pisan el perfil campo a campo. Sparse — lo que
    // no está declarado ni acá ni en el perfil NO se gestiona (el reconciliador
    // no lo toca, para no pisar ajustes manuales legítimos del integrador).
    configDeseada: ConfigOperacionDispositivoSchema.optional(),
    // Bloque REPORTADO por el edge (real + soportados + diffs + estado + backoff).
    // Llega por outbox con merge; nunca pisa `config` ni `configDeseada`. Mismo
    // patrón que la telemetría de liveness y `enrolamiento` (H-DEV-8).
    configuracion: ConfiguracionReportadaDispositivoSchema.optional(),
    // Populate
    cliente: ClienteSchema.optional(),
    complejo: ComplejoSchema.optional(),
    perfilDispositivo: PerfilDispositivoSchema.optional(),
  });

export const CreateDispositivoSchema = DispositivoSchema.omit({
  _id: true,
  fechaCreacion: true,
});

export const UpdateDispositivoSchema = DispositivoSchema.omit({
  _id: true,
  fechaCreacion: true,
}).partial();

export type IFormFactorDispositivo = z.infer<typeof FormFactorDispositivoSchema>;
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
export type INivelSoporteFirmwareDispositivo = z.infer<
  typeof NivelSoporteFirmwareSchema
>;
export type IEstadoActualizacionFirmware = z.infer<
  typeof EstadoActualizacionFirmwareSchema
>;
export type IActualizacionFirmware = z.infer<
  typeof ActualizacionFirmwareSchema
>;
export type IFirmwareDispositivo = z.infer<typeof FirmwareDispositivoSchema>;
export type IFirmwareRelevado = z.infer<typeof FirmwareRelevadoSchema>;
export type IRedRelevada = z.infer<typeof RedRelevadaSchema>;
export type IHoraRelevada = z.infer<typeof HoraRelevadaSchema>;
export type IIngestaRelevada = z.infer<typeof IngestaRelevadaSchema>;
export type INubeFabricanteRelevada = z.infer<
  typeof NubeFabricanteRelevadaSchema
>;
export type IInventarioDispositivo = z.infer<
  typeof InventarioDispositivoSchema
>;
