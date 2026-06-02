import { z } from "zod";
import { DispositivoSchema } from "./dispositivo";

// IDispositivoDescubierto — proceso de onboarding LAN-discovery genérico.
// Colapsa la antigua ICamaraDescubierta para abarcar terminales de acceso,
// cámaras IP, NVR / XVR, lectores, intercoms y devices "no integrables"
// detectados en LAN del edge.
//
// Cloud-only (Tipo C) — no se replica a edges. Detalle en
// acceso-doc-general/28-discovery-lan-edge.md.

export const DispositivoDescubiertoEstadoSchema = z.enum([
  "Descubierto",
  "Adoptado",
  "Ignorado",
]);

export const DispositivoDescubiertoTipoSchema = z.enum([
  "terminal-acceso",
  "camara-ip",
  "nvr",
  "xvr",
  "lector-tarjeta",
  "intercom",
  "no-integrable",
  "desconocido",
]);

export const DispositivoDescubiertoProtocoloSchema = z.enum([
  "arp",
  "onvif-ws-discovery",
  "ssdp",
  "mdns",
  "isapi-usercheck",
  "rpc2-challenge",
  "rtsp-options",
  "http-banner",
  "hik-sadp",
  "dahua-dhip",
  "nbns",
]);

export const DispositivoDescubiertoEntidadAdoptadaTipoSchema = z.enum([
  "IDispositivo",
  "ICamara",
]);

export const DispositivoDescubiertoCapabilitiesSchema = z.object({
  // Cámaras / NVR / XVR
  onvifProfiles: z.array(z.enum(["S", "T", "G", "C"])).optional(),
  canales: z.number().int().nonnegative().optional(),
  rtspPorts: z.array(z.number().int()).optional(),

  // Terminales de acceso (HIK userCheck)
  isApiActivated: z.boolean().optional(),
  isApiLocked: z.boolean().optional(),
  isApiUnlockTimeSec: z.number().int().nonnegative().optional(),

  // Genérico
  serverHeader: z.string().optional(),
  digestRealm: z.string().optional(),
  puertosAbiertos: z.array(z.number().int()).optional(),
});

export const DispositivoDescubiertoIpLanHistoricoEntrySchema = z.object({
  ip: z.string(),
  visto: z.string(),
});

export const DispositivoDescubiertoSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),

  idComplejo: z.string(),
  reachableFrom: z.array(z.string()), // ids de IEdgeAppliance que lo descubren

  macAddress: z.string(), // identidad estable cross-discovery
  ipLan: z.string(), // mutable — DHCP refresca
  ipLanHistorico: z
    .array(DispositivoDescubiertoIpLanHistoricoEntrySchema)
    .optional(),

  fabricante: z.string().optional(),
  modelo: z.string().optional(),
  // Hostname best-effort detectado vía NetBIOS NBSTAT / mDNS / reverse DNS.
  // Útil para identificar visualmente phones / laptops / IoT que no exponen
  // banner HTTP. No autoritativo — el integrador adopta con datos propios.
  hostname: z.string().optional(),

  tipoDispositivo: DispositivoDescubiertoTipoSchema,

  protocolosDetectados: z.array(DispositivoDescubiertoProtocoloSchema),

  capabilities: DispositivoDescubiertoCapabilitiesSchema.optional(),

  estado: DispositivoDescubiertoEstadoSchema,
  descubiertoEn: z.string(),
  ultimaVistaEn: z.string(),

  idEntidadAdoptada: z.string().optional(),
  entidadAdoptadaTipo:
    DispositivoDescubiertoEntidadAdoptadaTipoSchema.optional(),

  notasIntegrador: z.string().optional(),
});

export const CreateDispositivoDescubiertoSchema =
  DispositivoDescubiertoSchema.omit({
    _id: true,
    fechaCreacion: true,
    fechaActualizacion: true,
  });

export const UpdateDispositivoDescubiertoSchema =
  CreateDispositivoDescubiertoSchema.partial();

export type IDispositivoDescubiertoEstado = z.infer<
  typeof DispositivoDescubiertoEstadoSchema
>;
export type IDispositivoDescubiertoTipo = z.infer<
  typeof DispositivoDescubiertoTipoSchema
>;
export type IDispositivoDescubiertoProtocolo = z.infer<
  typeof DispositivoDescubiertoProtocoloSchema
>;
export type IDispositivoDescubiertoEntidadAdoptadaTipo = z.infer<
  typeof DispositivoDescubiertoEntidadAdoptadaTipoSchema
>;
export type IDispositivoDescubiertoCapabilities = z.infer<
  typeof DispositivoDescubiertoCapabilitiesSchema
>;
export type IDispositivoDescubiertoIpLanHistoricoEntry = z.infer<
  typeof DispositivoDescubiertoIpLanHistoricoEntrySchema
>;
export type IDispositivoDescubierto = z.infer<
  typeof DispositivoDescubiertoSchema
>;
export type ICreateDispositivoDescubierto = z.infer<
  typeof CreateDispositivoDescubiertoSchema
>;
export type IUpdateDispositivoDescubierto = z.infer<
  typeof UpdateDispositivoDescubiertoSchema
>;

// ── Adopción del dispositivo descubierto (H-DEV-5) ────────────────────────
// Contrato del flow RPC sync con 4 checks bloqueantes. Fuente de verdad única
// compartida por acceso-api (Zod + createZodDto) y acceso-web (tipos). El edge
// mantiene un struct Go espejo (`hikvision.AdoptarResult`) — no consume estos
// schemas directo (su pipeline JSONSchema→Go es solo para el hub-edge
// contract), pero la shape DEBE coincidir campo a campo.
// Doc: acceso-doc-general/29-hik-terminal-adopcion.md.

// Body del POST /dispositivos-descubiertos/:id/adoptar.
export const AdoptarDispositivoSchema = z.object({
  credUser: z.string().min(1),
  credPass: z.string().min(1),
  // idEdgeAppliancePrimario es opcional cuando el descubierto tiene N=1 en
  // reachableFrom (auto-elegido). Requerido si N>1.
  idEdgeAppliancePrimario: z.string().optional(),
  // Reconfigurar `/ISAPI/Event/notification/httpHosts/1` apuntando al edge.
  // Default true (lo aplica acceso-api).
  reconfigPush: z.boolean().optional(),
  // Sync hora del device contra el edge si drift > 1min. Default true.
  syncTime: z.boolean().optional(),
});

// Resultado rich de los 4 checks que corre el edge. acceso-api valida
// reachable && credOk && reconfigPushOk && syncTimeOk antes de crear el
// IDispositivo; los campos *Err + lockStatus/unlockTime/timeDriftSec alimentan
// el detalle por-check del wizard.
export const AdoptarResultSchema = z.object({
  // Check 1: reachability (UserCheck, sin auth).
  reachable: z.boolean(),
  reachableErr: z.string().optional(),
  // Detalle de lockout extraído del UserCheck.
  lockStatus: z.string().optional(), // "lock" | "unlock"
  unlockTime: z.number().optional(), // segundos restantes de lockout
  // Check 2: credenciales (GetDeviceInfo) + datos auto-extraídos.
  credOk: z.boolean(),
  credErr: z.string().optional(),
  model: z.string().optional(),
  serialNumber: z.string().optional(),
  shortSerial: z.string().optional(),
  macAddress: z.string().optional(),
  firmwareVersion: z.string().optional(),
  // Check 3: reconfig push slot 1.
  reconfigPushOk: z.boolean(),
  reconfigPushErr: z.string().optional(),
  // Check 4: sync hora.
  syncTimeOk: z.boolean(),
  syncTimeErr: z.string().optional(),
  timeDriftSec: z.number().optional(),
});

// Respuesta de la adopción exitosa: ambos docs (dispositivo nuevo creado +
// descubierto marcado Adoptado) + el detalle de los 4 checks que pasaron.
// Cuando algún check falla, acceso-api NO devuelve esto — tira 422 con el
// `adoptarResult` en el detalle del error.
export const AdoptarDispositivoResponseSchema = z.object({
  dato: z.object({
    dispositivo: DispositivoSchema,
    descubierto: DispositivoDescubiertoSchema,
    adoptarResult: AdoptarResultSchema,
  }),
});

export type IAdoptarDispositivo = z.infer<typeof AdoptarDispositivoSchema>;
export type IAdoptarResult = z.infer<typeof AdoptarResultSchema>;
export type IAdoptarDispositivoResponse = z.infer<
  typeof AdoptarDispositivoResponseSchema
>;
