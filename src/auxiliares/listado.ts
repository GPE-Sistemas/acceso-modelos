export interface IListado<T> {
  totalCount?: number;
  datos: T[];
  duration?: number;
  executionStats?: object;
}
