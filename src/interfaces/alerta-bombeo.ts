import { z } from "zod";

/**
 * IAlertaBombeo — un episodio de alerta de una estación de bombeo (D72,
 * acceso-doc-general doc 58 §6, F6). Se abre cuando la condición se cumple y
 * se cierra (`hasta`) cuando hay evidencia de que terminó; mientras tanto no
 * se repite. Mismos criterios que gas-api-rtu (`negocio/alertas.ts`), siempre
 * sobre lecturas frescas (`ok`): un valor que el RTU repite de su caché no
 * prueba nada, ni para abrir ni para cerrar.
 *
 * | Tipo            | Abre                                              | Cierra                              |
 * |-----------------|---------------------------------------------------|-------------------------------------|
 * | `NivelAlto`     | nivel ≥ `pozo.nivelAlarmaAltoM` N reportes seguidos | nivel < umbral − histéresis        |
 * | `NivelBajo`     | nivel ≤ `pozo.nivelAlarmaBajoM` N reportes seguidos | nivel > umbral + histéresis        |
 * | `FallaVariador` | señal `Falla` de la bomba en 1 o testigo abierto  | falla en 0 o testigo cerrado        |
 * | `SinRespuesta`  | N reportes seguidos sin ninguna lectura fresca del variador (con `idBomba`) o del sensor de nivel (sin) | una lectura fresca |
 * | `SinReportar`   | el vigía: la estación no reporta hace N minutos   | el próximo reporte                  |
 *
 * La escribe la ingesta de acceso-api (proceso `acceso-api-bombeo`); el push
 * `alerta_bombeo` lo manda la api principal al ver el alta. Cloud-only, sin TTL.
 */

export const TipoAlertaBombeoSchema = z.enum([
  "NivelAlto",
  "NivelBajo",
  "FallaVariador",
  "SinRespuesta",
  "SinReportar",
]);

export const AlertaBombeoSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  idEstacion: z.string(),
  tipo: TipoAlertaBombeoSchema,
  /** Condición estable: `nivel-alto`, `nivel-bajo`, `falla:<idBomba>`,
   *  `com:<idBomba>`, `com:pozo`, `sin-reportar`. Una sola abierta por clave. */
  clave: z.string(),
  idBomba: z.string().optional(),
  numeroBomba: z.number().int().optional(),
  /** ISO. Instante del reporte que la abrió (o el último reporte, si es `SinReportar`). */
  desde: z.string(),
  /** ISO. Ausente = abierta. */
  hasta: z.string().optional(),
  /** Nivel (m) que la abrió, o el código de falla del variador. */
  valor: z.number().optional(),
  /** Texto para el push y las vistas, en español. */
  mensaje: z.string(),
  /** ISO. Cuándo salió el push. Ausente = no se avisó (silencio de 30 min por
   *  una alerta igual reciente, o nadie para avisar). */
  notificadaEn: z.string().optional(),
  // Populate
  estacion: z.any().optional(),
});

export const CreateAlertaBombeoSchema = AlertaBombeoSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  estacion: true,
});

export const UpdateAlertaBombeoSchema = AlertaBombeoSchema.pick({
  hasta: true,
  notificadaEn: true,
  mensaje: true,
}).partial();

/** Resumen de una alerta abierta, guardado en la estación (`alertasActivas`)
 *  para que el listado la muestre sin otra consulta. */
export const AlertaActivaEstacionSchema = z.object({
  idAlerta: z.string().optional(),
  tipo: TipoAlertaBombeoSchema,
  clave: z.string(),
  numeroBomba: z.number().int().optional(),
  desde: z.string(),
  mensaje: z.string(),
});

export type ITipoAlertaBombeo = z.infer<typeof TipoAlertaBombeoSchema>;
export type IAlertaBombeo = z.infer<typeof AlertaBombeoSchema>;
export type ICreateAlertaBombeo = z.infer<typeof CreateAlertaBombeoSchema>;
export type IUpdateAlertaBombeo = z.infer<typeof UpdateAlertaBombeoSchema>;
export type IAlertaActivaEstacion = z.infer<typeof AlertaActivaEstacionSchema>;

/** Etiqueta corta de cada tipo, para chips y listados. */
export const ETIQUETA_TIPO_ALERTA_BOMBEO: Record<ITipoAlertaBombeo, string> = {
  NivelAlto: "Nivel alto",
  NivelBajo: "Nivel bajo",
  FallaVariador: "Falla de variador",
  SinRespuesta: "Sin respuesta",
  SinReportar: "Sin reportar",
};
