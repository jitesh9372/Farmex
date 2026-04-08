import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const getCropRecommendation = async (data: {
  location: string;
  soilType: string;
  season: string;
  water: string;
}, language: string = 'en') => {
  const prompt = `As an expert agricultural scientist, recommend the best crops for a farmer in ${data.location} with ${data.soilType} soil during the ${data.season} season. Water availability is ${data.water}. 
  Provide the recommendation in ${language} language.
  Provide the recommendation in JSON format with the following fields:
  - crop: string (name of the crop in ${language})
  - yield: string (expected yield per acre in ${language})
  - risk: string (Low, Medium, or High - in ${language})
  - reasoning: string (brief explanation in ${language})`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          crop: { type: Type.STRING },
          yield: { type: Type.STRING },
          risk: { type: Type.STRING },
          reasoning: { type: Type.STRING },
        },
        required: ["crop", "yield", "risk", "reasoning"],
      },
    },
  });

  return JSON.parse(response.text);
};

export const detectDisease = async (base64Image: string, language: string = 'en') => {
  const prompt = `Analyze this crop image and identify any diseases. Provide the disease name, confidence level, and suggested treatment in JSON format. 
  All text descriptions must be in ${language} language.`;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: {
      parts: [
        { text: prompt },
        { inlineData: { mimeType: "image/jpeg", data: base64Image } }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          disease: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          treatment: { type: Type.STRING },
        },
        required: ["disease", "confidence", "treatment"],
      },
    },
  });

  return JSON.parse(response.text);
};

export const getMarketPrediction = async (crop: string, language: string = 'en') => {
  const prompt = `Predict the market price trend for ${crop} for the next 3 months. Provide current price estimate, predicted price, and trend (up/down/stable) in JSON format. 
  All text descriptions must be in ${language} language.`;
  
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          currentPrice: { type: Type.NUMBER },
          predictedPrice: { type: Type.NUMBER },
          trend: { type: Type.STRING },
          unit: { type: Type.STRING },
        },
        required: ["currentPrice", "predictedPrice", "trend", "unit"],
      },
    },
  });

  return JSON.parse(response.text);
};

export const chatWithAI = async (message: string, history: { role: 'user' | 'ai'; text: string }[], language: string = 'en') => {
  const geminiHistory = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    history: geminiHistory,
    config: {
      systemInstruction: `You are Farmex AI, a helpful agricultural assistant. You support English, Hindi, and Marathi. Current user language is ${language}. Provide practical farming advice, weather-based tips, and crop management strategies in ${language}. Keep responses concise and helpful.`,
    },
  });

  const response = await chat.sendMessage({ message });
  return response.text;
};

export const getSmartSchedule = async (location: string, weather: any, farmingType: string, month: string, language: string = 'en') => {
  const prompt = `As an expert agricultural planner, generate a 7-day farming task schedule for a farmer in ${location}. 
  Farming Type: ${farmingType}
  Month: ${month}
  Current weather is ${weather?.temp}°C, ${weather?.condition}.
  Provide the schedule in ${language} language.
  Return an array of tasks in JSON format with the following fields:
  - title: string (task name in ${language})
  - date: string (ISO date YYYY-MM-DD)
  - type: string (Irrigation, Sowing, Fertilizing, Harvesting, Pest Control, etc. in ${language})
  - reasoning: string (brief explanation in ${language})`;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            date: { type: Type.STRING },
            type: { type: Type.STRING },
            reasoning: { type: Type.STRING },
          },
          required: ["title", "date", "type", "reasoning"],
        },
      },
    },
  });

  return JSON.parse(response.text);
};
