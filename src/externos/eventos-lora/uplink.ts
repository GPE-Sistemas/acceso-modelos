export interface IUplink {
  deduplicationId?: string;
  time?: string;
  deviceInfo?: DeviceInfo;
  devAddr?: string;
  adr?: boolean;
  dr?: number;
  fCnt?: number;
  fPort?: number;
  confirmed?: boolean;
  data?: string;
  object?: IObjectUplink;
  rxInfo?: RxInfo[];
  txInfo?: TxInfo;
  regionConfigId?: string;
}

export interface DeviceInfo {
  tenantId?: string;
  tenantName?: string;
  applicationId?: string;
  applicationName?: string;
  deviceProfileId?: string;
  deviceProfileName?: string;
  deviceName?: string;
  devEui?: string;
  deviceClassEnabled?: string;
  tags?: Tags;
}

export interface Tags {
  [key: string]: string;
}

export interface IObjectUplink {
  err?: number;
  valid?: boolean;
  payload?: string;
  messages?: Array<IMessageUplink[]>;
  errMessage?: string;
}

export interface IMessageUplink {
  measurementValue?:
    | IMeasurementValueElementUplink[]
    | IPositioningStatus
    | number;
  timestamp?: number;
  measurementId?: string;
  motionId?: number;
  type?: string;
}

export interface IPositioningStatus {
  id?: number;
  statusName?: string;
}

export interface IMeasurementValueElementUplink {
  mac?: string;
  rssi?: number;
}
export interface RxInfo {
  gatewayId?: string;
  uplinkId?: number;
  gwTime?: string;
  nsTime?: string;
  timeSinceGpsEpoch?: string;
  rssi?: number;
  snr?: number;
  location?: Location;
  context?: string;
  crcStatus?: string;
}

export interface Location {
  latitude?: number;
  longitude?: number;
}

export interface TxInfo {
  frequency?: number;
  modulation?: Modulation;
}

export interface Modulation {
  lora?: Lora;
}

export interface Lora {
  bandwidth?: number;
  spreadingFactor?: number;
  codeRate?: string;
}

export const EXAMPLE_UPLINK: IUplink = {
  deduplicationId: "8dc86175-520c-4b1e-9f12-1bd8fa2756c8",
  time: "2025-04-04T12:34:42.762964+00:00",
  deviceInfo: {
    tenantId: "edfcd90d-91e2-451f-ae92-b8182ba61188",
    tenantName: "Grupo Control",
    applicationId: "d4dd9bfb-cca4-469d-b776-9582331d2908",
    applicationName: "prueba",
    deviceProfileId: "16208f33-dd9c-4f5c-b060-6c65df471087",
    deviceProfileName: "LoRaWAN LC SHUNCOM",
    deviceName: "SHUNCOM_8679",
    devEui: "6af03b46f5628679",
    deviceClassEnabled: "CLASS_C",
    tags: {},
  },
  devAddr: "018c0f49",
  adr: true,
  dr: 5,
  fCnt: 86,
  fPort: 10,
  confirmed: false,
  data: "ER0AAAABBBBkBQQAACAMVj4C0QYoABATiAACoHw=",
  rxInfo: [
    {
      gatewayId: "ac1f09fffe103e25",
      uplinkId: 618823116,
      gwTime: "2025-04-04T12:34:42.762964+00:00",
      nsTime: "2025-04-04T12:34:42.866232204+00:00",
      timeSinceGpsEpoch: "1427805300.762964s",
      rssi: -57,
      snr: 14.0,
      location: { latitude: -35.57379087247274, longitude: -58.01321928243111 },
      context: "AAAAAAAAAAAAswA1TEVsMA==",
      crcStatus: "CRC_OK",
    },
  ],
  txInfo: {
    frequency: 915400000,
    modulation: {
      lora: { bandwidth: 125000, spreadingFactor: 7, codeRate: "CR_4_5" },
    },
  },
  regionConfigId: "au915_0",
};
