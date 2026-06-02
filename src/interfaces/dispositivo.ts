import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";

export const TipoDispositivoSchema = z.enum([
  "Terminal de reconocimiento facial",
  "Lector de huella digital",
  "Lector de tarjeta",
  "Teclado numérico",
  "Otro",
]);

// Estado runtime reportado por el agent edge (H-DEV-5).
// - `Pendiente Adopción`: el IDispositivo existe en cloud pero el edge todavía
//   no completó el handshake (test cred + reconfig push).
// - `Online`: reachable (ISAPI userCheck OK).
// - `Offline`: 5 fails consecutivos de reachability.
// - `Locked`: device reporta `lockStatus=lock` (lockout por intentos cred).
// Doc: acceso-doc-general/29-hik-terminal-adopcion.md § Monitoreo runtime.
export const EstadoDispositivoSchema = z.enum([
  "Pendiente Adopción",
  "Online",
  "Offline",
  "Locked",
]);

export const ConfigDispositivoSchema = z.object({
    username: z.string().optional(),
    password: z.string().optional(),
    apikey: z.string().optional(),
    // IP LAN del device. La resuelve discovery (MAC↔IP) + adopción la persiste.
    // Mutable por DHCP del integrador — discovery refresca cuando detecta cambio.
    ipAddress: z.string().optional(),
    // Puerto HTTPS ISAPI; default 443. Algunos firmwares HIK escuchan en 80
    // (forzar via `useHttp=true`).
    port: z.number().int().positive().optional(),
    useHttp: z.boolean().optional(),
  });

export const DispositivoSchema = z.object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    habilitado: z.boolean().optional(),
    idCliente: z.string().optional(),
    idComplejo: z.string().optional(),
    // Datos específicos del dispositivo
    tipo: TipoDispositivoSchema.optional(),
    serialNumber: z.string().optional(),
    marca: z.string().optional(),
    modelo: z.string().optional(),
    config: ConfigDispositivoSchema.optional(),
    // Sharding edge — qué appliance recibe el HTTP Push del terminal.
    // Vacío en complejos N=1 (Standalone): el único edge es dueño implícito.
    idEdgeAppliancePrimario: z.string().optional(),
    idEdgeApplianceSecundario: z.string().optional(),
    // Estado runtime reportado por el agent edge (H-DEV-5).
    estado: EstadoDispositivoSchema.optional(),
    // Populate
    cliente: ClienteSchema.optional(),
    complejo: ComplejoSchema.optional(),
  });

export const CreateDispositivoSchema = DispositivoSchema.omit({
  _id: true,
  fechaCreacion: true,
});

export const UpdateDispositivoSchema = DispositivoSchema.omit({
  _id: true,
  fechaCreacion: true,
}).partial();

export type ITipoDispositivo = z.infer<typeof TipoDispositivoSchema>;
export type IEstadoDispositivo = z.infer<typeof EstadoDispositivoSchema>;
export type IConfigDispositivo = z.infer<typeof ConfigDispositivoSchema>;
export type IDispositivo = z.infer<typeof DispositivoSchema>;
export type ICreateDispositivo = z.infer<typeof CreateDispositivoSchema>;
export type IUpdateDispositivo = z.infer<typeof UpdateDispositivoSchema>;
