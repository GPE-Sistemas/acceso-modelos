import { z } from "zod";

// ICamaraDescubierta — proceso de onboarding ONVIF.
// Cloud-only (Tipo C) — no se replica a edges. Detalle en 22-discovery-camaras.md.
export const CamaraDescubiertaEstadoSchema = z.enum([
  "Descubierta",
  "Adoptada",
  "Ignorada",
]);

export const CamaraDescubiertaCapacidadesSchema = z.object({
  codecs: z.array(z.string()),
  resoluciones: z.array(z.string()),
  profiles: z.array(z.string()),
  ptz: z.boolean().optional(),
  audio: z.boolean().optional(),
  eventosOnvif: z.boolean().optional(),
});

export const CamaraDescubiertaSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),

  idComplejo: z.string(),
  reachableFrom: z.array(z.string()), // ids de IEdgeAppliance que la descubren
  fabricante: z.string().optional(),
  modelo: z.string().optional(),
  serialNumber: z.string().optional(),
  macAddress: z.string(), // identidad estable cross-discovery
  ipLan: z.string(),
  capacidades: CamaraDescubiertaCapacidadesSchema.optional(),

  estado: CamaraDescubiertaEstadoSchema,
  descubiertaEn: z.string(),
  ultimaVistaEn: z.string(),

  idCamara: z.string().optional(),
  idEdgeAppliancePrimarioPropuesto: z.string().optional(),
  notasIntegrador: z.string().optional(),
});

export const CreateCamaraDescubiertaSchema = CamaraDescubiertaSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
});

export const UpdateCamaraDescubiertaSchema =
  CreateCamaraDescubiertaSchema.partial();

export type ICamaraDescubiertaEstado = z.infer<
  typeof CamaraDescubiertaEstadoSchema
>;
export type ICamaraDescubiertaCapacidades = z.infer<
  typeof CamaraDescubiertaCapacidadesSchema
>;
export type ICamaraDescubierta = z.infer<typeof CamaraDescubiertaSchema>;
export type ICreateCamaraDescubierta = z.infer<
  typeof CreateCamaraDescubiertaSchema
>;
export type IUpdateCamaraDescubierta = z.infer<
  typeof UpdateCamaraDescubiertaSchema
>;
