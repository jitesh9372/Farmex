import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  Sprout, 
  Droplets, 
  Camera, 
  TrendingUp, 
  MessageSquare, 
  Calendar, 
  AlertTriangle, 
  BookOpen, 
  Menu, 
  X, 
  Mic, 
  MapPin,
  ChevronRight,
  CheckCircle2,
  Thermometer,
  Wind,
  Plus,
  Languages,
  Zap,
  Bot,
  Send,
  User,
  ArrowRight,
  Bell,
  LogOut,
  Search,
  Loader2,
  Trash2,
  CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchWeather } from './services/weatherService';
import { getCropRecommendation, detectDisease, chatWithAI, getMarketPrediction, getSmartSchedule } from './services/geminiService';
import { SOIL_TYPES, SEASONS, WATER_AVAILABILITY } from './constants';
import type { WeatherData, CropRecommendation, FarmingTask, RiskAlert, User as UserType, MarketSearchResult } from './types';
import { translations, type Language } from './translations';
import Login from './components/Login';
import { supabase } from './supabaseClient';

export default function App() {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('farmex_lang');
    return (saved as Language) || 'en';
  });
  const t = translations[language];

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<UserType | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'
        });
      }
      setIsAuthChecking(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User'
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  useEffect(() => {
    localStorage.setItem('farmex_lang', language);
  }, [language]);

  // Tab States (Lifted to fix Hook violations)
  const [cropFormData, setCropFormData] = useState({ location: 'Nagpur', soilType: 'Black', season: 'Rabi (Winter)', water: 'Medium' });
  const [cropResult, setCropResult] = useState<CropRecommendation | null>(null);
  const [diseaseImage, setDiseaseImage] = useState<string | null>(null);
  const [diseaseResult, setDiseaseResult] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);

  // Market States
  const [marketSearchQuery, setMarketSearchQuery] = useState('');
  const [commoditySearchQuery, setCommoditySearchQuery] = useState('');
  const [marketResults, setMarketResults] = useState<MarketSearchResult[]>([]);
  const [isMarketLoading, setIsMarketLoading] = useState(false);
  const [marketError, setMarketError] = useState<string | null>(null);

  const handleMarketSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsMarketLoading(true);
    setMarketError(null);
    try {
      const params = new URLSearchParams();
      if (commoditySearchQuery) params.append('commodity', commoditySearchQuery);
      if (marketSearchQuery) params.append('market', marketSearchQuery);
      
      const response = await fetch(`/api/market/search?${params.toString()}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch market data');
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setMarketResults(data);
      } else {
        setMarketResults([]);
      }
    } catch (error: any) {
      console.error('Market search error:', error);
      setMarketError(error.message || 'Failed to fetch market data. Please try again later.');
      setMarketResults([]);
    } finally {
      setIsMarketLoading(false);
    }
  };

  // Initial market fetch
  useEffect(() => {
    if (activeTab === 'market' && marketResults.length === 0) {
      handleMarketSearch();
    }
  }, [activeTab]);

  // Mock data for initial state
  const [tasks, setTasks] = useState<FarmingTask[]>(() => {
    const saved = localStorage.getItem('farmex_tasks');
    return saved ? JSON.parse(saved) : [
      { id: '1', title: 'Sowing Wheat', date: '2026-04-05', type: 'Sowing', completed: false },
      { id: '2', title: 'Irrigation for Rice', date: '2026-04-02', type: 'Irrigation', completed: true },
    ];
  });

  const [alerts, setAlerts] = useState<RiskAlert[]>(() => {
    const saved = localStorage.getItem('farmex_alerts');
    return saved ? JSON.parse(saved) : [
      { type: 'Drought', level: 'Medium', message: 'Low rainfall expected next week.', action: 'Plan irrigation schedule.' },
      { type: 'Pest', level: 'High', message: 'Locust swarm reported in nearby region.', action: 'Apply preventive pesticide.' },
    ];
  });

  // Calendar States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isSmartPlanningModalOpen, setIsSmartPlanningModalOpen] = useState(false);
  const [isSmartPlanningLoading, setIsSmartPlanningLoading] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', date: new Date().toISOString().split('T')[0], type: 'Irrigation' });
  const [smartPlanningInput, setSmartPlanningInput] = useState({ 
    farmingType: 'Traditional', 
    month: new Date().toLocaleString('en-US', { month: 'long' }) 
  });

  const addTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    const task: FarmingTask = {
      id: Math.random().toString(36).substr(2, 9),
      title: newTask.title,
      date: newTask.date,
      type: newTask.type,
      completed: false
    };
    setTasks([task, ...tasks]);
    setNewTask({ title: '', date: new Date().toISOString().split('T')[0], type: 'Irrigation' });
    setIsTaskModalOpen(false);
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const generateSmartSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSmartPlanningLoading(true);
    try {
      const locationName = weather?.locationName || 'Nagpur';
      const schedule = await getSmartSchedule(
        locationName, 
        weather, 
        smartPlanningInput.farmingType, 
        smartPlanningInput.month, 
        language
      );
      const newTasks: FarmingTask[] = schedule.map((s: any) => ({
        id: Math.random().toString(36).substr(2, 9),
        title: s.title,
        date: s.date,
        type: s.type,
        completed: false
      }));
      setTasks([...newTasks, ...tasks]);
      setIsSmartPlanningModalOpen(false);
    } catch (err) {
      console.error('Smart planning error:', err);
    } finally {
      setIsSmartPlanningLoading(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('farmex_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('farmex_alerts', JSON.stringify(alerts));
  }, [alerts]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        () => {
          // Fallback to a default location (e.g., Nagpur, India)
          setLocation({ lat: 21.1458, lon: 79.0882 });
        }
      );
    } else {
      // Fallback if geolocation is not supported
      setLocation({ lat: 21.1458, lon: 79.0882 });
    }
  }, []);

  useEffect(() => {
    if (location) {
      fetchWeather(location.lat, location.lon)
        .then(data => {
          setWeather(data);
          // Update crop form location if it's still default
          if (cropFormData.location === 'Nagpur') {
            setCropFormData(prev => ({ ...prev, location: data.locationName }));
          }
        })
        .catch(err => {
          console.error('Weather fetch error:', err);
        });
    }
  }, [location]);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Weather Card */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-sm text-gray-500 font-medium">{t.dashboard.currentWeather}</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-bold text-gray-900">{weather?.temp}°</h2>
              <span className="text-lg text-gray-400">C</span>
            </div>
            <p className="text-gray-600 mt-1 flex items-center gap-2">
              <Cloud className="w-5 h-5 text-blue-400" /> {weather?.condition}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-right">
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t.dashboard.humidity}</p>
              <p className="font-bold text-gray-700">{weather?.humidity || 65}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">{t.dashboard.wind}</p>
              <p className="font-bold text-gray-700">{weather?.windSpeed} km/h</p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {weather?.forecast.slice(1, 6).map((day, i) => (
            <div key={i} className="bg-gray-50 p-3 rounded-2xl min-w-[80px] text-center border border-gray-100">
              <p className="text-xs text-gray-500 font-medium mb-1">{new Date(day.date).toLocaleDateString(language === 'en' ? 'en-US' : language === 'hi' ? 'hi-IN' : 'mr-IN', { weekday: 'short' })}</p>
              <p className="text-lg font-bold text-gray-800">{day.temp}°</p>
              <Cloud className="w-5 h-5 mx-auto text-blue-300" />
            </div>
          ))}
        </div>
      </div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alerts.map((alert, i) => (
          <div key={i} className={`p-4 rounded-2xl border-l-4 flex gap-4 ${
            alert.level === 'High' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-orange-50 border-orange-500 text-orange-700'
          }`}>
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <div>
              <h3 className="font-bold">{alert.type === 'Drought' ? t.dashboard.droughtAlert : t.dashboard.pestAlert}</h3>
              <p className="text-sm opacity-80">{alert.message}</p>
              <p className="text-xs font-semibold mt-2 uppercase tracking-wider">{t.dashboard.action}: {alert.action}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Recommendations */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" /> {t.dashboard.dailyRecs}
        </h3>
        <div className="space-y-4">
          <div className="flex gap-4 items-start p-3 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 shrink-0">
              <Droplets className="w-5 h-5" />
            </div>
            <p className="text-sm text-gray-600">{t.dashboard.waterRec}</p>
          </div>
          <div className="flex gap-4 items-start p-3 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-sm text-gray-600">{t.dashboard.marketRec}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCropRecommendation = () => {
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      try {
        const res = await getCropRecommendation(cropFormData, language);
        setCropResult(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-6">{t.crop.title}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 ml-1">{t.crop.location}</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    value={cropFormData.location}
                    onChange={e => setCropFormData({...cropFormData, location: e.target.value})}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                    placeholder={t.crop.placeholder}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 ml-1">{t.crop.soilType}</label>
                <select 
                  value={cropFormData.soilType}
                  onChange={e => setCropFormData({...cropFormData, soilType: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all appearance-none bg-white"
                >
                  {SOIL_TYPES.map(s => <option key={s} value={s}>{(t.constants.soilTypes as any)[s] || s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 ml-1">{t.crop.season}</label>
                <select 
                  value={cropFormData.season}
                  onChange={e => setCropFormData({...cropFormData, season: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all appearance-none bg-white"
                >
                  {SEASONS.map(s => <option key={s} value={s}>{(t.constants.seasons as any)[s] || s}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 ml-1">{t.crop.water}</label>
                <select 
                  value={cropFormData.water}
                  onChange={e => setCropFormData({...cropFormData, water: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all appearance-none bg-white"
                >
                  {WATER_AVAILABILITY.map(w => <option key={w} value={w}>{(t.constants.waterAvailability as any)[w] || w}</option>)}
                </select>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
              {loading ? t.crop.analyzing : t.crop.submit}
            </button>
          </form>
        </div>

        {cropResult && (
          <div className="bg-green-50 p-6 rounded-3xl border border-green-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-2xl font-bold text-green-800">{cropResult.crop}</h3>
                <p className="text-sm text-green-600 font-medium mt-1">{t.crop.yield}: {cropResult.yield}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                cropResult.risk === 'Low' ? 'bg-green-200 text-green-800' : 
                cropResult.risk === 'Medium' ? 'bg-orange-200 text-orange-800' : 'bg-red-200 text-red-800'
              }`}>
                {cropResult.risk} {t.crop.risk}
              </span>
            </div>
            <p className="text-gray-700 leading-relaxed">{cropResult.reasoning}</p>
          </div>
        )}
      </div>
    );
  };

  const renderDiseaseDetection = () => {
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          setDiseaseImage(reader.result as string);
          analyzeImage(base64);
        };
        reader.readAsDataURL(file);
      }
    };

    const analyzeImage = async (base64: string) => {
      setLoading(true);
      try {
        const res = await detectDisease(base64, language);
        setDiseaseResult(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t.disease.title}</h2>
          <p className="text-sm text-gray-500 mb-8">{t.disease.subtitle}</p>
          
          <div className="relative group max-w-xs mx-auto">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className={`w-full aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all ${
              diseaseImage ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-gray-50 group-hover:border-green-400 group-hover:bg-green-50/50'
            }`}>
              {diseaseImage ? (
                <img src={diseaseImage} alt="Crop" className="w-full h-full object-cover rounded-3xl" />
              ) : (
                <>
                  <Camera className="w-12 h-12 text-gray-400" />
                  <p className="text-sm font-medium text-gray-500">{t.disease.upload}</p>
                </>
              )}
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-12 h-12 border-4 border-green-100 border-t-green-600 rounded-full animate-spin" />
            <p className="text-green-600 font-bold animate-pulse">{t.disease.analyzing}</p>
          </div>
        )}

        {diseaseResult && (
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{diseaseResult.disease}</h3>
                <p className="text-xs text-gray-500 font-medium">Confidence: {(diseaseResult.confidence * 100).toFixed(1)}%</p>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-2xl border border-green-100">
              <h4 className="font-bold text-green-800 mb-1">{t.disease.treatment}</h4>
              <p className="text-sm text-green-700 leading-relaxed">{diseaseResult.treatment}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderChat = () => {
    const handleSend = async () => {
      if (!chatMessage.trim()) return;
      const userMsg = chatMessage;
      setChatMessage('');
      setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
      
      setLoading(true);
      try {
        const aiRes = await chatWithAI(userMsg, chatHistory, language);
        setChatHistory(prev => [...prev, { role: 'ai', text: aiRes }]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="flex flex-col h-[calc(100vh-200px)]">
        <div className="flex-1 overflow-y-auto space-y-4 pb-4 scrollbar-hide">
          {chatHistory.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 mx-auto mb-4">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">{t.chat.title}</h3>
              <p className="text-sm text-gray-500 max-w-xs mx-auto">{t.chat.subtitle}</p>
            </div>
          )}
          {chatHistory.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${
                msg.role === 'user' 
                  ? 'bg-green-600 text-white rounded-br-none' 
                  : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none shadow-sm'
              }`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-bl-none shadow-sm flex gap-1">
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-100"></div>
                <div className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          )}
        </div>
        
        <div className="pt-4 flex gap-2">
          <input 
            type="text" 
            value={chatMessage}
            onChange={e => setChatMessage(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            placeholder={t.chat.placeholder}
            className="flex-1 p-4 rounded-2xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
          />
          <button 
            onClick={handleSend}
            disabled={loading || !chatMessage.trim()}
            className="p-4 bg-green-600 text-white rounded-2xl shadow-lg shadow-green-200 disabled:opacity-50 transition-all active:scale-95"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  };

  const renderMarket = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{t.market.title}</h2>
            <p className="text-sm text-gray-500">{t.market.subtitle}</p>
          </div>
        </div>

        <form onSubmit={handleMarketSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t.market.searchCommodity}
              value={commoditySearchQuery}
              onChange={(e) => setCommoditySearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-green-500 focus:bg-white transition-all outline-none text-sm"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t.market.searchMarket}
              value={marketSearchQuery}
              onChange={(e) => setMarketSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-green-500 focus:bg-white transition-all outline-none text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={isMarketLoading}
            className="bg-green-600 text-white font-bold py-3 px-6 rounded-2xl hover:bg-green-700 transition-all shadow-lg shadow-green-100 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isMarketLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            {t.market.searchButton}
          </button>
        </form>

        {isMarketLoading ? (
          <div className="py-20 text-center">
            <Loader2 className="w-10 h-10 text-green-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-500 font-medium">{t.market.fetching}</p>
          </div>
        ) : marketError ? (
          <div className="py-20 text-center bg-red-50 rounded-3xl border border-dashed border-red-200">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-red-600 font-medium">{marketError}</p>
            <button 
              onClick={() => handleMarketSearch()}
              className="mt-4 text-sm font-bold text-red-700 hover:text-red-800 underline"
            >
              Try Again
            </button>
          </div>
        ) : marketResults.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {marketResults.map((result, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-green-200 transition-all group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">{result.commodity}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {result.market}, {result.district}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">₹{result.price}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Per {result.unit}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-200/50">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Range</p>
                    <p className="text-xs font-medium text-gray-600">₹{result.minPrice} - ₹{result.maxPrice}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Arrival Date</p>
                    <p className="text-xs font-medium text-gray-600">{result.date}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-20 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <Search className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">{t.market.noResults}</p>
          </div>
        )}
      </div>

      {/* Market Trends Info */}
      <div className="bg-green-600 p-6 rounded-3xl text-white shadow-xl shadow-green-100 relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-lg font-bold mb-2">{t.market.insights}</h3>
          <p className="text-green-50/80 text-sm max-w-md">
            {t.market.insightsDesc}
          </p>
        </div>
        <TrendingUp className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10" />
      </div>
    </div>
  );

  const renderCalendar = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">{t.calendar.title}</h2>
          <button 
            onClick={() => setIsTaskModalOpen(true)}
            className="p-2 bg-green-50 text-green-600 rounded-xl hover:bg-green-100 transition-colors"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
        
        <div className="space-y-3">
          {tasks.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No tasks scheduled yet.</p>
            </div>
          ) : (
            tasks.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((task) => (
              <div key={task.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 group">
                <button 
                  onClick={() => toggleTask(task.id)}
                  className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                    task.completed ? 'bg-green-600 text-white' : 'bg-white border-2 border-gray-200 text-transparent'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <div className="flex-1">
                  <h4 className={`font-bold text-sm ${task.completed ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{task.title}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{new Date(task.date).toLocaleDateString(language === 'en' ? 'en-US' : language === 'hi' ? 'hi-IN' : 'mr-IN', { month: 'short', day: 'numeric' })}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{task.type}</span>
                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="bg-green-600 p-6 rounded-3xl text-white shadow-lg shadow-green-200">
        <h3 className="font-bold mb-2">{t.calendar.smartPlanning}</h3>
        <p className="text-sm text-green-50/80 mb-4">{t.calendar.smartPlanningDesc}</p>
        <button 
          onClick={() => setIsSmartPlanningModalOpen(true)}
          className="w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
        >
          <Zap className="w-4 h-4" />
          {t.calendar.updateSchedule}
        </button>
      </div>

      {/* Smart Planning Input Modal */}
      <AnimatePresence>
        {isSmartPlanningModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSmartPlanningModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Smart Planning</h3>
                <button onClick={() => setIsSmartPlanningModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={generateSmartSchedule} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 ml-1">Type of Farming</label>
                  <select 
                    value={smartPlanningInput.farmingType}
                    onChange={e => setSmartPlanningInput({...smartPlanningInput, farmingType: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all appearance-none bg-white"
                  >
                    <option value="Traditional">Traditional Farming</option>
                    <option value="Organic">Organic Farming</option>
                    <option value="Hydroponic">Hydroponic Farming</option>
                    <option value="Subsistence">Subsistence Farming</option>
                    <option value="Commercial">Commercial Farming</option>
                    <option value="Intensive">Intensive Farming</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 ml-1">Current Month</label>
                  <select 
                    value={smartPlanningInput.month}
                    onChange={e => setSmartPlanningInput({...smartPlanningInput, month: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all appearance-none bg-white"
                  >
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <button 
                  type="submit" 
                  disabled={isSmartPlanningLoading}
                  className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-all mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSmartPlanningLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                  {isSmartPlanningLoading ? 'Generating...' : 'Generate Schedule'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Task Modal */}
      <AnimatePresence>
        {isTaskModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsTaskModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Add New Task</h3>
                <button onClick={() => setIsTaskModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={addTask} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-700 ml-1">Task Title</label>
                  <input 
                    type="text" 
                    required
                    value={newTask.title}
                    onChange={e => setNewTask({...newTask, title: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                    placeholder="e.g., Water the wheat field"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 ml-1">Date</label>
                    <input 
                      type="date" 
                      required
                      value={newTask.date}
                      onChange={e => setNewTask({...newTask, date: e.target.value})}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 ml-1">Type</label>
                    <select 
                      value={newTask.type}
                      onChange={e => setNewTask({...newTask, type: e.target.value})}
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 outline-none transition-all appearance-none bg-white"
                    >
                      <option value="Irrigation">Irrigation</option>
                      <option value="Sowing">Sowing</option>
                      <option value="Fertilizing">Fertilizing</option>
                      <option value="Harvesting">Harvesting</option>
                      <option value="Pest Control">Pest Control</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition-all mt-4"
                >
                  Add Task
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  const tabs = [
    { id: 'dashboard', label: t.tabs.dashboard, icon: Cloud },
    { id: 'crop', label: t.tabs.crop, icon: Sprout },
    { id: 'disease', label: t.tabs.disease, icon: Camera },
    { id: 'chat', label: t.tabs.chat, icon: MessageSquare },
    { id: 'calendar', label: t.tabs.calendar, icon: Calendar },
    { id: 'market', label: t.tabs.market, icon: TrendingUp },
  ];

  if (isAuthChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={setUser} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20 lg:pb-0">
      {/* Sidebar / Mobile Menu */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSidebarOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.div 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="fixed inset-y-0 left-0 w-72 bg-white z-50 shadow-2xl lg:hidden p-6"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white">
                    <Sprout className="w-6 h-6" />
                  </div>
                  <h1 className="text-2xl font-black text-green-600 tracking-tighter">{t.appName}</h1>
                </div>
                <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="space-y-2">
                {tabs.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${
                      activeTab === tab.id ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-green-50 hover:text-green-600'
                    }`}
                  >
                    <tab.icon className="w-6 h-6" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-72 bg-white border-r border-gray-100 flex-col p-6">
        <div className="flex items-center gap-3 mb-12">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-100">
            <Sprout className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-green-600 tracking-tighter">{t.appName}</h1>
        </div>
        <nav className="space-y-2 flex-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-green-600 text-white shadow-lg shadow-green-200' 
                  : 'text-gray-500 hover:bg-green-50 hover:text-green-600'
              }`}
            >
              <tab.icon className="w-6 h-6" />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{user.name}</p>
                <p className="text-xs text-green-600 font-medium">{t.premiumFarmer}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100 p-4 lg:p-6">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <Menu className="w-6 h-6" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900 capitalize tracking-tight">
                  {tabs.find(tab => tab.id === activeTab)?.label}
                </h2>
                <p className="text-xs text-gray-500 flex items-center gap-1 font-medium">
                  <MapPin className="w-3 h-3" /> {weather?.locationName || t.locationFallback}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Language Switcher */}
              <div className="hidden md:flex items-center gap-2 mr-4">
                {(['en', 'hi', 'mr'] as Language[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                      language === lang 
                        ? 'bg-green-600 text-white border-transparent shadow-lg shadow-green-100' 
                        : 'bg-white text-gray-500 border-gray-200 hover:border-green-500 hover:text-green-500'
                    }`}
                  >
                    {lang === 'en' ? 'English' : lang === 'hi' ? 'हिंदी' : 'मराठी'}
                  </button>
                ))}
              </div>

              <button className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center text-gray-400 hover:text-green-600 transition-all">
                <Bell className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Tab Content */}
        <div className="flex-1 p-4 lg:p-8 max-w-5xl mx-auto w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'dashboard' && renderDashboard()}
              {activeTab === 'crop' && renderCropRecommendation()}
              {activeTab === 'disease' && renderDiseaseDetection()}
              {activeTab === 'chat' && renderChat()}
              {activeTab === 'calendar' && renderCalendar()}
              {activeTab === 'market' && renderMarket()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 px-4 py-2 flex justify-between items-center z-40">
        {tabs.slice(0, 5).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              activeTab === tab.id ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            <tab.icon className={`w-6 h-6 ${activeTab === tab.id ? 'scale-110' : ''}`} />
            <span className="text-[10px] font-bold uppercase tracking-tighter">{tab.label.split(' ')[0]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
