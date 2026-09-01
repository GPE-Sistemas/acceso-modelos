import { z } from "zod";
import { GeoJSONPointSchema } from "../auxiliares/geojson";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { UnidadFuncionalSchema } from "./unidad-funcional";
import { UsuarioSchema } from "./usuario";

/**
 * Solicitud de acceso a una unidad funcional hecha por un usuario que todavía
 * no tiene ningún permiso (típicamente alta por Google/Apple: la cuenta existe,
 * los permisos no). El usuario la crea desde mobile estando **dentro** del
 * polígono de un complejo: acceso-api resuelve `idComplejo`/`idCliente` por
 * `$geoIntersects` contra `IComplejo.ubicacion` — el cliente nunca los manda.
 *
 * La UF llega como **texto libre** (`textoUnidadFuncional`), tal como la
 * escribió el vecino ("Casa 42", "Torre B 3°C"). El match a una `IUnidadFuncional`
 * real lo hace un administrador al aprobar, junto con el rol a asignar; recién
 * ahí nace el `IPermisoUnidadFuncional` (categoría `Propietario`, vigencia hoy).
 *
 * Sólo puede haber **una** solicitud `Pendiente` por (usuario, complejo). Las
 * resueltas quedan como histórico (no hay borrado ni expiración automática).
 */

/** Estado del ciclo de vida. Terminal todo lo que no sea `Pendiente`. */
export const EstadoSolicitudPermisoSchema = z.enum([
  "Pendiente",
  "Aprobada",
  "Rechazada",
  "Cancelada",
]);
export type EEstadoSolicitudPermiso = z.infer<
  typeof EstadoSolicitudPermisoSchema
>;

/** Calidad/origen del fix GPS. Mismo shape que `IMetadataUbicacionTicket`. */
export const MetadataUbicacionSolicitudPermisoSchema = z.object({
  /** metros */
  accuracy: z.number().optional(),
  fuente: z.enum(["gps", "network", "cache"]).optional(),
});

/**
 * Snapshot de los datos del solicitante al momento de solicitar. El usuario
 * puede editar su perfil después; la bandeja del administrador tiene que
 * mostrar con qué datos pidió el acceso.
 */
export const SolicitanteSolicitudPermisoSchema = z.object({
  nombre: z.string().optional(),
  email: z.string().optional(),
  telefono: z.string().optional(),
  dni: z.string().optional(),
  /** ObjectName GCS de la foto de perfil (bucket público). */
  foto: z.string().optional(),
});

/** Resolución del administrador. Presente sólo en estados terminales. */
export const ResolucionSolicitudPermisoSchema = z.object({
  /** Permiso del administrador que resolvió. Ausente si la canceló el solicitante. */
  idPermisoResolutor: z.string().optional(),
  fecha: z.string(),
  /** Motivo del rechazo o nota de la aprobación. */
  motivo: z.string().optional(),
  /** UF con la que el admin matcheó el texto libre. Solo en `Aprobada`. */
  idUnidadFuncional: z.string().optional(),
  /** Permiso creado al aprobar. Solo en `Aprobada`. */
  idPermisoCreado: z.string().optional(),
});

export const SolicitudPermisoSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  /** `IUsuario.usuario` del solicitante (email normalizado). Lo inyecta acceso-api desde el JWT. */
  usuario: z.string().optional(),
  /** Snapshot de los datos personales al solicitar. Lo arma acceso-api. */
  solicitante: SolicitanteSolicitudPermisoSchema.optional(),
  /** Tenancy — la resuelve acceso-api por geo, no la manda el cliente. */
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  /** UF pedida, en las palabras del solicitante. */
  textoUnidadFuncional: z.string(),
  /** Comentario libre opcional del solicitante. */
  comentario: z.string().optional(),
  /** Teléfono de contacto que dejó el solicitante (opcional, puede diferir del perfil). */
  telefonoContacto: z.string().optional(),
  /** Punto GPS desde el que se solicitó. Obligatorio — es la prueba de estar dentro del complejo. */
  ubicacion: GeoJSONPointSchema,
  metadataUbicacionSolicitud:
    MetadataUbicacionSolicitudPermisoSchema.optional(),
  estado: EstadoSolicitudPermisoSchema.optional(),
  resolucion: ResolucionSolicitudPermisoSchema.optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  unidadFuncional: UnidadFuncionalSchema.optional(),
  usuarioSolicitante: UsuarioSchema.optional(),
});

export const CreateSolicitudPermisoSchema = SolicitudPermisoSchema.omit({
  _id: true,
  fechaCreacion: true,
  resolucion: true,
  cliente: true,
  complejo: true,
  unidadFuncional: true,
  usuarioSolicitante: true,
});

export const UpdateSolicitudPermisoSchema =
  CreateSolicitudPermisoSchema.partial().extend({
    resolucion: ResolucionSolicitudPermisoSchema.optional(),
  });

export type IMetadataUbicacionSolicitudPermiso = z.infer<
  typeof MetadataUbicacionSolicitudPermisoSchema
>;
export type ISolicitanteSolicitudPermiso = z.infer<
  typeof SolicitanteSolicitudPermisoSchema
>;
export type IResolucionSolicitudPermiso = z.infer<
  typeof ResolucionSolicitudPermisoSchema
>;
export type ISolicitudPermiso = z.infer<typeof SolicitudPermisoSchema>;
export type ICreateSolicitudPermiso = z.infer<
  typeof CreateSolicitudPermisoSchema
>;
export type IUpdateSolicitudPermiso = z.infer<
  typeof UpdateSolicitudPermisoSchema
>;
