import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";
import { DispositivoSchema } from "./dispositivo";
import { PermisoSchema } from "./permiso";
import { CredencialSchema, TipoCredencialSchema } from "./credencial";

/**
 * Estado granular del enrolamiento por par (credencial, device) — spec §10.1.
 * `Enrolada` significa VERIFICADO contra la verdad del device (numOfFace/numOfCard
 * ≥ 1 vía UserInfo/Search), no solo "se mandó el request" (§10.2).
 */
export const EstadoEnrolamientoSchema = z.enum([
  "Pendiente", // en cola, todavía no intentado
  "Enrolando", // intento en curso
  "Enrolada", // verificado contra el device
  "Fallida", // intento con error tipado (ver ultimoErrorEnrolamiento)
  "Desincronizada", // el sistema cree Enrolada pero el device dice lo contrario (drift)
  "Revocada", // borrada del device
]);

/**
 * A qué se debe un `estadoEnrolamiento: "Fallida"`.
 *
 * Existe para decidir si tiene sentido pedirle al residente que capture de
 * nuevo. Una foto sin rostro se arregla sacando otra; un terminal caído o con
 * firmware no soportado no se arregla repitiendo la captura, y pedírselo lo deja
 * repitiendo algo que nunca va a funcionar.
 *
 * - `Credencial`: el dato aportado no sirve (foto sin rostro, borrosa, con más
 *   de una cara, demasiado pesada, o falta el número de tarjeta / el PIN).
 * - `Dispositivo`: el terminal no pudo tomarla (inalcanzable, credenciales de
 *   acceso inválidas, firmware por debajo de la mínima soportada, error de
 *   configuración del propio equipo).
 */
export const OrigenFalloEnrolamientoSchema = z.enum([
  "Credencial",
  "Dispositivo",
]);

/**
 * Materialización FÍSICA de una credencial lógica en un terminal concreto
 * (capa 2, spec §1). Una por par device-user. El `identificador` es el device-user
 * (= employeeNo); las modalidades (cara/tarjeta/pin) cuelgan de ese mismo usuario
 * — decisión "por device-user" (spec §1, §13).
 */
export const CredencialDispositivoSchema = z.object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    idCliente: z.string().optional(),
    idComplejo: z.string().optional(),
    idDispositivo: z.string().optional(),
    /** Valor propio del dispositivo (id de cara, número de tarjeta, QR, PIN, etc.).
     *  Es el device-user (= employeeNo). Propuesta: = idPermiso (spec §4). */
    identificador: z.string().optional(),
    idPermiso: z.string().optional(),
    /** Credencial lógica que originó esta materialización (FK a ICredencial). */
    idCredencial: z.string().optional(),
    /** Modalidad materializada en este device-user (denormalizada de la credencial). */
    tipo: TipoCredencialSchema.optional(),
    /** Estado granular del enrolamiento (spec §10.1). */
    estadoEnrolamiento: EstadoEnrolamientoSchema.optional(),
    /** Reflejo del device: cuántas caras tiene el device-user (UserInfo/Search). */
    numOfFace: z.number().int().nonnegative().optional(),
    /** Reflejo del device: cuántas tarjetas tiene el device-user. */
    numOfCard: z.number().int().nonnegative().optional(),
    /** Reflejo del device: cuántas huellas tiene el device-user (UserInfo/Search
     *  → numOfFP). Verifica el enrolamiento de huella igual que numOfFace/numOfCard. */
    numOfFinger: z.number().int().nonnegative().optional(),
    /** Mensaje legible del último error de enrolamiento (subStatusCode mapeado). */
    ultimoErrorEnrolamiento: z.string().optional(),
    /**
     * A qué se debe el fallo, cuando `estadoEnrolamiento` es `Fallida`. Lo
     * clasifica el edge, que es quien conoce el error concreto del terminal.
     * Gobierna si al residente se le ofrece capturar de nuevo.
     */
    origenFallo: OrigenFalloEnrolamientoSchema.optional(),
    /** ISO — cuándo se completó el último enrolamiento exitoso. */
    fechaUltimoEnrolamiento: z.string().optional(),
    /** ISO — cuándo el edge verificó por última vez el estado real contra el device. */
    fechaUltimaVerificacion: z.string().optional(),
    // Populate
    cliente: ClienteSchema.optional(),
    complejo: ComplejoSchema.optional(),
    dispositivo: DispositivoSchema.optional(),
    permiso: PermisoSchema.optional(),
    credencial: CredencialSchema.optional(),
  });

export const CreateCredencialDispositivoSchema = CredencialDispositivoSchema.omit(
  {
    _id: true,
    fechaCreacion: true,
    cliente: true,
    complejo: true,
    dispositivo: true,
    permiso: true,
    credencial: true,
  },
);

export const UpdateCredencialDispositivoSchema = CredencialDispositivoSchema.omit(
  {
    _id: true,
    fechaCreacion: true,
    cliente: true,
    complejo: true,
    dispositivo: true,
    permiso: true,
    credencial: true,
  },
).partial();

export type IEstadoEnrolamiento = z.infer<typeof EstadoEnrolamientoSchema>;
export type IOrigenFalloEnrolamiento = z.infer<
  typeof OrigenFalloEnrolamientoSchema
>;
export type ICredencialDispositivo = z.infer<typeof CredencialDispositivoSchema>;
export type ICreateCredencialDispositivo = z.infer<
  typeof CreateCredencialDispositivoSchema
>;
export type IUpdateCredencialDispositivo = z.infer<
  typeof UpdateCredencialDispositivoSchema
>;
