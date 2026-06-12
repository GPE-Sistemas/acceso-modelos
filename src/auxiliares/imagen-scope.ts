/**
 * Imagen storage scope — clasifica cada carpeta GCS por comportamiento
 * cloud/edge en el bundle Hub edge.
 *
 * Tres modos:
 *
 * - `cloud-only`: live data, no se cachea en edge. Upload + resolve cloud
 *   directo en ambos targets. Edge no debe persistir copia local porque el
 *   contexto cambia frecuentemente (publicaciones, tickets/emergencias/
 *   solicitudes).
 *
 * - `cloud-cacheable`: origen cloud (admin/mobile), pero idempotente y
 *   relativamente estable. Upload cloud directo. Resolve via edge con cache
 *   read-through (B.S10) — el edge baja del cloud on demand y guarda LRU.
 *   Avatares de operadores, branding del complejo, imágenes UF.
 *
 * - `edge-uploadable`: puede crearse offline en edge (panel guardia). Upload
 *   en target=edge va al outbox local del edge (PUT
 *   `/storage/upload-direct/<uuid>`); el publisher drena al cloud cuando hay
 *   conectividad. Resolve via edge (cache propio + outbox pending).
 *   Visitantes, vehículos, ingresos-egresos, detecciones (snapshots de video).
 */
export type ImagenScope = "cloud-only" | "cloud-cacheable" | "edge-uploadable";

/**
 * Mapa carpeta → scope. Source of truth para frontend (web/mobile) + edge
 * + cloud cuando necesitan rutear upload o resolve por dominio.
 *
 * Carpeta = primer segmento del `objectName` (`<carpeta>/<uuid>.<ext>`).
 * Convención determinada por `acceso-api` `StorageService.buildObjectName`.
 */
export const CARPETAS_IMAGEN: Readonly<Record<string, ImagenScope>> = {
  publicaciones: "cloud-only",
  tickets: "cloud-only",
  emergencias: "cloud-only",
  solicitudes: "cloud-only",

  usuarios: "cloud-cacheable",
  "unidades-funcionales": "cloud-cacheable",
  complejos: "cloud-cacheable",

  visitantes: "edge-uploadable",
  vehiculos: "edge-uploadable",
  "ingresos-egresos": "edge-uploadable",
  // Snapshots de detección de video (módulo IA-video M3): los genera el edge
  // offline desde Frigate y se resuelven del cache local del edge (igual que
  // ingresos-egresos), no del cloud. Sino el panel de guardia los pide a cloud.
  detecciones: "edge-uploadable",
};

/**
 * Default conservador para carpetas no mapeadas — tratar como `cloud-only`
 * evita persistir basura en cache edge y obliga a registrar la carpeta acá
 * antes de usarla en producción.
 */
const SCOPE_DEFAULT: ImagenScope = "cloud-only";

/**
 * Devuelve el scope de una carpeta. Carpeta desconocida → `cloud-only`
 * (default safe).
 */
export function getScopeCarpeta(carpeta: string | null | undefined): ImagenScope {
  if (!carpeta) return SCOPE_DEFAULT;
  return CARPETAS_IMAGEN[carpeta] ?? SCOPE_DEFAULT;
}

/**
 * Deriva el scope a partir de un `objectName` (`<carpeta>/<uuid>.<ext>`).
 * `objectName` sin `/` o vacío → `cloud-only`.
 */
export function getScopeFromObjectName(objectName: string | null | undefined): ImagenScope {
  if (!objectName) return SCOPE_DEFAULT;
  const slash = objectName.indexOf("/");
  if (slash <= 0) return SCOPE_DEFAULT;
  return getScopeCarpeta(objectName.substring(0, slash));
}

/**
 * `true` si el edge (target=edge) puede recibir el upload local (outbox).
 * En target=cloud el resultado no aplica — siempre se sube al cloud.
 */
export function permiteUploadEdge(carpeta: string | null | undefined): boolean {
  return getScopeCarpeta(carpeta) === "edge-uploadable";
}

/**
 * `true` si el edge debe cachear (read-through) las lecturas de esta
 * carpeta. Tanto `cloud-cacheable` como `edge-uploadable` cachean; solo
 * `cloud-only` queda fuera.
 */
export function esCacheableEnEdge(carpeta: string | null | undefined): boolean {
  return getScopeCarpeta(carpeta) !== "cloud-only";
}
