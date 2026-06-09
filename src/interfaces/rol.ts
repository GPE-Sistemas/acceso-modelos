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
  // Permisos — no se eliminan ('Administración - Eliminar permisos' no existe): solo se deshabilitan vía Editar.
  // Crear/Editar son granulares por categoriaPermiso para permitir que un admin de complejo
  // pueda dar de alta guardias/prestadores pero no otros administradores.
  "Administración - Ver permisos",
  "Administración - Crear permisos propietarios",
  "Administración - Crear permisos administración",
  "Administración - Crear permisos guardia",
  "Administración - Crear permisos prestadores",
  "Administración - Crear permisos mantenimiento",
  "Administración - Editar permisos propietarios",
  "Administración - Editar permisos administración",
  "Administración - Editar permisos guardia",
  "Administración - Editar permisos prestadores",
  "Administración - Editar permisos mantenimiento",
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
  // Grupos de unidades funcionales (targeting para encuestas y futuros usos)
  "Administración - Ver grupos UF",
  "Administración - Crear grupos UF",
  "Administración - Editar grupos UF",
  "Administración - Eliminar grupos UF",
  // Notificaciones del complejo (push manual a residentes UF: complejo / grupo UF / UF / permiso)
  "Administración - Ver notificaciones",
  "Administración - Enviar notificaciones",
  // Usuarios
  "Administración - Ver usuarios",
  "Administración - Crear usuarios",
  "Administración - Editar usuarios",
  "Administración - Eliminar usuarios",
  "Administración - Deshabilitar / habilitar usuarios",
  // Empleados (nómina de personal del complejo — vincula 1:1 a un permiso de complejo)
  "Administración - Ver empleados",
  "Administración - Crear empleados",
  "Administración - Editar empleados",
  "Administración - Eliminar empleados",

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
  // Verificación on-demand del enrolamiento contra el device + re-enrolar
  // (spec 32 §10.2, doc 29 §9).
  "Hardware - Sincronizar users/caras al dispositivo",
  "Hardware - Ver dispositivos acceso",
  "Hardware - Crear dispositivos acceso",
  "Hardware - Editar dispositivos acceso",
  "Hardware - Eliminar dispositivos acceso",
  // Credenciales lógicas (capa ICredencial, spec 32 §3.5). Una sola acción cubre
  // crear/ver/editar/revocar: el propietario (nivel UF) opera solo lo suyo; el
  // admin (Complejo) on-behalf sobre cualquier propietario del complejo (por eso
  // el nombre NO dice "propia"). El enrolamiento al hardware es automático (edge);
  // su revisión/reintento usa las acciones `Hardware - *credenciales`.
  "Credencial - Cargar credencial",
  // Discovery LAN del edge (H-DEV-4). Doc 28-discovery-lan-edge.md.
  "Hardware - Ver dispositivos descubiertos",
  "Hardware - Adoptar dispositivo descubierto",
  "Hardware - Ignorar descubrimiento",
  // Adopción funcional terminal HIK (H-DEV-5). Doc 29-hik-terminal-adopcion.md.
  // Notas:
  //  - Bulk push initial + cron incremental 5min son automaticos del agent
  //    edge — no son decisión de operador, no hay acción de rol.
  //  - Resolución cara→dispositivos deriva del cruce permiso × IAcceso ×
  //    IDispositivoAcceso (sin overrides explicitos por permiso). Doc 29.
  "Hardware - Apertura remota dispositivo",
  "Hardware - Test cred dispositivo",
  "Hardware - Ver eventos crudos del dispositivo",
  // Estado/conexión + métricas en vivo del dispositivo (H-DEV-8).
  // Doc 29-hik-terminal-adopcion.md § Monitoreo runtime.
  "Hardware - Ver estado/métricas dispositivo",

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
  // Visitantes globales del complejo (pool seleccionable por todas las UF).
  // Gestión exclusiva nivel Complejo. Cualquier UF con "Ver visitantes" los ve
  // por scope; estas acciones gatean alta/edición/baja del pool global.
  "Visitas - Crear visitantes globales",
  "Visitas - Editar visitantes globales",
  "Visitas - Eliminar visitantes globales",

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
  "Movimientos - Ver administración",
  "Movimientos - Ver guardia",
  "Movimientos - Ver prestadores",
  "Movimientos - Ver mantenimiento",
  "Movimientos - Ver visitas activas",
  "Movimientos - Buscar visitantes",
  "Movimientos - Buscar vehiculos",
  "Movimientos - Ver vinculos evento ingreso",
  "Movimientos - Crear vinculos evento ingreso",
  "Movimientos - Eliminar vinculos evento ingreso",

  // MODULO PUBLICACIONES
  "Publicaciones - Ver publicaciones",
  "Publicaciones - Crear publicaciones",
  "Publicaciones - Editar publicaciones",
  "Publicaciones - Eliminar publicaciones",

  // MODULO ENCUESTAS
  // Creación / gestión (Complejo)
  "Encuestas - Ver encuestas",
  "Encuestas - Crear encuestas",
  "Encuestas - Editar encuestas", // solo estado=Borrador
  "Encuestas - Eliminar encuestas", // hard delete solo Borrador
  "Encuestas - Cerrar encuestas", // cierre manual antes de fechaCierre
  "Encuestas - Ver resultados",
  "Encuestas - Exportar resultados",
  // Respuesta (UF) — no migrada al rol UF default, admin asigna manual
  "Encuestas - Responder encuestas",

  // MODULO TICKETS (emergencias + solicitudes + reclamos)
  // Botones — catálogo común
  "Tickets - Ver botones",
  "Tickets - Crear botones",
  "Tickets - Editar botones",
  "Tickets - Eliminar botones",
  // Configuración por complejo (qué botones y orden ve la app mobile)
  "Tickets - Ver configuración",
  "Tickets - Editar configuración",
  // Envío desde mobile (UF) — separados por categoría
  "Tickets - Enviar emergencia",
  "Tickets - Enviar solicitud",
  // Atención emergencias (guardia del complejo)
  "Tickets - Ver emergencias",
  "Tickets - Atender emergencias", // tomar caso, cambiar estado, registrar interacciones, chatear
  "Tickets - Eliminar emergencias",
  // Atención solicitudes / reclamos (administración del complejo)
  "Tickets - Ver solicitudes",
  "Tickets - Atender solicitudes",
  "Tickets - Eliminar solicitudes",

  // MODULO TURNOS
  // Catálogo + plantillas (admin del complejo)
  "Turnos - Ver tipos actividad",
  "Turnos - Crear tipos actividad",
  "Turnos - Editar tipos actividad",
  "Turnos - Eliminar tipos actividad",
  "Turnos - Ver plantillas",
  "Turnos - Crear plantillas",
  "Turnos - Editar plantillas",
  "Turnos - Eliminar plantillas",
  // Bloqueos de disponibilidad
  "Turnos - Ver bloqueos",
  "Turnos - Crear bloqueos",
  "Turnos - Editar bloqueos",
  "Turnos - Eliminar bloqueos",
  // Operación turnos
  "Turnos - Ver turnos",
  "Turnos - Crear turno", // mobile UF, default en rol UF
  "Turnos - Cancelar turnos", // admin cancela cualquier turno
  "Turnos - Editar turnos", // admin edita turno tomado
  "Turnos - Aprobar turnos", // permiso UF aprueba a otro de la misma UF (paralelo Visitas)
  "Turnos - Aprobar turnos recurrentes", // típicamente nivel Complejo
  "Turnos - Marcar no-show", // guardia
  "Turnos - Marcar completado", // guardia confirma que el turno se cumplió
  "Turnos - Marcar luz", // guardia activa flag luzActivada

  // MODULO EXPENSAS (administración del complejo — cloud-only)
  // Configuración de cálculo (conceptos + mora)
  "Expensas - Ver configuración",
  "Expensas - Editar configuración",
  // Liquidaciones (cabecera por complejo+período)
  "Expensas - Ver liquidaciones",
  "Expensas - Generar liquidaciones", // genera/recalcula en Borrador
  "Expensas - Emitir liquidaciones", // Borrador → Emitida/Cerrada
  "Expensas - Eliminar liquidaciones", // hard delete solo Borrador
  // Recibos + estado de cuentas
  "Expensas - Ver recibos",
  "Expensas - Ver estado de cuentas",
  // Mobile UF: ver las expensas propias de su unidad
  "Expensas - Ver mis expensas",
  // Pagos (sin pasarela — solo registro)
  "Expensas - Registrar pagos",
  "Expensas - Ver pagos",
  "Expensas - Eliminar pagos",

  // MODULO INFRACCIONES (multas + apercibimientos — administración del complejo, cloud-only)
  // Multas
  "Infracciones - Ver multas",
  "Infracciones - Crear multas", // crea en Borrador
  "Infracciones - Emitir multas", // Borrador → Emitida (asigna nro correlativo)
  "Infracciones - Anular multas",
  "Infracciones - Eliminar multas", // hard delete solo Borrador
  // Pagos de multas (cobro aparte — sin pasarela)
  "Infracciones - Registrar pagos",
  // Mobile UF: ver las multas propias de su unidad (futuro)
  "Infracciones - Ver mis multas",
  // Configuración (política de mora de multas)
  "Infracciones - Ver configuración",
  "Infracciones - Editar configuración",
  // Apercibimientos / infracciones (sin monto)
  "Infracciones - Ver infracciones",
  "Infracciones - Crear infracciones",
  "Infracciones - Anular infracciones",
  "Infracciones - Escalar a multa", // crea una multa Borrador desde la infracción
  "Infracciones - Eliminar infracciones", // hard delete solo Borrador

  // MODULO EGRESOS (proveedores + gastos — administración del complejo, cloud-only)
  // Configuración (categorías de gasto + presupuesto por categoría)
  "Egresos - Ver configuración",
  "Egresos - Editar configuración",
  // Proveedores (catálogo por complejo, soft-archive)
  "Egresos - Ver proveedores",
  "Egresos - Crear proveedores",
  "Egresos - Editar proveedores",
  "Egresos - Eliminar proveedores",
  // Gastos
  "Egresos - Ver gastos",
  "Egresos - Crear gastos",
  "Egresos - Editar gastos",
  "Egresos - Eliminar gastos",
  // Pagos a proveedores (sin pasarela — solo registro)
  "Egresos - Registrar pagos",
  "Egresos - Ver pagos",
  "Egresos - Eliminar pagos",
  // Reportes
  "Egresos - Ver balance", // cruce ingresos vs egresos por período
  "Egresos - Ver cuenta corriente", // saldo por proveedor

  // MODULO EDGE APPLIANCES (control de accesos on-premise)
  // Típicamente Cliente nivel 1 (integrador). El complejo no las ve.
  "EdgeAppliance - Ver appliances",
  "EdgeAppliance - Provisionar appliance",
  // Cubre decomiso reversible (revoca credenciales del agent, marca
  // estado='Decomisado') y purge físico (hard delete + cascade FKs + snapshot
  // a edge-appliance-purges). Un solo permiso por destructividad: si tenés
  // alcance para decomisar, lo tenés para borrar.
  "EdgeAppliance - Decomisar / borrar",
  "EdgeAppliance - Ver telemetría / sync status",
  "EdgeAppliance - Forzar resync",
  "EdgeAppliance - Acceso debug",
  "EdgeAppliance - Asignar dispositivo",
  "EdgeAppliance - Reasignar shard",
  "EdgeAppliance - Ver capacidad y utilización",
  "EdgeAppliance - Ver hardware detectado",
  "EdgeAppliance - Re-detectar hardware",
  // E.S1c / D30 — dispara comandos operativos NATS (sync-snapshot,
  // restart-service, cert-renew, update-image, rekey). Acción
  // separada de "Provisionar" para granularidad: operadores que solo
  // despachan comandos sin permisos de creación/borrado de appliances.
  "EdgeAppliance - Enviar comandos",
  // E.S1d / D32 — lee logs unitarios del appliance vía NATS request/reply
  // (journalctl + install.log). Separada de "Ver appliances" porque los
  // logs contienen IPs, stack traces y otros datos sensibles.
  "EdgeAppliance - Ver logs",
  // 25-hub-edge-arquitectura.md — sección "Estado / Integridad" del Hub
  // edge servida por GET /diagnostico del agent local. Granularidad
  // distinta a "Ver telemetría / sync status" (admin integrador
  // cross-edge): esta es la vista operativa del propio edge del complejo,
  // típicamente asignada al operador del complejo.
  "EdgeAppliance - Ver integridad",

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
