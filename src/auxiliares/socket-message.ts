export interface ISocketMessage {
  /**
   * Las entidades modificadas (clientes, usuarios, etc)
   */
  paths?: string[];
  /**
   * Metodo HTTP ejecutado (post, put, delete)
   */
  method?: string;
  /**
   * El id del usuario que ejecutó la accion
   */
  idUser?: string;
  /**
   * El id del cliente del usuario que ejecutó la accion
   */
  idCliente?: string;
  /**
   * El body que se devolvio al usuario
   * En caso de post o put, el body es el nuevo objeto
   * En caso de delete, el body es un objeto { _id: "id del objeto eliminado" }
   */
  body?: Record<string, any>;
  /**
   * Por que el usuario recibio el mensaje (para debug mas que nada)
   */
  motivo?: string;
  /**
   * La aplicacion que envio el mensaje
   */
  aplicacion?: string;
}
