import { IComplejo } from './complejo';
import { ICliente } from './cliente';

export type AccionesRol =
  // *******************************************
  // MODULO ADMINISTRACIÓN
  // *******************************************
  // Clientes
  | 'Administración - Ver clientes'
  | 'Administración - Crear clientes'
  | 'Administración - Editar clientes'
  | 'Administración - Eliminar clientes'
  | 'Administración - Deshabilitar / habilitar clientes'
  // Complejos
  | 'Administración - Ver complejos'
  | 'Administración - Crear complejos'
  | 'Administración - Editar complejos'
  | 'Administración - Eliminar complejos'
  | 'Administración - Deshabilitar / habilitar complejos'
  | 'Administración - Editar configuración complejos'
  // Permisos
  | 'Administración - Ver permisos'
  | 'Administración - Crear permisos'
  | 'Administración - Editar permisos'
  // | 'Administración - Eliminar permisos' // Los permisos no se eliminan, solo se deshabilitan ya que se usan como referencia en otras entidades
  // Roles
  | 'Administración - Ver roles'
  | 'Administración - Crear roles'
  | 'Administración - Editar roles'
  | 'Administración - Eliminar roles'
  // Unidades funcionales
  | 'Administración - Ver unidades funcionales'
  | 'Administración - Crear unidades funcionales'
  | 'Administración - Editar unidades funcionales'
  | 'Administración - Eliminar unidades funcionales'
  | 'Administración - Deshabilitar / habilitar unidades funcionales'
  // Usuarios
  | 'Administración - Ver usuarios'
  | 'Administración - Crear usuarios'
  | 'Administración - Editar usuarios'
  | 'Administración - Eliminar usuarios'
  | 'Administración - Deshabilitar / habilitar usuarios'
  // *******************************************
  // MODULO HARDWARE
  // *******************************************
  // Accesos
  | 'Hardware - Ver accesos'
  | 'Hardware - Crear accesos'
  | 'Hardware - Editar accesos'
  | 'Hardware - Eliminar accesos'
  // Dispositivos
  | 'Hardware - Ver dispositivos'
  | 'Hardware - Crear dispositivos'
  | 'Hardware - Editar dispositivos'
  | 'Hardware - Eliminar dispositivos'
  // Credenciales de dispositivos
  | 'Hardware - Ver credenciales'
  | 'Hardware - Crear credenciales'
  | 'Hardware - Editar credenciales'
  | 'Hardware - Eliminar credenciales'
  // Relación dispositivo-acceso
  | 'Hardware - Ver dispositivos acceso'
  | 'Hardware - Crear dispositivos acceso'
  | 'Hardware - Editar dispositivos acceso'
  | 'Hardware - Eliminar dispositivos acceso'
  // *******************************************
  // MODULO VISITAS
  // *******************************************
  // Eventos de visita
  | 'Visitas - Ver eventos'
  | 'Visitas - Crear eventos'
  | 'Visitas - Editar eventos'
  | 'Visitas - Eliminar eventos'
  | 'Visitas - Aprobar eventos'
  // Visitantes
  | 'Visitas - Ver visitantes'
  | 'Visitas - Crear visitantes'
  | 'Visitas - Editar visitantes'
  | 'Visitas - Eliminar visitantes'
  // *******************************************
  // MODULO VEHÍCULOS
  // *******************************************
  | 'Vehículos - Ver vehículos'
  | 'Vehículos - Crear vehículos'
  | 'Vehículos - Editar vehículos'
  | 'Vehículos - Eliminar vehículos'
  // Vínculos vehículo-persona
  | 'Vehículos - Ver vínculos'
  | 'Vehículos - Crear vínculos'
  | 'Vehículos - Editar vínculos'
  | 'Vehículos - Eliminar vínculos'
  // *******************************************
  // MODULO MOVIMIENTOS
  // *******************************************
  | 'Movimientos - Ver panel de guardia'
  | 'Movimientos - Ver ingresos egresos'
  | 'Movimientos - Registrar ingreso egreso'
  | 'Movimientos - Ver propietarios'
  | 'Movimientos - Ver visitas activas'
  | 'Movimientos - Buscar visitantes'
  | 'Movimientos - Buscar vehiculos'
  | 'Movimientos - Ver vinculos evento ingreso'
  | 'Movimientos - Crear vinculos evento ingreso'
  | 'Movimientos - Eliminar vinculos evento ingreso'
  // *******************************************
  // MODULO EVENTOS
  // *******************************************
  | 'Eventos - Ver eventos'
  | 'Eventos - Crear eventos'
  // *******************************************
  // MODULO PUBLICACIONES
  // *******************************************
  | 'Publicaciones - Ver publicaciones'
  | 'Publicaciones - Crear publicaciones'
  | 'Publicaciones - Editar publicaciones'
  | 'Publicaciones - Eliminar publicaciones'
  // *******************************************
  // MODULO EMERGENCIAS
  // *******************************************
  // Botones de emergencia (catálogo)
  | 'Emergencias - Ver botones'
  | 'Emergencias - Crear botones'
  | 'Emergencias - Editar botones'
  | 'Emergencias - Eliminar botones'
  // Configuración por complejo (qué botones y orden ve la app mobile)
  | 'Emergencias - Ver configuración'
  | 'Emergencias - Editar configuración'
  // Operación
  | 'Emergencias - Enviar emergencia'        // mobile (UF)
  | 'Emergencias - Ver emergencias'          // panel guardia
  | 'Emergencias - Atender emergencias'      // tomar caso, cambiar estado, registrar interacciones, chatear
  | 'Emergencias - Eliminar emergencias';

export type IAlcanceRol = 'Global' | 'Cliente' | 'Complejo';

interface IRolBase {
  _id?: string;
  fechaCreacion?: string;
  nombre?: string;
  acciones?: AccionesRol[];
}

export interface IRolGlobal extends IRolBase {
  alcance: 'Global';
}

export interface IRolCliente extends IRolBase {
  alcance: 'Cliente';
  idCliente: string;
  // Virtual
  cliente?: ICliente;
}

export interface IRolComplejo extends IRolBase {
  alcance: 'Complejo';
  idCliente: string;
  idComplejo: string;
  // Virtuals
  cliente?: ICliente;
  complejo?: IComplejo;
}

export type IRol = IRolGlobal | IRolCliente | IRolComplejo;

type OmitirVirtuales = '_id' | 'fechaCreacion' | 'cliente' | 'complejo';

export type ICreateRol =
  | Omit<IRolGlobal, OmitirVirtuales>
  | Omit<IRolCliente, OmitirVirtuales>
  | Omit<IRolComplejo, OmitirVirtuales>;

export type IUpdateRol =
  | (Partial<Omit<IRolGlobal, OmitirVirtuales>> & { alcance: 'Global' })
  | (Partial<Omit<IRolCliente, OmitirVirtuales>> & { alcance: 'Cliente' })
  | (Partial<Omit<IRolComplejo, OmitirVirtuales>> & { alcance: 'Complejo' });
