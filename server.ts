import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "farmex-secret-key";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "AIzaSyBLVwV7AhyB0k_On9lk-GA41nCAgDrq_f8";

if (!process.env.GEMINI_API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY is not set in environment. Using hardcoded fallback.");
}

const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Helper for fetch with retry and timeout
async function fetchWithRetry(url: string, options: any = {}, retries = 3, backoff = 1000) {
  const timeout = options.timeout || 15000;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const fetchOptions = {
    ...options,
    signal: controller.signal,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'application/json',
      ...options.headers
    }
  };

  try {
    const response = await fetch(url, fetchOptions);
    clearTimeout(id);
    
    if (!response.ok && retries > 0 && response.status >= 500) {
      console.log(`Fetch failed with status ${response.status}, retrying in ${backoff}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    
    return response;
  } catch (err: any) {
    clearTimeout(id);
    if (retries > 0 && (err.name === 'AbortError' || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT' || err.message.includes('ECONNRESET'))) {
      console.log(`Fetch failed (${err.message}), retrying in ${backoff}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw err;
  }
}

// Mock user store
const users: any[] = [];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      message: "Farmex API is running",
      aiConfigured: !!GEMINI_API_KEY,
      marketConfigured: !!process.env.GOV_DATA_API_KEY,
      env: process.env.NODE_ENV
    });
  });

  app.get("/api/test-ai", async (req, res) => {
    try {
      if (!GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY is not configured" });
      }
      const result = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: "Say 'AI is working'"
      });
      res.json({ message: result.text });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Auth Routes
  app.post("/api/auth/signup", (req, res) => {
    const { email, password, name } = req.body;
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ message: "User already exists" });
    }
    const newUser = { id: Date.now().toString(), email, password, name };
    users.push(newUser);
    
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET);
    res.cookie("token", token, { 
      httpOnly: true, 
      secure: true, 
      sameSite: "none" 
    });
    res.json({ user: { id: newUser.id, email: newUser.email, name: newUser.name } });
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET);
    res.cookie("token", token, { 
      httpOnly: true, 
      secure: true, 
      sameSite: "none" 
    });
    res.json({ user: { id: user.id, email: user.email, name: user.name } });
  });

  app.get("/api/auth/me", (req, res) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ message: "Not authenticated" });
    
    try {
      const decoded: any = jwt.verify(token, JWT_SECRET);
      const user = users.find(u => u.id === decoded.userId);
      if (!user) return res.status(401).json({ message: "User not found" });
      res.json({ user: { id: user.id, email: user.email, name: user.name } });
    } catch (err) {
      res.status(401).json({ message: "Invalid token" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.clearCookie("token", { secure: true, sameSite: "none" });
    res.json({ message: "Logged out" });
  });

  // AI Routes
  app.post("/api/ai/crop-recommendation", async (req, res) => {
    try {
      const { location, soilType, season, water, language } = req.body;
      console.log(`AI Crop Recommendation request: ${location}, ${soilType}, ${season}, ${water}, ${language}`);
      
      const prompt = `As an expert agricultural scientist, recommend the best crops for a farmer in ${location} with ${soilType} soil during the ${season} season. Water availability is ${water}. 
      Provide the recommendation in ${language} language.
      Provide the recommendation in JSON format with the following fields:
      - crop: string (name of the crop in ${language})
      - yield: string (expected yield per acre in ${language})
      - risk: string (Low, Medium, or High - in ${language})
      - reasoning: string (brief explanation in ${language})`;

      const result = await ai.models.generateContent({
        model: "gemini-1.5-flash",
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

      res.json(JSON.parse(result.text));
    } catch (error: any) {
      console.error("Crop AI Error:", error);
      res.status(500).json({ message: "AI recommendation failed", error: error.message });
    }
  });

  app.post("/api/ai/detect-disease", async (req, res) => {
    try {
      const { image, language } = req.body;
      console.log(`AI Disease Detection request for language: ${language}`);
      
      const prompt = `Analyze this crop image and identify any diseases. Provide the disease name, confidence level (0-1), and suggested treatment in JSON format. 
      All text descriptions must be in ${language} language.`;

      const result = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [
          prompt,
          { inlineData: { mimeType: "image/jpeg", data: image } }
        ],
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

      res.json(JSON.parse(result.text));
    } catch (error: any) {
      console.error("Disease AI Error:", error);
      res.status(500).json({ message: "AI disease detection failed", error: error.message });
    }
  });

  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, history, language } = req.body;
      console.log(`AI Chat request: ${message.substring(0, 20)}...`);
      
      const chat = ai.chats.create({
        model: "gemini-1.5-flash",
        history: history.map((msg: any) => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.text }]
        })),
        config: {
          systemInstruction: `You are Farmex AI, a helpful agricultural assistant. You support English, Hindi, and Marathi. Current user language is ${language}. Provide practical farming advice, weather-based tips, and crop management strategies in ${language}. Keep responses concise and helpful.`,
        },
      });

      const result = await chat.sendMessage({ message });
      res.json({ text: result.text });
    } catch (error: any) {
      console.error("Chat AI Error:", error);
      res.status(500).json({ message: "AI chat failed", error: error.message });
    }
  });

  app.post("/api/ai/smart-schedule", async (req, res) => {
    try {
      const { location, weather, farmingType, month, language } = req.body;
      console.log(`AI Smart Schedule request: ${location}, ${farmingType}, ${month}, ${language}`);
      
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

      const result = await ai.models.generateContent({
        model: "gemini-1.5-flash",
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

      res.json(JSON.parse(result.text));
    } catch (error: any) {
      console.error("Schedule AI Error:", error);
      res.status(500).json({ message: "AI schedule generation failed", error: error.message });
    }
  });

  // Market Search API using data.gov.in
  app.get("/api/market/search", async (req, res) => {
    const { commodity, market } = req.query;
    const apiKey = process.env.GOV_DATA_API_KEY || "579b464db66ec23bdd000001eac8f65e4d6f4218622c815bd43eb942";
    const resourceId = "5d1497a5-b862-4f30-81f3-7a771bca7a6b";
    
    console.log(`Using API Key: ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}`);
    
    let url = `https://api.data.gov.in/resource/${resourceId}?api-key=${apiKey}&format=json&limit=100`;
    
    // Helper to capitalize words (Mandi data is usually Title Case)
    const capitalize = (str: string) => str.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');

    // Add filters if provided
    if (commodity) {
      const capitalizedCommodity = capitalize(commodity as string);
      url += `&filters[commodity]=${encodeURIComponent(capitalizedCommodity)}`;
    }
    if (market) {
      const capitalizedMarket = capitalize(market as string);
      url += `&filters[market]=${encodeURIComponent(capitalizedMarket)}`;
    }

    try {
      console.log(`Fetching market data: ${url}`);
      let response = await fetchWithRetry(url, { timeout: 15000 });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Market API returned error ${response.status}: ${errorText.substring(0, 100)}`);
        return res.status(response.status).json({ message: `Market API error: ${response.status}` });
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error(`Market API returned non-JSON response: ${text.substring(0, 100)}`);
        return res.status(500).json({ message: "Market API returned invalid format" });
      }

      let data: any = await response.json();
      
      // Fallback: If no results with both filters, try searching with only commodity
      if ((!data.records || data.records.length === 0) && commodity && market) {
        console.log("No results with both filters, trying commodity only...");
        const capitalizedCommodity = capitalize(commodity as string);
        const broaderUrl = `https://api.data.gov.in/resource/${resourceId}?api-key=${apiKey}&format=json&limit=100&filters[commodity]=${encodeURIComponent(capitalizedCommodity)}`;
        response = await fetchWithRetry(broaderUrl, { timeout: 15000 });
        
        if (response.ok) {
          const broaderData = await response.json();
          data = broaderData;
        }
      }

      if (data.records && data.records.length > 0) {
        const results = data.records.map((record: any) => ({
          commodity: record.commodity,
          market: record.market,
          district: record.district,
          state: record.state,
          price: record.modal_price,
          minPrice: record.min_price,
          maxPrice: record.max_price,
          date: record.arrival_date,
          unit: "Quintal"
        }));
        res.json(results);
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error("Market API Error:", error);
      res.status(500).json({ message: "Failed to fetch market data" });
    }
  });

  // Google OAuth Routes (Mock for now, as it requires real credentials)
  app.get("/api/auth/google/url", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID || "MOCK_CLIENT_ID";
    const redirectUri = `${req.protocol}://${req.get('host')}/api/auth/google/callback`;
    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=email%20profile`;
    res.json({ url });
  });

  app.get("/api/auth/google/callback", (req, res) => {
    // In a real app, you'd exchange the code for tokens and get user info
    // For this demo, we'll just mock a successful login
    const mockUser = { id: "google-" + Date.now(), email: "google-user@example.com", name: "Google User" };
    if (!users.find(u => u.email === mockUser.email)) {
      users.push(mockUser);
    }
    
    const token = jwt.sign({ userId: mockUser.id }, JWT_SECRET);
    res.cookie("token", token, { 
      httpOnly: true, 
      secure: true, 
      sameSite: "none" 
    });

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV}`);
    console.log(`AI Configured: ${!!GEMINI_API_KEY}`);
  });
}

startServer().catch(err => {
  console.error("FAILED TO START SERVER:", err);
  process.exit(1);
});
