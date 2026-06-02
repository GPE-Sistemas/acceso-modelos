import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { ConceptoExpensaSchema, MoraConfigSchema } from "./config-expensa";

/**
 * Cabecera de la liquidación de expensas de un complejo para un período.
 * Una por (complejo, período) — índice único `(idComplejo, periodo)`.
 *
 * Ciclo: `Borrador` (recalculable / borrable) → `Emitida` (congela snapshot,
 * inmutable, habilita registro de pagos sobre sus `IExpensaUnidadFuncional`) →
 * `Cerrada` (cierre del período).
 */

export const EstadoLiquidacionExpensaSchema = z.enum([
  "Borrador",
  "Emitida",
  "Cerrada",
]);
export type EEstadoLiquidacionExpensa = z.infer<
  typeof EstadoLiquidacionExpensaSchema
>;

export const LiquidacionExpensaSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  /** Período mensual, formato "YYYY-MM". */
  periodo: z.string().optional(),
  estado: EstadoLiquidacionExpensaSchema.optional(),
  /**
   * Snapshot de la configuración usada al generar — inmutable tras Emitir.
   * Garantiza que un recibo viejo no cambie si después se edita la config.
   */
  conceptosSnapshot: z.array(ConceptoExpensaSchema).optional(),
  moraSnapshot: MoraConfigSchema.optional(),
  /** Suma de `totalPeriodo` de todas las expensas-UF de esta liquidación. */
  totalLiquidado: z.number().nonnegative().optional(),
  /** Cantidad de UF facturadas en esta liquidación. */
  cantidadUF: z.number().int().nonnegative().optional(),
  fechaEmision: z.string().optional(),
  fechaCierre: z.string().optional(),
  /** Permiso que generó la liquidación (auditoría). */
  idPermisoGenero: z.string().optional(),
  observaciones: z.string().optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
});

export const CreateLiquidacionExpensaSchema = LiquidacionExpensaSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  cliente: true,
  complejo: true,
});

export const UpdateLiquidacionExpensaSchema =
  CreateLiquidacionExpensaSchema.partial();

export type ILiquidacionExpensa = z.infer<typeof LiquidacionExpensaSchema>;
export type ICreateLiquidacionExpensa = z.infer<
  typeof CreateLiquidacionExpensaSchema
>;
export type IUpdateLiquidacionExpensa = z.infer<
  typeof UpdateLiquidacionExpensaSchema
>;
