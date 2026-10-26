import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { ServicioMedidoSchema } from "./asignacion-dispositivo";

/**
 * IConfigServiciosComplejo — cómo se cierran y se cobran los servicios medidos
 * (agua, gas, electricidad) de un complejo (D66 Etapa 5, acceso-doc-general
 * doc 53 §4.3). Una por complejo (índice único en idComplejo, lazy create),
 * patrón `IConfigExpensaComplejo`. Cloud-only.
 *
 * - `corte`: día y hora local en que cierra el período de consumo. El cierre
 *   lo arma un job unas horas después (Borrador) y lo confirma el admin.
 * - `sinLectura`: qué hacer al confirmar un cierre con UF sin lectura.
 * - `servicios[]`: tarifa por servicio. Primera entrega: solo
 *   `PrecioUnitario` (cargo fijo + tramos versionados); el prorrateo de la
 *   factura de la distribuidora y el consumo común (medidor general) quedan
 *   para después.
 */

/** D66.11. Día del mes (1-28, todos los meses lo tienen) y hora local `HH:mm`. */
export const CorteServiciosSchema = z.object({
  dia: z.number().int().min(1).max(28),
  hora: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});
export type ICorteServicios = z.infer<typeof CorteServiciosSchema>;

/**
 * D66.10. UF sin lectura al confirmar el cierre (el medidor no reportó y nadie
 * cargó una lectura manual):
 * - `Estimar`: promedio de los últimos `periodosPromedioEstimacion` períodos,
 *   marcado en el recibo; el período siguiente ajusta solo contra la lectura real.
 * - `Bloquear`: no se puede confirmar hasta cargar la lectura manual.
 * - `Omitir`: no se cobra ese período; el siguiente cobra el acumulado.
 */
export const PoliticaSinLecturaSchema = z.enum(["Estimar", "Bloquear", "Omitir"]);
export type EPoliticaSinLectura = z.infer<typeof PoliticaSinLecturaSchema>;

export const MetodoValorizacionServicioSchema = z.enum(["PrecioUnitario"]);
export type EMetodoValorizacionServicio = z.infer<typeof MetodoValorizacionServicioSchema>;

/**
 * Tramo de consumo: precio de cada unidad hasta `hasta` (acumulado desde 0).
 * El último tramo lleva `hasta: null` (sin tope). Escalonado: el consumo que
 * cae en cada tramo se paga a su precio.
 */
export const TramoTarifaSchema = z.object({
  hasta: z.number().positive().nullable(),
  precioUnitario: z.number().nonnegative(),
});
export type ITramoTarifa = z.infer<typeof TramoTarifaSchema>;

/**
 * Tarifa vigente desde un período, mismo criterio que `mora.tasas` de
 * expensas: la de un período P es la de mayor `vigenteDesde` ≤ P. El período
 * que se compara es el del CONSUMO (`IConsumoPeriodo.periodo`), no el de la
 * liquidación que lo cobra.
 */
export const TarifaServicioSchema = z.object({
  vigenteDesde: z.string().regex(/^\d{4}-\d{2}$/),
  cargoFijo: z.number().nonnegative().optional(),
  tramos: z.array(TramoTarifaSchema).min(1),
});
export type ITarifaServicio = z.infer<typeof TarifaServicioSchema>;

export const ConfigServicioSchema = z.object({
  servicio: ServicioMedidoSchema,
  metodo: MetodoValorizacionServicioSchema,
  tarifas: z.array(TarifaServicioSchema).optional(),
  /** Períodos que promedia la estimación (`sinLectura: 'Estimar'`). Default 3. */
  periodosPromedioEstimacion: z.number().int().min(1).max(12).optional(),
  /** false = se cierra y se informa, pero no entra en la liquidación de expensas. */
  incluirEnExpensas: z.boolean(),
});
export type IConfigServicio = z.infer<typeof ConfigServicioSchema>;

export const ConfigServiciosComplejoSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  /** Sin `corte` no corre el job de cierre. */
  corte: CorteServiciosSchema.optional(),
  sinLectura: PoliticaSinLecturaSchema.optional(),
  servicios: z.array(ConfigServicioSchema).optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
});

export const CreateConfigServiciosComplejoSchema =
  ConfigServiciosComplejoSchema.omit({
    _id: true,
    fechaCreacion: true,
    fechaActualizacion: true,
    cliente: true,
    complejo: true,
  });

export const UpdateConfigServiciosComplejoSchema =
  ConfigServiciosComplejoSchema.omit({
    _id: true,
    fechaCreacion: true,
    fechaActualizacion: true,
    idCliente: true,
    idComplejo: true,
    cliente: true,
    complejo: true,
  }).partial();

export type IConfigServiciosComplejo = z.infer<typeof ConfigServiciosComplejoSchema>;
export type ICreateConfigServiciosComplejo = z.infer<
  typeof CreateConfigServiciosComplejoSchema
>;
export type IUpdateConfigServiciosComplejo = z.infer<
  typeof UpdateConfigServiciosComplejoSchema
>;
