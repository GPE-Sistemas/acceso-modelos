import { z } from "zod";
import {
  EdgeApplianceIntegrityEntrySchema,
  EdgeApplianceLastErrorSchema,
  EdgeApplianceNatsConnStateSchema,
} from "./edge-appliance";

// 25-hub-edge-arquitectura.md > Indicador de integridad / estado.
//
// IEdgeIntegridad — payload del endpoint GET /diagnostico que el edge
// expone al ColivingHub LAN (sección "Estado / Integridad" del Hub
// edge). Visible al guardia con la acción
// 'EdgeAppliance - Ver integridad'.
//
// Es un superset de IEdgeApplianceDiagnostico (que sigue siendo el
// payload del heartbeat agent → cloud para la tab Sync admin):
//   - Suma identidad + versión + uptime del agent (lo que la UI muestra
//     en el header del dashboard local).
//   - Suma estado de storage local (cache de imágenes + disco libre).
//   - Suma outbox.uploads (B.S10) además de outbox.eventos (B.S6).
//   - Suma alcanzabilidad cloud explícita (lag heartbeat).
//
// Se calcula on-demand en el agent al servir la request — no se
// persiste en Postgres. Cache corto en proceso (5s) si hace falta.

export const EdgeIntegridadEdgeSchema = z.object({
  idEdgeAppliance: z.string(),
  idComplejo: z.string(),
  versionAgent: z.string(),
  versionHub: z.string().optional(),
  uptimeSegundos: z.number().int().nonnegative(),
});

export const EdgeIntegridadSyncCloudSchema = z.object({
  // True si el último intento de heartbeat / outbox publish funcionó.
  reachable: z.boolean(),
  // Segundos desde el último heartbeat OK. Si nunca hubo, ausente.
  lagHeartbeatSegundos: z.number().int().nonnegative().optional(),
  lastSuccessAt: z.string().optional(),
  lastErrorAt: z.string().optional(),
});

// Cola pendiente — eventos out (B.S6) o uploads out (B.S10).
export const EdgeIntegridadOutboxColaSchema = z.object({
  pending: z.number().int().nonnegative(),
  // Fecha de creación de la fila más vieja pendiente. Útil para detectar
  // colas estancadas (ej. >24h indica problema sostenido).
  oldestCreatedAt: z.string().optional(),
});

export const EdgeIntegridadOutboxSchema = z.object({
  eventos: EdgeIntegridadOutboxColaSchema,
  uploads: EdgeIntegridadOutboxColaSchema,
});

export const EdgeIntegridadMasterDataSchema = z.object({
  // Entidades con drift detectado en el último integrity check vs cloud.
  // Vacío = todo sincronizado.
  drift: z.array(z.string()),
  lastIntegrityCheckAt: z.string().optional(),
  // Resumen detallado por entidad (mismo shape que el de la tab Sync
  // admin para reusar render en UI). Opcional para clientes que solo
  // quieren el flag drift/no-drift.
  resumen: z
    .record(z.string(), EdgeApplianceIntegrityEntrySchema)
    .optional(),
});

export const EdgeIntegridadStorageSchema = z.object({
  // Bytes ocupados por el cache de lectura de imágenes (B.S10).
  cacheImagesBytes: z.number().int().nonnegative(),
  cacheImagesItems: z.number().int().nonnegative(),
  // % libre del filesystem donde vive /var/lib/coliving/data. 0-100.
  diskFreePct: z.number().min(0).max(100),
});

export const EdgeIntegridadSyncSchema = z.object({
  cloud: EdgeIntegridadSyncCloudSchema,
  outbox: EdgeIntegridadOutboxSchema,
  masterData: EdgeIntegridadMasterDataSchema,
  nats: EdgeApplianceNatsConnStateSchema,
  // Último error operativo del agent. Auto-clear a los 15min (igual
  // semántica que IEdgeApplianceDiagnostico.lastError).
  lastError: EdgeApplianceLastErrorSchema.optional(),
});

export const EdgeIntegridadSchema = z.object({
  edge: EdgeIntegridadEdgeSchema,
  sync: EdgeIntegridadSyncSchema,
  storage: EdgeIntegridadStorageSchema,
  // Timestamp ISO de cuando el agent armó el payload.
  generadoEn: z.string(),
});

export type IEdgeIntegridadEdge = z.infer<typeof EdgeIntegridadEdgeSchema>;
export type IEdgeIntegridadSyncCloud = z.infer<
  typeof EdgeIntegridadSyncCloudSchema
>;
export type IEdgeIntegridadOutboxCola = z.infer<
  typeof EdgeIntegridadOutboxColaSchema
>;
export type IEdgeIntegridadOutbox = z.infer<typeof EdgeIntegridadOutboxSchema>;
export type IEdgeIntegridadMasterData = z.infer<
  typeof EdgeIntegridadMasterDataSchema
>;
export type IEdgeIntegridadStorage = z.infer<
  typeof EdgeIntegridadStorageSchema
>;
export type IEdgeIntegridadSync = z.infer<typeof EdgeIntegridadSyncSchema>;
export type IEdgeIntegridad = z.infer<typeof EdgeIntegridadSchema>;
