import { DeviceInfo } from "./uplink";

export interface IStatus {
  deduplicationId?: string;
  time?: string;
  deviceInfo?: DeviceInfo;
  margin?: number;
  externalPowerSource?: boolean;
  batteryLevelUnavailable?: boolean;
  batteryLevel?: number;
}

export const EXAMPLE_STATUS: IStatus = {
  deduplicationId: "7cf33400-9c76-4963-b6d5-cc61075ba585",
  time: "2025-06-05T13:56:37.030976+00:00",
  deviceInfo: {
    tenantId: "edfcd90d-91e2-451f-ae92-b8182ba61188",
    tenantName: "Grupo Control",
    applicationId: "d55e9fe9-f990-40b3-bd17-2deedfa9ec70",
    applicationName: "luminarias-grupocontrol",
    deviceProfileId: "d737b2dc-f1b6-4b0e-8c4e-1876fe3e69d5",
    deviceProfileName: "SSL-01",
    deviceName: "Dispositivo GPE",
    devEui: "4753f09e9e55a874",
    deviceClassEnabled: "CLASS_C",
    tags: {},
  },
  margin: 8,
  externalPowerSource: false,
  batteryLevelUnavailable: true,
  batteryLevel: 0,
};
