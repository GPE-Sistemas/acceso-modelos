import { z } from "zod";

/**
 * Por qué se cerró una parada (D65, doc 52):
 * - `OtraParada`: el visitante marcó otro lote (relevo).
 * - `TermineAca`: tocó "Terminé acá" sin ir a otro lote.
 * - `Egreso`: salió del complejo con la parada abierta.
 * - `Vencimiento`: el recorrido se cerró sin egreso registrado (cron de 24 h o
 *   un ingreso nuevo del mismo permiso). Sin push.
 */
export const MotivoSalidaParadaSchema = z.enum([
  "OtraParada",
  "TermineAca",
  "Egreso",
  "Vencimiento",
]);

export const EstadoRecorridoVisitanteSchema = z.enum(["Activo", "Cerrado"]);

/**
 * Una estadía declarada en una UF. Es lo que dice el visitante, no un
 * movimiento verificado por la garita: la hoja de visita lo muestra como
 * "declarado".
 */
export const ParadaRecorridoSchema = z.object({
  idEventoVisita: z.string(),
  /** `idUnidadFuncionalDestino ?? idUnidadFuncional` del evento. */
  idUnidadFuncional: z.string(),
  /** ISO. Cuándo marcó "Voy a este lote". */
  llegada: z.string(),
  /** ISO. Ausente = es la parada abierta. */
  salida: z.string().optional(),
  motivoSalida: MotivoSalidaParadaSchema.optional(),
  /**
   * El lote no estaba entre los eventos vinculados al ingreso (lo marcó ya
   * adentro, decisión 7). Tiene push y aparece en la hoja, pero no tiene
   * vínculo de garita: no hay camino cloud → edge para un vínculo.
   */
  fueraDeCandidatos: z.boolean().optional(),
});

/**
 * Recorrido de un visitante con credencial dentro del complejo (D65, doc 52):
 * una estadía en el complejo (del ingreso por cara al egreso) de un visitante
 * que va a dos o más UF. Lo crea acceso-api al recibir un ingreso con
 * `recorridoVisitante: true`.
 *
 * Los movimientos de garita y sus vínculos NO cambian: este registro solo
 * guarda las paradas declaradas y define quién recibe cada push.
 *
 * CLOUD-ONLY: no replica al edge. A lo sumo un `Activo` por permiso.
 */
export const RecorridoVisitanteSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  /** Permiso de categoría `Visitante`. */
  idPermiso: z.string().optional(),
  /** `IIngresoEgreso` que abrió el recorrido. Único. */
  idIngreso: z.string().optional(),
  /** `IIngresoEgreso` que lo cerró. Ausente si se cerró por `Vencimiento`. */
  idEgreso: z.string().optional(),
  estado: EstadoRecorridoVisitanteSchema.optional(),
  /** Eventos a los que el edge vinculó el ingreso. */
  idsEventosCandidatos: z.array(z.string()).optional(),
  paradas: z.array(ParadaRecorridoSchema).optional(),
});

/**
 * Lo crea y lo modifica solo acceso-api (subscriber del ingreso y endpoints
 * del portal); el cliente no escribe la entidad directamente.
 */
export const CreateRecorridoVisitanteSchema = RecorridoVisitanteSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
});

export const UpdateRecorridoVisitanteSchema =
  CreateRecorridoVisitanteSchema.partial();

export type IMotivoSalidaParada = z.infer<typeof MotivoSalidaParadaSchema>;
export type IEstadoRecorridoVisitante = z.infer<
  typeof EstadoRecorridoVisitanteSchema
>;
export type IParadaRecorrido = z.infer<typeof ParadaRecorridoSchema>;
export type IRecorridoVisitante = z.infer<typeof RecorridoVisitanteSchema>;
export type ICreateRecorridoVisitante = z.infer<
  typeof CreateRecorridoVisitanteSchema
>;
export type IUpdateRecorridoVisitante = z.infer<
  typeof UpdateRecorridoVisitanteSchema
>;
