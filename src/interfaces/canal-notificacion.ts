import { z } from "zod";

/**
 * Canales de notificación del teléfono. Un canal es lo que el sistema
 * operativo usa para decidir cómo suena, vibra e interrumpe una notificación
 * — en Android es literalmente un `NotificationChannel` y el usuario lo ve en
 * los ajustes de la app.
 *
 * El canal sale de dos ejes independientes:
 *
 *  - **Audiencia**: a quién le llega. La decide el NIVEL del permiso
 *    destinatario (Complejo = personal del complejo, Unidad Funcional =
 *    vecino), no el tipo de push: `ticket_mensaje` le llega al vecino que
 *    abrió el ticket y al guardia que lo atiende. Un push sin permiso
 *    destinatario (alertas de contacto, respuesta a una solicitud de acceso)
 *    es por usuario y cae en vecino.
 *  - **Urgencia**: qué tan fuerte interrumpe. La decide el TIPO de push.
 *
 * Así un guardia que además vive en el barrio recibe en canales distintos lo
 * del trabajo y lo de su casa, y puede configurarlos por separado.
 */
export const CanalNotificacionSchema = z.enum([
  /** Personal, urgente: emergencias y eventos de seguridad. Sonido propio y máxima interrupción. */
  "emergencia",
  /** Personal, normal: solicitudes, obras, rondas, aprobaciones. */
  "operacion",
  /** Vecino, urgente: un menor esperando autorización, alerta de un contacto, aviso urgente. */
  "urgente_vecino",
  /** Vecino, normal: el resto. */
  "vecino",
]);

export const AudienciaNotificacionSchema = z.enum(["personal", "vecino"]);

/**
 * `interruption-level` de APNs. `critical` exige un entitlement que Apple
 * otorga a pedido y a su criterio; hasta tenerlo, el canal de emergencia usa
 * `time-sensitive`, que atraviesa los modos de concentración pero no el
 * interruptor de silencio.
 */
export const NivelInterrupcionIosSchema = z.enum([
  "active",
  "time-sensitive",
  "critical",
]);

export const ConfigCanalNotificacionSchema = z.object({
  audiencia: AudienciaNotificacionSchema,
  urgente: z.boolean(),
  /**
   * Id del `NotificationChannel` de Android. El sonido y la importancia de un
   * canal no se pueden cambiar una vez creado en el teléfono, así que cambiar
   * cualquiera de los dos exige un id nuevo (sufijo de versión).
   */
  idCanalAndroid: z.string(),
  nivelInterrupcionIos: NivelInterrupcionIosSchema,
  /**
   * Nombre base del sonido propio, sin extensión (`res/raw/<sonido>` en
   * Android, `<sonido>.caf` en el bundle iOS). Ausente = sonido del sistema.
   */
  sonido: z.string().optional(),
});

export type ICanalNotificacion = z.infer<typeof CanalNotificacionSchema>;
export type IAudienciaNotificacion = z.infer<typeof AudienciaNotificacionSchema>;
export type INivelInterrupcionIos = z.infer<typeof NivelInterrupcionIosSchema>;
export type IConfigCanalNotificacion = z.infer<
  typeof ConfigCanalNotificacionSchema
>;

export const CANALES_NOTIFICACION: Record<
  ICanalNotificacion,
  IConfigCanalNotificacion
> = {
  emergencia: {
    audiencia: "personal",
    urgente: true,
    idCanalAndroid: "emergencia_v1",
    nivelInterrupcionIos: "time-sensitive",
    sonido: "emergencia",
  },
  operacion: {
    audiencia: "personal",
    urgente: false,
    idCanalAndroid: "operacion_v1",
    nivelInterrupcionIos: "active",
  },
  urgente_vecino: {
    audiencia: "vecino",
    urgente: true,
    idCanalAndroid: "urgente_vecino_v1",
    nivelInterrupcionIos: "time-sensitive",
  },
  vecino: {
    audiencia: "vecino",
    urgente: false,
    /** El canal único histórico: los vecinos conservan cómo lo configuraron. */
    idCanalAndroid: "acceso_default",
    nivelInterrupcionIos: "active",
  },
};

/**
 * Todos los `data.type` que emite acceso-api. Es el discriminador con el que
 * la app decide a qué pantalla lleva el push; un tipo que no esté acá no tiene
 * canal y no debería salir.
 */
export const TipoPushSchema = z.enum([
  "visitor_entry",
  "visitor_exit",
  "egreso_menor_autorizacion",
  "egreso_menor_resuelto",
  "menor_movimiento",
  "ticket_mensaje",
  "ticket_estado",
  "ticket_accion",
  "ticket_comentario",
  "ticket_emergencia_recibido",
  "ticket_solicitud_recibido",
  "visita_pendiente_aprobacion",
  "visita_resuelta",
  "visita_autorizada_por_guardia",
  "alerta_contacto",
  "contacto_invitacion",
  "seguridad_evento",
  "turno_reservado",
  "turno_pendiente_aprobacion",
  "turno_aprobado",
  "turno_rechazado",
  "turno_cancelado",
  "encuesta_abierta",
  "encuesta_recordatorio",
  "encuesta_cerrada",
  "notificacion",
  "publication",
  "multa_emitida",
  "multa_anulada",
  "infraccion_emitida",
  "infraccion_anulada",
  "ronda_no_realizada",
  "ronda_novedad",
  "obra_presentada",
  "obra_documentacion_cargada",
  "obra_aprobada",
  "obra_rechazada",
  "obra_suspendida",
  "obra_reanudada",
  "obra_finalizada",
  "obra_anulada",
  "obra_documentacion_pedida",
  "obra_documento_observado",
  "solicitud_permiso_recibida",
  "solicitud_permiso_aprobada",
  "solicitud_permiso_rechazada",
]);

export type ITipoPush = z.infer<typeof TipoPushSchema>;

/** Tipos que interrumpen con el canal urgente de su audiencia. */
export const TIPOS_PUSH_URGENTES = [
  "seguridad_evento",
  "ticket_emergencia_recibido",
  "egreso_menor_autorizacion",
  "alerta_contacto",
] as const satisfies readonly ITipoPush[];

/**
 * Canal de un push. `data` es el payload de datos del mensaje: una
 * publicación es urgente o no según su categoría, no según el tipo.
 */
export function canalNotificacion(
  audiencia: IAudienciaNotificacion,
  tipo: string,
  data?: Record<string, string>,
): ICanalNotificacion {
  const urgente =
    (TIPOS_PUSH_URGENTES as readonly string[]).includes(tipo) ||
    (tipo === "publication" && data?.categoria === "urgente");
  if (audiencia === "personal") return urgente ? "emergencia" : "operacion";
  return urgente ? "urgente_vecino" : "vecino";
}
