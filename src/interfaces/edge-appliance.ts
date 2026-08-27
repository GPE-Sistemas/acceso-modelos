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
  // Transición esperada, no falla: hay un `update-image` en vuelo. El agent
  // se cae durante el pull + restart, así que un `Offline` acá sería ruido —
  // el operador que disparó la actualización necesita ver "está en eso", y el
  // amarillo se resuelve solo (heartbeat con la versión nueva, veredicto de
  // error del host, o timeout). Ver `actualizacion` para el detalle del intento.
  "Actualizando",
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

// IEdgeApplianceActualizacion — traza del último `update-image` disparado
// sobre el appliance. Sobrevive al intento (no se limpia al terminar) para que
// el panel muestre "qué se intentó, con qué tag y cómo salió" sin ir a la
// auditoría de comandos.
//
// Ciclo: acceso-api lo escribe al publicar el comando (estado pasa a
// `Actualizando`) y lo cierra por una de tres vías —
//   - heartbeat con versión/digest distinto al previo → `aplicada`
//   - veredicto `error` del helper host (commands.result) → `error`
//   - timeout del scheduler → `sin-cambio` (volvió igual) o `sin-respuesta`
//     (no volvió).
export const EdgeApplianceActualizacionResultadoSchema = z.enum([
  "aplicada",
  "sin-cambio",
  "error",
  "sin-respuesta",
]);

export const EdgeApplianceActualizacionSchema = z.object({
  // `correlationId` del IComandoEdge emitido. Ancla el cierre: un result o un
  // heartbeat sólo cierra el intento que matchea este id.
  correlationId: z.string(),
  // Tag pedido (`args.tag` del comando). Puede ser mutable (`latest`), por eso
  // el veredicto no se basa sólo en comparar contra él.
  tagObjetivo: z.string(),
  // Versión/digest que corría ANTES del intento. El heartbeat compara contra
  // esto: si cambió, la imagen nueva efectivamente arrancó.
  versionAnterior: z.string().optional(),
  digestAnterior: z.string().optional(),
  iniciadoEn: z.string(),
  // idPermiso del operador que lo disparó.
  iniciadoPor: z.string().optional(),
  finalizadoEn: z.string().optional(),
  resultado: EdgeApplianceActualizacionResultadoSchema.optional(),
  // Mensaje del host (`hostMessage`) o motivo del cierre por timeout.
  mensaje: z.string().optional(),
  // Versión que quedó corriendo al cerrar. Con `sin-cambio` es igual a
  // `versionAnterior` — es justamente el dato que explica el veredicto.
  versionResultante: z.string().optional(),
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
  // Digest de la imagen Docker en curso (`sha256:...`), reportado por el agent
  // en el heartbeat. Es el único discriminante cuando el tag es mutable
  // (`latest` recompilado sin bump de versión) — de ahí que el veredicto de
  // `update-image` lo mire además de `versionAgent`.
  versionAgentDigest: z.string().optional(),
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

  // Último `update-image` (en curso o cerrado). Ver
  // EdgeApplianceActualizacionSchema.
  actualizacion: EdgeApplianceActualizacionSchema.optional(),

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
export type IEdgeApplianceActualizacionResultado = z.infer<
  typeof EdgeApplianceActualizacionResultadoSchema
>;
export type IEdgeApplianceActualizacion = z.infer<
  typeof EdgeApplianceActualizacionSchema
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
// Las fuentes soportadas son una whitelist cerrada (sin "arbitrary unit" para
// evitar que un admin lea cualquier cosa del host). El valor del enum es
// *lógico*: el helper host lo resuelve a `journalctl -u`, `-t`, `-k`, al
// journal completo, o al tail de un archivo concreto — ver
// `EDGE_LOGS_FUENTES` más abajo.
//
// Cap server-side: `lines` se clamp a [1, EDGE_LOGS_MAX_LINES] en cloud y
// edge. Defaults UI: lines=200.
export const EDGE_LOGS_MAX_LINES = 1000;
export const EDGE_LOGS_DEFAULT_LINES = 200;

// Modo vivo (F1). El frontend repite el tail con `afterCursor` (o `since` si
// el appliance todavía no tiene el helper nuevo) y appendea el delta.
//   - LIVE_LINES: tail chico por tick; el delta normal son pocas líneas.
//   - LIVE_INTERVAL_MS: cada cuánto se repite. No se encola un tick nuevo si
//     el anterior sigue en vuelo (el RPC puede tardar segundos).
//   - BUFFER_MAX_LINES: cap del buffer en memoria del navegador; se descarta
//     por el frente.
export const EDGE_LOGS_LIVE_LINES = 50;
export const EDGE_LOGS_LIVE_INTERVAL_MS = 3000;
export const EDGE_LOGS_BUFFER_MAX_LINES = 5000;

export const EdgeApplianceLogsUnitSchema = z.enum([
  // Agente + overlay.
  "acceso-edge",
  "tailscaled",
  // Timers del host.
  "acceso-edge-cert-sync",
  "acceso-edge-update",
  "acceso-edge-clock-sync",
  // Containers (docker run dentro de una unit, stdout → journal).
  "acceso-inferencia",
  "acceso-anpr",
  // Infraestructura del host.
  "docker",
  "postgresql",
  // Bridge de comandos: no es unit, loguea con `logger -t` → journalctl -t.
  "acceso-edge-command",
  // Agregados.
  "kernel",
  "sistema",
  // Archivos.
  "install.log",
  "postgres.log",
]);

// Cómo resuelve el helper host cada fuente. `unit` → `journalctl -u <x>.service`,
// `identifier` → `-t <x>`, `kernel` → `-k`, `journal` → journalctl sin filtro,
// `file` → tail del path.
export const EdgeApplianceLogsFuenteTipoSchema = z.enum([
  "unit",
  "identifier",
  "kernel",
  "journal",
  "file",
]);

// Catálogo único de fuentes: label para la UI, tipo de resolución, y si la
// fuente puede no existir en un appliance dado (inferencia y ANPR son
// opcionales según el hardware instalado). El frontend arma el dropdown de
// acá — sin labels duplicados en el componente.
export const EDGE_LOGS_FUENTES: ReadonlyArray<{
  readonly value: IEdgeApplianceLogsUnit;
  readonly label: string;
  readonly tipo: IEdgeApplianceLogsFuenteTipo;
  readonly condicional: boolean;
}> = [
  { value: "acceso-edge", label: "acceso-edge (agente)", tipo: "unit", condicional: false },
  { value: "sistema", label: "sistema (journal completo)", tipo: "journal", condicional: false },
  { value: "kernel", label: "kernel (dmesg)", tipo: "kernel", condicional: false },
  { value: "postgresql", label: "postgresql (unit)", tipo: "unit", condicional: false },
  { value: "postgres.log", label: "postgres (log del server)", tipo: "file", condicional: false },
  { value: "acceso-inferencia", label: "inferencia (Frigate)", tipo: "unit", condicional: true },
  { value: "acceso-anpr", label: "ANPR (patentes)", tipo: "unit", condicional: true },
  { value: "docker", label: "docker (daemon)", tipo: "unit", condicional: false },
  { value: "tailscaled", label: "tailscaled (overlay)", tipo: "unit", condicional: false },
  { value: "acceso-edge-command", label: "bridge de comandos", tipo: "identifier", condicional: false },
  { value: "acceso-edge-cert-sync", label: "cert-sync (timer)", tipo: "unit", condicional: false },
  { value: "acceso-edge-update", label: "update (timer)", tipo: "unit", condicional: false },
  { value: "acceso-edge-clock-sync", label: "clock-sync (timer)", tipo: "unit", condicional: false },
  { value: "install.log", label: "install.log (boot)", tipo: "file", condicional: false },
] as const;

// Filtro de severidad. Mapea a `journalctl -p <n>`: se piden las líneas de esa
// prioridad *y más graves*. `debug` = sin filtro efectivo.
export const EdgeApplianceLogsPrioridadSchema = z.enum([
  "error",
  "warn",
  "info",
  "debug",
]);

// Args que el cloud envía al agent en el payload NATS request.
//   - `lines`: tail count, cap por edge a EDGE_LOGS_MAX_LINES.
//   - `since`: filtro temporal "más nuevo que" (ISO). Usa journalctl --since.
//   - `before`: cursor pagination "más viejo que" (ISO). Para "cargar más".
//   - `afterCursor`: cursor opaco del journal (`__CURSOR`) devuelto en
//     `cursorNuevas`. Es el mecanismo correcto para el delta del modo vivo:
//     `since` tiene resolución de segundo y duplica o pierde líneas.
//   - `priority`: severidad mínima.
//   - `boot`: solo el boot actual (`journalctl -b`).
export const EdgeApplianceLogsRequestSchema = z.object({
  unit: EdgeApplianceLogsUnitSchema,
  lines: z.number().int().positive().max(EDGE_LOGS_MAX_LINES).optional(),
  since: z.string().optional(),
  before: z.string().optional(),
  afterCursor: z.string().optional(),
  priority: EdgeApplianceLogsPrioridadSchema.optional(),
  boot: z.boolean().optional(),
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
  // ISO timestamp del log, con microsegundos cuando la fuente los tiene
  // (journalctl `__REALTIME_TIMESTAMP`). Para install.log es el ts del FS si
  // la línea no trae prefix de fecha.
  ts: z.string(),
  level: EdgeApplianceLogLevelSchema.optional(),
  message: z.string(),
  // Nombre real de la unit/identifier que emitió la línea. Solo tiene sentido
  // en las fuentes agregadas (`sistema`), donde cada línea viene de un
  // proceso distinto y la UI necesita mostrar de quién es.
  origen: z.string().optional(),
});

export const EdgeApplianceLogsResponseSchema = z.object({
  unit: EdgeApplianceLogsUnitSchema,
  lines: z.array(EdgeApplianceLogLineSchema),
  // Cursor para paginación hacia atrás. Si presente: la siguiente request
  // debe pasar `before=<cursor>` para traer logs anteriores. Ausente si no
  // hay más historia (o el agent no lo soporta para esa unit).
  cursor: z.string().optional(),
  // Cursor opaco del journal de la ÚLTIMA línea devuelta. La siguiente
  // request del modo vivo lo pasa como `afterCursor` y recibe exactamente el
  // delta. Ausente en fuentes tipo `file` (no hay journal cursor) y en
  // appliances con el helper host viejo — ahí el cliente cae a `since`.
  cursorNuevas: z.string().optional(),
  // true = el edge truncó porque `lines` saturó el buffer. UI lo señaliza.
  truncated: z.boolean(),
  // ts ISO de cuando el agent terminó de armar la respuesta. Útil para
  // mostrar "snapshot @ HH:MM:SS" en la UI.
  fetchedAt: z.string(),
  // false = la fuente no existe en este appliance (ej. `acceso-inferencia` en
  // un edge sin Hailo). Distinto de "existe pero no tiene líneas".
  disponible: z.boolean().optional(),
});

// ─── F3: follow real (stream) ────────────────────────────────────────────────
//
// El tail one-shot no alcanza para "logs en vivo" de verdad: cada tick paga el
// RPC completo (pending → path unit → journalctl → processed → poll). El follow
// abre una sesión: el helper host levanta
// `acceso-edge-logs-follow@<sessionId>.service` (unit template con
// `RuntimeMaxSec` = TTL) que corre `journalctl -f -o json` y appendea NDJSON
// mapeado; el agent tailea ese archivo y publica chunks a NATS; la API los
// reemite por el gateway socket.io al room del appliance.
//
// La sesión SIEMPRE muere sola por TTL: si el operador cierra el modal (o se
// le corta el browser) no queda un journalctl -f colgado en el appliance.

// TTL de una sesión de follow, en segundos. El frontend renueva mientras el
// modal siga abierto.
export const EDGE_LOGS_FOLLOW_TTL_S = 300;
// Cap de líneas por chunk publicado a NATS. Un burst más grande se parte.
export const EDGE_LOGS_FOLLOW_CHUNK_MAX_LINES = 200;
// Cada cuánto el agent vacía lo acumulado del NDJSON hacia NATS.
export const EDGE_LOGS_FOLLOW_FLUSH_MS = 500;

// `sessionId` va como instance name de una unit systemd: solo hex, sin
// separadores. El agent y el helper host validan contra este mismo regex.
export const EDGE_LOGS_FOLLOW_SESSION_REGEX = /^[0-9a-f]{8,32}$/;

export const EdgeApplianceLogsFollowStartSchema = z.object({
  sessionId: z.string().regex(EDGE_LOGS_FOLLOW_SESSION_REGEX),
  unit: EdgeApplianceLogsUnitSchema,
  priority: EdgeApplianceLogsPrioridadSchema.optional(),
  // Segundos. El cloud lo clampea a EDGE_LOGS_FOLLOW_TTL_S.
  ttlS: z.number().int().positive().max(EDGE_LOGS_FOLLOW_TTL_S).optional(),
});

export const EdgeApplianceLogsFollowStopSchema = z.object({
  sessionId: z.string().regex(EDGE_LOGS_FOLLOW_SESSION_REGEX),
});

export const EdgeApplianceLogsFollowStatusSchema = z.object({
  sessionId: z.string(),
  unit: EdgeApplianceLogsUnitSchema,
  activa: z.boolean(),
  // ts ISO en que la sesión expira si no se renueva.
  expiraEn: z.string().optional(),
  // Presente cuando la sesión no pudo arrancar (fuente inexistente, helper
  // host viejo sin la unit template, etc).
  error: z.string().optional(),
});

// Chunk que el agent publica a NATS y la API reemite por socket.io.
export const EdgeApplianceLogsChunkSchema = z.object({
  sessionId: z.string(),
  unit: EdgeApplianceLogsUnitSchema,
  lines: z.array(EdgeApplianceLogLineSchema),
  // Monotónico por sesión. El cliente detecta huecos (chunk perdido) sin
  // tener que comparar timestamps.
  seq: z.number().int().nonnegative(),
  // Líneas que el edge descartó por rate/cap desde el chunk anterior. La UI
  // muestra "… N líneas omitidas" en vez de mentir con continuidad.
  descartadas: z.number().int().nonnegative().optional(),
});

export type IEdgeApplianceLogsUnit = z.infer<
  typeof EdgeApplianceLogsUnitSchema
>;
export type IEdgeApplianceLogsFuenteTipo = z.infer<
  typeof EdgeApplianceLogsFuenteTipoSchema
>;
export type IEdgeApplianceLogsPrioridad = z.infer<
  typeof EdgeApplianceLogsPrioridadSchema
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
export type IEdgeApplianceLogsFollowStart = z.infer<
  typeof EdgeApplianceLogsFollowStartSchema
>;
export type IEdgeApplianceLogsFollowStop = z.infer<
  typeof EdgeApplianceLogsFollowStopSchema
>;
export type IEdgeApplianceLogsFollowStatus = z.infer<
  typeof EdgeApplianceLogsFollowStatusSchema
>;
export type IEdgeApplianceLogsChunk = z.infer<
  typeof EdgeApplianceLogsChunkSchema
>;
