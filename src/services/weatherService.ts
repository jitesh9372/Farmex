import type { WeatherData } from '../types';

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || 'b3b9817a3c8196046983f133b8710796';

export const fetchWeather = async (lat: number, lon: number): Promise<WeatherData> => {
  // Fetch current weather
  const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
  const currentData = await currentRes.json();

  // Fetch forecast
  const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`);
  const forecastData = await forecastRes.json();

  if (!currentRes.ok) {
    const errorData = await currentRes.json();
    throw new Error(`Current weather fetch failed: ${errorData.message || currentRes.statusText}`);
  }

  if (!forecastRes.ok) {
    const errorData = await forecastRes.json();
    throw new Error(`Forecast fetch failed: ${errorData.message || forecastRes.statusText}`);
  }

  // Filter forecast to get one entry per day (around 12:00:00)
  const dailyForecast = forecastData.list
    .filter((item: any) => item.dt_txt.includes('12:00:00'))
    .map((item: any) => ({
      date: item.dt_txt,
      temp: Math.round(item.main.temp_max),
      condition: item.weather[0].main,
    }));

  return {
    temp: Math.round(currentData.main.temp),
    condition: currentData.weather[0].main,
    humidity: currentData.main.humidity,
    windSpeed: Math.round(currentData.wind.speed * 3.6), // Convert m/s to km/h
    forecast: dailyForecast,
    locationName: currentData.name,
  };
};
