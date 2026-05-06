import { z } from "zod";
import type { ICliente } from "./cliente";
import { ClienteSchema } from "./cliente";
import type { IComplejo } from "./complejo";
import { ComplejoSchema } from "./complejo";
import type { IRol } from "./rol";
import { RolSchema } from "./rol";
import type { IUnidadFuncional } from "./unidad-funcional";
import { UnidadFuncionalSchema } from "./unidad-funcional";
import type { IUsuario } from "./usuario";
import { UsuarioSchema } from "./usuario";

export const ConfigPermisoSchema = z.object({}).passthrough();

export const NivelPermisoSchema = z.enum([
  "Cliente",
  "Complejo",
  "Unidad Funcional",
]);

export type IConfigPermiso = { [key: string]: any };
export type INivelPermiso = z.infer<typeof NivelPermisoSchema>;

interface IPermisoBase {
  _id?: string;
  fechaCreacion?: string;
  habilitado?: boolean;
  fechaExpiracion?: string;
  username?: string;
  idsRoles?: string[];
  config?: IConfigPermiso;
  // Virtuals
  usuario?: IUsuario;
  roles?: IRol[];
}

export interface IPermisoCliente extends IPermisoBase {
  nivel: "Cliente";
  idCliente: string;
  // Virtual
  cliente?: ICliente;
}

export interface IPermisoComplejo extends IPermisoBase {
  nivel: "Complejo";
  idCliente: string;
  idComplejo: string;
  // Virtuals
  cliente?: ICliente;
  complejo?: IComplejo;
}

export interface IPermisoUnidadFuncional extends IPermisoBase {
  nivel: "Unidad Funcional";
  idCliente: string;
  idComplejo: string;
  idUnidadFuncional: string;
  // Virtuals
  cliente?: ICliente;
  complejo?: IComplejo;
  unidadFuncional?: IUnidadFuncional;
}

export type IPermiso =
  | IPermisoCliente
  | IPermisoComplejo
  | IPermisoUnidadFuncional;

type CreatePermisoBase = Omit<
  IPermisoBase,
  "_id" | "fechaCreacion" | "usuario" | "roles"
> & { password?: string };

export type ICreatePermiso =
  | (CreatePermisoBase & {
      nivel: "Cliente";
      idCliente: string;
    })
  | (CreatePermisoBase & {
      nivel: "Complejo";
      idCliente: string;
      idComplejo: string;
    })
  | (CreatePermisoBase & {
      nivel: "Unidad Funcional";
      idCliente: string;
      idComplejo: string;
      idUnidadFuncional: string;
    });

export type IUpdatePermiso =
  | (Partial<Omit<IPermisoCliente, "_id" | "fechaCreacion" | "usuario" | "roles" | "cliente">> & {
      nivel: "Cliente";
    })
  | (Partial<Omit<IPermisoComplejo, "_id" | "fechaCreacion" | "usuario" | "roles" | "cliente" | "complejo">> & {
      nivel: "Complejo";
    })
  | (Partial<Omit<IPermisoUnidadFuncional, "_id" | "fechaCreacion" | "usuario" | "roles" | "cliente" | "complejo" | "unidadFuncional">> & {
      nivel: "Unidad Funcional";
    });

const PermisoBaseFields = {
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  habilitado: z.boolean().optional(),
  fechaExpiracion: z.string().optional(),
  username: z.string().optional(),
  idsRoles: z.array(z.string()).optional(),
  config: ConfigPermisoSchema.optional(),
  usuario: UsuarioSchema.optional(),
  roles: z.array(RolSchema).optional(),
};

const _PermisoClienteSchema = z
  .object({
    ...PermisoBaseFields,
    nivel: z.literal("Cliente"),
    idCliente: z.string(),
    cliente: ClienteSchema.optional(),
  })
  .passthrough();

const _PermisoComplejoSchema = z
  .object({
    ...PermisoBaseFields,
    nivel: z.literal("Complejo"),
    idCliente: z.string(),
    idComplejo: z.string(),
    cliente: ClienteSchema.optional(),
    complejo: ComplejoSchema.optional(),
  })
  .passthrough();

const _PermisoUnidadFuncionalSchema = z
  .object({
    ...PermisoBaseFields,
    nivel: z.literal("Unidad Funcional"),
    idCliente: z.string(),
    idComplejo: z.string(),
    idUnidadFuncional: z.string(),
    cliente: ClienteSchema.optional(),
    complejo: ComplejoSchema.optional(),
    unidadFuncional: UnidadFuncionalSchema.optional(),
  })
  .passthrough();

const _PermisoSchema = z.discriminatedUnion("nivel", [
  _PermisoClienteSchema,
  _PermisoComplejoSchema,
  _PermisoUnidadFuncionalSchema,
]);

const _CreatePermisoSchema = z.discriminatedUnion("nivel", [
  _PermisoClienteSchema
    .omit({
      _id: true,
      fechaCreacion: true,
      usuario: true,
      roles: true,
      cliente: true,
    })
    .extend({ password: z.string().optional() }),
  _PermisoComplejoSchema
    .omit({
      _id: true,
      fechaCreacion: true,
      usuario: true,
      roles: true,
      cliente: true,
      complejo: true,
    })
    .extend({ password: z.string().optional() }),
  _PermisoUnidadFuncionalSchema
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

const _UpdatePermisoSchema = z.discriminatedUnion("nivel", [
  _PermisoClienteSchema
    .omit({
      _id: true,
      fechaCreacion: true,
      usuario: true,
      roles: true,
      cliente: true,
    })
    .partial()
    .extend({ nivel: z.literal("Cliente") }),
  _PermisoComplejoSchema
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
  _PermisoUnidadFuncionalSchema
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

export const PermisoClienteSchema: z.ZodType<IPermisoCliente> =
  _PermisoClienteSchema as unknown as z.ZodType<IPermisoCliente>;
export const PermisoComplejoSchema: z.ZodType<IPermisoComplejo> =
  _PermisoComplejoSchema as unknown as z.ZodType<IPermisoComplejo>;
export const PermisoUnidadFuncionalSchema: z.ZodType<IPermisoUnidadFuncional> =
  _PermisoUnidadFuncionalSchema as unknown as z.ZodType<IPermisoUnidadFuncional>;
export const PermisoSchema: z.ZodType<IPermiso> =
  _PermisoSchema as unknown as z.ZodType<IPermiso>;
export const CreatePermisoSchema: z.ZodType<ICreatePermiso> =
  _CreatePermisoSchema as unknown as z.ZodType<ICreatePermiso>;
export const UpdatePermisoSchema: z.ZodType<IUpdatePermiso> =
  _UpdatePermisoSchema as unknown as z.ZodType<IUpdatePermiso>;
