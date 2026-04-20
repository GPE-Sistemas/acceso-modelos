export interface ICreateUpdateGatewayChirpstack {
  gateway?: IGatewayInfo;
}

export interface IGatewayInfo {
  description?: string;
  gatewayId?: string; //Este es el gatewayEui
  location?: ILocationGateway;
  metadata?: Record<string, string>;
  name?: string;
  statsInterval?: number;
  tags?: Record<string, string>;
  tenantId?: string;
}

export interface ILocationGateway {
  accuracy?: number;
  altitude?: number;
  latitude?: number;
  longitude?: number;
  source?: string;
}

export interface IGatewayChirpstack
  extends Omit<IGatewayInfo, 'metadata' | 'tags' | 'statsInterval'> {
  createdAt?: string;
  lastSeenAt?: string;
  updatedAt?: string;
  properties?: Record<string, string>;
  state: string;
}
