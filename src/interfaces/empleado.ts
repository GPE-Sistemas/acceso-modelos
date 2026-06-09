import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { PermisoSchema } from "./permiso";

/**
 * Empleado del complejo — hace explícita la nómina de personal. Vincula 1:1 a un
 * permiso de nivel Complejo (el `categoriaPermiso` vive en el permiso, se obtiene
 * por populate). El permiso sigue existiendo intacto: se usa para vincular
 * ingresos/egresos y, a futuro, habilitar funciones específicas según categoría.
 *
 * Cardinalidad 1:1 garantizada por índice único sobre `idPermiso` en acceso-datos.
 * Soft-archive vía `activo` (`fechaEgreso` documenta la baja laboral). Cloud-only,
 * gestión nivel Complejo (web admin).
 */
export const EmpleadoSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  /** Vínculo 1:1 al permiso de complejo. La categoría se lee del permiso. */
  idPermiso: z.string(),
  /** Identificador interno de RRHH. */
  legajo: z.string().optional(),
  /** Puesto/cargo (texto libre). */
  puesto: z.string().optional(),
  /** Alta laboral. Independiente de la vigencia del permiso. */
  fechaIngreso: z.string().optional(),
  /** Baja laboral. */
  fechaEgreso: z.string().optional(),
  /** Soft-archive — lo inyecta acceso-api en el create; nadie lo edita directo. */
  activo: z.boolean().optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  permiso: PermisoSchema.optional(),
});

export const CreateEmpleadoSchema = EmpleadoSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  activo: true,
  cliente: true,
  complejo: true,
  permiso: true,
});

export const UpdateEmpleadoSchema = CreateEmpleadoSchema.partial();

export type IEmpleado = z.infer<typeof EmpleadoSchema>;
export type ICreateEmpleado = z.infer<typeof CreateEmpleadoSchema>;
export type IUpdateEmpleado = z.infer<typeof UpdateEmpleadoSchema>;
