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

### Pattern básico (entidad simple)

```typescript
export const FooSchema = z.object({
  _id: z.string().optional(),
  // ...
}).passthrough();

export const CreateFooSchema = FooSchema.omit({ _id: true, fechaCreacion: true });
export const UpdateFooSchema = CreateFooSchema.partial();

export type IFoo = z.infer<typeof FooSchema>;
export type ICreateFoo = z.infer<typeof CreateFooSchema>;
export type IUpdateFoo = z.infer<typeof UpdateFooSchema>;
```

### Pattern con cast (entidades con muchos populates)

Cuando una entidad popula varias entidades (transitivamente, IPermiso → IUsuario, IRol, ICliente, etc), TS hace explotar el tipo inferido (`TS7056: type exceeds maximum length`). Workaround: declarar la interface a mano y castear el schema en el export.

```typescript
export interface IFoo {
  _id?: string;
  // ...
  cliente?: ICliente;       // populate
  permiso?: IPermiso;       // populate
  [key: string]: any;       // passthrough refleja en el tipo
}

const _FooSchema = z.object({ /* ... */ }).passthrough();
const _CreateFooSchema = _FooSchema.omit({ /* ... */ });

export const FooSchema: z.ZodType<IFoo> = _FooSchema as unknown as z.ZodType<IFoo>;
export const CreateFooSchema: z.ZodType<ICreateFoo> = _CreateFooSchema as unknown as z.ZodType<ICreateFoo>;
```

Aplica a: `permiso`, `evento-visita`, `ingreso-egreso`, `vinculo-vehiculo`, `vinculo-evento-ingreso`, partes de `dashboard`. Mantener interface y schema sincronizados — TS no detecta divergencias gracias al `as unknown as`.

### Discriminated unions

```typescript
export const PermisoSchema = z.discriminatedUnion("nivel", [
  PermisoClienteSchema,            // nivel: z.literal("Cliente")
  PermisoComplejoSchema,           // nivel: z.literal("Complejo")
  PermisoUnidadFuncionalSchema,    // nivel: z.literal("Unidad Funcional")
]);
```

---

## Pasthrough por defecto

**Todos los schemas usan `.passthrough()`** — campos no declarados pasan al output sin error. Implica:

- Forward-compat: el backend puede recibir bodies con campos nuevos y reenviarlos a `acceso-datos` sin romper.
- **Riesgo**: un `Create*Dto` no descarta campos como `_id` si el cliente los manda. La capa de `acceso-datos` (Mongo) genera su propio `_id` ignorando el del body, pero campos sensibles como `idCliente` / `idComplejo` / `idPermisoCarga` deben sobrescribirse en el service vía `injectScope` (ya implementado en `acceso-api`).

Si en el futuro se prefiere rechazo estricto sobre algún DTO específico, usar `.strict()` localmente al definir el `createZodDto` del endpoint.

---

## Interfaces de dominio (`src/interfaces/`)

| Archivo | Schemas y tipos principales |
|---|---|
| `acceso.ts` | `AccesoSchema` / `IAcceso`, `CreateAccesoSchema`, `UpdateAccesoSchema`, `TipoAccesoSchema` |
| `cliente.ts` | `ClienteSchema` / `ICliente`, `TipoClienteSchema`, `ConfigClienteSchema` |
| `complejo.ts` | `ComplejoSchema` / `IComplejo`, `TipoComplejoSchema`, `ConfigComplejoSchema`, `ConfigEmergenciasComplejoSchema` |
| `credencial-dispositivo.ts` | `CredencialDispositivoSchema` / `ICredencialDispositivo` |
| `dispositivo.ts` | `DispositivoSchema` / `IDispositivo`, `TipoDispositivoSchema`, `ConfigDispositivoSchema` |
| `dispositivo-acceso.ts` | `DispositivoAccesoSchema` / `IDispositivoAcceso`, `ComportamientoCredencialValidaSchema`, `ComportamientoCredencialInvalidaSchema` |
| `evento.ts` | `EventoSchema` / `IEvento` — estructura pendiente de definición |
| `evento-visita.ts` | `EventoVisitaSchema` / `IEventoVisita` (con cast — populate complejo), `RecurrenciaEventoVisitaSchema`, estados, aprobación |
| `ingreso-egreso.ts` | `IngresoEgresoSchema` / `IIngresoEgreso` (con cast). Entidad de alto volumen |
| `permiso.ts` | `PermisoSchema` / `IPermiso` — discriminated union por `nivel`. Variantes Cliente/Complejo/Unidad Funcional. Casted (TS7056) |
| `rol.ts` | `RolSchema` / `IRol` — discriminated union por `alcance`. `AccionesRolSchema` enumera todas las acciones del catálogo |
| `unidad-funcional.ts` | `UnidadFuncionalSchema` / `IUnidadFuncional` |
| `usuario.ts` | `UsuarioSchema` / `IUsuario`, `DatosPersonalesSchema` |
| `vehiculo.ts` | `VehiculoSchema` / `IVehiculo`, `DatosVehiculoSchema` |
| `vinculo-vehiculo.ts` | `VinculoVehiculoSchema` / `IVinculoVehiculo` (casted) |
| `vinculo-evento-ingreso.ts` | `VinculoEventoIngresoSchema` / `IVinculoEventoIngreso` (casted) |
| `visitante.ts` | `VisitanteSchema` / `IVisitante` |
| `publicacion.ts` | `PublicacionSchema` / `IPublicacion`, `BloqueSchema`, enums (`TipoBloqueSchema`, `CategoriaPublicacionSchema`, `EstadoPublicacionSchema`) |
| `device-token.ts` | `DeviceTokenSchema` / `IDeviceToken`, `DevicePlatformSchema` |
| `notificacion-preferencias.ts` | `NotificacionPreferenciasSchema` / `INotificacionPreferencias`, `CategoriaNotificacionSchema`, `CategoriasNotificacionMapSchema`, `CATEGORIAS_NOTIFICACION`, `NOTIF_PREFERENCIAS_DEFAULT` |
| `boton-emergencia.ts` | `BotonEmergenciaSchema` / `IBotonEmergencia`, `ConfigBotonEmergenciaSchema` |
| `config-botones-complejo.ts` | `ConfigBotonesComplejoSchema` / `IConfigBotonesComplejo` — uno por complejo; `idsBotones[]` define orden mobile |
| `emergencia.ts` | `EmergenciaSchema` / `IEmergencia`, `EstadoEmergenciaSchema`, `UbicacionEmergenciaSchema` |
| `interaccion-emergencia.ts` | `InteraccionEmergenciaSchema` / `IInteraccionEmergencia`, `TipoInteraccionEmergenciaSchema`, `AccionExternaEmergenciaSchema` |
| `mensaje-emergencia.ts` | `MensajeEmergenciaSchema` / `IMensajeEmergencia` |
| `contacto-usuario.ts` | `ContactoUsuarioSchema` / `IContactoUsuario`, `EstadoContactoUsuarioSchema` |
| `preferencias-contactos.ts` | `PreferenciasContactosSchema` / `IPreferenciasContactos`, `PREFERENCIAS_CONTACTOS_DEFAULT` |
| `dashboard.ts` | `DashboardComplejoSchema` / `IDashboardComplejo`, `DashboardUFSchema` / `IDashboardUF`, `DashboardClienteSchema` / `IDashboardCliente`, `DashboardProveedorSchema` / `IDashboardProveedor` (varias casted) |

---

## Tipos utilitarios (`src/auxiliares/`)

```typescript
// Respuestas normalizadas de acceso-datos (genéricos)
DocumentoSchema(InnerSchema)            // builder de schemas runtime
ListadoSchema(InnerSchema)              // builder

interface IDocumento<T> { dato: T; duration?: number; }
interface IListado<T>   { datos: T[]; totalCount?: number; duration?: number; }

// Parámetros de consulta
QueryParamSchema                        // Zod schema con passthrough
interface IQueryParam { filter?: string; sort?: string; limit?: number; populate?: string; ... }

// Type-safety entre interface y clase Mongoose (acceso-datos)
type Exactly<T, U extends T> = T & { [K in Exclude<keyof U, keyof T>]: never };

// GeoJSON
GeoJSONPointSchema, GeoJSONPolygonSchema, GeoJSONMultiPolygonSchema, ...
```

---

## `AccionesRol` — agregar acciones nuevas

`AccionesRolSchema` (`src/interfaces/rol.ts`) es la fuente de verdad. Módulos: `Administración`, `Hardware`, `Visitas`, `Vehículos`, `Movimientos`, `Eventos`, `Publicaciones`, `Emergencias`.

**Hardware** — `accesos`, `dispositivos`, `credenciales`, `dispositivos acceso`.

**Visitas** — `Ver/Crear/Editar/Eliminar eventos`, `Aprobar eventos`, `Aprobar eventos recurrentes` (auto-aprobación al crear y autoriza `PUT /eventos-visita/:id/aprobacion-recurrente`; típicamente nivel Complejo), `Ver/Crear/Editar/Eliminar visitantes`.

**Emergencias** — `Ver/Crear/Editar/Eliminar botones`, `Ver/Editar configuración`, `Enviar emergencia` (mobile UF), `Ver emergencias` + `Atender emergencias` (panel guardia), `Eliminar emergencias`.

Para agregar acciones:
1. Agregar al `z.enum([...])` en `AccionesRolSchema`
2. `npm run build`, push al repo
3. `npm run modelos` en cada servicio

**Workaround hasta hacer push**: editar `node_modules/acceso-modelos/dist/interfaces/rol.js` y `.d.ts` para reflejar la acción nueva en el servicio local (o build local con `npm run build` desde `node_modules/acceso-modelos`).

---

## Convenciones

- **Campos populate** (virtuals): no se persisten en Mongo, solo para respuestas enriquecidas. En schemas Zod son `Schema.optional()` referenciando otros schemas.
- **`Create*`**: omite `_id`, `fechaCreacion` y campos populate.
- **`Update*`**: derivado de `Create*` con `.partial()`. Discriminated unions extienden con `nivel` / `alcance` literal requerido.
- **Fechas**: `string` ISO 8601.
- **MongoDB ObjectIds**: `string`.
- **`IPermiso` / `IRol`**: discriminated unions. No usar `Exactly<>` en sus schemas Mongoose en `acceso-datos`.
