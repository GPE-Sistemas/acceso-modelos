export interface ICreateUpdateDeviceActivation {
  deviceActivation?: {
    description?: string;
    aFCntDown?: number;
    appSKey?: string;
    devAddr?: string;
    fCntUp?: number;
    fNwkSIntKey?: string;
    nFCntDown?: number;
    nwkSEncKey?: string;
    sNwkSIntKey?: string;
  };
}
