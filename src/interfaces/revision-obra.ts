import { z } from "zod";
import { PermisoSchema } from "./permiso";
import { EstadoObraSchema } from "./obra";
import { TipoDocumentoObraSchema } from "./documento-obra";

/**
 * Entrada de la bitácora de una obra (módulo Obras — doc 35). Patrón
 * `IInteraccionTicket`: trazabilidad de quién cambió qué y cuándo, con
 * observaciones. **Toda transición de estado la escribe acceso-api acá** —
 * el detalle (web y mobile) renderiza la bitácora completa.
 *
 * Append-only: no se edita ni se borra (salvo cascade al hard-delete de una
 * obra en Borrador).
 */

export const TipoRevisionObraSchema = z.enum([
  /** Transición de estado (estadoAnterior → estadoNuevo). */
  "Cambio de estado",
  /** Observación del revisor sobre la obra. */
  "Observación",
  /** El admin pidió documentación adicional (tiposDocumentoSolicitados). */
  "Pedido de documentación",
  /** La UF cargó un documento (nuevo o nueva versión). */
  "Documentación cargada",
  /** Inspección agendada o resultado registrado (Fase 2). */
  "Inspección",
  /** Comentario libre. */
  "Comentario",
]);
export type ETipoRevisionObra = z.infer<typeof TipoRevisionObraSchema>;

export const RevisionObraSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  idUnidadFuncional: z.string().optional(),
  idObra: z.string().optional(),
  tipo: TipoRevisionObraSchema,
  estadoAnterior: EstadoObraSchema.optional(),
  estadoNuevo: EstadoObraSchema.optional(),
  /** Texto libre: motivo, observación, detalle del pedido. */
  mensaje: z.string().optional(),
  /** Qué documentación se pide (tipo='Pedido de documentación'). */
  tiposDocumentoSolicitados: z.array(TipoDocumentoObraSchema).optional(),
  /** Quién — lo inyecta acceso-api (user.idPermiso). */
  idPermiso: z.string().optional(),
  // Populate
  permiso: PermisoSchema.optional(),
});

export const CreateRevisionObraSchema = RevisionObraSchema.omit({
  _id: true,
  fechaCreacion: true,
  idPermiso: true,
  permiso: true,
});

export const UpdateRevisionObraSchema = CreateRevisionObraSchema.partial();

export type IRevisionObra = z.infer<typeof RevisionObraSchema>;
export type ICreateRevisionObra = z.infer<typeof CreateRevisionObraSchema>;
export type IUpdateRevisionObra = z.infer<typeof UpdateRevisionObraSchema>;
