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

/**
 * Licencia de conducir del visitante (D69). La carga el guardia al registrar
 * un ingreso en vehículo, eligiendo quién conduce. Vive en el visitante y no
 * en el movimiento para no pedirla de nuevo en cada visita: acceso-api (y el
 * edge) la copian a todos los visitantes activos del complejo con el mismo
 * DNI, así la ve también la próxima UF que invite a la misma persona.
 *
 * No va dentro de `datosPersonales`: los PUT del visitante (formulario de la
 * UF, link de invitación, edge) reemplazan ese subdocumento entero y la
 * borrarían sin aviso.
 */
export const LicenciaConducirSchema = z.object({
  /** Fecha de vencimiento, `YYYY-MM-DD` (fecha calendario, sin hora). */
  vencimiento: z.string(),
  /** Timestamp ISO de la última carga. */
  fechaActualizacion: z.string().optional(),
  /** Permiso del guardia que la cargó. */
  idPermisoActualizacion: z.string().optional(),
});
export type ILicenciaConducir = z.infer<typeof LicenciaConducirSchema>;

export const EstadoLicenciaConducirSchema = z.enum([
  "Vigente",
  "Por vencer",
  "Vencida",
]);
export type IEstadoLicenciaConducir = z.infer<
  typeof EstadoLicenciaConducirSchema
>;

/** Días antes del vencimiento a partir de los que se avisa `Por vencer`. */
export const DIAS_AVISO_VENCIMIENTO_LICENCIA = 30;

const MS_DIA = 24 * 60 * 60 * 1000;

/** `YYYY-MM-DD` → día absoluto (UTC), o `null` si no es una fecha válida. */
function diaCalendario(fecha: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(fecha);
  if (!m) return null;
  const t = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(t) ? null : Math.round(t / MS_DIA);
}

/**
 * Estado de una licencia contra `hoy` (`YYYY-MM-DD` en la zona del complejo —
 * lo arma el llamador: comparar contra la fecha UTC la daría por vencida un
 * día antes a la noche). El día del vencimiento todavía es válida.
 * `dias` = días hasta el vencimiento (negativo si ya venció). `null` si
 * alguna fecha es inválida.
 */
export function estadoLicenciaConducir(
  vencimiento: string,
  hoy: string,
  diasAviso: number = DIAS_AVISO_VENCIMIENTO_LICENCIA,
): { estado: IEstadoLicenciaConducir; dias: number } | null {
  const v = diaCalendario(vencimiento);
  const h = diaCalendario(hoy);
  if (v === null || h === null) return null;
  const dias = v - h;
  if (dias < 0) return { estado: "Vencida", dias };
  if (dias <= diasAviso) return { estado: "Por vencer", dias };
  return { estado: "Vigente", dias };
}

export const VisitanteSchema = z.object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    idCliente: z.string().optional(),
    idComplejo: z.string().optional(),
    idUnidadFuncional: z.string().optional(),
    /** Default 'UnidadFuncional'. Ver VisitanteAmbitoSchema. */
    ambito: VisitanteAmbitoSchema.optional(),
    /**
     * Detalle / comentario libre del visitante. Pensado para globales del
     * complejo (ej. el servicio que presta: "Jardinero", "Plomero"), para que
     * al seleccionarlo o listarlo se vea de qué se trata. Opcional para privados.
     */
    descripcion: z.string().optional(),
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
    /**
     * Permiso `Visitante` de la persona (D63, doc 50 §4.2), si tiene credencial.
     * El visitante privado de cada UF que la invita apunta al MISMO permiso; la
     * relación se resuelve por DNI dentro del complejo. No cambia el ámbito: un
     * privado sigue privado. System-managed: lo setea acceso-api.
     */
    idPermisoVisitante: z.string().optional(),
    /**
     * Licencia de conducir (D69). System-managed: la escribe el alta del
     * movimiento (`licenciaConductor` en `POST /ingresos-egresos`), nunca un
     * PUT del visitante.
     */
    licenciaConducir: LicenciaConducirSchema.optional(),
    // Populate
    cliente: ClienteSchema.optional(),
    complejo: ComplejoSchema.optional(),
    unidadFuncional: UnidadFuncionalSchema.optional(),
    /**
     * Populate de `idPermisoVisitante`: el permiso `Visitante` de la persona.
     * El panel de guardia lo pide con `select: 'datosFormales'` para mostrar
     * el nombre real (el de la cuenta, que acceso-api copia a `datosFormales`
     * al reclamar) en lugar del que cargó cada UF. `z.any()`: `IPermiso` es
     * una discriminated union profunda (criterio de `vinculo-evento-ingreso.ts`).
     */
    permisoVisitante: z.any().optional(),
  });

export const CreateVisitanteSchema = VisitanteSchema.omit({
  _id: true,
  fechaCreacion: true,
  idPermisoCreador: true,
  activo: true,
  validadoPorInvitado: true,
  fechaUltimaValidacionInvitado: true,
  idPermisoVisitante: true,
  licenciaConducir: true,
  cliente: true,
  complejo: true,
  unidadFuncional: true,
  permisoVisitante: true,
});

export const UpdateVisitanteSchema = VisitanteSchema.omit({
  _id: true,
  fechaCreacion: true,
  idPermisoCreador: true,
  activo: true,
  validadoPorInvitado: true,
  fechaUltimaValidacionInvitado: true,
  idPermisoVisitante: true,
  licenciaConducir: true,
  cliente: true,
  complejo: true,
  unidadFuncional: true,
  permisoVisitante: true,
}).partial();

export type IVisitante = z.infer<typeof VisitanteSchema>;
export type ICreateVisitante = z.infer<typeof CreateVisitanteSchema>;
export type IUpdateVisitante = z.infer<typeof UpdateVisitanteSchema>;
