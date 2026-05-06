import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { EventoVisitaSchema } from "./evento-visita";
import { IngresoEgresoSchema } from "./ingreso-egreso";
import { VisitanteSchema } from "./visitante";

export const TipoVinculoEventoIngresoSchema = z.enum(["Ingreso", "Egreso"]);
export type ITipoVinculoEventoIngreso = z.infer<
  typeof TipoVinculoEventoIngresoSchema
>;

export const VinculoEventoIngresoSchema = z.looseObject({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  idEventoVisita: z.string().optional(),
  idIngresoEgreso: z.string().optional(),
  tipo: TipoVinculoEventoIngresoSchema.optional(),
  /** Subset de IEventoVisita.idsVisitantes que entró/salió en este vínculo */
  idsVisitantesAplicados: z.array(z.string()).optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  eventoVisita: EventoVisitaSchema.optional(),
  ingresoEgreso: IngresoEgresoSchema.optional(),
  visitantesAplicados: z.array(VisitanteSchema).optional(),
});

export const CreateVinculoEventoIngresoSchema =
  VinculoEventoIngresoSchema.omit({
    _id: true,
    fechaCreacion: true,
    cliente: true,
    complejo: true,
    eventoVisita: true,
    ingresoEgreso: true,
    visitantesAplicados: true,
  });

export const UpdateVinculoEventoIngresoSchema =
  CreateVinculoEventoIngresoSchema.partial();

export type IVinculoEventoIngreso = z.infer<typeof VinculoEventoIngresoSchema>;
export type ICreateVinculoEventoIngreso = z.infer<
  typeof CreateVinculoEventoIngresoSchema
>;
export type IUpdateVinculoEventoIngreso = z.infer<
  typeof UpdateVinculoEventoIngresoSchema
>;
