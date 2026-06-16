import { z } from "zod";

// IEventoDispositivo — bitácora de salud / eventos técnicos por dispositivo.
//
// Cloud-only (Tipo C), APPEND-ONLY. La escriben:
//  - el agent edge (vía outbox → JetStream `events`) para eventos edge-origin
//    (checks de reachability / ONVIF / RTSP / snapshot, fallas, self-heal de
//    IP, lockout, enrolamiento).
//  - acceso-api para eventos cloud-origin (ej. un snapshot-canal RPC que
//    devolvió 422).
//
// Resuelve el pendiente del doc 12-dispositivos-y-accesos.md § "Auditoría /
// salud por dispositivo". Es el LOG histórico — el ESTADO actual del device
// sigue viviendo en IDispositivo.estado/telemetría (H-DEV-8), no se duplica acá.

export const EventoDispositivoTipoSchema = z.enum([
  "check", // chequeo/test ejecutado (reachability, ONVIF GetProfiles, snapshot, RTSP, ...)
  "falla", // error operativo (snapshot 422, ONVIF unreachable, cred inválida, ...)
  "self-heal", // reconciliación automática (ej. ipAddress vieja → nueva)
  "enrolamiento", // operación de enrolamiento (alta/baja de cara/tarjeta/huella)
  "conexion", // transición de conectividad (online/offline/lockout)
]);

export const EventoDispositivoResultadoSchema = z.enum(["ok", "error"]);

// Detalle estructurado del evento (campos opcionales por caso de uso). Se
// modela explícito en vez de un record libre para sobrevivir a Mongoose strict
// y para que la UI lo renderice sin adivinar shape.
export const EventoDispositivoDetalleSchema = z.object({
  // self-heal de IP (subtipo='ip-reconciliada').
  ipVieja: z.string().optional(),
  ipNueva: z.string().optional(),
  // Cómo se matcheó el device descubierto ↔ registrado (NUNCA por IP).
  matchedBy: z.enum(["mac", "serial", "fingerprint"]).optional(),
  // Falla / check: mensaje crudo del transporte (ej.
  // "dial tcp 192.168.68.58:80: connect: connection refused").
  errorRaw: z.string().optional(),
  codigoHttp: z.number().int().optional(),
  // Contexto de canal de video cuando aplica (snapshot-canal / RTSP).
  canal: z.string().optional(),
});

export const EventoDispositivoSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),

  idCliente: z.string().optional(),
  idComplejo: z.string(),
  idDispositivo: z.string(),
  // Edge que originó el evento (ausente en eventos cloud-origin).
  idEdgeAppliance: z.string().optional(),

  tipo: EventoDispositivoTipoSchema,
  // Discriminador fino del tipo: reachability | onvif-getprofiles | snapshot |
  // rtsp | ip-reconciliada | lockout | enrolamiento-cara | ... String libre.
  subtipo: z.string().optional(),

  resultado: EventoDispositivoResultadoSchema,
  // Resumen legible del evento para la bitácora de la UI.
  mensaje: z.string().optional(),
  detalle: EventoDispositivoDetalleSchema.optional(),

  // FK al comando que originó/falló (cruza con IComandoEdge.correlationId).
  // Ej.: un snapshot-canal 422 → la falla referencia ese comando.
  idComandoEdge: z.string().optional(),

  // Timestamp ISO del evento (lo setea el origen; puede diferir de fechaCreacion).
  fechaEvento: z.string(),
  // Borrado por TTL (sesgo 30-90 días). acceso-datos lo mapea a índice TTL.
  expireAt: z.string().optional(),
});

export const CreateEventoDispositivoSchema = EventoDispositivoSchema.omit({
  _id: true,
  fechaCreacion: true,
});

export const UpdateEventoDispositivoSchema =
  CreateEventoDispositivoSchema.partial();

export type IEventoDispositivoTipo = z.infer<
  typeof EventoDispositivoTipoSchema
>;
export type IEventoDispositivoResultado = z.infer<
  typeof EventoDispositivoResultadoSchema
>;
export type IEventoDispositivoDetalle = z.infer<
  typeof EventoDispositivoDetalleSchema
>;
export type IEventoDispositivo = z.infer<typeof EventoDispositivoSchema>;
export type ICreateEventoDispositivo = z.infer<
  typeof CreateEventoDispositivoSchema
>;
export type IUpdateEventoDispositivo = z.infer<
  typeof UpdateEventoDispositivoSchema
>;
