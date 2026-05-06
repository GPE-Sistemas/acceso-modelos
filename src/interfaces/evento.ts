import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { PermisoSchema } from "./permiso";
import { UnidadFuncionalSchema } from "./unidad-funcional";

export const EventoSchema = z
  .object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    expireAt: z.string().optional(),
    idCliente: z.string().optional(),
    idComplejo: z.string().optional(),
    idUnidadFuncional: z.string().optional(),
    fechaEvento: z.string().optional(),
    idPermiso: z.string().optional(),
    // Populate
    cliente: ClienteSchema.optional(),
    complejo: ComplejoSchema.optional(),
    unidadFuncional: UnidadFuncionalSchema.optional(),
    permiso: PermisoSchema.optional(),
  })
  .passthrough();

export const CreateEventoSchema = EventoSchema.omit({
  _id: true,
  fechaCreacion: true,
});

export const UpdateEventoSchema = EventoSchema.omit({
  _id: true,
  fechaCreacion: true,
}).partial();

export type IEvento = z.infer<typeof EventoSchema>;
export type ICreateEvento = z.infer<typeof CreateEventoSchema>;
export type IUpdateEvento = z.infer<typeof UpdateEventoSchema>;
