import { z } from "zod";

export const ListadoSchema = <T extends z.ZodTypeAny>(inner: T) =>
  z
    .object({
      totalCount: z.number().optional(),
      datos: z.array(inner),
      duration: z.number().optional(),
      executionStats: z.record(z.string(), z.any()).optional(),
    })
    .passthrough();

export interface IListado<T> {
  totalCount?: number;
  datos: T[];
  duration?: number;
  executionStats?: object;
}
