import { DeviceInfo } from "./uplink";

export interface ILog {
  time?: string;
  deviceInfo?: DeviceInfo;
  level?: string; // "ERROR", "WARNING", "INFO"
  code?: string; // "DOWNLINK_GATEWAY", "UPLINK_F_CNT_RETRANSMISSION", etc.
  description?: string;
  context?: Record<string, any>;
}

export const EXAMPLE_LOG_ERROR: ILog = {
  time: "2025-12-11T20:49:52.238228508+00:00",
  deviceInfo: {
    tenantId: "edfcd90d-91e2-451f-ae92-b8182ba61188",
    tenantName: "Grupo Control",
    applicationId: "6aa7f561-fcdc-4bdc-923a-bb69aa684358",
    applicationName: "luminarias-fing",
    deviceProfileId: "60113151-948e-45be-9675-7fb3de65161b",
    deviceProfileName: "ACTIS PLUS NEMA 7 FING",
    deviceName: "ACTIS-04068245",
    devEui: "0080000004068245",
    deviceClassEnabled: "CLASS_C",
    tags: {},
  },
  level: "ERROR",
  code: "DOWNLINK_GATEWAY",
  description: "COLLISION_PACKET",
  context: {},
};

export const EXAMPLE_LOG_WARNING: ILog = {
  time: "2025-12-11T20:59:59.129663+00:00",
  deviceInfo: {
    tenantId: "edfcd90d-91e2-451f-ae92-b8182ba61188",
    tenantName: "Grupo Control",
    applicationId: "d55e9fe9-f990-40b3-bd17-2deedfa9ec70",
    applicationName: "luminarias-grupocontrol",
    deviceProfileId: "d737b2dc-f1b6-4b0e-8c4e-1876fe3e69d5",
    deviceProfileName: "SSL-01",
    deviceName: "SSL-077A6C",
    devEui: "475350787d077a6c",
    deviceClassEnabled: "CLASS_C",
    tags: {},
  },
  level: "WARNING",
  code: "UPLINK_F_CNT_RETRANSMISSION",
  description: "Uplink was flagged as re-transmission / frame-counter did not increment",
  context: {
    deduplication_id: "8ec164e1-b5b3-4de6-94fa-9b5516347585",
  },
};
