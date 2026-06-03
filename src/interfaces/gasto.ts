import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { ProveedorSchema } from "./proveedor";
import { TipoGastoSchema } from "./config-egreso";
import { EstadoPagoExpensaSchema } from "./expensa-unidad-funcional";

/**
 * Gasto / egreso de un complejo (módulo Egresos). Contraparte de los ingresos
 * (expensas/multas/turnos). Nivel complejo — **sin `idUnidadFuncional`**. El
 * proveedor es **opcional** (puede haber gastos sin proveedor: compra puntual,
 * movimiento interno).
 *
 * Estado de pago (`Pendiente|Parcial|Pagada`) + `montoPagado`/`totalAdeudado`
 * los mantiene acceso-api al registrar/eliminar `IPagoEgreso`. El balance del
 * período cruza estos gastos (devengado) y sus pagos (caja) contra los ingresos.
 *
 * Snapshots inmutables (`proveedorSnapshot`, `categoriaSnapshot`) para que el
 * historial sobreviva a edits/baja del catálogo. Cloud-only, sin caché Redis.
 */

// ─── Snapshots inmutables ─────────────────────────────────────────────────────

export const ProveedorSnapshotSchema = z.object({
  razonSocial: z.string().optional(),
  cuit: z.string().optional(),
});
export type IProveedorSnapshot = z.infer<typeof ProveedorSnapshotSchema>;

export const CategoriaGastoSnapshotSchema = z.object({
  nombre: z.string().optional(),
  tipo: TipoGastoSchema.optional(),
});
export type ICategoriaGastoSnapshot = z.infer<
  typeof CategoriaGastoSnapshotSchema
>;

// ─── Gasto ────────────────────────────────────────────────────────────────────

export const GastoSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  /** Proveedor opcional. */
  idProveedor: z.string().optional(),
  proveedorSnapshot: ProveedorSnapshotSchema.optional(),
  /** Categoría/rubro: `_id` de un `ICategoriaGasto` en `IConfigEgresoComplejo`. */
  idCategoria: z.string().optional(),
  categoriaSnapshot: CategoriaGastoSnapshotSchema.optional(),
  tipoGasto: TipoGastoSchema.optional(),
  /** Período de imputación "YYYY-MM" — corte del balance. */
  periodo: z.string().optional(),
  descripcion: z.string().optional(),
  detalles: z.string().optional(),
  monto: z.number().positive().optional(),
  fechaGasto: z.string().optional(),
  fechaVencimiento: z.string().optional(),
  // Estado de pago — mantenidos por acceso-api.
  estadoPago: EstadoPagoExpensaSchema.optional(),
  montoPagado: z.number().nonnegative().optional(),
  /** monto - montoPagado. */
  totalAdeudado: z.number().optional(),
  /** Comprobantes (facturas/recibos): objectNames GCS, `<app-image-uploader multiple>`. */
  comprobantes: z.array(z.string()).optional(),
  /** Correlativo opcional por complejo (orden de pago / comprobante interno). */
  numero: z.string().optional(),
  /** Permiso que cargó el gasto (auditoría) — lo inyecta acceso-api. */
  idPermisoCreador: z.string().optional(),
  /** Reservado — id de la plantilla de gasto recurrente que lo originó (extensión). */
  recurrenteOrigen: z.string().optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  proveedor: ProveedorSchema.optional(),
});

export const CreateGastoSchema = GastoSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  proveedorSnapshot: true,
  categoriaSnapshot: true,
  estadoPago: true,
  montoPagado: true,
  totalAdeudado: true,
  numero: true,
  idPermisoCreador: true,
  cliente: true,
  complejo: true,
  proveedor: true,
});

export const UpdateGastoSchema = CreateGastoSchema.partial();

export type IGasto = z.infer<typeof GastoSchema>;
export type ICreateGasto = z.infer<typeof CreateGastoSchema>;
export type IUpdateGasto = z.infer<typeof UpdateGastoSchema>;
