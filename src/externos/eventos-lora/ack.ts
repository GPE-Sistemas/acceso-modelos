import { DeviceInfo } from "./uplink";

export interface IAck {
  deduplicationId?: string;
  time?: string;
  deviceInfo?: DeviceInfo;
  queueItemId?: string;
  acknowledged?: boolean;
  fCntDown?: number;
}

export const EXAMPLE_ACK: IAck = {
  deduplicationId: "cd1a76ec-ece8-412e-8948-add1030c29c7",
  time: "2025-06-04T20:41:57.013630+00:00",
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
  queueItemId: "4237c71f-1907-45fd-9174-18416aed1204",
  acknowledged: true,
  fCntDown: 53,
};
