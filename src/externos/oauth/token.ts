import { IClient } from './client';

export interface IToken {
  _id?: string;
  accessToken?: string;
  accessTokenExpiresAt?: string;
  refreshToken?: string;
  refreshTokenExpiresAt?: string;
  scope?: string | string[];
  client?: IClient;
  user?: any;
}

type OmitirCreate = '_id';

export interface ICreateToken extends Omit<Partial<IToken>, OmitirCreate> {}

type OmitirUpdate = '_id';

export interface IUpdateToken extends Omit<Partial<IToken>, OmitirUpdate> {}
