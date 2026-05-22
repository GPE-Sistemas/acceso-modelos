# acceso-modelos

Schemas **Zod + tipos TypeScript** compartidos del sistema Acceso. Consumido como dependencia git por `acceso-datos`, `acceso-api` y `acceso-web`. **Se compila** vía `tsc` con `prepare` hook — `dist/index.js` y `dist/index.d.ts` se generan al instalar.

Para contexto del sistema completo ver `CLAUDE.md` en `acceso-documentacion-general/` (directorio hermano).

---

## v1 → v2 — cambios estructurales

| Aspecto | v1 | v2 |
|---|---|---|
| Source of truth | `interface I…` TS-only | Schema Zod + tipo inferido / declarado |
| Build | Sin compilar (importaba `acceso-modelos/src`) | `tsc` produce `dist/`. `prepare` hook |
| Importación | `from 'acceso-modelos/src'` | `from 'acceso-modelos'` |
| Constantes runtime en Node | Imposible (no había `src/index.js`) | OK directamente |
| Validación runtime | No existía | Cada `XSchema` valida con Zod |
| OpenAPI / Swagger | Sin soporte | `createZodDto` (`nestjs-zod`) genera DTOs y schemas Swagger |
| `src/externos/` (Chirpstack, OSRM, etc) | Re-exportado desde el paquete | Borrado |

**Migración de consumidores**: cambiar todos los imports `'acceso-modelos/src'` → `'acceso-modelos'`. En `acceso-web` borrar el `paths` alias del `tsconfig.json`. En backends Node ya pueden importar constantes (`CATEGORIAS_NOTIFICACION`, `NOTIF_PREFERENCIAS_DEFAULT`, etc) directo del paquete.

---

## Instalación y actualización

```json
// package.json de cada servicio
"dependencies": {
  "acceso-modelos": "git://github.com/GPE-Sistemas/acceso-modelos.git"
},
"scripts": {
  "modelos": "npm update acceso-modelos"
}
```

```bash
npm install           # primera vez (corre prepare → tsc)
npm run modelos       # actualizar a la última versión
```

---

## Importación

```typescript
// Tipos
import {
  IPermiso, IPermisoCliente, IPermisoComplejo,
  IRol, IRolGlobal, ICliente, IComplejo,
  IDocumento, IListado, IQueryParam, Exactly,
} from 'acceso-modelos';

// Schemas Zod
import {
  PermisoSchema, RolSchema, ClienteSchema,
  CreateAccesoSchema, UpdateAccesoSchema,
} from 'acceso-modelos';

// Constantes runtime
import {
  CATEGORIAS_NOTIFICACION,
  NOTIF_PREFERENCIAS_DEFAULT,
  PREFERENCIAS_CONTACTOS_DEFAULT,
} from 'acceso-modelos';
```

---

## Schemas Zod — convenciones

Versión: **Zod v4.x** (`zod ^4.4.3`). Usa la API canónica de v4: `z.object`, `z.strictObject`, `z.looseObject`. Los métodos `.passthrough()` / `.strict()` / `.strip()` siguen funcionando como deprecated aliases pero **no se usan** en este repo.

### Pattern único — toda entidad

Patrón uniforme: declarar el schema con `z.object()` (modo strip = default), derivar Create/Update con `.omit()` / `.partial()`, exportar tipos vía `z.infer<>`.

```typescript
export const FooSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  // ...
  // Populate
  cliente: ClienteSchema.optional(),
});

export const CreateFooSchema = FooSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
});

export const UpdateFooSchema = CreateFooSchema.partial();

export type IFoo = z.infer<typeof FooSchema>;
export type ICreateFoo = z.infer<typeof CreateFooSchema>;
export type IUpdateFoo = z.infer<typeof UpdateFooSchema>;
```

**No casts manuales** (`as z.ZodType<...>`). v4 mejoró la inferencia de tipos al punto que entidades con cadenas profundas de populate (IPermiso ⊃ IUsuario / IRol / ICliente / ...) ya no triggerean `TS7056`. Si en el futuro alguna combinación lo hace, primer intento es simplificar populates antes de volver al cast pattern.

### Discriminated unions

`IPermiso` (`nivel`) e `IRol` (`alcance`):

```typescript
export const PermisoClienteSchema = z.object({ ...PermisoBaseFields, nivel: z.literal("Cliente"), idCliente: z.string() });
export const PermisoComplejoSchema = z.object({ ...PermisoBaseFields, nivel: z.literal("Complejo"), idCliente: z.string(), idComplejo: z.string() });
export const PermisoUnidadFuncionalSchema = z.object({ ...PermisoBaseFields, nivel: z.literal("Unidad Funcional"), idCliente: z.string(), idComplejo: z.string(), idUnidadFuncional: z.string() });

export const PermisoSchema = z.discriminatedUnion("nivel", [
  PermisoClienteSchema,
  PermisoComplejoSchema,
  PermisoUnidadFuncionalSchema,
]);
```

`z.discriminatedUnion` requiere que cada miembro sea ZodObject. Heredan `.omit()`, `.partial()`, `.extend()` chainables si se aplican sobre los miembros antes del `discriminatedUnion`.

**Update de discriminated unions**: re-añadir el discriminante con `.extend({ nivel: z.literal(...) })` después de `.partial()` para que `nivel` siga siendo requerido y la unión siga siendo válida (sino los miembros parciales ya no son discriminables).

---

## Strip por defecto (cambio en v2.1.0)

**Todos los schemas usan `z.object()`** — modo strip por default. Campos no declarados se descartan al hacer `.parse()` (no genera error, pero no aparecen en el output).

**Por qué strip y no loose** (decisión revisada en v2.1.0):

- En v4, `z.looseObject()` agrega `[x: string]: unknown` al tipo inferido. Esto rompe la interop con clases Mongoose en `acceso-datos` (`implements Exactly<I, MongooseClass>` falla porque la clase no tiene index signature, y `IListado<MongooseDoc>` no asigna a `IListado<IFoo>`).
- En v3, `.passthrough()` era runtime-only (no afectaba el tipo) → coexistía con Mongoose sin fricción. v4 acopla runtime y type, así que toca elegir uno.
- Con strip + disciplina de versionado de `acceso-modelos` (campos nuevos primero acá, después en clientes), no se pierde nada práctico. El runtime descarta extras silenciosamente.

**Forward-compat opcional por endpoint** (en `acceso-api`):

```typescript
import { CreateFooSchema } from 'acceso-modelos';
import { createZodDto } from 'nestjs-zod';

// Strip default — descarta extras al parse
export class CreateFooDto extends createZodDto(CreateFooSchema) {}

// Si un endpoint puntual necesita aceptar campos no declarados sin descartarlos:
export class LooseCreateFooDto extends createZodDto(CreateFooSchema.loose()) {}

// Si querés rechazo estricto (error si llega un campo extra):
export class StrictCreateFooDto extends createZodDto(CreateFooSchema.strict()) {}
```

**Importante para campos sensibles**: aunque `z.object` strip descarta `_id`, `idCliente`, etc del body al parsear, los services de `acceso-api` deben sobrescribir scopes vía `injectScope` antes de llamar a `acceso-datos` (ya implementado).

---

## Interfaces de dominio (`src/interfaces/`)

| Archivo | Schemas y tipos principales |
|---|---|
| `acceso.ts` | `AccesoSchema` / `IAcceso`, `CreateAccesoSchema`, `UpdateAccesoSchema`, `TipoAccesoSchema` |
| `cliente.ts` | `ClienteSchema` / `ICliente`, `TipoClienteSchema`, `ConfigClienteSchema` |
| `complejo.ts` | `ComplejoSchema` / `IComplejo`, `TipoComplejoSchema`, `ConfigComplejoSchema`. **Sin `ConfigEmergenciasComplejoSchema`** (geofence movido a cada botón via `requiereDentroDelComplejo`) |
| `credencial-dispositivo.ts` | `CredencialDispositivoSchema` / `ICredencialDispositivo` |
| `dispositivo.ts` | `DispositivoSchema` / `IDispositivo`, `TipoDispositivoSchema`, `ConfigDispositivoSchema` |
| `dispositivo-acceso.ts` | `DispositivoAccesoSchema` / `IDispositivoAcceso`, `ComportamientoCredencialValidaSchema`, `ComportamientoCredencialInvalidaSchema` |
| `evento.ts` | `EventoSchema` / `IEvento` — estructura pendiente de definición |
| `evento-visita.ts` | `EventoVisitaSchema` / `IEventoVisita`, `RecurrenciaEventoVisitaSchema`, estados, aprobación. Campo `idTurno?` cuando el evento fue auto-generado desde un turno |
| `ingreso-egreso.ts` | `IngresoEgresoSchema` / `IIngresoEgreso`, `VisitanteSnapshotSchema`, `VehiculoSnapshotSchema` (snapshot inmutable). `CategoriaIngresoEgresoSchema` enum: `Propietario` \| `Visita` \| `Administración` \| `Guardia` \| `Prestador de Servicio`. Coherencia con `idPermiso.categoriaPermiso` validada en `acceso-api`. Entidad de alto volumen |
| `permiso.ts` | `PermisoSchema` / `IPermiso` — discriminated union por `nivel`. Variantes Cliente/Complejo/Unidad Funcional. `CategoriaPermisoSchema` (`Propietario` \| `Administración` \| `Guardia` \| `Prestador de Servicio`). `PermisoComplejoSchema.idsUnidadesFuncionales?` para Prestador. |
| `rol.ts` | `RolSchema` / `IRol` — discriminated union por `alcance`. `AccionesRolSchema` enumera todas las acciones del catálogo |
| `unidad-funcional.ts` | `UnidadFuncionalSchema` / `IUnidadFuncional`. Campo `imagenes?: string[]` con objectNames GCS (hasta 10 por UF, bucket público, carpeta `unidades-funcionales`) |
| `usuario.ts` | `UsuarioSchema` / `IUsuario`, `DatosPersonalesSchema` |
| `vehiculo.ts` | `VehiculoSchema` / `IVehiculo`, `DatosVehiculoSchema`. Campos `activo?: boolean` + `idPermisoCreador?: string` (soft-archive — índice único parcial sobre patente filtra por `activo: true`). Omitidos de Create/Update — los inyecta `acceso-api` |
| `vinculo-vehiculo.ts` | `VinculoVehiculoSchema` / `IVinculoVehiculo` |
| `vinculo-evento-ingreso.ts` | `VinculoEventoIngresoSchema` / `IVinculoEventoIngreso` |
| `visitante.ts` | `VisitanteSchema` / `IVisitante`. Campos `activo?: boolean` + `idPermisoCreador?: string` (soft-archive — índices únicos parciales sobre teléfono/DNI filtran por `activo: true`). Omitidos de Create/Update — los inyecta `acceso-api` |
| `publicacion.ts` | `PublicacionSchema` / `IPublicacion`, `BloqueSchema`, enums (`TipoBloqueSchema`, `CategoriaPublicacionSchema`, `EstadoPublicacionSchema`) |
| `device-token.ts` | `DeviceTokenSchema` / `IDeviceToken`, `DevicePlatformSchema` |
| `notificacion-preferencias.ts` | `NotificacionPreferenciasSchema` / `INotificacionPreferencias`, `CategoriaNotificacionSchema`, `CategoriasNotificacionMapSchema`, `CATEGORIAS_NOTIFICACION`, `NOTIF_PREFERENCIAS_DEFAULT`. Categorías de turnos: `turno_reservado`, `turno_pendiente_aprobacion`, `turno_aprobado`, `turno_rechazado`, `turno_cancelado`. Categorías de tickets para atendedores nivel Complejo: `ticket_emergencia_recibido` (guardia), `ticket_solicitud_recibido` (administración, cubre Solicitud + Reclamo). Categorías de encuestas para UF: `encuesta_abierta`, `encuesta_recordatorio`, `encuesta_cerrada` |
| `boton-ticket.ts` | `BotonTicketSchema` / `IBotonTicket`, `ConfigBotonTicketSchema`. Campo discriminante `categoria: CategoriaTicket` (`Emergencia` \| `Solicitud` \| `Reclamo`). Config incluye `permiteImagenes` y `requiereDentroDelComplejo` (geofence per-botón — reemplaza `complejo.config.emergencias.permitirFueraDelComplejo`). `categoria` inmutable post-creación |
| `config-botones-ticket-complejo.ts` | `ConfigBotonesTicketComplejoSchema` / `IConfigBotonesTicketComplejo` — uno por complejo; `idsBotones[]` define orden mobile (cubre las 3 categorías en una sola grilla) |
| `ticket.ts` | `TicketSchema` / `ITicket`, `CategoriaTicketSchema` (`Emergencia` \| `Solicitud` \| `Reclamo`), `EstadoTicketSchema` (`Pendiente` \| `EnAtencion` \| `Resuelta` \| `Descartada`), `UbicacionTicketSchema`, `BotonTicketSnapshotSchema` (snapshot inmutable del botón con `categoria` denormalizada). `ITicket.categoria` denormalizada desde el botón al crear |
| `interaccion-ticket.ts` | `InteraccionTicketSchema` / `IInteraccionTicket`, `TipoInteraccionTicketSchema`, `AccionExternaTicketSchema`. Tipo `Comentario` con texto libre — usado para registrar acción en solicitudes/reclamos (admin) |
| `mensaje-ticket.ts` | `MensajeTicketSchema` / `IMensajeTicket` |
| `contacto-usuario.ts` | `ContactoUsuarioSchema` / `IContactoUsuario`, `EstadoContactoUsuarioSchema` |
| `preferencias-contactos.ts` | `PreferenciasContactosSchema` / `IPreferenciasContactos`, `PREFERENCIAS_CONTACTOS_DEFAULT` |
| `dashboard.ts` | `DashboardComplejoSchema` / `IDashboardComplejo`, `DashboardUFSchema` / `IDashboardUF`, `DashboardClienteSchema` / `IDashboardCliente`, `DashboardProveedorSchema` / `IDashboardProveedor` |
| `tipo-actividad.ts` | `TipoActividadSchema` / `ITipoActividad` — catálogo de actividades por complejo (Tenis, Padel, Pileta, SUM…). Asocia un set de UFs Común como recursos. Campos: `nombre`, `descripcion`, `icono` (Material Symbol), `color`, `idsUnidadesFuncionales[]` |
| `plantilla-turno.ts` | `PlantillaTurnoSchema` / `IPlantillaTurno`, `ModalidadTurnoSchema`, `HorarioPlantillaSchema`. Define cómo se reserva: recursos (subset del tipo), modalidades (variantes c/ duración + cupo), horarios cortados por día, cupos por UF, anticipación, cancelación, no-show, datos participantes, max invitados |
| `turno.ts` | `TurnoSchema` / `ITurno`, `EstadoTurnoSchema`, `EstadoAprobacionTurnoSchema`, `ParticipantePropietarioTurnoSchema`, `ParticipanteInvitadoTurnoSchema`, `PlantillaTurnoSnapshotSchema`, `RecurrenciaTurnoSchema`. **Populates pesados (`plantilla`, `permiso`, etc.) declarados como `z.any()`** para no inflar inferencia TS7056. Campo `idEventoVisita?` para link al evento auto-generado al aprobar |
| `bloqueo-turnos.ts` | `BloqueoTurnosSchema` / `IBloqueoTurnos` — bloquea recursos en un rango horario (mantenimiento, eventos privados, feriados) |
| `grupo-unidad-funcional.ts` | `GrupoUnidadFuncionalSchema` / `IGrupoUnidadFuncional` — catálogo de grupos de UFs por complejo (cualquier tipo UF). Usado pa targeting de encuestas (alcance "Grupo"). Cache Redis completa. Acciones rol `Administración - Ver/Crear/Editar/Eliminar grupos UF` |
| `encuesta.ts` | `EncuestaSchema` / `IEncuesta`, `PreguntaEncuestaSchema` (embedded, hasta 50), `OpcionPreguntaEncuestaSchema` (embedded, hasta 20 por pregunta). Enums display-ready: `EstadoEncuestaSchema` (`Borrador`/`Abierta`/`Cerrada`), `AlcanceEncuestaSchema` (`Todas las UF`/`Grupo`), `SujetoRespuestaEncuestaSchema` (`Por permiso`/`Por UF`), `TipoPreguntaEncuestaSchema` (`Opción única`/`Opción múltiple`/`Escala`/`Texto libre`). Flags: `anonima` (render-only, DB persiste idPermiso+idUF), `permiteModificarRespuesta`, `resultadosVisiblesUF`, `obligatoria`, `recordatorioAntesDeCierreHs?`. Counter denormalizado `totalRespuestas`. Constantes `MAX_PREGUNTAS_ENCUESTA=50`, `MAX_OPCIONES_PREGUNTA=20`, `MAX_TEXTO_LIBRE_CHARS=2000` |
| `respuesta-encuesta.ts` | `RespuestaEncuestaSchema` / `IRespuestaEncuesta`, `RespuestaPreguntaSchema` (polimórfica por tipo: `idOpcion` / `idsOpciones[]` / `valorEscala` / `texto`). Siempre persiste `idPermiso` + `idUnidadFuncional` (anti-duplicación + auditoría) — `anonima` solo oculta en UI |

---

## Tipos utilitarios (`src/auxiliares/`)

```typescript
// Respuestas normalizadas de acceso-datos (genéricos)
DocumentoSchema(InnerSchema)            // builder de schemas runtime
ListadoSchema(InnerSchema)              // builder

interface IDocumento<T> { dato: T; duration?: number; }
interface IListado<T>   { datos: T[]; totalCount?: number; duration?: number; }

// Parámetros de consulta
QueryParamSchema                        // z.looseObject (loose mode)
interface IQueryParam { filter?: string; sort?: string; limit?: number; populate?: string; ... }

// Type-safety entre interface y clase Mongoose (acceso-datos)
type Exactly<T, U extends T> = T & { [K in Exclude<keyof U, keyof T>]: never };

// GeoJSON
GeoJSONPointSchema, GeoJSONPolygonSchema, GeoJSONMultiPolygonSchema, ...
```

---

## `AccionesRol` — agregar acciones nuevas

`AccionesRolSchema` (`src/interfaces/rol.ts`) es la fuente de verdad. Módulos: `Administración`, `Hardware`, `Visitas`, `Vehículos`, `Movimientos`, `Eventos`, `Publicaciones`, `Tickets`.

**Permisos — granularidad por categoría** (reemplazo de las genéricas `Administración - Crear permisos` y `Administración - Editar permisos`, eliminadas):

```
Administración - Crear permisos propietarios
Administración - Crear permisos administración
Administración - Crear permisos guardia
Administración - Crear permisos prestadores
Administración - Editar permisos propietarios
Administración - Editar permisos administración
Administración - Editar permisos guardia
Administración - Editar permisos prestadores
```

`POST /permisos` y `PUT /permisos/:id` usan `@RequiereCualquierAccion(...4)`; `PermisosService` valida que la acción específica matchee la `categoriaPermiso` del body (4xx si no). Permite que un admin de complejo de alta a guardias/prestadores sin poder crear otros administradores. Permisos no se eliminan (solo se deshabilitan vía Editar) — no existe `Administración - Eliminar permisos`.

**Movimientos — ver por categoría**:

```
Movimientos - Ver propietarios
Movimientos - Ver administración    (NEW)
Movimientos - Ver guardia           (NEW)
Movimientos - Ver prestadores       (NEW)
```

Los endpoints `GET /panel-guardia/<categoria>` requieren la acción correspondiente.

**Hardware** — `accesos`, `dispositivos`, `credenciales`, `dispositivos acceso`.

**Visitas** — `Ver/Crear/Editar/Eliminar eventos`, `Aprobar eventos`, `Aprobar eventos recurrentes` (auto-aprobación al crear y autoriza `PUT /eventos-visita/:id/aprobacion-recurrente`; típicamente nivel Complejo), `Ver/Crear/Editar/Eliminar visitantes`.

**Tickets** — `Ver/Crear/Editar/Eliminar botones`, `Ver/Editar configuración`, `Enviar ticket` (mobile UF). Operación separada por categoría:
- Emergencias: `Ver emergencias` + `Atender emergencias` (guardia) + `Eliminar emergencias`.
- Solicitudes/Reclamos: `Ver solicitudes` + `Atender solicitudes` (administración) — cubre ambas categorías.

Separación intencional para que un permiso guardia atienda emergencias sin tocar reclamos y un permiso admin atienda solicitudes/reclamos sin acceso a emergencias.

**Turnos** — Configuración: `Ver/Crear/Editar/Eliminar tipos actividad`, `Ver/Crear/Editar/Eliminar plantillas`, `Ver/Crear/Editar/Eliminar bloqueos`. Operación: `Ver turnos`, `Crear turno` (default rol UF), `Editar turnos`, `Cancelar turnos`. Aprobaciones: `Aprobar turnos` (UF, paralelo a Visitas), `Aprobar turnos recurrentes` (típicamente Complejo). Guardia: `Marcar no-show`, `Marcar completado`, `Marcar luz`.

**Encuestas** — Gestión (Complejo): `Ver/Crear/Editar/Eliminar/Cerrar encuestas`. Resultados: `Ver resultados`, `Exportar resultados` (CSV). Respuesta (UF): `Responder encuestas` — **no migrada al rol UF default**; admin asigna manual al rollout. Grupos UF: `Administración - Ver/Crear/Editar/Eliminar grupos UF`.

Para agregar acciones:
1. Agregar al `z.enum([...])` en `AccionesRolSchema`
2. `npm run build`, push al repo
3. `npm run modelos` en cada servicio

**Workaround hasta hacer push**: editar `node_modules/acceso-modelos/dist/interfaces/rol.js` y `.d.ts` para reflejar la acción nueva en el servicio local (o build local con `npm run build` desde `node_modules/acceso-modelos`).

---

## Snapshots inmutables — visitantes / vehículo / botón

Para que el historial sobreviva a edits o hard delete del catálogo UF, las entidades "consumidoras" persisten un snapshot inmutable de las referencias al momento de materializarse.

| Entidad | Campo snapshot | Cuándo se setea |
|---|---|---|
| `IIngresoEgreso` | `visitantesSnapshot[]` (`{ idVisitante, datosPersonales }`), `vehiculoSnapshot` (`{ idVehiculo, datosVehiculo }`) | `POST /ingresos-egresos` y `PUT /ingresos-egresos/:id/resolver` (si cambian visitantes/vehículo) |
| `ITicket` | `botonSnapshot` (`{ idBoton, texto, icono, color, categoria }`) | `POST /tickets`. Snapshot incluye `categoria` para que el render histórico no dependa del catálogo vivo |

Quien renderiza historial **siempre** debe usar el snapshot. `idsVisitantes` / `idVehiculo` / `idBoton` siguen como referencias de trazabilidad, pero el catálogo subyacente puede haberse eliminado o editado. `IEventoVisita` NO tiene snapshot — los eventos Pendientes/Activos referencian catálogo vivo (editable). Una vez generados los ingresos asociados, el snapshot vive en `IIngresoEgreso`.

## Soft-archive — visitantes / vehículos

`IVisitante` e `IVehiculo` llevan `activo?: boolean` + `idPermisoCreador?: string` para soportar rotación de dueños de UF sin chocar con unicidad (teléfono/DNI/patente). `acceso-datos` indexa unique parcial sobre `activo: true` → archivados quedan fuera del índice, un nuevo activo en la misma UF puede reusar el mismo valor sin colisión. `acceso-api.scope.helper` filtra listados con `{ activo: { $ne: false } }`; el archive masivo (`PUT /<entidad>/archivar-por-uf/:idUF`) lo dispara `PermisosService.deshabilitar` cuando se desactiva el último permiso UF activo. Campos omitidos de `Create*` y `Update*` — los inyecta `acceso-api` en el create (`activo=true`, `idPermisoCreador=user.idPermiso`) y nadie los edita directo.

## `CategoriaPermiso` — clasificación del portador

Enum independiente del `nivel` y de los roles asignados:

```ts
"Propietario" | "Administración" | "Guardia" | "Prestador de Servicio"
```

**Defaults aplicados por `acceso-api` al crear (`PermisosService.create`):**

| Nivel | Default | Notas |
|---|---|---|
| `Unidad Funcional` | `Propietario` | Auto-asignado, único válido |
| `Cliente` | `Administración` | Auto-asignado, único válido |
| `Complejo` | — (requerido) | Elegir entre `Administración \| Guardia \| Prestador de Servicio` |

**`IPermisoComplejo.idsUnidadesFuncionales?`**: solo se popula cuando `categoriaPermiso === 'Prestador de Servicio'`. Cada id debe apuntar a una `IUnidadFuncional` del mismo `idComplejo` con `tipo='Común'` (validación en `acceso-api`). Ausente o vacío = prestador general del complejo (sin restricción de UF).

**Inmutabilidad post-creación**: `categoriaPermiso` no se puede cambiar (`PermisosService.update` → 409). Para cambiar de categoría, crear un permiso nuevo y deshabilitar el anterior.

**Populate `unidadesFuncionales`**: declarado en Mongoose (`acceso-datos`) pero **no** en el `PermisoComplejoSchema` Zod para evitar `TS7056` por profundidad de inferencia en cadenas de populate (IPermiso ⊂ IIngresoEgreso ⊂ IVinculoEventoIngreso). Consumers que populen `unidadesFuncionales` tratan el campo como `(permiso as any).unidadesFuncionales` o tipan ad-hoc.

## Ventana de vigencia — `PermisoUnidadFuncionalSchema`

Variante UF tiene dos campos opcionales que delimitan el período en el que ese permiso "ve" historial:

- `fechaInicioVigencia?: string` (ISO). Si ausente, `AccionesGuard` en acceso-api hace fallback a `fechaCreacion`. Soporta alta diferida o retroactiva.
- `fechaFinVigencia?: string`. `null`/ausente = vigente. Una vez seteado el permiso queda **inmutable** (no se reactiva). Se setea solo al desactivar el permiso (`DELETE /permisos/:id` en acceso-api cuando nivel UF).

`UpdatePermisoSchema` variante UF omite ambos campos — no editables vía update genérico. `CreatePermisoSchema` UF omite `fechaFinVigencia` (no se nace desactivado) pero acepta `fechaInicioVigencia`.

Para cortar historial al cambiar de dueño una UF: setear `fechaFinVigencia` en permisos salientes y crear nuevos con `fechaInicioVigencia=now`. La UF y catálogos no se tocan; cada permiso ve únicamente su ventana temporal.

---

## Convenciones

- **Campos populate** (virtuals): no se persisten en Mongo, solo para respuestas enriquecidas. En schemas Zod son `Schema.optional()` referenciando otros schemas.
- **`Create*`**: omite `_id`, `fechaCreacion` y campos populate.
- **`Update*`**: derivado de `Create*` con `.partial()`. Discriminated unions extienden con `nivel` / `alcance` literal requerido.
- **Fechas**: `string` ISO 8601.
- **MongoDB ObjectIds**: `string`.
- **`IPermiso` / `IRol`**: discriminated unions. No usar `Exactly<>` en sus schemas Mongoose en `acceso-datos`.
- **Snapshots** (`visitantesSnapshot`, `vehiculoSnapshot`, `botonSnapshot`): inmutables. Render histórico los usa siempre; populate vivo es fallback solo para datos pre-snapshot.
