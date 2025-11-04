export type RadarRange = '64' | '128' | '256' | '512';
export type RadarMode = 'rain' | 'doppler';

export interface RadarLocation {
  id: string;
  name: string;
  location: string;
  state: string;
  baseId: string; // Base radar ID like "66" for Brisbane
  productId: string; // Full product ID like "IDR713" (default 128km range)
  hasDoppler: boolean; // Whether this radar supports doppler wind mode
  dopplerProductId?: string; // Doppler product ID like "IDR66I" (if hasDoppler is true)
  lat: number; // Latitude for proximity calculations
  lng: number; // Longitude for proximity calculations
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
  legend: boolean;
}

// Weather data types

export interface WeatherLocation {
  name: string;
  state: string;
  geohash: string;
  lat: number;
  lng: number;
}

export interface WindData {
  speed_kilometre?: number;
  speed_knot?: number;
  direction?: string;
}

export interface GustData {
  speed_kilometre?: number;
  time?: string;
}

export interface TempData {
  value?: number;
  time?: string;
}

export interface WeatherStation {
  bom_id?: string;
  name?: string;
  distance?: number;
}

export interface WeatherObservations {
  temp?: number;
  temp_feels_like?: number;
  wind?: WindData;
  gust?: GustData;
  rain_since_9am?: number;
  humidity?: number;
  max_temp?: TempData;
  min_temp?: TempData;
  station?: WeatherStation;
}

export interface RainData {
  chance?: number;
  amount?: {
    min?: number;
    max?: number;
    units?: string;
  };
}

export interface UVData {
  category?: string;
  max_index?: number;
  start_time?: string;
  end_time?: string;
}

export interface AstronomicalData {
  sunrise_time?: string;
  sunset_time?: string;
}

export interface DailyForecast {
  date?: string;
  temp_max?: number;
  temp_min?: number;
  extended_text?: string;
  short_text?: string;
  icon_descriptor?: string;
  rain?: RainData;
  uv?: UVData;
  fire_danger?: string;
  astronomical?: AstronomicalData;
}

export interface ForecastData {
  today?: DailyForecast;
  daily?: DailyForecast[];
}

export interface WeatherData {
  location: WeatherLocation;
  observations: WeatherObservations | null;
  forecast: ForecastData | null;
}
