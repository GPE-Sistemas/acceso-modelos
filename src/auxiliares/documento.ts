import { z } from "zod";

export const DocumentoSchema = <T extends z.ZodTypeAny>(inner: T) =>
  z.object({
      dato: inner,
      duration: z.number().optional(),
    });

export interface IDocumento<T> {
  dato: T;
  duration?: number;
}

export const ResultadoMasivoSchema = z.object({
    insertedCount: z.number().optional(),
    modifiedCount: z.number().optional(),
    matchedCount: z.number().optional(),
    deletedCount: z.number().optional(),
    duration: z.number().optional(),
  });

export type IResultadoMasivo = z.infer<typeof ResultadoMasivoSchema>;
