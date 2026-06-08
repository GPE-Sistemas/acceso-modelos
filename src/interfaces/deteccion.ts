import { z } from "zod";
import { AccesoSchema } from "./acceso";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { DispositivoSchema } from "./dispositivo";

/**
 * IDeteccion — señal cruda de inferencia de video de UN dispositivo en un instante
 * (módulo IA-video, M3). Varias detecciones casi-simultáneas en un mismo acceso se
 * correlacionan en un único IIngresoEgreso (def #2 del doc 01).
 *
 * Decisión A (cerrada 2026-06-08): la detección se PERSISTE con `expireAt`/TTL
 * (trazabilidad + sobrevive reinicios del edge; el TTL acota el volumen).
 *
 * Owner operacional: el edge (RPi5+Hailo) materializa y correlaciona. Sync edge↔cloud
 * Tipo A vía `fechaActualizacion` (último-write-wins), como IEventoVisita.
 *
 * Doc: acceso-ia-video/docs/decisiones/02-relevamiento-modelo-actual.md §3.2.
 */

/**
 * Qué disparó la detección. `acceso-terminal` = evento de un terminal de credencial
 * (ej. concesión/denegación del HIK) tratado como una detección más a correlacionar.
 */
export const TipoDeteccionSchema = z.enum([
  "persona",
  "vehiculo",
  "patente",
  "rostro",
  "acceso-terminal",
]);

/** Estado de la detección respecto del evento de acceso unificado. */
export const EstadoCorrelacionDeteccionSchema = z.enum([
  "Pendiente", // todavía no fusionada a un IIngresoEgreso
  "Fusionada", // ya aportó a un IIngresoEgreso (ver idIngresoEgreso)
  "Descartada", // ruido / fuera de ventana / duplicada
]);

export const DeteccionSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  /** Último-write-wins para sync edge↔cloud (Tipo A), igual que IEventoVisita. */
  fechaActualizacion: z.string().optional(),
  /** TTL — la detección expira pasado este instante (decisión A). */
  expireAt: z.string().optional(),
  // Scope tenant
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  // Origen físico
  idAcceso: z.string().optional(),
  idDispositivo: z.string().optional(),
  /** Canal del NVR/XVR que originó la detección (matchea IDispositivoAcceso.canalDispositivo). */
  canalDispositivo: z.string().optional(),
  // Datos de la detección
  fechaDeteccion: z.string().optional(),
  tipo: TipoDeteccionSchema.optional(),
  /** Score del modelo (0..1). */
  confianza: z.number().optional(),
  /** Patente leída (LPR), cuando tipo === 'patente'. */
  patente: z.string().optional(),
  /** Credencial matcheada (1:N), cuando hubo identificación de rostro. */
  idCredencialMatch: z.string().optional(),
  /** Permiso dueño de la credencial matcheada. */
  idPermisoMatch: z.string().optional(),
  /** Distancia/score del match de embedding (menor = más cercano, según métrica). */
  distanciaMatch: z.number().optional(),
  /** Crops/frame en GCS (objectNames). */
  imagenes: z.array(z.string()).optional(),
  // Correlación
  /** IIngresoEgreso al que se fusionó esta detección (ausente = todavía suelta). */
  idIngresoEgreso: z.string().optional(),
  estadoCorrelacion: EstadoCorrelacionDeteccionSchema.optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  acceso: AccesoSchema.optional(),
  dispositivo: DispositivoSchema.optional(),
});

export const CreateDeteccionSchema = DeteccionSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
  acceso: true,
  dispositivo: true,
});

export const UpdateDeteccionSchema = CreateDeteccionSchema.partial();

export type ITipoDeteccion = z.infer<typeof TipoDeteccionSchema>;
export type IEstadoCorrelacionDeteccion = z.infer<
  typeof EstadoCorrelacionDeteccionSchema
>;
export type IDeteccion = z.infer<typeof DeteccionSchema>;
export type ICreateDeteccion = z.infer<typeof CreateDeteccionSchema>;
export type IUpdateDeteccion = z.infer<typeof UpdateDeteccionSchema>;
