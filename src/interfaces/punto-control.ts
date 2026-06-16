import { z } from "zod";
import { GeoJSONPointSchema } from "../auxiliares/geojson";

/**
 * Tipo de checkpoint físico de una ronda de vigilancia.
 * - `QR`: sticker impreso con un código; el guardia lo escanea con la cámara.
 * - `NFC`: tag grabado con el código; se lee por proximidad (Fase 2).
 * - `GPS`: sin marcador físico, se valida por geocerca (estar dentro del radio).
 *
 * En F1 solo `QR` está soportado en la app; `NFC`/`GPS` quedan modelados.
 */
export const TipoPuntoControlSchema = z.enum(["QR", "NFC", "GPS"]);
export type ITipoPuntoControl = z.infer<typeof TipoPuntoControlSchema>;

/**
 * Punto de control (checkpoint) de rondas de vigilancia. Es un lugar físico del
 * complejo que el guardia debe visitar y marcar durante una ronda.
 *
 * El `codigo` es el identificador que viaja en el QR / tag NFC — opaco, único por
 * complejo. Se genera al crear el punto y se imprime/graba en el marcador físico.
 * Anti-fraude (F1): la marca del QR exige geolocalización del teléfono validada
 * contra `ubicacion` + `radioValidacionMetros`.
 *
 * Soft-archive (`activo`) como visitantes/vehículos: archivar no rompe el
 * histórico de rondas que lo referencian (que además guardan snapshot).
 */
export const PuntoControlSchema = z.object({
  _id: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  fechaCreacion: z.string().optional(),
  nombre: z.string(),
  tipo: TipoPuntoControlSchema,
  /**
   * Código opaco impreso en el QR / grabado en el tag NFC. Único por complejo
   * (índice único parcial sobre `activo: true` en acceso-datos). Lo genera
   * acceso-api al crear; el cliente no lo manda.
   */
  codigo: z.string().optional(),
  /** Ubicación del punto. Requerida para `GPS`; recomendada para validar el scan QR. */
  ubicacion: GeoJSONPointSchema.optional(),
  /**
   * Radio (m) de tolerancia para validar la geolocalización del teléfono al
   * marcar (QR/NFC) o para la geocerca (GPS). Default lo aplica acceso-api.
   */
  radioValidacionMetros: z.number().positive().optional(),
  descripcion: z.string().optional(),
  /** Soft-archive. Lo inyecta acceso-api (`true` al crear); no se edita directo. */
  activo: z.boolean().optional(),
  /** Permiso que lo creó. Lo inyecta acceso-api. */
  idPermisoCreador: z.string().optional(),
  // Populate
  cliente: z.any().optional(),
  complejo: z.any().optional(),
});

export const CreatePuntoControlSchema = PuntoControlSchema.omit({
  _id: true,
  fechaCreacion: true,
  codigo: true,
  activo: true,
  idPermisoCreador: true,
  cliente: true,
  complejo: true,
});

export const UpdatePuntoControlSchema = CreatePuntoControlSchema.partial();

export type IPuntoControl = z.infer<typeof PuntoControlSchema>;
export type ICreatePuntoControl = z.infer<typeof CreatePuntoControlSchema>;
export type IUpdatePuntoControl = z.infer<typeof UpdatePuntoControlSchema>;
