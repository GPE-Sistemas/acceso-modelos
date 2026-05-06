import { z } from "zod";
import { GeoJSONPointSchema } from "../auxiliares/geojson";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";

export const TipoAccesoSchema = z.enum(["Ingreso", "Egreso", "Ambos"]);
export const TipoPersonaAccesoSchema = z.enum([
  "Propietarios",
  "Visitas",
  "Ambos",
]);

export const AccesoSchema = z.looseObject({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    idCliente: z.string().optional(),
    idComplejo: z.string().optional(),
    nombre: z.string().optional(),
    habilitado: z.boolean().optional(),
    tipo: TipoAccesoSchema.optional(),
    tipoPersona: TipoPersonaAccesoSchema.optional(),
    ubicacion: GeoJSONPointSchema.optional(),
    // Populate
    cliente: ClienteSchema.optional(),
    complejo: ComplejoSchema.optional(),
  });

export const CreateAccesoSchema = AccesoSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
});

export const UpdateAccesoSchema = AccesoSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
}).partial();

export type ITipoAcceso = z.infer<typeof TipoAccesoSchema>;
export type ITipoPersonaAcceso = z.infer<typeof TipoPersonaAccesoSchema>;
export type IAcceso = z.infer<typeof AccesoSchema>;
export type ICreateAcceso = z.infer<typeof CreateAccesoSchema>;
export type IUpdateAcceso = z.infer<typeof UpdateAccesoSchema>;
