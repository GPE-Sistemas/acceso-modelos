import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { DispositivoSchema } from "./dispositivo";
import { ZonaSchema } from "./zona";
import {
  ConfigDeteccionCanalSchema,
  DisparoDeteccionSchema,
} from "./dispositivo-acceso";

/**
 * IDispositivoZona — análogo a `IDispositivoAcceso` (D49, Capa 3): liga un canal
 * de un dispositivo de video a una `IZona` SIN que sea un punto de acceso. Una
 * cámara de perímetro mapea a una zona `Perimetro` sin generar `IIngresoEgreso`.
 *
 * Reusa el sub-bloque `deteccion` de Capa 2 (mismo `ConfigDeteccionCanalSchema`
 * que `IDispositivoAcceso`) y las cadenas de disparo (`DisparoDeteccionSchema`).
 * Omite el resto de la orquestación de acceso (`rolEnEvento`,
 * `comportamientoCredencial*`, `comportamientoDeteccion`): no aplican a una zona
 * sin acceso.
 */
export const DispositivoZonaSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  idDispositivo: z.string().optional(),
  idZona: z.string().optional(),
  /** Canal del NVR/XVR (matchea `IDeteccion.canalDispositivo`). */
  canalDispositivo: z.string().optional(),
  /** Configuración de detección por canal (D49, Capa 2). Mismo bloque que
   *  `IDispositivoAcceso`: tipos, identificación, umbral/fps/área,
   *  regiones/máscaras en el frame y stream Main/Sub. Alimenta el config-gen
   *  de Frigate. */
  deteccion: ConfigDeteccionCanalSchema.optional(),
  /** Cadena de detección: cómo/cuándo se dispara este canal (def #4). */
  disparo: DisparoDeteccionSchema.optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  dispositivo: DispositivoSchema.optional(),
  zona: ZonaSchema.optional(),
});

export const CreateDispositivoZonaSchema = DispositivoZonaSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
  dispositivo: true,
  zona: true,
});

export const UpdateDispositivoZonaSchema = CreateDispositivoZonaSchema.partial();

export type IDispositivoZona = z.infer<typeof DispositivoZonaSchema>;
export type ICreateDispositivoZona = z.infer<
  typeof CreateDispositivoZonaSchema
>;
export type IUpdateDispositivoZona = z.infer<
  typeof UpdateDispositivoZonaSchema
>;
