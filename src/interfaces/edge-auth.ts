import { z } from "zod";
import { PermisoSchema } from "./permiso";
import { UsuarioSchema } from "./usuario";

// 25-hub-edge-arquitectura.md > Login local — auth schemas del agent edge.
//
// El edge emite y valida sus propias sesiones. El cloud no participa de
// los logins en LAN. Dos caminos:
//
//   1) Login local clásico: el operador entra a https://<idC>.edge.coliving.sh
//      y hace POST /auth/login con usuario+password. El agent valida
//      contra IUsuario.hash replicado en Postgres local (subset de
//      operadores del complejo, ver A.S7) y emite JWT firmado por el edge.
//
//   2) Login-from-cloud: el operador estaba en app.colivinghub.ar, hizo
//      login normal, aceptó el banner "usar Hub local" y el cloud le
//      emitió un transferToken firmado con la clave compartida edge↔cloud
//      (derivada del provisioning token). El browser navega al edge y
//      hace POST /auth/login-from-cloud con ese token. El edge valida
//      claims + expiración + idEdgeAppliance y emite su propio JWT local.
//      Sin password en este path.
//
// El JWT que devuelve el edge es independiente del JWT cloud (clave de
// firma distinta). TTL inicial 12h (revisable en F.S2). Sin refresh
// tokens en MVP — relogin manual cuando vence.

// Login local clásico — usuario + password.
export const EdgeLoginLocalRequestSchema = z.object({
  usuario: z.string().min(1),
  password: z.string().min(1),
});

// Claims del transferToken que el cloud emite y el edge valida. El
// transferToken es de un solo uso conceptualmente: el edge no lleva
// estado de "usados" en MVP — TTL corto (sesgo 60s) lo cubre.
//
// idEdgeAppliance: el cloud lo setea según el complejo de destino. En
// N>1 el cloud elige uno alcanzable según probe + rol. El edge valida
// que matchea su propio idEdgeAppliance para evitar tokens cross-edge.
export const EdgeTransferTokenClaimsSchema = z.object({
  idUsuario: z.string(),
  idPermiso: z.string(),
  idCliente: z.string(),
  idComplejo: z.string(),
  idEdgeAppliance: z.string(),
  iat: z.number().int(),
  exp: z.number().int(),
});

export const EdgeLoginFromCloudRequestSchema = z.object({
  transferToken: z.string().min(1),
});

// Response común a los dos paths de login. accessToken es el JWT
// firmado por el edge con clave derivada del provisioning token.
// usuario optional: el cliente puede leer datos del me() después, pero
// devolverlo acá ahorra un round-trip en el splash.
export const EdgeLoginResponseSchema = z.object({
  accessToken: z.string(),
  permiso: PermisoSchema,
  usuario: UsuarioSchema.optional(),
});

// /auth/me al edge — mismo shape que cloud para que el front no
// diferencie. Permite a F.S1 reusar AuthService sin ramificar.
export const EdgeMeResponseSchema = z.object({
  usuario: UsuarioSchema,
  permiso: PermisoSchema,
});

export type IEdgeLoginLocalRequest = z.infer<typeof EdgeLoginLocalRequestSchema>;
export type IEdgeTransferTokenClaims = z.infer<typeof EdgeTransferTokenClaimsSchema>;
export type IEdgeLoginFromCloudRequest = z.infer<typeof EdgeLoginFromCloudRequestSchema>;
export type IEdgeLoginResponse = z.infer<typeof EdgeLoginResponseSchema>;
export type IEdgeMeResponse = z.infer<typeof EdgeMeResponseSchema>;
