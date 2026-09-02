import { z } from "zod";
import { CategoriaIngresoEgresoSchema } from "./ingreso-egreso";

/**
 * Estadía = intervalo de permanencia **por sujeto**, no por movimiento
 * (D58, `acceso-doc-general/45-estadias-y-presencia.md`).
 *
 * Tres visitantes que entran juntos y salen en dos tandas son 1 ingreso, 2
 * egresos y **3 estadías**: el movimiento es multi-sujeto por diseño
 * (`idsVisitantes[]`, `idsPermisosAcompanantes[]`), así que el par no se puede
 * expresar con un puntero movimiento → movimiento.
 *
 * **No es una entidad.** Se calcula plegando el stream de `IIngresoEgreso`, y
 * este archivo declara la forma de esa respuesta para que cloud (`acceso-api`,
 * Mongo) y edge (`acceso-edge`, Postgres) devuelvan lo mismo. La entidad
 * `IEstadia` persistida (con `estado` propio y cierre por política) es el
 * modelo objetivo de la fase 3 y se materializa recién cuando aparezca un
 * consumidor que necesite un ancla referenciable — tracking LoRaWAN (D55),
 * correlación ANPR ingreso↔egreso (D56) o reportes de permanencia. Hasta
 * entonces el fold, con esta forma, alcanza.
 *
 * Los anónimos (`IIngresoEgreso.visitantesAnonimos`) **no** generan estadía: no
 * hay a quién parear. Siguen contados en el movimiento.
 */

export const TipoSujetoEstadiaSchema = z.enum(["Permiso", "Visitante"]);

export const SujetoEstadiaSchema = z.object({
  tipo: TipoSujetoEstadiaSchema,
  /** `idPermiso` o `idVisitante` según `tipo`. */
  id: z.string(),
});

export const EstadiaCalculadaSchema = z.object({
  sujeto: SujetoEstadiaSchema,

  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  /** Destino declarado en el movimiento de apertura. */
  idUnidadFuncional: z.string().optional(),
  categoria: CategoriaIngresoEgresoSchema.optional(),

  /**
   * `true` = el sujeto está adentro (no hay egreso que cierre la apertura).
   *
   * Sin materializar no existe el tercer estado `Vencida`: una estadía sin
   * egreso registrado queda abierta indefinidamente porque el fold no tiene
   * dónde escribir "la cierro por regla". Ese cierre por política llega con la
   * entidad (fase 3) y con `IComplejo.config.presencia.cierreAutomaticoHoras`.
   */
  abierta: z.boolean(),
  fechaApertura: z.string(),
  fechaCierre: z.string().optional(),

  /** Movimiento que abrió la estadía. Es su id estable. */
  idIngreso: z.string(),
  /** Movimiento que la cerró. Ausente ⇔ `abierta`. */
  idEgreso: z.string().optional(),

  /**
   * Autorización que la habilitó: la **referencia**, no la reemplaza. Un
   * `IEventoVisita` recurrente es una autorización con N estadías (jardinero
   * lunes y jueves durante tres meses = 1 evento, ~24 estadías), y un
   * propietario o un prestador con credencial no tiene evento ninguno.
   */
  idEventoVisita: z.string().optional(),
  idPermiso: z.string().optional(),

  /**
   * Movimientos populados — `IIngresoEgreso`. Van como `z.any()` para no
   * inflar la inferencia global del barrel (mismo criterio que
   * `vinculo-evento-ingreso.ts`); los consumidores castean ad-hoc.
   *
   * El de apertura trae lo que el padrón necesita mostrar sin una segunda
   * vuelta: hora, acceso, patente, observaciones e imágenes. Nada de eso se
   * denormaliza acá — el contenido vive en el movimiento y la estadía es un
   * índice.
   */
  ingreso: z.any().optional(),
  egreso: z.any().optional(),
});

/** Qué estadías devuelve el fold. Default `Abiertas` — el padrón del panel. */
export const EstadoPresenciaSchema = z.enum(["Abiertas", "Todas"]);

/**
 * Filtros del fold de presencia (`GET /presencia`). Lo comparten cloud y edge
 * para que las reglas no se escriban dos veces.
 *
 * Los valores llegan por query string: cada implementación arma su DTO con
 * coerción sobre este schema (`categorias` como CSV, `limit` numérico).
 */
export const PresenciaQuerySchema = z.object({
  idComplejo: z.string().optional(),
  /**
   * Acota a la autorización — es lo que consume el diálogo de ingreso/egreso de
   * visita para saber quién está adentro de ese evento, en vez de plegar los
   * vínculos en el front.
   */
  idEventoVisita: z.string().optional(),
  categorias: z.array(CategoriaIngresoEgresoSchema).optional(),
  /**
   * Piso de la ventana. Sin materializar, el fold se acota o termina siendo un
   * scan del histórico: ningún motor indexa por visitante (Mongo no indexa
   * `idsVisitantes`; en el edge `ids_visitantes` es `jsonb` sin GIN sobre una
   * hypertable). Default `VENTANA_PRESENCIA_HORAS_DEFAULT`.
   */
  desde: z.string().optional(),
  estado: EstadoPresenciaSchema.optional(),
  limit: z.number().int().positive().max(1000).optional(),
});

/**
 * Ventana por defecto del fold, en horas. **Provisorio**: el valor definitivo
 * se elige con volumen real de producción (ver `PENDIENTES.md` § Estadías y
 * presencia). Lo que quede afuera de la ventana no aparece en el padrón.
 */
export const VENTANA_PRESENCIA_HORAS_DEFAULT = 48;

export type ITipoSujetoEstadia = z.infer<typeof TipoSujetoEstadiaSchema>;
export type ISujetoEstadia = z.infer<typeof SujetoEstadiaSchema>;
export type IEstadiaCalculada = z.infer<typeof EstadiaCalculadaSchema>;
export type IEstadoPresencia = z.infer<typeof EstadoPresenciaSchema>;
export type IPresenciaQuery = z.infer<typeof PresenciaQuerySchema>;
