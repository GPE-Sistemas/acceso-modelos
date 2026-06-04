import { z } from "zod";
import { DatosPersonalesSchema } from "./usuario";
import { TipoEventoVisitaSchema } from "./evento-visita";

/**
 * Contratos del link público de invitación de visita.
 *
 * El invitado recibe (junto al QR de WhatsApp) un link con un JWT firmado y
 * stateless cuyos claims son `{ idVisitante, idEvento, scope }`. La ruta pública
 * en acceso-api (`@Public`) verifica la firma + expiración y expone/actualiza
 * SOLO los datos de ese visitante. Flujo opcional y no bloqueante: si el invitado
 * no lo completa, la visita opera igual.
 */

/** `scope` esperado dentro del JWT del link (defensa contra reuso de otros tokens). */
export const INVITACION_VISITA_SCOPE = "completar-datos-visitante" as const;

/**
 * Claims del JWT del link. acceso-api los firma con un secreto propio
 * (`INVITACION_JWT_SECRET`, distinto del de sesión) y TTL propio (`INVITACION_TTL`).
 */
export const InvitacionVisitaClaimsSchema = z.object({
  idVisitante: z.string(),
  idEvento: z.string(),
  scope: z.literal(INVITACION_VISITA_SCOPE),
});

/**
 * Respuesta del `GET /invitaciones-visita/:token` — subset SEGURO para mostrarle
 * al invitado el contexto y prellenar el formulario. No expone tenancy, otros
 * visitantes ni datos del propietario.
 */
export const InvitacionVisitaPublicaSchema = z.object({
  /** Nombre del complejo (display). */
  complejoNombre: z.string().optional(),
  /** Nombre de la unidad de destino (display). */
  unidadDestinoNombre: z.string().optional(),
  /** Tipo de evento (Particular / Servicio / Retiro / Entrega). */
  tipoEvento: TipoEventoVisitaSchema.optional(),
  fechaDesde: z.string().optional(),
  fechaHasta: z.string().optional(),
  permiteAccesoMultiple: z.boolean().optional(),
  /** Datos actuales del visitante (prefill). `telefono` se muestra read-only. */
  datosPersonales: DatosPersonalesSchema.optional(),
  /** Si el invitado ya confirmó sus datos alguna vez con este visitante. */
  validadoPorInvitado: z.boolean().optional(),
});

/**
 * Cuerpo (campos de texto) del `PUT /invitaciones-visita/:token`.
 * Gana el invitado sobre lo que cargó la UF, EXCEPTO:
 * - `telefono`: bloqueado (a ese número llegó el mensaje; es la key única por UF).
 * - `foto`: NO viaja acá como string — el archivo va por multipart y acceso-api
 *   hace el upload a GCS internamente y setea el `objectName`.
 */
export const CompletarInvitacionVisitaSchema = DatosPersonalesSchema.omit({
  telefono: true,
  foto: true,
}).partial();

export type IInvitacionVisitaClaims = z.infer<typeof InvitacionVisitaClaimsSchema>;
export type IInvitacionVisitaPublica = z.infer<
  typeof InvitacionVisitaPublicaSchema
>;
export type ICompletarInvitacionVisita = z.infer<
  typeof CompletarInvitacionVisitaSchema
>;
