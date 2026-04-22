import { IFilter } from './query-param';

export type IUpdateMany<T> = {
  $set: IFilter<T>;
};
