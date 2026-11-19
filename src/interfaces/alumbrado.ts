import { z } from "zod";
import { GeoJSONPointSchema } from "../auxiliares/geojson";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";

/**
 * Alumbrado (D77, acceso-doc-general doc 61): nodos de luminaria GPE
 * (firmware SSL-IDF) por LoRaWAN. Tres entidades, todas de autoría cloud y
 * replicadas Tipo A al edge del complejo, que es quien decodifica y comanda:
 *
 *  - `ISectorAlumbrado`: ÚNICO lugar de la config deseada (modo, umbrales,
 *    desfases, frecuencia, calendario). Sin cascada de perfiles.
 *  - `ILuminaria`: el activo físico. El nodo (`IDispositivo` formFactor
 *    `Luminaria`) se le vincula por `IAsignacionDispositivo` destino
 *    `Luminaria`; cambiar el nodo no cambia la luminaria.
 *  - `IComandoLuminaria`: orden manual (encender % / apagar) a una luminaria o
 *    a un sector HASTA una fecha obligatoria. Al vencer, el edge devuelve cada
 *    luminaria a la config de su sector.
 */

// ─── Sector ────────────────────────────────────────────────────────────────

/** Manual NO es un modo de sector: es una orden con vencimiento. */
export const ModoSectorAlumbradoSchema = z.enum(["Astronomico", "Fotocelula"]);

/** 'HH:MM' en pasos de 10 min (el nodo guarda intervalos de 10 min, 0..143). */
export const HoraCalendarioAlumbradoSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):[0-5]0$/, "Hora HH:MM en pasos de 10 minutos");

export const MAX_PUNTOS_CALENDARIO_ALUMBRADO = 8;

export const PuntoCalendarioAlumbradoSchema = z.object({
  hora: HoraCalendarioAlumbradoSchema,
  porcentaje: z.number().int().min(1).max(100),
});

/**
 * Calendario de atenuación de la noche. `habilitado: false` se manda como
 * máscara 0: el nodo usa `porcentajeDefecto` toda la noche (Irix no codificaba
 * el flag y el reconciliador reenviaba en loop).
 */
export const CalendarioAlumbradoSchema = z.object({
  habilitado: z.boolean(),
  porcentajeDefecto: z.number().int().min(1).max(100),
  /** Horas distintas entre sí: lo valida acceso-api (sin `.refine`, ver CLAUDE.md). */
  puntos: z.array(PuntoCalendarioAlumbradoSchema).max(MAX_PUNTOS_CALENDARIO_ALUMBRADO),
});

/** Campos de config que viajan al nodo (DL 100 + DL 112). `limLuzInferior <
 *  limLuzSuperior` lo valida acceso-api (`validarConfigSectorAlumbrado`). */
export const ConfigSectorAlumbradoSchema = z.object({
    modo: ModoSectorAlumbradoSchema,
    /** Umbrales de la fotocélula (lux crudos del nodo). */
    limLuzInferior: z.number().int().min(1).max(3000),
    limLuzSuperior: z.number().int().min(1).max(3000),
    /** Minutos respecto del amanecer/atardecer (modo astronómico). i8 en el nodo. */
    desfaseAmanecerMin: z.number().int().min(-120).max(120),
    desfaseAtardecerMin: z.number().int().min(-120).max(120),
    /** Período del reporte de estado (UL 101). */
    frecReporteMin: z.number().int().min(5).max(60),
    dataRate: z.number().int().min(0).max(13),
    adrHabilitado: z.boolean(),
    dimmerHabilitado: z.boolean(),
    calendario: CalendarioAlumbradoSchema,
});

/** Reglas que el schema no expresa. Devuelve los errores en español (vacío = OK). */
export function validarConfigSectorAlumbrado(c: z.infer<typeof ConfigSectorAlumbradoSchema>): string[] {
  const errores: string[] = [];
  if (c.limLuzInferior >= c.limLuzSuperior) {
    errores.push("El límite de luz inferior debe ser menor que el superior");
  }
  const horas = c.calendario.puntos.map((p) => p.hora);
  if (new Set(horas).size !== horas.length) {
    errores.push("Dos puntos del calendario tienen la misma hora");
  }
  return errores;
}

export const CONFIG_SECTOR_ALUMBRADO_DEFAULT: z.infer<typeof ConfigSectorAlumbradoSchema> = {
  modo: "Astronomico",
  limLuzInferior: 40,
  limLuzSuperior: 120,
  desfaseAmanecerMin: 0,
  desfaseAtardecerMin: 0,
  frecReporteMin: 10,
  dataRate: 2,
  adrHabilitado: true,
  dimmerHabilitado: true,
  calendario: { habilitado: false, porcentajeDefecto: 100, puntos: [] },
};

export const SectorAlumbradoSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  nombre: z.string().trim().min(1),
  descripcion: z.string().optional(),
  /** Color del sector en el mapa (#rrggbb). */
  color: z.string().optional(),
  config: ConfigSectorAlumbradoSchema,
  /** Sube con cada cambio de `config` (la pone acceso-datos). El edge la
   *  anota al aplicar: es lo que permite decir "pendiente de aplicar". */
  version: z.number().int().optional(),
  // Populate
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
});

export const CreateSectorAlumbradoSchema = SectorAlumbradoSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  version: true,
  cliente: true,
  complejo: true,
});

export const UpdateSectorAlumbradoSchema = CreateSectorAlumbradoSchema.partial();

// ─── Luminaria ─────────────────────────────────────────────────────────────

export const EstadoOperativoLuminariaSchema = z.enum(["Operativa", "Mantenimiento"]);

export const AccionComandoLuminariaSchema = z.enum(["Encender", "Apagar"]);

/**
 * Avance de la orden manual vigente sobre ESTA luminaria. Lo escribe el edge
 * (merge `$set` del campo): así una orden a un sector de 80 luminarias no
 * lleva un array de 80 que se actualiza desde el edge.
 *  - `Pendiente`: todavía no se confirmó en el nodo.
 *  - `Aplicada`: el UL 101 mostró relé y potencia según la orden.
 *  - `Restaurando`: venció o se canceló; falta que el nodo vuelva a su config.
 *  - `Restaurada`: el eco del DL 100 confirmó la vuelta.
 *  - `Fallida`: el nodo rechazó el comando o se agotaron los intentos.
 */
export const EstadoOverrideLuminariaSchema = z.enum([
  "Pendiente",
  "Aplicada",
  "Restaurando",
  "Restaurada",
  "Fallida",
]);

export const OverrideLuminariaSchema = z.object({
  idComando: z.string(),
  accion: AccionComandoLuminariaSchema,
  porcentaje: z.number().int().min(1).max(100).optional(),
  hasta: z.string(),
  estado: EstadoOverrideLuminariaSchema,
  fechaAplicada: z.string().optional(),
  fechaRestaurada: z.string().optional(),
  motivo: z.string().optional(),
  actualizadoEn: z.string().optional(),
});

export const EstadoAplicacionConfigLuminariaSchema = z.enum([
  "Aplicada",
  "Pendiente",
  "Rechazada",
]);

/** Si el nodo tiene la config de su sector. Lo escribe el edge. */
export const EstadoConfigLuminariaSchema = z.object({
  config: EstadoAplicacionConfigLuminariaSchema.optional(),
  calendario: EstadoAplicacionConfigLuminariaSchema.optional(),
  /** `version` del sector que el nodo confirmó por completo. */
  versionSectorAplicada: z.number().int().optional(),
  /** Versión de firmware informada en el UL 100. */
  firmware: z.number().int().optional(),
  motivo: z.string().optional(),
  actualizadoEn: z.string().optional(),
});

export const LuminariaSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  /** Tipo A: último-write-wins edge↔cloud. */
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  /** Nombre o número de poste. Único por complejo. */
  identificacion: z.string().trim().min(1),
  descripcion: z.string().optional(),
  /** Sin sector, Coliving no le cambia la config: solo observa y acepta
   *  órdenes manuales. */
  idSector: z.string().optional(),
  ubicacion: GeoJSONPointSchema.optional(),
  /** true = la fijó una persona; el GPS del nodo no la pisa. */
  ubicacionManual: z.boolean().optional(),
  /** Ajusta el umbral de "relé encendido sin consumo". */
  potenciaNominalW: z.number().positive().optional(),
  estadoOperativo: EstadoOperativoLuminariaSchema.optional(),
  /** Nodo vigente: espejo de la asignación `Luminaria` activa (lo mantiene
   *  acceso-api al asignar / cerrar). Único entre luminarias. */
  idDispositivo: z.string().optional(),
  // --- Escritos por el edge ---
  override: OverrideLuminariaSchema.optional(),
  estadoConfig: EstadoConfigLuminariaSchema.optional(),
  // Populate
  sector: z.any().optional(),
  dispositivo: z.any().optional(),
  cliente: ClienteSchema.optional(),
  complejo: ComplejoSchema.optional(),
});

const EscritosPorEdgeLuminaria = { override: true, estadoConfig: true } as const;

export const CreateLuminariaSchema = LuminariaSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
  idDispositivo: true,
  ...EscritosPorEdgeLuminaria,
  sector: true,
  dispositivo: true,
  cliente: true,
  complejo: true,
}).extend({
  /** Alta en un paso: el nodo se asigna a la luminaria al crearla. */
  idDispositivo: z.string().optional(),
});

/** `null` borra el valor (acceso-datos hace `$unset` de los `null`). El nodo
 *  no se cambia por acá: `PUT /luminarias/:id/nodo`. */
export const UpdateLuminariaSchema = CreateLuminariaSchema.omit({ idDispositivo: true })
  .partial()
  .extend({
    idSector: z.string().nullable().optional(),
    ubicacion: GeoJSONPointSchema.nullable().optional(),
    potenciaNominalW: z.number().positive().nullable().optional(),
  });

/** Body de `PUT /luminarias/:id/nodo`: asigna otro nodo (o ninguno con null). */
export const CambiarNodoLuminariaSchema = z.object({
  idDispositivo: z.string().nullable(),
  observaciones: z.string().optional(),
});

// ─── Orden manual ──────────────────────────────────────────────────────────

/** Una orden más larga es un cambio de sector, no una orden. */
export const MAX_HORAS_COMANDO_LUMINARIA = 72;

export const TipoObjetivoComandoLuminariaSchema = z.enum(["Luminaria", "Sector"]);

export const ObjetivoComandoLuminariaSchema = z.object({
  tipo: TipoObjetivoComandoLuminariaSchema,
  id: z.string(),
});

export const EstadoComandoLuminariaSchema = z.enum(["Vigente", "Vencida", "Cancelada"]);

export const SolicitanteComandoLuminariaSchema = z.object({
  idPermiso: z.string().optional(),
  idUsuario: z.string().optional(),
  nombre: z.string().optional(),
});

export const ComandoLuminariaSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),
  idCliente: z.string().optional(),
  idComplejo: z.string().optional(),
  objetivo: ObjetivoComandoLuminariaSchema,
  /** Snapshot: identificación de la luminaria o nombre del sector. */
  nombreObjetivo: z.string().optional(),
  accion: AccionComandoLuminariaSchema,
  /** Solo `Encender`. */
  porcentaje: z.number().int().min(1).max(100).optional(),
  /** ISO. Desde cuándo rige (= creación). Por luminaria rige la orden vigente
   *  con `desde` más nuevo. */
  desde: z.string(),
  /** ISO. Obligatorio. */
  hasta: z.string(),
  motivo: z.string().optional(),
  solicitadoPor: SolicitanteComandoLuminariaSchema.optional(),
  estado: EstadoComandoLuminariaSchema,
  fechaCancelacion: z.string().optional(),
  canceladoPor: SolicitanteComandoLuminariaSchema.optional(),
});

export const CreateComandoLuminariaSchema = ComandoLuminariaSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
});

export const UpdateComandoLuminariaSchema = ComandoLuminariaSchema.pick({
  estado: true,
  fechaCancelacion: true,
  canceladoPor: true,
}).partial();

/** Pedido de una orden (`POST /comandos-luminaria`). `hasta` > ahora y a lo
 *  sumo `MAX_HORAS_COMANDO_LUMINARIA` lo valida acceso-api. */
export const PedidoComandoLuminariaSchema = z.object({
  objetivo: ObjetivoComandoLuminariaSchema,
  accion: AccionComandoLuminariaSchema,
  /** Obligatorio para `Encender` (lo valida acceso-api). */
  porcentaje: z.number().int().min(1).max(100).optional(),
  hasta: z.string(),
  motivo: z.string().trim().max(500).optional(),
});

// ─── Estado para mostrar ───────────────────────────────────────────────────

export const CodigoEstadoLuminariaSchema = z.enum([
  "SinNodo",
  "SinComunicacion",
  "Mantenimiento",
  "ConAlarma",
  "Manual",
  "Encendida",
  "Apagada",
  "SinDatos",
]);

export type ICodigoEstadoLuminaria = z.infer<typeof CodigoEstadoLuminariaSchema>;

export interface IEstadoLuminaria {
  codigo: ICodigoEstadoLuminaria;
  etiqueta: string;
  /** % de atenuación cuando está encendida. */
  nivel?: number;
  /** Fin de la orden manual vigente. */
  hasta?: string;
  alarmas: string[];
}

/** Lo mínimo del nodo que hace falta para el estado. */
export interface INodoEstadoLuminaria {
  estado?: string;
  telemetriaLorawan?: {
    alarmasActivas?: string[];
    ultimosValores?: Record<string, { valor: number | null; fechaDato?: string }>;
  };
}

/**
 * Estado de una luminaria para mostrar (web y mobile). Única implementación:
 * en Irix estaba copiado en 4 repos con reglas distintas.
 */
export function estadoLuminaria(
  luminaria: Pick<ILuminaria, "estadoOperativo" | "override" | "idDispositivo">,
  nodo: INodoEstadoLuminaria | undefined | null,
  ahora: Date = new Date(),
): IEstadoLuminaria {
  const alarmas = nodo?.telemetriaLorawan?.alarmasActivas ?? [];
  if (!luminaria.idDispositivo || !nodo) {
    return { codigo: "SinNodo", etiqueta: "Sin nodo", alarmas: [] };
  }
  if (luminaria.estadoOperativo === "Mantenimiento") {
    return { codigo: "Mantenimiento", etiqueta: "En mantenimiento", alarmas };
  }
  if (nodo.estado === "Offline") {
    return { codigo: "SinComunicacion", etiqueta: "Sin comunicación", alarmas };
  }
  if (alarmas.length > 0) {
    return { codigo: "ConAlarma", etiqueta: "Con alarma", alarmas };
  }
  const ov = luminaria.override;
  if (ov && (ov.estado === "Pendiente" || ov.estado === "Aplicada") && new Date(ov.hasta) > ahora) {
    const accion = ov.accion === "Encender" ? `Encendida ${ov.porcentaje ?? 100} %` : "Apagada";
    return {
      codigo: "Manual",
      etiqueta: `${accion} a mano`,
      nivel: ov.accion === "Encender" ? ov.porcentaje : undefined,
      hasta: ov.hasta,
      alarmas,
    };
  }
  const v = nodo.telemetriaLorawan?.ultimosValores ?? {};
  const encendida = v["encendida"]?.valor;
  if (encendida === undefined || encendida === null) {
    return { codigo: "SinDatos", etiqueta: "Sin datos", alarmas };
  }
  if (encendida >= 1) {
    const nivel = v["nivelAtenuacion"]?.valor ?? undefined;
    return {
      codigo: "Encendida",
      etiqueta: nivel !== undefined ? `Encendida ${nivel} %` : "Encendida",
      nivel: nivel ?? undefined,
      alarmas,
    };
  }
  return { codigo: "Apagada", etiqueta: "Apagada", alarmas };
}

/** Etiquetas de los bits de alarma de la familia `luminaria-gpe`. */
export const ETIQUETA_ALARMA_LUMINARIA: Record<string, string> = {
  corteEnergia: "Corte de energía",
  errorLecturaEnergia: "Error de lectura de energía",
  releSinConsumo: "Relé encendido sin consumo",
  consumoConReleApagado: "Consumo con el relé apagado",
  potenciaInvalida: "Medición de potencia inválida",
  memoriaEnEmergencia: "Memoria del nodo en emergencia",
  inclinacion: "Poste inclinado",
  golpe: "Golpe en el poste",
  manipulacion: "Manipulación del nodo",
};

export type IModoSectorAlumbrado = z.infer<typeof ModoSectorAlumbradoSchema>;
export type IPuntoCalendarioAlumbrado = z.infer<typeof PuntoCalendarioAlumbradoSchema>;
export type ICalendarioAlumbrado = z.infer<typeof CalendarioAlumbradoSchema>;
export type IConfigSectorAlumbrado = z.infer<typeof ConfigSectorAlumbradoSchema>;
export type ISectorAlumbrado = z.infer<typeof SectorAlumbradoSchema>;
export type ICreateSectorAlumbrado = z.infer<typeof CreateSectorAlumbradoSchema>;
export type IUpdateSectorAlumbrado = z.infer<typeof UpdateSectorAlumbradoSchema>;
export type IEstadoOperativoLuminaria = z.infer<typeof EstadoOperativoLuminariaSchema>;
export type IAccionComandoLuminaria = z.infer<typeof AccionComandoLuminariaSchema>;
export type IEstadoOverrideLuminaria = z.infer<typeof EstadoOverrideLuminariaSchema>;
export type IOverrideLuminaria = z.infer<typeof OverrideLuminariaSchema>;
export type IEstadoAplicacionConfigLuminaria = z.infer<typeof EstadoAplicacionConfigLuminariaSchema>;
export type IEstadoConfigLuminaria = z.infer<typeof EstadoConfigLuminariaSchema>;
export type ILuminaria = z.infer<typeof LuminariaSchema>;
export type ICreateLuminaria = z.infer<typeof CreateLuminariaSchema>;
export type IUpdateLuminaria = z.infer<typeof UpdateLuminariaSchema>;
export type ICambiarNodoLuminaria = z.infer<typeof CambiarNodoLuminariaSchema>;
export type ITipoObjetivoComandoLuminaria = z.infer<typeof TipoObjetivoComandoLuminariaSchema>;
export type IObjetivoComandoLuminaria = z.infer<typeof ObjetivoComandoLuminariaSchema>;
export type IEstadoComandoLuminaria = z.infer<typeof EstadoComandoLuminariaSchema>;
export type ISolicitanteComandoLuminaria = z.infer<typeof SolicitanteComandoLuminariaSchema>;
export type IComandoLuminaria = z.infer<typeof ComandoLuminariaSchema>;
export type ICreateComandoLuminaria = z.infer<typeof CreateComandoLuminariaSchema>;
export type IUpdateComandoLuminaria = z.infer<typeof UpdateComandoLuminariaSchema>;
export type IPedidoComandoLuminaria = z.infer<typeof PedidoComandoLuminariaSchema>;
