import { z } from "zod";
import { ComplejoSchema } from "./complejo";
import { PermisoSchema } from "./permiso";

export const TipoBloqueSchema = z.enum([
  "texto",
  "imagen",
  "link",
  "archivo",
  "video",
  "ubicacion",
]);

export const CategoriaPublicacionSchema = z.enum([
  "aviso",
  "evento",
  "mantenimiento",
  "urgente",
  "informacion",
]);

export const BloqueSchema = z.object({
    tipo: TipoBloqueSchema.optional(),
    orden: z.number().optional(),
    /** texto */
    contenido: z.string().optional(),
    /** imagen, archivo, video */
    url: z.string().optional(),
    /** imagen, archivo (nombre original) */
    nombre: z.string().optional(),
    /** imagen, archivo */
    mimeType: z.string().optional(),
    /** link */
    href: z.string().optional(),
    /** link (texto visible), video (caption) */
    descripcion: z.string().optional(),
    /** ubicacion */
    latitud: z.number().optional(),
    /** ubicacion */
    longitud: z.number().optional(),
    /** ubicacion (label legible) */
    direccion: z.string().optional(),
  });

export const PublicacionSchema = z.object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    /**
     * Timestamp de la última mutación (ISO 8601). Anti-eco bridge bilateral:
     * el caller (edge o cloud) puede setearlo explícito para preservar el
     * momento exacto del write original a través del bridge; si se omite,
     * el server (acceso-datos) lo defaultea a `new Date().toISOString()`.
     * Doc 17 § Tipo A bilateral — último-write-wins por este campo.
     */
    fechaActualizacion: z.string().optional(),
    habilitado: z.boolean().optional(),
    idCliente: z.string().optional(),
    idComplejo: z.string().optional(),
    titulo: z.string().optional(),
    categoria: CategoriaPublicacionSchema.optional(),
    prioridad: z.number().optional(),
    fechaInicio: z.string().optional(),
    /** null = permanente */
    fechaFin: z.string().nullable().optional(),
    bloques: z.array(BloqueSchema).optional(),
    idPermisoCarga: z.string().optional(),
    // Populate
    complejo: ComplejoSchema.optional(),
    permisoCarga: PermisoSchema.optional(),
  });

export const CreatePublicacionSchema = PublicacionSchema.omit({
  _id: true,
  fechaCreacion: true,
  complejo: true,
  permisoCarga: true,
});

export const UpdatePublicacionSchema = PublicacionSchema.omit({
  _id: true,
  fechaCreacion: true,
  complejo: true,
  permisoCarga: true,
}).partial();

export type ETipoBloque = z.infer<typeof TipoBloqueSchema>;
export type ECategoriaPublicacion = z.infer<typeof CategoriaPublicacionSchema>;
export type IBloque = z.infer<typeof BloqueSchema>;
export type IPublicacion = z.infer<typeof PublicacionSchema>;
export type ICreatePublicacion = z.infer<typeof CreatePublicacionSchema>;
export type IUpdatePublicacion = z.infer<typeof UpdatePublicacionSchema>;
