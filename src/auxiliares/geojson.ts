// GEOJSON
// https://www.mongodb.com/docs/manual/reference/geojson/
// type es el tipo de objeto a guardar
//  Point LineString  Polygon  MultiPoint  MultiLineString  MultiPolygon  GeometryCollection
// 🗺️
// coordinates[0] = longitud
//  coordinates[1] = latitud
//  coordinates: [number, number];
//

export type IGeoJSON =
  | IGeoJSONPoint
  | IGeoJSONCircle
  | IGeoJSONLineString
  | IGeoJSONPolygon
  | IGeoJSONMultiPolygon;

/**
 * 🗺️
 *
 * Representa un punto geográfico (longitud y latitud)
 *
 * - coordinates: [number, number];
 *
 * --- coordinates[0] = longitud
 *
 * --- coordinates[1] = latitud
 *
 */
export interface IGeoJSONPoint {
  type: "Point";
  coordinates: [number, number];
}

/**
 * 🗺️
 *
 * Representa un círculo geográfico (punto central y radio)
 *
 * - coordinates: [number, number];
 *
 * --- coordinates[0] = longitud del centro
 *
 * --- coordinates[1] = latitud del centro
 *
 * - radius: radio del círculo
 *
 */
export interface IGeoJSONCircle {
  type: "Point";
  coordinates: [number, number];
  radius: number;
}

/**
 * 🗺️
 *
 * Representa una línea geográfica (secuencia de puntos conectados)
 *
 * - coordinates: [number, number][];
 *
 * --- coordinates[n][0] = longitud del punto n
 *
 * --- coordinates[n][1] = latitud del punto n
 *
 */
export interface IGeoJSONLineString {
  type: "LineString";
  coordinates: [number, number][];
}

/**
 * 🗺️
 *
 * Representa un polígono geográfico (área cerrada definida por anillo exterior)
 *
 * - coordinates: [[number, number][]];
 *
 * --- coordinates[0] = anillo exterior (array de puntos)
 *
 * --- coordinates[0][n][0] = longitud del punto n del anillo
 *
 * --- coordinates[0][n][1] = latitud del punto n del anillo
 *
 */
export interface IGeoJSONPolygon {
  type: "Polygon";
  coordinates: [[number, number][]];
}

/**
 * 🗺️
 *
 * Representa múltiples polígonos geográficos (colección de polígonos)
 *
 * - coordinates: number[][][][];
 *
 * --- coordinates[ i ] = polígono i (array de anillos)
 *
 * --- coordinates[ i ][ j ] = anillo j del polígono i (array de puntos)
 *
 * --- coordinates[ i ][ j ][ k ][ 0 ] = longitud del punto k del anillo j del polígono i
 *
 * --- coordinates[ i ][ j ][ k ][ 1 ] = latitud del punto k del anillo j del polígono i
 *
 */
export interface IGeoJSONMultiPolygon {
  type: "MultiPolygon";
  coordinates: number[][][][];
}
