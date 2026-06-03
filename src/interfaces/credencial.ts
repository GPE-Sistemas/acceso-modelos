import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { UnidadFuncionalSchema } from "./unidad-funcional";
import { PermisoSchema } from "./permiso";

/**
 * Credencial de acceso del propietario — capa LÓGICA (spec
 * acceso-doc-general/32-credenciales-acceso.md §1, §3.1).
 *
 * Es lo que la persona POSEE como factor de acceso, independiente del hardware:
 * lo que el propietario gestiona en la app ("Mis credenciales → Agregar
 * credencial"). Se materializa (vía edge) en N devices compatibles, cada uno con
 * su `ICredencialDispositivo` (capa física). Ver `credencial-dispositivo.ts`.
 *
 * Modelo generalizado multi-modalidad desde el día uno (decisión cerrada
 * 2026-06-03); MVP habilita solo `Facial`.
 */

/** Tipo de credencial. MVP: solo `Facial`. El resto queda en el enum como
 *  "próximamente" (matriz de capacidades, spec §2). */
export const TipoCredencialSchema = z.enum([
  "Facial",
  "PIN",
  "Tarjeta",
  "DNI",
  "Huella",
  "Palma",
  "QR",
  "Patente",
]);

/** Ciclo de vida unificado de la credencial lógica (spec §9). */
export const EstadoCredencialSchema = z.enum([
  "Pendiente", // creada, sin captura aún
  "Capturada", // dato cargado (foto/pin/...), validado client-side
  "Enrolando", // el edge está materializándola en los devices
  "Activa", // enrolada y verificada en al menos un device
  "Fallida", // falló la captura/validación/enrolamiento
  "Revocada", // dada de baja → borrado en device(s)
]);

/** Origen de la captura del dato de la credencial (spec §3.1). */
export const OrigenCapturaCredencialSchema = z.enum([
  "App", // selfie calibrada desde la app Coliving
  "Presencial", // capturada por guardia/admin (huella/palma)
  "Importada", // migrada de otro sistema
]);

/**
 * Datos de la credencial, discriminados semánticamente por `tipo`. Cada tipo usa
 * su propio campo; la validación de "qué campo es obligatorio para qué tipo"
 * vive cloud-side en acceso-api (regla custom, no exportable a JSON Schema).
 * MVP: solo `fotoCredencial` (Facial).
 */
export const DatosCredencialSchema = z.object({
  /** Facial → objectName del JPEG en GCS. Bucket PRIVADO (PII biométrica),
   *  carpeta dedicada. NO reutiliza el avatar `IUsuario.datosPersonales.foto`
   *  (spec §3.4). */
  fotoCredencial: z.string().optional(),
  /** PIN → número de teclado (futuro, spec §2). */
  pin: z.string().optional(),
  /** Tarjeta → número y tipo de tarjeta RFID (futuro, spec §2). */
  cardNo: z.string().optional(),
  cardType: z.string().optional(),
});

export const CredencialSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  // Scope tenant
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  idUnidadFuncional: z.string().optional(),
  // Dueño de la credencial (IPermiso, categoriaPermiso=Propietario)
  idPermiso: z.string().optional(),
  tipo: TipoCredencialSchema.optional(),
  estado: EstadoCredencialSchema.optional(),
  origenCaptura: OrigenCapturaCredencialSchema.optional(),
  datos: DatosCredencialSchema.optional(),
  // Vigencia propia (opcional; default = vigencia del permiso, resuelto cloud-side)
  vigenciaDesde: z.string().optional(),
  vigenciaHasta: z.string().optional(),
  /** Mensaje legible del último fallo de captura/validación/enrolamiento. */
  ultimoError: z.string().optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  unidadFuncional: UnidadFuncionalSchema.optional(),
  permiso: PermisoSchema.optional(),
});

export const CreateCredencialSchema = CredencialSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  cliente: true,
  complejo: true,
  unidadFuncional: true,
  permiso: true,
});

export const UpdateCredencialSchema = CreateCredencialSchema.partial();

export type ITipoCredencial = z.infer<typeof TipoCredencialSchema>;
export type IEstadoCredencial = z.infer<typeof EstadoCredencialSchema>;
export type IOrigenCapturaCredencial = z.infer<
  typeof OrigenCapturaCredencialSchema
>;
export type IDatosCredencial = z.infer<typeof DatosCredencialSchema>;
export type ICredencial = z.infer<typeof CredencialSchema>;
export type ICreateCredencial = z.infer<typeof CreateCredencialSchema>;
export type IUpdateCredencial = z.infer<typeof UpdateCredencialSchema>;
