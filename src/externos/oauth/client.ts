export interface IClient {
  _id?: string;
  id?: string;
  clientSecret?: string;
  grants?: string[];
  redirectUris?: string[];
  accessTokenLifetime?: number;
  refreshTokenLifetime?: number;
}

type OmitirCreate = '_id';

export interface ICreateClient extends Omit<Partial<IClient>, OmitirCreate> {}

type OmitirUpdate = '_id';

export interface IUpdateClient extends Omit<Partial<IClient>, OmitirUpdate> {}
