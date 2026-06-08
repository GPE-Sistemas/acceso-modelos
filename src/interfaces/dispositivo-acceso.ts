import { z } from "zod";
import { AccesoSchema } from "./acceso";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { DispositivoSchema } from "./dispositivo";

export const ComportamientoCredencialValidaSchema = z.enum([
  "Apertura Automática",
  "Aprobación Manual",
]);
export const ComportamientoCredencialInvalidaSchema = z.enum([
  "Ignorar",
  "Crear Ingreso",
]);

/**
 * Rol del dispositivo en el evento de acceso unificado (M4, def #2 del doc 01).
 * Varios devices de un acceso aportan a un único IIngresoEgreso: el HIK/cámara
 * principal lo `Genera`, un lector de patente lo `Enriquece`, otros solo `Registran`.
 */
export const RolEnEventoSchema = z.enum([
  "Genera evento",
  "Enriquece evento",
  "Solo registra",
]);

/**
 * Comportamiento ante una detección de video (M4). Análogo a
 * `ComportamientoCredencialValida` pero para detecciones. `Aprobado Automático`
 * solo es válido si el device IDENTIFICA (capacidades.deteccion.identificacionRostro)
 * — gate decisión E, validado cloud-side en acceso-api.
 */
export const ComportamientoDeteccionSchema = z.enum([
  "Aprobado Automático",
  "Pendiente Guardia",
  "Ignorar",
]);

/** Modo de disparo de la inferencia/acción del device en el acceso (M4, def #4). */
export const ModoDisparoSchema = z.enum(["Continuo", "PorEvento"]);

/** Condición sobre el evento del device origen que dispara a este device. */
export const CondicionDisparoSchema = z.enum(["Éxito", "Fallo", "Cualquiera"]);

/**
 * Cadena de detección (M4, def #4): este dispositivo-acceso actúa en consecuencia
 * de otro. Ej.: una cámara IA cuya inferencia arranca cuando el HIK del mismo acceso
 * concede (`Éxito`) o deniega (`Fallo`). `Continuo` = infiere siempre, sin trigger.
 */
export const DisparoDeteccionSchema = z.object({
  modo: ModoDisparoSchema,
  /** DispositivoAcceso origen del trigger (cuando modo === 'PorEvento'). */
  idDispositivoAccesoOrigen: z.string().optional(),
  condicion: CondicionDisparoSchema.optional(),
});

export const DispositivoAccesoSchema = z.object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    idCliente: z.string().optional(),
    idComplejo: z.string().optional(),
    idDispositivo: z.string().optional(),
    idAcceso: z.string().optional(),
    /** Cuando un dispositivo está en mas de un acceso representa cómo el reporte del dispositivo representa este acceso. */
    canalDispositivo: z.string().optional(),
    comportamientoCredencialValida:
      ComportamientoCredencialValidaSchema.optional(),
    comportamientoCredencialInvalida:
      ComportamientoCredencialInvalidaSchema.optional(),
    /** Indica si el dispositivo puede recibir un comando para abrir el acceso */
    aperturaConComando: z.boolean().optional(),
    // --- Inferencia de video / orquestación (M4, módulo IA-video) ---
    /** Rol de este device en el evento de acceso unificado. */
    rolEnEvento: RolEnEventoSchema.optional(),
    /** Comportamiento ante una detección de video. `Aprobado Automático` gateado
     *  por capacidades.deteccion.identificacionRostro del device (decisión E). */
    comportamientoDeteccion: ComportamientoDeteccionSchema.optional(),
    /** Cadena de detección: cómo/cuándo se dispara este device (def #4). */
    disparo: DisparoDeteccionSchema.optional(),
    // Populate
    cliente: ClienteSchema.optional(),
    complejo: ComplejoSchema.optional(),
    dispositivo: DispositivoSchema.optional(),
    acceso: AccesoSchema.optional(),
  });

export const CreateDispositivoAccesoSchema = DispositivoAccesoSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
  dispositivo: true,
  acceso: true,
});

export const UpdateDispositivoAccesoSchema = DispositivoAccesoSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
  dispositivo: true,
  acceso: true,
}).partial();

export type IComportamientoCredencialValida = z.infer<
  typeof ComportamientoCredencialValidaSchema
>;
export type IComportamientoCredencialInvalida = z.infer<
  typeof ComportamientoCredencialInvalidaSchema
>;
export type IRolEnEvento = z.infer<typeof RolEnEventoSchema>;
export type IComportamientoDeteccion = z.infer<
  typeof ComportamientoDeteccionSchema
>;
export type IModoDisparo = z.infer<typeof ModoDisparoSchema>;
export type ICondicionDisparo = z.infer<typeof CondicionDisparoSchema>;
export type IDisparoDeteccion = z.infer<typeof DisparoDeteccionSchema>;
export type IDispositivoAcceso = z.infer<typeof DispositivoAccesoSchema>;
export type ICreateDispositivoAcceso = z.infer<
  typeof CreateDispositivoAccesoSchema
>;
export type IUpdateDispositivoAcceso = z.infer<
  typeof UpdateDispositivoAccesoSchema
>;
