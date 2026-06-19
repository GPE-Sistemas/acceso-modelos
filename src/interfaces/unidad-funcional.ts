import { z } from "zod";
import { GeoJSONMultiPolygonSchema } from "../auxiliares/geojson";
import { ClienteSchema } from "./cliente";
import { ComplejoSchema } from "./complejo";

export const TipoUnidadFuncionalSchema = z.enum(["Privada", "Común"]);

export const ConfigUnidadFuncionalSchema = z.record(z.string(), z.any());

export const UnidadFuncionalSchema = z.object({
    _id: z.string().optional(),
    idCliente: z.string().optional(),
    idComplejo: z.string().optional(),
    fechaCreacion: z.string().optional(),
    habilitado: z.boolean().optional(),
    nombre: z.string().optional(),
    /** Identificador NUMÉRICO de la UF, tipeable en teclado (HIK keypad). Base
     *  del `employeeNo` del PIN (ver `ConfigComplejo.pinScheme`). Independiente
     *  de `nombre` (display, puede ser "Casa 1" / "Padel"). Solo lo necesitan
     *  las UF que usan PIN; lo asigna admin/migración. */
    numero: z.number().int().nonnegative().optional(),
    tipo: TipoUnidadFuncionalSchema.optional(),
    ubicacion: GeoJSONMultiPolygonSchema.optional(),
    config: ConfigUnidadFuncionalSchema.optional(),
    imagenes: z.array(z.string()).optional(),
    // ─── Atributos catastrales / expensas ───────────────────────────────────
    /** Superficie en m². Usado por métodos de cálculo de expensas por superficie. */
    superficie: z.number().nonnegative().optional(),
    /**
     * Coeficiente / porcentaje de copropiedad de la UF sobre el total del complejo.
     * Base del prorrateo de expensas comunes. La escala (suma 100, suma 1, etc.)
     * es convención del complejo — el cálculo usa la suma de las UF como denominador.
     */
    coeficiente: z.number().nonnegative().optional(),
    /**
     * Si la UF entra en la liquidación de expensas. Default por `tipo` cuando
     * ausente (Privada=true, Común=false). Permite incluir una UF Común puntual
     * (ej. local comercial) o excluir una Privada.
     */
    facturableExpensas: z.boolean().optional(),
    // Populate
    cliente: ClienteSchema.optional(),
    complejo: ComplejoSchema.optional(),
  });

export const CreateUnidadFuncionalSchema = UnidadFuncionalSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
});

export const UpdateUnidadFuncionalSchema = UnidadFuncionalSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
  complejo: true,
}).partial();

export type ITipoUnidadFuncional = z.infer<typeof TipoUnidadFuncionalSchema>;
export type IConfigUnidadFuncional = z.infer<
  typeof ConfigUnidadFuncionalSchema
>;
export type IUnidadFuncional = z.infer<typeof UnidadFuncionalSchema>;
export type ICreateUnidadFuncional = z.infer<typeof CreateUnidadFuncionalSchema>;
export type IUpdateUnidadFuncional = z.infer<typeof UpdateUnidadFuncionalSchema>;
