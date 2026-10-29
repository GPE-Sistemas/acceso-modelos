import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { ServicioMedidoSchema } from "./asignacion-dispositivo";

/**
 * Factura de la distribuidora de un servicio medido (D66 Etapa 5, doc 53
 * §4.3). Cloud-only. La usa el método `ProrrateoFactura`: el monto se reparte
 * entre las UF del cierre al que el admin la asigna.
 *
 * El período de la distribuidora casi nunca coincide con el corte del
 * complejo: por eso no se asocia por fechas sino a un cierre (`idCierre`), y
 * `desde`/`hasta` quedan informativos. Puede haber varias facturas del mismo
 * servicio en un cierre (se suman). Se cargan y editan solo con el cierre en
 * `Borrador` (`Servicios - Cerrar período de consumos`).
 */
export const FacturaServicioSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  idCierre: z.string(),
  /** Denormalizado del cierre. */
  periodo: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  servicio: ServicioMedidoSchema,
  /** Nombre de la distribuidora (AySA, Metrogas, Edesur…). */
  distribuidora: z.string().optional(),
  numero: z.string().optional(),
  fechaEmision: z.string().optional(),
  /** Período que factura la distribuidora (informativo). */
  desde: z.string().optional(),
  hasta: z.string().optional(),
  /** Total a repartir. */
  monto: z.number().positive(),
  /** Consumo que factura la distribuidora (m3 / kWh). Obligatorio para el modo `PrecioMedio`. */
  consumoFacturado: z.number().nonnegative().optional(),
  /** objectName GCS del bucket privado (PDF o foto de la factura). */
  adjunto: z.string().optional(),
  observacion: z.string().optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
});

export const CreateFacturaServicioSchema = FacturaServicioSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  cliente: true,
  complejo: true,
});
export const UpdateFacturaServicioSchema = CreateFacturaServicioSchema.partial();

export type IFacturaServicio = z.infer<typeof FacturaServicioSchema>;
export type ICreateFacturaServicio = z.infer<typeof CreateFacturaServicioSchema>;
export type IUpdateFacturaServicio = z.infer<typeof UpdateFacturaServicioSchema>;
