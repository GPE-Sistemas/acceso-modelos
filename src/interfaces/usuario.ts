import { z } from "zod";

export const DatosPersonalesSchema = z.object({
    nombre: z.string().optional(),
    dni: z.string().optional(),
    sexo: z.string().optional(),
    email: z.string().optional(),
    direccion: z.string().optional(),
    pais: z.string().optional(),
    telefono: z.string().optional(),
    fechaNacimiento: z.string().optional(),
    foto: z.string().optional(),
  });

export const ConfigUsuarioSchema = z.record(z.string(), z.any());

export const UsuarioSchema = z.object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    usuario: z.string().optional(),
    hash: z.string().optional(),
    datosPersonales: DatosPersonalesSchema.optional(),
    config: ConfigUsuarioSchema.optional(),
  });

export const CreateUsuarioSchema = UsuarioSchema.omit({
  _id: true,
  fechaCreacion: true,
}).extend({
  password: z.string().optional(),
});

export const UpdateUsuarioSchema = UsuarioSchema.omit({
  _id: true,
  fechaCreacion: true,
}).partial();

export type IDatosPersonales = z.infer<typeof DatosPersonalesSchema>;
export type IConfigUsuario = z.infer<typeof ConfigUsuarioSchema>;
export type IUsuario = z.infer<typeof UsuarioSchema>;
export type ICreateUsuario = z.infer<typeof CreateUsuarioSchema>;
export type IUpdateUsuario = z.infer<typeof UpdateUsuarioSchema>;
