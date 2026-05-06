import { z } from "zod";
import { AccesoSchema } from "./acceso";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { PermisoSchema } from "./permiso";
import { UnidadFuncionalSchema } from "./unidad-funcional";
import { VehiculoSchema } from "./vehiculo";
import { VisitanteSchema } from "./visitante";

export const TipoIngresoEgresoSchema = z.enum(["Ingreso", "Egreso"]);
export const AprobadoPorIngresoEgresoSchema = z.enum(["Sistema", "Guardia"]);
export const CategoriaIngresoEgresoSchema = z.enum(["Propietario", "Visita"]);

export const IngresoEgresoSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  expireAt: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  idUnidadFuncional: z.string().optional(),
  // Datos del evento
  fechaEvento: z.string().optional(),
  tipo: TipoIngresoEgresoSchema.optional(),
  aprobado: z.boolean().optional(),
  aprobadoPor: AprobadoPorIngresoEgresoSchema.optional(),
  /** ID del permiso del usuario que aprobó, si aprobadoPor === 'Guardia' */
  aprobadoPorIdPermiso: z.string().optional(),
  /** Responsable del ingreso (propietario, residente, empleado) */
  idPermiso: z.string().optional(),
  /** Otros usuarios del sistema que acompañan */
  idsPermisosAcompanantes: z.array(z.string()).optional(),
  /** Visitantes identificados sin cuenta en el sistema */
  idsVisitantes: z.array(z.string()).optional(),
  /** Cantidad de acompañantes no identificados */
  visitantesAnonimos: z.number().optional(),
  categoria: CategoriaIngresoEgresoSchema.optional(),
  idAcceso: z.string().optional(),
  idVehiculo: z.string().optional(),
  imagenes: z.array(z.string()).optional(),
  observaciones: z.string().optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  unidadFuncional: UnidadFuncionalSchema.optional(),
  permiso: PermisoSchema.optional(),
  permisosAcompanantes: z.array(PermisoSchema).optional(),
  visitantes: z.array(VisitanteSchema).optional(),
  acceso: AccesoSchema.optional(),
  vehiculo: VehiculoSchema.optional(),
  aprobadoPorPermiso: PermisoSchema.optional(),
});

export const CreateIngresoEgresoSchema = IngresoEgresoSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
  unidadFuncional: true,
  permiso: true,
  permisosAcompanantes: true,
  visitantes: true,
  acceso: true,
  vehiculo: true,
  aprobadoPorPermiso: true,
});

export const UpdateIngresoEgresoSchema = CreateIngresoEgresoSchema.partial();

export type IIngresoEgreso = z.infer<typeof IngresoEgresoSchema>;
export type ICreateIngresoEgreso = z.infer<typeof CreateIngresoEgresoSchema>;
export type IUpdateIngresoEgreso = z.infer<typeof UpdateIngresoEgresoSchema>;
