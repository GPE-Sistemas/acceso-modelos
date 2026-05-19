import { z } from "zod";

/**
 * Refresh token de larga duración (default 30 días). El usuario recibe el valor opaco
 * por única vez en el response del login/refresh; el server persiste sólo el hash.
 * Rotación: al usar /auth/refresh se emite un nuevo par (access + refresh) y se
 * revoca el refresh anterior. Logout revoca el refresh activo.
 */
export const RefreshTokenSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  /** Username del usuario dueño (auth unificado por username, no idUsuario). */
  username: z.string().optional(),
  /** Hash SHA-256 hex del valor opaco. El valor plano nunca se almacena. */
  hash: z.string().optional(),
  /** ISO 8601. */
  expiraEn: z.string().optional(),
  /** Si true: revocado por uso (rotación), logout o invalidación admin. */
  revocado: z.boolean().optional(),
  /** Set al revocar — útil para auditoría. */
  fechaRevocacion: z.string().optional(),
  /** ISO 8601 — set al usar para refresh. Permite detectar reuso de un token rotado. */
  fechaUso: z.string().optional(),
  /** Metadatos opcionales del dispositivo / origen. */
  userAgent: z.string().optional(),
  ip: z.string().optional(),
});

export const CreateRefreshTokenSchema = RefreshTokenSchema.omit({
  _id: true,
  fechaCreacion: true,
});

export const UpdateRefreshTokenSchema = CreateRefreshTokenSchema.partial();

export type IRefreshToken = z.infer<typeof RefreshTokenSchema>;
export type ICreateRefreshToken = z.infer<typeof CreateRefreshTokenSchema>;
export type IUpdateRefreshToken = z.infer<typeof UpdateRefreshTokenSchema>;
