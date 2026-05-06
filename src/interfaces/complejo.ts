import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { GeoJSONMultiPolygonSchema } from "../auxiliares/geojson";

export const ConfigEmergenciasComplejoSchema = z
  .object({
    /** Si false, las emergencias enviadas desde mobile deben validarse contra el polígono del complejo. Default: true. */
    permitirFueraDelComplejo: z.boolean().optional(),
  })
  .passthrough();

export const ConfigComplejoSchema = z
  .object({
    imagenes: z
      .object({
        logo: z.string().optional(),
        banner: z.string().optional(),
      })
      .passthrough()
      .optional(),
    emergencias: ConfigEmergenciasComplejoSchema.optional(),
    /** Polígono(s) que delimita(n) el complejo. Usado para geo-fence de emergencias. */
    geoJson: GeoJSONMultiPolygonSchema.optional(),
  })
  .passthrough();

export const TipoComplejoSchema = z.enum(["Barrio", "Edificio", "Condominio"]);

export const ComplejoSchema = z
  .object({
    _id: z.string().optional(),
    idCliente: z.string().optional(),
    fechaCreacion: z.string().optional(),
    habilitado: z.boolean().optional(),
    nombre: z.string().optional(),
    tipo: TipoComplejoSchema.optional(),
    config: ConfigComplejoSchema.optional(),
    // Populate
    cliente: ClienteSchema.optional(),
  })
  .passthrough();

export const CreateComplejoSchema = ComplejoSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
});

export const UpdateComplejoSchema = ComplejoSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
}).partial();

export type IConfigEmergenciasComplejo = z.infer<
  typeof ConfigEmergenciasComplejoSchema
>;
export type IConfigComplejo = z.infer<typeof ConfigComplejoSchema> & {
  [key: string]: any;
};
export type ITipoComplejo = z.infer<typeof TipoComplejoSchema>;
export type IComplejo = z.infer<typeof ComplejoSchema>;
export type ICreateComplejo = z.infer<typeof CreateComplejoSchema>;
export type IUpdateComplejo = z.infer<typeof UpdateComplejoSchema>;
