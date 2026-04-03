import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const getCropRecommendation = async (data: {
  location: string;
  soilType: string;
  season: string;
  water: string;
}) => {
  const prompt = `As an expert agricultural scientist, recommend the best crops for a farmer in ${data.location} with ${data.soilType} soil during the ${data.season} season. Water availability is ${data.water}. 
  Provide the recommendation in JSON format with the following fields:
  - crop: string (name of the crop)
  - yield: string (expected yield per acre)
  - risk: string (Low, Medium, or High)
  - reasoning: string (brief explanation)`;

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

export const detectDisease = async (base64Image: string) => {
  const prompt = "Analyze this crop image and identify any diseases. Provide the disease name, confidence level, and suggested treatment in JSON format.";
  
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

export const getMarketPrediction = async (crop: string) => {
  const prompt = `Predict the market price trend for ${crop} for the next 3 months. Provide current price estimate, predicted price, and trend (up/down/stable) in JSON format.`;
  
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

export const chatWithAI = async (message: string, history: any[]) => {
  const chat = ai.chats.create({
    model: "gemini-3-flash-preview",
    config: {
      systemInstruction: "You are Farmex AI, a helpful agricultural assistant. You support English, Hindi, Telugu, and Marathi. Provide practical farming advice, weather-based tips, and crop management strategies.",
    },
  });

  const response = await chat.sendMessage({ message });
  return response.text;
};
