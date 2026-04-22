export interface IDocumento<T> {
  dato: T;
  duration?: number;
}

export interface IResultadoMasivo {
  insertedCount?: number;
  modifiedCount?: number;
  matchedCount?: number;
  deletedCount?: number;
  duration?: number;
}
