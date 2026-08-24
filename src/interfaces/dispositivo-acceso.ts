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

/**
 * Rol de ACTUACIÓN de este dispositivo en este acceso (D53). Distinto de
 * `RolEnEventoSchema`, que es del plano evento (quién genera / enriquece /
 * registra el `IIngresoEgreso`): un dispositivo puede generar el evento y no
 * mover nada, o mover el fierro sin generar evento propio.
 *
 * Un acceso puede tener terminal Y controlador; el que actúa lo designa
 * `IAcceso.idDispositivoAccesoActuador`. `Actuador Secundario` es respaldo
 * declarado (no se usa solo porque el principal falle — eso es decisión de
 * operador, no failover automático).
 */
export const RolActuacionSchema = z.enum([
  "Actuador Principal",
  "Actuador Secundario",
  "No actúa",
]);

/**
 * Cómo se acciona el fierro (D53). Define qué comandos tiene sentido ofrecer y
 * cuántas salidas hace falta cablear.
 *
 * - `PulsoUnico`: una salida, un pulso, cierra solo (cerradura eléctrica,
 *   molinete, barrera con autocierre). Es lo único que cubre un HIK K1T344.
 * - `AbrirCerrar`: dos salidas pulsadas independientes, sin autocierre — el
 *   sistema tiene que ordenar el cierre (caso Golf Chascomús).
 * - `AbrirCerrarStop`: suma parada del movimiento (portón corredizo).
 * - `Mantenida`: la salida queda energizada hasta nueva orden. Válido para
 *   cerradura; NO para barrera pulsada (ver `ComandoActuacionSchema`).
 */
export const ModoActuacionSchema = z.enum([
  "PulsoUnico",
  "AbrirCerrar",
  "AbrirCerrarStop",
  "Mantenida",
]);

/**
 * Qué realimentación hay CABLEADA en esta instalación (D53) — no qué soporta el
 * hardware. Determina la confianza del estado que publica el sistema
 * (`IAcceso.confianzaEstado`).
 *
 * - `Ninguna`: sólo se sabe qué se ordenó → estado `Inferido`.
 * - `RelayDelActuador`: el device confirma que el contacto cerró (HIK
 *   `doorLockStatus` + minors 29/31). Prueba el contacto, NO que el fierro se
 *   haya movido → sigue siendo `Inferido`.
 * - `SensorFisico`: fin de carrera / lazo / contacto de puerta cableado a una
 *   entrada → estado `Reportado`.
 *
 * Cuidado con el HIK: reporta los minors 21/22 ("puerta abierta/cerrada")
 * sintetizados de su propio relé, sin sensor cableado y con `magneticStatus` en
 * 0. No confundirlos con realimentación real (doc 42 §4).
 */
export const FeedbackActuacionSchema = z.enum([
  "Ninguna",
  "RelayDelActuador",
  "SensorFisico",
]);

/**
 * Configuración de actuación del par (dispositivo, acceso) — D53, Capa 2.
 * Análogo a `ConfigDeteccionCanalSchema` para video: la Capa 1 dice qué puede el
 * hardware, esto dice cómo se usa acá.
 *
 * `modo` ⊆ capacidad efectiva del device (`capacidades.actuacion.comandos`) —
 * validación dura cloud-side en acceso-api: pedir `AbrirCerrar` a un device de
 * una sola salida se rechaza al guardar, no al operar.
 *
 * El mapeo `salidaAbrir`/`salidaCerrar`/`salidaDetener` es lo que resuelve el
 * controlador de I/O que maneja N barreras: N filas `IDispositivoAcceso`, cada
 * una apuntando a sus salidas. Son identificadores del device (índice de relé,
 * `doorNo` del ISAPI, id de canal), no del sistema — el driver los interpreta.
 * Reemplazan el uso de `canalDispositivo` para actuación, que es un string único
 * y no alcanza para un juego de salidas.
 */
export const ActuadorDispositivoAccesoSchema = z.object({
  rol: RolActuacionSchema.optional(),
  modo: ModoActuacionSchema.optional(),
  /** Salida que abre. HIK: `"1"` = door 1 de `RemoteControl/door/1`. */
  salidaAbrir: z.string().optional(),
  /** Salida que cierra (sólo `AbrirCerrar*`). */
  salidaCerrar: z.string().optional(),
  /** Salida que detiene el movimiento (sólo `AbrirCerrarStop`). */
  salidaDetener: z.string().optional(),
  /** Duración del pulso, cuando el actuador la acepta por comando. En el HIK NO
   *  se manda por comando: la fija `Door/param.openDuration` del device y se
   *  gobierna por configuración declarativa (D51). */
  pulsoMs: z.number().int().positive().optional(),
  /** Cuánto tarda el fierro en completar la carrera. Sin realimentación, es lo
   *  que permite inferir `Abriendo → Abierto` en vez de dejarlo `Desconocido`. */
  tiempoRecorridoSeg: z.number().positive().optional(),
  /** Si el actuador cierra solo, en cuánto. Ausente = no cierra solo. */
  autoCierreSeg: z.number().positive().optional(),
  feedback: FeedbackActuacionSchema.optional(),
  /** Entrada donde está cableado el sensor de "abierto" (`SensorFisico`). */
  entradaAbierta: z.string().optional(),
  /** Entrada donde está cableado el sensor de "cerrado" (`SensorFisico`). */
  entradaCerrada: z.string().optional(),
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
    /** Indica si el dispositivo puede recibir un comando para abrir el acceso.
     *  DEPRECADO por `actuador` (D53): equivale a
     *  `actuador.rol='Actuador Principal'` + `modo='PulsoUnico'`. Se mantiene
     *  mientras haya consumidores; lo deriva acceso-api. */
    aperturaConComando: z.boolean().optional(),
    /** Configuración de actuación de este par (D53, Capa 2): rol, modo, mapeo a
     *  salidas físicas, tiempos y realimentación. Ausente = este dispositivo no
     *  acciona nada en este acceso. */
    actuador: ActuadorDispositivoAccesoSchema.optional(),
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
export type IRolActuacion = z.infer<typeof RolActuacionSchema>;
export type IModoActuacion = z.infer<typeof ModoActuacionSchema>;
export type IFeedbackActuacion = z.infer<typeof FeedbackActuacionSchema>;
export type IActuadorDispositivoAcceso = z.infer<
  typeof ActuadorDispositivoAccesoSchema
>;
export type IDispositivoAcceso = z.infer<typeof DispositivoAccesoSchema>;
export type ICreateDispositivoAcceso = z.infer<
  typeof CreateDispositivoAccesoSchema
>;
export type IUpdateDispositivoAcceso = z.infer<
  typeof UpdateDispositivoAccesoSchema
>;
