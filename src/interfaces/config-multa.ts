import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { MoraConfigSchema } from "./config-expensa";

/**
 * Configuración de multas de un complejo. Una por complejo (índice único en
 * idComplejo, lazy create con defaults). Hoy solo lleva la política de mora que
 * se aplica a las multas con forma de cobro "Pago aparte" cuando vencen impagas.
 *
 * Política de mora **independiente** de la de expensas (entidad propia, decisión
 * con Fernando) aunque reusa el mismo `MoraConfigSchema` (tasas versionadas por
 * período, Simple/Compuesto, días de gracia). Patrón análogo a
 * `IConfigExpensaComplejo` — endpoints `GET/PUT /config-multa/by-complejo/:idComplejo`.
 */

export const ConfigMultaComplejoSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  mora: MoraConfigSchema.optional(),
  habilitado: z.boolean().optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
});

export const CreateConfigMultaComplejoSchema = ConfigMultaComplejoSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  cliente: true,
  complejo: true,
});

export const UpdateConfigMultaComplejoSchema = ConfigMultaComplejoSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  idCliente: true,
  idComplejo: true,
  cliente: true,
  complejo: true,
}).partial();

export type IConfigMultaComplejo = z.infer<typeof ConfigMultaComplejoSchema>;
export type ICreateConfigMultaComplejo = z.infer<
  typeof CreateConfigMultaComplejoSchema
>;
export type IUpdateConfigMultaComplejo = z.infer<
  typeof UpdateConfigMultaComplejoSchema
>;
