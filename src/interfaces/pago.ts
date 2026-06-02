import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { UnidadFuncionalSchema } from "./unidad-funcional";
import { ExpensaUnidadFuncionalSchema } from "./expensa-unidad-funcional";

/**
 * Registro de un pago. **Sin pasarela de cobro** — solo lleva el registro.
 * Entidad genérica por diseño: hoy solo paga expensas (`tipo='Expensa'`), pero
 * el discriminante `tipo` + la referencia polimórfica la dejan lista para el
 * futuro módulo de multas. Al construirse multas, el complejo configurará si se
 * pagan dentro de la expensa (multa = ítem de la liquidación, se cubre con un
 * pago `tipo='Expensa'`) o por separado (`tipo='Multa'` + `idMulta`); la misma
 * entidad `IPago` funciona en ambos modos.
 *
 * Soporta pagos parciales (varios pagos por cargo). Al registrar o eliminar,
 * acceso-api recalcula `montoPagado` y `estadoPago` del documento referenciado
 * (hoy la `IExpensaUnidadFuncional`).
 */

/** Tipo de cargo que paga. Hoy solo 'Expensa'; se extiende al sumar multas. */
export const TipoPagoSchema = z.enum(["Expensa"]);
export type ETipoPago = z.infer<typeof TipoPagoSchema>;

export const MedioPagoSchema = z.enum([
  "Efectivo",
  "Transferencia",
  "Débito",
  "Cheque",
  "Otro",
]);
export type EMedioPago = z.infer<typeof MedioPagoSchema>;

export const PagoSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  idUnidadFuncional: z.string().optional(),
  /** Discriminante del cargo pagado. Default 'Expensa'. */
  tipo: TipoPagoSchema.optional(),
  /** Cargo referenciado cuando `tipo='Expensa'`. */
  idExpensaUF: z.string().optional(),
  // Futuro: idMulta cuando tipo='Multa'.
  /** Período "YYYY-MM" al que aplica el pago (denormalizado). */
  periodo: z.string().optional(),
  monto: z.number().positive().optional(),
  /** Fecha del pago (ISO 8601). */
  fecha: z.string().optional(),
  medio: MedioPagoSchema.optional(),
  /** Nro. de comprobante / transferencia / cheque. */
  referencia: z.string().optional(),
  observaciones: z.string().optional(),
  /** Permiso que registró el pago (auditoría). */
  idPermisoRegistro: z.string().optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  unidadFuncional: UnidadFuncionalSchema.optional(),
  expensaUnidadFuncional: ExpensaUnidadFuncionalSchema.optional(),
});

export const CreatePagoSchema = PagoSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
  unidadFuncional: true,
  expensaUnidadFuncional: true,
});

export const UpdatePagoSchema = CreatePagoSchema.partial();

export type IPago = z.infer<typeof PagoSchema>;
export type ICreatePago = z.infer<typeof CreatePagoSchema>;
export type IUpdatePago = z.infer<typeof UpdatePagoSchema>;
