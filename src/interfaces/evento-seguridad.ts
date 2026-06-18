import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { DispositivoSchema } from "./dispositivo";
import { PermisoSchema } from "./permiso";
import { EstadoTicketSchema } from "./ticket";
import { ZonaSchema } from "./zona";

/**
 * IEventoSeguridad — hecho de seguridad materializado por el correlador del edge
 * cuando una detección cae en una zona cuya acción derivada es `Alerta` (D49,
 * Capa 3 / F3). Entidad dedicada (política "entidad por hecho"; el `IEvento`
 * polimórfico catch-all fue eliminado).
 *
 * Origen: el correlador agrupa detecciones `idZona`-only por (idZona) + ventana,
 * deriva la acción de `proposito` + `nivelCriticidad` de la zona (tabla canónica
 * en doc 36 § Capa 3) y, para `Perimetro` + `Critica` (→ `Alerta`), materializa
 * este evento. El reverse link vive en `IDeteccion.idEventoSeguridad`.
 *
 * Owner operacional: el edge (RPi5+Hailo) materializa; el Hub edge resuelve
 * local (panel edge-first, como ingresos). Sync edge↔cloud bilateral Tipo A
 * (`fechaActualizacion` último-write-wins, como IIngresoEgreso/IDeteccion).
 *
 * Bandeja unificada de guardia: NO se unifica con ITicket (origen máquina vs
 * humano; ITicket es cloud-direct D41, este es edge-first B1; política "entidad
 * por hecho"). Pero comparten el flujo de atención: reusa `EstadoTicketSchema`
 * y el sub-bloque idPermisoAtencion/fechaTomado/fechaResolucion/
 * observacionesCierre para que el panel de guardia muestre ambos homogéneos.
 *
 * Retención: NO lleva `expireAt`/TTL (a diferencia de IDeteccion) — es un
 * registro accionable con workflow de resolución; se retiene hasta
 * `Resuelto`/`Descartado` + purga eventual, no expira por volumen.
 *
 * Doc: acceso-doc-general/36-matriz-capacidades-dispositivos.md § Capa 3.
 */

/**
 * Qué hecho de seguridad ocurrió. `Merodeo` queda en el vocabulario pero NO se
 * materializa en F3 (requiere análisis temporal de permanencia/dwell, fuera del
 * grupo de ventana única del correlador).
 *
 * `Coaccion` NO proviene del correlador de video: lo origina un TERMINAL de
 * credencial cuando se usa una huella de pánico (`hijackFP` del HIK) — abre la
 * puerta y dispara alarma silenciosa. Lleva `idDispositivo` (el terminal) en vez
 * de `idZona`/`idsDetecciones`.
 */
export const TipoEventoSeguridadSchema = z.enum([
  "IntrusionPersona",
  "IntrusionVehiculo",
  "Merodeo",
  "Coaccion",
]);

/** Severidad del evento. F3 deriva `Critica` (zona) → `Critico`; el resto del enum queda para escalado/granularidad futura. */
export const NivelEventoSeguridadSchema = z.enum(["Info", "Alerta", "Critico"]);

export const EventoSeguridadSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  /** Último-write-wins para sync edge↔cloud (Tipo A), igual que IIngresoEgreso/IDeteccion. */
  fechaActualizacion: z.string().optional(),
  // Scope tenant
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  /** Zona geográfica que originó el evento (D49, Capa 3). */
  idZona: z.string().optional(),
  /** UF de la que cuelga la zona, cuando aplica (ej. amenity). */
  idUnidadFuncional: z.string().optional(),
  idDispositivo: z.string().optional(),
  /** Canal del NVR/XVR que originó la(s) detección(es) (matchea IDispositivoZona.canalDispositivo). */
  canalDispositivo: z.string().optional(),
  // Hecho
  tipo: TipoEventoSeguridadSchema.optional(),
  nivel: NivelEventoSeguridadSchema.optional(),
  fechaEvento: z.string().optional(),
  /** Detecciones crudas que lo originaron (reverse link de IDeteccion.idEventoSeguridad). */
  idsDetecciones: z.array(z.string()).optional(),
  /** Score agregado de la(s) detección(es) (0..1). */
  confianza: z.number().optional(),
  /** Snapshots (objectNames GCS), mismo storage que detección/ingreso. */
  imagenes: z.array(z.string()).optional(),
  // Workflow de atención — reusa EstadoTicket + sub-bloque de ITicket (bandeja
  // de guardia unificada). Pendiente → EnAtencion (toma) → Resuelta/Descartada.
  estado: EstadoTicketSchema.optional(),
  /** Guardia/admin que tomó el caso (mirror de ITicket.idPermisoAtencion). */
  idPermisoAtencion: z.string().optional(),
  fechaTomado: z.string().optional(),
  fechaResolucion: z.string().optional(),
  observacionesCierre: z.string().optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  zona: ZonaSchema.optional(),
  dispositivo: DispositivoSchema.optional(),
  permisoAtencion: PermisoSchema.optional(),
});

const EventoSeguridadPopulateOmit = {
  cliente: true,
  complejo: true,
  zona: true,
  dispositivo: true,
  permisoAtencion: true,
} as const;

export const CreateEventoSeguridadSchema = EventoSeguridadSchema.omit({
  _id: true,
  fechaCreacion: true,
  ...EventoSeguridadPopulateOmit,
});

// Update genérico: incluye los campos de atención (el panel resuelve vía PUT).
export const UpdateEventoSeguridadSchema = EventoSeguridadSchema.omit({
  _id: true,
  fechaCreacion: true,
  ...EventoSeguridadPopulateOmit,
}).partial();

export type ITipoEventoSeguridad = z.infer<typeof TipoEventoSeguridadSchema>;
export type INivelEventoSeguridad = z.infer<typeof NivelEventoSeguridadSchema>;
export type IEventoSeguridad = z.infer<typeof EventoSeguridadSchema>;
export type ICreateEventoSeguridad = z.infer<typeof CreateEventoSeguridadSchema>;
export type IUpdateEventoSeguridad = z.infer<typeof UpdateEventoSeguridadSchema>;
