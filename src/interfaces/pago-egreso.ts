import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { MedioPagoSchema } from "./pago";
import { ProveedorSchema } from "./proveedor";

/**
 * Registro de un pago a proveedor — la **salida** de dinero de un `IGasto`.
 * Espejo de `IPago` (cobros, entrada) pero del otro lado del flujo: sin
 * `idUnidadFuncional`, con `idGasto`/`idProveedor`. Sin pasarela — solo registro.
 *
 * Soporta pagos parciales (varios pagos por gasto). Al registrar o eliminar,
 * acceso-api recalcula `montoPagado`/`estadoPago`/`totalAdeudado` del `IGasto`
 * referenciado (espejo de `recomputarEstadoPago` de expensas). Cloud-only.
 *
 * Separado del `IPago` genérico a propósito: mezclar entradas y salidas en una
 * sola colección complicaría el scope (gasto no tiene UF) y el balance.
 */

export const PagoEgresoSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  /** Gasto que se está pagando. */
  idGasto: z.string().optional(),
  /** Proveedor del gasto (denormalizado para cuenta corriente). */
  idProveedor: z.string().optional(),
  /** Período "YYYY-MM" al que aplica el pago (denormalizado). */
  periodo: z.string().optional(),
  monto: z.number().positive().optional(),
  /** Fecha del pago (ISO 8601). */
  fecha: z.string().optional(),
  medio: MedioPagoSchema.optional(),
  /** Nro. de comprobante / transferencia / cheque. */
  referencia: z.string().optional(),
  observaciones: z.string().optional(),
  /** Permiso que registró el pago (auditoría) — lo inyecta acceso-api. */
  idPermisoRegistro: z.string().optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  proveedor: ProveedorSchema.optional(),
  /** `z.any()` para evitar inflar la inferencia (IGasto ya popula proveedor). */
  gasto: z.any().optional(),
});

export const CreatePagoEgresoSchema = PagoEgresoSchema.omit({
  _id: true,
  fechaCreacion: true,
  idPermisoRegistro: true,
  cliente: true,
  complejo: true,
  proveedor: true,
  gasto: true,
});

export const UpdatePagoEgresoSchema = CreatePagoEgresoSchema.partial();

export type IPagoEgreso = z.infer<typeof PagoEgresoSchema>;
export type ICreatePagoEgreso = z.infer<typeof CreatePagoEgresoSchema>;
export type IUpdatePagoEgreso = z.infer<typeof UpdatePagoEgresoSchema>;
