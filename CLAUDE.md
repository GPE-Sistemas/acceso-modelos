# acceso-modelos

Interfaces TypeScript compartidas del sistema Acceso. Consumido como dependencia por `acceso-datos`, `acceso-api`, `acceso-dispositivos` y `acceso-web`. **No se compila** — los `.ts` se importan directamente en tiempo de desarrollo. No genera ningún runtime artifact.

Para contexto del sistema completo ver `CLAUDE.md` en `acceso-documentacion-general/` (directorio hermano).

---

## Instalación y actualización

```json
// package.json de cada servicio
"dependencies": {
  "acceso-modelos": "git://github.com/GPE-Sistemas/acceso-modelos.git"
},
"scripts": {
  "modelos": "yarn upgrade acceso-modelos"
}
```

```bash
yarn install          # primera vez
npm run modelos       # actualizar a la última versión
```

En `acceso-web`, `tsconfig.json` tiene un `paths` alias que resuelve `acceso-modelos/src` al TypeScript en `node_modules`.

---

## Importación

```typescript
import { IPermiso, IPermisoCliente, IPermisoComplejo } from 'acceso-modelos/src';
import { IRol, IRolGlobal, ICliente, IComplejo } from 'acceso-modelos/src';
import { IDocumento, IListado, IQueryParam, Exactly } from 'acceso-modelos/src';
```

---

## Interfaces de dominio (`src/interfaces/`)

| Archivo | Interfaces principales |
|---|---|
| `acceso.ts` | `IAcceso`, `ICreateAcceso`, `IUpdateAcceso` |
| `cliente.ts` | `ICliente`, `ITipoCliente`, `ICreateCliente`, `IUpdateCliente` |
| `complejo.ts` | `IComplejo`, `ITipoComplejo`, `ICreateComplejo`, `IUpdateComplejo` |
| `credencial-dispositivo.ts` | `ICredencialDispositivo`, `ICreateCredencialDispositivo` |
| `dispositivo.ts` | `IDispositivo`, `ICreateDispositivo`, `IUpdateDispositivo`, `IConfigDispositivo` |
| `dispositivo-acceso.ts` | `IDispositivoAcceso`, `ICreateDispositivoAcceso`, `IUpdateDispositivoAcceso`, `IComportamientoCredencialValida`, `IComportamientoCredencialInvalida` |
| `evento.ts` | `IEvento` — estructura pendiente de definición |
| `evento-visita.ts` | `IEventoVisita`, `IEstadoEventoVisita`, `ICreateEventoVisita` |
| `ingreso-egreso.ts` | `IIngresoEgreso`, `ICreateIngresoEgreso` — entidad de alto volumen |
| `permiso.ts` | `IPermiso`, `IPermisoCliente`, `IPermisoComplejo`, `IPermisoUnidadFuncional`, `INivelPermiso` |
| `rol.ts` | `IRol`, `IRolGlobal`, `IRolCliente`, `IRolComplejo`, `AccionesRol` |
| `unidad-funcional.ts` | `IUnidadFuncional`, `ITipoUnidadFuncional` |
| `usuario.ts` | `IUsuario`, `ICreateUsuario`, `IUpdateUsuario` |
| `vehiculo.ts` | `IVehiculo`, `ICreateVehiculo` |
| `vinculo-vehiculo.ts` | `IVinculoVehiculo`, `ITipoVinculo` |
| `visitante.ts` | `IVisitante`, `ICreateVisitante` |
| `publicacion.ts` | `IPublicacion`, `IBloque`, `ICreatePublicacion`, `IUpdatePublicacion`, `ETipoBloque`, `ECategoriaPublicacion`, `EEstadoPublicacion` — `idPermisoCarga` registra quién creó; populate `permisoCarga` da acceso al `IPermiso` y de ahí al usuario |
| `device-token.ts` | `IDeviceToken`, `IDevicePlatform`, `ICreateDeviceToken`, `IUpdateDeviceToken` — token FCM por device, vinculado a `idUsuario` (un usuario puede tener N devices) |
| `notificacion-preferencias.ts` | `INotificacionPreferencias`, `ICategoriaNotificacion`, `ICategoriasNotificacionMap`, `CATEGORIAS_NOTIFICACION`, `NOTIF_PREFERENCIAS_DEFAULT` — preferencias de push por **permiso** (no por usuario): un usuario con N permisos UF puede tener prefs distintas en cada uno |

---

## Tipos utilitarios (`src/auxiliares/`)

```typescript
// Respuestas normalizadas de acceso-datos
interface IDocumento<T> { dato: T; duration?: number; }
interface IListado<T> { datos: T[]; totalCount?: number; duration?: number; }

// Parámetros de consulta (filter, sort, skip, limit, populate)
interface IQueryParam { filter?: string; sort?: string; skip?: number; limit?: number; populate?: string; }

// Type-safety entre interface y clase Mongoose (acceso-datos)
// No usar con discriminated unions (IRol, IPermiso)
type Exactly<T, U extends T> = T & { [K in Exclude<keyof U, keyof T>]: never };
```

---

## `AccionesRol` — agregar acciones nuevas

El tipo `AccionesRol` en `src/interfaces/rol.ts` es la fuente de verdad para las acciones habilitables en roles. Módulos actuales: `Administración`, `Hardware`, `Visitas`, `Vehículos`, `Movimientos`, `Eventos`, `Publicaciones`.

**Hardware** incluye acciones para: `accesos`, `dispositivos`, `credenciales`, y `dispositivos acceso` (relación `IDispositivoAcceso`).

Para agregar acciones de un módulo nuevo:
1. Agregar al union type en `src/interfaces/rol.ts`
2. Hacer push al repo
3. Correr `npm run modelos` en cada servicio que use el nuevo módulo

**Workaround hasta hacer push:** copiar el cambio directamente a `node_modules/acceso-modelos/src/interfaces/rol.ts` en el servicio local para que TypeScript lo reconozca.

---

## Convenciones de interfaces

- Campos `Populate` (virtuals): no se persisten en MongoDB, solo para respuestas enriquecidas
- `ICreate*`: omite `_id`, `fechaCreacion` y campos populate
- `IUpdate*`: todos los campos `Partial`, con discriminante requerido en unions
- Fechas: `string` (ISO 8601)
- MongoDB ObjectIds: `string`
- `IPermiso` y `IRol` son discriminated unions — no usar `Exactly<>` en sus schemas Mongoose

---

## ADVERTENCIA: `src/externos/` — código de otro proyecto

`src/externos/` contiene interfaces de un proyecto anterior (Chirpstack/LoRa, OSRM, Tripero, OAuth) que **se exportan inadvertidamente** desde el paquete. No pertenecen al sistema Acceso. No usar ninguna de estas interfaces en los servicios de Acceso.

Afectados: `osrm.ts`, `tripero.ts`, `eventos-lora/`, `chirpstack/`, `oauth/`. También re-exportados desde `src/auxiliares/index.ts` (eventos-lora). Limpiar en algún momento con coordinación de todos los servicios que usen el paquete.
