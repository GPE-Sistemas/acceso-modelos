# acceso-modelos

Paquete de interfaces TypeScript compartidas para el sistema de **control de acceso**. Define el modelo de dominio utilizado por todos los servicios de la plataforma.

## Descripción del modelo

El sistema gestiona el acceso de usuarios a espacios físicos organizados jerárquicamente. Un **Cliente** agrupa uno o más **Complejos** (barrios, edificios, condominios), y cada Complejo contiene **Unidades Funcionales** (departamentos, lotes, oficinas, etc.).

Los **Usuarios** obtienen acceso mediante **Permisos**, que vinculan un usuario con un nivel específico de la jerarquía y le asignan uno o más **Roles**. Cada Rol define el conjunto de acciones habilitadas dentro del sistema.

### Tipos de cliente

El modelo sigue un patrón **multi-tenant**: tanto el proveedor del software como sus clientes finales son representados como `ICliente`, diferenciados por el campo `tipoCliente`.

| `tipoCliente` | Descripción |
| ------------- | ----------- |
| `Proveedor`   | Tenant del proveedor del software. Sus usuarios tienen visibilidad global sobre todos los clientes y pueden realizar tareas de administración cross-tenant. |
| `Cliente`     | Tenant de un cliente final. Sus usuarios solo operan dentro de su propia jerarquía de Complejos y Unidades Funcionales. |

> Los usuarios del `Proveedor` participan del mismo modelo de `IPermiso` / `IRol` que cualquier otro usuario, lo que mantiene la lógica de autorización uniforme en toda la plataforma.

### Jerarquía de acceso

```
Cliente
 └── Complejo  (Barrio / Edificio / Condominio)
      └── Unidad Funcional  (Departamento / Lote / Oficina...)
```

Un permiso puede otorgarse a cualquier nivel de la jerarquía:

| `nivel`            | Alcance del acceso                              |
| ------------------ | ----------------------------------------------- |
| `Cliente`          | Acceso a toda la estructura del cliente         |
| `Complejo`         | Acceso a un complejo específico y sus unidades  |
| `Unidad Funcional` | Acceso únicamente a una unidad funcional        |

Los **Roles** también tienen alcance propio (`alcance`), lo que permite definir roles globales reutilizables o roles acotados a un cliente o complejo particular.

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
    boolean habilitado
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
    string idUsuario FK
    string idCliente FK
    string idComplejo FK
    string idUnidadFuncional FK
    string[] idsRoles FK
    string fechaCreacion
  }

  ICliente         ||--o{ IComplejo          : "tiene"
  IComplejo        ||--o{ IUnidadFuncional   : "tiene"
  IUsuario         ||--|{ IDatosPersonales   : "contiene"
  IUsuario         ||--o{ IPermiso           : "posee"
  IPermiso         }o--||  ICliente          : "nivel Cliente"
  IPermiso         }o--o|  IComplejo         : "nivel Complejo"
  IPermiso         }o--o|  IUnidadFuncional  : "nivel UF"
  IPermiso         }o--o{  IRol              : "idsRoles"
  IRol             }o--o|  ICliente          : "alcance Cliente"
  IRol             }o--o|  IComplejo         : "alcance Complejo"
```

> **Nota sobre los union types:** `IPermiso` e `IRol` son *discriminated unions* en TypeScript.
> El campo `nivel` / `alcance` actúa como discriminante y determina qué referencias de FK son requeridas u opcionales en cada variante.

---

## Instalación

### 1. Agregar la dependencia en `package.json`

```json
"acceso-modelos": "git://github.com/GPE-Sistemas/acceso-modelos.git"
```

### 2. Agregar el script de actualización

```json
"acceso-modelos": "yarn upgrade acceso-modelos"
```

### 3. Instalar

```bash
yarn install
```

### 4. Importar las interfaces

```typescript
import { IPermiso, IPermisoCliente, IPermisoComplejo } from 'acceso-modelos/src';
import { IRol, IRolGlobal, ICliente, IComplejo } from 'acceso-modelos/src';
```
