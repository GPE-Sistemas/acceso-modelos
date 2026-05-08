import { z } from "zod";

// IPerfilCamara — catálogo curado de perfiles cerrados (codec/resolución/fps/bitrate).
// Master data Tipo B. Vacío en MVP, se popula al abrir módulo cámaras.
export const PerfilCamaraResolucionSchema = z.enum(["720p", "1080p", "4K"]);

export const PerfilCamaraCodecSchema = z.enum(["H264", "H265"]);

export const PerfilCamaraSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),

  codigo: z.string(), // 'H264-1080p-15fps', 'H265-4K-30fps', ...
  resolucion: PerfilCamaraResolucionSchema,
  fps: z.number().int().positive(),
  codec: PerfilCamaraCodecSchema,
  bitrateKbpsEstimado: z.number().nonnegative(),
  decodeFlops: z.number().nonnegative().optional(),
});

export const CreatePerfilCamaraSchema = PerfilCamaraSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
});

export const UpdatePerfilCamaraSchema = CreatePerfilCamaraSchema.partial();

export type IPerfilCamaraResolucion = z.infer<
  typeof PerfilCamaraResolucionSchema
>;
export type IPerfilCamaraCodec = z.infer<typeof PerfilCamaraCodecSchema>;
export type IPerfilCamara = z.infer<typeof PerfilCamaraSchema>;
export type ICreatePerfilCamara = z.infer<typeof CreatePerfilCamaraSchema>;
export type IUpdatePerfilCamara = z.infer<typeof UpdatePerfilCamaraSchema>;
