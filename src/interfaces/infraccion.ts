import { z } from "zod";
import {
  InfraccionMultaBaseFields,
  InfraccionMultaBaseOmit,
} from "./infraccion-multa-base";

/**
 * Infracción / apercibimiento aplicado a una unidad funcional. **Sin monto a
 * cobrar** — es un aviso. Puede vivir sola (apercibimiento) o escalar a una
 * multa más adelante (`Escalada`, con `idMulta` apuntando a la multa generada).
 *
 * Entidad separada de `IMulta` a propósito: no se paga ni se liquida, así que
 * la lógica financiera (motor de expensas, `IPago`, estado de cuentas) nunca la
 * ve. Comparte campos con la multa vía `InfraccionMultaBaseFields`.
 *
 * Ciclo de vida (`estado`): Borrador → Emitida → (Anulada | Escalada).
 */

export const EstadoInfraccionSchema = z.enum([
  "Borrador",
  "Emitida",
  "Anulada",
  "Escalada",
]);
export type EEstadoInfraccion = z.infer<typeof EstadoInfraccionSchema>;

export const InfraccionSchema = z.object({
  ...InfraccionMultaBaseFields,
  estado: EstadoInfraccionSchema.optional(),
  fechaEmision: z.string().optional(),
  /** Multa a la que escaló (opcional). */
  idMulta: z.string().optional(),
  // Populate (z.any para evitar circularidad infracción↔multa).
  multa: z.any().optional(),
});

export const CreateInfraccionSchema = InfraccionSchema.omit({
  ...InfraccionMultaBaseOmit,
  estado: true,
  fechaEmision: true,
  idMulta: true,
  multa: true,
});

export const UpdateInfraccionSchema = CreateInfraccionSchema.partial();

export type IInfraccion = z.infer<typeof InfraccionSchema>;
export type ICreateInfraccion = z.infer<typeof CreateInfraccionSchema>;
export type IUpdateInfraccion = z.infer<typeof UpdateInfraccionSchema>;
