import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { UnidadFuncionalSchema } from "./unidad-funcional";
import { DatosPersonalesSchema } from "./usuario";

export const VisitanteSchema = z.looseObject({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    idCliente: z.string().optional(),
    idComplejo: z.string().optional(),
    idUnidadFuncional: z.string().optional(),
    datosPersonales: DatosPersonalesSchema.optional(),
    // Populate
    cliente: ClienteSchema.optional(),
    complejo: ComplejoSchema.optional(),
    unidadFuncional: UnidadFuncionalSchema.optional(),
  });

export const CreateVisitanteSchema = VisitanteSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
  unidadFuncional: true,
});

export const UpdateVisitanteSchema = VisitanteSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
  unidadFuncional: true,
}).partial();

export type IVisitante = z.infer<typeof VisitanteSchema>;
export type ICreateVisitante = z.infer<typeof CreateVisitanteSchema>;
export type IUpdateVisitante = z.infer<typeof UpdateVisitanteSchema>;
