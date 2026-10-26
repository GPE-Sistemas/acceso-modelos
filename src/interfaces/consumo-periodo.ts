import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { ServicioMedidoSchema } from "./asignacion-dispositivo";

/**
 * Cierre del período de consumo de un complejo (D66 Etapa 5, doc 53 §4.3).
 *
 * Dos entidades cloud-only:
 * - `ICierreConsumo`: cabecera por (complejo, período). La crea un job de
 *   acceso-api unas horas después del corte (`IConfigServiciosComplejo.corte`)
 *   en `Borrador`; el admin completa las lecturas que faltan y la confirma
 *   (`Servicios - Cerrar período de consumos`). Solo lo `Confirmado` se factura.
 * - `IConsumoPeriodo`: una fila por asignación de medidor de UF × período (si
 *   hubo reemplazo en el período, dos filas y el recibo las suma). **Es la foto
 *   que se factura**: no se recalcula desde las mediciones, que tienen TTL de 90
 *   días en cloud.
 *
 * Desfase entre consumo y expensa: la liquidación de un mes toma TODO consumo
 * de un cierre confirmado y no facturado todavía (patrón `turno.facturado`). Si
 * el complejo cobra con dos meses de atraso, o confirma dos períodos juntos,
 * los dos entran en la misma expensa.
 */

export const EstadoCierreConsumoSchema = z.enum(["Borrador", "Confirmado"]);
export type EEstadoCierreConsumo = z.infer<typeof EstadoCierreConsumoSchema>;

export const CierreConsumoSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  /** "YYYY-MM" del corte que CIERRA el período. Único por complejo. */
  periodo: z.string().regex(/^\d{4}-\d{2}$/),
  /** Instante del corte anterior (ISO). */
  desde: z.string(),
  /** Instante del corte (ISO). */
  hasta: z.string(),
  estado: EstadoCierreConsumoSchema,
  fechaConfirmacion: z.string().optional(),
  idPermisoConfirmacion: z.string().optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
});

export const CreateCierreConsumoSchema = CierreConsumoSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  cliente: true,
  complejo: true,
});
export const UpdateCierreConsumoSchema = CreateCierreConsumoSchema.partial();

export type ICierreConsumo = z.infer<typeof CierreConsumoSchema>;
export type ICreateCierreConsumo = z.infer<typeof CreateCierreConsumoSchema>;
export type IUpdateCierreConsumo = z.infer<typeof UpdateCierreConsumoSchema>;

/**
 * De dónde sale el consumo de la fila:
 * - `Automatico`: lecturas del medidor alrededor de los cortes.
 * - `Manual`: lectura final cargada a mano (con foto) por el admin.
 * - `Estimado`: promedio de períodos anteriores (`sinLectura: 'Estimar'`). El
 *   siguiente período arranca de la lectura estimada, así que la lectura real
 *   ajusta sola la diferencia.
 * - `Omitido`: sin lectura y `sinLectura: 'Omitir'` — no se cobra; el período
 *   siguiente arranca de la misma lectura inicial y cobra el acumulado.
 * - `SinLectura`: todavía sin lectura (solo en un cierre `Borrador`).
 */
export const OrigenConsumoPeriodoSchema = z.enum([
  "Automatico",
  "Manual",
  "Estimado",
  "Omitido",
  "SinLectura",
]);
export type EOrigenConsumoPeriodo = z.infer<typeof OrigenConsumoPeriodoSchema>;

export const ConsumoPeriodoSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  idCierre: z.string(),
  /** Denormalizado del cierre. */
  periodo: z.string().regex(/^\d{4}-\d{2}$/),
  idUnidadFuncional: z.string(),
  idAsignacion: z.string(),
  idDispositivo: z.string(),
  servicio: ServicioMedidoSchema,
  /** `m3` / `kWh`. */
  unidad: z.string().optional(),
  /** Lectura del dial al inicio (cierre anterior, o la inicial de la asignación). */
  lecturaInicial: z.number().nullable(),
  fechaLecturaInicial: z.string().optional(),
  /** Lectura del dial al corte (o estimada / manual). null = sin lectura. */
  lecturaFinal: z.number().nullable(),
  fechaLecturaFinal: z.string().optional(),
  /** lecturaFinal − lecturaInicial. null = no se cobra (sin lectura / omitido). */
  consumo: z.number().nullable(),
  origen: OrigenConsumoPeriodoSchema,
  /** Lectura manual: objectName GCS del bucket privado (foto del dial). */
  foto: z.string().optional(),
  observacion: z.string().optional(),
  /** Días del período con discontinuidad del contador (reset, reemplazo): revisar antes de confirmar. */
  discontinuidades: z.number().int().nonnegative().optional(),
  /** Anti doble cobro (patrón `turno.facturado`). Lo setea acceso-api al liquidar. */
  facturado: z.boolean().optional(),
  idExpensaUF: z.string().optional(),
  // Populate
  unidadFuncional: z.any().optional(),
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
});

export const CreateConsumoPeriodoSchema = ConsumoPeriodoSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  unidadFuncional: true,
  cliente: true,
  complejo: true,
});
export const UpdateConsumoPeriodoSchema = CreateConsumoPeriodoSchema.partial();

export type IConsumoPeriodo = z.infer<typeof ConsumoPeriodoSchema>;
export type ICreateConsumoPeriodo = z.infer<typeof CreateConsumoPeriodoSchema>;
export type IUpdateConsumoPeriodo = z.infer<typeof UpdateConsumoPeriodoSchema>;

/** Body de `PUT /consumos-periodo/:id/lectura-manual` (cierre en Borrador). */
export const LecturaManualConsumoSchema = z.object({
  lecturaFinal: z.number().nonnegative(),
  fechaLecturaFinal: z.string().optional(),
  /** objectName GCS ya subido (foto del dial). */
  foto: z.string().optional(),
  observacion: z.string().optional(),
});
export type ILecturaManualConsumo = z.infer<typeof LecturaManualConsumoSchema>;

/**
 * Detalle del consumo en el ítem de la expensa (`tipo: 'Consumo de servicio'`).
 * Snapshot: el recibo se lee sin ir a buscar el `IConsumoPeriodo`.
 */
export const DetalleConsumoItemExpensaSchema = z.object({
  servicio: ServicioMedidoSchema,
  periodo: z.string(),
  unidad: z.string().optional(),
  lecturaInicial: z.number().nullable(),
  lecturaFinal: z.number().nullable(),
  consumo: z.number(),
  origen: OrigenConsumoPeriodoSchema,
  cargoFijo: z.number().optional(),
});
export type IDetalleConsumoItemExpensa = z.infer<typeof DetalleConsumoItemExpensaSchema>;
