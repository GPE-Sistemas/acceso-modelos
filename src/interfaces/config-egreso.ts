import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";

/**
 * Configuración de egresos de un complejo (módulo Egresos). Una por complejo
 * (índice único en idComplejo, lazy create con defaults). Define las categorías
 * / rubros de gasto configurables y su presupuesto por período.
 *
 * Patrón análogo a `IConfigExpensaComplejo` (config singleton por complejo,
 * endpoints `GET/PUT /config-egreso/by-complejo/:idComplejo`). Cloud-only.
 */

// ─── Tipo de gasto ────────────────────────────────────────────────────────────

export const TipoGastoSchema = z.enum([
  /** Entra en el presupuesto ordinario del período. */
  "Ordinario",
  /** Adicional al presupuesto (obras nuevas, reparaciones grandes). */
  "Extraordinario",
]);
export type ETipoGasto = z.infer<typeof TipoGastoSchema>;

// ─── Categoría / rubro de gasto (subdoc embedded) ─────────────────────────────

export const CategoriaGastoSchema = z.object({
  /** id estable del subdoc — referenciado por `IGasto.idCategoria` y `IProveedor.idCategoria`. */
  _id: z.string().optional(),
  nombre: z.string(),
  tipo: TipoGastoSchema,
  /** Monto presupuestado para el período — base de presupuesto vs real en el balance. */
  montoPresupuestado: z.number().nonnegative().optional(),
  habilitado: z.boolean().optional(),
});
export type ICategoriaGasto = z.infer<typeof CategoriaGastoSchema>;

// ─── Fondo de reserva (extensión futura) ──────────────────────────────────────

export const FondoReservaConfigSchema = z.object({
  habilitado: z.boolean(),
  /** Monto objetivo del fondo. */
  objetivo: z.number().nonnegative().optional(),
});
export type IFondoReservaConfig = z.infer<typeof FondoReservaConfigSchema>;

// ─── Configuración de egresos del complejo ────────────────────────────────────

export const ConfigEgresoComplejoSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  categorias: z.array(CategoriaGastoSchema).optional(),
  /** Reservado — partida separada de fondo de reserva (extensión). */
  fondoReserva: FondoReservaConfigSchema.optional(),
  habilitado: z.boolean().optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
});

export const CreateConfigEgresoComplejoSchema = ConfigEgresoComplejoSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  cliente: true,
  complejo: true,
});

export const UpdateConfigEgresoComplejoSchema = ConfigEgresoComplejoSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  idCliente: true,
  idComplejo: true,
  cliente: true,
  complejo: true,
}).partial();

export type IConfigEgresoComplejo = z.infer<typeof ConfigEgresoComplejoSchema>;
export type ICreateConfigEgresoComplejo = z.infer<
  typeof CreateConfigEgresoComplejoSchema
>;
export type IUpdateConfigEgresoComplejo = z.infer<
  typeof UpdateConfigEgresoComplejoSchema
>;
