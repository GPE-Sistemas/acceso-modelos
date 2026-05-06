import { z } from "zod";
import { AccesoSchema } from "./acceso";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { DispositivoSchema } from "./dispositivo";

export const ComportamientoCredencialValidaSchema = z.enum([
  "Apertura Automática",
  "Aprobación Manual",
]);
export const ComportamientoCredencialInvalidaSchema = z.enum([
  "Ignorar",
  "Crear Ingreso",
]);

export const DispositivoAccesoSchema = z
  .object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    idCliente: z.string().optional(),
    idComplejo: z.string().optional(),
    idDispositivo: z.string().optional(),
    idAcceso: z.string().optional(),
    /** Cuando un dispositivo está en mas de un acceso representa cómo el reporte del dispositivo representa este acceso. */
    canalDispositivo: z.string().optional(),
    comportamientoCredencialValida:
      ComportamientoCredencialValidaSchema.optional(),
    comportamientoCredencialInvalida:
      ComportamientoCredencialInvalidaSchema.optional(),
    /** Indica si el dispositivo puede recibir un comando para abrir el acceso */
    aperturaConComando: z.boolean().optional(),
    // Populate
    cliente: ClienteSchema.optional(),
    complejo: ComplejoSchema.optional(),
    dispositivo: DispositivoSchema.optional(),
    acceso: AccesoSchema.optional(),
  })
  .passthrough();

export const CreateDispositivoAccesoSchema = DispositivoAccesoSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
  dispositivo: true,
  acceso: true,
});

export const UpdateDispositivoAccesoSchema = DispositivoAccesoSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
  dispositivo: true,
  acceso: true,
}).partial();

export type IComportamientoCredencialValida = z.infer<
  typeof ComportamientoCredencialValidaSchema
>;
export type IComportamientoCredencialInvalida = z.infer<
  typeof ComportamientoCredencialInvalidaSchema
>;
export type IDispositivoAcceso = z.infer<typeof DispositivoAccesoSchema>;
export type ICreateDispositivoAcceso = z.infer<
  typeof CreateDispositivoAccesoSchema
>;
export type IUpdateDispositivoAcceso = z.infer<
  typeof UpdateDispositivoAccesoSchema
>;
