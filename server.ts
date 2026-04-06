import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "farmex-secret-key";

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
    res.json({ status: "ok", message: "Farmex API is running" });
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
      let data: any = await response.json();
      
      // Fallback: If no results with both filters, try searching with only commodity
      if ((!data.records || data.records.length === 0) && commodity && market) {
        console.log("No results with both filters, trying commodity only...");
        const capitalizedCommodity = capitalize(commodity as string);
        const broaderUrl = `https://api.data.gov.in/resource/${resourceId}?api-key=${apiKey}&format=json&limit=100&filters[commodity]=${encodeURIComponent(capitalizedCommodity)}`;
        response = await fetchWithRetry(broaderUrl, { timeout: 15000 });
        data = await response.json();
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
  });
}

startServer();
