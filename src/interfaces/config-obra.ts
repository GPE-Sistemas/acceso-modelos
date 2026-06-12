import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { TipoObraSchema } from "./obra";
import { TipoDocumentoObraSchema } from "./documento-obra";

/**
 * Configuración del módulo Obras de un complejo (doc 35). Una por complejo
 * (índice único en idComplejo, lazy create) — patrón `IConfigMultaComplejo`.
 * Endpoints `GET/PUT /config-obra/by-complejo/:idComplejo`.
 *
 * La documentación requerida por tipo de obra es **informativa** (checklist en
 * el form de la solicitud) — NO bloquea la presentación; el faltante se maneja
 * con el flujo "pedir documentación" (decisión Fernando, D47).
 */

/** Checklist informativo de documentación por tipo de obra. */
export const DocumentacionRequeridaObraSchema = z.object({
  tipoObra: TipoObraSchema,
  tiposDocumento: z.array(TipoDocumentoObraSchema),
});
export type IDocumentacionRequeridaObra = z.infer<
  typeof DocumentacionRequeridaObraSchema
>;

/**
 * Horarios de trabajo permitidos — default de la recurrencia del
 * `IEventoVisita` que se genera al aprobar (acceso del personal de obra).
 */
export const HorariosTrabajoObraSchema = z.object({
  /** 0=domingo … 6=sábado (convención IRecurrenciaEventoVisita). */
  diasSemana: z.array(z.number().int().min(0).max(6)),
  /** "HH:mm". */
  horaDesde: z.string().optional(),
  horaHasta: z.string().optional(),
});
export type IHorariosTrabajoObra = z.infer<typeof HorariosTrabajoObraSchema>;

export const ConfigObraComplejoSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  /** Prefill del tramo inicial de tarifa al aprobar una obra (Fase 2). */
  derechoConstruccionMensualDefault: z.number().nonnegative().optional(),
  /** Costo default de una reinspección (Fase 2). */
  costoReinspeccion: z.number().nonnegative().optional(),
  /** Prefill del plazo máximo al aprobar. */
  plazoMaximoDiasDefault: z.number().int().positive().optional(),
  /** Prefill del depósito de garantía (Fase 2). */
  montoGarantiaDefault: z.number().nonnegative().optional(),
  /** Checklist informativo por tipo de obra (sin bloqueo de presentación). */
  documentacionRequerida: z.array(DocumentacionRequeridaObraSchema).optional(),
  /** Default de la recurrencia del evento de acceso del personal. */
  horariosTrabajo: HorariosTrabajoObraSchema.optional(),
  /** Referencia / link al reglamento de construcción del complejo. */
  textoReglamento: z.string().optional(),
  habilitado: z.boolean().optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
});

export const CreateConfigObraComplejoSchema = ConfigObraComplejoSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  cliente: true,
  complejo: true,
});

export const UpdateConfigObraComplejoSchema = ConfigObraComplejoSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  idCliente: true,
  idComplejo: true,
  cliente: true,
  complejo: true,
}).partial();

export type IConfigObraComplejo = z.infer<typeof ConfigObraComplejoSchema>;
export type ICreateConfigObraComplejo = z.infer<
  typeof CreateConfigObraComplejoSchema
>;
export type IUpdateConfigObraComplejo = z.infer<
  typeof UpdateConfigObraComplejoSchema
>;
