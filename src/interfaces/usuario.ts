export interface IDatosPersonales {
  nombre?: string;
  dni?: string;
  sexo?: string;
  email?: string;
  direccion?: string;
  pais?: string;
  telefono?: string;
  fechaNacimiento?: string;
  foto?: string;
}

export interface IConfigUsuario {
  [key: string]: any;
}

export interface IUsuario {
  _id?: string;
  fechaCreacion?: string;
  usuario?: string;
  hash?: string;
  datosPersonales?: IDatosPersonales;
  config?: IConfigUsuario;
}

type OmitirCreate = '_id' | 'fechaCreacion';

export interface ICreateUsuario extends Omit<Partial<IUsuario>, OmitirCreate> {
  password?: string;
}

type OmitirUpdate = '_id' | 'fechaCreacion';

export interface IUpdateUsuario extends Omit<Partial<IUsuario>, OmitirUpdate> {}
