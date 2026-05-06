import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { RolSchema } from "./rol";
import { UnidadFuncionalSchema } from "./unidad-funcional";
import { UsuarioSchema } from "./usuario";

export const ConfigPermisoSchema = z.record(z.string(), z.any());

export const NivelPermisoSchema = z.enum([
  "Cliente",
  "Complejo",
  "Unidad Funcional",
]);

export type IConfigPermiso = z.infer<typeof ConfigPermisoSchema>;
export type INivelPermiso = z.infer<typeof NivelPermisoSchema>;

const PermisoBaseFields = {
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  habilitado: z.boolean().optional(),
  fechaExpiracion: z.string().optional(),
  username: z.string().optional(),
  idsRoles: z.array(z.string()).optional(),
  config: ConfigPermisoSchema.optional(),
  // Virtuals
  usuario: UsuarioSchema.optional(),
  roles: z.array(RolSchema).optional(),
};

export const PermisoClienteSchema = z.object({
  ...PermisoBaseFields,
  nivel: z.literal("Cliente"),
  idCliente: z.string(),
  // Virtual
  cliente: ClienteSchema.optional(),
});

export const PermisoComplejoSchema = z.object({
  ...PermisoBaseFields,
  nivel: z.literal("Complejo"),
  idCliente: z.string(),
  idComplejo: z.string(),
  // Virtuals
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
});

export const PermisoUnidadFuncionalSchema = z.object({
  ...PermisoBaseFields,
  nivel: z.literal("Unidad Funcional"),
  idCliente: z.string(),
  idComplejo: z.string(),
  idUnidadFuncional: z.string(),
  // Virtuals
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  unidadFuncional: UnidadFuncionalSchema.optional(),
});

export const PermisoSchema = z.discriminatedUnion("nivel", [
  PermisoClienteSchema,
  PermisoComplejoSchema,
  PermisoUnidadFuncionalSchema,
]);

export const CreatePermisoSchema = z.discriminatedUnion("nivel", [
  PermisoClienteSchema
    .omit({
      _id: true,
      fechaCreacion: true,
      usuario: true,
      roles: true,
      cliente: true,
    })
    .extend({ password: z.string().optional() }),
  PermisoComplejoSchema
    .omit({
      _id: true,
      fechaCreacion: true,
      usuario: true,
      roles: true,
      cliente: true,
      complejo: true,
    })
    .extend({ password: z.string().optional() }),
  PermisoUnidadFuncionalSchema
    .omit({
      _id: true,
      fechaCreacion: true,
      usuario: true,
      roles: true,
      cliente: true,
      complejo: true,
      unidadFuncional: true,
    })
    .extend({ password: z.string().optional() }),
]);

export const UpdatePermisoSchema = z.discriminatedUnion("nivel", [
  PermisoClienteSchema
    .omit({
      _id: true,
      fechaCreacion: true,
      usuario: true,
      roles: true,
      cliente: true,
    })
    .partial()
    .extend({ nivel: z.literal("Cliente") }),
  PermisoComplejoSchema
    .omit({
      _id: true,
      fechaCreacion: true,
      usuario: true,
      roles: true,
      cliente: true,
      complejo: true,
    })
    .partial()
    .extend({ nivel: z.literal("Complejo") }),
  PermisoUnidadFuncionalSchema
    .omit({
      _id: true,
      fechaCreacion: true,
      usuario: true,
      roles: true,
      cliente: true,
      complejo: true,
      unidadFuncional: true,
    })
    .partial()
    .extend({ nivel: z.literal("Unidad Funcional") }),
]);

export type IPermisoCliente = z.infer<typeof PermisoClienteSchema>;
export type IPermisoComplejo = z.infer<typeof PermisoComplejoSchema>;
export type IPermisoUnidadFuncional = z.infer<
  typeof PermisoUnidadFuncionalSchema
>;
export type IPermiso = z.infer<typeof PermisoSchema>;
export type ICreatePermiso = z.infer<typeof CreatePermisoSchema>;
export type IUpdatePermiso = z.infer<typeof UpdatePermisoSchema>;
