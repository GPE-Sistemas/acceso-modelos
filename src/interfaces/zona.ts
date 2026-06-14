import { z } from "zod";
import { GeoJSONMultiPolygonSchema } from "../auxiliares/geojson";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";

/**
 * IZona — zona geográfica del complejo con semántica de detección (D49, Capa 3).
 * Formaliza la `IZonaComplejo` propuesta en doc 22, sumándole propósito.
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
 * Capa 3). NO la define el usuario por tipo — se **deriva** de `proposito` +
 * `nivelCriticidad` (mapeo canónico que implementa el correlador en F3):
 * - Perimetro + Critica  → `Alerta` (→ `IEventoSeguridad`).
 * - Perimetro + Registro → `SoloEstadistica`.
 * - Acceso               → `RegistrarIngreso` (→ `IIngresoEgreso`).
 * - Amenity              → `ConfirmarOcupacion` (hook ocupación/turnos).
 * - Registro             → `SoloEstadistica` (persiste con TTL, sin entidad).
 *
 * Los tipos a detectar viven SOLO en el canal (Capa 2,
 * `IDispositivoZona.deteccion.tipos`); la zona aporta el significado, no el
 * "qué tipos". Vocabulario de salida del correlador.
 */
export const AccionZonaSchema = z.enum([
  "Alerta",
  "RegistrarIngreso",
  "ConfirmarOcupacion",
  "SoloEstadistica",
]);

export const ZonaSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  // Scope tenant (EntidadScope)
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  /** Zona dentro de una UF (ej. cancha de tenis). Opcional. */
  idUnidadFuncional: z.string().optional(),
  // Requeridos a nivel Mongoose (acceso-datos) + validación acceso-api, opcionales
  // en el tipo por la convención del repo (lean()/Exactly<> exigen todo opcional).
  nombre: z.string().optional(),
  habilitado: z.boolean().optional(),
  proposito: PropositoZonaSchema.optional(),
  nivelCriticidad: NivelCriticidadZonaSchema.optional(),
  /** Polígono geográfico (lat/lng). Mismo campo que IComplejo / IUnidadFuncional. */
  ubicacion: GeoJSONMultiPolygonSchema.optional(),
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
export type IZona = z.infer<typeof ZonaSchema>;
export type ICreateZona = z.infer<typeof CreateZonaSchema>;
export type IUpdateZona = z.infer<typeof UpdateZonaSchema>;
