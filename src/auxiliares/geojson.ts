import { z } from "zod";

// GEOJSON
// https://www.mongodb.com/docs/manual/reference/geojson/
// coordinates[0] = longitud, coordinates[1] = latitud

const PointCoord = z.tuple([z.number(), z.number()]);

export const GeoJSONPointSchema = z
  .object({
    type: z.literal("Point"),
    coordinates: PointCoord,
  })
  .passthrough();

export const GeoJSONCircleSchema = z
  .object({
    type: z.literal("Point"),
    coordinates: PointCoord,
    radius: z.number(),
  })
  .passthrough();

export const GeoJSONLineStringSchema = z
  .object({
    type: z.literal("LineString"),
    coordinates: z.array(PointCoord),
  })
  .passthrough();

export const GeoJSONPolygonSchema = z
  .object({
    type: z.literal("Polygon"),
    coordinates: z.array(z.array(PointCoord)),
  })
  .passthrough();

export const GeoJSONMultiPolygonSchema = z
  .object({
    type: z.literal("MultiPolygon"),
    coordinates: z.array(z.array(z.array(z.array(z.number())))),
  })
  .passthrough();

export const GeoJSONSchema = z.union([
  GeoJSONPointSchema,
  GeoJSONCircleSchema,
  GeoJSONLineStringSchema,
  GeoJSONPolygonSchema,
  GeoJSONMultiPolygonSchema,
]);

export type IGeoJSONPoint = z.infer<typeof GeoJSONPointSchema>;
export type IGeoJSONCircle = z.infer<typeof GeoJSONCircleSchema>;
export type IGeoJSONLineString = z.infer<typeof GeoJSONLineStringSchema>;
export type IGeoJSONPolygon = z.infer<typeof GeoJSONPolygonSchema>;
export type IGeoJSONMultiPolygon = z.infer<typeof GeoJSONMultiPolygonSchema>;
export type IGeoJSON = z.infer<typeof GeoJSONSchema>;
