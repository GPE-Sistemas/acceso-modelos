import { z } from "zod";
import { GeoJSONPointSchema } from "../auxiliares/geojson";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";

export const TipoAccesoSchema = z.enum(["Ingreso", "Egreso", "Ambos"]);
export const TipoPersonaAccesoSchema = z.enum([
  "Propietarios",
  "Visitas",
  "Ambos",
]);

/**
 * Estado FÍSICO del actuador del acceso (D53). Runtime, lo reporta el edge.
 * Siempre acompañado de `confianzaEstado` — sin realimentación cableada el
 * sistema sabe qué ordenó, no dónde quedó el fierro.
 */
export const EstadoFisicoAccesoSchema = z.enum([
  "Cerrado",
  "Abriendo",
  "Abierto",
  "Cerrando",
  "Desconocido",
]);

/**
 * Cuánto vale el `estadoFisico` (D53). Obligatorio junto con el estado, y se
 * muestra en la UI: publicar un estado inferido como si fuera medido es
 * mostrarle al guardia una barrera abierta que capaz nunca se movió.
 *
 * - `Reportado`: hay realimentación física cableada (fin de carrera / lazo).
 * - `Inferido`: derivado del comando emitido y/o del relé del actuador.
 * - `Desconocido`: sin dato (recién configurado, actuador offline, arranque).
 */
export const ConfianzaEstadoAccesoSchema = z.enum([
  "Reportado",
  "Inferido",
  "Desconocido",
]);

/** De dónde salió el `estadoFisico` (D53). */
export const FuenteEstadoAccesoSchema = z.enum([
  "Sensor",
  "Relé del actuador",
  "Comando emitido",
]);

/**
 * Modo operativo del acceso (D53). Es estado DESEADO gobernado por el sistema,
 * no una lectura: sobrevive al reinicio del actuador y la reconciliación lo
 * vuelve a aplicar.
 *
 * - `Normal`: control de acceso habitual (credencial / aprobación).
 * - `Liberado`: paso libre (evento, mudanza, evacuación). Según el actuador se
 *   implementa nativo (`mantenerAbierto` en cerradura) o como política nuestra
 *   (en barrera pulsada: se abre y no se ordena el cierre).
 * - `Bloqueado`: nadie pasa aunque presente credencial válida (emergencia).
 */
export const EstadoOperativoAccesoSchema = z.enum([
  "Normal",
  "Liberado",
  "Bloqueado",
]);

export const AccesoSchema = z.object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    idCliente: z.string().optional(),
    idComplejo: z.string().optional(),
    nombre: z.string().optional(),
    habilitado: z.boolean().optional(),
    tipo: TipoAccesoSchema.optional(),
    tipoPersona: TipoPersonaAccesoSchema.optional(),
    ubicacion: GeoJSONPointSchema.optional(),
    /** Dispositivo que provee el video de PORTERÍA de este acceso (FK a IDispositivo):
     *  el terminal con cámara (ej. HIK DS-K1T502DBFWX-C) o una cámara/NVR asociada.
     *  El panel del guardia lo usa para mostrar el snapshot/stream del acceso.
     *  Sin populate acá (evita inflar la inferencia TS de la cadena
     *  IAcceso ⊂ IIngresoEgreso); el consumidor resuelve el device por separado. */
    idDispositivoPorteria: z.string().optional(),
    // --- Actuación (D53, doc 42-actuadores-y-barreras.md) ---
    /** Qué `IDispositivoAcceso` acciona este acceso. Resuelve la ambigüedad
     *  cuando el acceso tiene terminal Y controlador: al designar uno, el otro
     *  queda pasivo. Sin árbitro explícito, dos relés en el mismo acceso es un
     *  empate. Ausente = el acceso no se acciona por sistema (barrera manual,
     *  paso franco). */
    idDispositivoAccesoActuador: z.string().optional(),
    /** Estado físico reportado del actuador. Lo escribe el edge; el operador no
     *  lo edita. Siempre leerlo junto a `confianzaEstado`. */
    estadoFisico: EstadoFisicoAccesoSchema.optional(),
    confianzaEstado: ConfianzaEstadoAccesoSchema.optional(),
    fuenteEstado: FuenteEstadoAccesoSchema.optional(),
    /** ISO — cuándo se actualizó `estadoFisico`. Un estado viejo es sospechoso
     *  aunque diga `Abierto`. */
    fechaEstado: z.string().optional(),
    /** Modo operativo deseado. Ausente ⇒ se opera como `Normal`. */
    estadoOperativo: EstadoOperativoAccesoSchema.optional(),
    /** ISO — hasta cuándo vale el modo operativo no-`Normal` (liberación
     *  temporal). Vencido ⇒ el sistema vuelve a `Normal`. Ausente = sin
     *  vencimiento (hay que normalizarlo a mano). */
    vigenteHasta: z.string().optional(),
    /** Por qué se liberó / bloqueó. Requerido por la UI al salir de `Normal`. */
    motivoEstadoOperativo: z.string().optional(),
    /** Quién dejó el acceso en este modo operativo (permiso del operador). */
    idPermisoEstadoOperativo: z.string().optional(),
    // Populate
    cliente: ClienteSchema.optional(),
    complejo: ComplejoSchema.optional(),
  });

export const CreateAccesoSchema = AccesoSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
});

export const UpdateAccesoSchema = AccesoSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
}).partial();

export type ITipoAcceso = z.infer<typeof TipoAccesoSchema>;
export type ITipoPersonaAcceso = z.infer<typeof TipoPersonaAccesoSchema>;
export type IEstadoFisicoAcceso = z.infer<typeof EstadoFisicoAccesoSchema>;
export type IConfianzaEstadoAcceso = z.infer<
  typeof ConfianzaEstadoAccesoSchema
>;
export type IFuenteEstadoAcceso = z.infer<typeof FuenteEstadoAccesoSchema>;
export type IEstadoOperativoAcceso = z.infer<
  typeof EstadoOperativoAccesoSchema
>;
export type IAcceso = z.infer<typeof AccesoSchema>;
export type ICreateAcceso = z.infer<typeof CreateAccesoSchema>;
export type IUpdateAcceso = z.infer<typeof UpdateAccesoSchema>;
