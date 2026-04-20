export interface ICounter {
  _id?: string;
  colection?: string;
  seq?: number;
}

type OmitirCreate = "_id";
export interface ICreateCounter extends Omit<Partial<ICounter>, OmitirCreate> {}

type OmitirUpdate = "_id";
export interface IUpdateCounter extends Omit<Partial<ICounter>, OmitirUpdate> {}
