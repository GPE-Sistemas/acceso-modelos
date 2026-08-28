import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { PermisoSchema } from "./permiso";
import { UnidadFuncionalSchema } from "./unidad-funcional";

/**
 * Estado del voucher. `Consumida` cuando `usosConsumidos >= usosMaximos`;
 * `Vencida` al pasar `vigenciaHasta` sin agotar los usos.
 */
export const EstadoAutorizacionEgresoMenorSchema = z.enum([
  "Vigente",
  "Consumida",
  "Vencida",
  "Anulada",
]);

/**
 * Autorización de egreso previa y puntual de un menor — el "voucher" de D57
 * (doc 44). La carga un responsable de la UF ANTES de que el menor pase por el
 * egreso: durante la ventana declarada, el egreso se aprueba solo y consume un
 * uso.
 *
 * Es entidad propia y no un subdocumento del permiso porque tiene ciclo de vida
 * independiente: se consume, vence, se anula y se audita. Las excepciones
 * estables (siempre / franjas horarias) sí viven en
 * `IPermisoUnidadFuncional.politicaEgreso`.
 *
 * VIVE EN EL EDGE: se evalúa con el appliance aislado, así que sincroniza
 * cloud→edge como el resto del padrón y el consumo sube por outbox. El uso se
 * ata al `IIngresoEgreso` que lo gastó (`idIngresoEgreso` en el evento), no a un
 * contador ciego: un reintento del outbox no puede gastar dos usos.
 */
export const AutorizacionEgresoMenorSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  /**
   * Timestamp de la última mutación (ISO 8601). Mismo patrón anti-eco bilateral
   * que el resto de entidades — server defaultea si se omite.
   */
  fechaActualizacion: z.string().optional(),
  habilitado: z.boolean().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  idUnidadFuncional: z.string().optional(),
  /** Permiso del menor habilitado a egresar. */
  idPermisoMenor: z.string().optional(),
  /** Ventana de validez del voucher. */
  vigenciaDesde: z.string().optional(),
  vigenciaHasta: z.string().optional(),
  /** 1 = salida única; 2 = salida + regreso. */
  usosMaximos: z.number().int().positive().optional(),
  /** Lo lleva el edge al consumir; el cloud lo recibe por outbox. */
  usosConsumidos: z.number().int().nonnegative().optional(),
  /** Texto libre del responsable ("cumpleaños de Juan"). */
  motivo: z.string().optional(),
  estado: EstadoAutorizacionEgresoMenorSchema.optional(),
  // Auditoría — el otorgante lo inyecta acceso-api desde el token.
  otorgadaPorIdPermiso: z.string().optional(),
  fechaOtorgamiento: z.string().optional(),
  anuladaPorIdPermiso: z.string().optional(),
  fechaAnulacion: z.string().optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
  unidadFuncional: UnidadFuncionalSchema.optional(),
  permisoMenor: PermisoSchema.optional(),
  otorgadaPorPermiso: PermisoSchema.optional(),
});

export const CreateAutorizacionEgresoMenorSchema =
  AutorizacionEgresoMenorSchema.omit({
    _id: true,
    fechaCreacion: true,
    fechaActualizacion: true,
    usosConsumidos: true,
    otorgadaPorIdPermiso: true,
    fechaOtorgamiento: true,
    anuladaPorIdPermiso: true,
    fechaAnulacion: true,
    cliente: true,
    complejo: true,
    unidadFuncional: true,
    permisoMenor: true,
    otorgadaPorPermiso: true,
  });

export const UpdateAutorizacionEgresoMenorSchema =
  CreateAutorizacionEgresoMenorSchema.partial();

export type IEstadoAutorizacionEgresoMenor = z.infer<
  typeof EstadoAutorizacionEgresoMenorSchema
>;
export type IAutorizacionEgresoMenor = z.infer<
  typeof AutorizacionEgresoMenorSchema
>;
export type ICreateAutorizacionEgresoMenor = z.infer<
  typeof CreateAutorizacionEgresoMenorSchema
>;
export type IUpdateAutorizacionEgresoMenor = z.infer<
  typeof UpdateAutorizacionEgresoMenorSchema
>;
