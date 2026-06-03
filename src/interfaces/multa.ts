import { z } from "zod";
import {
  InfraccionMultaBaseFields,
  InfraccionMultaBaseOmit,
} from "./infraccion-multa-base";
import { EstadoPagoExpensaSchema } from "./expensa-unidad-funcional";

/**
 * Multa aplicada a una unidad funcional. Se crea manualmente por un usuario del
 * complejo (a futuro podría generarla un dispositivo — ver `origen`). Puede
 * **liquidarse junto con las expensas** (entra como ítem de la liquidación, el
 * cobro se sigue en la expensa-UF) o **cobrarse aparte** (registro de pagos
 * sobre la propia multa, con mora si vence impaga).
 *
 * Ciclo de vida (`estado`): Borrador → Emitida → (Pagada | Liquidada | Anulada).
 * - `Pagada`: forma de cobro "Pago aparte", saldada vía `IPago` tipo='Multa'.
 * - `Liquidada`: forma de cobro "Liquidar con expensa", incluida en una
 *   liquidación (`facturada=true` + `idExpensaUF`). El cobro real vive en la
 *   expensa-UF; la multa no duplica el tracking de pago.
 * - "Vencida" NO es un estado persistido: se deriva en lectura de
 *   `fechaVencimiento < now && estadoPago !== 'Pagada'`.
 */

export const EstadoMultaSchema = z.enum([
  "Borrador",
  "Emitida",
  "Pagada",
  "Liquidada",
  "Anulada",
]);
export type EEstadoMulta = z.infer<typeof EstadoMultaSchema>;

export const FormaCobroMultaSchema = z.enum([
  "Liquidar con expensa",
  "Pago aparte",
]);
export type EFormaCobroMulta = z.infer<typeof FormaCobroMultaSchema>;

export const MultaSchema = z.object({
  ...InfraccionMultaBaseFields,
  estado: EstadoMultaSchema.optional(),
  formaCobro: FormaCobroMultaSchema.optional(),
  monto: z.number().positive().optional(),
  fechaEmision: z.string().optional(),
  /** Solo informativo; aplica cuando formaCobro='Pago aparte'. */
  fechaVencimiento: z.string().optional(),
  /** Infracción que escaló a esta multa (opcional). */
  idInfraccion: z.string().optional(),
  // Cobro "Pago aparte" — mantenidos por acceso-api.
  estadoPago: EstadoPagoExpensaSchema.optional(),
  montoPagado: z.number().nonnegative().optional(),
  /** Interés por mora acumulado (pago aparte vencido). Calculado read-time. */
  recargoMora: z.number().nonnegative().optional(),
  /** monto + recargoMora - montoPagado. */
  totalAdeudado: z.number().optional(),
  // Cobro "Liquidar con expensa" — patrón turno (facturado/idExpensaUF).
  facturada: z.boolean().optional(),
  idExpensaUF: z.string().optional(),
  // Populate (z.any para evitar circularidad multa↔infracción / expensa-uf).
  infraccion: z.any().optional(),
  expensaUnidadFuncional: z.any().optional(),
});

export const CreateMultaSchema = MultaSchema.omit({
  ...InfraccionMultaBaseOmit,
  estado: true,
  fechaEmision: true,
  estadoPago: true,
  montoPagado: true,
  recargoMora: true,
  totalAdeudado: true,
  facturada: true,
  idExpensaUF: true,
  infraccion: true,
  expensaUnidadFuncional: true,
});

export const UpdateMultaSchema = CreateMultaSchema.partial();

export type IMulta = z.infer<typeof MultaSchema>;
export type ICreateMulta = z.infer<typeof CreateMultaSchema>;
export type IUpdateMulta = z.infer<typeof UpdateMultaSchema>;
