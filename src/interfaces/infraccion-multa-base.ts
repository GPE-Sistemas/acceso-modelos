import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { UnidadFuncionalSchema } from "./unidad-funcional";
import { PermisoSchema } from "./permiso";
import { DispositivoSchema } from "./dispositivo";
import { MascotaSchema } from "./mascota";

/**
 * Campos base compartidos por `IMulta` e `IInfraccion`. Se spreadea dentro de
 * cada schema (patrón `PermisoBaseFields` / `RolBaseFields`) para no duplicar la
 * definición de UF multada, origen, título/motivo, detalles, imágenes, creador
 * (por permiso o dispositivo) y los campos de anulación.
 *
 * Multa e Infracción son entidades **separadas** (no "multa con monto 0"): el
 * apercibimiento no se paga ni se liquida, así que su ciclo de vida y la lógica
 * financiera divergen. La relación entre ambas es 1:1 opcional y bidireccional
 * (`IMulta.idInfraccion` ⇄ `IInfraccion.idMulta`).
 */

/**
 * Origen del registro. Hoy siempre `Permiso` (alta manual por un usuario del
 * complejo). `Dispositivo` queda **modelado** para el futuro (multa generada
 * automáticamente por hardware) — sin endpoints de ingestión por ahora.
 */
export const OrigenInfraccionMultaSchema = z.enum(["Permiso", "Dispositivo"]);
export type EOrigenInfraccionMulta = z.infer<
  typeof OrigenInfraccionMultaSchema
>;

export const InfraccionMultaBaseFields = {
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  /** UF multada / infraccionada. */
  idUnidadFuncional: z.string().optional(),
  /**
   * Mascota involucrada (opcional). Pre-horneado para Fase 2 (infracción/multa
   * asociada a una mascota registrada: perro suelto, heces, agresión, etc.).
   * Se setea desde el alta; sin endpoints de ingestión automática por ahora.
   */
  idMascota: z.string().optional(),
  /**
   * Obra asociada (opcional, módulo Obras — doc 35). Cubre el botón "Generar
   * infracción/multa" desde el detalle de obra y el apercibimiento automático
   * por plazo de obra vencido (scheduler, Fase 2 de Obras).
   */
  idObra: z.string().optional(),
  /** Correlativo por complejo, formato "YYYY-NNNN". Asignado por acceso-api al emitir. */
  numero: z.string().optional(),
  /** Default 'Permiso' en acceso-api si ausente. */
  origen: OrigenInfraccionMultaSchema.optional(),
  /** Permiso que la creó manualmente (origen='Permiso'). Lo inyecta acceso-api. */
  idPermisoCreador: z.string().optional(),
  /** Dispositivo que la generó (origen='Dispositivo', futuro). */
  idDispositivo: z.string().optional(),
  /** Título / motivo. */
  titulo: z.string(),
  detalles: z.string().optional(),
  /** ObjectNames GCS (bucket público, carpeta `multas`). */
  imagenes: z.array(z.string()).optional(),
  /** Artículo del reglamento infringido — texto libre. */
  articuloReglamento: z.string().optional(),
  // Anulación — los setea acceso-api al anular.
  idPermisoAnulo: z.string().optional(),
  fechaAnulacion: z.string().optional(),
  motivoAnulacion: z.string().optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  unidadFuncional: UnidadFuncionalSchema.optional(),
  permisoCreador: PermisoSchema.optional(),
  permisoAnulo: PermisoSchema.optional(),
  dispositivo: DispositivoSchema.optional(),
  mascota: MascotaSchema.optional(),
  /** z.any para no acoplar/inflar inferencia con ObraSchema. */
  obra: z.any().optional(),
};

/** Campos omitidos en todos los Create/Update (populate + gestionados por server). */
export const InfraccionMultaBaseOmit = {
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  numero: true,
  origen: true,
  idPermisoCreador: true,
  idPermisoAnulo: true,
  fechaAnulacion: true,
  motivoAnulacion: true,
  cliente: true,
  complejo: true,
  unidadFuncional: true,
  permisoCreador: true,
  permisoAnulo: true,
  dispositivo: true,
  mascota: true,
  obra: true,
} as const;
