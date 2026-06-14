import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";

// Rol del appliance dentro del complejo. Standalone = único edge (caso N=1).
export const EdgeApplianceRolSchema = z.enum([
  "Standalone",
  "Primary",
  "Secondary",
]);

export const EdgeApplianceEstadoSchema = z.enum([
  "Provisionando",
  "Online",
  "Offline",
  "Degradado",
  // Decomiso reversible: agent revocado (Headscale node down, tokens denylist,
  // NATS decommission emitido). El registro Mongo se conserva. Volver a
  // `Provisionando` vía reissue de install token. Borrado físico = purge
  // (hard delete + nullify FKs + snapshot a `edge-appliance-purges`).
  "Decomisado",
]);

// D18: el appliance puede ser hardware productivo, una VM (KVM/QEMU/VBox/VMware)
// detectada via systemd-detect-virt, o un mini-PC genérico marcado como demo.
export const EdgeApplianceEntornoSchema = z.enum([
  "Productivo",
  "Virtualizado",
  "Demo",
]);

export const EdgeApplianceFlagEstadoSchema = z.enum([
  "DeteccionParcial",
  "CambioHardware",
  "CapacidadDesconocida",
  "SospechaTampering",
]);

// IEdgeHardwareSpec — auto-detectado por el agent al boot y heartbeat (B.S3).
export const EdgeHardwareSpecCpuInstruccionesSchema = z.enum([
  "AVX2",
  "AVX512",
  "NEON",
]);

export const EdgeHardwareSpecCpuSchema = z.object({
  modelo: z.string(),
  cores: z.number().int().nonnegative(),
  threads: z.number().int().nonnegative(),
  frecuenciaBaseGHz: z.number().nonnegative(),
  frecuenciaBoostGHz: z.number().nonnegative().optional(),
  instrucciones: z.array(EdgeHardwareSpecCpuInstruccionesSchema).optional(),
  quickSync: z.boolean().optional(),
});

export const EdgeHardwareSpecStorageRolSchema = z.enum([
  "System",
  "Data",
  "Video",
]);

export const EdgeHardwareSpecStorageTipoSchema = z.enum([
  "NVMe",
  "SSD",
  "HDD",
]);

export const EdgeHardwareSpecStorageSchema = z.object({
  rol: EdgeHardwareSpecStorageRolSchema,
  tipo: EdgeHardwareSpecStorageTipoSchema,
  capacityGB: z.number().nonnegative(),
  modelo: z.string().optional(),
});

export const EdgeHardwareSpecAcceleratorTipoSchema = z.enum([
  "Coral-USB",
  "Coral-M2",
  "Hailo-8",
  "Hailo-8L",
  "Jetson-Orin-NX",
  "Jetson-Orin-Nano",
  "CPU-OpenVINO",
]);

export const EdgeHardwareSpecAcceleratorSchema = z.object({
  tipo: EdgeHardwareSpecAcceleratorTipoSchema,
  topsInt8: z.number().nonnegative().optional(),
  topsFp16: z.number().nonnegative().optional(),
});

export const EdgeHardwareSpecGpuTipoSchema = z.enum([
  "IntelQuickSync",
  "IntelArc",
  "NvidiaRTX",
  "AMD-VAAPI",
  "Integrated",
]);

export const EdgeHardwareSpecGpuSchema = z.object({
  tipo: EdgeHardwareSpecGpuTipoSchema,
  vramGB: z.number().nonnegative().optional(),
});

export const EdgeHardwareSpecNicTipoSchema = z.enum(["Ethernet", "WiFi"]);

export const EdgeHardwareSpecNicSchema = z.object({
  velocidadGbps: z.number().nonnegative(),
  tipo: EdgeHardwareSpecNicTipoSchema,
});

// Generación PCIe del enlace activo del acelerador (no la capacidad máxima de la
// placa). RPi5 + AI HAT+ negocia Gen2 por default y duplica throughput forzando
// Gen3 (dtparam=pciex1_gen=3) — el cálculo de capacidad lo usa como factor.
export const EdgeHardwareSpecPcieGenSchema = z.enum([
  "Gen1",
  "Gen2",
  "Gen3",
  "Gen4",
]);

// Codecs que el host decodifica por hardware. Define cuántos streams RTSP
// soporta sin saturar CPU: el RPi5 decodifica H265/HEVC por HW pero NO H264
// (cae a software, caro). En x86 con QuickSync/VAAPI suele cubrir ambos.
export const EdgeHardwareSpecCodecSchema = z.enum(["H264", "H265", "AV1"]);

export const EdgeHardwareSpecSchema = z.object({
  cpu: EdgeHardwareSpecCpuSchema,
  ramGB: z.number().nonnegative(),
  // storage / nics opcionales: el agent puede no detectarlos cuando el
  // container runtime carece de lsblk / ip (caso Alpine sin util-linux,
  // BusyBox limitado). En ese caso reporta `DeteccionParcial` en flags.
  storage: z.array(EdgeHardwareSpecStorageSchema).optional(),
  accelerator: EdgeHardwareSpecAcceleratorSchema.optional(),
  gpu: EdgeHardwareSpecGpuSchema.optional(),
  nics: z.array(EdgeHardwareSpecNicSchema).optional(),
  // Generación PCIe del enlace del acelerador. Opcional: solo se reporta cuando
  // hay accelerator PCIe y el agent puede leer `current_link_speed`.
  pcieGen: EdgeHardwareSpecPcieGenSchema.optional(),
  // Codecs con decode por hardware en el host. Opcional: best-effort, depende
  // de la plataforma (V4L2 en ARM, VAAPI/QuickSync en x86).
  decodeHwCodecs: z.array(EdgeHardwareSpecCodecSchema).optional(),
  tdpW: z.number().nonnegative().optional(),
  detectadoEn: z.string(),
});

// IEdgeCapacidad — derivada cloud-side del hardware detectado (A.S3, módulo
// sync/capacidad). versionReglasCapacidad permite reproducir el cálculo.
export const EdgeCapacidadCamarasSchema = z.object({
  maxAbsoluto: z.number().int().nonnegative(),
  porPerfil: z.record(z.string(), z.number().int().nonnegative()),
});

export const EdgeCapacidadInferenciaIaSchema = z.object({
  fpsTotal: z.number().nonnegative(),
  // Modelos que caben cargados simultáneamente en el acelerador (memoria del
  // chip). NO implica ejecución paralela — ver `modeloActivoUnico`.
  modelosSimultaneosMax: z.number().int().nonnegative(),
  // true para aceleradores que ejecutan UN modelo activo por vez y multiplexan
  // por time-slicing/scheduler (Hailo-8/8L, Coral). false para los que corren
  // varios modelos en paralelo real. Cambia cómo se reparte `fpsTotal` entre
  // pipelines: con time-slicing es throughput agregado, no FPS por modelo.
  modeloActivoUnico: z.boolean(),
});

export const EdgeCapacidadStorageVideoSchema = z.object({
  capacityGB: z.number().nonnegative(),
  bytesPorSegundoSostenido: z.number().nonnegative(),
});

export const EdgeCapacidadWebrtcSchema = z.object({
  viewersSimultaneosMax: z.number().int().nonnegative(),
});

// Catálogo de inferencia del edge (D49, Capa 1): qué tipos puede PRODUCIR el
// edge sobre un stream + con qué modelo/runtime. Es la fuente de verdad de "qué
// sabe detectar el edge"; el resolver de capacidad efectiva (acceso-api) lo une
// con lo intrínseco del device para habilitar/grisar config de detección.
export const TipoInferenciaSchema = z.enum([
  "persona",
  "vehiculo",
  "patente",
  "rostro",
  "identificacionFacial",
  "identificacionPatente",
]);

export const RuntimeInferenciaSchema = z.enum(["Hailo", "CPU-ONNX", "GPU"]);

export const InferenciaCatalogoItemSchema = z.object({
  tipo: TipoInferenciaSchema,
  // Identificador del modelo cargado (ej. "yolov8n-h8l", "lpr-onnx-cpu").
  modelo: z.string(),
  runtime: RuntimeInferenciaSchema,
  // Costo de throughput del modelo (FPS que consume del presupuesto del
  // acelerador). Reemplaza el coeficiente único `fpsTotal = tops×5`: permite
  // cargas heterogéneas y cascada. Optional hasta calibrar con BOM real.
  costoFps: z.number().nonnegative().optional(),
});

export const EdgeCapacidadSchema = z.object({
  camaras: EdgeCapacidadCamarasSchema,
  inferenciaIA: EdgeCapacidadInferenciaIaSchema,
  storageVideo: EdgeCapacidadStorageVideoSchema,
  webrtc: EdgeCapacidadWebrtcSchema,
  // Qué tipos sabe inferir este edge + con qué modelo (D49, Capa 1). Derivado
  // cloud-side del accelerator detectado + reglas versionadas.
  inferenciaCatalogo: z.array(InferenciaCatalogoItemSchema).optional(),
});

export const EdgeApplianceUtilizacionSchema = z.object({
  cpuPct: z.number(),
  ramPct: z.number(),
  storageVideoPct: z.number(),
  fpsIaUsados: z.number(),
  streamsActivos: z.number().int().nonnegative(),
  actualizadoEn: z.string(),
});

// IEdgeApplianceDiagnostico — sync detallado reportado por el agent en cada
// heartbeat (D32). La UI lo muestra en la tab "Sync" del detalle del
// appliance para troubleshoot sin SSH. Sumario barato (~500 bytes JSON);
// detalle profundo por entidad va por NATS request/reply on-demand.
export const EdgeApplianceNatsConnStateSchema = z.enum([
  "Inicial",
  "Conectado",
  "Reconectando",
  "Desconectado",
]);

export const EdgeApplianceIntegrityEntrySchema = z.object({
  // Conteo local Postgres edge.
  localCount: z.number().int().nonnegative(),
  // Conteo cloud reportado por GET /sync/integrity (último compare).
  // Optional: si el integrity cron todavía no corrió, sólo hay local.
  cloudCount: z.number().int().nonnegative().optional(),
  // Última vez que se detectó drift (local != cloud). ISO. Optional: nunca
  // hubo drift hasta ahora.
  lastDriftAt: z.string().optional(),
});

export const EdgeApplianceLastErrorSchema = z.object({
  // Código corto opcional (ej. "nats.publish.failed", "outbox.lock"). El
  // agent lo arma; sin convención cerrada aún.
  code: z.string().optional(),
  message: z.string(),
  at: z.string(),
});

// IEdgeApplianceDiagnosticoRed — diagnóstico de red del entorno del edge.
// Se rebuildea en cada heartbeat (cost bajo: dig + tcp connect locales).
// Permite al instalador y al panel admin identificar problemas operativos
// del network del cliente sin SSH al appliance (ver doc 27 — DNS rebind
// protection).
export const EdgeApplianceDiagnosticoRedSchema = z.object({
  // IP pública (WAN) del cliente, detectada via echo service externo
  // (ej. https://api.ipify.org). Útil para identificar ISP rápido y
  // correlacionar issues conocidos por carrier. Vacío si el edge no tiene
  // internet alcance al momento del check.
  ipPublica: z.string().optional(),
  // Default gateway de la primary interface LAN (`ip route show default`).
  gatewayDefault: z.string().optional(),
  // DNS resolver default según `/etc/resolv.conf` — típicamente el router
  // del cliente (puede ser el ISP en setups bridged).
  resolverDefault: z.string().optional(),
  // El resolver default devuelve la IP LAN para el FQDN del propio edge.
  // Si false → DNS rebind protection probable (o record DNS mal
  // configurado cloud-side, distinguible con `resolverPublicoResuelveLan`).
  resolverDefaultResuelveLan: z.boolean().optional(),
  // Un DNS público (1.1.1.1) devuelve la IP LAN para el FQDN del edge.
  // Si false → record DNS no propagado o IP LAN no cargada cloud-side.
  resolverPublicoResuelveLan: z.boolean().optional(),
  // Decisión agregada: `resolverPublicoResuelveLan === true` Y
  // `resolverDefaultResuelveLan === false` → router del cliente aplica
  // DNS rebind protection. Síntoma del bug del doc 27.
  dnsRebindDetectado: z.boolean().optional(),
  // Latencia round-trip TCP a acceso-api (ms). Heartbeat propio mide su
  // request total; útil para alertar links degradados.
  latenciaCloudMs: z.number().int().nonnegative().optional(),
  // MTU de la primary interface (bytes). Detecta tunneling fragmentation
  // issues raros.
  mtuPrimary: z.number().int().positive().optional(),
  // Última corrida del check.
  actualizadoEn: z.string().optional(),
});

export const EdgeApplianceDiagnosticoSchema = z.object({
  // Cantidad de filas pendientes en outbox edge (publish a NATS pendiente).
  outboxDepth: z.number().int().nonnegative(),
  // Resumen integrity por entidad. Key = nombre entidad (ej. "permisos",
  // "credenciales-dispositivos"). Valor = stats.
  integritySummary: z.record(z.string(), EdgeApplianceIntegrityEntrySchema),
  // Estado del cliente NATS del agent. Inicial = pre-connect; Conectado =
  // operativo; Reconectando = retry en curso; Desconectado = fallo
  // sostenido (heartbeat HTTP sigue funcionando).
  natsConnState: EdgeApplianceNatsConnStateSchema,
  // Último error capturado. Auto-clear si pasaron 15min sin error nuevo.
  lastError: EdgeApplianceLastErrorSchema.optional(),
  // Diagnóstico de network del entorno (resolver, gateway, ip pública,
  // detección de DNS rebind, etc.). Optional para back-compat con agents
  // < v1.24 que aún no reportan el bloque.
  red: EdgeApplianceDiagnosticoRedSchema.optional(),
  // Timestamp ISO del snapshot.
  actualizadoEn: z.string(),
});

// IEdgeAppliance — scalable-first: indice/fqdn/rol requeridos desde el día uno
// (caso N=1 → rol='Standalone', indice=0).
export const EdgeApplianceSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  habilitado: z.boolean().optional(),

  idCliente: z.string(),
  idComplejo: z.string(),
  indice: z.number().int().nonnegative(),
  fqdn: z.string(),
  rol: EdgeApplianceRolSchema,
  zonaCoverage: z.string().optional(),

  hostname: z.string().optional(),
  ipOverlay: z.string().optional(),
  // A.S8: IP LAN primaria detectada por el agent (no loopback, no Tailscale,
  // no link-local). El cloud publica record A `<slug>.edge.coliving.sh →
  // ipLan` para clientes LAN-only. Si vacío → solo publica overlay record
  // `<slug>.overlay.edge.coliving.sh → ipOverlay`.
  ipLan: z.string().optional(),

  estado: EdgeApplianceEstadoSchema,
  ultimoHeartbeat: z.string().optional(),
  versionAgent: z.string().optional(),
  versionHub: z.string().optional(),

  entorno: EdgeApplianceEntornoSchema,

  hardwareDetectado: EdgeHardwareSpecSchema.optional(),
  hardwareSpecHash: z.string().optional(),
  deteccionParcial: z.boolean().optional(),
  camposFaltantes: z.array(z.string()).optional(),

  capacidad: EdgeCapacidadSchema.optional(),
  versionReglasCapacidad: z.string().optional(),

  idEdgeApplianceModelo: z.string().optional(),
  bomCertificado: z.boolean(),
  hardwareMatchModelo: z.boolean().optional(),

  utilizacion: EdgeApplianceUtilizacionSchema.optional(),
  diagnostico: EdgeApplianceDiagnosticoSchema.optional(),
  flagsEstado: z.array(EdgeApplianceFlagEstadoSchema).optional(),

  // Decomiso reversible. Seteados cuando `estado='Decomisado'`. Quedan en
  // historial al volver a otro estado (no se limpian) para trazabilidad.
  fechaDecomiso: z.string().optional(),
  motivoDecomiso: z.string().optional(),
  idUsuarioDecomiso: z.string().optional(),

  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
});

export const CreateEdgeApplianceSchema = EdgeApplianceSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  cliente: true,
  complejo: true,
});

export const UpdateEdgeApplianceSchema = CreateEdgeApplianceSchema.partial();

export type IEdgeApplianceRol = z.infer<typeof EdgeApplianceRolSchema>;
export type IEdgeApplianceEstado = z.infer<typeof EdgeApplianceEstadoSchema>;
export type IEdgeApplianceEntorno = z.infer<typeof EdgeApplianceEntornoSchema>;
export type IEdgeApplianceFlagEstado = z.infer<
  typeof EdgeApplianceFlagEstadoSchema
>;
export type IEdgeHardwareSpecCpu = z.infer<typeof EdgeHardwareSpecCpuSchema>;
export type IEdgeHardwareSpecStorage = z.infer<
  typeof EdgeHardwareSpecStorageSchema
>;
export type IEdgeHardwareSpecAccelerator = z.infer<
  typeof EdgeHardwareSpecAcceleratorSchema
>;
export type IEdgeHardwareSpecGpu = z.infer<typeof EdgeHardwareSpecGpuSchema>;
export type IEdgeHardwareSpecNic = z.infer<typeof EdgeHardwareSpecNicSchema>;
export type IEdgeHardwareSpecPcieGen = z.infer<
  typeof EdgeHardwareSpecPcieGenSchema
>;
export type IEdgeHardwareSpecCodec = z.infer<
  typeof EdgeHardwareSpecCodecSchema
>;
export type IEdgeHardwareSpec = z.infer<typeof EdgeHardwareSpecSchema>;
export type ITipoInferencia = z.infer<typeof TipoInferenciaSchema>;
export type IRuntimeInferencia = z.infer<typeof RuntimeInferenciaSchema>;
export type IInferenciaCatalogoItem = z.infer<
  typeof InferenciaCatalogoItemSchema
>;
export type IEdgeCapacidad = z.infer<typeof EdgeCapacidadSchema>;
export type IEdgeApplianceUtilizacion = z.infer<
  typeof EdgeApplianceUtilizacionSchema
>;
export type IEdgeApplianceNatsConnState = z.infer<
  typeof EdgeApplianceNatsConnStateSchema
>;
export type IEdgeApplianceIntegrityEntry = z.infer<
  typeof EdgeApplianceIntegrityEntrySchema
>;
export type IEdgeApplianceLastError = z.infer<
  typeof EdgeApplianceLastErrorSchema
>;
export type IEdgeApplianceDiagnosticoRed = z.infer<
  typeof EdgeApplianceDiagnosticoRedSchema
>;
export type IEdgeApplianceDiagnostico = z.infer<
  typeof EdgeApplianceDiagnosticoSchema
>;
export type IEdgeAppliance = z.infer<typeof EdgeApplianceSchema>;
export type ICreateEdgeAppliance = z.infer<typeof CreateEdgeApplianceSchema>;
export type IUpdateEdgeAppliance = z.infer<typeof UpdateEdgeApplianceSchema>;

// E.S1d / D32 — logs-tail vía NATS request/reply.
//
// Units soportados son una whitelist cerrada (sin "arbitrary unit" para
// evitar que un admin lea logs del host). El agent edge resuelve cada uno
// a `journalctl -u <unit>` o a un file path concreto (install.log).
//
// Cap server-side: `lines` se clamp a [1, EDGE_LOGS_MAX_LINES] en cloud y
// edge. Defaults UI: lines=200.
export const EDGE_LOGS_MAX_LINES = 1000;
export const EDGE_LOGS_DEFAULT_LINES = 200;

export const EdgeApplianceLogsUnitSchema = z.enum([
  "acceso-edge",
  "tailscaled",
  "acceso-edge-cert-sync",
  "acceso-edge-update",
  "install.log",
]);

// Args que el cloud envía al agent en el payload NATS request.
//   - `lines`: tail count, cap por edge a EDGE_LOGS_MAX_LINES.
//   - `since`: filtro temporal "más nuevo que" (ISO). Usa journalctl --since.
//   - `before`: cursor pagination "más viejo que" (ISO). Para "cargar más".
export const EdgeApplianceLogsRequestSchema = z.object({
  unit: EdgeApplianceLogsUnitSchema,
  lines: z.number().int().positive().max(EDGE_LOGS_MAX_LINES).optional(),
  since: z.string().optional(),
  before: z.string().optional(),
});

// Nivel inferido server-side cuando el log lo trae (journalctl `PRIORITY`).
// Sintético — no toda línea va a tener nivel (install.log no lo trae).
export const EdgeApplianceLogLevelSchema = z.enum([
  "debug",
  "info",
  "warn",
  "error",
]);

export const EdgeApplianceLogLineSchema = z.object({
  // ISO timestamp del log. Para journalctl viene de __REALTIME_TIMESTAMP.
  // Para install.log es el ts del FS si la línea no trae prefix de fecha.
  ts: z.string(),
  level: EdgeApplianceLogLevelSchema.optional(),
  message: z.string(),
});

export const EdgeApplianceLogsResponseSchema = z.object({
  unit: EdgeApplianceLogsUnitSchema,
  lines: z.array(EdgeApplianceLogLineSchema),
  // Cursor para paginación hacia atrás. Si presente: la siguiente request
  // debe pasar `before=<cursor>` para traer logs anteriores. Ausente si no
  // hay más historia (o el agent no lo soporta para esa unit).
  cursor: z.string().optional(),
  // true = el edge truncó porque `lines` saturó el buffer. UI lo señaliza.
  truncated: z.boolean(),
  // ts ISO de cuando el agent terminó de armar la respuesta. Útil para
  // mostrar "snapshot @ HH:MM:SS" en la UI.
  fetchedAt: z.string(),
});

export type IEdgeApplianceLogsUnit = z.infer<
  typeof EdgeApplianceLogsUnitSchema
>;
export type IEdgeApplianceLogsRequest = z.infer<
  typeof EdgeApplianceLogsRequestSchema
>;
export type IEdgeApplianceLogLevel = z.infer<
  typeof EdgeApplianceLogLevelSchema
>;
export type IEdgeApplianceLogLine = z.infer<typeof EdgeApplianceLogLineSchema>;
export type IEdgeApplianceLogsResponse = z.infer<
  typeof EdgeApplianceLogsResponseSchema
>;
