import { z } from "zod";

export const CounterSchema = z
  .object({
    _id: z.string().optional(),
    colection: z.string().optional(),
    seq: z.number().optional(),
  })
  .passthrough();

export const CreateCounterSchema = CounterSchema.omit({ _id: true });
export const UpdateCounterSchema = CounterSchema.omit({ _id: true });

export type ICounter = z.infer<typeof CounterSchema>;
export type ICreateCounter = z.infer<typeof CreateCounterSchema>;
export type IUpdateCounter = z.infer<typeof UpdateCounterSchema>;
