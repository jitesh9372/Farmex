export interface WeatherData {
  temp: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  forecast: ForecastDay[];
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
