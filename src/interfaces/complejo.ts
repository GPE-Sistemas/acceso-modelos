import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { GeoJSONMultiPolygonSchema } from "../auxiliares/geojson";

export const ConfigComplejoSchema = z.object({
  imagenes: z.object({
      logo: z.string().optional(),
      banner: z.string().optional(),
    })
    .optional(),
});

export const TipoComplejoSchema = z.enum(["Barrio", "Edificio", "Condominio"]);

export const ComplejoSchema = z.object({
    _id: z.string().optional(),
    idCliente: z.string().optional(),
    fechaCreacion: z.string().optional(),
    habilitado: z.boolean().optional(),
    nombre: z.string().optional(),
    tipo: TipoComplejoSchema.optional(),
    /**
     * Polígono(s) que delimita(n) el complejo. Usado para geo-fence de tickets
     * cuyo botón tenga `config.requiereDentroDelComplejo = true`.
     */
    ubicacion: GeoJSONMultiPolygonSchema.optional(),
    config: ConfigComplejoSchema.optional(),
    // Populate
    cliente: ClienteSchema.optional(),
  });

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

export type IConfigComplejo = z.infer<typeof ConfigComplejoSchema>;
export type ITipoComplejo = z.infer<typeof TipoComplejoSchema>;
export type IComplejo = z.infer<typeof ComplejoSchema>;
export type ICreateComplejo = z.infer<typeof CreateComplejoSchema>;
export type IUpdateComplejo = z.infer<typeof UpdateComplejoSchema>;
