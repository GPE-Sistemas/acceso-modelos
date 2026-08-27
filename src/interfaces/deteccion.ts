import { z } from "zod";
import { AccesoSchema } from "./acceso";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { DispositivoSchema } from "./dispositivo";
import { VerifyModeSchema } from "./credencial";

/**
 * IDeteccion — señal cruda de UN dispositivo en un instante. Nació como la salida
 * del motor de inferencia de video (módulo IA-video, M3), donde varias detecciones
 * casi-simultáneas en un mismo acceso se correlacionan en un único IIngresoEgreso
 * (def #2 del doc 01).
 *
 * D56 la extiende a BITÁCORA CRUDA DE TODO DISPOSITIVO: toda señal de un terminal
 * de acceso se persiste acá — el intento validado, el no reconocido, y también
 * puerta, relé, comando remoto, alarma y lo que no sepamos interpretar. La
 * configuración del IDispositivoAcceso (`comportamientoCredencialValida` /
 * `comportamientoCredencialInvalida`) decide si se materializa un IIngresoEgreso
 * — qué ve el guardia — NUNCA si se persiste la detección.
 *
 * Decisión A (cerrada 2026-06-08): la detección se PERSISTE con `expireAt`/TTL
 * (trazabilidad + sobrevive reinicios del edge; el TTL acota el volumen).
 *
 * Owner operacional: el edge (RPi5+Hailo) materializa y correlaciona. Sync edge↔cloud
 * Tipo A vía `fechaActualizacion` (último-write-wins), como IEventoVisita.
 *
 * Doc: acceso-doc-general/43-detecciones.md (D56);
 * acceso-ia-video/docs/decisiones/02-relevamiento-modelo-actual.md §3.2.
 */

/**
 * De qué clase de sensor viene la señal. Los cuatro primeros son inferencia de
 * video; `acceso-terminal` es un terminal de credencial (HIK y equivalentes),
 * cuya clase de hecho la discrimina `categoria` (D56).
 */
export const TipoDeteccionSchema = z.enum([
  "persona",
  "vehiculo",
  "patente",
  "rostro",
  "acceso-terminal",
]);

/**
 * Clase de hecho reportado por un terminal de acceso (D56). Mientras `tipo`
 * responde *de qué clase de sensor viene*, `categoria` responde *qué clase de
 * hecho es*: un intento de acceso, un relé que cerró y un anti-tamper no
 * comparten forma ni consumidor.
 *
 * NO se modela como valores nuevos de `TipoDeteccionSchema` porque ese enum lo
 * consume también `IIngresoEgreso.tipoDeteccion[]`, donde "puerta cerrada" no
 * significa nada.
 *
 * `No Mapeado` no es un error: es el evento que el dispositivo reportó y que
 * todavía no sabemos interpretar. Se persiste igual, con `eventoOrigen` crudo —
 * el filtro de subtipos del edge estaba escrito contra los códigos del K1T344 y
 * el K1T502 reporta sus rechazos con otros, así que estuvo descartando el 100%
 * de ellos en producción sin dejar rastro.
 */
export const CategoriaDeteccionTerminalSchema = z.enum([
  "Intento de Acceso",
  "Puerta",
  "Relé",
  "Comando Remoto",
  "Alarma",
  "Sistema",
  "No Mapeado",
]);

/**
 * Veredicto del terminal ante una credencial presentada (D56). Solo aplica a
 * `categoria === 'Intento de Acceso'`; en el resto de las categorías no
 * significa nada y va ausente.
 *
 * PENDIENTE (acceso-doc-general/PENDIENTES.md § Detecciones de terminales de
 * acceso): falta el tercer caso — la credencial que el terminal SÍ reconoce
 * pero rechaza (vencida, fuera de plan horario, `userType: blackList`). Es
 * semánticamente distinto de "no reconocida". No se agrega el valor hasta
 * relevar contra device qué código emite cada caso.
 */
export const ResultadoDeteccionSchema = z.enum(["Validada", "No Reconocida"]);

/**
 * A quién identificó el terminal, denormalizado al momento de la detección
 * (D56).
 *
 * El `identificador` que reporta el equipo NO es legible: en el enrolamiento
 * facial el `employeeNo` que se le escribe al terminal es el ObjectId del
 * permiso, así que la columna cruda muestra 24 caracteres de hex. Mostrar un id
 * pelado en una vista de auditoría no sirve para nada.
 *
 * Va como SNAPSHOT y no como populate por dos razones: el Hub edge sirve las
 * entidades planas (un populate ahí no existe, la vista quedaría en hex contra
 * el edge y con nombre contra el cloud), y una detección es un registro
 * histórico — si el permiso se borra o cambia de dueño, lo que hay que poder
 * leer es a quién identificó el equipo ESE día. Mismo criterio que
 * `visitantesSnapshot` en IIngresoEgreso.
 *
 * Sólo se puebla cuando el lookup de credencial resolvió (intento validado).
 */
export const IdentificacionDeteccionSchema = z.object({
  /** Permiso resuelto. Trazabilidad; para mostrar, usar los otros campos. */
  idPermiso: z.string().optional(),
  /** Nombre de la persona al momento de la detección. */
  nombre: z.string().optional(),
  /** Nombre/número de la unidad funcional (ej. "102"). */
  unidadFuncional: z.string().optional(),
});

/**
 * Códigos crudos del evento tal como los reportó el dispositivo (D56). Se
 * persisten SIEMPRE, esté el evento mapeado o no: es lo que vuelve accionable
 * una `categoria: 'No Mapeado'` y lo que permite descubrir el vocabulario de un
 * modelo nuevo sin desplegar nada (listar por categoría y leer el código).
 *
 * En la familia Hikvision son `majorEventType` / `subEventType`.
 */
export const EventoOrigenDispositivoSchema = z.object({
  major: z.number().int(),
  minor: z.number().int(),
});

/**
 * Estado de la detección respecto del evento de acceso unificado.
 *
 * Solo aplica a las detecciones de VIDEO. Las de terminal (`tipo:
 * 'acceso-terminal'`) lo dejan AUSENTE a propósito (D56): son bitácora, no
 * candidatas a correlación. El correlador filtra por `= 'Pendiente'`, así que
 * el campo ausente las excluye por construcción y no se duplica el
 * IIngresoEgreso que ya crea el camino del terminal.
 */
export const EstadoCorrelacionDeteccionSchema = z.enum([
  "Pendiente", // todavía no fusionada a un IIngresoEgreso / IEventoSeguridad
  "Fusionada", // ya aportó a un IIngresoEgreso (ver idIngresoEgreso) o IEventoSeguridad (ver idEventoSeguridad)
  "Descartada", // ruido / fuera de ventana / duplicada
  "Registrada", // terminal sin entidad: zona SoloEstadistica (D49 F3) — persiste para estadística, no genera evento
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
  /**
   * Zona geográfica que originó la detección (D49, Capa 3). Mutuamente excluyente
   * con `idAcceso`: una detección rutea a `IIngresoEgreso` (idAcceso) o a la
   * semántica de zona (idZona), no a ambos. La exclusividad es regla custom
   * cloud-side (no exportable a JSON Schema).
   */
  idZona: z.string().optional(),
  idDispositivo: z.string().optional(),
  /** Canal del NVR/XVR que originó la detección (matchea IDispositivoAcceso.canalDispositivo). */
  canalDispositivo: z.string().optional(),
  // Datos de la detección
  fechaDeteccion: z.string().optional(),
  tipo: TipoDeteccionSchema.optional(),
  /** Score del modelo (0..1). Solo detecciones de video. */
  confianza: z.number().optional(),
  /** Patente leída (LPR), cuando tipo === 'patente'. */
  patente: z.string().optional(),
  /** Credencial matcheada (1:N), cuando hubo identificación de rostro. */
  idCredencialMatch: z.string().optional(),
  /** Permiso dueño de la credencial matcheada. */
  idPermisoMatch: z.string().optional(),
  /** Distancia/score del match de embedding (menor = más cercano, según métrica). */
  distanciaMatch: z.number().optional(),
  /** Crops/frame en GCS (objectNames). En terminal, la foto que capturó el equipo. */
  imagenes: z.array(z.string()).optional(),
  // --- Terminal de acceso (D56) — solo cuando tipo === 'acceso-terminal' ---
  /** Qué clase de hecho reportó el terminal. Discrimina la forma del resto del bloque. */
  categoria: CategoriaDeteccionTerminalSchema.optional(),
  /** Veredicto del terminal. Solo `categoria === 'Intento de Acceso'`. */
  resultado: ResultadoDeteccionSchema.optional(),
  /**
   * Identificador crudo presentado en el terminal, tal como lo reportó el equipo:
   * `employeeNoString`, número de tarjeta o PIN según la modalidad. Es el ÚNICO
   * dato del intento no reconocido — cuando el lookup de credencial resuelve, el
   * permiso queda además en `idPermisoMatch`.
   */
  identificador: z.string().optional(),
  /**
   * Con qué modalidad autenticó — espejo de `currentVerifyMode` del evento.
   * Mismo campo y mismo enum que `IIngresoEgreso.modalidadAutenticacion`.
   *
   * OJO: los modos con cara todavía NO están en `VerifyModeSchema` (pendiente
   * declarado en `credencial.ts`), así que en un terminal facial este campo va
   * ausente hasta relevarlos. No inventar valores para llenarlo.
   */
  modalidadAutenticacion: VerifyModeSchema.optional(),
  /**
   * Quién fue, en legible. Snapshot al momento de la detección — el
   * `identificador` crudo no sirve para leer (en facial es el id del permiso).
   */
  identificacion: IdentificacionDeteccionSchema.optional(),
  /** Códigos crudos del evento del dispositivo. Se persisten esté mapeado o no. */
  eventoOrigen: EventoOrigenDispositivoSchema.optional(),
  // Correlación
  /** IIngresoEgreso al que se fusionó esta detección (ausente = todavía suelta). */
  idIngresoEgreso: z.string().optional(),
  /**
   * IEventoSeguridad al que se fusionó esta detección (D49, Capa 3 / F3). Ruteo
   * por zona `Alerta` (Perimetro+Critica). Mutuamente excluyente con
   * `idIngresoEgreso` (una detección rutea a acceso o a zona, no a ambos).
   */
  idEventoSeguridad: z.string().optional(),
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
export type ICategoriaDeteccionTerminal = z.infer<
  typeof CategoriaDeteccionTerminalSchema
>;
export type IResultadoDeteccion = z.infer<typeof ResultadoDeteccionSchema>;
export type IEventoOrigenDispositivo = z.infer<
  typeof EventoOrigenDispositivoSchema
>;
export type IIdentificacionDeteccion = z.infer<
  typeof IdentificacionDeteccionSchema
>;
export type IEstadoCorrelacionDeteccion = z.infer<
  typeof EstadoCorrelacionDeteccionSchema
>;
export type IDeteccion = z.infer<typeof DeteccionSchema>;
export type ICreateDeteccion = z.infer<typeof CreateDeteccionSchema>;
export type IUpdateDeteccion = z.infer<typeof UpdateDeteccionSchema>;
