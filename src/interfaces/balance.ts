import { z } from "zod";

/**
 * Balance de un período: el cruce entre ingresos y egresos del complejo.
 * Schema de **salida** (read-only) — lo arma acceso-api agregando read-time, sin
 * entidad persistida, reusando el período `"YYYY-MM"` de expensas/gastos.
 *
 * Expone las dos bases lado a lado:
 * - **Caja**: movimiento real de dinero (`IPago` cobrados vs `IPagoEgreso` pagados).
 * - **Devengado**: imputado al período (liquidado vs gastos), independiente del cobro/pago.
 * - **Presupuesto vs real**: presupuestado por categoría (`IConfigEgresoComplejo`) vs egresos imputados.
 *
 * Cloud-only — feature admin del complejo.
 */

/** Renglón de desglose por categoría de egreso o por tipo/concepto de ingreso. */
export const DesgloseBalanceItemSchema = z.object({
  /** id estable (categoría) o clave del agrupamiento. */
  clave: z.string().optional(),
  nombre: z.string(),
  monto: z.number(),
  /** Solo egresos: monto presupuestado de la categoría para el período. */
  presupuestado: z.number().optional(),
});
export type IDesgloseBalanceItem = z.infer<typeof DesgloseBalanceItemSchema>;

export const BalanceCajaSchema = z.object({
  /** Σ `IPago.monto` del período (cobros reales). */
  ingresosCobrados: z.number(),
  /** Σ `IPagoEgreso.monto` del período (pagos reales). */
  egresosPagados: z.number(),
  /** ingresosCobrados - egresosPagados. */
  saldo: z.number(),
});

export const BalanceDevengadoSchema = z.object({
  /** Σ `ILiquidacionExpensa.totalLiquidado` del período. */
  ingresosLiquidados: z.number(),
  /** Σ `IGasto.monto` imputados al período. */
  egresosImputados: z.number(),
  /** ingresosLiquidados - egresosImputados. */
  saldo: z.number(),
});

export const BalancePresupuestoSchema = z.object({
  /** Σ `montoPresupuestado` de las categorías habilitadas. */
  presupuestado: z.number(),
  /** Egresos imputados al período (= devengado.egresosImputados). */
  real: z.number(),
  /** real - presupuestado. */
  desvio: z.number(),
});

export const BalancePeriodoSchema = z.object({
  idComplejo: z.string(),
  /** Período "YYYY-MM". */
  periodo: z.string(),
  /** ISO timestamp del cálculo. */
  generadoEn: z.string(),
  caja: BalanceCajaSchema,
  devengado: BalanceDevengadoSchema,
  presupuesto: BalancePresupuestoSchema,
  desgloseEgresosPorCategoria: z.array(DesgloseBalanceItemSchema),
  desgloseIngresosPorTipo: z.array(DesgloseBalanceItemSchema),
});

export type IBalanceCaja = z.infer<typeof BalanceCajaSchema>;
export type IBalanceDevengado = z.infer<typeof BalanceDevengadoSchema>;
export type IBalancePresupuesto = z.infer<typeof BalancePresupuestoSchema>;
export type IBalancePeriodo = z.infer<typeof BalancePeriodoSchema>;
