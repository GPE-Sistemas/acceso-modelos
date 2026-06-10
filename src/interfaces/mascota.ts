import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { UnidadFuncionalSchema } from "./unidad-funcional";
import { PermisoSchema } from "./permiso";

/**
 * Registro de mascotas por unidad funcional. Catálogo scopeado por UF, mismo
 * patrón que `IVehiculo` / `IVisitante`: tenancy (`idCliente/idComplejo/
 * idUnidadFuncional`) + soft-archive (`activo` + `idPermisoCreador`). El alta la
 * hace el residente desde mobile; el admin la ve/gestiona desde el censo web.
 *
 * Las fotos y el comprobante de vacuna se guardan como `objectName` GCS (bucket
 * público, carpeta `mascotas`), nunca la URL final.
 */

/** Especie — enum fijo filtrable (raza queda como texto libre). */
export const EspecieMascotaSchema = z.enum(["Perro", "Gato", "Otro"]);
export type EEspecieMascota = z.infer<typeof EspecieMascotaSchema>;

/** Sexo de la mascota. */
export const SexoMascotaSchema = z.enum(["Macho", "Hembra"]);
export type ESexoMascota = z.infer<typeof SexoMascotaSchema>;

/**
 * Estado del registro (display-ready). "Perdida" NO es estado — se modela como
 * reporte/flag en una fase posterior (push "mascota perdida").
 */
export const EstadoMascotaSchema = z.enum(["Activa", "Fallecida", "Retirada"]);
export type EEstadoMascota = z.infer<typeof EstadoMascotaSchema>;

/**
 * Vacuna aplicada — subdoc embebido con `_id` estable (patrón
 * `encuesta.preguntas[]`). `fechaVencimiento` habilita los recordatorios de
 * vacunación de Fase 2.
 */
export const VacunaMascotaSchema = z.object({
  _id: z.string().optional(),
  /** Tipo / nombre de la vacuna (ej. "Antirrábica"). */
  tipo: z.string(),
  /** Fecha de aplicación (ISO 8601). */
  fechaAplicacion: z.string(),
  /** Fecha de vencimiento (ISO 8601). Opcional — base de los recordatorios. */
  fechaVencimiento: z.string().optional(),
  /** Veterinario / centro que la aplicó. */
  veterinario: z.string().optional(),
  /** ObjectName GCS del comprobante (bucket público, carpeta `mascotas`). */
  comprobante: z.string().optional(),
});

export const MascotaSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  // Tenancy — los inyecta acceso-api desde el JWT.
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  idUnidadFuncional: z.string().optional(),
  // Soft-archive — los gestiona acceso-api (no van en Create/Update).
  idPermisoCreador: z.string().optional(),
  activo: z.boolean().optional(),
  // Datos de la mascota.
  nombre: z.string(),
  especie: EspecieMascotaSchema,
  raza: z.string().optional(),
  sexo: SexoMascotaSchema.optional(),
  /** Fecha de nacimiento (ISO 8601). Sin range query — `@Prop String` en datos. */
  fechaNacimiento: z.string().optional(),
  /** Peso en kg. */
  peso: z.number().optional(),
  color: z.string().optional(),
  descripcion: z.string().optional(),
  castrado: z.boolean().optional(),
  /** Nro de microchip (opcional). Habilita identificación en garita (Fase 2). */
  microchip: z.string().optional(),
  /** ObjectNames GCS (bucket público, carpeta `mascotas`). */
  fotos: z.array(z.string()).optional(),
  vacunas: z.array(VacunaMascotaSchema).optional(),
  estado: EstadoMascotaSchema.optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  unidadFuncional: UnidadFuncionalSchema.optional(),
  permisoCreador: PermisoSchema.optional(),
});

export const CreateMascotaSchema = MascotaSchema.omit({
  _id: true,
  fechaCreacion: true,
  idPermisoCreador: true,
  activo: true,
  cliente: true,
  complejo: true,
  unidadFuncional: true,
  permisoCreador: true,
});

export const UpdateMascotaSchema = CreateMascotaSchema.partial();

export type IVacunaMascota = z.infer<typeof VacunaMascotaSchema>;
export type IMascota = z.infer<typeof MascotaSchema>;
export type ICreateMascota = z.infer<typeof CreateMascotaSchema>;
export type IUpdateMascota = z.infer<typeof UpdateMascotaSchema>;
