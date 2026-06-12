import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { UnidadFuncionalSchema } from "./unidad-funcional";
import { PermisoSchema } from "./permiso";

/**
 * Documento adjunto de una obra (módulo Obras — doc 35). Entidad separada de
 * `IObra` por volumen y versionado.
 *
 * Archivos PDF + imágenes en el bucket GCS **privado**, carpeta
 * `obras/<idObra>` — el display pide signed URL. En DB se guarda el
 * `objectName` opaco.
 *
 * Versionado: una nueva carga del mismo `tipo` para la misma obra crea un doc
 * nuevo con `version+1` y marca `vigente=false` en el anterior (lo hace
 * acceso-api). El historial completo queda consultable.
 *
 * Validación: el revisor (acción `Obras - Revisar obras`) marca cada documento
 * `Aprobado` u `Observado` (con observación). Tanto el residente como el admin
 * pueden cargar documentos (ej. acta de inspección escaneada).
 */

export const TipoDocumentoObraSchema = z.enum([
  "Planos",
  "Memoria descriptiva",
  "Matrícula profesional",
  "ART",
  "Formulario 931",
  "Póliza accidentes personales",
  "Seguro RC",
  "Listado de personal",
  "Final de obra",
  "Otro",
]);
export type ETipoDocumentoObra = z.infer<typeof TipoDocumentoObraSchema>;

export const EstadoValidacionDocumentoObraSchema = z.enum([
  "Pendiente",
  "Aprobado",
  "Observado",
]);
export type EEstadoValidacionDocumentoObra = z.infer<
  typeof EstadoValidacionDocumentoObraSchema
>;

export const DocumentoObraSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  idUnidadFuncional: z.string().optional(),
  idObra: z.string().optional(),
  tipo: TipoDocumentoObraSchema,
  /** Nombre visible (típicamente el nombre original del archivo). */
  nombre: z.string(),
  /** ObjectName GCS (bucket privado, carpeta `obras/<idObra>`). */
  archivo: z.string(),
  contentType: z.string().optional(),
  /** Tamaño en bytes. */
  size: z.number().nonnegative().optional(),
  /** Incremental por (idObra, tipo) — lo asigna acceso-api al crear. */
  version: z.number().int().positive().optional(),
  /** Última versión de su tipo. acceso-api desmarca la anterior al cargar una nueva. */
  vigente: z.boolean().optional(),
  /** Default 'Pendiente'. */
  estadoValidacion: EstadoValidacionDocumentoObraSchema.optional(),
  /** Observación del revisor (estadoValidacion='Observado'). */
  observacion: z.string().optional(),
  /** Lo inyecta acceso-api en el create. */
  idPermisoCarga: z.string().optional(),
  idPermisoValidacion: z.string().optional(),
  fechaValidacion: z.string().optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  unidadFuncional: UnidadFuncionalSchema.optional(),
  /** z.any para no acoplar el import (obra ya popula hacia este lado). */
  obra: z.any().optional(),
  permisoCarga: PermisoSchema.optional(),
  permisoValidacion: PermisoSchema.optional(),
});

export const CreateDocumentoObraSchema = DocumentoObraSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  version: true,
  vigente: true,
  estadoValidacion: true,
  observacion: true,
  idPermisoCarga: true,
  idPermisoValidacion: true,
  fechaValidacion: true,
  cliente: true,
  complejo: true,
  unidadFuncional: true,
  obra: true,
  permisoCarga: true,
  permisoValidacion: true,
});

export const UpdateDocumentoObraSchema = CreateDocumentoObraSchema.partial();

export type IDocumentoObra = z.infer<typeof DocumentoObraSchema>;
export type ICreateDocumentoObra = z.infer<typeof CreateDocumentoObraSchema>;
export type IUpdateDocumentoObra = z.infer<typeof UpdateDocumentoObraSchema>;
