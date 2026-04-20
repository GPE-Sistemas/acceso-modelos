export interface ICreateUpdateDeviceKeysChirpstack {
  deviceKeys?: {
    appKey?: string;
    nwkKey?: string; //Ambas Keys son lo mismo, pero cambian el nombre según la versión del dispositivo Lorawan
  };
}
