export interface RadarLocation {
  id: string;
  name: string;
  location: string;
  state: string;
  productId: string; // Full product ID like "IDR713"
}

export interface RadarImage {
  url: string;
  timestamp: string;
}
