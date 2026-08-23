import { z } from "zod";

/**
 * Configuración de OPERACIÓN de un dispositivo (D51) — los parámetros que hasta
 * ahora sólo se tocaban entrando a la web local del terminal: voz, volumen,
 * textos en pantalla, apagado de pantalla, privacidad del cartel y qué imágenes
 * sube por evento.
 *
 * NO es `IDispositivo.config` (credenciales ISAPI + red + video): eso lo resuelve
 * el onboarding y es input del integrador. Esto es **estado deseado** que el
 * sistema persigue y verifica.
 *
 * Tres reglas del modelo, todas atadas a comportamiento medido del firmware
 * (doc 40-configuracion-dispositivos.md § 4.1):
 *
 * 1. **Sparse a propósito.** Todos los campos son opcionales y un campo AUSENTE
 *    significa "no gestionado" — el reconciliador no lo toca. No se materializa
 *    un deseado exhaustivo con defaults nuestros: pisaría ajustes legítimos del
 *    integrador y generaría diffs eternos contra campos que el device no tiene.
 * 2. **Nombres propios, no los de HIK.** `voz.habilitada` es nuestro; el mapa a
 *    `AcsCfg.voicePrompt` (o a lo que use Dahua/ZK) vive en el adapter del edge.
 *    Así el mismo knob se expresa igual para cualquier marca.
 * 3. **Rangos declarados acá.** El `PUT` de ISAPI es todo-o-nada: un campo fuera
 *    de rango tumba el request completo y no aplica NADA. Validar antes de
 *    escribir no es cosmético.
 *
 * Alcance de esta versión = F1 del plan. Los grupos de F2 (umbrales faciales,
 * encuadre/distancia, anti-spoofing, tiempos de puerta, barbijo, planes horarios
 * de verificación) se suman cuando se implementen, no antes.
 */

/** Aviso sonoro del terminal. */
export const ConfigVozSchema = z.object({
  /**
   * Habilita el aviso de voz del terminal. En el DS-K1T344MBWX-E1 es
   * `AcsCfg.voicePrompt`: con `true` el terminal anuncia por parlante el rechazo
   * de cada cara que ve y no reconoce.
   */
  habilitada: z.boolean().optional(),
  /**
   * Volumen del parlante. `0` es mute real (validado en el K1T344). El máximo no
   * está declarado por el firmware (el recurso no expone `capabilities`); el
   * valor de fábrica observado es 6. Se acota a 0–100 para no cerrar la puerta a
   * otros modelos.
   */
  volumen: z.number().int().min(0).max(100).optional(),
});

/**
 * Textos que el terminal muestra en pantalla. En el K1T344 son los 3 slots de
 * `CustomPrompt` (máx. 16 caracteres cada uno), y sirven para castellanizar el
 * cartel sin depender del pack de idioma del device.
 *
 * OJO — irreversible en el K1T344: el firmware rechaza `promptContent` vacío, así
 * que una vez escrito un texto no se puede volver al estado de fábrica por ISAPI
 * (sí se puede deshabilitar con `habilitados: false`).
 */
export const ConfigTextosPantallaSchema = z.object({
  habilitados: z.boolean().optional(),
  exitoAutenticacion: z.string().min(1).max(16).optional(),
  falloAutenticacion: z.string().min(1).max(16).optional(),
  /** Persona detectada que no está en el padrón. */
  desconocido: z.string().min(1).max(16).optional(),
});

/** Modo de presentación de la pantalla del terminal. */
export const ModoPantallaDispositivoSchema = z.enum(["Normal", "Simple"]);

export const ConfigPantallaSchema = z.object({
  /** Apagado automático de la pantalla por inactividad. */
  apagadoAutomatico: z.boolean().optional(),
  /** Segundos de inactividad antes de apagar la pantalla (K1T344: 20–1800). */
  apagarTrasSegundos: z.number().int().min(20).max(1800).optional(),
  /** Segundos antes de entrar en standby (K1T344: 5–30). */
  standbySegundos: z.number().int().min(5).max(30).optional(),
  modo: ModoPantallaDispositivoSchema.optional(),
  /** Ventana de preview del rostro capturado. */
  mostrarPreview: z.boolean().optional(),
  /** Segundos que queda el preview en pantalla (K1T344: 1–99). */
  previewSegundos: z.number().int().min(1).max(99).optional(),
});

/**
 * Qué dato personal muestra el terminal en la puerta al autenticar. Ofuscar =
 * mostrar parcialmente (el firmware enmascara parte del nombre / legajo).
 */
export const ConfigPrivacidadPantallaSchema = z.object({
  mostrarNombre: z.boolean().optional(),
  mostrarFoto: z.boolean().optional(),
  mostrarLegajo: z.boolean().optional(),
  ofuscarNombre: z.boolean().optional(),
  ofuscarLegajo: z.boolean().optional(),
});

/**
 * Imágenes por evento de acceso. `subirCaptura` / `subirVerificacion` gobiernan
 * si el evento que el terminal pushea al edge **trae la foto** — o sea, si el
 * operador ve la imagen del ingreso en el Hub. Los `guardar*` son el almacenaje
 * local del device.
 */
export const ConfigImagenesEventoSchema = z.object({
  subirCaptura: z.boolean().optional(),
  guardarCaptura: z.boolean().optional(),
  subirVerificacion: z.boolean().optional(),
  guardarVerificacion: z.boolean().optional(),
  guardarRostro: z.boolean().optional(),
  /** Imagen de la persona autenticada que el terminal archiva (`saveCertifiedImage`). */
  guardarImagenCertificada: z.boolean().optional(),
});

/** Configuración de operación deseada. Sparse: campo ausente = no gestionado. */
export const ConfigOperacionDispositivoSchema = z.object({
  voz: ConfigVozSchema.optional(),
  textos: ConfigTextosPantallaSchema.optional(),
  pantalla: ConfigPantallaSchema.optional(),
  privacidad: ConfigPrivacidadPantallaSchema.optional(),
  imagenes: ConfigImagenesEventoSchema.optional(),
});

/**
 * Cómo se gobierna la configuración de operación de un dispositivo.
 *
 * Los tres modos son **excluyentes**, y eso es la decisión (no un detalle de
 * implementación): antes `idPerfilDispositivo` y `configDeseada` eran dos capas
 * que se sumaban, con el override pisando al perfil campo a campo. Medido en
 * producción: un terminal quedó con los 19 knobs declarados como ajuste propio
 * *además* del perfil asignado. Los valores coincidían, así que convergía igual
 * y no había ningún error a la vista — pero ese equipo había dejado de seguir al
 * perfil sin que nadie lo decidiera: cambiar el perfil no lo iba a mover nunca.
 *
 * - `Perfil`: lo gobierna el perfil asignado. `idPerfilDispositivo` presente y
 *   `configDeseada` VACÍO. Cambiar el perfil mueve a todos sus equipos.
 * - `Manual`: lo gobierna la configuración propia del equipo. `configDeseada`
 *   con lo declarado y `idPerfilDispositivo` ausente.
 * - `Sin gestionar`: no se declara nada. El sistema no toca el equipo (sigue
 *   relevando y reportando lo que tiene, que es otra cosa).
 *
 * El terminal es de uso exclusivo de este sistema, así que lo que el device
 * tiene puesto (`configuracion.real`) es una SALIDA —sirve para verificar
 * convergencia y para detectar que alguien lo tocó por fuera—, nunca la fuente
 * del deseado. Importar los valores del equipo es una operación de arranque
 * (onboarding, o pasar a `Manual` un equipo que el integrador ya había
 * configurado a mano), no una acción de rutina sobre un equipo ya gobernado.
 *
 * El invariante lo hace cumplir `acceso-api` en el create/update: el modo no es
 * una etiqueta decorativa sobre dos campos que pueden contradecirla.
 */
export const ModoConfigDispositivoSchema = z.enum([
  "Perfil",
  "Manual",
  "Sin gestionar",
]);

/**
 * Estado de la configuración de un dispositivo respecto de lo deseado.
 * - `Coincide`: lo declarado ya está aplicado en el device (verificado por read-back).
 * - `No coincide`: hay diferencias; el reconciliador las va a corregir.
 * - `Pendiente`: se declaró/cambió algo y el reconciliador todavía no comparó.
 * - `No aplicable`: no hay nada declarado para este dispositivo (modo
 *   `Sin gestionar`), o el device no soporta ninguno de los knobs declarados.
 *   En la UI se muestra como "Sin gestionar": para el operador "No aplicable" se
 *   lee como "esto no corre acá", cuando lo que pasa es que nadie declaró nada.
 *   El VALOR del enum no se renombra — vive en constantes Go del edge y en datos
 *   ya persistidos en producción.
 */
export const EstadoConfigDispositivoSchema = z.enum([
  "Coincide",
  "No coincide",
  "Pendiente",
  "No aplicable",
]);

/**
 * Un campo en discrepancia entre el deseado y el real. `recurso` es la URI del
 * recurso del device que hay que reescribir para corregirlo — permite agrupar
 * varios campos divergentes en un solo write (análogo al `puertoDownlink` del
 * reconciliador de IRIX).
 */
export const DiffConfigDispositivoSchema = z.object({
  /** Dot-path del campo en `ConfigOperacionDispositivo` (ej. `voz.habilitada`). */
  campo: z.string(),
  esperado: z.unknown().optional(),
  real: z.unknown().optional(),
  recurso: z.string().optional(),
});

/**
 * Bloque REPORTADO por el edge (dueño de la relación con el device). Viaja por
 * outbox con merge — nunca pisa `config` ni `configDeseada`, igual que la
 * telemetría de liveness y los contadores de enrolamiento (H-DEV-8).
 */
export const ConfiguracionReportadaDispositivoSchema = z.object({
  /** Último snapshot de la config real leída del device (shape propio, ya traducido). */
  real: ConfigOperacionDispositivoSchema.optional(),
  /**
   * Dot-paths que este device CON ESTE FIRMWARE soporta, relevados haciendo el
   * `GET` del recurso. No se derivan de los flags `isSupport*`: en el K1T344 una
   * docena de flags declara `true` y su URI responde `notSupport`, y a la inversa
   * hay campos reales que el `capabilities` no lista.
   */
  soportados: z.array(z.string()).optional(),
  /**
   * Dot-paths presentes en la lectura pero que el `PUT` **no persiste** (drop
   * silencioso del firmware, confirmado por read-back), o cuyo recurso responde
   * `notSupport`. El reconciliador deja de reintentarlos: sin esto, un knob así
   * genera un loop de escritura eterno.
   */
  noSoportados: z.array(z.string()).optional(),
  diffs: z.array(DiffConfigDispositivoSchema).optional(),
  estado: EstadoConfigDispositivoSchema.optional(),
  /** ISO. Última vez que el reconciliador comparó deseado vs real. */
  ultimaComparacion: z.string().optional(),
  /** ISO. Última vez que efectivamente escribió en el device. */
  ultimaAplicacion: z.string().optional(),
  /** Intentos fallidos consecutivos — alimenta el back-off. */
  reintentos: z.number().int().nonnegative().optional(),
  /** ISO. Circuit breaker: si es futuro, el reconciliador no reintenta. */
  bloqueadoHasta: z.string().optional(),
  /**
   * ISO del instante de la PRIMERA detección de divergencia (se limpia al
   * converger). Mide tiempo-a-convergencia.
   */
  divergenteDesde: z.string().optional(),
});

export type IConfigVoz = z.infer<typeof ConfigVozSchema>;
export type IConfigTextosPantalla = z.infer<typeof ConfigTextosPantallaSchema>;
export type IModoPantallaDispositivo = z.infer<
  typeof ModoPantallaDispositivoSchema
>;
export type IConfigPantalla = z.infer<typeof ConfigPantallaSchema>;
export type IConfigPrivacidadPantalla = z.infer<
  typeof ConfigPrivacidadPantallaSchema
>;
export type IConfigImagenesEvento = z.infer<typeof ConfigImagenesEventoSchema>;
export type IConfigOperacionDispositivo = z.infer<
  typeof ConfigOperacionDispositivoSchema
>;
export type IModoConfigDispositivo = z.infer<
  typeof ModoConfigDispositivoSchema
>;
export type IEstadoConfigDispositivo = z.infer<
  typeof EstadoConfigDispositivoSchema
>;
export type IDiffConfigDispositivo = z.infer<
  typeof DiffConfigDispositivoSchema
>;
export type IConfiguracionReportadaDispositivo = z.infer<
  typeof ConfiguracionReportadaDispositivoSchema
>;
