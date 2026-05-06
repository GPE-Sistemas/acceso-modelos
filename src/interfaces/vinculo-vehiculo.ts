import { z } from "zod";
import type { ICliente } from "./cliente";
import { ClienteSchema } from "./cliente";
import type { IComplejo } from "./complejo";
import { ComplejoSchema } from "./complejo";
import type { IPermiso } from "./permiso";
import { PermisoSchema } from "./permiso";
import type { IVehiculo } from "./vehiculo";
import { VehiculoSchema } from "./vehiculo";
import type { IVisitante } from "./visitante";
import { VisitanteSchema } from "./visitante";

export const TipoVinculoVehiculoSchema = z.enum(["Titular", "Autorizado"]);
export type ITipoVinculoVehiculo = z.infer<typeof TipoVinculoVehiculoSchema>;

export interface IVinculoVehiculo {
  _id?: string;
  fechaCreacion?: string;
  idCliente?: string;
  idComplejo?: string;
  idVehiculo?: string;
  /** Mutuamente excluyente con idVisitante */
  idPermiso?: string;
  /** Mutuamente excluyente con idPermiso */
  idVisitante?: string;
  tipo?: ITipoVinculoVehiculo;
  // Populate
  cliente?: ICliente;
  complejo?: IComplejo;
  vehiculo?: IVehiculo;
  permiso?: IPermiso;
  visitante?: IVisitante;
  [key: string]: any;
}

type VinculoVehiculoPopulateKey =
  | "cliente"
  | "complejo"
  | "vehiculo"
  | "permiso"
  | "visitante";

export type ICreateVinculoVehiculo = Omit<
  Partial<IVinculoVehiculo>,
  "_id" | "fechaCreacion" | VinculoVehiculoPopulateKey
>;
export type IUpdateVinculoVehiculo = ICreateVinculoVehiculo;

const _VinculoVehiculoSchema = z
  .object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    idCliente: z.string().optional(),
    idComplejo: z.string().optional(),
    idVehiculo: z.string().optional(),
    idPermiso: z.string().optional(),
    idVisitante: z.string().optional(),
    tipo: TipoVinculoVehiculoSchema.optional(),
    cliente: ClienteSchema.optional(),
    complejo: ComplejoSchema.optional(),
    vehiculo: VehiculoSchema.optional(),
    permiso: PermisoSchema.optional(),
    visitante: VisitanteSchema.optional(),
  })
  .passthrough();

const _CreateVinculoVehiculoSchema = _VinculoVehiculoSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
  vehiculo: true,
  permiso: true,
  visitante: true,
});

const _UpdateVinculoVehiculoSchema = _CreateVinculoVehiculoSchema.partial();

export const VinculoVehiculoSchema: z.ZodType<IVinculoVehiculo> =
  _VinculoVehiculoSchema as unknown as z.ZodType<IVinculoVehiculo>;
export const CreateVinculoVehiculoSchema: z.ZodType<ICreateVinculoVehiculo> =
  _CreateVinculoVehiculoSchema as unknown as z.ZodType<ICreateVinculoVehiculo>;
export const UpdateVinculoVehiculoSchema: z.ZodType<IUpdateVinculoVehiculo> =
  _UpdateVinculoVehiculoSchema as unknown as z.ZodType<IUpdateVinculoVehiculo>;
