import { z } from "zod";
import {
  ComandoActuacionSchema,
  IComandoActuacion,
} from "./dispositivo";
import {
  FeedbackActuacionSchema,
  IModoActuacion,
  ModoActuacionSchema,
} from "./dispositivo-acceso";
import {
  ConfianzaEstadoAccesoSchema,
  EstadoFisicoAccesoSchema,
  EstadoOperativoAccesoSchema,
  FuenteEstadoAccesoSchema,
} from "./acceso";

/**
 * Contrato de OPERACIÓN del actuador de un acceso (D53, doc 42). Vive en un
 * archivo propio y no en `acceso.ts` porque cruza las tres capas del modelo
 * (`IAcceso` + `IDispositivoAcceso` + `IDispositivo`) y `dispositivo-acceso.ts`
 * ya importa `AccesoSchema` para el populate — importarlo de vuelta desde
 * `acceso.ts` armaría un ciclo.
 *
 * Fuente única para acceso-api (validación + endpoints), acceso-web (qué
 * botones mostrar) y el struct Go del edge (args del comando NATS).
 */

/**
 * Acción de MOVIMIENTO sobre el actuador. Es lo que el operador ordena, no el
 * comando que el hardware entiende (eso es `IComandoActuacion`): `abrir` puede
 * resolverse como un pulso o como un mantenido según el `modo` del actuador.
 *
 * El cambio de modo operativo (liberar / bloquear / normalizar) NO va acá: es
 * estado deseado persistente, con vencimiento y auditoría propia, y su acción
 * de rol es otra.
 */
export const AccionActuacionSchema = z.enum(["abrir", "cerrar", "detener"]);

/**
 * Qué acciones tiene sentido ofrecer según el modo del actuador (D53).
 *
 * - `PulsoUnico`: sólo abrir. Cierra el fierro por su cuenta (autocierre) o no
 *   cierra nunca — en ninguno de los dos casos el sistema puede ordenarlo.
 * - `AbrirCerrar`: abrir y cerrar son dos pulsos a dos salidas distintas.
 * - `AbrirCerrarStop`: suma la parada del movimiento en curso.
 * - `Mantenida`: abrir = energizar, cerrar = desenergizar. Válido para
 *   cerradura; en barrera pulsada dejar el contacto cerrado indefinidamente
 *   tiene comportamiento indefinido (ver `ComandoActuacionSchema`).
 *
 * Lo consume acceso-api para rechazar una acción inválida y acceso-web para
 * armar los botones. La UI no reimplementa la regla.
 */
export const ACCIONES_POR_MODO_ACTUACION: Record<
  IModoActuacion,
  IAccionActuacion[]
> = {
  PulsoUnico: ["abrir"],
  AbrirCerrar: ["abrir", "cerrar"],
  AbrirCerrarStop: ["abrir", "cerrar", "detener"],
  Mantenida: ["abrir", "cerrar"],
};

/**
 * Comandos de hardware que un modo necesita para poder operar (D53). Es el gate
 * de configuración: declarar `AbrirCerrar` sobre un device que sólo sabe pulsar
 * una salida no se rechaza al operar, se rechaza al guardar.
 */
export const COMANDOS_REQUERIDOS_POR_MODO: Record<
  IModoActuacion,
  IComandoActuacion[]
> = {
  PulsoUnico: ["pulso"],
  AbrirCerrar: ["pulso"],
  AbrirCerrarStop: ["pulso", "detener"],
  Mantenida: ["mantenerAbierto", "mantenerCerrado"],
};

/**
 * Cuántas salidas comandables necesita cada modo (D53). El K1T344 tiene una:
 * cubre `PulsoUnico` y `Mantenida`, no los otros dos.
 */
export const SALIDAS_REQUERIDAS_POR_MODO: Record<IModoActuacion, number> = {
  PulsoUnico: 1,
  AbrirCerrar: 2,
  AbrirCerrarStop: 3,
  Mantenida: 1,
};

/** Body de `POST /accesos/:id/operar`. */
export const OperarAccesoSchema = z.object({
  accion: AccionActuacionSchema,
});

/**
 * Resultado de una operación. `resultado` es del COMANDO, no del fierro: `ok`
 * significa que el actuador aceptó la orden, nunca que la barrera se movió —
 * eso sólo lo sabe un acceso con realimentación física cableada.
 *
 * El estado que viene acá es el que reportó el edge al responder. El estado
 * persistido lo escribe el edge (owner del plano reportado), no este endpoint.
 */
export const OperarAccesoResponseSchema = z.object({
  accion: AccionActuacionSchema,
  resultado: z.enum(["ok", "error", "sin-respuesta"]),
  mensaje: z.string().optional(),
  /** Comando de hardware con el que se resolvió la acción (trazabilidad). */
  comando: ComandoActuacionSchema.optional(),
  estadoFisico: EstadoFisicoAccesoSchema.optional(),
  confianzaEstado: ConfianzaEstadoAccesoSchema.optional(),
  fuenteEstado: FuenteEstadoAccesoSchema.optional(),
  fechaEstado: z.string().optional(),
});

/**
 * Respuesta de `GET /accesos/:id/actuacion`: todo lo que la UI necesita para
 * pintar el control del acceso sin recalcular reglas ni encadenar tres GET.
 *
 * `accionesDisponibles` ya viene filtrado por el modo del actuador y por la
 * capacidad del device. Vacío = el acceso no se acciona por sistema (sin
 * actuador designado, o el designado no puede operar).
 */
export const ActuacionAccesoSchema = z.object({
  idAcceso: z.string(),
  /** `IDispositivoAcceso` designado como actuador. Ausente = no se acciona. */
  idDispositivoAccesoActuador: z.string().optional(),
  idDispositivo: z.string().optional(),
  /** Nombre del device, para que la UI diga QUÉ acciona el acceso. */
  nombreDispositivo: z.string().optional(),
  modo: ModoActuacionSchema.optional(),
  feedback: FeedbackActuacionSchema.optional(),
  accionesDisponibles: z.array(AccionActuacionSchema),
  /** Por qué no hay acciones, cuando no hay. Texto para la UI. */
  motivoSinAcciones: z.string().optional(),
  // Plano reportado (lo escribe el edge).
  estadoFisico: EstadoFisicoAccesoSchema.optional(),
  confianzaEstado: ConfianzaEstadoAccesoSchema.optional(),
  fuenteEstado: FuenteEstadoAccesoSchema.optional(),
  fechaEstado: z.string().optional(),
  // Plano deseado (lo escribe el cloud).
  estadoOperativo: EstadoOperativoAccesoSchema.optional(),
  vigenteHasta: z.string().optional(),
  motivoEstadoOperativo: z.string().optional(),
});

export type IAccionActuacion = z.infer<typeof AccionActuacionSchema>;
export type IOperarAcceso = z.infer<typeof OperarAccesoSchema>;
export type IOperarAccesoResponse = z.infer<typeof OperarAccesoResponseSchema>;
export type IActuacionAcceso = z.infer<typeof ActuacionAccesoSchema>;
