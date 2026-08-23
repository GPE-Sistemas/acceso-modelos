import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { ConfigOperacionDispositivoSchema } from "./config-operacion-dispositivo";

/**
 * IPerfilDispositivo — configuración de operación con nombre, reutilizable (D51).
 *
 * En vez de configurar terminal por terminal, se define el perfil una vez y se
 * asigna a los dispositivos que correspondan. Un dispositivo en modo `Perfil`
 * toma su deseado ENTERO de acá (ver `IModoConfigDispositivo`: los modos son
 * excluyentes, así que el perfil no se mezcla con configuración propia del
 * equipo), y lo que el perfil no declara **no se gestiona** en ninguno de sus
 * equipos.
 *
 * Que sea exclusivo es lo que hace que el perfil sirva: cambiar el perfil mueve
 * a todos sus terminales. Cuando las dos capas se sumaban, un equipo con
 * overrides encima seguía "asignado" al perfil pero ya no lo seguía.
 *
 * A diferencia de `IPerfilCamara` (catálogo curado por GPE, master data Tipo B),
 * este perfil lo crea el integrador/administrador: es del cliente, opcionalmente
 * acotado a un complejo. **Cloud-only (Tipo C)** — no se replica al edge: el
 * cloud le manda al edge el deseado ya resuelto en el dispositivo, así el edge no
 * necesita el catálogo ni hay una entidad más en el sync bilateral.
 *
 * Doc: acceso-doc-general/40-configuracion-dispositivos.md
 */
export const PerfilDispositivoSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  /**
   * Última vez que cambió el CONTENIDO del perfil. Es el disparador de la
   * re-reconciliación de todos los dispositivos que lo tienen asignado.
   */
  fechaActualizacion: z.string().optional(),

  // Scope tenant (EntidadScope). Sin `idComplejo` = perfil de todo el cliente.
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),

  // Requerido a nivel Mongoose (acceso-datos) + validación acceso-api; opcional
  // en el tipo por la convención del repo (lean() / Exactly<>).
  /** Nombre visible. Ej. "Terminal facial - barrio con portería". */
  nombre: z.string().optional(),
  habilitado: z.boolean().optional(),

  // --- A qué dispositivos aplica ---
  // Filtros de elegibilidad, no de asignación: la asignación es explícita
  // (`IDispositivo.idPerfilDispositivo`). Sirven para que la UI ofrezca sólo
  // perfiles compatibles y para no aplicar un perfil de terminal a una cámara.
  /** Ej. "Hikvision". Vacío = cualquier marca. */
  marca: z.string().optional(),
  /** Ej. "DS-K1T344MBWX-E1". Vacío = cualquier modelo de la marca. */
  modelo: z.string().optional(),
  // NO se declara `formFactor` acá: `marca` + `modelo` ya acotan la elegibilidad,
  // y reusar `FormFactorDispositivoSchema` desde `dispositivo.ts` armaría un ciclo
  // de imports en runtime (dispositivo.ts importa este schema para el populate).

  /**
   * Los knobs que este perfil gobierna. Sparse: lo ausente no se gestiona.
   * Ver `config-operacion-dispositivo.ts`.
   */
  config: ConfigOperacionDispositivoSchema.optional(),

  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
});

export const CreatePerfilDispositivoSchema = PerfilDispositivoSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
});

export const UpdatePerfilDispositivoSchema =
  CreatePerfilDispositivoSchema.partial();

export type IPerfilDispositivo = z.infer<typeof PerfilDispositivoSchema>;
export type ICreatePerfilDispositivo = z.infer<
  typeof CreatePerfilDispositivoSchema
>;
export type IUpdatePerfilDispositivo = z.infer<
  typeof UpdatePerfilDispositivoSchema
>;
