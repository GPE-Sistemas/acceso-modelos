import { z } from "zod";
import { GeoJSONPointSchema } from "../auxiliares/geojson";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";

export const TipoAccesoSchema = z.enum(["Ingreso", "Egreso", "Ambos"]);
export const TipoPersonaAccesoSchema = z.enum([
  "Propietarios",
  "Visitas",
  "Ambos",
]);

export const AccesoSchema = z.object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    idCliente: z.string().optional(),
    idComplejo: z.string().optional(),
    nombre: z.string().optional(),
    habilitado: z.boolean().optional(),
    tipo: TipoAccesoSchema.optional(),
    tipoPersona: TipoPersonaAccesoSchema.optional(),
    ubicacion: GeoJSONPointSchema.optional(),
    /** Dispositivo que provee el video de PORTERÍA de este acceso (FK a IDispositivo):
     *  el terminal con cámara (ej. HIK DS-K1T502DBFWX-C) o una cámara/NVR asociada.
     *  El panel del guardia lo usa para mostrar el snapshot/stream del acceso.
     *  Sin populate acá (evita inflar la inferencia TS de la cadena
     *  IAcceso ⊂ IIngresoEgreso); el consumidor resuelve el device por separado. */
    idDispositivoPorteria: z.string().optional(),
    // Populate
    cliente: ClienteSchema.optional(),
    complejo: ComplejoSchema.optional(),
  });

export const CreateAccesoSchema = AccesoSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
});

export const UpdateAccesoSchema = AccesoSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
}).partial();

export type ITipoAcceso = z.infer<typeof TipoAccesoSchema>;
export type ITipoPersonaAcceso = z.infer<typeof TipoPersonaAccesoSchema>;
export type IAcceso = z.infer<typeof AccesoSchema>;
export type ICreateAcceso = z.infer<typeof CreateAccesoSchema>;
export type IUpdateAcceso = z.infer<typeof UpdateAccesoSchema>;
