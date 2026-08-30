import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { RolSchema } from "./rol";
import { UnidadFuncionalSchema } from "./unidad-funcional";
import { UsuarioSchema } from "./usuario";

export const ConfigPermisoSchema = z.record(z.string(), z.any());

export const NivelPermisoSchema = z.enum([
  "Cliente",
  "Complejo",
  "Unidad Funcional",
]);

/**
 * Categoría del portador del permiso. Independiente del nivel y de los roles.
 * Defaults aplicados por acceso-api al crear:
 * - nivel 'Unidad Funcional' → 'Propietario'
 * - nivel 'Cliente'          → 'Administración'
 * - nivel 'Complejo'         → requerido (Administración | Guardia | Prestador de Servicio | Mantenimiento)
 */
export const CategoriaPermisoSchema = z.enum([
  "Propietario",
  "Administración",
  "Guardia",
  "Prestador de Servicio",
  "Mantenimiento",
]);

export type IConfigPermiso = z.infer<typeof ConfigPermisoSchema>;
export type INivelPermiso = z.infer<typeof NivelPermisoSchema>;
export type ICategoriaPermiso = z.infer<typeof CategoriaPermisoSchema>;

/**
 * Franja horaria en la que un integrante con `politicaEgreso.requiereAutorizacion`
 * puede egresar sin pedir autorización (D57). Mismo vocabulario que la
 * recurrencia de eventos de visita y turnos.
 */
export const FranjaEgresoLibreSchema = z.object({
  /** 0..6 (0 = domingo). Los 7 equivalen a "todos los días". */
  diasSemana: z.array(z.number().int().min(0).max(6)),
  /** 'HH:mm'. Si `horaHasta` < `horaDesde` se interpreta cruzando medianoche. */
  horaDesde: z.string(),
  horaHasta: z.string(),
  /** Vigencia de la franja (ej. ciclo lectivo). Ausente = sin límite. */
  desde: z.string().optional(),
  hasta: z.string().optional(),
  /** Auditoría — los inyecta acceso-api con el permiso que otorgó la excepción. */
  otorgadaPorIdPermiso: z.string().optional(),
  fechaOtorgamiento: z.string().optional(),
});

/**
 * Excepción abierta: el integrante egresa siempre sin pedir autorización (D57).
 * Convive con `franjasLibres` — se evalúa primero.
 */
export const AutorizacionEgresoPermanenteSchema = z.object({
  /** Vigencia de la excepción. Ausente = sin límite. */
  desde: z.string().optional(),
  hasta: z.string().optional(),
  otorgadaPorIdPermiso: z.string().optional(),
  fechaOtorgamiento: z.string().optional(),
});

/**
 * Política de egreso del integrante de la UF (D57, doc 44). Ausente = integrante
 * sin restricción: es la marca de "menor" del sistema.
 *
 * La marca vive acá y no en `IUsuario`, ni en la credencial, ni en el
 * dispositivo: es una condición de la pertenencia a la UF, no de la persona ni
 * del fierro. `IUsuario.fechaNacimiento` sirve para que la UI SUGIERA la marca;
 * nunca para decidirla — el control de acceso no cambia solo el día del
 * cumpleaños.
 *
 * Deliberadamente NO se agregó un valor a `CategoriaPermisoSchema`: ese enum se
 * copia a `IIngresoEgreso.categoria`, gatea diez acciones de rol
 * `Crear/Editar permisos <categoría>` y filtra el panel del guardia; un valor
 * nuevo haría que Mongoose rechace documentos productivos enteros. El rol
 * `Menor UF` es un dato (como `Responsable UF`), no un enum.
 *
 * Con `requiereAutorizacion` y sin excepción vigente, el egreso queda PENDIENTE
 * aunque el `IDispositivoAcceso` esté en `Aprobación Automática`, y el sistema no
 * ordena la apertura. Orden de evaluación en el edge: sin marca → permanente →
 * franja → voucher (`IAutorizacionEgresoMenor`) → acompañado → pendiente.
 */
export const PoliticaEgresoSchema = z.object({
  requiereAutorizacion: z.boolean(),
  /** "Sale siempre". `null`/ausente = sin excepción abierta. */
  autorizacionPermanente: AutorizacionEgresoPermanenteSchema.nullish(),
  /** "Sale solo 7-8 y 13-14, lunes a viernes". Vacío = sin franjas. */
  franjasLibres: z.array(FranjaEgresoLibreSchema).optional(),
});

export type IFranjaEgresoLibre = z.infer<typeof FranjaEgresoLibreSchema>;
export type IAutorizacionEgresoPermanente = z.infer<
  typeof AutorizacionEgresoPermanenteSchema
>;
export type IPoliticaEgreso = z.infer<typeof PoliticaEgresoSchema>;

const PermisoBaseFields = {
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  habilitado: z.boolean().optional(),
  fechaExpiracion: z.string().optional(),
  username: z.string().optional(),
  categoriaPermiso: CategoriaPermisoSchema.optional(),
  idsRoles: z.array(z.string()).optional(),
  config: ConfigPermisoSchema.optional(),
  // Virtuals
  usuario: UsuarioSchema.optional(),
  roles: z.array(RolSchema).optional(),
};

export const PermisoClienteSchema = z.object({
  ...PermisoBaseFields,
  nivel: z.literal("Cliente"),
  idCliente: z.string(),
  // Virtual
  cliente: ClienteSchema.optional(),
});

export const PermisoComplejoSchema = z.object({
  ...PermisoBaseFields,
  nivel: z.literal("Complejo"),
  idCliente: z.string(),
  idComplejo: z.string(),
  /**
   * Solo poblado cuando categoriaPermiso === 'Prestador de Servicio'.
   * Ausente o vacío = prestador general del complejo (sin restricción de UF).
   * Cada id debe apuntar a una UF del idComplejo con tipo='Común' (validado en acceso-api).
   */
  idsUnidadesFuncionales: z.array(z.string()).optional(),
  // Virtuals
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  // unidadesFuncionales (populate virtual) declarado solo en Mongoose para evitar
  // TS7056 por profundidad de inferencia en la cadena de populates (IPermiso ⊂
  // IIngresoEgreso ⊂ IVinculoEventoIngreso). Los consumers que lo necesiten lo
  // tratan como `(permiso as any).unidadesFuncionales` o tipan ad-hoc.
});

export const PermisoUnidadFuncionalSchema = z.object({
  ...PermisoBaseFields,
  nivel: z.literal("Unidad Funcional"),
  idCliente: z.string(),
  idComplejo: z.string(),
  idUnidadFuncional: z.string(),
  /**
   * Índice del integrante dentro de la UF (1–99). Lo asigna acceso-api al crear
   * el permiso (hueco más bajo libre de la UF, reutilizable, estable una vez
   * asignado — no se renumera al borrar otro). Compone el código PIN de teclado:
   * `codigo = pad(UF.numero, 4) + pad(identificador, 2)` (6 díg), que es a la vez
   * el employeeNo y el password enrolado en el terminal. System-managed: omitido
   * de Create/Update.
   */
  identificador: z.number().int().min(1).max(99).optional(),
  /**
   * Inicio de vigencia del permiso. Permite alta diferida o retroactiva.
   * Si no se setea al crear, acceso-api lo iguala a fechaCreacion.
   * Inmutable una vez creado.
   */
  fechaInicioVigencia: z.string().optional(),
  /**
   * Fin de vigencia. null/ausente = vigente.
   * Una vez seteado el permiso queda inmutable (no se reactiva).
   * Setear solo vía PUT /permisos/:id/desactivar.
   */
  fechaFinVigencia: z.string().optional(),
  /**
   * Política de egreso del integrante (D57, doc 44). Ausente = sin restricción.
   * La edita el responsable de la UF (acción `Movimientos - Configurar egreso de
   * menores`) vía endpoint acotado, sin darle el ABM completo de permisos.
   */
  politicaEgreso: PoliticaEgresoSchema.optional(),
  // Virtuals
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  unidadFuncional: UnidadFuncionalSchema.optional(),
});

export const PermisoSchema = z.discriminatedUnion("nivel", [
  PermisoClienteSchema,
  PermisoComplejoSchema,
  PermisoUnidadFuncionalSchema,
]);

export const CreatePermisoSchema = z.discriminatedUnion("nivel", [
  PermisoClienteSchema
    .omit({
      _id: true,
      fechaCreacion: true,
      usuario: true,
      roles: true,
      cliente: true,
    })
    .extend({ password: z.string().optional() }),
  PermisoComplejoSchema
    .omit({
      _id: true,
      fechaCreacion: true,
      usuario: true,
      roles: true,
      cliente: true,
      complejo: true,
    })
    .extend({ password: z.string().optional() }),
  PermisoUnidadFuncionalSchema
    .omit({
      _id: true,
      fechaCreacion: true,
      usuario: true,
      roles: true,
      cliente: true,
      complejo: true,
      unidadFuncional: true,
      identificador: true,
      fechaFinVigencia: true,
    })
    .extend({ password: z.string().optional() }),
]);

export const UpdatePermisoSchema = z.discriminatedUnion("nivel", [
  PermisoClienteSchema
    .omit({
      _id: true,
      fechaCreacion: true,
      usuario: true,
      roles: true,
      cliente: true,
    })
    .partial()
    .extend({ nivel: z.literal("Cliente") }),
  PermisoComplejoSchema
    .omit({
      _id: true,
      fechaCreacion: true,
      usuario: true,
      roles: true,
      cliente: true,
      complejo: true,
    })
    .partial()
    .extend({ nivel: z.literal("Complejo") }),
  PermisoUnidadFuncionalSchema
    .omit({
      _id: true,
      fechaCreacion: true,
      usuario: true,
      roles: true,
      cliente: true,
      complejo: true,
      unidadFuncional: true,
      identificador: true,
      fechaInicioVigencia: true,
      fechaFinVigencia: true,
    })
    .partial()
    .extend({ nivel: z.literal("Unidad Funcional") }),
]);

export type IPermisoCliente = z.infer<typeof PermisoClienteSchema>;
export type IPermisoComplejo = z.infer<typeof PermisoComplejoSchema>;
export type IPermisoUnidadFuncional = z.infer<
  typeof PermisoUnidadFuncionalSchema
>;
export type IPermiso = z.infer<typeof PermisoSchema>;
export type ICreatePermiso = z.infer<typeof CreatePermisoSchema>;
export type IUpdatePermiso = z.infer<typeof UpdatePermisoSchema>;
