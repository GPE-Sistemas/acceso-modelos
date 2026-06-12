import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { UnidadFuncionalSchema } from "./unidad-funcional";
import { LiquidacionExpensaSchema } from "./liquidacion-expensa";

/**
 * Expensa de una UF para un período — el recibo / cuenta corriente de la UF.
 * Una por (liquidación, UF). Lleva el desglose embebido en `items` y el estado
 * de pago denormalizado.
 *
 * Alto volumen → sin caché Redis completa. El "estado de cuentas" se agrega
 * read-time sobre esta entidad + `IPagoExpensa`.
 */

// ─── Tipo de ítem del desglose ────────────────────────────────────────────────

export const TipoItemExpensaSchema = z.enum([
  /** Rubro de la configuración (parte fija y/o variable). */
  "Concepto",
  /** Cargo por un turno tomado en el período (referencia `idTurno`). */
  "Cargo turno",
  /** Cargo por una solicitud cobrable resuelta en el período (referencia `idTicket`). */
  "Cargo solicitud",
  /** Deuda no saldada arrastrada de un período anterior. */
  "Saldo anterior",
  /** Interés por mora sobre saldo impago. */
  "Interés",
  /** Multa liquidada junto con la expensa (referencia `idMulta`). */
  "Multa",
  /** Derecho de construcción mensual de una obra en ejecución (referencia `idObra`, Fase 2 Obras). */
  "Derecho de construcción",
  /** Costo de reinspección de una obra (referencia `idObra`, Fase 2 Obras). */
  "Reinspección de obra",
  /** Ajuste manual (crédito/débito). */
  "Ajuste",
]);
export type ETipoItemExpensa = z.infer<typeof TipoItemExpensaSchema>;

// ─── Estado de pago ────────────────────────────────────────────────────────────

export const EstadoPagoExpensaSchema = z.enum([
  "Pendiente",
  "Parcial",
  "Pagada",
]);
export type EEstadoPagoExpensa = z.infer<typeof EstadoPagoExpensaSchema>;

// ─── Ítem del desglose (subdoc embedded) ─────────────────────────────────────

export const ItemExpensaSchema = z.object({
  _id: z.string().optional(),
  tipo: TipoItemExpensaSchema,
  descripcion: z.string(),
  /** Importe del ítem (puede ser negativo para ajustes/créditos). */
  monto: z.number(),
  /** Concepto de la config que originó el ítem (tipo='Concepto'). */
  idConcepto: z.string().optional(),
  /** Turno que originó el cargo (tipo='Cargo turno'). */
  idTurno: z.string().optional(),
  /** Solicitud (ticket) que originó el cargo (tipo='Cargo solicitud'). */
  idTicket: z.string().optional(),
  /** Multa que originó el cargo (tipo='Multa'). */
  idMulta: z.string().optional(),
  /** Obra que originó el cargo (tipo='Derecho de construcción' / 'Reinspección de obra'). */
  idObra: z.string().optional(),
  /** Período de origen "YYYY-MM" (tipo='Saldo anterior' / 'Interés'). */
  periodoOrigen: z.string().optional(),
  /** Tasa mensual aplicada en este tramo de interés (tipo='Interés'). */
  tasaAplicada: z.number().nonnegative().optional(),
});
export type IItemExpensa = z.infer<typeof ItemExpensaSchema>;

// ─── Snapshot de la UF al liquidar ────────────────────────────────────────────

export const UfSnapshotExpensaSchema = z.object({
  nombre: z.string().optional(),
  tipo: z.string().optional(),
  coeficiente: z.number().optional(),
  superficie: z.number().optional(),
});
export type IUfSnapshotExpensa = z.infer<typeof UfSnapshotExpensaSchema>;

// ─── Expensa de la UF ──────────────────────────────────────────────────────────

export const ExpensaUnidadFuncionalSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  idLiquidacion: z.string().optional(),
  idUnidadFuncional: z.string().optional(),
  /** Período "YYYY-MM" (denormalizado de la liquidación para query directa). */
  periodo: z.string().optional(),
  /** Snapshot inmutable de la UF — sobrevive a edits/baja del catálogo. */
  ufSnapshot: UfSnapshotExpensaSchema.optional(),
  items: z.array(ItemExpensaSchema).optional(),
  /** Total del período (conceptos + cargos turnos + interés, sin saldo anterior). */
  totalPeriodo: z.number().optional(),
  /** Saldo impago arrastrado del período previo. */
  saldoAnterior: z.number().optional(),
  /** Total adeudado = totalPeriodo + saldoAnterior - pagos. */
  totalAdeudado: z.number().optional(),
  estadoPago: EstadoPagoExpensaSchema.optional(),
  /** Suma de pagos registrados — denormalizado, mantenido por acceso-api. */
  montoPagado: z.number().nonnegative().optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  unidadFuncional: UnidadFuncionalSchema.optional(),
  liquidacion: LiquidacionExpensaSchema.optional(),
});

export const CreateExpensaUnidadFuncionalSchema =
  ExpensaUnidadFuncionalSchema.omit({
    _id: true,
    fechaCreacion: true,
    fechaActualizacion: true,
    cliente: true,
    complejo: true,
    unidadFuncional: true,
    liquidacion: true,
  });

export const UpdateExpensaUnidadFuncionalSchema =
  CreateExpensaUnidadFuncionalSchema.partial();

export type IExpensaUnidadFuncional = z.infer<
  typeof ExpensaUnidadFuncionalSchema
>;
export type ICreateExpensaUnidadFuncional = z.infer<
  typeof CreateExpensaUnidadFuncionalSchema
>;
export type IUpdateExpensaUnidadFuncional = z.infer<
  typeof UpdateExpensaUnidadFuncionalSchema
>;
