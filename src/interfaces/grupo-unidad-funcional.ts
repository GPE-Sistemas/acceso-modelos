import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { UnidadFuncionalSchema } from "./unidad-funcional";

export const GrupoUnidadFuncionalSchema = z.object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    /**
     * Timestamp de la última mutación (ISO 8601). Mismo patrón anti-eco bilateral
     * que el resto de entidades — server defaultea si se omite.
     */
    fechaActualizacion: z.string().optional(),
    habilitado: z.boolean().optional(),
    idCliente: z.string().optional(),
    idComplejo: z.string().optional(),
    nombre: z.string().optional(),
    descripcion: z.string().optional(),
    idsUnidadesFuncionales: z.array(z.string()).optional(),
    // Populate
    cliente: ClienteSchema.optional(),
    complejo: ComplejoSchema.optional(),
    unidadesFuncionales: z.array(UnidadFuncionalSchema).optional(),
  });

export const CreateGrupoUnidadFuncionalSchema = GrupoUnidadFuncionalSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  cliente: true,
  complejo: true,
  unidadesFuncionales: true,
});

export const UpdateGrupoUnidadFuncionalSchema = CreateGrupoUnidadFuncionalSchema.partial();

export type IGrupoUnidadFuncional = z.infer<typeof GrupoUnidadFuncionalSchema>;
export type ICreateGrupoUnidadFuncional = z.infer<
  typeof CreateGrupoUnidadFuncionalSchema
>;
export type IUpdateGrupoUnidadFuncional = z.infer<
  typeof UpdateGrupoUnidadFuncionalSchema
>;
