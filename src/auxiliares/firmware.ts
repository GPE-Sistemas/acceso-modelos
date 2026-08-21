/**
 * Catálogo de versiones de firmware soportadas por modelo de dispositivo, y las
 * primitivas para comparar versiones y evaluar el nivel de soporte.
 *
 * **Por qué existe**: el firmware de un terminal condiciona qué partes de la
 * integración funcionan. Un terminal viejo puede adoptarse y reportar estado,
 * pero no necesariamente enrolar credenciales de forma confiable. Sin un lugar
 * único donde declarar el umbral, cada servicio inventa el suyo.
 *
 * **Quién lo usa**: acceso-api evalúa el soporte al materializar el inventario
 * que reporta el edge y persiste el resultado en `IDispositivo.firmware`. El
 * agent edge NO reimplementa esta política: lee el veredicto ya calculado del
 * documento replicado. Cloud es SoT del modelo y de la lógica de negocio.
 *
 * **Fail-open deliberado**: un modelo sin entrada en el catálogo resuelve
 * `Desconocido`, que no bloquea nada. Un modelo nuevo que todavía no relevamos
 * no puede quedar trabado por omisión.
 */

/** Nivel de soporte resuelto para la versión que corre un dispositivo. */
export type INivelSoporteFirmware =
  | "Soportado"
  | "Actualización recomendada"
  | "No soportado"
  | "Desconocido";

/** Umbrales de una familia de dispositivos. */
export interface IEntradaCatalogoFirmware {
  /**
   * Debajo de esta versión la integración no se considera confiable: el
   * enrolamiento de credenciales queda bloqueado hasta actualizar. La adopción
   * NO se bloquea nunca — si no se pudiera adoptar, tampoco habría forma de
   * actualizar el firmware del equipo.
   */
  minimaSoportada: string;
  /**
   * Versión a partir de la cual no pedimos actualizar. Entre `minimaSoportada`
   * y esta, el device opera normal pero se marca como conviene actualizar.
   */
  minimaRecomendada: string;
  /** De dónde salen los números. Sin esto el catálogo envejece sin que se note. */
  nota: string;
}

/**
 * Catálogo por modelo. La clave se compara normalizada (mayúsculas, sin espacios
 * ni guiones) contra `IDispositivo.modelo`, que viene del `<model>` del
 * `deviceInfo` ISAPI.
 *
 * Los umbrales son conservadores a propósito: declaran la versión más baja con
 * la que efectivamente operamos, no la más baja que "debería andar".
 */
export const CATALOGO_FIRMWARE: Record<string, IEntradaCatalogoFirmware> = {
  // Terminal facial. Relevamiento 2026-08-20 sobre las dos unidades de
  // Chascomús: V4.31.0 (build 250421) y V4.47.0 (build 250722). La V4.47.0 es
  // la única sobre la que se corrió la cadena de credenciales; la V4.31.0 corre
  // un BSP de rama especial (`V1.12.0_S2025042100004`) y no expone
  // `securityModule` ni los flags de encriptación/protección de password que sí
  // trae la V4.47.0.
  "DS-K1T344MBWX-E1": {
    minimaSoportada: "V4.47.0",
    minimaRecomendada: "V4.47.0",
    nota: "V4.47.0 build 250722 es la única versión sobre la que se ejerció la cadena de credenciales. La V4.31.0 corre un BSP de rama especial y no expone securityModule ni isSupportEncryption.",
  },
  // Terminal tarjeta + huella + portería. V1.7.3 es la versión relevada; su
  // schema de `httpHosts` viene recortado (sin parameterFormatType ni
  // httpAuthenticationMethod), por eso este modelo va por ingesta pull.
  "DS-K1T502DBFWX-C": {
    minimaSoportada: "V1.7.3",
    minimaRecomendada: "V1.7.3",
    nota: "V1.7.3 es la única versión relevada. Su schema de httpHosts está recortado, de ahí la ingesta pull. Bajo DHCP el stack de red se cuelga: usar IP estática.",
  },
};

/** Normaliza el modelo para buscarlo en el catálogo, tolerando formato. */
function normalizarModelo(modelo: string): string {
  return modelo.trim().toUpperCase().replace(/[\s_]/g, "");
}

/**
 * Parsea una versión de firmware Hikvision (`V4.31.0`, `4.31.0`,
 * `V4.31.0build 250421`) a la tupla numérica comparable. Devuelve `null` si el
 * string no tiene forma de versión — el caller trata eso como `Desconocido`,
 * nunca como "vieja".
 */
export function parsearVersionFirmware(version: string): number[] | null {
  const m = /(\d+)\.(\d+)(?:\.(\d+))?(?:\.(\d+))?/.exec(version ?? "");
  if (!m) return null;
  return [m[1], m[2], m[3], m[4]].map((p) => (p == null ? 0 : Number(p)));
}

/**
 * Compara dos versiones de firmware. `-1` si `a` es anterior a `b`, `1` si es
 * posterior, `0` si son equivalentes. Devuelve `null` si alguna no se pudo
 * parsear — la ausencia de dato no se resuelve como desigualdad.
 */
export function compararVersionFirmware(
  a: string,
  b: string,
): -1 | 0 | 1 | null {
  const va = parsearVersionFirmware(a);
  const vb = parsearVersionFirmware(b);
  if (!va || !vb) return null;
  for (let i = 0; i < Math.max(va.length, vb.length); i++) {
    const da = va[i] ?? 0;
    const db = vb[i] ?? 0;
    if (da < db) return -1;
    if (da > db) return 1;
  }
  return 0;
}

/** Resultado de evaluar el firmware de un dispositivo contra el catálogo. */
export interface IEvaluacionFirmware {
  soporte: INivelSoporteFirmware;
  minimaSoportada?: string;
  minimaRecomendada?: string;
  /** Frase lista para mostrar. Explica por qué dio ese nivel. */
  motivo: string;
  /** `true` si el enrolamiento de credenciales debe quedar bloqueado. */
  bloqueaEnrolamiento: boolean;
}

/**
 * Evalúa la versión que corre un dispositivo contra el catálogo de su modelo.
 *
 * Sin modelo, sin versión, o con un modelo que no está en el catálogo, resuelve
 * `Desconocido` y no bloquea: preferimos un device operando sin veredicto antes
 * que uno trabado por una omisión del catálogo.
 */
export function evaluarSoporteFirmware(
  modelo: string | undefined,
  version: string | undefined,
): IEvaluacionFirmware {
  if (!modelo || !version) {
    return {
      soporte: "Desconocido",
      motivo: "El dispositivo todavía no reportó modelo y versión de firmware.",
      bloqueaEnrolamiento: false,
    };
  }
  const entrada = CATALOGO_FIRMWARE[normalizarModelo(modelo)];
  if (!entrada) {
    return {
      soporte: "Desconocido",
      motivo: `El modelo ${modelo} no está en el catálogo de firmware soportado.`,
      bloqueaEnrolamiento: false,
    };
  }
  const vsMinima = compararVersionFirmware(version, entrada.minimaSoportada);
  if (vsMinima == null) {
    return {
      soporte: "Desconocido",
      minimaSoportada: entrada.minimaSoportada,
      minimaRecomendada: entrada.minimaRecomendada,
      motivo: `No se pudo interpretar la versión reportada (${version}).`,
      bloqueaEnrolamiento: false,
    };
  }
  if (vsMinima < 0) {
    return {
      soporte: "No soportado",
      minimaSoportada: entrada.minimaSoportada,
      minimaRecomendada: entrada.minimaRecomendada,
      motivo: `El firmware ${version} es anterior a la mínima soportada ${entrada.minimaSoportada}. El enrolamiento de credenciales queda bloqueado hasta actualizar.`,
      bloqueaEnrolamiento: true,
    };
  }
  const vsRecomendada = compararVersionFirmware(
    version,
    entrada.minimaRecomendada,
  );
  if (vsRecomendada != null && vsRecomendada < 0) {
    return {
      soporte: "Actualización recomendada",
      minimaSoportada: entrada.minimaSoportada,
      minimaRecomendada: entrada.minimaRecomendada,
      motivo: `El firmware ${version} opera, pero conviene actualizar a ${entrada.minimaRecomendada} o superior.`,
      bloqueaEnrolamiento: false,
    };
  }
  return {
    soporte: "Soportado",
    minimaSoportada: entrada.minimaSoportada,
    minimaRecomendada: entrada.minimaRecomendada,
    motivo: `El firmware ${version} está dentro de las versiones soportadas.`,
    bloqueaEnrolamiento: false,
  };
}
