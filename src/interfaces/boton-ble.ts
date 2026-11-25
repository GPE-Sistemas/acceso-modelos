import { z } from "zod";
import { AsignacionDispositivoSchema } from "./asignacion-dispositivo";
import { DispositivoSchema } from "./dispositivo";

/**
 * Botones de pánico BLE (D78, doc 62). El botón es un `IDispositivo`
 * (`formFactor: 'Botón BLE'`, `conectividad.clase: 'BLE'`, `mac`) y su dueño es
 * un permiso vía `IAsignacionDispositivo` destino `Permiso`. Lo da de alta
 * acceso-api al primer UL 103; la web lo asigna.
 */

/** Fila de `GET /botones-ble`: el botón + su asignación activa (si tiene). */
export const BotonBleSchema = z.object({
  dispositivo: DispositivoSchema,
  /** Ausente = sin asignar. `permiso` populado como `z.any()` (profundidad). */
  asignacion: AsignacionDispositivoSchema.optional(),
  permiso: z.any().optional(),
});

/** Body de `PUT /botones-ble/:id/asignar`. Cierra la anterior si había. */
export const AsignarBotonBleSchema = z.object({
  idPermiso: z.string(),
  observaciones: z.string().optional(),
});

/** Body de `PUT /botones-ble/:id`. */
export const UpdateBotonBleSchema = z.object({
  nombre: z.string().trim().min(1).max(80),
});

export type IBotonBle = z.infer<typeof BotonBleSchema>;
export type IAsignarBotonBle = z.infer<typeof AsignarBotonBleSchema>;
export type IUpdateBotonBle = z.infer<typeof UpdateBotonBleSchema>;
