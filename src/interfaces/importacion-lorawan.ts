import { z } from "zod";
import { ServicioMedidoSchema } from "./asignacion-dispositivo";

/**
 * Importación masiva de equipos LoRaWAN (D66 Etapa 2.3, doc 53 §4.4). Es el
 * camino NORMAL de alta del EUW300: la AppKey viene de la planilla del
 * proveedor. La web parsea el CSV y manda las filas; acceso-api valida todas,
 * crea el equipo y, si la fila trae unidad, la asignación con su lectura
 * inicial. Con `simular` solo valida (vista previa).
 *
 * Columnas del CSV: devEUI, appKey, joinEUI, lote, nombre, etiqueta, uf,
 * lecturaInicial, odometroInicial, factor.
 */
export const FilaImportacionLorawanSchema = z.object({
  devEUI: z.string(),
  appKey: z.string().optional(),
  joinEUI: z.string().optional(),
  lote: z.string().optional(),
  nombre: z.string().optional(),
  etiqueta: z.string().optional(),
  /** Número o nombre de la UF donde se instala (vacío = solo alta del equipo). */
  uf: z.string().optional(),
  lecturaInicial: z.number().optional(),
  odometroInicial: z.number().optional(),
  factor: z.number().positive().optional(),
});

export const ImportarEquiposLorawanSchema = z.object({
  idComplejo: z.string().optional(),
  idPerfilDecodificacion: z.string(),
  formFactor: z.enum(["Medidor", "Sensor", "Tracker"]).optional(),
  marca: z.string().optional(),
  modelo: z.string().optional(),
  /** Servicio de las asignaciones (las filas con `uf`). */
  servicio: ServicioMedidoSchema.optional(),
  simular: z.boolean().optional(),
  filas: z.array(FilaImportacionLorawanSchema).min(1).max(2000),
});

export const ResultadoFilaImportacionLorawanSchema = z.object({
  fila: z.number().int(),
  devEUI: z.string(),
  ok: z.boolean(),
  error: z.string().optional(),
  idDispositivo: z.string().optional(),
  idAsignacion: z.string().optional(),
});

export const ResultadoImportacionLorawanSchema = z.object({
  simulado: z.boolean(),
  creados: z.number().int(),
  conError: z.number().int(),
  filas: z.array(ResultadoFilaImportacionLorawanSchema),
});

export type IFilaImportacionLorawan = z.infer<typeof FilaImportacionLorawanSchema>;
export type IImportarEquiposLorawan = z.infer<typeof ImportarEquiposLorawanSchema>;
export type IResultadoFilaImportacionLorawan = z.infer<typeof ResultadoFilaImportacionLorawanSchema>;
export type IResultadoImportacionLorawan = z.infer<typeof ResultadoImportacionLorawanSchema>;
