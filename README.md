# acceso-modelos

Paquete de **schemas Zod + tipos TypeScript** compartidos para el sistema de **control de acceso**. Define el modelo de dominio completo y la validación runtime utilizada por todos los servicios de la plataforma.

> **v2.0** — el paquete pasó de interfaces TS-only a schemas Zod compilados. Cada entidad expone:
> - `XSchema` ([Zod v4](https://zod.dev/)) para validación runtime y generación de OpenAPI / Swagger.
> - `IX` (TypeScript) inferido vía `z.infer<typeof XSchema>`.
>
> **Loose mode por defecto** (`z.looseObject`): todos los schemas aceptan campos no declarados sin error. Apto para forward-compat entre versiones del paquete y del backend.

---

## Descripción general

La plataforma permite a empresas administrar el control de acceso físico en complejos habitacionales o comerciales (barrios privados, edificios, condominios). Registra quién entra y sale, por dónde, cuándo, con quién y en qué vehículo. Soporta identificación automática mediante dispositivos (reconocimiento facial, huella digital, tarjetas, teclados numéricos) y registro manual por parte de guardias.

---

## Estructura del modelo

### 1. Arquitectura multi-tenant

El modelo sigue un patrón **multi-tenant** donde tanto el proveedor del software como sus clientes finales se representan con `ICliente`, diferenciados por `tipoCliente`.

| `tipoCliente` | Descripción |
| --- | --- |
| `Proveedor` | Tenant del proveedor del software. Sus usuarios tienen visibilidad global sobre todos los clientes y pueden realizar tareas de administración cross-tenant. |
| `Cliente` | Tenant de un cliente final. Sus usuarios operan únicamente dentro de su propia jerarquía. |

Cada **Cliente** agrupa uno o más **Complejos** (el predio físico: barrio, edificio, condominio), y cada Complejo contiene **Unidades Funcionales** (el espacio individual: departamento, lote, oficina, local).

```
Cliente
 └── Complejo  (Barrio / Edificio / Condominio)
      └── Unidad Funcional  (Departamento / Lote / Oficina...)
```

---

### 2. Usuarios, permisos y roles

Un **Usuario** es una persona con cuenta en el sistema (propietario, residente, empleado de seguridad, administrador, etc.). El usuario en sí es independiente del tenant — lo que lo vincula a un lugar y define qué puede hacer es el **Permiso**.

Un **Permiso** vincula un usuario a un nivel específico de la jerarquía y le asigna uno o más **Roles**:

| `nivel` | Alcance |
| --- | --- |
| `Cliente` | Acceso a toda la estructura del cliente (ej: administrador general) |
| `Complejo` | Acceso a un complejo específico (ej: guardia de seguridad) |
| `Unidad Funcional` | Acceso a una unidad puntual (ej: propietario de un departamento) |

Un **Rol** define el conjunto de acciones habilitadas en el sistema. Los roles también tienen su propio `alcance` (`Global`, `Cliente` o `Complejo`), lo que permite crear roles reutilizables a nivel global o específicos por cliente/complejo.

> `IPermiso` e `IRol` son *discriminated unions* en TypeScript: el campo `nivel` / `alcance` actúa como discriminante y determina qué FKs son requeridas en cada variante.

---

### 3. Accesos físicos y dispositivos

Un **Acceso** representa un punto de entrada/salida físico del complejo (puerta, barrera vehicular, molinete, etc.). Cada acceso define:

- **`tipo`**: si permite ingresos, egresos o ambos.
- **`tipoPersona`**: si es para propietarios/residentes, visitas o ambos.
- **`idsDispositivos`**: los dispositivos instalados en ese punto (puede ser más de uno, ej: cámara + teclado).
- **`ubicacion`**: punto geográfico GeoJSON para su ubicación en un mapa.

Un **Dispositivo** es el hardware instalado en el complejo (terminal de reconocimiento facial, lector de huella, lector de tarjeta, teclado numérico, etc.). Cada dispositivo pertenece a un cliente y complejo.

Dado que cada tipo de dispositivo identifica a las personas con su propio sistema interno (un ID de cara, un número de tarjeta, un código QR, un PIN), la entidad **CredencialDispositivo** actúa como tabla de lookup: vincula el identificador propio del dispositivo (`identificador`) con el permiso correspondiente en el sistema (`idPermiso`). Cuando un dispositivo detecta a alguien, el sistema busca por `(idDispositivo, identificador)` y obtiene el permiso para procesar el acceso.

---

### 4. Registro de movimientos — IngresoEgreso

`IIngresoEgreso` es la entidad transaccional de mayor volumen del sistema. Registra cada evento de entrada o salida con toda la información del momento:

- **Responsable**: el permiso del propietario/residente/empleado que genera el acceso (`idPermiso`).
- **Acompañantes usuarios**: otros usuarios del sistema que ingresan junto al responsable (`idsPermisosAcompanantes`).
- **Acompañantes visitantes identificados**: personas sin cuenta registradas como visitantes (`idsVisitantes`).
- **Acompañantes anónimos**: cantidad de personas no identificadas (`visitantesAnonimos`). Útil cuando el guardia registra "entró el propietario con 3 personas" sin identificarlas.
- **Acceso**: el punto físico por donde se produjo el movimiento (`idAcceso`). A través del acceso se puede saber qué dispositivos participaron.
- **Vehículo**: el vehículo utilizado, si aplica (`idVehiculo`).
- **Aprobación**: si fue aprobado automáticamente por el sistema o manualmente por un guardia (`aprobadoPor`).

Esta entidad se mantiene separada de `IEvento` por diseño: los ingresos/egresos tienen estructura fija, volumen muy alto y requieren índices optimizados. Los eventos son de estructura variable y menor frecuencia.

---

### 5. Visitantes y vehículos — entidades globales

`IVisitante` e `IVehiculo` son entidades **globales**: no pertenecen a ningún tenant. Esto permite que una misma persona o vehículo sea reconocido en múltiples complejos sin duplicar datos.

Su vinculación con el sistema de permisos se gestiona a través de **VínculoVehículo**, que establece una relación many-to-many entre vehículos y personas (usuarios via permiso, o visitantes). Un vehículo puede tener múltiples titulares (ej: pareja que comparte auto) y una persona puede tener múltiples vehículos. El tipo del vínculo (`Titular` o `Autorizado`) distingue el dueño formal de quien tiene acceso autorizado.

Para visitas puntuales donde el vehículo no tiene vínculo registrado, la relación queda implícita en el registro de `IIngresoEgreso`.

---

### 6. Eventos de visita

`IEventoVisita` representa la autorización previa que un propietario (o guardia) crea para habilitar el ingreso de una o más personas en un rango horario determinado. Es la base del flujo de visitas:

1. El propietario declara la visita con anticipación, o el guardia la crea en el momento contactando al propietario por fuera del sistema.
2. Cuando la visita llega, el guardia verifica si existe un evento vigente y aprueba o rechaza el ingreso.
3. Cada `IIngresoEgreso` de los visitantes queda vinculado al evento a través de `idEventoVisita`.
4. El evento se cierra cuando todos los visitantes que ingresaron han registrado su egreso.

Campos clave:
- **`tipo`**: `'Particular'` o `'Proveedor'` (extensible a futuro).
- **`creadoPor`**: distingue si lo creó el propietario o el guardia, usando el mismo `idPermiso` para ambos casos.
- **`idUnidadFuncional`**: unidad del autorizante (para filtrado y contexto).
- **`idUnidadFuncionalDestino`**: destino real de la visita, que puede diferir de la unidad del autorizante (ej: proveedor que va a un espacio común, autorizado por el administrador del complejo).
- **`estado`**: ciclo de vida `Pendiente → Activa → Cerrada / Vencida`.

---

### 7. Unidades funcionales — tipos

`IUnidadFuncional` representa tanto espacios privados (departamentos, lotes, oficinas) como espacios comunes del complejo (canchas, SUM, gimnasio, etc.), diferenciados por el campo `tipo`:

| `tipo` | Descripción |
| --- | --- |
| `Privada` | Espacio de uso exclusivo con propietario/residente asignado |
| `Común` | Espacio compartido del complejo (cancha de tenis, SUM, piscina, etc.) |

Cada unidad puede tener su polígono geográfico (`ubicacion: IGeoJSONPolygon`) para representarla en un mapa del complejo. Esta base será reutilizada en el futuro sistema de reservas de turnos para espacios comunes.

---

### 8. Eventos

`IEvento` representa ocurrencias del sistema que no son ingresos/egresos ni visitas: botón de pánico, alertas de dispositivos, notificaciones, acciones de guardias, etc. Su estructura de datos específica (tipo de evento, descripción, estado) está pendiente de definición.

---

## Diagrama Entidad-Relación

```mermaid
erDiagram

  ICliente {
    string _id PK
    string nombre
    string tipoCliente "'Proveedor' | 'Cliente'"
    boolean habilitado
    string fechaCreacion
  }

  IComplejo {
    string _id PK
    string nombre
    string tipo "'Barrio' | 'Edificio' | 'Condominio'"
    boolean habilitado
    string idCliente FK
    string fechaCreacion
  }

  IUnidadFuncional {
    string _id PK
    string nombre
    string tipo "'Privada' | 'Común'"
    boolean habilitado
    object ubicacion "IGeoJSONPolygon"
    string idCliente FK
    string idComplejo FK
    string fechaCreacion
  }

  IUsuario {
    string _id PK
    string usuario
    string hash
    string fechaCreacion
  }

  IDatosPersonales {
    string nombre
    string dni
    string email
    string telefono
    string sexo
    string pais
    string direccion
    string fechaNacimiento
    string foto
  }

  IRol {
    string _id PK
    string alcance "'Global' | 'Cliente' | 'Complejo'"
    string nombre
    string[] acciones
    string idCliente FK
    string idComplejo FK
    string fechaCreacion
  }

  IPermiso {
    string _id PK
    string nivel "'Cliente' | 'Complejo' | 'Unidad Funcional'"
    boolean habilitado
    string fechaExpiracion
    string idUsuario FK
    string idCliente FK
    string idComplejo FK
    string idUnidadFuncional FK
    string[] idsRoles FK
    string fechaCreacion
  }

  IAcceso {
    string _id PK
    string nombre
    boolean habilitado
    string tipo "'Ingreso' | 'Egreso' | 'Ambos'"
    string tipoPersona "'Propietarios' | 'Visitas' | 'Ambos'"
    string[] idsDispositivos FK
    object ubicacion "IGeoJSONPoint"
    string idCliente FK
    string idComplejo FK
    string fechaCreacion
  }

  IDispositivo {
    string _id PK
    string tipo "'Terminal de reconocimiento facial' | 'Lector de huella digital' | 'Lector de tarjeta' | 'Teclado numérico' | 'Otro'"
    string serialNumber
    string marca
    string modelo
    string idCliente FK
    string idComplejo FK
    string fechaCreacion
  }

  ICredencialDispositivo {
    string _id PK
    string identificador "ID propio del dispositivo"
    string idDispositivo FK
    string idPermiso FK
    string idCliente FK
    string idComplejo FK
    string fechaCreacion
  }

  IEvento {
    string _id PK
    string idCliente FK
    string idComplejo FK
    string idUnidadFuncional FK
    string idPermiso FK
    string expireAt
    string fechaCreacion
  }

  IEventoVisita {
    string _id PK
    string tipo "'Particular' | 'Servicio' | 'Retiro' | 'Entrega'"
    string estado "'Pendiente' | 'Activa' | 'Cerrada' | 'Vencida'"
    string creadoPor "'Propietario' | 'Guardia'"
    string idCliente FK
    string idComplejo FK
    string idUnidadFuncional FK "unidad del autorizante"
    string idUnidadFuncionalDestino FK "destino real de la visita"
    string idPermiso FK
    string[] idsVisitantes FK
    string[] idsVehiculos FK
    string fechaDesde
    string fechaHasta
    string fechaCreacion
  }

  IIngresoEgreso {
    string _id PK
    string tipo "'Ingreso' | 'Egreso'"
    boolean aprobado
    string aprobadoPor "'Sistema' | 'Guardia'"
    string idCliente FK
    string idComplejo FK
    string idUnidadFuncional FK
    string idPermiso FK
    string[] idsPermisosAcompanantes FK
    string[] idsVisitantes FK
    number visitantesAnonimos
    string idAcceso FK
    string idEventoVisita FK
    string idVehiculo FK
    string[] imagenes "URLs a object storage"
    string fechaEvento
    string fechaCreacion
  }

  IVehiculo {
    string _id PK
    string marca
    string modelo
    string color
    string patente
    string fechaCreacion
  }

  IVisitante {
    string _id PK
    string fechaCreacion
  }

  IVinculoVehiculo {
    string _id PK
    string tipo "'Titular' | 'Autorizado'"
    string idVehiculo FK
    string idPermiso FK
    string idVisitante FK
    string idCliente FK
    string idComplejo FK
    string fechaCreacion
  }

  ICliente          ||--o{  IComplejo               : "tiene"
  IComplejo         ||--o{  IUnidadFuncional         : "tiene"
  IUsuario          ||--|{  IDatosPersonales          : "contiene"
  IUsuario          ||--o{  IPermiso                 : "posee"
  IPermiso          }o--||  ICliente                 : "nivel Cliente"
  IPermiso          }o--o|  IComplejo                : "nivel Complejo"
  IPermiso          }o--o|  IUnidadFuncional         : "nivel UF"
  IPermiso          }o--o{  IRol                     : "idsRoles"
  IRol              }o--o|  ICliente                 : "alcance Cliente"
  IRol              }o--o|  IComplejo                : "alcance Complejo"
  ICliente          ||--o{  IAcceso                  : "tiene"
  IComplejo         ||--o{  IAcceso                  : "tiene"
  IAcceso           }o--o{  IDispositivo             : "idsDispositivos"
  ICliente          ||--o{  IDispositivo             : "tiene"
  IComplejo         ||--o{  IDispositivo             : "tiene"
  IDispositivo      ||--o{  ICredencialDispositivo   : "tiene"
  IPermiso          }o--o{  ICredencialDispositivo   : "idPermiso"
  ICliente          ||--o{  IEvento                  : "tiene"
  IComplejo         ||--o{  IEvento                  : "tiene"
  IPermiso          }o--o{  IEvento                  : "genera"
  ICliente          ||--o{  IEventoVisita             : "tiene"
  IComplejo         ||--o{  IEventoVisita             : "tiene"
  IPermiso          }o--o{  IEventoVisita             : "autoriza"
  IUnidadFuncional  }o--o{  IEventoVisita             : "autorizante"
  IUnidadFuncional  }o--o{  IEventoVisita             : "destino"
  IVisitante        }o--o{  IEventoVisita             : "idsVisitantes"
  IVehiculo         }o--o{  IEventoVisita             : "idsVehiculos"
  ICliente          ||--o{  IIngresoEgreso            : "registra"
  IComplejo         ||--o{  IIngresoEgreso            : "registra"
  IAcceso           }o--o{  IIngresoEgreso            : "idAcceso"
  IEventoVisita     }o--o{  IIngresoEgreso            : "idEventoVisita"
  IPermiso          }o--o{  IIngresoEgreso            : "responsable"
  IPermiso          }o--o{  IIngresoEgreso            : "acompanante"
  IVisitante        ||--|{  IDatosPersonales          : "contiene"
  IVisitante        }o--o{  IIngresoEgreso            : "idsVisitantes"
  IVehiculo         }o--o|  IIngresoEgreso            : "idVehiculo"
  IVehiculo         ||--o{  IVinculoVehiculo          : "vinculado"
  IPermiso          }o--o{  IVinculoVehiculo          : "idPermiso"
  IVisitante        }o--o{  IVinculoVehiculo          : "idVisitante"
```

---

## Instalación

### 1. Agregar la dependencia en `package.json`

```json
"acceso-modelos": "git://github.com/GPE-Sistemas/acceso-modelos.git"
```

`npm install` ejecuta `prepare` automáticamente (corre `tsc`), por lo que el paquete queda compilado en `dist/` al instalar como dependencia git.

### 2. Script de actualización

```json
"scripts": {
  "modelos": "npm update acceso-modelos"
}
```

### 3. Instalar

```bash
npm install
```

### 4. Importar

```typescript
// Tipos + schemas — desde la raíz del paquete (no más /src)
import {
  IAcceso,
  AccesoSchema,
  CreateAccesoSchema,
  IPermiso,
  PermisoSchema,
  CreatePermisoSchema,
  ICliente,
  ClienteSchema,
} from 'acceso-modelos';
```

> **Breaking v1 → v2**: la ruta de importación cambia de `acceso-modelos/src` a `acceso-modelos`. Los servicios consumidores deben actualizar todos los imports.

---

## Uso

### Tipos puros (consumo idéntico al v1)

```typescript
import { IAcceso, ICreateAcceso } from 'acceso-modelos';

function crear(body: ICreateAcceso): Promise<IAcceso> { /* ... */ }
```

### Validación runtime

```typescript
import { CreateAccesoSchema } from 'acceso-modelos';

const result = CreateAccesoSchema.safeParse(body);
if (!result.success) throw new BadRequestException(result.error.issues);
```

### Generación de Swagger / OpenAPI (NestJS)

```typescript
import { createZodDto } from 'nestjs-zod';
import { CreateAccesoSchema, UpdateAccesoSchema } from 'acceso-modelos';

export class CreateAccesoDto extends createZodDto(CreateAccesoSchema) {}
export class UpdateAccesoDto extends createZodDto(UpdateAccesoSchema) {}
```

### Constantes runtime

`v2` permite importar constantes runtime desde Node (en `v1` solo eran usables desde Angular):

```typescript
import {
  CATEGORIAS_NOTIFICACION,
  NOTIF_PREFERENCIAS_DEFAULT,
  PREFERENCIAS_CONTACTOS_DEFAULT,
} from 'acceso-modelos';
```

---

## Discriminated unions

`IPermiso` (`nivel`) e `IRol` (`alcance`) son uniones discriminadas. Los schemas usan `z.discriminatedUnion`:

```typescript
import { PermisoSchema } from 'acceso-modelos';

PermisoSchema.parse({ nivel: 'Cliente', idCliente: '...' });            // OK
PermisoSchema.parse({ nivel: 'Complejo', idCliente: '...', idComplejo: '...' });    // OK
PermisoSchema.parse({ nivel: 'Unidad Funcional', idCliente: '...', idComplejo: '...', idUnidadFuncional: '...' }); // OK
```

---

## Notas técnicas

- **Compilación**: `tsc` produce `dist/index.js` + `dist/index.d.ts`. El `prepare` hook corre el build al instalar.
- **API canónica v4**: `z.looseObject({...})`, `z.discriminatedUnion(...)`, `z.enum([...])`. Sin `.passthrough()`/`.strict()`/`.strip()` (deprecated en v4).
- **Sin casts manuales**: v4 maneja la inferencia de tipos para entidades con cadenas profundas de populate sin triggerear `TS7056`. Tipos derivados con `z.infer<typeof Schema>` directo.
- **Loose mode**: campos no declarados pasan al output sin error. Implica que `body._id` enviado a un endpoint `Create*` se reenvía a `acceso-datos` sin filtrar — sigue siendo responsabilidad del backend descartar/sobrescribir IDs server-side.
- **Sin `src/externos/`**: las interfaces legacy (Chirpstack, OSRM, Tripero, OAuth, eventos-lora) se removieron en v2.
