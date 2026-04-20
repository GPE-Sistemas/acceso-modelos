import { IFilter } from "./query-filter";

export type IUpdateMany<T> = {
  $set: IFilter<T>;
};
