export interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  forecast: ForecastDay[];
  locationName: string;
}

export interface ForecastDay {
  date: string;
  temp: number;
  condition: string;
}

export interface CropRecommendation {
  crop: string;
  yield: string;
  risk: 'Low' | 'Medium' | 'High';
  reasoning: string;
}

export interface MarketPrice {
  crop: string;
  price: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

export interface FarmingTask {
  id: string;
  title: string;
  date: string;
  type: 'Sowing' | 'Fertilizing' | 'Irrigation' | 'Harvesting';
  completed: boolean;
}

export interface RiskAlert {
  type: 'Drought' | 'Flood' | 'Pest' | 'Temperature';
  level: 'Low' | 'Medium' | 'High';
  message: string;
  action: string;
}

export interface MarketSearchResult {
  commodity: string;
  market: string;
  district: string;
  state: string;
  price: string;
  minPrice: string;
  maxPrice: string;
  date: string;
  unit: string;
  trend?: string;
  details?: string;
}

export interface DiseaseResult {
  disease: string;
  confidence: number;
  treatment: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
}
