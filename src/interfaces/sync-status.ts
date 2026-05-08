import { z } from "zod";

// ISyncStatus — telemetría de sync para troubleshooting.
// Una por par (idComplejo, idEdgeAppliance, entidad).
export const SyncStatusDireccionSchema = z.enum([
  "edge-to-cloud",
  "cloud-to-edge",
  "bilateral",
]);

export const SyncStatusSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),

  idComplejo: z.string(),
  idEdgeAppliance: z.string(),
  entidad: z.string(), // 'ingreso-egreso' | 'evento-visita' | ...
  direccion: SyncStatusDireccionSchema,
  ultimoSyncOk: z.string(),
  ultimoSyncError: z.string().optional(),
  pendingCount: z.number().int().nonnegative(),
  lagSegundos: z.number().nonnegative(),
});

export const CreateSyncStatusSchema = SyncStatusSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
});

export const UpdateSyncStatusSchema = CreateSyncStatusSchema.partial();

export type ISyncStatusDireccion = z.infer<typeof SyncStatusDireccionSchema>;
export type ISyncStatus = z.infer<typeof SyncStatusSchema>;
export type ICreateSyncStatus = z.infer<typeof CreateSyncStatusSchema>;
export type IUpdateSyncStatus = z.infer<typeof UpdateSyncStatusSchema>;
