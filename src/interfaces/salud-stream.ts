import { z } from "zod";

// ISaludStream — liveness por stream de video (cloud-only, Tipo C, edge-reported).
//
// Un "stream" = un canal de un IDispositivo (cámara/NVR/XVR) que el edge levanta
// para inferencia (Frigate) y/o control de acceso. Nace de una asociación
// dispositivo↔zona (inferencia D49) y/o dispositivo↔acceso. El estado del DEVICE
// (IDispositivo.estado, H-DEV-8) es más grueso: un device puede estar reachable
// pero un canal puntual caído (RTSP rechazado, IP stale, cámara apagada).
//
// Lo reporta el agent edge (dueño del lifecycle de Frigate): poll a Frigate
// `GET /api/stats` → fps/process_fps/salud ffmpeg por cámara → deriva estado.
// Reporta on-change + keepalive periódico; el cloud corta a `Desconocido` por
// staleness de `estadoActualizado` (mismo patrón que IEdgeAppliance/IDispositivo).
// Doc 12-dispositivos-y-accesos.md § Auditoría / salud por dispositivo.

export const EstadoSaludStreamSchema = z.enum([
  "Activo", // Frigate recibe frames OK (fps por encima del umbral).
  "Degradado", // fps bajo / restarts ffmpeg intermitentes.
  "Caído", // sin frames / ffmpeg en error (ej. RTSP connection refused por IP stale).
  "Desconocido", // el edge dejó de reportar (staleness cloud-side).
]);

export const SaludStreamSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),
  fechaActualizacion: z.string().optional(),

  idCliente: z.string().optional(),
  idComplejo: z.string(),

  // Identidad del stream: (dispositivo, canal). `canal` matchea
  // ICanalDispositivo.canal e IDispositivoAcceso.canalDispositivo.
  idDispositivo: z.string(),
  canal: z.string(),

  // Asociación que da origen/propósito al stream (ambas opcionales: un canal
  // puede servir inferencia de una zona y/o un acceso).
  idZona: z.string().optional(),
  idAcceso: z.string().optional(),

  // Edge que reporta (dueño de Frigate para este stream).
  idEdgeAppliance: z.string().optional(),

  estado: EstadoSaludStreamSchema,

  // Señales derivadas de Frigate `GET /api/stats` (best-effort).
  fps: z.number().optional(), // camera_fps (captura)
  processFps: z.number().optional(), // process_fps (detección)
  ultimoFrame: z.string().optional(), // ISO — última vez con frames OK
  ffmpegError: z.string().optional(), // último error de ffmpeg/RTSP legible
  // Host RTSP efectivo en uso (correlaciona con el self-heal de IP).
  rtspHost: z.string().optional(),

  // ISO del último refresh del estado (habilita el corte a Desconocido cloud-side
  // y que el badge "envejezca" client-side).
  estadoActualizado: z.string(),
  // Borrado por TTL cuando el stream deja de existir (canal removido). Opcional.
  expireAt: z.string().optional(),
});

export const CreateSaludStreamSchema = SaludStreamSchema.omit({
  _id: true,
  fechaCreacion: true,
  fechaActualizacion: true,
});

export const UpdateSaludStreamSchema = CreateSaludStreamSchema.partial();

export type IEstadoSaludStream = z.infer<typeof EstadoSaludStreamSchema>;
export type ISaludStream = z.infer<typeof SaludStreamSchema>;
export type ICreateSaludStream = z.infer<typeof CreateSaludStreamSchema>;
export type IUpdateSaludStream = z.infer<typeof UpdateSaludStreamSchema>;
