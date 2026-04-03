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
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchWeather } from './services/weatherService';
import { getCropRecommendation, detectDisease, chatWithAI, getMarketPrediction } from './services/geminiService';
import { SOIL_TYPES, SEASONS, WATER_AVAILABILITY } from './constants';
import type { WeatherData, CropRecommendation, FarmingTask, RiskAlert } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [loading, setLoading] = useState(false);

  // Tab States (Lifted to fix Hook violations)
  const [cropFormData, setCropFormData] = useState({ location: 'Nagpur', soilType: 'Black', season: 'Rabi (Winter)', water: 'Medium' });
  const [cropResult, setCropResult] = useState<CropRecommendation | null>(null);
  const [diseaseImage, setDiseaseImage] = useState<string | null>(null);
  const [diseaseResult, setDiseaseResult] = useState<any>(null);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);

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
    }
  }, []);

  useEffect(() => {
    if (location) {
      fetchWeather(location.lat, location.lon).then(setWeather);
    }
  }, [location]);

  const toggleTask = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Weather Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-green-600 to-green-800 text-white p-6 rounded-3xl shadow-xl overflow-hidden relative"
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-green-100 font-medium">Current Weather</p>
            <h2 className="text-5xl font-bold mt-1">{weather?.temp}°C</h2>
            <p className="text-xl mt-2 flex items-center gap-2">
              <Cloud className="w-6 h-6" /> {weather?.condition}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-4 text-green-100">
              <span className="flex items-center gap-1"><Droplets className="w-4 h-4" /> {weather?.humidity || 65}%</span>
              <span className="flex items-center gap-1"><Wind className="w-4 h-4" /> {weather?.windSpeed} km/h</span>
            </div>
          </div>
        </div>
        
        <div className="mt-8 flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {weather?.forecast.slice(1, 6).map((day, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-md p-3 rounded-2xl min-w-[80px] text-center">
              <p className="text-xs text-green-100">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
              <p className="font-bold my-1">{day.temp}°</p>
              <Cloud className="w-4 h-4 mx-auto opacity-70" />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Alerts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {alerts.map((alert, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`p-4 rounded-2xl border-l-4 flex gap-4 ${
              alert.level === 'High' ? 'bg-red-50 border-red-500' : 'bg-orange-50 border-orange-500'
            }`}
          >
            <div className={`p-2 rounded-xl h-fit ${alert.level === 'High' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">{alert.type} Alert</h3>
              <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
              <p className="text-xs font-semibold text-green-700 mt-2 uppercase tracking-wider">Action: {alert.action}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Recommendations */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Sprout className="w-6 h-6 text-green-600" /> Daily Recommendations
        </h3>
        <div className="space-y-4">
          <div className="flex gap-4 items-start p-3 hover:bg-green-50 rounded-2xl transition-colors">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 shrink-0">
              <Droplets className="w-5 h-5" />
            </div>
            <p className="text-gray-700">Best time to water your crops is between 6 AM and 8 AM tomorrow due to low evaporation.</p>
          </div>
          <div className="flex gap-4 items-start p-3 hover:bg-green-50 rounded-2xl transition-colors">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <p className="text-gray-700">Market prices for Wheat are expected to rise by 5% next week. Consider holding your harvest.</p>
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
        const res = await getCropRecommendation(cropFormData);
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
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Crop Recommendation</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Location</label>
                <input 
                  type="text" 
                  value={cropFormData.location}
                  onChange={e => setCropFormData({...cropFormData, location: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Enter your city/region"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Soil Type</label>
                <select 
                  value={cropFormData.soilType}
                  onChange={e => setCropFormData({...cropFormData, soilType: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                >
                  {SOIL_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Season</label>
                <select 
                  value={cropFormData.season}
                  onChange={e => setCropFormData({...cropFormData, season: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                >
                  {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Water Availability</label>
                <select 
                  value={cropFormData.water}
                  onChange={e => setCropFormData({...cropFormData, water: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                >
                  {WATER_AVAILABILITY.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Get Recommendation'}
            </button>
          </form>
        </div>

        {cropResult && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-green-50 p-6 rounded-3xl border border-green-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-3xl font-bold text-green-900">{cropResult.crop}</h3>
                <p className="text-green-700 font-medium mt-1">Expected Yield: {cropResult.yield}</p>
              </div>
              <div className={`px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider ${
                cropResult.risk === 'Low' ? 'bg-green-200 text-green-800' : 
                cropResult.risk === 'Medium' ? 'bg-orange-200 text-orange-800' : 'bg-red-200 text-red-800'
              }`}>
                {cropResult.risk} Risk
              </div>
            </div>
            <p className="text-gray-700 leading-relaxed">{cropResult.reasoning}</p>
          </motion.div>
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
        const res = await detectDisease(base64);
        setDiseaseResult(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Disease Detection</h2>
          <p className="text-gray-500 mb-8">Upload a clear photo of the affected crop part</p>
          
          <div className="relative group">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className={`w-full aspect-square max-w-sm mx-auto rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all ${
              diseaseImage ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-50 group-hover:border-green-400 group-hover:bg-green-50'
            }`}>
              {diseaseImage ? (
                <img src={diseaseImage} alt="Crop" className="w-full h-full object-cover rounded-3xl" />
              ) : (
                <>
                  <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center text-gray-400">
                    <Camera className="w-8 h-8" />
                  </div>
                  <p className="font-medium text-gray-600">Click to capture or upload</p>
                </>
              )}
            </div>
          </div>
        </div>

        {loading && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="w-12 h-12 border-4 border-green-200 border-t-green-600 rounded-full animate-spin"></div>
            <p className="text-green-700 font-medium">Analyzing with AI...</p>
          </div>
        )}

        {diseaseResult && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{diseaseResult.disease}</h3>
                <p className="text-sm text-gray-500">Confidence: {(diseaseResult.confidence * 100).toFixed(1)}%</p>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-2xl">
              <h4 className="font-bold text-green-900 mb-2">Suggested Treatment</h4>
              <p className="text-green-800 leading-relaxed">{diseaseResult.treatment}</p>
            </div>
          </motion.div>
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
        const aiRes = await chatWithAI(userMsg, chatHistory);
        setChatHistory(prev => [...prev, { role: 'ai', text: aiRes }]);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="flex flex-col h-[calc(100vh-180px)]">
        <div className="flex-1 overflow-y-auto space-y-4 pb-4 scrollbar-hide">
          {chatHistory.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-600 mx-auto mb-4">
                <MessageSquare className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">Farmex AI Assistant</h3>
              <p className="text-gray-500 mt-2">Ask anything about farming, crops, or weather.</p>
              <div className="mt-8 grid grid-cols-1 gap-2 max-w-xs mx-auto">
                <button onClick={() => setChatMessage('How to grow organic tomatoes?')} className="p-3 bg-white border border-gray-200 rounded-xl text-sm text-left hover:bg-green-50">"How to grow organic tomatoes?"</button>
                <button onClick={() => setChatMessage('Best fertilizer for rice?')} className="p-3 bg-white border border-gray-200 rounded-xl text-sm text-left hover:bg-green-50">"Best fertilizer for rice?"</button>
              </div>
            </div>
          )}
          {chatHistory.map((msg, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] p-4 rounded-3xl ${
                msg.role === 'user' ? 'bg-green-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none shadow-sm'
              }`}>
                {msg.text}
              </div>
            </motion.div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-100 p-4 rounded-3xl rounded-tl-none shadow-sm flex gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          )}
        </div>
        
        <div className="pt-4 flex gap-2">
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={chatMessage}
              onChange={e => setChatMessage(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              className="w-full p-4 pr-12 rounded-2xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
            />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-600">
              <Mic className="w-6 h-6" />
            </button>
          </div>
          <button 
            onClick={handleSend}
            disabled={loading || !chatMessage.trim()}
            className="p-4 bg-green-600 text-white rounded-2xl hover:bg-green-700 transition-colors disabled:opacity-50"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    );
  };

  const renderCalendar = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Farming Calendar</h2>
          <button className="p-2 bg-green-100 text-green-600 rounded-xl">
            <Plus className="w-6 h-6" />
          </button>
        </div>
        
        <div className="space-y-4">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors">
              <button 
                onClick={() => toggleTask(task.id)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  task.completed ? 'bg-green-600 text-white' : 'border-2 border-gray-200 text-transparent'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <h4 className={`font-bold ${task.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{task.title}</h4>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <Calendar className="w-4 h-4" /> {new Date(task.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
                task.type === 'Sowing' ? 'bg-blue-100 text-blue-600' :
                task.type === 'Irrigation' ? 'bg-cyan-100 text-cyan-600' : 'bg-orange-100 text-orange-600'
              }`}>
                {task.type}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-green-900 text-white p-6 rounded-3xl shadow-xl">
        <h3 className="text-xl font-bold mb-4">Smart Planning</h3>
        <p className="text-green-100 text-sm leading-relaxed">
          Based on current weather forecasts, we recommend moving your next irrigation session to Thursday morning to maximize water absorption.
        </p>
        <button className="mt-6 w-full py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold transition-colors">
          Update Schedule
        </button>
      </div>
    </div>
  );

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Cloud },
    { id: 'crop', label: 'Crops', icon: Sprout },
    { id: 'disease', label: 'Disease', icon: Camera },
    { id: 'chat', label: 'AI Chat', icon: MessageSquare },
    { id: 'calendar', label: 'Calendar', icon: Calendar },
    { id: 'market', label: 'Market', icon: TrendingUp },
  ];

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
                  <h1 className="text-2xl font-black text-green-600 tracking-tighter">FARMEX</h1>
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
        <div className="flex items-center gap-2 mb-12">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white">
            <Sprout className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-green-600 tracking-tighter">FARMEX</h1>
        </div>
        <nav className="space-y-2 flex-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${
                activeTab === tab.id ? 'bg-green-600 text-white shadow-lg shadow-green-200' : 'text-gray-500 hover:bg-green-50 hover:text-green-600'
              }`}
            >
              <tab.icon className="w-6 h-6" />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="mt-auto p-4 bg-green-50 rounded-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-200 rounded-full flex items-center justify-center text-green-700 font-bold">JK</div>
            <div>
              <p className="text-sm font-bold text-gray-900">Jitesh Kanojiya</p>
              <p className="text-xs text-green-600">Premium Farmer</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-72 min-h-screen flex flex-col">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30 p-4 lg:p-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-xl">
              <Menu className="w-6 h-6" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-gray-900 capitalize">{activeTab}</h2>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Nagpur, Maharashtra
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 hover:bg-green-100 hover:text-green-600 transition-colors">
              <AlertTriangle className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 bg-green-50 px-4 py-2 rounded-xl border border-green-100">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-bold text-green-700">Live Updates</span>
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
              {activeTab === 'market' && (
                <div className="bg-white p-8 rounded-3xl text-center border border-gray-100">
                  <TrendingUp className="w-16 h-16 text-green-600 mx-auto mb-4" />
                  <h2 className="text-2xl font-bold text-gray-900">Market Price Prediction</h2>
                  <p className="text-gray-500 mt-2">Real-time mandi prices and AI-driven trends coming soon.</p>
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-sm text-gray-500">Wheat</p>
                      <p className="text-xl font-bold text-gray-900">₹2,450/q</p>
                      <span className="text-xs text-green-600 font-bold">↑ 2.4%</span>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-sm text-gray-500">Rice (Basmati)</p>
                      <p className="text-xl font-bold text-gray-900">₹4,200/q</p>
                      <span className="text-xs text-red-600 font-bold">↓ 1.1%</span>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <p className="text-sm text-gray-500">Cotton</p>
                      <p className="text-xl font-bold text-gray-900">₹7,100/q</p>
                      <span className="text-xs text-gray-500 font-bold">Stable</span>
                    </div>
                  </div>
                </div>
              )}
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
