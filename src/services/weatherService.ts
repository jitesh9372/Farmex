export const fetchWeather = async (lat: number, lon: number) => {
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,weathercode&timezone=auto`);
  const data = await response.json();
  
  const weatherCodes: { [key: number]: string } = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Drizzle: Light',
    53: 'Drizzle: Moderate',
    55: 'Drizzle: Dense intensity',
    61: 'Rain: Slight',
    63: 'Rain: Moderate',
    65: 'Rain: Heavy intensity',
    71: 'Snow fall: Slight',
    73: 'Snow fall: Moderate',
    75: 'Snow fall: Heavy intensity',
    80: 'Rain showers: Slight',
    81: 'Rain showers: Moderate',
    82: 'Rain showers: Violent',
    95: 'Thunderstorm: Slight or moderate',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };

  return {
    temp: data.current_weather.temperature,
    condition: weatherCodes[data.current_weather.weathercode] || 'Unknown',
    windSpeed: data.current_weather.windspeed,
    forecast: data.daily.time.map((time: string, index: number) => ({
      date: time,
      temp: data.daily.temperature_2m_max[index],
      condition: weatherCodes[data.daily.weathercode[index]] || 'Unknown',
    })),
  };
};
