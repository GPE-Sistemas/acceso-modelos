import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";

/**
 * IAsignacionDispositivo — qué dispositivo estuvo dónde, desde cuándo (D55 §4.6
 * generalizada por D66.4, acceso-doc-general doc 53 §4.1).
 *
 * Es el historial del equipo. Para un MEDIDOR es la instalación en la UF: no
 * hay entidad de "punto de medición" — la UF ya es el punto, las áreas comunes
 * son UF tipo `Común` y el medidor general va al complejo. Para un TRACKER es la
 * entrega a una visita en la garita (Etapa 7).
 *
 * Lectura de la UF en un instante, con la asignación vigente según la fecha del
 * dato:  lecturaInicial + (odometro − odometroInicial) × factor
 * El odómetro crudo nunca se pisa: si se corrige la lectura inicial o el
 * factor, se recalcula.
 *
 * Reglas: una sola asignación vigente por dispositivo; N por UF y servicio (un
 * lote grande puede tener dos medidores de agua); reemplazo = cerrar con
 * `lecturaFinal`/`odometroFinal` y abrir otra.
 */

export const DestinoAsignacionSchema = z.enum(["Visita", "UnidadFuncional", "Complejo"]);
export const ServicioMedidoSchema = z.enum(["Agua", "Gas", "Electricidad"]);

/**
 * 'Provisorio' hasta el primer reporte posterior a la instalación (patrón Gas
 * `confirmarBaselineSiCorresponde`). 'Incoherente' si el odómetro queda por
 * debajo del inicial: el consumo no se calcula, no se inventa.
 */
export const EstadoBaselineSchema = z.enum(["Provisorio", "Confirmado", "Incoherente"]);

/** `Activa` = vigente. Los tres últimos son del tracker (D55 §4.6). */
export const EstadoAsignacionDispositivoSchema = z.enum([
  "Activa",
  "Cerrada",
  "Devuelta",
  "NoDevuelta",
  "Perdida",
]);

export const AsignacionDispositivoSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  /** Tipo A: último-write-wins edge↔cloud. */
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  idDispositivo: z.string(),
  destino: DestinoAsignacionSchema,
  estado: EstadoAsignacionDispositivoSchema.optional(),
  /** Desde cuándo vale la asignación: es el eje de atribución de las lecturas. */
  fechaDesde: z.string(),
  /** Ausente mientras está vigente. */
  fechaHasta: z.string().optional(),

  // ── Medidor (destino UnidadFuncional / Complejo) ─────────────────────────
  /** Destino 'UnidadFuncional'. Áreas comunes = UF tipo 'Común'. */
  idUnidadFuncional: z.string().optional(),
  /** Solo medidores. Un SML mide agua o gas según dónde se instala. */
  servicio: ServicioMedidoSchema.optional(),
  /** Lo que marca el dial del medidor físico al instalar, en la unidad del
   *  servicio (m3, kWh). Editable. */
  lecturaInicial: z.number().optional(),
  /** Lo que marca el contador del DISPOSITIVO en ese momento (crudo). Un
   *  contador de pulsos arranca en 0 al encender: sin esto, el primer reporte
   *  se facturaría entero. */
  odometroInicial: z.number().optional(),
  /** Unidades del servicio por unidad cruda. Default del perfil
   *  (`factorDefault`); se pisa por asignación. */
  factor: z.number().positive().optional(),
  /** Copia de `IPerfilDecodificacion.lecturaDirecta` al instalar (la pone
   *  acceso-api): la lectura base se toma del equipo, con lecturaInicial =
   *  odometroInicial × factor. Las lecturas no se editan a mano. */
  lecturaDirecta: z.boolean().optional(),
  estadoBaseline: EstadoBaselineSchema.optional(),
  lecturaFinal: z.number().optional(),
  odometroFinal: z.number().optional(),
  /** objectName (bucket privado) de la foto del dial al instalar / retirar. */
  fotoInstalacion: z.string().optional(),
  fotoRetiro: z.string().optional(),

  // ── Tracker (destino Visita, Etapa 7) ────────────────────────────────────
  idEventoVisita: z.string().optional(),
  idVisitante: z.string().optional(),
  idVehiculo: z.string().optional(),
  /** SNAPSHOT de la UF destino del evento al entregar: la verificación de
   *  destino necesita el polígono de ESE destino aunque el evento se edite. */
  idUnidadFuncionalDestino: z.string().optional(),
  idIngresoEgresoEntrega: z.string().optional(),
  idIngresoEgresoDevolucion: z.string().optional(),
  motivoSalidaSinDevolver: z.string().optional(),

  idPermisoAlta: z.string().optional(),
  idPermisoCierre: z.string().optional(),
  observaciones: z.string().optional(),
  // Populate — `dispositivo`/`unidadFuncional` como z.any(): IDispositivo trae
  // cadena profunda de populate (mismo criterio que vinculo-evento-ingreso.ts).
  dispositivo: z.any().optional(),
  unidadFuncional: z.any().optional(),
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
});

export const CreateAsignacionDispositivoSchema = AsignacionDispositivoSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  dispositivo: true,
  unidadFuncional: true,
  cliente: true,
  complejo: true,
});

/** `null` borra el valor: un campo ausente del JSON no se distingue de "no lo
 *  cambio". Borrar el contador inicial devuelve la lectura base a Provisorio
 *  (la completa el próximo reporte); borrar el factor vuelve al del perfil. */
export const UpdateAsignacionDispositivoSchema = CreateAsignacionDispositivoSchema.partial().extend({
  odometroInicial: z.number().nullable().optional(),
  factor: z.number().positive().nullable().optional(),
});

/** Body de `PUT /asignaciones-dispositivo/:id/cerrar` (retiro / reemplazo). */
export const CerrarAsignacionDispositivoSchema = z.object({
  fechaHasta: z.string().optional(),
  lecturaFinal: z.number().optional(),
  odometroFinal: z.number().optional(),
  fotoRetiro: z.string().optional(),
  observaciones: z.string().optional(),
});

export type IDestinoAsignacion = z.infer<typeof DestinoAsignacionSchema>;
export type IServicioMedido = z.infer<typeof ServicioMedidoSchema>;
export type IEstadoBaseline = z.infer<typeof EstadoBaselineSchema>;
export type IEstadoAsignacionDispositivo = z.infer<typeof EstadoAsignacionDispositivoSchema>;
export type IAsignacionDispositivo = z.infer<typeof AsignacionDispositivoSchema>;
export type ICreateAsignacionDispositivo = z.infer<typeof CreateAsignacionDispositivoSchema>;
export type IUpdateAsignacionDispositivo = z.infer<typeof UpdateAsignacionDispositivoSchema>;
export type ICerrarAsignacionDispositivo = z.infer<typeof CerrarAsignacionDispositivoSchema>;
