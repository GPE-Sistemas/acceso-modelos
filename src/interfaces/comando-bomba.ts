import { z } from "zod";

/**
 * IComandoBomba — una orden de telecontrol a una bomba de una estación de
 * bombeo (D72, acceso-doc-general doc 58 §7, F7). Va por RS-485: Modbus
 * transparente del UC300 (`uc/<SN>/ucp/14/modbus/update`) al variador.
 *
 * Ciclo de vida:
 *
 * | Estado       | Quién / cuándo                                                          |
 * |--------------|-------------------------------------------------------------------------|
 * | `Pendiente`  | acceso-api lo crea (validado, con la trama armada)                       |
 * | `Enviado`    | el worker de bombeo lo publicó al broker (QoS 0, una sola vez)           |
 * | `Aceptado`   | el UC300 respondió `accepted`: el variador contestó, NO que ejecutó      |
 * | `Confirmado` | una lectura fresca posterior trae `confirmacion.clave` en el valor esperado |
 * | `Rechazado`  | el UC300 respondió `rejected`: el variador no contestó                   |
 * | `Expirado`   | sin confirmación en `confirmacion.timeoutSegundos`                       |
 * | `Fallido`    | no se pudo publicar (RTU Offline, broker caído, worker sin tomarlo)      |
 *
 * Uno solo en curso por estación (`enCurso`, índice único parcial en
 * acceso-datos). Cloud-only, sin TTL: es la auditoría del telecontrol.
 */

export const EstadoComandoBombaSchema = z.enum([
  "Pendiente",
  "Enviado",
  "Aceptado",
  "Confirmado",
  "Rechazado",
  "Expirado",
  "Fallido",
]);

/** Estados que bloquean otro comando en la misma estación. */
export const ESTADOS_COMANDO_EN_CURSO = ["Pendiente", "Enviado", "Aceptado"] as const;

export const ConfirmacionComandoBombaSchema = z.object({
  /** Señal completa de la estación (`b1.marcha`). */
  clave: z.string(),
  valorEsperado: z.union([z.boolean(), z.number()]),
  timeoutSegundos: z.number().int().positive(),
});

export const SolicitanteComandoBombaSchema = z.object({
  idPermiso: z.string().optional(),
  idUsuario: z.string().optional(),
  /** Snapshot del nombre al ordenar. */
  nombre: z.string().optional(),
});

export const ComandoBombaSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  idEstacion: z.string(),
  idBomba: z.string(),
  numeroBomba: z.number().int(),
  /** `clave` del comando en la plantilla (`arrancar`, `parar`, …). */
  clave: z.string(),
  /** Snapshot del nombre del comando. */
  nombre: z.string(),
  critico: z.boolean().optional(),
  /** Por qué se ordenó. Obligatorio. */
  motivo: z.string().min(1),
  solicitadoPor: SolicitanteComandoBombaSchema.optional(),
  estado: EstadoComandoBombaSchema,
  /** true mientras el estado es Pendiente, Enviado o Aceptado. */
  enCurso: z.boolean(),
  /** SN del RTU tal como aparece en los tópicos. */
  sn: z.string(),
  /** Trama Modbus RTU con CRC, en hex: lo que se publica. */
  trama: z.string(),
  confirmacion: ConfirmacionComandoBombaSchema,
  /** ISO. Publicado al broker. */
  enviadoEn: z.string().nullish(),
  /** ISO. Llegó `accepted` o `rejected`. */
  respuestaEn: z.string().nullish(),
  /** ISO. Fin del ciclo (Confirmado, Rechazado, Expirado o Fallido). */
  finalizadoEn: z.string().nullish(),
  /** Valor de la señal de confirmación en la última lectura fresca vista. */
  valorObservado: z.union([z.boolean(), z.number()]).nullish(),
  /** Por qué no se confirmó, en español. */
  error: z.string().nullish(),
  // Populate
  estacion: z.any().optional(),
});

export const CreateComandoBombaSchema = ComandoBombaSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  estacion: true,
});

export const UpdateComandoBombaSchema = ComandoBombaSchema.pick({
  estado: true,
  enCurso: true,
  enviadoEn: true,
  respuestaEn: true,
  finalizadoEn: true,
  valorObservado: true,
  error: true,
}).partial();

/** Pedido de un comando (`POST /estaciones-bombeo/:id/comandos`). */
export const PedidoComandoBombaSchema = z.object({
  idBomba: z.string(),
  clave: z.string(),
  motivo: z.string().trim().min(1).max(500),
});

export type IEstadoComandoBomba = z.infer<typeof EstadoComandoBombaSchema>;
export type IConfirmacionComandoBomba = z.infer<typeof ConfirmacionComandoBombaSchema>;
export type ISolicitanteComandoBomba = z.infer<typeof SolicitanteComandoBombaSchema>;
export type IComandoBomba = z.infer<typeof ComandoBombaSchema>;
export type ICreateComandoBomba = z.infer<typeof CreateComandoBombaSchema>;
export type IUpdateComandoBomba = z.infer<typeof UpdateComandoBombaSchema>;
export type IPedidoComandoBomba = z.infer<typeof PedidoComandoBombaSchema>;

export const ETIQUETA_ESTADO_COMANDO_BOMBA: Record<IEstadoComandoBomba, string> = {
  Pendiente: "Pendiente",
  Enviado: "Enviado",
  Aceptado: "El variador recibió la orden",
  Confirmado: "Confirmado",
  Rechazado: "El variador no respondió",
  Expirado: "Sin confirmación",
  Fallido: "No se pudo enviar",
};
