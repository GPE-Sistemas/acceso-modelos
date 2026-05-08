import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";

export const TipoDispositivoSchema = z.enum([
  "Terminal de reconocimiento facial",
  "Lector de huella digital",
  "Lector de tarjeta",
  "Teclado numérico",
  "Otro",
]);

export const ConfigDispositivoSchema = z.object({
    username: z.string().optional(),
    password: z.string().optional(),
    apikey: z.string().optional(),
  });

export const DispositivoSchema = z.object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    idCliente: z.string().optional(),
    idComplejo: z.string().optional(),
    // Datos específicos del dispositivo
    tipo: TipoDispositivoSchema.optional(),
    serialNumber: z.string().optional(),
    marca: z.string().optional(),
    modelo: z.string().optional(),
    config: ConfigDispositivoSchema.optional(),
    // Sharding edge — qué appliance recibe el HTTP Push del terminal.
    // Vacío en complejos N=1 (Standalone): el único edge es dueño implícito.
    idEdgeAppliancePrimario: z.string().optional(),
    idEdgeApplianceSecundario: z.string().optional(),
    // Populate
    cliente: ClienteSchema.optional(),
    complejo: ComplejoSchema.optional(),
  });

export const CreateDispositivoSchema = DispositivoSchema.omit({
  _id: true,
  fechaCreacion: true,
});

export const UpdateDispositivoSchema = DispositivoSchema.omit({
  _id: true,
  fechaCreacion: true,
}).partial();

export type ITipoDispositivo = z.infer<typeof TipoDispositivoSchema>;
export type IConfigDispositivo = z.infer<typeof ConfigDispositivoSchema>;
export type IDispositivo = z.infer<typeof DispositivoSchema>;
export type ICreateDispositivo = z.infer<typeof CreateDispositivoSchema>;
export type IUpdateDispositivo = z.infer<typeof UpdateDispositivoSchema>;
