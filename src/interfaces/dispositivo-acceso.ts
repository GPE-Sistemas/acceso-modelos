import { z } from "zod";
import { AccesoSchema } from "./acceso";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { DispositivoSchema } from "./dispositivo";
import { VerifyModeSchema } from "./credencial";

export const ComportamientoCredencialValidaSchema = z.enum([
  "Apertura Automática",
  "Aprobación Manual",
]);
export const ComportamientoCredencialInvalidaSchema = z.enum([
  "Ignorar",
  "Crear Ingreso",
]);

/**
 * Rol del dispositivo en el evento de acceso unificado (M4, def #2 del doc 01).
 * Varios devices de un acceso aportan a un único IIngresoEgreso: el HIK/cámara
 * principal lo `Genera`, un lector de patente lo `Enriquece`, otros solo `Registran`.
 */
export const RolEnEventoSchema = z.enum([
  "Genera evento",
  "Enriquece evento",
  "Solo registra",
]);

/**
 * Comportamiento ante una detección de video (M4). Análogo a
 * `ComportamientoCredencialValida` pero para detecciones. `Aprobado Automático`
 * solo es válido si la capacidad efectiva del canal IDENTIFICA
 * (capacidades.video.identificacionFacial/identificacionPatente, device o edge)
 * — gate decisión E, validado cloud-side en acceso-api.
 */
export const ComportamientoDeteccionSchema = z.enum([
  "Aprobado Automático",
  "Pendiente Guardia",
  "Ignorar",
]);

/** Modo de disparo de la inferencia/acción del device en el acceso (M4, def #4). */
export const ModoDisparoSchema = z.enum(["Continuo", "PorEvento"]);

/** Condición sobre el evento del device origen que dispara a este device. */
export const CondicionDisparoSchema = z.enum(["Éxito", "Fallo", "Cualquiera"]);

/**
 * Cadena de detección (M4, def #4): este dispositivo-acceso actúa en consecuencia
 * de otro. Ej.: una cámara IA cuya inferencia arranca cuando el HIK del mismo acceso
 * concede (`Éxito`) o deniega (`Fallo`). `Continuo` = infiere siempre, sin trigger.
 */
export const DisparoDeteccionSchema = z.object({
  modo: ModoDisparoSchema,
  /** DispositivoAcceso origen del trigger (cuando modo === 'PorEvento'). */
  idDispositivoAccesoOrigen: z.string().optional(),
  condicion: CondicionDisparoSchema.optional(),
});

/**
 * Tipos de detección que CORREN por canal (D49, Capa 2). Subconjunto de la
 * capacidad efectiva del canal. La identificación (1:N) NO es un tipo — es un
 * flag aparte (`identificacion`) porque implica capacidad + enrolamiento.
 * Distinto del `TipoDeteccionSchema` de `deteccion.ts` (incluye `acceso-terminal`,
 * que es la señal cruda de un terminal de credencial, no inferencia de video).
 */
export const TipoDeteccionVideoSchema = z.enum([
  "persona",
  "vehiculo",
  "patente",
  "rostro",
]);

/** Punto en coordenadas RELATIVAS al frame (0..1), agnóstico de resolución. */
export const PuntoFrameSchema = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
});

/**
 * Región de interés dentro del frame de video (D49, Capa 2). Polígono en coords
 * relativas 0..1. NO confundir con `IZona` geográfica (Capa 3, GeoJSON lat/lng):
 * esto acota DÓNDE MIRA el detector dentro del frame. Mapea a Frigate
 * `cameras.<cam>.zones` (regiones) y `motion.mask` / `objects.filters[].mask`
 * (máscaras).
 */
export const RegionFrameSchema = z.object({
  nombre: z.string().optional(),
  puntos: z.array(PuntoFrameSchema).min(3),
});

/** Stream sobre el que corre la detección de este canal (D49, Capa 2). */
export const StreamDetectSchema = z.enum(["Main", "Sub"]);

/**
 * Configuración de detección por canal (D49, Capa 2). Alimenta la generación del
 * config de Frigate por cámara (cierra la "Fase A→B" de `config_gen.go`).
 * - `tipos` ⊆ capacidad efectiva del canal (resolver Capa 1) — validación dura
 *   cloud-side en acceso-api + grisado en la UI (regla custom, no exportable a
 *   JSON Schema).
 * - ANPR = incluir `'patente'` en `tipos`. Persona-sin-ANPR = `tipos:['persona']`.
 * - `identificacion` solo válido si la capacidad efectiva lo soporta + hay
 *   enrolamiento (gate decisión E, cloud-side).
 */
export const ConfigDeteccionCanalSchema = z.object({
  habilitada: z.boolean().optional(),
  tipos: z.array(TipoDeteccionVideoSchema).optional(),
  identificacion: z.boolean().optional(),
  umbralConfianza: z.number().min(0).max(1).optional(),
  fps: z.number().positive().optional(),
  // Área mínima del objeto como fracción del frame (relativa, agnóstica de res).
  areaMinima: z.number().min(0).max(1).optional(),
  // Polígono(s) donde SÍ se detecta; vacío/ausente = todo el frame.
  regionesDeteccion: z.array(RegionFrameSchema).optional(),
  // Polígono(s) a ignorar (calle, vegetación, cartel parpadeante).
  mascarasMovimiento: z.array(RegionFrameSchema).optional(),
  // Default Main: el sub CIF no alcanza para ANPR ni calle/noche. Subsume el
  // item main/sub de PENDIENTES (hoy el edge fuerza Main, PR acceso-edge #151).
  streamDetect: StreamDetectSchema.optional(),
});

export const DispositivoAccesoSchema = z.object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    idCliente: z.string().optional(),
    idComplejo: z.string().optional(),
    idDispositivo: z.string().optional(),
    idAcceso: z.string().optional(),
    /** Cuando un dispositivo está en mas de un acceso representa cómo el reporte del dispositivo representa este acceso. */
    canalDispositivo: z.string().optional(),
    comportamientoCredencialValida:
      ComportamientoCredencialValidaSchema.optional(),
    comportamientoCredencialInvalida:
      ComportamientoCredencialInvalidaSchema.optional(),
    /** Indica si el dispositivo puede recibir un comando para abrir el acceso */
    aperturaConComando: z.boolean().optional(),
    /** Modo de verificación configurado para este terminal en este acceso (qué
     *  factores exige: tarjeta, huella, PIN o combinaciones). Configurable por
     *  puerta/lector, no hardcode. Aplica a terminales de credencial HIK que lo
     *  soportan (DS-K1T502DBFWX-C). La validación de que el device soporta el modo
     *  vive cloud-side en acceso-api (contra `capacidades.credencial`). */
    verifyMode: VerifyModeSchema.optional(),
    // --- Inferencia de video / orquestación (M4, módulo IA-video) ---
    /** Rol de este device en el evento de acceso unificado. */
    rolEnEvento: RolEnEventoSchema.optional(),
    /** Comportamiento ante una detección de video. `Aprobado Automático` gateado
     *  por la capacidad de identificación efectiva del canal (decisión E). */
    comportamientoDeteccion: ComportamientoDeteccionSchema.optional(),
    /** Cadena de detección: cómo/cuándo se dispara este device (def #4). */
    disparo: DisparoDeteccionSchema.optional(),
    /** Configuración de detección por canal (D49, Capa 2): qué tipos correr,
     *  identificación, umbral/fps/área, regiones/máscaras en el frame y stream
     *  Main/Sub. Alimenta el config-gen de Frigate. */
    deteccion: ConfigDeteccionCanalSchema.optional(),
    // Populate
    cliente: ClienteSchema.optional(),
    complejo: ComplejoSchema.optional(),
    dispositivo: DispositivoSchema.optional(),
    acceso: AccesoSchema.optional(),
  });

export const CreateDispositivoAccesoSchema = DispositivoAccesoSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
  dispositivo: true,
  acceso: true,
});

export const UpdateDispositivoAccesoSchema = DispositivoAccesoSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
  dispositivo: true,
  acceso: true,
}).partial();

export type IComportamientoCredencialValida = z.infer<
  typeof ComportamientoCredencialValidaSchema
>;
export type IComportamientoCredencialInvalida = z.infer<
  typeof ComportamientoCredencialInvalidaSchema
>;
export type IRolEnEvento = z.infer<typeof RolEnEventoSchema>;
export type IComportamientoDeteccion = z.infer<
  typeof ComportamientoDeteccionSchema
>;
export type ITipoDeteccionVideo = z.infer<typeof TipoDeteccionVideoSchema>;
export type IPuntoFrame = z.infer<typeof PuntoFrameSchema>;
export type IRegionFrame = z.infer<typeof RegionFrameSchema>;
export type IStreamDetect = z.infer<typeof StreamDetectSchema>;
export type IConfigDeteccionCanal = z.infer<typeof ConfigDeteccionCanalSchema>;
export type IModoDisparo = z.infer<typeof ModoDisparoSchema>;
export type ICondicionDisparo = z.infer<typeof CondicionDisparoSchema>;
export type IDisparoDeteccion = z.infer<typeof DisparoDeteccionSchema>;
export type IDispositivoAcceso = z.infer<typeof DispositivoAccesoSchema>;
export type ICreateDispositivoAcceso = z.infer<
  typeof CreateDispositivoAccesoSchema
>;
export type IUpdateDispositivoAcceso = z.infer<
  typeof UpdateDispositivoAccesoSchema
>;
