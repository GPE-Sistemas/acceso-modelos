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

export const EdgeHardwareSpecSchema = z.object({
  cpu: EdgeHardwareSpecCpuSchema,
  ramGB: z.number().nonnegative(),
  storage: z.array(EdgeHardwareSpecStorageSchema),
  accelerator: EdgeHardwareSpecAcceleratorSchema.optional(),
  gpu: EdgeHardwareSpecGpuSchema.optional(),
  nics: z.array(EdgeHardwareSpecNicSchema),
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
  modelosSimultaneosMax: z.number().int().nonnegative(),
});

export const EdgeCapacidadStorageVideoSchema = z.object({
  capacityGB: z.number().nonnegative(),
  bytesPorSegundoSostenido: z.number().nonnegative(),
});

export const EdgeCapacidadWebrtcSchema = z.object({
  viewersSimultaneosMax: z.number().int().nonnegative(),
});

export const EdgeCapacidadSchema = z.object({
  camaras: EdgeCapacidadCamarasSchema,
  inferenciaIA: EdgeCapacidadInferenciaIaSchema,
  storageVideo: EdgeCapacidadStorageVideoSchema,
  webrtc: EdgeCapacidadWebrtcSchema,
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
  // Timestamp ISO del snapshot.
  actualizadoEn: z.string(),
});

// IEdgeAppliance — scalable-first: indice/fqdn/rol requeridos desde el día uno
// (caso N=1 → rol='Standalone', indice=0).
export const EdgeApplianceSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),

  idCliente: z.string(),
  idComplejo: z.string(),
  indice: z.number().int().nonnegative(),
  fqdn: z.string(),
  rol: EdgeApplianceRolSchema,
  zonaCoverage: z.string().optional(),

  hostname: z.string().optional(),
  ipOverlay: z.string().optional(),

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
export type IEdgeHardwareSpec = z.infer<typeof EdgeHardwareSpecSchema>;
export type IEdgeCapacidad = z.infer<typeof EdgeCapacidadSchema>;
export type IEdgeApplianceUtilizacion = z.infer<
  typeof EdgeApplianceUtilizacionSchema
>;
export type IEdgeAppliance = z.infer<typeof EdgeApplianceSchema>;
export type ICreateEdgeAppliance = z.infer<typeof CreateEdgeApplianceSchema>;
export type IUpdateEdgeAppliance = z.infer<typeof UpdateEdgeApplianceSchema>;
