import { z } from "zod";
import { ServicioMedidoSchema } from "./asignacion-dispositivo";

/**
 * Exportación de consumos a Excel (`POST /consumos-diarios/exportar`,
 * acción `Servicios - Exportar consumos`). La arma acceso-api con exceljs.
 *
 * El libro tiene:
 * - **Resumen**: una fila por unidad funcional con el total de cada servicio
 *   elegido (más el medidor general y la diferencia si se piden).
 * - **Una hoja por unidad funcional**: una fila por día del rango y, por cada
 *   servicio, las columnas diarias elegidas.
 * - **Lecturas** (opcional): las lecturas crudas del contador de cada medidor,
 *   una fila por lectura, con la columna Unidad para filtrar en Excel. El cloud
 *   guarda 90 días de lecturas (TTL de `IMedicionDispositivo`).
 * - **Cierres** (opcional): las filas de `IConsumoPeriodo` de los cierres que
 *   se superponen con el rango.
 *
 * Las columnas se eligen por hoja con las claves de abajo. Los catálogos
 * `COLUMNAS_EXPORTAR_*` traen el rótulo y si viene marcada por defecto, para
 * que la web arme los checkboxes sin repetir la lista.
 */

/** Columnas de la hoja Resumen (por servicio). La unidad funcional va siempre. */
export const ColumnaResumenConsumoSchema = z.enum([
  "consumo",
  "promedioDiario",
  "diasConDato",
  "diasSinCalcular",
  "diasSospechosos",
  "ultimaLectura",
  "fechaUltimaLectura",
]);

/** Columnas de la hoja de cada unidad (por servicio). La fecha va siempre. */
export const ColumnaDiariaConsumoSchema = z.enum([
  "consumo",
  "lecturaInicial",
  "lecturaFinal",
  "fechaLecturaFinal",
  "calidad",
  "lecturas",
  "diasSinDato",
  "medidor",
]);

/** Columnas de la hoja Lecturas. Unidad funcional y fecha van siempre. */
export const ColumnaLecturaConsumoSchema = z.enum([
  "servicio",
  "medidor",
  "magnitud",
  "valor",
  "unidadEquipo",
  "valorServicio",
  "calidad",
  "tipoReporte",
  "fechaRecepcion",
  "rssi",
  "snr",
]);

/** Columnas de la hoja Cierres. Unidad funcional y período van siempre. */
export const ColumnaCierreConsumoSchema = z.enum([
  "servicio",
  "desde",
  "hasta",
  "estadoCierre",
  "lecturaInicial",
  "lecturaFinal",
  "consumo",
  "origen",
  "discontinuidades",
  "consumoComun",
  "montoProrrateo",
  "montoComun",
  "facturado",
  "observacion",
]);

export interface ColumnaExportarConsumo<K extends string> {
  clave: K;
  rotulo: string;
  porDefecto: boolean;
}

export const COLUMNAS_EXPORTAR_RESUMEN: readonly ColumnaExportarConsumo<
  z.infer<typeof ColumnaResumenConsumoSchema>
>[] = [
  { clave: "consumo", rotulo: "Consumo", porDefecto: true },
  { clave: "promedioDiario", rotulo: "Promedio diario", porDefecto: true },
  { clave: "diasConDato", rotulo: "Días con dato", porDefecto: true },
  { clave: "diasSinCalcular", rotulo: "Días sin calcular", porDefecto: true },
  { clave: "diasSospechosos", rotulo: "Días sospechosos", porDefecto: false },
  { clave: "ultimaLectura", rotulo: "Última lectura", porDefecto: true },
  { clave: "fechaUltimaLectura", rotulo: "Fecha última lectura", porDefecto: false },
];

export const COLUMNAS_EXPORTAR_DIARIO: readonly ColumnaExportarConsumo<
  z.infer<typeof ColumnaDiariaConsumoSchema>
>[] = [
  { clave: "consumo", rotulo: "Consumo", porDefecto: true },
  { clave: "lecturaInicial", rotulo: "Lectura inicial", porDefecto: false },
  { clave: "lecturaFinal", rotulo: "Lectura final", porDefecto: true },
  { clave: "fechaLecturaFinal", rotulo: "Hora lectura final", porDefecto: false },
  { clave: "calidad", rotulo: "Calidad", porDefecto: true },
  { clave: "lecturas", rotulo: "Lecturas del día", porDefecto: false },
  { clave: "diasSinDato", rotulo: "Días sin dato absorbidos", porDefecto: false },
  { clave: "medidor", rotulo: "Medidor", porDefecto: false },
];

export const COLUMNAS_EXPORTAR_LECTURAS: readonly ColumnaExportarConsumo<
  z.infer<typeof ColumnaLecturaConsumoSchema>
>[] = [
  { clave: "servicio", rotulo: "Servicio", porDefecto: true },
  { clave: "medidor", rotulo: "Medidor", porDefecto: true },
  { clave: "magnitud", rotulo: "Magnitud", porDefecto: false },
  { clave: "valor", rotulo: "Valor del equipo", porDefecto: false },
  { clave: "unidadEquipo", rotulo: "Unidad del equipo", porDefecto: false },
  { clave: "valorServicio", rotulo: "Lectura del dial", porDefecto: true },
  { clave: "calidad", rotulo: "Calidad", porDefecto: true },
  { clave: "tipoReporte", rotulo: "Tipo de reporte", porDefecto: false },
  { clave: "fechaRecepcion", rotulo: "Recibida", porDefecto: false },
  { clave: "rssi", rotulo: "RSSI", porDefecto: false },
  { clave: "snr", rotulo: "SNR", porDefecto: false },
];

export const COLUMNAS_EXPORTAR_CIERRES: readonly ColumnaExportarConsumo<
  z.infer<typeof ColumnaCierreConsumoSchema>
>[] = [
  { clave: "servicio", rotulo: "Servicio", porDefecto: true },
  { clave: "desde", rotulo: "Desde", porDefecto: false },
  { clave: "hasta", rotulo: "Hasta", porDefecto: false },
  { clave: "estadoCierre", rotulo: "Estado del cierre", porDefecto: true },
  { clave: "lecturaInicial", rotulo: "Lectura inicial", porDefecto: true },
  { clave: "lecturaFinal", rotulo: "Lectura final", porDefecto: true },
  { clave: "consumo", rotulo: "Consumo", porDefecto: true },
  { clave: "origen", rotulo: "Origen", porDefecto: true },
  { clave: "discontinuidades", rotulo: "Discontinuidades", porDefecto: false },
  { clave: "consumoComun", rotulo: "Consumo común", porDefecto: false },
  { clave: "montoProrrateo", rotulo: "Monto prorrateo", porDefecto: false },
  { clave: "montoComun", rotulo: "Monto común", porDefecto: false },
  { clave: "facturado", rotulo: "Facturado", porDefecto: true },
  { clave: "observacion", rotulo: "Observación", porDefecto: false },
];

/** Tope del rango: el mismo del resumen. */
export const MAX_DIAS_EXPORTAR_CONSUMOS = 366;
/** Tope de filas de la hoja Lecturas: arriba de esto se pide acotar. */
export const MAX_FILAS_LECTURAS_EXPORTAR = 300_000;

const DiaSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const ExportarConsumosSchema = z.object({
  /** Obligatorio salvo nivel Complejo (se toma del permiso). */
  idComplejo: z.string().optional(),
  servicios: z.array(ServicioMedidoSchema).min(1),
  /** Días del complejo, inclusive. */
  desde: DiaSchema,
  hasta: DiaSchema,
  /** Filtro por unidades. Ausente o vacío = todas las que tienen medidor en el rango. */
  idsUnidadesFuncionales: z.array(z.string()).optional(),
  /** Filtro por grupo de unidades (se cruza con `idsUnidadesFuncionales` si vienen los dos). */
  idGrupoUnidadFuncional: z.string().optional(),
  /** Solo unidades con algún día no `Completo` (sin calcular o sospechoso). */
  soloConAvisos: z.boolean().optional(),
  /** Medidor general del complejo: fila en el Resumen + hoja propia. Default true. */
  incluirGeneral: z.boolean().optional(),
  /** Una hoja por unidad. Default true; false = solo Resumen (+ anexos). */
  hojaPorUnidad: z.boolean().optional(),
  columnas: z.object({
    resumen: z.array(ColumnaResumenConsumoSchema).min(1),
    diario: z.array(ColumnaDiariaConsumoSchema).min(1),
    /** Ausente = sin hoja Lecturas. Pide además `Hardware - Ver mediciones de dispositivo`. */
    lecturas: z.array(ColumnaLecturaConsumoSchema).optional(),
    /** Ausente = sin hoja Cierres. */
    cierres: z.array(ColumnaCierreConsumoSchema).optional(),
  }),
});

export type IColumnaResumenConsumo = z.infer<typeof ColumnaResumenConsumoSchema>;
export type IColumnaDiariaConsumo = z.infer<typeof ColumnaDiariaConsumoSchema>;
export type IColumnaLecturaConsumo = z.infer<typeof ColumnaLecturaConsumoSchema>;
export type IColumnaCierreConsumo = z.infer<typeof ColumnaCierreConsumoSchema>;
export type IExportarConsumos = z.infer<typeof ExportarConsumosSchema>;
