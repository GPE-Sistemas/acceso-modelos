import { z } from "zod";
import { GeoJSONPointSchema } from "../auxiliares/geojson";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { EntradaDigitalRtuSchema, PlantillaRtuSchema } from "./plantilla-rtu";

/**
 * IEstacionBombeo — un pozo (cloacal o de lagos) con 1..N bombas, telemetrizado
 * por un RTU celular (D72, acceso-doc-general doc 58 §3.3). Primera función de
 * la categoría de permiso Mantenimiento.
 *
 * Es la entidad LÓGICA: el RTU (`IDispositivo` formFactor `RTU`) se le asigna
 * por `idDispositivo` y se puede reemplazar sin perder el histórico, que cuelga
 * de la estación. La lógica de proceso (alternancia, flotantes, enclavamientos,
 * selector manual/automático) vive en el tablero, no acá.
 *
 * Cloud-only: el RTU sale por LTE directo al broker MQTT del cloud.
 */

export const ConexionEstacionBombeoSchema = z.enum(["Online", "Offline", "SinDatos"]);

export const PozoEstacionBombeoSchema = z.object({
  nombre: z.string().optional(),
  /** Pisa el `divisor` de la señal de nivel de la plantilla (decimales con que
   *  se configuró el sensor en la puesta en marcha). */
  divisorNivel: z.number().positive().optional(),
  profundidadM: z.number().positive().optional(),
  /** Sin valor no se alerta. */
  nivelAlarmaAltoM: z.number().optional(),
  nivelAlarmaBajoM: z.number().optional(),
});

export const BombaEstacionSchema = z.object({
  /** Estable: objetivo de comandos, ciclos y alertas por bomba. */
  _id: z.string().optional(),
  /** `n` de la plantilla: sus señales son `b<n>.*`. */
  numero: z.number().int().positive(),
  nombre: z.string().optional(),
  /** Esclavo Modbus del variador en el RS-485 del RTU (destino de los comandos). */
  esclavoModbus: z.number().int().min(1).max(247).optional(),
  /** Clave COMPLETA de la señal que dice si está en marcha: `b1.marcha` (V20
   *  por Modbus) o la de una DI de la plantilla. De acá salen arranques, horas
   *  de marcha y ciclos. */
  fuenteMarcha: z.string(),
  /** DI cableada a la salida "sano" del variador (abierta = falla o sin energía). */
  entradaTestigo: EntradaDigitalRtuSchema.optional(),
  /** Habilita los comandos de la plantilla para esta bomba. */
  telecontrol: z.boolean().optional(),
});

/** Valor actual de una señal en la estación. */
export const ValorEstadoBombeoSchema = z.object({
  valor: z.union([z.number(), z.boolean()]),
  /** false = el último reporte trajo el valor CACHEADO por el RTU (bit 3 = 0). */
  ok: z.boolean(),
  /** ISO. Última lectura fresca de esta señal. */
  medidoEn: z.string().optional(),
});

export const EstacionBombeoSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  nombre: z.string(),
  descripcion: z.string().optional(),
  ubicacion: GeoJSONPointSchema.optional(),
  activa: z.boolean().optional(),
  /** RTU asignado (IDispositivo formFactor `RTU`). Único entre estaciones. */
  idDispositivo: z.string().optional(),
  idPlantillaRtu: z.string(),
  /** Intervalo de reporte configurado en el RTU: el vigía y los derivados
   *  (huecos = más de 3 intervalos sin dato) dependen de él. */
  intervaloReporteSegundos: z.number().int().min(10).max(64800),
  pozo: PozoEstacionBombeoSchema.optional(),
  bombas: z.array(BombaEstacionSchema),
  // --- Calculados (los escribe la ingesta de acceso-api) ---
  /** Clave completa (`pozo.nivel_m`, `b1.marcha`) → valor actual. */
  ultimoEstado: z.record(z.string(), ValorEstadoBombeoSchema).optional(),
  timestampUltimoReporte: z.string().optional(),
  conexion: ConexionEstacionBombeoSchema.optional(),
  /** Diferencias entre lo que manda el RTU y la plantilla (cantidad de
   *  canales/valores, signo). Vacío = coincide. */
  discrepanciasPlantilla: z.array(z.string()).optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  plantilla: PlantillaRtuSchema.optional(),
  dispositivo: z.any().optional(),
});

const CalculadosEstacion = {
  ultimoEstado: true,
  timestampUltimoReporte: true,
  conexion: true,
  discrepanciasPlantilla: true,
} as const;

export const CreateEstacionBombeoSchema = EstacionBombeoSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  ...CalculadosEstacion,
  cliente: true,
  complejo: true,
  plantilla: true,
  dispositivo: true,
});

/** `idDispositivo: null` desasigna el RTU y `ubicacion: null` la borra: un campo
 *  ausente del JSON no se distingue de "no lo cambio" (acceso-datos hace
 *  `$unset` de los `null`). */
export const UpdateEstacionBombeoSchema = CreateEstacionBombeoSchema.partial().extend({
  idDispositivo: z.string().nullable().optional(),
  ubicacion: GeoJSONPointSchema.nullable().optional(),
});

export type IConexionEstacionBombeo = z.infer<typeof ConexionEstacionBombeoSchema>;
export type IPozoEstacionBombeo = z.infer<typeof PozoEstacionBombeoSchema>;
export type IBombaEstacion = z.infer<typeof BombaEstacionSchema>;
export type IValorEstadoBombeo = z.infer<typeof ValorEstadoBombeoSchema>;
export type IEstacionBombeo = z.infer<typeof EstacionBombeoSchema>;
export type ICreateEstacionBombeo = z.infer<typeof CreateEstacionBombeoSchema>;
export type IUpdateEstacionBombeo = z.infer<typeof UpdateEstacionBombeoSchema>;
