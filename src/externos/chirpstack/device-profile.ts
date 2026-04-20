export interface IGetDeviceProfileChirpstack {
  id?: string;
  createdAt?: string;
  updatedAt?: string;
  name?: string;
  region?: string;
  macVersion?: string;
  regParamsRevision?: string;
  supportsOtaa?: boolean;
  supportsClassB?: boolean;
  supportsClassC?: boolean;
}

export interface ICreateUpdateDeviceProfileChirpstack {
  deviceProfile?: {
    abpRx1Delay?: number;
    abpRx1DrOffset?: number;
    abpRx2Dr?: number;
    abpRx2Freq?: number;
    adrAlgorithmID?: string;
    allowRoaming?: boolean;
    autoDetectMeasurements?: boolean;
    classBPingSlotDr?: number;
    classBPingSlotFreq?: number;
    classBPingSlotNbK?: number;
    classBTimeout?: number;
    classCTimeout?: number;
    description?: string;
    deviceStatusReqInterval?: number;
    flushQueueOnActivate?: boolean;
    id?: string;
    isRelay?: boolean;
    isRelayEd?: boolean;
    macVersion?: string;
    measurements?: { [key: string]: { kind: string; name: string } };
    name?: string;
    payloadCodecRuntime?: string;
    payloadCodecScript?: string;
    regParamsRevision?: string;
    region?: string;
    regionConfigId?: string;
    relayCadPeriodicity?: string;
    relayDefaultChannelIndex?: number;
    relayEdActivationMode?: string;
    relayEdBackOff?: number;
    relayEdRelayOnly?: boolean;
    relayEdSmartEnableLevel?: number;
    relayEdUplinkLimitBucketSize?: number;
    relayEdUplinkLimitReloadRate?: number;
    relayEnabled?: boolean;
    relayGlobalUplinkLimitBucketSize?: number;
    relayGlobalUplinkLimitReloadRate?: number;
    relayJoinReqLimitBucketSize?: number;
    relayJoinReqLimitReloadRate?: number;
    relayNotifyLimitBucketSize?: number;
    relayNotifyLimitReloadRate?: number;
    relayOverallLimitBucketSize?: number;
    relayOverallLimitReloadRate?: number;
    relaySecondChannelAckOffset?: string;
    relaySecondChannelDr?: number;
    relaySecondChannelFreq?: number;
    rx1Delay?: number;
    supportsClassB?: boolean;
    supportsClassC?: boolean;

    //////////////////////////////////////////////////////////
    supportsOtaa?: boolean;
    /////////////////////////////////////////////////////////

    tags?: Record<string, string>;
    tenantId?: string;
    uplinkInterval?: number;
  };
}
