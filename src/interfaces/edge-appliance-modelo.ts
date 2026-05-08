import { z } from "zod";
import {
  EdgeCapacidadSchema,
  EdgeHardwareSpecSchema,
} from "./edge-appliance";

// IEdgeApplianceModelo — catálogo curado por GPE de modelos certificados.
// Master data Tipo B replicado a todos los edges. Tier es categoría comercial
// del catálogo (no campo de la instancia — ver shared-contratos.md).
export const EdgeApplianceTierSchema = z.enum([
  "Lite",
  "Small",
  "Medium",
  "Large",
]);

export const EdgeApplianceModeloSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),

  codigo: z.string(),
  nombre: z.string(),
  tier: EdgeApplianceTierSchema,
  bomCertificado: z.boolean(),
  fechaPublicacion: z.string(),
  fechaDeprecacion: z.string().optional(),

  hardwareReferencia: EdgeHardwareSpecSchema,
  capacidadReferencia: EdgeCapacidadSchema,
  versionReglasCapacidad: z.string(),
});

export const CreateEdgeApplianceModeloSchema = EdgeApplianceModeloSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
});

export const UpdateEdgeApplianceModeloSchema =
  CreateEdgeApplianceModeloSchema.partial();

export type IEdgeApplianceTier = z.infer<typeof EdgeApplianceTierSchema>;
export type IEdgeApplianceModelo = z.infer<typeof EdgeApplianceModeloSchema>;
export type ICreateEdgeApplianceModelo = z.infer<
  typeof CreateEdgeApplianceModeloSchema
>;
export type IUpdateEdgeApplianceModelo = z.infer<
  typeof UpdateEdgeApplianceModeloSchema
>;
