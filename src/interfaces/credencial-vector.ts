import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { CredencialSchema } from "./credencial";
import { PermisoSchema } from "./permiso";
import { UnidadFuncionalSchema } from "./unidad-funcional";

/**
 * ICredencialVector — metadato del embedding facial de una credencial (módulo
 * IA-video, M5). Catálogo cloud para identificación de rostro 1:N.
 *
 * Decisión B (cerrada 2026-06-08): el cloud guarda foto + METADATOS del vector
 * (modelo, dimensión, versión del pipeline); el VECTOR CRUDO no se replica al cloud
 * — vive en el índice caliente del edge (hnswlib/sqlite-vss). Esto minimiza PII
 * biométrica fuera del complejo (Ley 25.326 — ver doc 04) y deja el matching en el
 * edge. El cloud guarda lo necesario para re-derivar (la foto de ICredencial).
 *
 * Una credencial facial puede tener N vectores (uno por modelo/versión) para soportar
 * re-enrolar al cambiar de modelo sin tocar ICredencial.
 *
 * Doc: acceso-ia-video/docs/decisiones/02-relevamiento-modelo-actual.md §3.3.
 */

/** Estado de la derivación/indexado del vector en el edge. */
export const EstadoCredencialVectorSchema = z.enum([
  "Pendiente", // metadato creado, el edge todavía no derivó el vector
  "Derivado", // el edge derivó el embedding y lo indexó localmente
  "Fallido", // falló la derivación (foto inservible, etc.)
  "Obsoleto", // modelo/versión reemplazado por uno nuevo
]);

export const CredencialVectorSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  // Scope tenant
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  idUnidadFuncional: z.string().optional(),
  // Relaciones
  /** Credencial lógica facial que originó el vector (FK a ICredencial). */
  idCredencial: z.string().optional(),
  /** Dueño de la credencial (IPermiso, categoriaPermiso=Propietario). */
  idPermiso: z.string().optional(),
  // Metadatos del embedding (NO el vector crudo)
  /** Modelo de extracción (ej. 'insightface-buffalo_l', 'arcface-r100'). */
  modelo: z.string().optional(),
  /** Dimensión del vector (ej. 512). */
  dim: z.number().int().positive().optional(),
  /** Versión del pipeline de extracción (detección+alineación+embedding). */
  version: z.string().optional(),
  /** objectName GCS de la foto origen (== ICredencial.datos.fotoCredencial). */
  fotoCredencial: z.string().optional(),
  /** Checksum del vector derivado en el edge — verifica drift edge↔cloud sin
   *  transportar el vector. */
  vectorChecksum: z.string().optional(),
  estado: EstadoCredencialVectorSchema.optional(),
  /** ISO — cuándo el edge derivó/indexó por última vez. */
  fechaUltimaDerivacion: z.string().optional(),
  /** Mensaje legible del último fallo de derivación. */
  ultimoError: z.string().optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  unidadFuncional: UnidadFuncionalSchema.optional(),
  credencial: CredencialSchema.optional(),
  permiso: PermisoSchema.optional(),
});

export const CreateCredencialVectorSchema = CredencialVectorSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  cliente: true,
  complejo: true,
  unidadFuncional: true,
  credencial: true,
  permiso: true,
});

export const UpdateCredencialVectorSchema =
  CreateCredencialVectorSchema.partial();

export type IEstadoCredencialVector = z.infer<
  typeof EstadoCredencialVectorSchema
>;
export type ICredencialVector = z.infer<typeof CredencialVectorSchema>;
export type ICreateCredencialVector = z.infer<
  typeof CreateCredencialVectorSchema
>;
export type IUpdateCredencialVector = z.infer<
  typeof UpdateCredencialVectorSchema
>;
