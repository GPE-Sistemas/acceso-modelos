import { z } from "zod";
import { GeoJSONPointSchema } from "../auxiliares/geojson";
import { BotonTicketSchema, CategoriaTicketSchema } from "./boton-ticket";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { PermisoSchema } from "./permiso";
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
  fuente: z.enum(["gps", "network", "cache"]).optional(),
});

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
  estado: EstadoTicketSchema.optional(),
  /** Guardia/admin que tomó el caso */
  idPermisoAtencion: z.string().optional(),
  fechaTomado: z.string().optional(),
  fechaResolucion: z.string().optional(),
  observacionesCierre: z.string().optional(),
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
export type ITicket = z.infer<typeof TicketSchema>;
export type ICreateTicket = z.infer<typeof CreateTicketSchema>;
export type IUpdateTicket = z.infer<typeof UpdateTicketSchema>;
