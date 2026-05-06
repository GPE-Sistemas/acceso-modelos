import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { DispositivoSchema } from "./dispositivo";
import { PermisoSchema } from "./permiso";

export const CredencialDispositivoSchema = z.object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    idCliente: z.string().optional(),
    idComplejo: z.string().optional(),
    idDispositivo: z.string().optional(),
    /** Valor propio del dispositivo (id de cara, número de tarjeta, QR, PIN, etc.) */
    identificador: z.string().optional(),
    idPermiso: z.string().optional(),
    // Populate
    cliente: ClienteSchema.optional(),
    complejo: ComplejoSchema.optional(),
    dispositivo: DispositivoSchema.optional(),
    permiso: PermisoSchema.optional(),
  });

export const CreateCredencialDispositivoSchema = CredencialDispositivoSchema.omit(
  {
    _id: true,
    fechaCreacion: true,
    cliente: true,
    complejo: true,
    dispositivo: true,
    permiso: true,
  },
);

export const UpdateCredencialDispositivoSchema = CredencialDispositivoSchema.omit(
  {
    _id: true,
    fechaCreacion: true,
    cliente: true,
    complejo: true,
    dispositivo: true,
    permiso: true,
  },
).partial();

export type ICredencialDispositivo = z.infer<typeof CredencialDispositivoSchema>;
export type ICreateCredencialDispositivo = z.infer<
  typeof CreateCredencialDispositivoSchema
>;
export type IUpdateCredencialDispositivo = z.infer<
  typeof UpdateCredencialDispositivoSchema
>;
