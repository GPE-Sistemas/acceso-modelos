export interface ICreateUpdateDeviceChirpstack {
  device?: IDeviceInfo;
}

export interface IDeviceInfo {
  applicationId?: string;
  description?: string;
  devEui?: string;
  deviceProfileId?: string;
  isDisabled?: boolean;
  joinEui?: string;
  name?: string;
  skipFcntCheck?: boolean;
  tags?: Record<string, string>;
  variables?: Record<string, string>;
}

export interface IDeviceStatus {
  batteryLevel?: number;
  externalPowerSource?: boolean;
  margin?: number;
}

export interface IDeviceChirpstack {
  classEnabled?: string;
  createdAt?: string;
  lastSeenAt?: string;
  updatedAt?: string;
  device?: IDeviceInfo;
  deviceStatus?: IDeviceStatus;
}
