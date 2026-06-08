import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { UnidadFuncionalSchema } from "./unidad-funcional";
import { DatosPersonalesSchema } from "./usuario";

/**
 * Ámbito del visitante (modelo híbrido de scope):
 * - `UnidadFuncional`: privado de una UF (default histórico). Requiere
 *   `idUnidadFuncional`. Visible solo para esa UF.
 * - `Complejo`: visitante global del complejo (empleados que recorren varias
 *   UF: jardinero, doméstica, etc.). Sin `idUnidadFuncional`; seleccionable
 *   por todas las UF del complejo. Lo crea/gestiona nivel Complejo y exige DNI
 *   (clave de deduplicación/trazabilidad cross-UF). La regla "idUnidadFuncional
 *   requerido si ámbito UF / ausente si Complejo" la valida acceso-api (no se
 *   exporta a JSON Schema — política D42).
 */
export const VisitanteAmbitoSchema = z.enum(["UnidadFuncional", "Complejo"]);
export type IVisitanteAmbito = z.infer<typeof VisitanteAmbitoSchema>;

export const VisitanteSchema = z.object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    idCliente: z.string().optional(),
    idComplejo: z.string().optional(),
    idUnidadFuncional: z.string().optional(),
    /** Default 'UnidadFuncional'. Ver VisitanteAmbitoSchema. */
    ambito: VisitanteAmbitoSchema.optional(),
    idPermisoCreador: z.string().optional(),
    activo: z.boolean().optional(),
    datosPersonales: DatosPersonalesSchema.optional(),
    /**
     * El propio invitado validó/completó sus datos vía el link público de la
     * invitación de visita (flujo opcional, no bloqueante). Lo setea el endpoint
     * público `PUT /invitaciones-visita/:token` en acceso-api, no el alta normal.
     */
    validadoPorInvitado: z.boolean().optional(),
    /** Timestamp ISO de la última vez que el invitado confirmó sus datos. */
    fechaUltimaValidacionInvitado: z.string().optional(),
    // Populate
    cliente: ClienteSchema.optional(),
    complejo: ComplejoSchema.optional(),
    unidadFuncional: UnidadFuncionalSchema.optional(),
  });

export const CreateVisitanteSchema = VisitanteSchema.omit({
  _id: true,
  fechaCreacion: true,
  idPermisoCreador: true,
  activo: true,
  validadoPorInvitado: true,
  fechaUltimaValidacionInvitado: true,
  cliente: true,
  complejo: true,
  unidadFuncional: true,
});

export const UpdateVisitanteSchema = VisitanteSchema.omit({
  _id: true,
  fechaCreacion: true,
  idPermisoCreador: true,
  activo: true,
  validadoPorInvitado: true,
  fechaUltimaValidacionInvitado: true,
  cliente: true,
  complejo: true,
  unidadFuncional: true,
}).partial();

export type IVisitante = z.infer<typeof VisitanteSchema>;
export type ICreateVisitante = z.infer<typeof CreateVisitanteSchema>;
export type IUpdateVisitante = z.infer<typeof UpdateVisitanteSchema>;
