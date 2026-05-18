import { z } from "zod";

/**
 * Catálogo de tipos de actividad reservable por complejo (Pádel, Tenis, Parrilla, SUM, etc.).
 * Asocia una o varias `IUnidadFuncional` tipo `Común` que materializan el recurso reservable.
 * El tipo aporta semántica (nombre, icono, color, foto) que la UF Común sola no tiene.
 */
export const TipoActividadSchema = z.object({
  _id: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  fechaCreacion: z.string().optional(),
  habilitado: z.boolean().optional(),
  nombre: z.string().optional(),
  /** Nombre de ícono Material */
  icono: z.string().optional(),
  /** hex (#rrggbb) */
  color: z.string().optional(),
  descripcion: z.string().optional(),
  /** objectName GCS bucket público */
  foto: z.string().optional(),
  /** UF Común que son recursos de este tipo (canchas, salones, etc.). Todas del mismo `idComplejo`. */
  idsUnidadesFuncionales: z.array(z.string()).optional(),
  // Populate — pesados van como `z.any()` para no inflar inferencia.
  cliente: z.any().optional(),
  complejo: z.any().optional(),
  unidadesFuncionales: z.any().optional(),
});

export const CreateTipoActividadSchema = TipoActividadSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
  unidadesFuncionales: true,
});

export const UpdateTipoActividadSchema = CreateTipoActividadSchema.partial();

export type ITipoActividad = z.infer<typeof TipoActividadSchema>;
export type ICreateTipoActividad = z.infer<typeof CreateTipoActividadSchema>;
export type IUpdateTipoActividad = z.infer<typeof UpdateTipoActividadSchema>;
