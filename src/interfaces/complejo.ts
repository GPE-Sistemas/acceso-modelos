import { z } from "zod";
import { ClienteSchema } from "./cliente";
import { GeoJSONMultiPolygonSchema } from "../auxiliares/geojson";

/**
 * Esquema de identificador de PIN del complejo (terminales de teclado HIK, ej.
 * DS-K1T502DBFWX-C). El `employeeNo` del device-user de teclado se compone como
 * `pad(IUnidadFuncional.numero, digitosUF) + pad(ICredencial.datos.numeroUsuarioUF, digitosUsuario)`.
 * El vecino tipea ese identificador en el teclado. Configurable por barrio.
 *
 * Modo:
 *  - `IdentificadorYPin` (B, confirmado): tipea `id + # + PIN` personal. verifyMode con `Pw`.
 *  - `IdentificadorSolo` (A, a verificar contra el device): tipea solo el `id`, sin PIN.
 *    Depende de que el terminal conceda por employeeNo-only (no confirmado aún).
 */
export const PinModoSchema = z.enum(["IdentificadorSolo", "IdentificadorYPin"]);

export const PinSchemeSchema = z.object({
  modo: PinModoSchema,
  /** Dígitos del nº de UF en el identificador (left-pad). Las UF productivas
   *  relevadas son de 3 díg; default 4 deja margen. */
  digitosUF: z.number().int().min(1).max(8).optional(),
  /** Dígitos del nº de integrante dentro de la UF (`00`–`99`). 0 = un único
   *  PIN por UF (sin discriminar integrante). */
  digitosUsuario: z.number().int().min(0).max(4).optional(),
});

export const ConfigComplejoSchema = z.object({
  imagenes: z.object({
      logo: z.string().optional(),
      banner: z.string().optional(),
    })
    .optional(),
  /** Política de identificador de PIN para terminales de teclado (opcional —
   *  ausente = el complejo no usa PIN). */
  pinScheme: PinSchemeSchema.optional(),
});

export const TipoComplejoSchema = z.enum(["Barrio", "Edificio", "Condominio"]);

export const ComplejoSchema = z.object({
    _id: z.string().optional(),
    idCliente: z.string().optional(),
    fechaCreacion: z.string().optional(),
    habilitado: z.boolean().optional(),
    nombre: z.string().optional(),
    tipo: TipoComplejoSchema.optional(),
    /**
     * Polígono(s) que delimita(n) el complejo. Usado para geo-fence de tickets
     * cuyo botón tenga `config.requiereDentroDelComplejo = true`.
     */
    ubicacion: GeoJSONMultiPolygonSchema.optional(),
    config: ConfigComplejoSchema.optional(),
    // Populate
    cliente: ClienteSchema.optional(),
  });

export const CreateComplejoSchema = ComplejoSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
});

export const UpdateComplejoSchema = ComplejoSchema.omit({
  _id: true,
  fechaCreacion: true,
  cliente: true,
}).partial();

export type IPinModo = z.infer<typeof PinModoSchema>;
export type IPinScheme = z.infer<typeof PinSchemeSchema>;
export type IConfigComplejo = z.infer<typeof ConfigComplejoSchema>;
export type ITipoComplejo = z.infer<typeof TipoComplejoSchema>;
export type IComplejo = z.infer<typeof ComplejoSchema>;
export type ICreateComplejo = z.infer<typeof CreateComplejoSchema>;
export type IUpdateComplejo = z.infer<typeof UpdateComplejoSchema>;
