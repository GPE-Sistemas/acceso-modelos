import { z } from "zod";

// IComandoEdge — auditoría de comandos cloud→edge.
//
// Cloud-only (Tipo C) — NO se replica a edges. La escribe acceso-api:
//  - EdgeCommandsPublisher persiste la EMISIÓN (status='emitido') antes de
//    publicar al subject NATS core
//    `acceso.complejo.<idC>.edge.<idE>.commands.<cmd>`.
//  - CommandsResultSubscriber correlaciona el RESULTADO por `correlationId`
//    (= payload.id del result) y actualiza status/message/tsResult.
//
// Resuelve el pendiente del doc 17-sincronizacion-edge-cloud.md: hoy los
// comandos viajan fire-and-forget por NATS core y el result se consume en vivo
// y se descarta — no hay bitácora consultable de qué se mandó, quién, cuándo,
// con qué resultado. JetStream para entrega garantizada queda como mejora
// opcional posterior (el stream `events` corre --no-ack por los RPC reply que
// comparten el árbol de subjects — no mover el transporte sin diseño aparte).

// Estado del ciclo de vida del comando auditado.
//  - emitido: persistido por el publisher, antes/al publicar a NATS.
//  - queued: el edge respondió `status:queued` (lo encoló, async).
//  - ok / error: resultado final correlacionado desde commands.result.
//  - sin-respuesta: nunca llegó result (edge offline / timeout); lo marca un
//    barrido cloud-side, no el subscriber.
export const ComandoEdgeStatusSchema = z.enum([
  "emitido",
  "queued",
  "ok",
  "error",
  "sin-respuesta",
]);

export const ComandoEdgeSchema = z.object({
  _id: z.string().optional(),
  fechaCreacion: z.string().optional(),

  idCliente: z.string().optional(),
  idComplejo: z.string(),
  idEdgeAppliance: z.string(),

  // Correlación emisión ↔ resultado. Es el `id` del payload del comando NATS
  // (`{id, cmd, args, issuedBy, ts}`) y del result (`{id, cmd, status, ...}`).
  correlationId: z.string(),

  // Nombre del comando (sync-snapshot, restart-service, cert-renew,
  // update-image, reinstall, enable-ssh, snapshot-canal, rekey, decomiso,
  // logs-tail, discovery-now, adoptar-dispositivo, reconfig-push-hik, ...).
  // String libre a propósito: la auditoría NO debe rechazar un comando nuevo
  // que el edge entienda antes de que el enum se actualice acá.
  cmd: z.string(),
  // Argumentos crudos del comando (shape variable por cmd). Se persiste para
  // troubleshooting. NO debe incluir secretos en claro (el emisor los omite).
  args: z.record(z.string(), z.unknown()).optional(),

  // Quién lo emitió: idPermiso del operador, o un identificador de sistema
  // (cron/automation) cuando lo dispara el cloud sin operador humano.
  issuedBy: z.string().optional(),

  status: ComandoEdgeStatusSchema,
  // Mensaje del result (o motivo del error / sin-respuesta).
  message: z.string().optional(),

  // Timestamps ISO. tsEmitido = al publicar; tsResult = al correlacionar.
  tsEmitido: z.string(),
  tsResult: z.string().optional(),

  // Borrado por TTL (sesgo 90 días). acceso-datos lo mapea a índice TTL.
  expireAt: z.string().optional(),
});

export const CreateComandoEdgeSchema = ComandoEdgeSchema.omit({
  _id: true,
  fechaCreacion: true,
});

export const UpdateComandoEdgeSchema = CreateComandoEdgeSchema.partial();

export type IComandoEdgeStatus = z.infer<typeof ComandoEdgeStatusSchema>;
export type IComandoEdge = z.infer<typeof ComandoEdgeSchema>;
export type ICreateComandoEdge = z.infer<typeof CreateComandoEdgeSchema>;
export type IUpdateComandoEdge = z.infer<typeof UpdateComandoEdgeSchema>;
