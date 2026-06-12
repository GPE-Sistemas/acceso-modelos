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
| `credencial-vector.ts` | `CredencialVectorSchema` / `ICredencialVector`, `EstadoCredencialVectorSchema` (módulo IA-video M5). Metadato del embedding facial (modelo/dim/version/foto) para identificación 1:N. **No** guarda el vector crudo (vive en el índice caliente del edge — decisión B). |
| `deteccion.ts` | `DeteccionSchema` / `IDeteccion`, `TipoDeteccionSchema` (persona/vehiculo/patente/rostro/acceso-terminal), `EstadoCorrelacionDeteccionSchema` (módulo IA-video M3). Señal cruda de inferencia de video; se persiste con `expireAt`/TTL y se correlaciona en un único `IIngresoEgreso`. |
| `dispositivo.ts` | `DispositivoSchema` / `IDispositivo`, `TipoDispositivoSchema` (+ `Cámara IP`/`NVR`/`XVR`, M1), `ConfigDispositivoSchema` (+ `protocolo`/`rtspUriPlantilla`/`idPerfilCamara`/`canales`), `CapacidadesDispositivoSchema` (+ `deteccion`), `CapacidadesDeteccionSchema`, `ProtocoloDispositivoSchema`, `FuenteInferenciaSchema`, `CanalDispositivoSchema`. `capacidades.deteccion.identificacionRostro` gatea aprobado automático (decisión E). |
| `dispositivo-acceso.ts` | `DispositivoAccesoSchema` / `IDispositivoAcceso`, `ComportamientoCredencialValidaSchema`, `ComportamientoCredencialInvalidaSchema`, + (M4) `RolEnEventoSchema`, `ComportamientoDeteccionSchema`, `DisparoDeteccionSchema` (cadenas de detección). |
| `evento-visita.ts` | `EventoVisitaSchema` / `IEventoVisita`, `RecurrenciaEventoVisitaSchema`, estados, aprobación. Campo `idTurno?` cuando el evento fue auto-generado desde un turno |
| `ingreso-egreso.ts` | `IngresoEgresoSchema` / `IIngresoEgreso`, `VisitanteSnapshotSchema`, `VehiculoSnapshotSchema` (snapshot inmutable). `CategoriaIngresoEgresoSchema` enum: `Propietario` \| `Visita` \| `Administración` \| `Guardia` \| `Prestador de Servicio` \| `Mantenimiento`. Coherencia con `idPermiso.categoriaPermiso` validada en `acceso-api`. Entidad de alto volumen. M2 (IA-video): `OrigenIngresoEgresoSchema` (`Terminal`/`Detección Video`/`Manual`, independiente de `aprobadoPor`) + `confianza`/`tipoDeteccion[]`/`idsDetecciones[]` para eventos de inferencia de video |
| `permiso.ts` | `PermisoSchema` / `IPermiso` — discriminated union por `nivel`. Variantes Cliente/Complejo/Unidad Funcional. `CategoriaPermisoSchema` (`Propietario` \| `Administración` \| `Guardia` \| `Prestador de Servicio` \| `Mantenimiento`). `PermisoComplejoSchema.idsUnidadesFuncionales?` para Prestador. |
| `empleado.ts` | `EmpleadoSchema` / `IEmpleado` — nómina explícita del complejo. Vínculo **1:1** a un permiso de nivel Complejo (`idPermiso`, índice único en acceso-datos); la categoría vive en el permiso (populate). Campos RRHH `legajo?`/`puesto?`/`fechaIngreso?`/`fechaEgreso?`. Soft-archive (`activo`). Cloud-only, gestión web nivel Complejo. Acciones rol `Administración - Ver/Crear/Editar/Eliminar empleados` |
| `rol.ts` | `RolSchema` / `IRol` — discriminated union por `alcance`. `AccionesRolSchema` enumera todas las acciones del catálogo |
| `unidad-funcional.ts` | `UnidadFuncionalSchema` / `IUnidadFuncional`. Campo `imagenes?: string[]` con objectNames GCS (hasta 10 por UF, bucket público, carpeta `unidades-funcionales`). Atributos de expensas: `superficie?` (m²), `coeficiente?` (% de copropiedad, base del prorrateo), `facturableExpensas?` (default por `tipo`: Privada=true, Común=false) |
| `usuario.ts` | `UsuarioSchema` / `IUsuario`, `DatosPersonalesSchema` |
| `vehiculo.ts` | `VehiculoSchema` / `IVehiculo`, `DatosVehiculoSchema`. Campos `activo?: boolean` + `idPermisoCreador?: string` (soft-archive — índice único parcial sobre patente filtra por `activo: true`). Omitidos de Create/Update — los inyecta `acceso-api` |
| `mascota.ts` | `MascotaSchema` / `IMascota`, `VacunaMascotaSchema` / `IVacunaMascota` (subdoc `_id:true`: tipo/fechaAplicacion/fechaVencimiento?/veterinario?/comprobante?), enums `EspecieMascotaSchema` (Perro/Gato/Otro), `SexoMascotaSchema`, `EstadoMascotaSchema` (Activa/Fallecida/Retirada). Catálogo por UF estilo `IVehiculo`: tenancy + soft-archive (`activo`+`idPermisoCreador`, índice único parcial microchip por complejo). `fotos?: string[]` GCS carpeta `mascotas`. Cloud-only **con** cara mobile UF. Acciones `Mascotas - Ver/Crear/Editar/Eliminar` |
| `vinculo-vehiculo.ts` | `VinculoVehiculoSchema` / `IVinculoVehiculo` |
| `vinculo-evento-ingreso.ts` | `VinculoEventoIngresoSchema` / `IVinculoEventoIngreso` |
| `visitante.ts` | `VisitanteSchema` / `IVisitante`. Campos `activo?: boolean` + `idPermisoCreador?: string` (soft-archive — índices únicos parciales sobre teléfono/DNI filtran por `activo: true` **+ `ambito='UnidadFuncional'`**). Omitidos de Create/Update — los inyecta `acceso-api`. **`ambito: VisitanteAmbitoSchema` (`'UnidadFuncional' \| 'Complejo'`, default UF)** — modelo híbrido: privado de UF (requiere `idUnidadFuncional`) vs global del complejo (sin UF, seleccionable por todas las UF; DNI obligatorio = clave de dedup, índice único `(idComplejo, dni)` filtrado `ambito='Complejo'` en acceso-datos). **`descripcion?: string`** (detalle/comentario libre, ej. "Jardinero", sobre todo globales). `ambito`/`descripcion` SÍ van en Create/Update (web los manda; acceso-api valida "UF requerida si ámbito UF"). Campos `validadoPorInvitado?: boolean` + `fechaUltimaValidacionInvitado?: string` (el invitado completó sus datos vía link público — ver `invitacion-visita.ts`); omitidos de Create/Update, los setea el endpoint público |
| `invitacion-visita.ts` | Contratos del **link público de invitación de visita**. `INVITACION_VISITA_SCOPE` (`'completar-datos-visitante'`), `InvitacionVisitaClaimsSchema` / `IInvitacionVisitaClaims` (claims del JWT firmado stateless: `idVisitante`+`idEvento`+`scope`; acceso-api lo firma con `INVITACION_JWT_SECRET` y `INVITACION_TTL` propios), `InvitacionVisitaPublicaSchema` / `IInvitacionVisitaPublica` (respuesta `GET /invitaciones-visita/:token` — subset seguro: prefill `datosPersonales` + contexto del evento/complejo, sin tenancy), `CompletarInvitacionVisitaSchema` / `ICompletarInvitacionVisita` (cuerpo del `PUT` — `DatosPersonalesSchema` sin `telefono` (bloqueado) ni `foto` (va por multipart, upload server-side)). Flujo opcional, no bloqueante |
| `publicacion.ts` | `PublicacionSchema` / `IPublicacion`, `BloqueSchema`, enums (`TipoBloqueSchema`, `CategoriaPublicacionSchema`, `EstadoPublicacionSchema`) |
| `device-token.ts` | `DeviceTokenSchema` / `IDeviceToken`, `DevicePlatformSchema` |
| `notificacion-preferencias.ts` | `NotificacionPreferenciasSchema` / `INotificacionPreferencias`, `CategoriaNotificacionSchema`, `CategoriasNotificacionMapSchema`, `CATEGORIAS_NOTIFICACION`, `NOTIF_PREFERENCIAS_DEFAULT`. Categorías de turnos: `turno_reservado`, `turno_pendiente_aprobacion`, `turno_aprobado`, `turno_rechazado`, `turno_cancelado`. Categorías de tickets para atendedores nivel Complejo: `ticket_emergencia_recibido` (guardia), `ticket_solicitud_recibido` (administración, cubre Solicitud + Reclamo). Categorías de encuestas para UF: `encuesta_abierta`, `encuesta_recordatorio`, `encuesta_cerrada`. Categorías de infracciones para UF: `multa_emitida`, `infraccion_emitida` (un toggle por entidad; cada uno cubre emisión Y anulación — el `data.type` del push distingue `multa_emitida`/`multa_anulada`/`infraccion_emitida`/`infraccion_anulada`). Categorías de obras: `obra_solicitud` (atendedores Complejo con `Obras - Revisar obras`: presentada + doc cargada), `obra_estado` (UF: aprobada/rechazada/suspendida/reanudada/finalizada/anulada), `obra_seguimiento` (UF: pedido de documentación, documento observado, inspecciones) — el `data.type` distingue el evento concreto. **`CategoriasMap` en `acceso-datos` debe declarar TODAS las keys del enum** (Mongoose strict dropea las no declaradas → el toggle de apagado no persistiría) |
| `boton-ticket.ts` | `BotonTicketSchema` / `IBotonTicket`, `ConfigBotonTicketSchema`. Campo discriminante `categoria: CategoriaTicket` (`Emergencia` \| `Solicitud` \| `Reclamo`) define el **lugar** de atención. **`atendidoPor: ICategoriaPermiso[]`** define **quién** atiende (configurable; default por categoría en acceso-api: Emergencia→[Guardia], Solicitud/Reclamo→[Administración]). Config incluye `permiteImagenes` y `requiereDentroDelComplejo` (geofence per-botón). `categoria` inmutable post-creación |
| `config-botones-ticket-complejo.ts` | `ConfigBotonesTicketComplejoSchema` / `IConfigBotonesTicketComplejo` — uno por complejo; `idsBotones[]` define orden mobile (cubre las 3 categorías en una sola grilla) |
| `ticket.ts` | `TicketSchema` / `ITicket`, `CategoriaTicketSchema` (`Emergencia` \| `Solicitud` \| `Reclamo`), `EstadoTicketSchema` (`Pendiente` \| `EnAtencion` \| `Resuelta` \| `Descartada`), `UbicacionTicketSchema`, `BotonTicketSnapshotSchema` (snapshot inmutable del botón con `categoria` denormalizada). `ITicket.categoria` denormalizada desde el botón al crear |
| `interaccion-ticket.ts` | `InteraccionTicketSchema` / `IInteraccionTicket`, `TipoInteraccionTicketSchema`, `AccionExternaTicketSchema`. Tipo `Comentario` con texto libre — usado para registrar acción en solicitudes/reclamos (admin) |
| `mensaje-ticket.ts` | `MensajeTicketSchema` / `IMensajeTicket` |
| `contacto-usuario.ts` | `ContactoUsuarioSchema` / `IContactoUsuario`, `EstadoContactoUsuarioSchema` |
| `preferencias-contactos.ts` | `PreferenciasContactosSchema` / `IPreferenciasContactos`, `PREFERENCIAS_CONTACTOS_DEFAULT` |
| `dashboard.ts` | `DashboardComplejoSchema` / `IDashboardComplejo`, `DashboardUFSchema` / `IDashboardUF`, `DashboardClienteSchema` / `IDashboardCliente`, `DashboardProveedorSchema` / `IDashboardProveedor` |
| `tipo-actividad.ts` | `TipoActividadSchema` / `ITipoActividad` — catálogo de actividades por complejo (Tenis, Padel, Pileta, SUM…). Asocia un set de UFs Común como recursos. Campos: `nombre`, `descripcion`, `icono` (Material Symbol), `color`, `idsUnidadesFuncionales[]` |
| `plantilla-turno.ts` | `PlantillaTurnoSchema` / `IPlantillaTurno`, `ModalidadTurnoSchema`, `HorarioPlantillaSchema`. Define cómo se reserva: recursos (subset del tipo), modalidades (variantes c/ duración + cupo), horarios cortados por día, cupos por UF, anticipación, cancelación, no-show, datos participantes, max invitados |
| `turno.ts` | `TurnoSchema` / `ITurno`, `EstadoTurnoSchema`, `EstadoAprobacionTurnoSchema`, `ParticipantePropietarioTurnoSchema`, `ParticipanteInvitadoTurnoSchema`, `PlantillaTurnoSnapshotSchema`, `RecurrenciaTurnoSchema`. **Populates pesados (`plantilla`, `permiso`, etc.) declarados como `z.any()`** para no inflar inferencia TS7056. Campo `idEventoVisita?` para link al evento auto-generado al aprobar. Cargos a expensas: `costoTotal` (ya existente) + `facturado?` / `idExpensaUF?` (los setea acceso-api al liquidar; evitan doble facturación) |
| `bloqueo-turnos.ts` | `BloqueoTurnosSchema` / `IBloqueoTurnos` — bloquea recursos en un rango horario (mantenimiento, eventos privados, feriados) |
| `config-expensa.ts` | `ConfigExpensaComplejoSchema` / `IConfigExpensaComplejo` — config de cálculo de expensas (1 por complejo, lazy create). `conceptos: IConceptoExpensa[]` (rubros con `metodo`: Fijo igual / Fijo por coeficiente / Prorrateo por coeficiente / Prorrateo por superficie / Fijo + variable por superficie) + `mora` (`IMoraConfig`: `tasas: ITasaMora[]` versionadas por período `vigenteDesde`, `tipoInteres` Simple/Compuesto, `base`, `diasGracia`). Cloud-only |
| `liquidacion-expensa.ts` | `LiquidacionExpensaSchema` / `ILiquidacionExpensa` — cabecera por (complejo, período `"YYYY-MM"`). `EstadoLiquidacionExpensaSchema` (Borrador/Emitida/Cerrada). `conceptosSnapshot` + `moraSnapshot` inmutables tras emitir. Índice único `(idComplejo, periodo)` |
| `expensa-unidad-funcional.ts` | `ExpensaUnidadFuncionalSchema` / `IExpensaUnidadFuncional` — recibo/cuenta por UF+período. `items: IItemExpensa[]` (`TipoItemExpensaSchema`: Concepto/Cargo turno/Saldo anterior/Interés/Ajuste), `ufSnapshot` inmutable, `estadoPago` (Pendiente/Parcial/Pagada), `montoPagado` denormalizado. Alto volumen — sin caché completa |
| `pago.ts` | `PagoSchema` / `IPago` — registro de pago genérico (sin pasarela). Discriminante `TipoPagoSchema` (`Expensa` \| `Multa`) + ref polimórfica (`idExpensaUF` para expensas, `idMulta` para multas cobradas aparte). `MedioPagoSchema` (Efectivo/Transferencia/Débito/Cheque/Otro). Soporta pagos parciales; acceso-api recalcula `montoPagado`/`estadoPago` del cargo al crear/borrar. El complejo configura por multa si se paga con la expensa (ítem, `tipo='Expensa'`) o aparte (`tipo='Multa'`) — la misma entidad sirve para ambos |
| `infraccion-multa-base.ts` | `InfraccionMultaBaseFields` (objeto de campos spreadeado en Multa+Infracción), `InfraccionMultaBaseOmit`, `OrigenInfraccionMultaSchema` (`Permiso` \| `Dispositivo`). Campos comunes: UF multada, numero correlativo, origen, idPermisoCreador/idDispositivo, titulo, detalles, imagenes (GCS), articuloReglamento (texto libre), anulación, **`idMascota?`** (pre-horneado para Fase 2 — multa/infracción asociada a una mascota; + populate `mascota?`), **`idObra?`** (módulo Obras — multa/infracción asociada a una obra, incl. apercibimiento automático por plazo vencido; + populate `obra?` como `z.any()`) |
| `obra.ts` | `ObraSchema` / `IObra` — obra en una UF (módulo Obras, doc 35 / D47). **Una sola entidad solicitud+ejecución**, `EstadoObraSchema` (Borrador/Presentada/En revisión/Documentación pendiente/Aprobada/En ejecución/Suspendida/Finalizada/Rechazada/Anulada — "Vencida" se deriva), `TipoObraSchema` (8 tipos), `numero` correlativo al presentar, subdocs `profesional`/`constructora`, `idsVisitantes` (personal = catálogo UF) + `idsVehiculos` + `idEventoVisita` (evento recurrente auto-generado al aprobar), **`derechoConstruccion: ITramoDerechoConstruccion[]`** (tarifa mensual versionada, patrón ITasaMora) + `periodosFacturados[]` (anti-doble-cobro recurrente), `etapas[]` (subdoc `_id:true` con `inspecciones[]` — Fase 2), `idInfraccionVencimiento?`. Create omite todo lo server-managed (transiciones por endpoints de acción). Cloud-only |
| `documento-obra.ts` | `DocumentoObraSchema` / `IDocumentoObra` — documento adjunto de obra. `TipoDocumentoObraSchema` (Planos/Memoria/ART/F931/etc., 10 tipos), `archivo` objectName GCS **privado** carpeta `obras/<idObra>`, **versionado por (idObra, tipo)** (`version`+`vigente`, acceso-api desmarca la anterior), `estadoValidacion` (Pendiente/Aprobado/Observado) + `observacion` del revisor. PDF + imágenes |
| `revision-obra.ts` | `RevisionObraSchema` / `IRevisionObra` — bitácora append-only de la obra (patrón interacción-ticket). `TipoRevisionObraSchema` (Cambio de estado/Observación/Pedido de documentación/Documentación cargada/Inspección/Comentario), `estadoAnterior`/`estadoNuevo`, `tiposDocumentoSolicitados[]`. Toda transición la escribe acceso-api acá |
| `config-obra.ts` | `ConfigObraComplejoSchema` / `IConfigObraComplejo` — config Obras por complejo (1/complejo, lazy, patrón config-multa). Defaults de aprobación (`derechoConstruccionMensualDefault`/`costoReinspeccion`/`plazoMaximoDiasDefault`/`montoGarantiaDefault`), `documentacionRequerida[]` (checklist **informativo** por tipo de obra, sin bloqueo), `horariosTrabajo` (default recurrencia del evento de acceso), `textoReglamento`. Endpoints `GET/PUT /config-obra/by-complejo/:idComplejo` |
| `multa.ts` | `MultaSchema` / `IMulta`, `EstadoMultaSchema` (Borrador/Emitida/Pagada/Liquidada/Anulada — "Vencida" NO es estado, se deriva de fechaVencimiento+estadoPago), `FormaCobroMultaSchema` (`Liquidar con expensa` \| `Pago aparte`). Liquidada = entró en una liquidación (`facturada`+`idExpensaUF`, patrón turno). Pago aparte: `estadoPago`/`montoPagado`/`recargoMora`/`totalAdeudado`. `idInfraccion?` (escaló desde). Cloud-only |
| `infraccion.ts` | `InfraccionSchema` / `IInfraccion`, `EstadoInfraccionSchema` (Borrador/Emitida/Anulada/Escalada). Apercibimiento **sin monto** — no se paga ni liquida. `idMulta?` (multa a la que escaló). Entidad separada de Multa a propósito (la lógica financiera no la ve) |
| `config-multa.ts` | `ConfigMultaComplejoSchema` / `IConfigMultaComplejo` — config de multas por complejo (1/complejo, lazy). Hoy solo `mora` (reusa `MoraConfigSchema` de config-expensa) aplicada a multas `Pago aparte` vencidas. Endpoints `GET/PUT /config-multa/by-complejo/:idComplejo`. Cloud-only |
| `proveedor.ts` | `ProveedorSchema` / `IProveedor` (módulo Egresos) — catálogo de proveedores por complejo. `razonSocial`, `cuit?`, `idCategoria?`, `condicionIva?` (`CondicionIvaSchema`), contacto. **Soft-archive** (`activo`+`idPermisoCreador`, índice único parcial `(idComplejo,cuit)` filtrado `activo:true`). Sin caché Redis. Cloud-only. (Nombre "Proveedor" solapa con nivel global GPE / `Prestador de Servicio` — namespaces distintos.) |
| `config-egreso.ts` | `ConfigEgresoComplejoSchema` / `IConfigEgresoComplejo` — config de egresos por complejo (1/complejo, lazy). `categorias: ICategoriaGasto[]` (subdoc `{nombre, tipo: TipoGastoSchema Ordinario/Extraordinario, montoPresupuestado?, habilitado?}`) + `fondoReserva?` (reservado). Endpoints `GET/PUT /config-egreso/by-complejo/:idComplejo`. `TipoGastoSchema` se exporta acá. Cloud-only |
| `gasto.ts` | `GastoSchema` / `IGasto` — gasto/egreso del complejo (**sin idUnidadFuncional**). `idProveedor?` **opcional** + `proveedorSnapshot?`, `idCategoria?`+`categoriaSnapshot?`, `tipoGasto`, `periodo "YYYY-MM"`, `monto`, `fechaGasto`/`fechaVencimiento?`, `estadoPago` (reusa `EstadoPagoExpensaSchema`)/`montoPagado`/`totalAdeudado` (mantiene acceso-api), `comprobantes?:string[]` (GCS, `<app-image-uploader multiple>`), `numero?` correlativo opcional, `recurrenteOrigen?` (reservado). Snapshots inmutables. Sin caché Redis. Cloud-only |
| `pago-egreso.ts` | `PagoEgresoSchema` / `IPagoEgreso` — pago a proveedor (**salida**, espejo de `IPago`). `idGasto`, `idProveedor?`, `monto`, `fecha`, `periodo`, `medio` (reusa `MedioPagoSchema`). Sin `idUnidadFuncional`. Parciales; acceso-api recalcula `montoPagado`/`estadoPago` del gasto. Separado del `IPago` genérico a propósito (no mezclar entradas/salidas). Cloud-only |
| `balance.ts` | `BalancePeriodoSchema` / `IBalancePeriodo` — **output-only**, cruce ingresos vs egresos por período (agregación read-time, sin entidad). `caja` (`IPago` vs `IPagoEgreso`), `devengado` (liquidado vs gastos), `presupuesto` (vs real por categoría), desgloses. Cloud-only |
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

`AccionesRolSchema` (`src/interfaces/rol.ts`) es la fuente de verdad. Módulos: `Administración`, `Hardware`, `Visitas`, `Vehículos`, `Mascotas`, `Movimientos`, `Publicaciones`, `Tickets`, `Turnos`, `Encuestas`, `Expensas`, `Infracciones`, `Egresos`, `Obras`.

**Permisos — granularidad por categoría** (reemplazo de las genéricas `Administración - Crear permisos` y `Administración - Editar permisos`, eliminadas):

```
Administración - Crear permisos propietarios
Administración - Crear permisos administración
Administración - Crear permisos guardia
Administración - Crear permisos prestadores
Administración - Crear permisos mantenimiento
Administración - Editar permisos propietarios
Administración - Editar permisos administración
Administración - Editar permisos guardia
Administración - Editar permisos prestadores
Administración - Editar permisos mantenimiento
```

**Empleados (nómina)**: `Administración - Ver/Crear/Editar/Eliminar empleados` (subgrupo "Empleados (nómina)" en acceso-web/roles/acciones-grupos.ts).

`POST /permisos` y `PUT /permisos/:id` usan `@RequiereCualquierAccion(...4)`; `PermisosService` valida que la acción específica matchee la `categoriaPermiso` del body (4xx si no). Permite que un admin de complejo de alta a guardias/prestadores sin poder crear otros administradores. Permisos no se eliminan (solo se deshabilitan vía Editar) — no existe `Administración - Eliminar permisos`.

**Movimientos — ver por categoría**:

```
Movimientos - Ver propietarios
Movimientos - Ver administración    (NEW)
Movimientos - Ver guardia           (NEW)
Movimientos - Ver prestadores       (NEW)
Movimientos - Ver mantenimiento     (NEW)
```

Los endpoints `GET /panel-guardia/<categoria>` requieren la acción correspondiente.

**Hardware** — `accesos`, `dispositivos`, `credenciales`, `dispositivos acceso`.

**Visitas** — `Ver/Crear/Editar/Eliminar eventos`, `Aprobar eventos`, `Aprobar eventos recurrentes` (auto-aprobación al crear y autoriza `PUT /eventos-visita/:id/aprobacion-recurrente`; típicamente nivel Complejo), `Ver/Crear/Editar/Eliminar visitantes`. **Visitantes globales del complejo** (gestión nivel Complejo del pool global): `Crear visitantes globales`, `Editar visitantes globales`, `Eliminar visitantes globales` — gatean alta/edición/baja vía endpoints `/visitantes/global*` + `PUT /visitantes/:id/promover-global`. "Ver visitantes" alcanza para que cualquier UF los vea por scope.

**Tickets** — `Ver/Crear/Editar/Eliminar botones`, `Ver/Editar configuración`, `Enviar ticket` (mobile UF). Operación separada por categoría:
- Emergencias: `Ver emergencias` + `Atender emergencias` (guardia) + `Eliminar emergencias`.
- Solicitudes/Reclamos: `Ver solicitudes` + `Atender solicitudes` (administración) — cubre ambas categorías.

Separación intencional para que un permiso guardia atienda emergencias sin tocar reclamos y un permiso admin atienda solicitudes/reclamos sin acceso a emergencias.

**Turnos** — Configuración: `Ver/Crear/Editar/Eliminar tipos actividad`, `Ver/Crear/Editar/Eliminar plantillas`, `Ver/Crear/Editar/Eliminar bloqueos`. Operación: `Ver turnos`, `Crear turno` (default rol UF), `Editar turnos`, `Cancelar turnos`. Aprobaciones: `Aprobar turnos` (UF, paralelo a Visitas), `Aprobar turnos recurrentes` (típicamente Complejo). Guardia: `Marcar no-show`, `Marcar completado`, `Marcar luz`.

**Encuestas** — Gestión (Complejo): `Ver/Crear/Editar/Eliminar/Cerrar encuestas`. Resultados: `Ver resultados`, `Exportar resultados` (CSV). Respuesta (UF): `Responder encuestas` — **no migrada al rol UF default**; admin asigna manual al rollout. Grupos UF: `Administración - Ver/Crear/Editar/Eliminar grupos UF`.

**Expensas** (administración del complejo, cloud-only) — Configuración: `Ver/Editar configuración`. Liquidaciones: `Ver/Generar/Emitir/Eliminar liquidaciones` (generar = crea/recalcula Borrador; eliminar = hard delete solo Borrador). Recibos y deuda: `Ver recibos`, `Ver estado de cuentas`. Pagos (sin pasarela): `Registrar/Ver/Eliminar pagos`. Residente (UF, mobile): `Ver mis expensas` (gatea `GET /expensas-uf/mias` + la entrada en la app).

**Egresos** (administración del complejo, cloud-only) — contraparte de los ingresos (expensas/multas). Configuración: `Ver/Editar configuración` (categorías de gasto + presupuesto). Proveedores: `Ver/Crear/Editar/Eliminar proveedores` (eliminar = soft-archive). Gastos: `Ver/Crear/Editar/Eliminar gastos`. Pagos a proveedores (sin pasarela): `Registrar/Ver/Eliminar pagos`. Reportes: `Ver balance` (cruce ingresos vs egresos por período), `Ver cuenta corriente` (saldo por proveedor). Solo nivel Complejo opera. Sin vista mobile UF (admin-only).

**Obras** (administración del complejo, cloud-only — doc 35 / D47) — Gestión (Complejo): `Ver obras`, `Revisar obras` (tomar en revisión, validar/observar docs, pedir documentación, comentar), `Aprobar obras` (aprobar/rechazar — separada de Revisar a propósito), `Suspender obras` (suspender/reanudar), `Registrar inspecciones` (Fase 2), `Finalizar obras`, `Anular obras` (post-aprobación solo admin), `Eliminar obras` (hard delete solo Borrador), `Ver/Editar configuración`. Residente (UF, mobile): `Ver mis obras`, `Crear obras` (cubre editar Borrador, cargar docs, presentar y anular propia pre-aprobación).

**Infracciones** (administración del complejo, cloud-only) — prefijo único `Infracciones -` que cubre multas Y apercibimientos. Multas: `Ver/Crear/Emitir/Anular/Eliminar multas` (emitir asigna nro correlativo `YYYY-NNNN`; eliminar = hard delete solo Borrador). Pagos de multas (cobro aparte, sin pasarela): `Registrar pagos`. Configuración (política de mora): `Ver/Editar configuración`. Infracciones/apercibimientos: `Ver/Crear/Anular/Eliminar infracciones`, `Escalar a multa` (crea una multa Borrador desde la infracción). Residente (UF, mobile, futuro): `Ver mis multas`. Solo nivel Complejo opera.

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
| `ITicket` | `botonSnapshot` (`{ idBoton, texto, icono, color, categoria, atendidoPor }`) | `POST /tickets`. Snapshot incluye `categoria` (lugar) y `atendidoPor` (quién atiende) para que el render/filtro histórico no dependa del catálogo vivo |

Quien renderiza historial **siempre** debe usar el snapshot. `idsVisitantes` / `idVehiculo` / `idBoton` siguen como referencias de trazabilidad, pero el catálogo subyacente puede haberse eliminado o editado. `IEventoVisita` NO tiene snapshot — los eventos Pendientes/Activos referencian catálogo vivo (editable). Una vez generados los ingresos asociados, el snapshot vive en `IIngresoEgreso`.

## Soft-archive — visitantes / vehículos

`IVisitante` e `IVehiculo` llevan `activo?: boolean` + `idPermisoCreador?: string` para soportar rotación de dueños de UF sin chocar con unicidad (teléfono/DNI/patente). `acceso-datos` indexa unique parcial sobre `activo: true` → archivados quedan fuera del índice, un nuevo activo en la misma UF puede reusar el mismo valor sin colisión. `acceso-api.scope.helper` filtra listados con `{ activo: { $ne: false } }`; el archive masivo (`PUT /<entidad>/archivar-por-uf/:idUF`) lo dispara `PermisosService.deshabilitar` cuando se desactiva el último permiso UF activo. Campos omitidos de `Create*` y `Update*` — los inyecta `acceso-api` en el create (`activo=true`, `idPermisoCreador=user.idPermiso`) y nadie los edita directo.

## `CategoriaPermiso` — clasificación del portador

Enum independiente del `nivel` y de los roles asignados:

```ts
"Propietario" | "Administración" | "Guardia" | "Prestador de Servicio" | "Mantenimiento"
```

**Defaults aplicados por `acceso-api` al crear (`PermisosService.create`):**

| Nivel | Default | Notas |
|---|---|---|
| `Unidad Funcional` | `Propietario` | Auto-asignado, único válido |
| `Cliente` | `Administración` | Auto-asignado, único válido |
| `Complejo` | — (requerido) | Elegir entre `Administración \| Guardia \| Prestador de Servicio \| Mantenimiento` |

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

---

## Pipeline JSON Schema (D42 — spec subset autoritativo)

A partir de D42, cada bump de `acceso-modelos` regenera JSON Schemas a partir de los schemas Zod vía `z.toJSONSchema({ target: 'openapi-3.0' })`. El output alimenta `acceso-doc-general/spec/hub-edge-contract.yaml` (subset spec autoritativo) y se versiona junto al `dist/`.

### Output

- `dist/json-schema/<SchemaName>.json` — un archivo por schema Zod
- `dist/json-schema/index.json` — bundle único con `$defs.<SchemaName>` para `$ref` desde el spec

### Cómo correrlo

```bash
npm run gen:json-schema          # corre tras build via prepare hook
npm run gen:json-schema -- --only=Acceso,Permiso --verbose
```

El script vive en `scripts/gen-json-schema.mjs` (Node ESM nativo, sin dependencies adicionales — corre directo con `node`). Itera todos los `*Schema` exportados desde `dist/index.js` (requiere build previo). `DocumentoSchema` y `ListadoSchema` (factories genéricas `IDocumento<T>` / `IListado<T>`) se skipean — son builders, no instancias; el spec los template-iza por cada entity.

### Política de validación: estructural vs runtime

JSON Schema captura **forma estructural**: campos, tipos, opcional/requerido, enums, nested objects, discriminated unions (emitidas como `oneOf`). Esta capa basta para que el edge satisfaga el contrato del Hub edge sin re-implementar reglas a mano.

**Reglas custom** (`.refine()`, `.transform()`, validadores cross-field, async checks) **NO se exportan** a JSON Schema (Zod limitación, `transform` es irreversible). Estas viven cloud-side runtime únicamente:

- Hoy: cero `.refine()` y cero `.transform()` en `src/` (verificado al cierre de D42).
- Si se suman a futuro: la regla custom queda como deuda implícita; el edge puede aceptar payload que cloud rechaza luego al sync. **Mitigación**: convertir regla a validación estructural (regex, enum, min/max) cuando es viable; documentar en este archivo si no.

### Discriminated unions

Las 6 discriminated unions actuales (`PermisoSchema`, `CreatePermisoSchema`, `UpdatePermisoSchema` derivadas de `PermisoBaseFields` + `RolSchema` family) se emiten como `{"oneOf": [...]}` con cada variante embedded. Output válido OpenAPI 3.0. Si después se quiere el keyword `discriminator` OpenAPI completo (mapping variant→ref explícito), sumar `zod-to-openapi` lib en sprint separado — la lib requiere registration explícita pero produce discriminator-aware spec.

### CI

`prepare` corre `tsc && gen:json-schema`. Consumers (`acceso-api`, `acceso-web`, `acceso-datos`, `acceso-edge`) al `npm install` reciben JSON Schemas frescos en `node_modules/acceso-modelos/dist/json-schema/`. CI workflow `acceso-modelos/.github/workflows/build.yml` publica los schemas como parte del artifact (TODO Fase 1).

---

## Spec subset autoritativo Hub edge (`spec/hub-edge-contract.yaml`)

A partir de v2.11.0, `acceso-modelos` es la **fuente de verdad** del contrato HTTP+WS del Hub edge (D42). Movimiento desde `acceso-doc-general/spec/` consolidado acá por dos razones:

1. **Coherencia con el modelo**: el spec referencia schemas Zod (via JSON Schema generado por `gen-json-schema.mjs`). Spec + schemas + tipos comparten lifecycle de bump. Lógico que vivan en el mismo paquete versionado.
2. **Distribución vía npm dep**: consumers (`acceso-api`, `acceso-edge`) ya hacen `npm run modelos` para refrescar tipos. Mismo flow refresca spec. Sin checkout cross-repo (el repo doc-general es privado y GITHUB_TOKEN default no tiene scope `repo` sobre él).

### Política de bump

`spec/hub-edge-contract.yaml` se versiona junto con el paquete:

- **Patch** (`2.11.x`): docstring, descripción, ejemplos. Sin cambio funcional.
- **Minor** (`2.x.0`): paths nuevos, campos opcionales, query params nuevos.
- **Major** (`x.0.0`): breaking. Path eliminado, shape de response cambiada, campo requerido nuevo.

`info.version` dentro del yaml refleja la versión semver del spec (puede divergir del package version si solo cambia el spec sin tocar Zod schemas — raro, normalmente bumpear ambos en sync).

### Consumidores conocidos

- **`acceso-api`**: workflow `.github/workflows/hub-edge-contract-check.yml` lee `node_modules/acceso-modelos/spec/hub-edge-contract.yaml` para validar que el cloud cubre el subset declarado como `edge-required` / `edge-candidate`.
- **`acceso-edge`**:
  - `Makefile` target `hub-edge-spec` lee desde `node_modules/acceso-modelos/spec/hub-edge-contract.yaml` y genera `internal/core/contract/spec.gen.go` via `oapi-codegen`.
  - Harness `scripts/paridad/cmd verify-spec` (F3.S1) usa el mismo path por default; override con `--spec=` flag.

### Histórico

El spec arrancó en `acceso-doc-general/spec/hub-edge-contract.yaml` (PR #5 doc-general). Se mueve acá en v2.11.0 (PR #16 acceso-modelos). El espacio en doc-general queda libre para documentación arquitectónica de alto nivel (`DECISIONES.md`, `docs/analisis/`, docs numerados); el contrato técnico vive donde se distribuye.
