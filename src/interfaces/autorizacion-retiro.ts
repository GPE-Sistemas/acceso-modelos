import { z } from "zod";
import { ComplejoSchema } from "./complejo";
import { PermisoSchema } from "./permiso";
import { UnidadFuncionalSchema } from "./unidad-funcional";
import { VisitanteSchema } from "./visitante";

/**
 * Minutos que la UF tiene para responder una solicitud hecha en garita antes de
 * que pase a `Vencida` (D64, doc 51). Fijo por decisión, no configurable por
 * complejo.
 */
export const TIMEOUT_RETIRO_GARITA_MIN = 10;

/** Fotos máximas por autorización (objectNames del bucket privado). */
export const MAX_FOTOS_RETIRO = 5;

/**
 * En qué momento nace la autorización. La deriva acceso-api del nivel del
 * permiso y del body, el cliente no la elige:
 * - `Previa`: la carga la UF antes del egreso; nace `Aprobada`.
 * - `Garita`: la pide el guardia con la visita todavía adentro; nace `Pendiente`.
 * - `Posterior`: la carga el guardia sobre un egreso ya registrado (típicamente
 *   por credencial); nace `Pendiente` con el uso ya cargado.
 */
export const InstanciaRetiroSchema = z.enum(["Previa", "Garita", "Posterior"]);

/**
 * - `Vencida`: solo `Garita`, pasó `TIMEOUT_RETIRO_GARITA_MIN` sin respuesta.
 *   Una `Previa` fuera de vigencia NO se escribe como vencida: se evalúa al leer.
 * - `Utilizada`: con `usoUnico`, al registrarse el primer uso.
 * - `Rechazada` en una `Posterior` solo queda en el registro (el objeto ya salió).
 */
export const EstadoRetiroSchema = z.enum([
  "Pendiente",
  "Aprobada",
  "Rechazada",
  "Vencida",
  "Utilizada",
  "Anulada",
]);

/**
 * - `Garita`: el guardia lo controló en el diálogo de egreso.
 * - `Automática`: egreso por credencial, lo vinculó acceso-api al recibir el
 *   vínculo del movimiento; queda a la espera de que la guardia lo verifique.
 */
export const ViaUsoRetiroSchema = z.enum(["Garita", "Automática"]);

export const ItemRetiroSchema = z.object({
  descripcion: z.string().min(1),
  cantidad: z.number().int().positive().optional(),
});

/**
 * Un egreso en el que salió lo autorizado. La relación con el movimiento vive
 * acá y no en `IIngresoEgreso`: el movimiento viaja bidireccional edge↔cloud y
 * esta entidad es cloud-only. Un `idIngresoEgreso` aparece a lo sumo una vez
 * por autorización (el subscriber reintenta).
 */
export const UsoRetiroSchema = z.object({
  idIngresoEgreso: z.string(),
  /** Fecha del movimiento, no de la carga del uso. */
  fecha: z.string(),
  via: ViaUsoRetiroSchema,
  verificadoPorIdPermiso: z.string().optional(),
  fechaVerificacion: z.string().optional(),
  /** `false` = salió con algo distinto a lo declarado. */
  conforme: z.boolean().optional(),
  observacion: z.string().optional(),
});

/**
 * Autorización para que un visitante retire objetos de una UF al egresar
 * (D64, doc 51). Solo visitantes: no aplica a residentes ni personal. Aplica a
 * cualquier `tipo` de evento de visita.
 *
 * CLOUD-ONLY: no replica al edge. Con el appliance aislado la guardia registra
 * el egreso con observaciones y carga una `Posterior` al volver la conexión.
 */
export const AutorizacionRetiroSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  /** UF de la que sale el objeto (= destino del evento). */
  idUnidadFuncional: z.string().optional(),
  /** Opcional en `Posterior` si el egreso no tenía vínculo a un evento. */
  idEventoVisita: z.string().optional(),
  /** Quién retira. */
  idVisitante: z.string().optional(),
  instancia: InstanciaRetiroSchema.optional(),
  items: z.array(ItemRetiroSchema).min(1).optional(),
  /** objectNames GCS del bucket privado, nunca URLs. Hasta `MAX_FOTOS_RETIRO`. */
  fotos: z.array(z.string()).max(MAX_FOTOS_RETIRO).optional(),
  observaciones: z.string().optional(),
  estado: EstadoRetiroSchema.optional(),
  /** Solo `Previa`. Sin `vigenciaHasta` vale lo que dure el evento. */
  vigenciaDesde: z.string().optional(),
  vigenciaHasta: z.string().optional(),
  /** Default `true`. `false` = recurrente (el jardinero que se lleva la poda cada semana). */
  usoUnico: z.boolean().optional(),
  usos: z.array(UsoRetiroSchema).optional(),
  // Aprobación — mismo molde que IEventoVisita y `autorizacionEgreso` (D57).
  /** A quiénes se les pidió. */
  idsPermisosNotificados: z.array(z.string()).optional(),
  fechaSolicitud: z.string().optional(),
  resueltoPorIdPermiso: z.string().optional(),
  fechaResolucion: z.string().optional(),
  motivoRechazo: z.string().optional(),
  /** Solo `Garita`: el guardia la autorizó sin respuesta de la UF. */
  aprobacionForzada: z.boolean().optional(),
  motivoAprobacionForzada: z.string().optional(),
  // Auditoría — la inyecta acceso-api desde el token.
  creadoPorIdPermiso: z.string().optional(),
  anuladaPorIdPermiso: z.string().optional(),
  fechaAnulacion: z.string().optional(),
  motivoAnulacion: z.string().optional(),
  // Populate
  complejo: ComplejoSchema.optional(),
  unidadFuncional: UnidadFuncionalSchema.optional(),
  /** `z.any()`: IEventoVisita trae cadena profunda de populate (criterio de `vinculo-evento-ingreso.ts`). */
  eventoVisita: z.any().optional(),
  visitante: VisitanteSchema.optional(),
  creadoPorPermiso: PermisoSchema.optional(),
  resueltoPorPermiso: PermisoSchema.optional(),
});

/**
 * Lo que manda el cliente. `instancia`, `estado`, la aprobación y la auditoría
 * los resuelve acceso-api; `usos` entra por `POST /:id/usos`. La `Posterior` se
 * pide con `idIngresoEgreso` (el egreso sobre el que se carga).
 */
export const CreateAutorizacionRetiroSchema = AutorizacionRetiroSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  instancia: true,
  estado: true,
  usos: true,
  idsPermisosNotificados: true,
  fechaSolicitud: true,
  resueltoPorIdPermiso: true,
  fechaResolucion: true,
  motivoRechazo: true,
  aprobacionForzada: true,
  motivoAprobacionForzada: true,
  creadoPorIdPermiso: true,
  anuladaPorIdPermiso: true,
  fechaAnulacion: true,
  motivoAnulacion: true,
  complejo: true,
  unidadFuncional: true,
  eventoVisita: true,
  visitante: true,
  creadoPorPermiso: true,
  resueltoPorPermiso: true,
}).extend({
  idIngresoEgreso: z.string().optional(),
});

export const UpdateAutorizacionRetiroSchema =
  AutorizacionRetiroSchema.omit({
    _id: true,
    fechaCreacion: true,
    complejo: true,
    unidadFuncional: true,
    eventoVisita: true,
    visitante: true,
    creadoPorPermiso: true,
    resueltoPorPermiso: true,
  }).partial();

/** Body de `PUT /autorizaciones-retiro/:id/aprobacion`. */
export const AprobacionRetiroSchema = z.object({
  aprobado: z.boolean(),
  motivoRechazo: z.string().optional(),
});

/** Body de `PUT /autorizaciones-retiro/:id/aprobacion-forzada`. */
export const AprobacionForzadaRetiroSchema = z.object({
  motivo: z.string().optional(),
});

/**
 * Body de `POST /autorizaciones-retiro/:id/usos`: la guardia registra (o
 * completa, si ya hay uno `Automática`) la verificación en un egreso.
 */
export const VerificarUsoRetiroSchema = z.object({
  idIngresoEgreso: z.string(),
  conforme: z.boolean().optional(),
  observacion: z.string().optional(),
});

/** Body de `PUT /autorizaciones-retiro/:id/anular`. */
export const AnularRetiroSchema = z.object({
  motivo: z.string().optional(),
});

export type IInstanciaRetiro = z.infer<typeof InstanciaRetiroSchema>;
export type IEstadoRetiro = z.infer<typeof EstadoRetiroSchema>;
export type IViaUsoRetiro = z.infer<typeof ViaUsoRetiroSchema>;
export type IItemRetiro = z.infer<typeof ItemRetiroSchema>;
export type IUsoRetiro = z.infer<typeof UsoRetiroSchema>;
export type IAutorizacionRetiro = z.infer<typeof AutorizacionRetiroSchema>;
export type ICreateAutorizacionRetiro = z.infer<
  typeof CreateAutorizacionRetiroSchema
>;
export type IUpdateAutorizacionRetiro = z.infer<
  typeof UpdateAutorizacionRetiroSchema
>;
export type IAprobacionRetiro = z.infer<typeof AprobacionRetiroSchema>;
export type IAprobacionForzadaRetiro = z.infer<
  typeof AprobacionForzadaRetiroSchema
>;
export type IVerificarUsoRetiro = z.infer<typeof VerificarUsoRetiroSchema>;
export type IAnularRetiro = z.infer<typeof AnularRetiroSchema>;
