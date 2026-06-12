import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { UnidadFuncionalSchema } from "./unidad-funcional";
import { PermisoSchema } from "./permiso";

/**
 * Obra en una unidad funcional (módulo Obras — doc 35, decisión D47).
 *
 * Una sola entidad cubre solicitud + ejecución: la solicitud ES la obra en su
 * fase inicial. El residente (nivel UF) la crea y presenta desde mobile; la
 * administración del complejo la revisa, pide documentación, aprueba/rechaza y
 * gestiona la ejecución desde web. **Cloud-only** — la única pieza que llega al
 * edge es el `IEventoVisita` recurrente auto-generado al aprobar (acceso del
 * personal de obra), entidad ya bridgeada.
 *
 * Ciclo de vida (`estado`):
 *   Borrador → Presentada → En revisión ⇄ Documentación pendiente
 *     → Aprobada → En ejecución ⇄ Suspendida → Finalizada
 *   Ramas terminales: Rechazada, Anulada.
 * "Vencida" NO es estado persistido — se deriva de
 * `fechaInicioReal + plazoMaximoDias < now` (criterio multas).
 *
 * Etapas/inspecciones y datos económicos están modelados desde Fase 1 pero su
 * operación (UI + liquidación) es Fase 2.
 */

export const EstadoObraSchema = z.enum([
  /** El residente arma la solicitud — editable. */
  "Borrador",
  /** Enviada a la administración — asigna `numero` correlativo. */
  "Presentada",
  /** La administración tomó el expediente. */
  "En revisión",
  /** Se pidió documentación adicional; la UF carga y re-presenta. */
  "Documentación pendiente",
  /** Autorizada a iniciar — se generó el evento de acceso del personal. */
  "Aprobada",
  /** Inicio real registrado. */
  "En ejecución",
  /** Paralizada por la administración (⇄ En ejecución). */
  "Suspendida",
  /** Final de obra otorgado — terminal. */
  "Finalizada",
  /** Rechazada por la administración (con motivo) — terminal. */
  "Rechazada",
  /** Desistida por la UF (pre-aprobación) o anulada por admin — terminal. */
  "Anulada",
]);
export type EEstadoObra = z.infer<typeof EstadoObraSchema>;

export const TipoObraSchema = z.enum([
  "Obra nueva",
  "Ampliación",
  "Refacción/Remodelación",
  "Demolición",
  "Piscina",
  "Quincho/Pérgola",
  "Parquización",
  "Otro",
]);
export type ETipoObra = z.infer<typeof TipoObraSchema>;

// ─── Responsables (subdocs sin _id) ───────────────────────────────────────────

/** Profesional responsable / director de obra (matriculado). */
export const ProfesionalObraSchema = z.object({
  nombre: z.string(),
  matricula: z.string().optional(),
  telefono: z.string().optional(),
  email: z.string().optional(),
});
export type IProfesionalObra = z.infer<typeof ProfesionalObraSchema>;

export const ConstructoraObraSchema = z.object({
  razonSocial: z.string(),
  cuit: z.string().optional(),
  contacto: z.string().optional(),
});
export type IConstructoraObra = z.infer<typeof ConstructoraObraSchema>;

// ─── Derecho de construcción — tarifa mensual versionada (Fase 2) ─────────────

/**
 * Tramo de tarifa del derecho de construcción. Versionada por período (patrón
 * `ITasaMora`): el monto mensual puede cambiar durante la obra (ej. mes 1-4
 * paga 100, desde el mes 5 paga 110). La vigente para un período P se resuelve
 * tomando la entrada con mayor `vigenteDesde` ≤ P. El tramo inicial lo ingresa
 * el admin al aprobar (prefill desde `IConfigObraComplejo`).
 */
export const TramoDerechoConstruccionSchema = z.object({
  /** Período desde el que rige, formato "YYYY-MM". */
  vigenteDesde: z.string(),
  montoMensual: z.number().nonnegative(),
});
export type ITramoDerechoConstruccion = z.infer<
  typeof TramoDerechoConstruccionSchema
>;

// ─── Etapas e inspecciones (Fase 2 — modeladas desde Fase 1) ─────────────────

export const ResultadoInspeccionObraSchema = z.enum([
  "Aprobada",
  "Observada",
  "Rechazada",
]);
export type EResultadoInspeccionObra = z.infer<
  typeof ResultadoInspeccionObraSchema
>;

/**
 * Inspección de una etapa. Mecanismo propio (NO módulo de turnos): se agenda
 * con `fechaProgramada` (push de aviso a la UF) y luego se registra el
 * resultado. Las reinspecciones pueden tener costo (liquidable vía expensas).
 */
export const InspeccionObraSchema = z.object({
  _id: z.string().optional(),
  fechaProgramada: z.string().optional(),
  fechaRealizada: z.string().optional(),
  resultado: ResultadoInspeccionObraSchema.optional(),
  observaciones: z.string().optional(),
  idPermisoInspector: z.string().optional(),
  esReinspeccion: z.boolean().optional(),
  /** Costo de la reinspección (liquidable como ítem de expensa, Fase 2). */
  costo: z.number().nonnegative().optional(),
});
export type IInspeccionObra = z.infer<typeof InspeccionObraSchema>;

export const EstadoEtapaObraSchema = z.enum([
  "Pendiente",
  "En curso",
  "Aprobada",
  "Observada",
]);
export type EEstadoEtapaObra = z.infer<typeof EstadoEtapaObraSchema>;

export const EtapaObraSchema = z.object({
  _id: z.string().optional(),
  nombre: z.string(),
  orden: z.number().int().nonnegative(),
  estado: EstadoEtapaObraSchema.optional(),
  inspecciones: z.array(InspeccionObraSchema).optional(),
});
export type IEtapaObra = z.infer<typeof EtapaObraSchema>;

// ─── Anulación ────────────────────────────────────────────────────────────────

export const AnulacionObraSchema = z.object({
  motivo: z.string().optional(),
  fecha: z.string().optional(),
  idPermiso: z.string().optional(),
});
export type IAnulacionObra = z.infer<typeof AnulacionObraSchema>;

// ─── Obra ─────────────────────────────────────────────────────────────────────

export const ObraSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  /** UF donde se ejecuta la obra. */
  idUnidadFuncional: z.string().optional(),
  /** Permiso UF que creó la solicitud. Lo inyecta acceso-api. */
  idPermisoSolicitante: z.string().optional(),
  /** Correlativo por complejo "YYYY-NNNN". Asignado por acceso-api al presentar. */
  numero: z.string().optional(),
  tipo: TipoObraSchema,
  titulo: z.string(),
  descripcion: z.string().optional(),
  /** Default 'Borrador' — transiciones solo vía endpoints de acción de acceso-api. */
  estado: EstadoObraSchema.optional(),
  // Fechas del ciclo.
  fechaPresentacion: z.string().optional(),
  fechaAprobacion: z.string().optional(),
  fechaInicioEstimada: z.string().optional(),
  fechaInicioReal: z.string().optional(),
  fechaFinEstimada: z.string().optional(),
  fechaFinReal: z.string().optional(),
  /** Plazo máximo de ejecución en días — lo setea el admin al aprobar. */
  plazoMaximoDias: z.number().int().positive().optional(),
  // Responsables.
  profesional: ProfesionalObraSchema.optional(),
  constructora: ConstructoraObraSchema.optional(),
  /**
   * Personal de obra — visitantes del catálogo de la UF (mismo selector que
   * eventos de visita). El complejo puede promoverlos a globales después.
   */
  idsVisitantes: z.array(z.string()).optional(),
  /** Vehículos de obra (catálogo de la UF). */
  idsVehiculos: z.array(z.string()).optional(),
  /**
   * Evento de visita recurrente vigente, auto-generado por acceso-api al
   * aprobar (acceso del personal durante el plazo, patrón Turno.idEventoVisita).
   * Suspender/anular/finalizar la obra lo cancela; reanudar genera uno nuevo.
   */
  idEventoVisita: z.string().optional(),
  // Económico (Fase 2 — modelado desde Fase 1).
  /** Tarifa mensual versionada del derecho de construcción interno. */
  derechoConstruccion: z.array(TramoDerechoConstruccionSchema).optional(),
  /**
   * Períodos "YYYY-MM" ya facturados en una liquidación (anti-doble-cobro del
   * derecho de construcción — cargo recurrente, el flag binario de turnos no
   * alcanza). Mantenido por acceso-api al generar/revertir expensas.
   */
  periodosFacturados: z.array(z.string()).optional(),
  /** Depósito de garantía por daños (registro, sin tracking de devolución en F1/F2). */
  montoGarantia: z.number().nonnegative().optional(),
  // Ramas del ciclo.
  motivoRechazo: z.string().optional(),
  motivoSuspension: z.string().optional(),
  fechaSuspension: z.string().optional(),
  anulacion: AnulacionObraSchema.optional(),
  /**
   * Apercibimiento auto-generado por plazo vencido (scheduler Fase 2) — dedup
   * para no crear más de uno por obra.
   */
  idInfraccionVencimiento: z.string().optional(),
  // Etapas (Fase 2).
  etapas: z.array(EtapaObraSchema).optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  unidadFuncional: UnidadFuncionalSchema.optional(),
  permisoSolicitante: PermisoSchema.optional(),
  /** z.any para no acoplar/inflar inferencia con EventoVisitaSchema. */
  eventoVisita: z.any().optional(),
});

/**
 * Create = lo que arma el residente en el Borrador. Todo lo gestionado por
 * server (numero, estado, fechas de ciclo, económico, evento, etapas) se omite
 * — las transiciones van por endpoints de acción.
 */
export const CreateObraSchema = ObraSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  idPermisoSolicitante: true,
  numero: true,
  estado: true,
  fechaPresentacion: true,
  fechaAprobacion: true,
  fechaInicioReal: true,
  fechaFinReal: true,
  plazoMaximoDias: true,
  idEventoVisita: true,
  derechoConstruccion: true,
  periodosFacturados: true,
  montoGarantia: true,
  motivoRechazo: true,
  motivoSuspension: true,
  fechaSuspension: true,
  anulacion: true,
  idInfraccionVencimiento: true,
  etapas: true,
  cliente: true,
  complejo: true,
  unidadFuncional: true,
  permisoSolicitante: true,
  eventoVisita: true,
});

export const UpdateObraSchema = CreateObraSchema.partial();

export type IObra = z.infer<typeof ObraSchema>;
export type ICreateObra = z.infer<typeof CreateObraSchema>;
export type IUpdateObra = z.infer<typeof UpdateObraSchema>;
