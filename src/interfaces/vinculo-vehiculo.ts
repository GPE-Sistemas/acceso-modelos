import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { PermisoSchema } from "./permiso";
import { VehiculoSchema } from "./vehiculo";
import { VisitanteSchema } from "./visitante";

export const TipoVinculoVehiculoSchema = z.enum(["Titular", "Autorizado"]);
export type ITipoVinculoVehiculo = z.infer<typeof TipoVinculoVehiculoSchema>;

export const VinculoVehiculoSchema = z.looseObject({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  idVehiculo: z.string().optional(),
  /** Mutuamente excluyente con idVisitante */
  idPermiso: z.string().optional(),
  /** Mutuamente excluyente con idPermiso */
  idVisitante: z.string().optional(),
  tipo: TipoVinculoVehiculoSchema.optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  vehiculo: VehiculoSchema.optional(),
  permiso: PermisoSchema.optional(),
  visitante: VisitanteSchema.optional(),
});

export const CreateVinculoVehiculoSchema = VinculoVehiculoSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
  vehiculo: true,
  permiso: true,
  visitante: true,
});

export const UpdateVinculoVehiculoSchema = CreateVinculoVehiculoSchema.partial();

export type IVinculoVehiculo = z.infer<typeof VinculoVehiculoSchema>;
export type ICreateVinculoVehiculo = z.infer<typeof CreateVinculoVehiculoSchema>;
export type IUpdateVinculoVehiculo = z.infer<typeof UpdateVinculoVehiculoSchema>;
