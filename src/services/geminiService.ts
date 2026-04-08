// Gemini AI Service - Proxied through server for security
export const getCropRecommendation = async (data: {
  location: string;
  soilType: string;
  season: string;
  water: string;
}, language: string = 'en') => {
  const response = await fetch('/api/ai/crop-recommendation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, language }),
  });
  if (!response.ok) throw new Error('Failed to get crop recommendation');
  return response.json();
};

export const detectDisease = async (base64Image: string, language: string = 'en') => {
  const response = await fetch('/api/ai/detect-disease', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64Image, language }),
  });
  if (!response.ok) throw new Error('Failed to detect disease');
  return response.json();
};

export const chatWithAI = async (message: string, history: { role: 'user' | 'ai'; text: string }[], language: string = 'en') => {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, history, language }),
  });
  if (!response.ok) throw new Error('Failed to chat with AI');
  const data = await response.json();
  return data.text;
};

export const getSmartSchedule = async (location: string, weather: any, farmingType: string, month: string, language: string = 'en') => {
  const response = await fetch('/api/ai/smart-schedule', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location, weather, farmingType, month, language }),
  });
  if (!response.ok) throw new Error('Failed to generate smart schedule');
  return response.json();
};

export const getMarketPrediction = async (crop: string, language: string = 'en') => {
  // This was used in a previous version, keeping it for compatibility if needed
  // but most logic is now in the market search API
  return { currentPrice: 0, predictedPrice: 0, trend: 'stable', unit: 'Quintal' };
};
