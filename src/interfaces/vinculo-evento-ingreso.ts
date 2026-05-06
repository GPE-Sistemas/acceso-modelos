import { z } from "zod";
import type { ICliente } from "./cliente";
import { ClienteSchema } from "./cliente";
import type { IComplejo } from "./complejo";
import { ComplejoSchema } from "./complejo";
import type { IEventoVisita } from "./evento-visita";
import { EventoVisitaSchema } from "./evento-visita";
import type { IIngresoEgreso } from "./ingreso-egreso";
import { IngresoEgresoSchema } from "./ingreso-egreso";
import type { IVisitante } from "./visitante";
import { VisitanteSchema } from "./visitante";

export const TipoVinculoEventoIngresoSchema = z.enum(["Ingreso", "Egreso"]);
export type ITipoVinculoEventoIngreso = z.infer<
  typeof TipoVinculoEventoIngresoSchema
>;

export interface IVinculoEventoIngreso {
  _id?: string;
  fechaCreacion?: string;
  idCliente?: string;
  idComplejo?: string;
  idEventoVisita?: string;
  idIngresoEgreso?: string;
  tipo?: ITipoVinculoEventoIngreso;
  /** Subset de IEventoVisita.idsVisitantes que entró/salió en este vínculo */
  idsVisitantesAplicados?: string[];
  // Populate
  cliente?: ICliente;
  complejo?: IComplejo;
  eventoVisita?: IEventoVisita;
  ingresoEgreso?: IIngresoEgreso;
  visitantesAplicados?: IVisitante[];
  [key: string]: any;
}

type VinculoEventoIngresoPopulateKey =
  | "cliente"
  | "complejo"
  | "eventoVisita"
  | "ingresoEgreso"
  | "visitantesAplicados";

export type ICreateVinculoEventoIngreso = Omit<
  Partial<IVinculoEventoIngreso>,
  "_id" | "fechaCreacion" | VinculoEventoIngresoPopulateKey
>;
export type IUpdateVinculoEventoIngreso = ICreateVinculoEventoIngreso;

const _VinculoEventoIngresoSchema = z
  .object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    idCliente: z.string().optional(),
    idComplejo: z.string().optional(),
    idEventoVisita: z.string().optional(),
    idIngresoEgreso: z.string().optional(),
    tipo: TipoVinculoEventoIngresoSchema.optional(),
    idsVisitantesAplicados: z.array(z.string()).optional(),
    cliente: ClienteSchema.optional(),
    complejo: ComplejoSchema.optional(),
    eventoVisita: EventoVisitaSchema.optional(),
    ingresoEgreso: IngresoEgresoSchema.optional(),
    visitantesAplicados: z.array(VisitanteSchema).optional(),
  })
  .passthrough();

const _CreateVinculoEventoIngresoSchema = _VinculoEventoIngresoSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
  eventoVisita: true,
  ingresoEgreso: true,
  visitantesAplicados: true,
});

const _UpdateVinculoEventoIngresoSchema =
  _CreateVinculoEventoIngresoSchema.partial();

export const VinculoEventoIngresoSchema: z.ZodType<IVinculoEventoIngreso> =
  _VinculoEventoIngresoSchema as unknown as z.ZodType<IVinculoEventoIngreso>;
export const CreateVinculoEventoIngresoSchema: z.ZodType<ICreateVinculoEventoIngreso> =
  _CreateVinculoEventoIngresoSchema as unknown as z.ZodType<ICreateVinculoEventoIngreso>;
export const UpdateVinculoEventoIngresoSchema: z.ZodType<IUpdateVinculoEventoIngreso> =
  _UpdateVinculoEventoIngresoSchema as unknown as z.ZodType<IUpdateVinculoEventoIngreso>;
