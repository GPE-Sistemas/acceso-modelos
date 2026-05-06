import { z } from "zod";

export const ListadoSchema = <T extends z.ZodTypeAny>(inner: T) =>
  z.looseObject({
      totalCount: z.number().optional(),
      datos: z.array(inner),
      duration: z.number().optional(),
      executionStats: z.record(z.string(), z.any()).optional(),
    });

export interface IListado<T> {
  totalCount?: number;
  datos: T[];
  duration?: number;
  executionStats?: object;
}
