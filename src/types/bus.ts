export type BusOperator = 'SBST' | 'SMRT' | 'TTS' | 'GAS';

/**
 * LTA DataMall BusArrivalv2 Load codes:
 * - SEA: Seats Available
 * - SDA: Standing Available
 * - LSD: Limited Standing
 */
export type BusLoad = 'SEA' | 'SDA' | 'LSD' | '';

/**
 * LTA DataMall BusArrivalv2 Type codes:
 * - SD: Single Deck
 * - DD: Double Deck
 * - BD: Bendy
 */
export type BusType = 'SD' | 'DD' | 'BD' | '';

/**
 * LTA DataMall BusArrivalv2 Feature codes:
 * - WAB: Wheel-Chair Accessible Bus
 */
export type BusFeature = 'WAB' | '';

export interface IncomingBus {
  originCode: string;
  destinationCode: string;
  estimatedArrival: string; // ISO-8601 timestamp or empty string
  latitude: string;
  longitude: string;
  visitNumber: string;
  load: BusLoad;
  feature: BusFeature;
  type: BusType;
}

export interface BusServiceArrival {
  serviceNo: string;
  operator: BusOperator;
  nextBus: IncomingBus;
  nextBus2: IncomingBus;
  nextBus3: IncomingBus;
}

export interface BusArrivalResponse {
  busStopCode: string;
  services: BusServiceArrival[];
  fetchedAt: number; // Unix timestamp ms
  source: 'sample' | 'api';
}

export type SingaporeRegion =
  | 'Central & Orchard'
  | 'Marina & CBD'
  | 'East'
  | 'West'
  | 'North'
  | 'North-East';

export interface BusStop {
  code: string; // 5-digit Singapore LTA bus stop code
  description: string; // e.g. "Lucky Plaza"
  roadName: string; // e.g. "Orchard Rd"
  region: SingaporeRegion;
  services: string[]; // Known bus service numbers
  isCustom?: boolean; // True when entered as an unlisted 5-digit code
}

export interface FavoriteStop {
  code: string;
  customLabel: string; // Optional commuter nickname e.g. "Home", "Work"
  description: string;
  roadName: string;
  pinnedServices: string[]; // Highlighted services pinned to top of board
  addedAt: number;
}

export interface RecentStop {
  code: string;
  description: string;
  roadName: string;
  viewedAt: number;
}

export interface ApiConfig {
  mode: 'sample' | 'custom';
  endpointTemplate: string; // e.g. "/api/bus-arrival?BusStopCode={code}"
  autoRefreshSeconds: number;
}
