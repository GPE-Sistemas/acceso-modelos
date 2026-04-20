import { DeviceInfo } from "./uplink";

export interface ITxack {
  downlinkId?: number;
  time?: string;
  deviceInfo?: DeviceInfo;
  queueItemId?: string;
  fCntDown?: number;
  gatewayId?: string;
  txInfo?: TxInfoTxack;
}

export interface TxInfoTxack {
  frequency?: number;
  power?: number;
  modulation?: ModulationTxack;
  timing?: Timing;
  context?: string;
}

export interface ModulationTxack {
  lora?: LoraTxack;
}

export interface LoraTxack {
  bandwidth?: number;
  spreadingFactor?: number;
  codeRate?: string;
  polarizationInversion?: boolean;
}

export interface Timing {
  delay?: {
    delay?: string;
  };
  immediately?: {};
}

export const EXAMPLE_TXACK: ITxack = {
  downlinkId: 259727475,
  time: "2025-06-05T13:59:31.052842656+00:00",
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
  queueItemId: "2a10946f-b85b-4272-8b18-d595524810cd",
  fCntDown: 3,
  gatewayId: "ac1f09fffe064d1f",
  txInfo: {
    frequency: 923300000,
    power: 30,
    modulation: {
      lora: {
        bandwidth: 500000,
        spreadingFactor: 12,
        codeRate: "CR_4_5",
        polarizationInversion: true,
      },
    },
    timing: {
      immediately: {},
    },
    context: "AAAAAAAAAAAAcgAnPmjJow==",
  },
};
