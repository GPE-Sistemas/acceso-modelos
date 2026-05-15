import { z } from "zod";
import { EdgeApplianceSchema } from "./edge-appliance";

// Snapshot inmutable persistido al ejecutar purge (hard delete) de un
// EdgeAppliance. Permite forense / auditoría post-borrado. La purge ejecuta
// además cascade: nullify FKs en Dispositivos (idEdgeAppliancePrimario /
// idEdgeApplianceSecundario), delete de SyncStatus, nullify de
// CamarasDescubiertas.idEdgeAppliancePrimarioPropuesto, revoke Headscale node,
// invalidate JWT provisioning, delete DNS FQDN, drain NATS subscriptions.

export const EdgeAppliancePurgeDispositivoAfectadoSchema = z.object({
  idDispositivo: z.string(),
  rol: z.enum(["primario", "secundario"]),
  nombre: z.string().optional(),
  mac: z.string().optional(),
});

export const EdgeAppliancePurgeSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),

  // Scope tenant heredado del appliance al momento de purgar.
  idCliente: z.string(),
  idComplejo: z.string(),

  // Snapshot completo del appliance pre-delete. Incluye fqdn, indice, rol,
  // hardware, capacidad y todos los campos del momento. Estructura idéntica a
  // EdgeApplianceSchema.
  applianceSnapshot: EdgeApplianceSchema,

  // Quién ejecutó la purge.
  idUsuarioEjecutor: z.string(),
  emailUsuarioEjecutor: z.string().optional(),
  nombreUsuarioEjecutor: z.string().optional(),

  motivo: z.string().optional(),

  // Cascade resultante: FK en Dispositivos quedó nullify (idEdgeAppliancePrimario
  // o idEdgeApplianceSecundario). Snapshot mínimo para auditoría.
  dispositivosAfectados: z.array(
    EdgeAppliancePurgeDispositivoAfectadoSchema,
  ),
  // Counts del cascade.
  syncStatusBorrados: z.number().int().nonnegative(),
  camarasDescubiertasAfectadas: z.number().int().nonnegative(),

  // Limpieza periférica (best-effort). Si falló alguna, queda registrada.
  headscaleNodeId: z.string().optional(),
  headscaleNodeRevocado: z.boolean().optional(),
  fqdnLiberado: z.boolean().optional(),
  tokensRevocados: z.number().int().nonnegative().optional(),

  // Si la purge se ejecutó forzando decommission inline (sin estado previo
  // 'Decomisado'), queda marcado para auditoría.
  decomisoForzado: z.boolean().optional(),

  // Errores no fatales recolectados durante cascade (la purge no aborta por
  // estos; el doc Mongo se borra igual y los errores quedan acá).
  erroresNoFatales: z.array(z.string()).optional(),
});

export type IEdgeAppliancePurgeDispositivoAfectado = z.infer<
  typeof EdgeAppliancePurgeDispositivoAfectadoSchema
>;
export type IEdgeAppliancePurge = z.infer<typeof EdgeAppliancePurgeSchema>;

// La purge se crea server-side dentro del flujo de borrado, no vía POST
// directo. Igual exponemos Create schema por consistencia con el resto del
// repo (CreateXSchema = XSchema sin campos auto-managed).
export const CreateEdgeAppliancePurgeSchema = EdgeAppliancePurgeSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
});

export type ICreateEdgeAppliancePurge = z.infer<
  typeof CreateEdgeAppliancePurgeSchema
>;
