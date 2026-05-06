import { z } from "zod";
import { UsuarioSchema } from "./usuario";

export const EstadoContactoUsuarioSchema = z.enum([
  "Pendiente",
  "Aceptado",
  "Rechazado",
  "Bloqueado",
]);

export const ContactoUsuarioSchema = z.object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    idUsuarioEmisor: z.string().optional(),
    idUsuarioReceptor: z.string().optional(),
    estado: EstadoContactoUsuarioSchema.optional(),
    fechaResolucion: z.string().optional(),
    silenciadoPorReceptor: z.boolean().optional(),
    // Populate
    usuarioEmisor: UsuarioSchema.optional(),
    usuarioReceptor: UsuarioSchema.optional(),
  });

export const CreateContactoUsuarioSchema = ContactoUsuarioSchema.omit({
  _id: true,
  fechaCreacion: true,
  estado: true,
  fechaResolucion: true,
  silenciadoPorReceptor: true,
  usuarioEmisor: true,
  usuarioReceptor: true,
});

export const UpdateContactoUsuarioSchema = ContactoUsuarioSchema.omit({
  _id: true,
  fechaCreacion: true,
  idUsuarioEmisor: true,
  idUsuarioReceptor: true,
  usuarioEmisor: true,
  usuarioReceptor: true,
}).partial();

export type IEstadoContactoUsuario = z.infer<typeof EstadoContactoUsuarioSchema>;
export type IContactoUsuario = z.infer<typeof ContactoUsuarioSchema>;
export type ICreateContactoUsuario = z.infer<
  typeof CreateContactoUsuarioSchema
>;
export type IUpdateContactoUsuario = z.infer<
  typeof UpdateContactoUsuarioSchema
>;
