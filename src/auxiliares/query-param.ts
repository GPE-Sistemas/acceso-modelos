import { z } from "zod";

export const QueryParamSchema = z.looseObject({
    page: z.union([z.string(), z.number()]).optional(),
    limit: z.union([z.string(), z.number()]).optional(),
    sort: z.string().optional(),
    filter: z.string().optional(),
    populate: z.string().optional(),
    select: z.string().optional(),
    excludeTotalCount: z.boolean().optional(),
    onlyTotalCount: z.boolean().optional(),
    executionStats: z.boolean().optional(),
    /** Si está en true setea el limit en 0, lo que significa que no hay límite en la cantidad de resultados */
    unlimited: z.boolean().optional(),
  });

export type IQueryParam = z.infer<typeof QueryParamSchema> & {
  [key: string]: any;
};

export interface IPopulate {
  path?: string;
  select?: string;
  populate?: IPopulate;
  [key: string]: any;
}

type mongoOperators = {
  $regex?: string;
  $in?: string[];
  $nin?: string[];
  $gte?: number | string;
  $lte?: number | string;
  $gt?: number | string;
  $lt?: number | string;
  $eq?: number | string | boolean | null;
  $ne?: number | string | boolean | null;
  $exists?: boolean;
  [key: string]: any;
};

type mongoFilter = number | string | boolean | null | mongoOperators;

export type IFilter<T> = {
  [K in keyof T]: undefined | mongoFilter | IFilter<T>[];
} & {
  $or?: IFilter<T>[];
  $and?: IFilter<T>[];
  $nor?: IFilter<T>[];
  $not?: mongoFilter;
};
