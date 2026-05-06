import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { UnidadFuncionalSchema } from "./unidad-funcional";

export const DatosVehiculoSchema = z
  .object({
    marca: z.string().optional(),
    modelo: z.string().optional(),
    color: z.string().optional(),
    patente: z.string().optional(),
  })
  .passthrough();

export const VehiculoSchema = z
  .object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    idCliente: z.string().optional(),
    idComplejo: z.string().optional(),
    idUnidadFuncional: z.string().optional(),
    datosVehiculo: DatosVehiculoSchema.optional(),
    // Populate
    cliente: ClienteSchema.optional(),
    complejo: ComplejoSchema.optional(),
    unidadFuncional: UnidadFuncionalSchema.optional(),
  })
  .passthrough();

export const CreateVehiculoSchema = VehiculoSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
  unidadFuncional: true,
});

export const UpdateVehiculoSchema = VehiculoSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
  unidadFuncional: true,
}).partial();

export type IDatosVehiculo = z.infer<typeof DatosVehiculoSchema>;
export type IVehiculo = z.infer<typeof VehiculoSchema>;
export type ICreateVehiculo = z.infer<typeof CreateVehiculoSchema>;
export type IUpdateVehiculo = z.infer<typeof UpdateVehiculoSchema>;
