import { z } from "zod";
import { GeoJSONPointSchema } from "../auxiliares/geojson";
import { BotonEmergenciaSchema } from "./boton-emergencia";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { PermisoSchema } from "./permiso";
import { UnidadFuncionalSchema } from "./unidad-funcional";

export const EstadoEmergenciaSchema = z.enum([
  "Pendiente",
  "EnAtencion",
  "Resuelta",
  "Descartada",
]);

export const MetadataUbicacionEmergenciaSchema = z.object({
    /** metros */
    accuracy: z.number().optional(),
    fuente: z.enum(["gps", "network", "cache"]).optional(),
  });

/**
 * Snapshot inmutable del botón al disparar la emergencia.
 * Permite hard delete del botón sin perder evidencia de qué se accionó.
 */
export const BotonEmergenciaSnapshotSchema = z.object({
  idBoton: z.string(),
  texto: z.string().optional(),
  icono: z.string().optional(),
  color: z.string().optional(),
});

export const EmergenciaSchema = z.object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    /**
     * Timestamp de la última mutación (ISO 8601). Anti-eco cross-edge:
     * el caller (edge) puede setearlo explícito para preservar el momento
     * exacto del write original a través del bridge; si se omite, el
     * server (acceso-datos) lo defaultea a `new Date().toISOString()`.
     * Doc 17 § Tipo A — último-write-wins por este campo.
     */
    fechaActualizacion: z.string().optional(),
    idCliente: z.string().optional(),
    idComplejo: z.string().optional(),
    /** UF emisora (si el emisor es UF) */
    idUnidadFuncional: z.string().optional(),
    /** Botón que disparó la emergencia */
    idBoton: z.string().optional(),
    /**
     * Snapshot inmutable del botón al momento del disparo.
     * Fuente de verdad para historial; idBoton puede no existir tras hard delete.
     */
    botonSnapshot: BotonEmergenciaSnapshotSchema.optional(),
    /** Emisor (mobile) */
    idPermiso: z.string().optional(),
    /** Obligatoria al crear */
    ubicacion: GeoJSONPointSchema.optional(),
    /** Datos de calidad/origen del fix GPS */
    metadataUbicacion: MetadataUbicacionEmergenciaSchema.optional(),
    /** URLs GCS, opcional, se agregan post-creación */
    imagenes: z.array(z.string()).optional(),
    estado: EstadoEmergenciaSchema.optional(),
    /** Guardia que tomó el caso */
    idPermisoAtencion: z.string().optional(),
    fechaTomado: z.string().optional(),
    fechaResolucion: z.string().optional(),
    observacionesCierre: z.string().optional(),
    // Populate
    cliente: ClienteSchema.optional(),
    complejo: ComplejoSchema.optional(),
    unidadFuncional: UnidadFuncionalSchema.optional(),
    boton: BotonEmergenciaSchema.optional(),
    permiso: PermisoSchema.optional(),
    permisoAtencion: PermisoSchema.optional(),
  });

const EmergenciaPopulateOmit = {
  cliente: true,
  complejo: true,
  unidadFuncional: true,
  boton: true,
  permiso: true,
  permisoAtencion: true,
} as const;

export const CreateEmergenciaSchema = EmergenciaSchema.omit({
  _id: true,
  fechaCreacion: true,
  estado: true,
  idPermisoAtencion: true,
  fechaTomado: true,
  fechaResolucion: true,
  observacionesCierre: true,
  ...EmergenciaPopulateOmit,
});

export const UpdateEmergenciaSchema = EmergenciaSchema.omit({
  _id: true,
  fechaCreacion: true,
  ...EmergenciaPopulateOmit,
}).partial();

export type IEstadoEmergencia = z.infer<typeof EstadoEmergenciaSchema>;
export type IMetadataUbicacionEmergencia = z.infer<
  typeof MetadataUbicacionEmergenciaSchema
>;
export type IBotonEmergenciaSnapshot = z.infer<
  typeof BotonEmergenciaSnapshotSchema
>;
export type IEmergencia = z.infer<typeof EmergenciaSchema>;
export type ICreateEmergencia = z.infer<typeof CreateEmergenciaSchema>;
export type IUpdateEmergencia = z.infer<typeof UpdateEmergenciaSchema>;
