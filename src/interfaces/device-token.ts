import { z } from "zod";

export const DevicePlatformSchema = z.enum(["ios", "android"]);

export const DeviceTokenSchema = z.object({
    _id: z.string().optional(),
    fechaCreacion: z.string().optional(),
    idUsuario: z.string().optional(),
    token: z.string().optional(),
    platform: DevicePlatformSchema.optional(),
    locale: z.string().optional(),
    appVersion: z.string().optional(),
    ultimaActividad: z.string().optional(),
  });

export const CreateDeviceTokenSchema = DeviceTokenSchema.omit({
  _id: true,
  fechaCreacion: true,
});

export const UpdateDeviceTokenSchema = DeviceTokenSchema.omit({
  _id: true,
  fechaCreacion: true,
  idUsuario: true,
  token: true,
}).partial();

export type IDevicePlatform = z.infer<typeof DevicePlatformSchema>;
export type IDeviceToken = z.infer<typeof DeviceTokenSchema>;
export type ICreateDeviceToken = z.infer<typeof CreateDeviceTokenSchema>;
export type IUpdateDeviceToken = z.infer<typeof UpdateDeviceTokenSchema>;
