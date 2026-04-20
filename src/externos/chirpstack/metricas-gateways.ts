export interface IMetricasGateways {
  rxPackets: IMetricaItem; //Paquetes recibidos
  rxPacketsPerDr: IMetricaItem; //Paquetes recibidos por data rate
  rxPacketsPerFreq: IMetricaItem; //Paquetes recibidos por frecuencia
  txPackets: IMetricaItem; //Paquetes transmitidos
  txPacketsPerDr: IMetricaItem; //Paquetes transmitidos por data rate
  txPacketsPerFreq: IMetricaItem; //Paquetes transmitidos por frecuencia
  txPacketsPerStatus: IMetricaItem; //Paquetes transmitidos por estado
}

export interface IMetricaItem {
  datasets: IMetricaDataset[];
  kind: string;
  name: string;
  timestamps: string[];
}

export interface IMetricaDataset {
  data: number[];
  label: string;
}

export type aggregationGatewaysMetrics = 'HOUR' | 'DAY' | 'MONTH' | 'MINUTE';
