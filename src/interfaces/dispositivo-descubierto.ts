import { z } from "zod";

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
