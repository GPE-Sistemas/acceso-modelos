import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";

export const TipoDispositivoSchema = z.enum([
  "Terminal de reconocimiento facial",
  "Lector de huella digital",
  "Lector de tarjeta",
  "Teclado numérico",
  "Otro",
]);

// Estado runtime reportado por el agent edge (H-DEV-5 / H-DEV-8).
// Owner único del estado: el agent edge Go (acceso-edge), que ya mide
// reachability via ISAPI UserCheck (60s) + lockout (401) + drift. acceso-dispositivos
// (Node) solo aporta `ultimaVistaHeartbeat` desde el HTTP Push del terminal.
// - `Pendiente Adopción`: el IDispositivo existe en cloud pero el edge todavía
//   no completó el handshake (test cred + reconfig push).
// - `Online`: reachable (ISAPI userCheck OK).
// - `Degradado`: reachable pero con fallos parciales (N fallos < umbral Offline,
//   drift de hora detectado, o errores intermitentes). Entre Online y Offline.
// - `Offline`: 5 fails consecutivos de reachability.
// - `Locked`: device reporta `lockStatus=lock` (lockout por intentos cred).
// - `Desconocido`: el edge dejó de reportar este dispositivo (staleness cloud-side,
//   análogo al lag>90s de IEdgeAppliance). No es lo mismo que Offline: el cloud
//   no sabe el estado real porque su única fuente (el edge) no reporta.
// Doc: acceso-doc-general/29-hik-terminal-adopcion.md § Monitoreo runtime.
export const EstadoDispositivoSchema = z.enum([
  "Pendiente Adopción",
  "Online",
  "Degradado",
  "Offline",
  "Locked",
  "Desconocido",
]);

/**
 * Capacidades del dispositivo: qué modalidades de credencial soporta (spec §3.3).
 * Gatea el enrolamiento — el edge solo intenta materializar lo compatible (evita
 * pegarle al device con una modalidad `notSupport` y arriesgar lockout).
 * Derivable de marca/modelo (catálogo) o relevable vía el endpoint ISAPI
 * `capabilities` de cada recurso.
 * Para el HIK DS-K1T344MBWX-E1: `{ face:true, card:true, pin:true, fingerprint:false }`.
 */
export const CapacidadesDispositivoSchema = z.object({
  face: z.boolean().optional(),
  card: z.boolean().optional(),
  pin: z.boolean().optional(),
  fingerprint: z.boolean().optional(),
});

export const ConfigDispositivoSchema = z.object({
    username: z.string().optional(),
    password: z.string().optional(),
    apikey: z.string().optional(),
    // IP LAN del device. La resuelve discovery (MAC↔IP) + adopción la persiste.
    // Mutable por DHCP del integrador — discovery refresca cuando detecta cambio.
    ipAddress: z.string().optional(),
    // Puerto HTTPS ISAPI; default 443. Algunos firmwares HIK escuchan en 80
    // (forzar via `useHttp=true`).
    port: z.number().int().positive().optional(),
    useHttp: z.boolean().optional(),
  });

export const DispositivoSchema = z.object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    habilitado: z.boolean().optional(),
    idCliente: z.string().optional(),
    idComplejo: z.string().optional(),
    // Datos específicos del dispositivo
    tipo: TipoDispositivoSchema.optional(),
    serialNumber: z.string().optional(),
    marca: z.string().optional(),
    modelo: z.string().optional(),
    config: ConfigDispositivoSchema.optional(),
    // Modalidades de credencial que soporta el device (spec §3.3). Gatea el
    // enrolamiento por compatibilidad.
    capacidades: CapacidadesDispositivoSchema.optional(),
    // Sharding edge — qué appliance recibe el HTTP Push del terminal.
    // Vacío en complejos N=1 (Standalone): el único edge es dueño implícito.
    idEdgeAppliancePrimario: z.string().optional(),
    idEdgeApplianceSecundario: z.string().optional(),
    // Estado runtime reportado por el agent edge (H-DEV-5 / H-DEV-8).
    estado: EstadoDispositivoSchema.optional(),
    // --- Telemetría de liveness por dispositivo (H-DEV-8) ---
    // El edge (owner del estado) reporta estos campos al cloud por un canal/endpoint
    // hermano del heartbeat del appliance. El cloud materializa; la web los lee y
    // recalcula el lag client-side (Date.now() vs estadoActualizado) para que el
    // badge "envejezca" sin esperar el próximo evento. NO hay polling cloud→terminal.
    //
    // Timestamp ISO del último refresh de `estado`. Habilita detección de staleness
    // en la UI ("Online ¿desde cuándo?") y el corte a `Desconocido` cloud-side.
    estadoActualizado: z.string().optional(),
    // Timestamp ISO del último heartbeat visto. Doble fuente: el HTTP Push del
    // terminal (eventType=heartBeat, ~30s, lo aporta acceso-dispositivos) y/o el
    // UserCheck OK del edge (~60s).
    ultimaVistaHeartbeat: z.string().optional(),
    // Segundos desde `ultimaVistaHeartbeat`/último check OK (espejo de IEdgeAppliance).
    lagHeartbeatSegundos: z.number().optional(),
    // Contador de fallos de reachability consecutivos. El edge corta a Offline a los
    // 5; exponerlo habilita el estado intermedio Degradado y el troubleshooting.
    consecutivosFallos: z.number().int().nonnegative().optional(),
    // Último mensaje de error del check ISAPI fallido (para el detalle de la UI).
    ultimoHeartbeatError: z.string().optional(),
    // Detalle de lockout cuando estado=Locked (derivado del UserCheck/401 del edge).
    // Coherente con AdoptarResult.lockStatus/unlockTime (dispositivo-descubierto.ts).
    lockout: z
      .object({
        unlockTimeRemainingSec: z.number().int().nonnegative().optional(),
        lockedSince: z.string().optional(),
      })
      .optional(),
    // --- Diagnóstico de enrolamiento por device (spec 32 §10.3, espejo H-DEV-8) ---
    // El edge (owner) reporta los contadores reales del terminal vía outbox
    // (upsert merge — no pisa config). La web muestra capacidad usada (N/3000).
    enrolamiento: z
      .object({
        // ISAPI AccessControl/UserInfo/Count → userNumber.
        userNumber: z.number().int().nonnegative().optional(),
        // ISAPI Intelligent/FDLib/Count → faceNumber.
        faceNumber: z.number().int().nonnegative().optional(),
        // Capacidad facial del modelo (datasheet; DS-K1T344 = 3000).
        capacidadFaces: z.number().int().positive().optional(),
        // Timestamp ISO del último refresh de los contadores.
        actualizadoEn: z.string().optional(),
      })
      .optional(),
    // Populate
    cliente: ClienteSchema.optional(),
    complejo: ComplejoSchema.optional(),
  });

export const CreateDispositivoSchema = DispositivoSchema.omit({
  _id: true,
  fechaCreacion: true,
});

export const UpdateDispositivoSchema = DispositivoSchema.omit({
  _id: true,
  fechaCreacion: true,
}).partial();

export type ITipoDispositivo = z.infer<typeof TipoDispositivoSchema>;
export type IEstadoDispositivo = z.infer<typeof EstadoDispositivoSchema>;
export type IConfigDispositivo = z.infer<typeof ConfigDispositivoSchema>;
export type ICapacidadesDispositivo = z.infer<
  typeof CapacidadesDispositivoSchema
>;
export type IDispositivo = z.infer<typeof DispositivoSchema>;
export type ICreateDispositivo = z.infer<typeof CreateDispositivoSchema>;
export type IUpdateDispositivo = z.infer<typeof UpdateDispositivoSchema>;
