import { z } from "zod";

export const ConfigClienteSchema = z.object({}).passthrough();

/**
 * Proveedor: el tenant del proveedor del software, con visibilidad global sobre todos los clientes.
 * Cliente: tenant de un cliente final, gestiona sus propios Complejos.
 */
export const TipoClienteSchema = z.enum(["Proveedor", "Cliente"]);

export const ClienteSchema = z
  .object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    habilitado: z.boolean().optional(),
    nombre: z.string().optional(),
    tipoCliente: TipoClienteSchema.optional(),
    config: ConfigClienteSchema.optional(),
  })
  .passthrough();

export const CreateClienteSchema = ClienteSchema.omit({
  _id: true,
  fechaCreacion: true,
});

export const UpdateClienteSchema = ClienteSchema.omit({
  _id: true,
  fechaCreacion: true,
}).partial();

export type IConfigCliente = z.infer<typeof ConfigClienteSchema> & {
  [key: string]: any;
};
export type ITipoCliente = z.infer<typeof TipoClienteSchema>;
export type ICliente = z.infer<typeof ClienteSchema>;
export type ICreateCliente = z.infer<typeof CreateClienteSchema>;
export type IUpdateCliente = z.infer<typeof UpdateClienteSchema>;
