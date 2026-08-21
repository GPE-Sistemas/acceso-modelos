import { z } from "zod";

/**
 * IPaqueteFirmware — un archivo de firmware subido por un administrador, listo
 * para aplicarse a los dispositivos de su modelo.
 *
 * **Por qué es una entidad y no un adjunto del dispositivo**: el mismo archivo
 * sirve para todos los terminales del mismo modelo. Subirlo una vez y aplicarlo
 * N veces evita que cada operación arrastre 25–100 MB y, sobre todo, deja un
 * único lugar donde consta qué archivo es, de dónde salió y contra qué modelo se
 * puede usar.
 *
 * **El archivo entra por donde entra una persona.** El firmware de estos
 * terminales no es público: no hay descarga automática desde el fabricante ni la
 * va a haber. Alguien con credenciales de partner lo consigue y lo sube.
 *
 * Cloud-only (Tipo C): no se replica a los edges. El edge recibe una URL firmada
 * dentro del comando de actualización, no el catálogo.
 */

/**
 * Variante de fábrica del binario. Dos equipos con el mismo modelo pueden correr
 * plataformas distintas, y aplicar el binario de la variante equivocada es la
 * causa dominante de brick documentada.
 *
 * Todavía no sabemos leer la variante del propio dispositivo (no viene en el
 * `deviceInfo`), así que se declara al subir el paquete y se muestra al
 * confirmar la operación para que el operador la coteje.
 */
export const VarianteFirmwareSchema = z.enum(["STD", "NEU", "Desconocida"]);

/**
 * Qué hay realmente en el objeto subido.
 *
 * - `dav`: el binario tal cual, listo para enviar al terminal.
 * - `zip`: un contenedor del que hay que extraerlo. Es lo que entrega el
 *   fabricante, y se acepta tal cual por dos razones: la herramienta estándar de
 *   macOS no descomprime bien el anidado, y el contenedor pesa la mitad que el
 *   binario (188 MB contra 356 MB en el caso del K1T344 V4.47.0) — menos
 *   almacenamiento y menos tráfico hasta el edge, que es quien lo abre.
 *
 * El contenedor puede venir anidado (un ZIP con otro ZIP adentro más el release
 * note); el edge busca el `.dav` recursivamente.
 */
export const FormatoArchivoFirmwareSchema = z.enum(["dav", "zip"]);

export const PaqueteFirmwareSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),

  // Los paquetes son del proveedor, no de un complejo: el mismo archivo sirve
  // para el mismo modelo en cualquier cliente.
  idCliente: z.string().optional(),

  /**
   * Modelo exacto contra el que se puede aplicar, tal como lo reporta el
   * dispositivo en `IDispositivo.modelo`. **Es un gate duro**, no una etiqueta:
   * el pre-flight rechaza aplicar un paquete a un modelo distinto.
   */
  modelo: z.string(),
  marca: z.string().optional(),
  variante: VarianteFirmwareSchema.optional(),

  /**
   * Versión que se espera leer en el dispositivo DESPUÉS de actualizar. Es el
   * criterio de éxito de la operación: si tras el reinicio el equipo no reporta
   * esta versión, la actualización falló aunque el envío haya salido bien.
   */
  version: z.string(),
  build: z.string().optional(),

  /** objectName en el bucket privado (carpeta `firmware`). Nunca una URL. */
  archivo: z.string(),
  nombreArchivo: z.string().optional(),
  /**
   * Qué contiene el objeto. Lo detecta acceso-api leyendo los primeros bytes
   * del archivo subido, no la extensión del nombre: un archivo mal nombrado
   * abortaría la operación recién en el edge.
   */
  formatoArchivo: FormatoArchivoFirmwareSchema.optional(),
  /**
   * SHA-256 del objeto **tal como se subió** (el contenedor, si es ZIP). Lo
   * calcula acceso-api y el edge lo revalida sobre lo que descargó: verifica la
   * transferencia, que es lo que puede corromperse en el camino.
   */
  sha256: z.string().optional(),
  tamanioBytes: z.number().int().nonnegative().optional(),

  /**
   * De dónde salió el archivo y qué release notes lo acompañan. Sin esto el
   * catálogo envejece y nadie sabe qué es cada archivo ni por qué está ahí.
   */
  notas: z.string().optional(),

  /** Permite retirar un paquete sin borrarlo: las operaciones ya ejecutadas lo
   *  referencian y su traza tiene que seguir resolviendo. */
  habilitado: z.boolean().optional(),

  /** Permiso que lo subió. */
  idPermisoCarga: z.string().optional(),

  // Populate
  permisoCarga: z.any().optional(),
});

export const CreatePaqueteFirmwareSchema = PaqueteFirmwareSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  permisoCarga: true,
});

export const UpdatePaqueteFirmwareSchema =
  CreatePaqueteFirmwareSchema.partial();

export type IVarianteFirmware = z.infer<typeof VarianteFirmwareSchema>;
export type IFormatoArchivoFirmware = z.infer<
  typeof FormatoArchivoFirmwareSchema
>;
export type IPaqueteFirmware = z.infer<typeof PaqueteFirmwareSchema>;
export type ICreatePaqueteFirmware = z.infer<
  typeof CreatePaqueteFirmwareSchema
>;
export type IUpdatePaqueteFirmware = z.infer<
  typeof UpdatePaqueteFirmwareSchema
>;
