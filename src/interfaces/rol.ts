import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";

export const AccionesRolSchema = z.enum([
  // MODULO ADMINISTRACIÓN
  // Clientes
  "Administración - Ver clientes",
  "Administración - Crear clientes",
  "Administración - Editar clientes",
  "Administración - Eliminar clientes",
  "Administración - Deshabilitar / habilitar clientes",
  // Complejos
  "Administración - Ver complejos",
  "Administración - Crear complejos",
  "Administración - Editar complejos",
  "Administración - Eliminar complejos",
  "Administración - Deshabilitar / habilitar complejos",
  "Administración - Editar configuración complejos",
  // Permisos — no se elimina ('Administración - Eliminar permisos'): solo se deshabilitan, ya que se referencian desde otras entidades
  "Administración - Ver permisos",
  "Administración - Crear permisos",
  "Administración - Editar permisos",
  // Roles
  "Administración - Ver roles",
  "Administración - Crear roles",
  "Administración - Editar roles",
  "Administración - Eliminar roles",
  // Unidades funcionales
  "Administración - Ver unidades funcionales",
  "Administración - Crear unidades funcionales",
  "Administración - Editar unidades funcionales",
  "Administración - Eliminar unidades funcionales",
  "Administración - Deshabilitar / habilitar unidades funcionales",
  // Usuarios
  "Administración - Ver usuarios",
  "Administración - Crear usuarios",
  "Administración - Editar usuarios",
  "Administración - Eliminar usuarios",
  "Administración - Deshabilitar / habilitar usuarios",

  // MODULO HARDWARE
  "Hardware - Ver accesos",
  "Hardware - Crear accesos",
  "Hardware - Editar accesos",
  "Hardware - Eliminar accesos",
  "Hardware - Ver dispositivos",
  "Hardware - Crear dispositivos",
  "Hardware - Editar dispositivos",
  "Hardware - Eliminar dispositivos",
  "Hardware - Ver credenciales",
  "Hardware - Crear credenciales",
  "Hardware - Editar credenciales",
  "Hardware - Eliminar credenciales",
  "Hardware - Ver dispositivos acceso",
  "Hardware - Crear dispositivos acceso",
  "Hardware - Editar dispositivos acceso",
  "Hardware - Eliminar dispositivos acceso",

  // MODULO VISITAS
  "Visitas - Ver eventos",
  "Visitas - Crear eventos",
  "Visitas - Editar eventos",
  "Visitas - Eliminar eventos",
  "Visitas - Aprobar eventos",
  "Visitas - Aprobar eventos recurrentes",
  "Visitas - Ver visitantes",
  "Visitas - Crear visitantes",
  "Visitas - Editar visitantes",
  "Visitas - Eliminar visitantes",

  // MODULO VEHÍCULOS
  "Vehículos - Ver vehículos",
  "Vehículos - Crear vehículos",
  "Vehículos - Editar vehículos",
  "Vehículos - Eliminar vehículos",
  "Vehículos - Ver vínculos",
  "Vehículos - Crear vínculos",
  "Vehículos - Editar vínculos",
  "Vehículos - Eliminar vínculos",

  // MODULO MOVIMIENTOS
  "Movimientos - Ver panel de guardia",
  "Movimientos - Ver ingresos egresos",
  "Movimientos - Registrar ingreso egreso",
  "Movimientos - Ver propietarios",
  "Movimientos - Ver visitas activas",
  "Movimientos - Buscar visitantes",
  "Movimientos - Buscar vehiculos",
  "Movimientos - Ver vinculos evento ingreso",
  "Movimientos - Crear vinculos evento ingreso",
  "Movimientos - Eliminar vinculos evento ingreso",

  // MODULO EVENTOS
  "Eventos - Ver eventos",
  "Eventos - Crear eventos",

  // MODULO PUBLICACIONES
  "Publicaciones - Ver publicaciones",
  "Publicaciones - Crear publicaciones",
  "Publicaciones - Editar publicaciones",
  "Publicaciones - Eliminar publicaciones",

  // MODULO EMERGENCIAS
  "Emergencias - Ver botones",
  "Emergencias - Crear botones",
  "Emergencias - Editar botones",
  "Emergencias - Eliminar botones",
  // Configuración por complejo (qué botones y orden ve la app mobile)
  "Emergencias - Ver configuración",
  "Emergencias - Editar configuración",
  // Operación
  "Emergencias - Enviar emergencia", // mobile (UF)
  "Emergencias - Ver emergencias", // panel guardia
  "Emergencias - Atender emergencias", // tomar caso, cambiar estado, registrar interacciones, chatear
  "Emergencias - Eliminar emergencias",

  // MODULO EDGE APPLIANCES (control de accesos on-premise)
  // Típicamente Cliente nivel 1 (integrador). El complejo no las ve.
  "EdgeAppliance - Ver appliances",
  "EdgeAppliance - Provisionar appliance",
  "EdgeAppliance - Despromover / desactivar",
  "EdgeAppliance - Ver telemetría / sync status",
  "EdgeAppliance - Forzar resync",
  "EdgeAppliance - Acceso debug",
  "EdgeAppliance - Asignar dispositivo",
  "EdgeAppliance - Reasignar shard",
  "EdgeAppliance - Ver capacidad y utilización",
  "EdgeAppliance - Ver hardware detectado",
  "EdgeAppliance - Re-detectar hardware",

  // Catálogos curados por GPE (master data Tipo B)
  "EdgeApplianceModelo - Ver catálogo certificado",
  "PerfilCamara - Ver catálogo",
]);

export const AlcanceRolSchema = z.enum(["Global", "Cliente", "Complejo"]);

const RolBaseFields = {
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  nombre: z.string().optional(),
  acciones: z.array(AccionesRolSchema).optional(),
};

export const RolGlobalSchema = z.object({
    ...RolBaseFields,
    alcance: z.literal("Global"),
  });

export const RolClienteSchema = z.object({
    ...RolBaseFields,
    alcance: z.literal("Cliente"),
    idCliente: z.string(),
    cliente: ClienteSchema.optional(),
  });

export const RolComplejoSchema = z.object({
    ...RolBaseFields,
    alcance: z.literal("Complejo"),
    idCliente: z.string(),
    idComplejo: z.string(),
    cliente: ClienteSchema.optional(),
    complejo: ComplejoSchema.optional(),
  });

export const RolSchema = z.discriminatedUnion("alcance", [
  RolGlobalSchema,
  RolClienteSchema,
  RolComplejoSchema,
]);

const VirtualesRolKeys = {
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
} as const;

export const CreateRolSchema = z.discriminatedUnion("alcance", [
  RolGlobalSchema.omit({ _id: true, fechaCreacion: true }),
  RolClienteSchema.omit({ _id: true, fechaCreacion: true, cliente: true }),
  RolComplejoSchema.omit({
    _id: true,
    fechaCreacion: true,
    cliente: true,
    complejo: true,
  }),
]);

export const UpdateRolSchema = z.discriminatedUnion("alcance", [
  RolGlobalSchema.omit({ _id: true, fechaCreacion: true }).partial().extend({
    alcance: z.literal("Global"),
  }),
  RolClienteSchema.omit({ _id: true, fechaCreacion: true, cliente: true })
    .partial()
    .extend({ alcance: z.literal("Cliente") }),
  RolComplejoSchema.omit({
    _id: true,
    fechaCreacion: true,
    cliente: true,
    complejo: true,
  })
    .partial()
    .extend({ alcance: z.literal("Complejo") }),
]);

void VirtualesRolKeys;

export type AccionesRol = z.infer<typeof AccionesRolSchema>;
export type IAlcanceRol = z.infer<typeof AlcanceRolSchema>;
export type IRolGlobal = z.infer<typeof RolGlobalSchema>;
export type IRolCliente = z.infer<typeof RolClienteSchema>;
export type IRolComplejo = z.infer<typeof RolComplejoSchema>;
export type IRol = z.infer<typeof RolSchema>;
export type ICreateRol = z.infer<typeof CreateRolSchema>;
export type IUpdateRol = z.infer<typeof UpdateRolSchema>;
