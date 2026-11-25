import { z } from "zod";
import { GeoJSONPointSchema } from "../auxiliares/geojson";
import { BotonTicketSchema, CategoriaTicketSchema } from "./boton-ticket";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { CategoriaPermisoSchema, PermisoSchema } from "./permiso";
import { UnidadFuncionalSchema } from "./unidad-funcional";

export const EstadoTicketSchema = z.enum([
  "Pendiente",
  "EnAtencion",
  "Resuelta",
  "Descartada",
]);

export const MetadataUbicacionTicketSchema = z.object({
  /** metros */
  accuracy: z.number().optional(),
  /** `luminarias` (D78): centroide de las luminarias que escucharon el botón BLE. */
  fuente: z.enum(["gps", "network", "cache", "luminarias"]).optional(),
});

/** D78: de dónde salió el ticket. Ausente = `App`. */
export const OrigenTicketSchema = z.enum(["App", "BotonBle"]);

/** D78: una luminaria que escuchó el botón BLE (una por luminaria). */
export const EscuchaTicketSchema = z.object({
  fecha: z.string(),
  idDispositivoNodo: z.string(),
  idLuminaria: z.string().optional(),
  /** Ubicación de la luminaria (o del nodo) usada para el centroide. */
  ubicacion: GeoJSONPointSchema.optional(),
});

/** Estados en los que un ticket cuenta como abierto (un abierto por botón BLE). */
export const ESTADOS_TICKET_ABIERTO = ["Pendiente", "EnAtencion"] as const;
/** Escucha a más de esto de la anterior = otra pulsación del botón. */
export const VENTANA_PULSACION_BOTON_BLE_SEG = 60;
/** Recibida más de esto después de la pulsación = `recibidaConDemora`. */
export const DEMORA_EMERGENCIA_BOTON_BLE_SEG = 120;
/** Pulsación más vieja que esto no abre emergencia: solo actualiza el botón. */
export const MAX_ANTIGUEDAD_EMERGENCIA_BOTON_BLE_HORAS = 24;

/**
 * Snapshot inmutable del botón al disparar el ticket.
 * Permite hard delete del botón sin perder evidencia de qué se accionó.
 */
export const BotonTicketSnapshotSchema = z.object({
  idBoton: z.string(),
  categoria: CategoriaTicketSchema,
  texto: z.string().optional(),
  icono: z.string().optional(),
  color: z.string().optional(),
  /** Costo congelado del botón al disparar (fuente de verdad para liquidar). */
  costo: z.number().nonnegative().optional(),
  /**
   * Categorías de permiso que atienden el ticket (snapshot inmutable del botón).
   * Fuente de verdad para el filtro de atención del historial.
   */
  atendidoPor: z.array(CategoriaPermisoSchema).optional(),
});

/**
 * Respuesta a un campo del formulario dinámico del botón. Persiste `label`
 * como snapshot para que el historial sobreviva a edits/borrado del botón.
 */
export const RespuestaCampoFormularioTicketSchema = z.object({
  idCampo: z.string().optional(),
  label: z.string(),
  /** string para Texto/Número/Opción única; string[] para Opción múltiple. */
  valor: z.union([z.string(), z.array(z.string())]),
});

export const TicketSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  /**
   * Timestamp de la última mutación (ISO 8601). Anti-eco cross-edge:
   * el caller (edge) puede setearlo explícito para preservar el momento
   * exacto del write original a través del bridge; si se omite, el
   * server (acceso-datos) lo defaultea a `new Date().toISOString()`.
   */
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  /** UF emisora (si el emisor es UF) */
  idUnidadFuncional: z.string().optional(),
  /** Botón que disparó el ticket */
  idBoton: z.string().optional(),
  /**
   * Categoría denormalizada desde el botón al crear. Permite scope/filtro
   * sin tener que popular el botón.
   */
  categoria: CategoriaTicketSchema.optional(),
  /**
   * Snapshot inmutable del botón al momento del disparo.
   * Fuente de verdad para historial; idBoton puede no existir tras hard delete.
   */
  botonSnapshot: BotonTicketSnapshotSchema.optional(),
  /** Emisor (mobile) */
  idPermiso: z.string().optional(),
  /** Opcional: presente si el botón tiene config.requiereUbicacion */
  ubicacion: GeoJSONPointSchema.optional(),
  /** Datos de calidad/origen del fix GPS */
  metadataUbicacion: MetadataUbicacionTicketSchema.optional(),
  /** ObjectNames GCS, opcional, se agregan post-creación */
  imagenes: z.array(z.string()).optional(),
  /**
   * Respuestas del formulario dinámico del botón (si tenía `camposFormulario`).
   * Las manda el cliente al crear; acceso-api valida contra el botón.
   */
  datosFormulario: z.array(RespuestaCampoFormularioTicketSchema).optional(),
  /**
   * Costo congelado de la solicitud al crearse (mirror de `turno.costoTotal`).
   * `acceso-api` lo copia desde `boton.costo`; el cliente nunca lo manda.
   */
  costo: z.number().nonnegative().optional(),
  /**
   * True si el `costo` ya entró como cargo en una expensa. Lo setea acceso-api al
   * generar la liquidación (solo solicitudes Resuelta); evita doble facturación.
   */
  facturado: z.boolean().optional(),
  /** Back-link a la `IExpensaUnidadFuncional` que facturó esta solicitud. */
  idExpensaUF: z.string().optional(),
  estado: EstadoTicketSchema.optional(),
  /** Guardia/admin que tomó el caso */
  idPermisoAtencion: z.string().optional(),
  fechaTomado: z.string().optional(),
  fechaResolucion: z.string().optional(),
  observacionesCierre: z.string().optional(),

  // ── Botón de pánico BLE (D78, doc 62). Los escribe acceso-api. ──────────
  origen: OrigenTicketSchema.optional(),
  idDispositivoBle: z.string().optional(),
  escuchas: z.array(EscuchaTicketSchema).optional(),
  /** Ráfagas distintas recibidas mientras estuvo abierto (≥ 1). */
  pulsaciones: z.number().int().positive().optional(),
  /** Hora real de la primera pulsación (la del uplink). */
  fechaPulsacion: z.string().optional(),
  /** Última escucha recibida (cualquier luminaria): mide la ventana de pulsación. */
  fechaUltimaEscucha: z.string().optional(),
  recibidaConDemora: z.boolean().optional(),
  /** Al crearse, el botón no tenía asignación activa (sin permiso ni UF). */
  botonSinAsignar: z.boolean().optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  unidadFuncional: UnidadFuncionalSchema.optional(),
  boton: BotonTicketSchema.optional(),
  permiso: PermisoSchema.optional(),
  permisoAtencion: PermisoSchema.optional(),
});

const TicketPopulateOmit = {
  cliente: true,
  complejo: true,
  unidadFuncional: true,
  boton: true,
  permiso: true,
  permisoAtencion: true,
} as const;

export const CreateTicketSchema = TicketSchema.omit({
  _id: true,
  fechaCreacion: true,
  estado: true,
  idPermisoAtencion: true,
  fechaTomado: true,
  fechaResolucion: true,
  observacionesCierre: true,
  // Seteados por acceso-api, no por el cliente.
  botonSnapshot: true,
  costo: true,
  facturado: true,
  idExpensaUF: true,
  origen: true,
  idDispositivoBle: true,
  escuchas: true,
  pulsaciones: true,
  fechaPulsacion: true,
  fechaUltimaEscucha: true,
  recibidaConDemora: true,
  botonSinAsignar: true,
  ...TicketPopulateOmit,
});

export const UpdateTicketSchema = TicketSchema.omit({
  _id: true,
  fechaCreacion: true,
  ...TicketPopulateOmit,
}).partial();

export type IEstadoTicket = z.infer<typeof EstadoTicketSchema>;
export type IMetadataUbicacionTicket = z.infer<
  typeof MetadataUbicacionTicketSchema
>;
export type IBotonTicketSnapshot = z.infer<typeof BotonTicketSnapshotSchema>;
export type IRespuestaCampoFormularioTicket = z.infer<
  typeof RespuestaCampoFormularioTicketSchema
>;
export type ITicket = z.infer<typeof TicketSchema>;
export type ICreateTicket = z.infer<typeof CreateTicketSchema>;
export type IUpdateTicket = z.infer<typeof UpdateTicketSchema>;
export type IOrigenTicket = z.infer<typeof OrigenTicketSchema>;
export type IEscuchaTicket = z.infer<typeof EscuchaTicketSchema>;
