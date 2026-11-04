import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ModeloRtuDispositivoSchema } from "./dispositivo";

/**
 * IPlantillaRtu — cómo está configurado un RTU de bombeo y qué significa cada
 * valor que reporta (D72, acceso-doc-general doc 58 §3.2).
 *
 * El UC300 manda en cada F4 los canales Modbus como enteros CRUDOS, sin
 * dirección de registro ni escala: la plantilla es lo que convierte "canal 3,
 * valor 2 de 3" en `b1.par_nm = 12,5`. Debe coincidir con lo grabado en el
 * equipo (ToolBox); la ingesta anota en la estación las diferencias que puede
 * ver (cantidad de canales, de valores, signo) — la dirección no viaja en el F4.
 *
 * Es configurable porque los tableros varían (con o sin variador, otro sensor,
 * otra cantidad de bombas). Sin `idCliente` = plantilla global (la mantiene
 * GPE). Versionada: los reportes guardan la versión con la que se escalaron.
 */

/** A qué parte de la estación pertenece un canal o una entrada. */
export const AmbitoSenalBombeoSchema = z.enum(["Pozo", "Bomba"]);

/**
 * Semántica de una señal. La usan los derivados (`Marcha` alimenta arranques y
 * horas; `Falla`, las alertas; `Energia`, el delta con vuelta) y la UI para
 * rotular. `Numero`/`Booleana` = dato sin semántica especial.
 */
export const TipoSenalBombeoSchema = z.enum([
  "Nivel",
  "Marcha",
  "Falla",
  "CodigoFalla",
  "Corriente",
  "Frecuencia",
  "Potencia",
  "Energia",
  "Tension",
  "Par",
  "Sano",
  "Booleana",
  "Numero",
]);

export const EntradaDigitalRtuSchema = z.enum(["DI1", "DI2", "DI3", "DI4"]);

export const SenalPlantillaRtuSchema = z.object({
  /** Sin prefijo: `nivel_m`, `marcha`, `corriente_a`. En la estación queda
   *  `pozo.<clave>` o `b<n>.<clave>`. */
  clave: z.string().regex(/^[a-z][a-z0-9_]*$/),
  nombre: z.string(),
  tipo: TipoSenalBombeoSchema,
  /** valor = crudo / divisor (ausente = 1). Ignorado en booleanas (crudo ≠ 0). */
  divisor: z.number().positive().optional(),
  unidad: z.string().optional(),
  booleana: z.boolean().optional(),
  /** Acumulador que da la vuelta (la energía del V20 en 32768): los deltas se
   *  calculan módulo este valor. */
  acumuladorConVuelta: z.number().int().positive().optional(),
});

/** `numeroBomba` es obligatorio con `ambito: 'Bomba'`: lo valida acceso-api
 *  (sin `.refine()`, que no se exporta a JSON Schema). Ídem en las entradas. */
export const CanalPlantillaRtuSchema = z.object({
    /** 1..16, el Channel ID del ToolBox. */
    canal: z.number().int().min(1).max(16),
    esclavo: z.number().int().min(1).max(247),
    /** Dirección cruda del cable (4xxxx − 40001). Solo documental: no viaja en el F4. */
    direccion: z.number().int().min(0).max(65535),
    conSigno: z.boolean(),
    ambito: AmbitoSenalBombeoSchema,
    numeroBomba: z.number().int().positive().optional(),
    /** Una por registro leído, en orden (el UC300 lee 1-4 registros por canal). */
    senales: z.array(SenalPlantillaRtuSchema).min(1).max(4),
});

export const EntradaPlantillaRtuSchema = z.object({
    entrada: EntradaDigitalRtuSchema,
    ambito: AmbitoSenalBombeoSchema,
    numeroBomba: z.number().int().positive().optional(),
    clave: z.string().regex(/^[a-z][a-z0-9_]*$/),
    nombre: z.string(),
    tipo: TipoSenalBombeoSchema,
    /** El contacto cerrado significa "no" (ej. contacto NC de nivel alto). */
    invertida: z.boolean().optional(),
});

export const FuncionModbusComandoSchema = z.enum(["FC6", "FC16"]);

/**
 * Orden por RS-485 (Modbus transparente) a la bomba. El esclavo sale de
 * `IEstacionBombeo.bombas[].esclavoModbus`. `accepted` del UC300 solo dice que
 * el esclavo contestó: la orden se da por cumplida cuando una lectura OK
 * posterior trae `confirmacion.clave` en `valorEsperado` (doc 58 §7).
 */
export const ComandoPlantillaRtuSchema = z.object({
  clave: z.string().regex(/^[a-z][a-z0-9_]*$/),
  nombre: z.string(),
  funcion: FuncionModbusComandoSchema,
  /** Dirección cruda (40100 → 99). */
  registro: z.number().int().min(0).max(65535),
  /** FC6: un valor; FC16: uno por registro desde `registro`. */
  valores: z.array(z.number().int().min(0).max(65535)).min(1),
  /** Señal de la bomba (sin prefijo) que confirma la orden. */
  confirmacion: z.object({
    clave: z.string(),
    valorEsperado: z.union([z.boolean(), z.number()]),
    /** Ausente = 30. */
    timeoutSegundos: z.number().int().positive().optional(),
  }),
  /** No se ofrece con la señal de falla de la bomba activa. */
  bloqueadoSiFalla: z.boolean().optional(),
  /** Pide confirmación reforzada en la UI (parar una bomba cloacal). */
  critico: z.boolean().optional(),
});

export const PlantillaRtuSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  /** Ausente = plantilla global de la plataforma. */
  idCliente: z.string().optional(),
  nombre: z.string(),
  descripcion: z.string().optional(),
  modeloRtu: ModeloRtuDispositivoSchema,
  /** La sube acceso-api con cada cambio de canales/entradas/comandos. */
  version: z.number().int().positive(),
  habilitada: z.boolean().optional(),
  cantidadBombas: z.number().int().min(1).max(8),
  canales: z.array(CanalPlantillaRtuSchema).max(16),
  entradas: z.array(EntradaPlantillaRtuSchema).max(4).optional(),
  comandos: z.array(ComandoPlantillaRtuSchema).optional(),
  // Populate
  cliente: ClienteSchema.optional(),
});

export const CreatePlantillaRtuSchema = PlantillaRtuSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  version: true,
  cliente: true,
});

/** `idCliente: null` = pasar a global (solo Proveedor), como en IPerfilDecodificacion. */
export const UpdatePlantillaRtuSchema = CreatePlantillaRtuSchema.partial().extend({
  idCliente: z.string().nullable().optional(),
});

export type IAmbitoSenalBombeo = z.infer<typeof AmbitoSenalBombeoSchema>;
export type ITipoSenalBombeo = z.infer<typeof TipoSenalBombeoSchema>;
export type IEntradaDigitalRtu = z.infer<typeof EntradaDigitalRtuSchema>;
export type ISenalPlantillaRtu = z.infer<typeof SenalPlantillaRtuSchema>;
export type ICanalPlantillaRtu = z.infer<typeof CanalPlantillaRtuSchema>;
export type IEntradaPlantillaRtu = z.infer<typeof EntradaPlantillaRtuSchema>;
export type IFuncionModbusComando = z.infer<typeof FuncionModbusComandoSchema>;
export type IComandoPlantillaRtu = z.infer<typeof ComandoPlantillaRtuSchema>;
export type IPlantillaRtu = z.infer<typeof PlantillaRtuSchema>;
export type ICreatePlantillaRtu = z.infer<typeof CreatePlantillaRtuSchema>;
export type IUpdatePlantillaRtu = z.infer<typeof UpdatePlantillaRtuSchema>;

/** Prefijo de las señales en la estación: `pozo` o `b<n>`. */
export function prefijoSenalBombeo(ambito: IAmbitoSenalBombeo, numeroBomba?: number): string {
  return ambito === "Pozo" ? "pozo" : `b${numeroBomba}`;
}
