import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";

/**
 * Configuración de cálculo de expensas de un complejo. Una por complejo
 * (índice único en idComplejo, lazy create con defaults). Define los
 * conceptos/rubros a liquidar y la política de interés por mora.
 *
 * Patrón análogo a `IConfigBotonesTicketComplejo` (config singleton por complejo,
 * endpoints `GET/PUT /config-expensa/by-complejo/:idComplejo`).
 */

// ─── Métodos de cálculo por concepto ─────────────────────────────────────────

export const MetodoConceptoExpensaSchema = z.enum([
  /** Mismo monto fijo para todas las UF facturables. Usa `monto`. */
  "Fijo igual",
  /** Monto base × coeficiente de copropiedad de la UF. Usa `monto` como base. */
  "Fijo por coeficiente",
  /** Reparte un total entre las UF según su coeficiente. Usa `monto` como total a repartir. */
  "Prorrateo por coeficiente",
  /** Reparte un total entre las UF según su superficie (m²). Usa `monto` como total a repartir. */
  "Prorrateo por superficie",
  /** Parte fija (`monto`) + parte variable (`montoPorSuperficie` × m² de la UF). */
  "Fijo + variable por superficie",
]);
export type EMetodoConceptoExpensa = z.infer<typeof MetodoConceptoExpensaSchema>;

// ─── Concepto / rubro (subdoc embedded) ──────────────────────────────────────

export const ConceptoExpensaSchema = z.object({
  /** id estable del subdoc — referenciado por `IItemExpensa.idConcepto`. */
  _id: z.string().optional(),
  nombre: z.string(),
  metodo: MetodoConceptoExpensaSchema,
  /**
   * Monto base. Interpretación según `metodo`:
   * - Fijo igual / Fijo por coeficiente / Fijo + variable por superficie → parte fija.
   * - Prorrateo por coeficiente / Prorrateo por superficie → total a repartir.
   */
  monto: z.number().nonnegative(),
  /** Solo para 'Fijo + variable por superficie': monto por m². */
  montoPorSuperficie: z.number().nonnegative().optional(),
  habilitado: z.boolean().optional(),
});
export type IConceptoExpensa = z.infer<typeof ConceptoExpensaSchema>;

// ─── Interés por mora ─────────────────────────────────────────────────────────

export const TipoInteresMoraSchema = z.enum(["Simple", "Compuesto"]);
export type ETipoInteresMora = z.infer<typeof TipoInteresMoraSchema>;

export const BaseInteresMoraSchema = z.enum(["Saldo impago", "Total período"]);
export type EBaseInteresMora = z.infer<typeof BaseInteresMoraSchema>;

/**
 * Tasa de interés vigente desde un período. La tasa se versiona por período:
 * la deuda acumula interés mes a mes aplicando, en cada mes transcurrido, la
 * `tasaMensual` vigente de ese mes. La vigente para un período P se resuelve
 * tomando la entrada con mayor `vigenteDesde` ≤ P.
 */
export const TasaMoraSchema = z.object({
  /** Período desde el que rige, formato "YYYY-MM". */
  vigenteDesde: z.string(),
  /** Tasa mensual (fracción o porcentaje, según convención del complejo). */
  tasaMensual: z.number().nonnegative(),
});
export type ITasaMora = z.infer<typeof TasaMoraSchema>;

export const MoraConfigSchema = z.object({
  habilitada: z.boolean(),
  /** Días de gracia antes de empezar a computar mora. */
  diasGracia: z.number().int().nonnegative().optional(),
  base: BaseInteresMoraSchema.optional(),
  /** Default 'Simple' en acceso-api si ausente. */
  tipoInteres: TipoInteresMoraSchema.optional(),
  /** Historial de tasas versionadas por período. */
  tasas: z.array(TasaMoraSchema).optional(),
});
export type IMoraConfig = z.infer<typeof MoraConfigSchema>;

// ─── Configuración de expensas del complejo ──────────────────────────────────

export const ConfigExpensaComplejoSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  conceptos: z.array(ConceptoExpensaSchema).optional(),
  mora: MoraConfigSchema.optional(),
  habilitado: z.boolean().optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
});

export const CreateConfigExpensaComplejoSchema =
  ConfigExpensaComplejoSchema.omit({
    _id: true,
    fechaCreacion: true,
    fechaActualizacion: true,
    cliente: true,
    complejo: true,
  });

export const UpdateConfigExpensaComplejoSchema =
  ConfigExpensaComplejoSchema.omit({
    _id: true,
    fechaCreacion: true,
    fechaActualizacion: true,
    idCliente: true,
    idComplejo: true,
    cliente: true,
    complejo: true,
  }).partial();

export type IConfigExpensaComplejo = z.infer<typeof ConfigExpensaComplejoSchema>;
export type ICreateConfigExpensaComplejo = z.infer<
  typeof CreateConfigExpensaComplejoSchema
>;
export type IUpdateConfigExpensaComplejo = z.infer<
  typeof UpdateConfigExpensaComplejoSchema
>;
