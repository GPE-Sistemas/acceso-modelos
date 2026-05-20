import { z } from "zod";
import { GeoJSONMultiPolygonSchema } from "../auxiliares/geojson";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";

export const TipoUnidadFuncionalSchema = z.enum(["Privada", "Común"]);

export const ConfigUnidadFuncionalSchema = z.record(z.string(), z.any());

export const UnidadFuncionalSchema = z.object({
    _id: z.string().optional(),
    idCliente: z.string().optional(),
    idComplejo: z.string().optional(),
    fechaCreacion: z.string().optional(),
    habilitado: z.boolean().optional(),
    nombre: z.string().optional(),
    tipo: TipoUnidadFuncionalSchema.optional(),
    ubicacion: GeoJSONMultiPolygonSchema.optional(),
    config: ConfigUnidadFuncionalSchema.optional(),
    imagenes: z.array(z.string()).optional(),
    // Populate
    cliente: ClienteSchema.optional(),
    complejo: ComplejoSchema.optional(),
  });

export const CreateUnidadFuncionalSchema = UnidadFuncionalSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
});

export const UpdateUnidadFuncionalSchema = UnidadFuncionalSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
}).partial();

export type ITipoUnidadFuncional = z.infer<typeof TipoUnidadFuncionalSchema>;
export type IConfigUnidadFuncional = z.infer<
  typeof ConfigUnidadFuncionalSchema
>;
export type IUnidadFuncional = z.infer<typeof UnidadFuncionalSchema>;
export type ICreateUnidadFuncional = z.infer<typeof CreateUnidadFuncionalSchema>;
export type IUpdateUnidadFuncional = z.infer<typeof UpdateUnidadFuncionalSchema>;
