import { z } from "zod";
import { GeoJSONMultiPolygonSchema } from "../auxiliares/geojson";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { TipoDeteccionVideoSchema } from "./dispositivo-acceso";

/**
 * IZona — zona geográfica del complejo con semántica de detección (D49, Capa 3).
 * Formaliza la `IZonaComplejo` propuesta en doc 22, sumándole propósito + criterios.
 *
 * NO confundir con la región de detección DENTRO del frame (`IRegionFrame` de
 * Capa 2, `dispositivo-acceso.ts`): aquella acota dónde MIRA el detector en el
 * video; ésta da SIGNIFICADO a lo detectado según dónde ocurre geográficamente.
 *
 * Doc: acceso-doc-general/36-matriz-capacidades-dispositivos.md § Capa 3.
 */

/** Qué SIGNIFICA detectar en esta zona (D49, Capa 3). */
export const PropositoZonaSchema = z.enum([
  "Perimetro",
  "Acceso",
  "Amenity",
  "Registro",
]);

/**
 * Criticidad de la zona (doc 10/22). `Critica` deriva en evento de seguridad
 * (F3); `Registro` se queda en estadística.
 */
export const NivelCriticidadZonaSchema = z.enum(["Critica", "Registro"]);

/**
 * Acción del correlador del edge ante una detección que cae en la zona (D49,
 * Capa 3). El ruteo concreto vive en el correlador (acceso-edge):
 * - `Alerta` → `IEventoSeguridad` (F3; en F2 queda como hook/TODO).
 * - `RegistrarIngreso` → `IIngresoEgreso` (zona de Acceso sin punto de acceso formal).
 * - `ConfirmarOcupacion` → hook ocupación/turnos (Amenity, F3).
 * - `SoloEstadistica` → la detección persiste con TTL, sin entidad derivada.
 */
export const AccionZonaSchema = z.enum([
  "Alerta",
  "RegistrarIngreso",
  "ConfirmarOcupacion",
  "SoloEstadistica",
]);

/**
 * Liga un tipo de detección de video a la acción a tomar en la zona. Reusa el
 * `TipoDeteccionVideoSchema` de Capa 2 (persona/vehiculo/patente/rostro).
 */
export const CriterioZonaSchema = z.object({
  tipoDeteccion: TipoDeteccionVideoSchema,
  accion: AccionZonaSchema,
});

export const ZonaSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  // Scope tenant (EntidadScope)
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  /** Zona dentro de una UF (ej. cancha de tenis). Opcional. */
  idUnidadFuncional: z.string().optional(),
  nombre: z.string(),
  habilitado: z.boolean().optional(),
  proposito: PropositoZonaSchema,
  nivelCriticidad: NivelCriticidadZonaSchema,
  /** Polígono geográfico (lat/lng). Mismo campo que IComplejo / IUnidadFuncional. */
  ubicacion: GeoJSONMultiPolygonSchema.optional(),
  /** Mapeo tipoDeteccion → acción del correlador. */
  criterios: z.array(CriterioZonaSchema).optional(),
  /** Afinidad de edge preferido (propuesta doc 22). */
  idEdgeAppliancePreferido: z.string().optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
});

export const CreateZonaSchema = ZonaSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
});

export const UpdateZonaSchema = CreateZonaSchema.partial();

export type IPropositoZona = z.infer<typeof PropositoZonaSchema>;
export type INivelCriticidadZona = z.infer<typeof NivelCriticidadZonaSchema>;
export type IAccionZona = z.infer<typeof AccionZonaSchema>;
export type ICriterioZona = z.infer<typeof CriterioZonaSchema>;
export type IZona = z.infer<typeof ZonaSchema>;
export type ICreateZona = z.infer<typeof CreateZonaSchema>;
export type IUpdateZona = z.infer<typeof UpdateZonaSchema>;
