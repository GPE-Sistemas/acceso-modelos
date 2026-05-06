import { z } from "zod";

export const PreferenciasContactosSchema = z
  .object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    fechaActualizacion: z.string().optional(),
    idUsuario: z.string().optional(),
    /** Master para push categoria 'alerta_contacto' */
    recibirAlertas: z.boolean().optional(),
    /** Push categoria 'contacto_invitacion' */
    recibirInvitaciones: z.boolean().optional(),
  })
  .passthrough();

export const CreatePreferenciasContactosSchema =
  PreferenciasContactosSchema.omit({
    _id: true,
    fechaCreacion: true,
    fechaActualizacion: true,
  });

export const UpdatePreferenciasContactosSchema =
  PreferenciasContactosSchema.omit({
    _id: true,
    fechaCreacion: true,
    fechaActualizacion: true,
    idUsuario: true,
  }).partial();

export type IPreferenciasContactos = z.infer<
  typeof PreferenciasContactosSchema
>;
export type ICreatePreferenciasContactos = z.infer<
  typeof CreatePreferenciasContactosSchema
>;
export type IUpdatePreferenciasContactos = z.infer<
  typeof UpdatePreferenciasContactosSchema
>;

export const PREFERENCIAS_CONTACTOS_DEFAULT: Required<
  Pick<IPreferenciasContactos, "recibirAlertas" | "recibirInvitaciones">
> = {
  recibirAlertas: true,
  recibirInvitaciones: true,
};
