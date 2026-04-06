export type Language = 'en' | 'hi' | 'mr';

export const translations = {
  en: {
    appName: "FARMEX",
    languageLabel: "Language",
    premiumFarmer: "Premium Farmer",
    liveUpdates: "Live Updates",
    locationFallback: "Nagpur, Maharashtra",
    tabs: {
      dashboard: "Dashboard",
      crop: "Crops",
      disease: "Disease",
      chat: "AI Chat",
      calendar: "Calendar",
      market: "Market"
    },
    dashboard: {
      currentWeather: "Current Weather",
      humidity: "Humidity",
      wind: "Wind",
      alerts: "Risk Alerts",
      droughtAlert: "Drought Alert",
      pestAlert: "Pest Alert",
      action: "Action",
      dailyRecs: "Daily Recommendations",
      waterRec: "Best time to water your crops is between 6 AM and 8 AM tomorrow due to low evaporation.",
      marketRec: "Market prices for Wheat are expected to rise by 5% next week. Consider holding your harvest."
    },
    constants: {
      soilTypes: {
        Alluvial: "Alluvial",
        Black: "Black",
        Red: "Red",
        Laterite: "Laterite",
        Arid: "Arid",
        Mountain: "Mountain"
      },
      seasons: {
        "Kharif (Monsoon)": "Kharif (Monsoon)",
        "Rabi (Winter)": "Rabi (Winter)",
        "Zaid (Summer)": "Zaid (Summer)"
      },
      waterAvailability: {
        Low: "Low",
        Medium: "Medium",
        High: "High"
      }
    },
    crop: {
      title: "Crop Recommendation",
      location: "Location",
      soilType: "Soil Type",
      season: "Season",
      water: "Water Availability",
      placeholder: "Enter your city/region",
      submit: "Get Recommendation",
      analyzing: "Analyzing...",
      risk: "Risk",
      yield: "Expected Yield"
    },
    disease: {
      title: "Disease Detection",
      subtitle: "Upload a clear photo of the affected crop part",
      upload: "Click to capture or upload",
      analyzing: "Analyzing with AI...",
      confidence: "Confidence",
      treatment: "Suggested Treatment"
    },
    chat: {
      title: "Farmex AI Assistant",
      subtitle: "Ask anything about farming, crops, or weather.",
      placeholder: "Type your message...",
      suggestion1: "How to grow organic tomatoes?",
      suggestion2: "Best fertilizer for rice?"
    },
    calendar: {
      title: "Farming Calendar",
      smartPlanning: "Smart Planning",
      smartPlanningDesc: "Based on current weather forecasts, we recommend moving your next irrigation session to Thursday morning to maximize water absorption.",
      updateSchedule: "Update Schedule"
    },
    market: {
      title: "Mandi Price Explorer",
      subtitle: "Live prices from AGMARKNET across India",
      searchCommodity: "Search Commodity (e.g. Wheat)",
      searchMarket: "Search Market (e.g. Nagpur)",
      searchButton: "Search Prices",
      fetching: "Fetching latest mandi rates...",
      noResults: "No results found. Try searching for a different commodity or market.",
      insights: "Market Insights",
      insightsDesc: "Prices are updated in real-time from the Agricultural Marketing Information Network (AGMARKNET). Prices shown are per Quintal (100kg)."
    }
  },
  hi: {
    appName: "फार्मएक्स",
    languageLabel: "भाषा",
    premiumFarmer: "प्रीमियम किसान",
    liveUpdates: "लाइव अपडेट",
    locationFallback: "नागपुर, महाराष्ट्र",
    tabs: {
      dashboard: "डैशबोर्ड",
      crop: "फसलें",
      disease: "रोग",
      chat: "एआई चैट",
      calendar: "कैलेंडर",
      market: "बाजार"
    },
    dashboard: {
      currentWeather: "वर्तमान मौसम",
      humidity: "नमी",
      wind: "हवा",
      alerts: "जोखिम अलर्ट",
      droughtAlert: "सूखा अलर्ट",
      pestAlert: "कीट अलर्ट",
      action: "कार्रवाई",
      dailyRecs: "दैनिक सिफारिशें",
      waterRec: "कम वाष्पीकरण के कारण कल सुबह 6 बजे से 8 बजे के बीच अपनी फसलों को पानी देने का सबसे अच्छा समय है।",
      marketRec: "अगले हफ्ते गेहूं की बाजार कीमतों में 5% की वृद्धि होने की उम्मीद है। अपनी फसल को रोकने पर विचार करें।"
    },
    constants: {
      soilTypes: {
        Alluvial: "जलोढ़",
        Black: "काली",
        Red: "लाल",
        Laterite: "लैटराइट",
        Arid: "शुष्क",
        Mountain: "पर्वतीय"
      },
      seasons: {
        "Kharif (Monsoon)": "खरीफ (मानसून)",
        "Rabi (Winter)": "रबी (सर्दियों)",
        "Zaid (Summer)": "जायद (गर्मियों)"
      },
      waterAvailability: {
        Low: "कम",
        Medium: "मध्यम",
        High: "उच्च"
      }
    },
    crop: {
      title: "फसल की सिफारिश",
      location: "स्थान",
      soilType: "मिट्टी का प्रकार",
      season: "सीजन",
      water: "पानी की उपलब्धता",
      placeholder: "अपना शहर/क्षेत्र दर्ज करें",
      submit: "सिफारिश प्राप्त करें",
      analyzing: "विश्लेषण कर रहा है...",
      risk: "जोखिम",
      yield: "अपेक्षित उपज"
    },
    disease: {
      title: "रोग का पता लगाना",
      subtitle: "प्रभावित फसल के हिस्से की एक स्पष्ट फोटो अपलोड करें",
      upload: "कैप्चर या अपलोड करने के लिए क्लिक करें",
      analyzing: "एआई के साथ विश्लेषण...",
      confidence: "आत्मविश्वास",
      treatment: "सुझाया गया उपचार"
    },
    chat: {
      title: "फार्मएक्स एआई सहायक",
      subtitle: "खेती, फसलों या मौसम के बारे में कुछ भी पूछें।",
      placeholder: "अपना संदेश टाइप करें...",
      suggestion1: "जैविक टमाटर कैसे उगाएं?",
      suggestion2: "चावल के लिए सबसे अच्छा उर्वरक?"
    },
    calendar: {
      title: "खेती कैलेंडर",
      smartPlanning: "स्मार्ट प्लानिंग",
      smartPlanningDesc: "वर्तमान मौसम के पूर्वानुमानों के आधार पर, हम पानी के अवशोषण को अधिकतम करने के लिए आपके अगले सिंचाई सत्र को गुरुवार सुबह स्थानांतरित करने की सलाह देते हैं।",
      updateSchedule: "शेड्यूल अपडेट करें"
    },
    market: {
      title: "मंडी भाव खोजें",
      subtitle: "पूरे भारत में एगमार्कनेट से लाइव कीमतें",
      searchCommodity: "वस्तु खोजें (जैसे गेहूं)",
      searchMarket: "बाजार खोजें (जैसे नागपुर)",
      searchButton: "कीमतें खोजें",
      fetching: "नवीनतम मंडी दरें प्राप्त की जा रही हैं...",
      noResults: "कोई परिणाम नहीं मिला। किसी अन्य वस्तु या बाजार को खोजने का प्रयास करें।",
      insights: "बाजार अंतर्दृष्टि",
      insightsDesc: "कृषि विपणन सूचना नेटवर्क (AGMARKNET) से कीमतें वास्तविक समय में अपडेट की जाती हैं। दिखाई गई कीमतें प्रति क्विंटल (100 किग्रा) हैं।"
    }
  },
  mr: {
    appName: "फार्मएक्स",
    languageLabel: "भाषा",
    premiumFarmer: "प्रीमियम शेतकरी",
    liveUpdates: "थेट अपडेट",
    locationFallback: "नागपूर, महाराष्ट्र",
    tabs: {
      dashboard: "डॅशबोर्ड",
      crop: "पिके",
      disease: "रोग",
      chat: "एआय चॅट",
      calendar: "कॅलेंडर",
      market: "बाजार"
    },
    dashboard: {
      currentWeather: "सध्याचे हवामान",
      humidity: "आद्रता",
      wind: "वारा",
      alerts: "जोखीम अलर्ट",
      droughtAlert: "दुष्काळ अलर्ट",
      pestAlert: "कीड अलर्ट",
      action: "कृती",
      dailyRecs: "दैनिक शिफारसी",
      waterRec: "कमी बाष्पीभवनामुळे उद्या सकाळी ६ ते ८ दरम्यान तुमच्या पिकांना पाणी देण्याची सर्वोत्तम वेळ आहे.",
      marketRec: "पुढील आठवड्यात गव्हाच्या बाजारभावात ५% वाढ होण्याची शक्यता आहे. तुमची कापणी थांबवण्याचा विचार करा."
    },
    constants: {
      soilTypes: {
        Alluvial: "गाळाची",
        Black: "काळी",
        Red: "लाल",
        Laterite: "लॅटराइट",
        Arid: "शुष्क",
        Mountain: "डोंगाळ"
      },
      seasons: {
        "Kharif (Monsoon)": "खरीप (मान्सून)",
        "Rabi (Winter)": "रब्बी (हिवाळा)",
        "Zaid (Summer)": "उन्हाळी (उन्हाळा)"
      },
      waterAvailability: {
        Low: "कमी",
        Medium: "मध्यम",
        High: "जास्त"
      }
    },
    crop: {
      title: "पीक शिफारस",
      location: "स्थान",
      soilType: "मातीचा प्रकार",
      season: "हंगाम",
      water: "पाण्याची उपलब्धता",
      placeholder: "तुमचे शहर/प्रदेश प्रविष्ट करा",
      submit: "शिफारस मिळवा",
      analyzing: "विश्लेषण करत आहे...",
      risk: "जोखीम",
      yield: "अपेक्षित उत्पन्न"
    },
    disease: {
      title: "रोग शोधणे",
      subtitle: "बाधित पिकाच्या भागाचा स्पष्ट फोटो अपलोड करा",
      upload: "कॅप्चर किंवा अपलोड करण्यासाठी क्लिक करा",
      analyzing: "एआय सह विश्लेषण...",
      confidence: "आत्मविश्वास",
      treatment: "सुचविलेले उपचार"
    },
    chat: {
      title: "फार्मएक्स एआय सहाय्यक",
      subtitle: "शेती, पिके किंवा हवामानाबद्दल काहीही विचारा.",
      placeholder: "तुमचा संदेश टाइप करा...",
      suggestion1: "सेंद्रिय टोमॅटो कसे वाढवायचे?",
      suggestion2: "तांदळासाठी सर्वोत्तम खत?"
    },
    calendar: {
      title: "शेती कॅलेंडर",
      smartPlanning: "स्मार्ट नियोजन",
      smartPlanningDesc: "सध्याच्या हवामान अंदाजानुसार, आम्ही पाण्याचे शोषण जास्तीत जास्त करण्यासाठी तुमचे पुढील सिंचन सत्र गुरुवार सकाळी हलवण्याची शिफारस करतो.",
      updateSchedule: "वेळापत्रक अपडेट करा"
    },
    market: {
      title: "मंडी भाव शोधा",
      subtitle: "संपूर्ण भारतात एगमार्कनेट कडून थेट दर",
      searchCommodity: "वस्तू शोधा (उदा. गहू)",
      searchMarket: "बाजार शोधा (उदा. नागपूर)",
      searchButton: "दर शोधा",
      fetching: "नवीनतम मंडी दर प्राप्त केले जात आहेत...",
      noResults: "कोणतेही निकाल आढळले नाहीत. वेगळी वस्तू किंवा बाजार शोधण्याचा प्रयत्न करा.",
      insights: "बाजार अंतर्दृष्टी",
      insightsDesc: "कृषी विपणन माहिती नेटवर्क (AGMARKNET) कडून दर रिअल-टाइममध्ये अपडेट केले जातात. दाखवलेले दर प्रति क्विंटल (१०० किलो) आहेत।"
    }
  }
};
