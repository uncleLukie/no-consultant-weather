export type RadarRange = '64' | '128' | '256' | '512';

export interface RadarLocation {
  id: string;
  name: string;
  location: string;
  state: string;
  baseId: string; // Base radar ID like "66" for Brisbane
  productId: string; // Full product ID like "IDR713" (default 128km range)
}

export interface RadarImage {
  url: string;
  timestamp: string;
}

export interface RadarOverlays {
  background: boolean;
  topography: boolean;
  catchments: boolean;
  range: boolean;
  locations: boolean;
}
