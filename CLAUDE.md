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
| `complejo.ts` | `ComplejoSchema` / `IComplejo`, `TipoComplejoSchema`, `ConfigComplejoSchema`, `ConfigEmergenciasComplejoSchema` |
| `credencial-dispositivo.ts` | `CredencialDispositivoSchema` / `ICredencialDispositivo` |
| `dispositivo.ts` | `DispositivoSchema` / `IDispositivo`, `TipoDispositivoSchema`, `ConfigDispositivoSchema` |
| `dispositivo-acceso.ts` | `DispositivoAccesoSchema` / `IDispositivoAcceso`, `ComportamientoCredencialValidaSchema`, `ComportamientoCredencialInvalidaSchema` |
| `evento.ts` | `EventoSchema` / `IEvento` — estructura pendiente de definición |
| `evento-visita.ts` | `EventoVisitaSchema` / `IEventoVisita`, `RecurrenciaEventoVisitaSchema`, estados, aprobación |
| `ingreso-egreso.ts` | `IngresoEgresoSchema` / `IIngresoEgreso`. Entidad de alto volumen |
| `permiso.ts` | `PermisoSchema` / `IPermiso` — discriminated union por `nivel`. Variantes Cliente/Complejo/Unidad Funcional |
| `rol.ts` | `RolSchema` / `IRol` — discriminated union por `alcance`. `AccionesRolSchema` enumera todas las acciones del catálogo |
| `unidad-funcional.ts` | `UnidadFuncionalSchema` / `IUnidadFuncional` |
| `usuario.ts` | `UsuarioSchema` / `IUsuario`, `DatosPersonalesSchema` |
| `vehiculo.ts` | `VehiculoSchema` / `IVehiculo`, `DatosVehiculoSchema` |
| `vinculo-vehiculo.ts` | `VinculoVehiculoSchema` / `IVinculoVehiculo` |
| `vinculo-evento-ingreso.ts` | `VinculoEventoIngresoSchema` / `IVinculoEventoIngreso` |
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
| `dashboard.ts` | `DashboardComplejoSchema` / `IDashboardComplejo`, `DashboardUFSchema` / `IDashboardUF`, `DashboardClienteSchema` / `IDashboardCliente`, `DashboardProveedorSchema` / `IDashboardProveedor` |

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
