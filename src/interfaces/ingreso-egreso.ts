import { z } from "zod";
import type { IAcceso } from "./acceso";
import { AccesoSchema } from "./acceso";
import type { ICliente } from "./cliente";
import { ClienteSchema } from "./cliente";
import type { IComplejo } from "./complejo";
import { ComplejoSchema } from "./complejo";
import type { IPermiso } from "./permiso";
import { PermisoSchema } from "./permiso";
import type { IUnidadFuncional } from "./unidad-funcional";
import { UnidadFuncionalSchema } from "./unidad-funcional";
import type { IVehiculo } from "./vehiculo";
import { VehiculoSchema } from "./vehiculo";
import type { IVisitante } from "./visitante";
import { VisitanteSchema } from "./visitante";

export const TipoIngresoEgresoSchema = z.enum(["Ingreso", "Egreso"]);
export const AprobadoPorIngresoEgresoSchema = z.enum(["Sistema", "Guardia"]);
export const CategoriaIngresoEgresoSchema = z.enum(["Propietario", "Visita"]);

export interface IIngresoEgreso {
  _id?: string;
  fechaCreacion?: string;
  expireAt?: string;
  idCliente?: string;
  idComplejo?: string;
  idUnidadFuncional?: string;
  // Datos del evento
  fechaEvento?: string;
  tipo?: "Ingreso" | "Egreso";
  aprobado?: boolean;
  aprobadoPor?: "Sistema" | "Guardia";
  /** ID del permiso del usuario que aprobó, si aprobadoPor === 'Guardia' */
  aprobadoPorIdPermiso?: string;
  /** Responsable del ingreso (propietario, residente, empleado) */
  idPermiso?: string;
  /** Otros usuarios del sistema que acompañan */
  idsPermisosAcompanantes?: string[];
  /** Visitantes identificados sin cuenta en el sistema */
  idsVisitantes?: string[];
  /** Cantidad de acompañantes no identificados */
  visitantesAnonimos?: number;
  categoria?: "Propietario" | "Visita";
  idAcceso?: string;
  idVehiculo?: string;
  imagenes?: string[];
  observaciones?: string;
  // Populate
  cliente?: ICliente;
  complejo?: IComplejo;
  unidadFuncional?: IUnidadFuncional;
  permiso?: IPermiso;
  permisosAcompanantes?: IPermiso[];
  visitantes?: IVisitante[];
  acceso?: IAcceso;
  vehiculo?: IVehiculo;
  aprobadoPorPermiso?: IPermiso;
  [key: string]: any;
}

type IngresoEgresoPopulateKey =
  | "cliente"
  | "complejo"
  | "unidadFuncional"
  | "permiso"
  | "permisosAcompanantes"
  | "visitantes"
  | "acceso"
  | "vehiculo"
  | "aprobadoPorPermiso";

export type ICreateIngresoEgreso = Omit<
  Partial<IIngresoEgreso>,
  "_id" | "fechaCreacion" | IngresoEgresoPopulateKey
>;
export type IUpdateIngresoEgreso = ICreateIngresoEgreso;

const _IngresoEgresoSchema = z
  .object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    expireAt: z.string().optional(),
    idCliente: z.string().optional(),
    idComplejo: z.string().optional(),
    idUnidadFuncional: z.string().optional(),
    fechaEvento: z.string().optional(),
    tipo: TipoIngresoEgresoSchema.optional(),
    aprobado: z.boolean().optional(),
    aprobadoPor: AprobadoPorIngresoEgresoSchema.optional(),
    aprobadoPorIdPermiso: z.string().optional(),
    idPermiso: z.string().optional(),
    idsPermisosAcompanantes: z.array(z.string()).optional(),
    idsVisitantes: z.array(z.string()).optional(),
    visitantesAnonimos: z.number().optional(),
    categoria: CategoriaIngresoEgresoSchema.optional(),
    idAcceso: z.string().optional(),
    idVehiculo: z.string().optional(),
    imagenes: z.array(z.string()).optional(),
    observaciones: z.string().optional(),
    cliente: ClienteSchema.optional(),
    complejo: ComplejoSchema.optional(),
    unidadFuncional: UnidadFuncionalSchema.optional(),
    permiso: PermisoSchema.optional(),
    permisosAcompanantes: z.array(PermisoSchema).optional(),
    visitantes: z.array(VisitanteSchema).optional(),
    acceso: AccesoSchema.optional(),
    vehiculo: VehiculoSchema.optional(),
    aprobadoPorPermiso: PermisoSchema.optional(),
  })
  .passthrough();

const _CreateIngresoEgresoSchema = _IngresoEgresoSchema.omit({
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

const _UpdateIngresoEgresoSchema = _CreateIngresoEgresoSchema.partial();

export const IngresoEgresoSchema: z.ZodType<IIngresoEgreso> =
  _IngresoEgresoSchema as unknown as z.ZodType<IIngresoEgreso>;
export const CreateIngresoEgresoSchema: z.ZodType<ICreateIngresoEgreso> =
  _CreateIngresoEgresoSchema as unknown as z.ZodType<ICreateIngresoEgreso>;
export const UpdateIngresoEgresoSchema: z.ZodType<IUpdateIngresoEgreso> =
  _UpdateIngresoEgresoSchema as unknown as z.ZodType<IUpdateIngresoEgreso>;
