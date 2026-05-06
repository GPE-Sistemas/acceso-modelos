import { z } from "zod";
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

export const UbicacionEmergenciaSchema = z.object({
    lat: z.number(),
    lng: z.number(),
    /** metros */
    accuracy: z.number().optional(),
    fuente: z.enum(["gps", "network", "cache"]).optional(),
  });

export const EmergenciaSchema = z.object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    idCliente: z.string().optional(),
    idComplejo: z.string().optional(),
    /** UF emisora (si el emisor es UF) */
    idUnidadFuncional: z.string().optional(),
    /** Botón que disparó la emergencia */
    idBoton: z.string().optional(),
    /** Emisor (mobile) */
    idPermiso: z.string().optional(),
    /** Obligatoria al crear */
    ubicacion: UbicacionEmergenciaSchema.optional(),
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
export type IUbicacionEmergencia = z.infer<typeof UbicacionEmergenciaSchema>;
export type IEmergencia = z.infer<typeof EmergenciaSchema>;
export type ICreateEmergencia = z.infer<typeof CreateEmergenciaSchema>;
export type IUpdateEmergencia = z.infer<typeof UpdateEmergenciaSchema>;
