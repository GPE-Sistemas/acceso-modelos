import { z } from "zod";

/**
 * Trackers de visita en la garita (D55/D66 Etapa 7b, acceso-doc-general doc 38
 * §3 F3-F4 y doc 53 §7).
 *
 * El guardia entrega una tarjeta GPS (T1000) a la visita al registrar su
 * ingreso y la recibe al egreso. Cada entrega es una `IAsignacionDispositivo`
 * con `destino: 'Visita'`: la ventana `[fechaDesde, fechaHasta)` es la que
 * atribuye las posiciones del equipo a esa visita (por la fecha del dato).
 *
 * Rutas propias `/trackers-visita` y no `/asignaciones-dispositivo`: las
 * sirven **el edge y el cloud** (la garita tiene que funcionar sin internet),
 * mientras que el ABM de medidores sobre `/asignaciones-dispositivo` es
 * cloud-only. La asignación que crea el edge sube al cloud por el bridge.
 *
 * Una tarjeta por persona: la que va a varias UF lleva una sola, asociada a
 * todas sus visitas (`idsEventosVisita`). Ninguna de esas visitas puede tener
 * otra asignación `Activa`, y la tarjeta tampoco.
 */

/** `POST /trackers-visita/entregar`. */
export const EntregarTrackerSchema = z.object({
  idDispositivo: z.string().min(1),
  /** Visita principal (la del movimiento). */
  idEventoVisita: z.string().min(1),
  /** Todas las visitas de la persona (tarjeta agrupada); incluye la principal. */
  idsEventosVisita: z.array(z.string().min(1)).optional(),
  /** Visitante que la lleva (opcional: el evento puede tener varios). */
  idVisitante: z.string().optional(),
  /** Vehículo del ingreso, si va en uno. */
  idVehiculo: z.string().optional(),
  /** Movimiento de ingreso en el que se entregó. */
  idIngresoEgreso: z.string().optional(),
  observaciones: z.string().optional(),
});
export type IEntregarTracker = z.infer<typeof EntregarTrackerSchema>;

/** `PUT /trackers-visita/:id/devolver`. */
export const DevolverTrackerSchema = z.object({
  /** Movimiento de egreso en el que se devolvió. */
  idIngresoEgreso: z.string().optional(),
  observaciones: z.string().optional(),
});
export type IDevolverTracker = z.infer<typeof DevolverTrackerSchema>;

/**
 * `PUT /trackers-visita/:id/no-devuelta`. La garita nunca se traba por el
 * tracker: el egreso sale igual, con el motivo de quién lo autorizó.
 */
export const NoDevueltaTrackerSchema = z.object({
  motivoSalidaSinDevolver: z.string().trim().min(1).max(500),
  idIngresoEgreso: z.string().optional(),
});
export type INoDevueltaTracker = z.infer<typeof NoDevueltaTrackerSchema>;

/**
 * Margen alrededor del lote para dar por llegada una posición: el auto
 * estacionado en la calle, frente al lote, cuenta. La salida pide más
 * (`MARGEN_SALIDA_LOTE_METROS`) y dos posiciones seguidas, para que el GPS
 * rebotando en el borde no genere avisos.
 */
export const MARGEN_LLEGADA_LOTE_METROS = 15;
export const MARGEN_SALIDA_LOTE_METROS = 30;

/** Verificación de UNA de las visitas de la tarjeta (su UF destino). */
export const VerificacionDestinoUFSchema = z.object({
  idEventoVisita: z.string(),
  idUnidadFuncional: z.string().optional(),
  /** La UF no tiene polígono cargado: no se puede verificar. */
  sinPoligono: z.boolean(),
  llegoADestino: z.boolean(),
  /** Primera posición con coordenadas en el lote (con margen), fechaDato. */
  primeraPosicionEnDestino: z.string().optional(),
  minutosHastaDestino: z.number().optional(),
  posicionesEnDestino: z.number().int(),
});
export type IVerificacionDestinoUF = z.infer<typeof VerificacionDestinoUFSchema>;

/**
 * `GET /trackers-visita/:id/verificacion-destino` (cloud): si la persona
 * estuvo en cada UF que visitaba, contando las posiciones con coordenadas de
 * la asignación que caen en el lote (`MARGEN_LLEGADA_LOTE_METROS` incluido).
 * La métrica es presencia en el destino durante la ventana, no el recorrido
 * continuo (doc 38 D10).
 */
export const VerificacionDestinoSchema = z.object({
  idAsignacion: z.string(),
  /** Una por visita de la tarjeta, la principal primero. */
  destinos: z.array(VerificacionDestinoUFSchema),
  /** Posiciones con coordenadas de la asignación. */
  posicionesConCoordenadas: z.number().int(),
  /** Todas las posiciones atribuidas, con y sin coordenadas. */
  posicionesTotales: z.number().int(),
});
export type IVerificacionDestino = z.infer<typeof VerificacionDestinoSchema>;

/** Último reporte con coordenadas de una tarjeta. */
export const PosicionTrackerSchema = z.object({
  fechaDato: z.string(),
  /** `[lng, lat]`. */
  coordenadas: z.tuple([z.number(), z.number()]),
});
export type IPosicionTracker = z.infer<typeof PosicionTrackerSchema>;

/**
 * `GET /trackers-visita/posiciones` (edge y cloud): dónde está cada tarjeta
 * entregada ahora, para el mapa de la garita. Lo sirve también el edge: con
 * el plano del complejo responde "¿dónde está?" sin internet.
 */
export const TrackerEnCursoSchema = z.object({
  idAsignacion: z.string(),
  idDispositivo: z.string(),
  etiqueta: z.string().optional(),
  idEventoVisita: z.string().optional(),
  idsEventosVisita: z.array(z.string()).optional(),
  fechaDesde: z.string(),
  /** Ausente: todavía no reportó una posición con coordenadas. */
  posicion: PosicionTrackerSchema.optional(),
});
export type ITrackerEnCurso = z.infer<typeof TrackerEnCursoSchema>;

/**
 * Dónde anda la visita para la UF que la espera: en camino, en su lote o ya
 * se fue de su lote (sale de las paradas del recorrido de la tarjeta).
 */
export const EstadoMiVisitaTrackerSchema = z.enum([
  "EnCamino",
  "EnTuLote",
  "SeFue",
]);

/**
 * `GET /trackers-visita/mis-visitas` (cloud, nivel UF, acción `Visitas - Ver
 * ubicación de mis visitas`): las visitas de la UF que llevan una tarjeta
 * entregada ahora. Solo la última posición, nunca el recorrido: es dato
 * personal de un tercero y el trazado queda para la administración. Deja de
 * verse al devolver la tarjeta.
 */
export const MiVisitaConTrackerSchema = z.object({
  idEventoVisita: z.string(),
  idAsignacion: z.string(),
  etiqueta: z.string().optional(),
  /** Nombre con el que la UF conoce a quien la lleva. */
  visitante: z.string().optional(),
  fechaEntrega: z.string(),
  estado: EstadoMiVisitaTrackerSchema,
  /** Desde cuándo está en ese estado (llegada o salida del lote). */
  estadoDesde: z.string().optional(),
  posicion: PosicionTrackerSchema.optional(),
});
export type IEstadoMiVisitaTracker = z.infer<typeof EstadoMiVisitaTrackerSchema>;
export type IMiVisitaConTracker = z.infer<typeof MiVisitaConTrackerSchema>;
