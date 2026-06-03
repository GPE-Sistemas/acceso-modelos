import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";

/**
 * Proveedor de gastos de un complejo (módulo Egresos). Catálogo por complejo.
 * Soft-archive (`activo` + `idPermisoCreador`) — índice único parcial sobre
 * `(idComplejo, cuit)` filtrado por `activo:true` (patrón visitantes/vehículos).
 * Sin caché Redis. Cloud-only.
 *
 * Nota de nomenclatura: "Proveedor" también nombra el nivel global de GPE
 * Sistemas (`IDashboardProveedor`) y existe la categoría de permiso
 * "Prestador de Servicio". Esta entidad es independiente: el proveedor de
 * egresos del complejo (a quien se le paga un gasto).
 */

export const CondicionIvaSchema = z.enum([
  "Responsable Inscripto",
  "Monotributo",
  "Exento",
  "Consumidor Final",
]);
export type ECondicionIva = z.infer<typeof CondicionIvaSchema>;

export const ProveedorSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  razonSocial: z.string().optional(),
  cuit: z.string().optional(),
  /** Rubro/categoría principal: `_id` de un `ICategoriaGasto` en `IConfigEgresoComplejo`. */
  idCategoria: z.string().optional(),
  condicionIva: CondicionIvaSchema.optional(),
  email: z.string().optional(),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  observaciones: z.string().optional(),
  /** Soft-archive — los inyecta acceso-api en el create; nadie los edita directo. */
  activo: z.boolean().optional(),
  idPermisoCreador: z.string().optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
});

export const CreateProveedorSchema = ProveedorSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  activo: true,
  idPermisoCreador: true,
  cliente: true,
  complejo: true,
});

export const UpdateProveedorSchema = CreateProveedorSchema.partial();

export type IProveedor = z.infer<typeof ProveedorSchema>;
export type ICreateProveedor = z.infer<typeof CreateProveedorSchema>;
export type IUpdateProveedor = z.infer<typeof UpdateProveedorSchema>;
