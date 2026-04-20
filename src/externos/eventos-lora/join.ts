import { DeviceInfo } from "./uplink";

export interface IJoin {
  deduplicationId?: string;
  time?: string;
  deviceInfo?: DeviceInfo;
  devAddr?: string;
  regionConfigId?: string;
}

export const EXAMPLE_JOIN: IJoin = {
  deduplicationId: "b09a7839-a7c5-44ed-82db-3b02c076813a",
  time: "2025-06-05T13:56:01.613498+00:00",
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
  devAddr: "006c57e9",
  regionConfigId: "au915_0",
};
