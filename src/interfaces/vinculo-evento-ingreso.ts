import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";

export const TipoVinculoEventoIngresoSchema = z.enum(["Ingreso", "Egreso"]);
export type ITipoVinculoEventoIngreso = z.infer<
  typeof TipoVinculoEventoIngresoSchema
>;

export const VinculoEventoIngresoSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  idEventoVisita: z.string().optional(),
  idIngresoEgreso: z.string().optional(),
  tipo: TipoVinculoEventoIngresoSchema.optional(),
  /** Subset de IEventoVisita.idsVisitantes que entró/salió en este vínculo */
  idsVisitantesAplicados: z.array(z.string()).optional(),
  // Populate — los pesados (EventoVisita ⊃ ..., IngresoEgreso ⊃ snapshots) van
  // como `z.any()` para no inflar la inferencia global (TS7056 al sumar entidades
  // nuevas al barrel — patrón de turno.ts). Consumers castean ad-hoc si necesitan tipo.
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  eventoVisita: z.any().optional(),
  ingresoEgreso: z.any().optional(),
  visitantesAplicados: z.any().optional(),
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
