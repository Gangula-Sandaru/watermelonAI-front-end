"use client";

import { useEffect, useState, useMemo } from 'react';
import {
  Droplets,
  TriangleAlert,
  MapPin,
  Wind,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  ShieldCheck,
  RefreshCw,
  Thermometer,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Card } from './ui/card';
import { useTranslation } from '../utils/translations';

interface WeatherData {
  temp: number | null;
  humidity: number | null;
  windSpeed: number | null;
  weatherCode: number | null;
  locationName: string | null;
  coordinates: { lat: number; lng: number } | null;
  isFallback: boolean;
}

interface SimpleDiseaseInfo {
  id: string;
  name: { en: string; si: string; ta: string };
  pathogen: string;
  trend: 'coming' | 'going';
  riskScore: number;
  whyComing: { en: string; si: string; ta: string };
  whyGoing: { en: string; si: string; ta: string };
  action: { en: string; si: string; ta: string };
  weatherDriver: {
    tempText: { en: string; si: string; ta: string };
    humidityText: { en: string; si: string; ta: string };
    windText: { en: string; si: string; ta: string };
  };
}

const UI_TEXT = {
  title: {
    en: "Weather & Crop Disease Alert",
    si: "කාලගුණ හා බෝග රෝග අනාවැකිය",
    ta: "வானிலை மற்றும் பயிர் நோய் எச்சரிக்கை"
  },
  subtitle: {
    en: "Shows which watermelon diseases are emerging or fading based on today's weather",
    si: "අද කාලගුණය (උෂ්ණත්වය, ආර්ද්‍රතාවය, සුළඟ) අනුව මතුවිය හැකි හෝ පහව යන රෝග",
    ta: "இன்றைய வானிலையின் அடிப்படையில் தோன்றும் அல்லது குறையும் தர்பூசணி நோய்கள்"
  },
  agHub: {
    en: "Ag Hub",
    si: "කෘෂි කලාපය",
    ta: "விவசாய மையம்"
  },
  refresh: {
    en: "Refresh",
    si: "යාවත්කාලීන කරන්න",
    ta: "புதுப்பி"
  },
  temp: {
    en: "Temperature",
    si: "උෂ්ණත්වය",
    ta: "வெப்பநிலை"
  },
  humidity: {
    en: "Humidity",
    si: "ආර්ද්‍රතාවය",
    ta: "ஈரப்பதம்"
  },
  wind: {
    en: "Wind",
    si: "සුළඟ",
    ta: "காற்று"
  },
  comingTitle: {
    en: "Watch Out: Diseases About to Come",
    si: "අවධානයට: ඉදිරියේදී මතුවිය හැකි රෝග",
    ta: "கவனத்திற்கு: வரவிருக்கும் நோய்கள்"
  },
  comingDesc: {
    en: "Current weather is favorable for these diseases. Take preventative action.",
    si: "වත්මන් කාලගුණය මෙම රෝග බෝවීමට හිතකරයි. පෙර සූදානම් පියවර ගන්න.",
    ta: "தற்போதைய வானிலை இந்த நோய்களுக்கு சாதகமானது. தடுப்பு நடவடிக்கை எடுக்கவும்."
  },
  goingTitle: {
    en: "Low Risk: Diseases About to Go",
    si: "අවම අවදානම: පහව යන / නොපවතින රෝග",
    ta: "குறைந்த ஆபத்து: விலகும் நோய்கள்"
  },
  goingDesc: {
    en: "Current temperature or dry weather suppresses these diseases.",
    si: "වත්මන් වියළි කාලගුණය හෝ උෂ්ණත්වය නිසා මෙම රෝග මර්දනය වේ.",
    ta: "தற்போதைய வறண்ட வானிலை அல்லது வெப்பம் இந்த நோய்களை தடுக்கிறது."
  },
  actionLabel: {
    en: "What to do:",
    si: "කළ යුතු දේ:",
    ta: "செய்ய வேண்டியவை:"
  },
  whyLabel: {
    en: "Why?",
    si: "හේතුව:",
    ta: "காரணம்:"
  },
  showDetails: {
    en: "Show Scientific Details",
    si: "වැඩිදුර විද්‍යාත්මක විස්තර",
    ta: "கூடுதல் அறிவியல் விவரங்கள்"
  },
  hideDetails: {
    en: "Hide Details",
    si: "විස්තර සඟවන්න",
    ta: "விவரங்களை மறைக்க"
  },
  riskScoreLabel: {
    en: "Outbreak Probability",
    si: "රෝග ඇතිවීමේ සම්භාවිතාව",
    ta: "தொற்று நிகழ்தகவு"
  },
  noDiseasesComing: {
    en: "No major disease threats detected under current weather.",
    si: "වත්මන් කාලගුණය යටතේ රෝග මතුවීමේ දැඩි තර්ජනයක් නොමැත.",
    ta: "தற்போதைய வானிலையில் கடுமையான நோய் அச்சுறுத்தல் எதுவும் இல்லை."
  }
};

const FALLBACK_LOCATION = {
  lat: 8.3114,
  lng: 80.4037,
  name: "Anuradhapura"
};

function getWeatherCondition(code: number | null, lang: 'en' | 'si' | 'ta'): { label: string; icon: any } {
  if (code === null || code === 0) {
    return {
      label: lang === 'si' ? "පැහැදිලි අහස" : lang === 'ta' ? "தெளிவான வானம்" : "Clear Sky",
      icon: Sun
    };
  }
  if (code >= 1 && code <= 3) {
    return {
      label: lang === 'si' ? "වළාකුළු සහිත" : lang === 'ta' ? "மேகமூட்டம்" : "Partly Cloudy",
      icon: Cloud
    };
  }
  if (code >= 51 && code <= 67) {
    return {
      label: lang === 'si' ? "වැසි සහිත" : lang === 'ta' ? "மழை பொழிவு" : "Rain Showers",
      icon: CloudRain
    };
  }
  if (code >= 80 && code <= 82) {
    return {
      label: lang === 'si' ? "තද වැසි" : lang === 'ta' ? "கனமழை" : "Heavy Rain",
      icon: CloudRain
    };
  }
  if (code >= 95) {
    return {
      label: lang === 'si' ? "ගිගුරුම් සහිත වැසි" : lang === 'ta' ? "இடியுடன் கூடிய மழை" : "Thunderstorm",
      icon: CloudLightning
    };
  }
  return {
    label: lang === 'si' ? "සාමාන්‍ය කාලගුණය" : lang === 'ta' ? "வழக்கமான வானிலை" : "Overcast",
    icon: Cloud
  };
}

function evaluateDiseases(temp: number | null, humidity: number | null, wind: number | null): SimpleDiseaseInfo[] {
  const t = temp ?? 28;
  const h = humidity ?? 70;
  const w = wind ?? 12;

  // 1. Anthracnose
  const anthScore = Math.min(96, Math.max(10,
    ((t >= 22 && t <= 30) ? 40 : 15) +
    (h >= 75 ? 40 : h >= 65 ? 20 : 5) +
    (w >= 10 ? 18 : 8)
  ));
  const anthComing = anthScore >= 60;

  // 2. Downy Mildew
  const downyScore = Math.min(95, Math.max(10,
    ((t >= 16 && t <= 26) ? 40 : t > 31 ? 5 : 20) +
    (h >= 78 ? 40 : 10) +
    (w >= 8 ? 18 : 8)
  ));
  const downyComing = downyScore >= 60;

  // 3. Powdery Mildew
  const powScore = Math.min(94, Math.max(10,
    ((t >= 22 && t <= 32) ? 40 : 15) +
    ((h >= 50 && h <= 78) ? 40 : h > 85 ? 5 : 20) +
    (w >= 8 ? 16 : 8)
  ));
  const powComing = powScore >= 60;

  // 4. Gummy Stem Blight
  const gummyScore = Math.min(95, Math.max(10,
    ((t >= 20 && t <= 29) ? 40 : 15) +
    (h >= 75 ? 40 : 15) +
    (w >= 10 ? 16 : 8)
  ));
  const gummyComing = gummyScore >= 60;

  // 5. Bacterial Fruit Blotch
  const bfbScore = Math.min(96, Math.max(10,
    ((t >= 27 && t <= 36) ? 40 : 10) +
    (h >= 72 ? 38 : 10) +
    (w >= 12 ? 18 : 8)
  ));
  const bfbComing = bfbScore >= 60;

  return [
    {
      id: 'anthracnose',
      name: {
        en: 'Anthracnose',
        si: 'ඇන්ත්‍රක්නෝස් රෝගය',
        ta: 'ஆந்த்ராக்னோஸ் நோய்'
      },
      pathogen: 'Colletotrichum orbiculare',
      trend: anthComing ? 'coming' : 'going',
      riskScore: anthScore,
      whyComing: {
        en: `Warm temperature (${t}°C) and high humidity (${h}%) allow fungal spores to splash and multiply.`,
        si: `උණුසුම් උෂ්ණත්වය (${t}°C) සහ ඉහළ තෙතමනය (${h}%) දිලීර බීජාණු වර්ධනයට හිතකරයි.`,
        ta: `வெப்பநிலை (${t}°C) மற்றும் அதிக ஈரப்பதம் (${h}%) பூஞ்சை பரவ உதவுகிறது.`
      },
      whyGoing: {
        en: `Dry air (${h}% RH) or high heat stops fungal spores from germinating.`,
        si: `වියළි වාතය (${h}%) සහ රස්නය නිසා දිලීර බීජාණු විනාශ වී අවදානම පහව යයි.`,
        ta: `வறண்ட காற்று (${h}%) மற்றும் வெப்பம் பூஞ்சை பரவுவதை தடுக்கிறது.`
      },
      action: {
        en: 'Apply Mancozeb or Copper fungicide. Avoid overhead watering.',
        si: 'මැන්කොසෙබ් හෝ කොපර් දිලීර නාශක යොදන්න. ඉහළින් වතුර දැමීමෙන් වළකින්න.',
        ta: 'மேன்கோசெப் அல்லது காப்பர் பூஞ்சைக்கொல்லி தெளிக்கவும். இலைகளில் நீர் தெளிக்க வேண்டாம்.'
      },
      weatherDriver: {
        tempText: { en: `${t}°C (Warm)`, si: `${t}°C (උණුසුම්)`, ta: `${t}°C (வெப்பம்)` },
        humidityText: { en: `${h}% (${h >= 75 ? 'High' : 'Moderate'})`, si: `${h}% (${h >= 75 ? 'ඉහළ' : 'මධ්‍යස්ථ'})`, ta: `${h}% (${h >= 75 ? 'அதிகம்' : 'மிதமானது'})` },
        windText: { en: `${w} km/h`, si: `${w} km/h`, ta: `${w} கி.மீ/மணி` }
      }
    },
    {
      id: 'downy-mildew',
      name: {
        en: 'Downy Mildew',
        si: 'යටි පුස් රෝගය',
        ta: 'கீழ் பூஞ்சை நோய்'
      },
      pathogen: 'Pseudoperonospora cubensis',
      trend: downyComing ? 'coming' : 'going',
      riskScore: downyScore,
      whyComing: {
        en: `High morning moisture (${h}%) and wind (${w} km/h) carry airborne spores across rows.`,
        si: `ඉහළ තෙතමනය (${h}%) සහ සුළඟ (${w} km/h) මගින් බීජාණු ක්ෂේත්‍රය පුරා ගසාගෙන යයි.`,
        ta: `அதிக ஈரப்பதம் (${h}%) மற்றும் காற்று (${w} கி.மீ/மணி) நோய்க்கிருமிகளை பரப்புகிறது.`
      },
      whyGoing: {
        en: `Warm daylight temperatures (${t}°C) quickly dry out and kill the spores.`,
        si: `දහවල් පවතින උෂ්ණත්වය (${t}°C) මගින් බීජාණු වියළී විනාශ වේ.`,
        ta: `பகல் நேர வெப்பம் (${t}°C) வித்துக்களை உலர்த்தி அழிக்கிறது.`
      },
      action: {
        en: 'Inspect leaf undersides for purple felt. Spray Metalaxyl if spotted.',
        si: 'යටි පත්‍රවල දම් පැහැ පුස් ඇත්දැයි බලන්න. දුටුවහොත් මෙටලැක්සිල් යොදන්න.',
        ta: 'இலைகளின் அடியில் பூஞ்சை உள்ளதா என பரிசோதித்து மெட்டாலாக்சில் தெளிக்கவும்.'
      },
      weatherDriver: {
        tempText: { en: `${t}°C`, si: `${t}°C`, ta: `${t}°C` },
        humidityText: { en: `${h}%`, si: `${h}%`, ta: `${h}%` },
        windText: { en: `${w} km/h`, si: `${w} km/h`, ta: `${w} கி.மீ/மணி` }
      }
    },
    {
      id: 'powdery-mildew',
      name: {
        en: 'Powdery Mildew',
        si: 'පිටි පුස් රෝගය',
        ta: 'மாவுத்திரை நோய்'
      },
      pathogen: 'Podosphaera xanthii',
      trend: powComing ? 'coming' : 'going',
      riskScore: powScore,
      whyComing: {
        en: `Warm dry weather (${t}°C, ${h}% RH) with wind spreads powdery white spores on leaves.`,
        si: `උණුසුම් වියළි කාලගුණය සහ සුළඟ සුදු කුඩු වැනි බීජාණු පත්‍ර මත පහසුවෙන් පතුරවයි.`,
        ta: `வறண்ட வானிலை (${t}°C, ${h}%) மற்றும் காற்று சாம்பல் வித்துக்களை பரப்புகிறது.`
      },
      whyGoing: {
        en: `Heavy moisture or heat washes away and suppresses powdery mildew.`,
        si: `අධික තෙතමනය හෝ තද රස්නය මගින් පිටි පුස් දිලීරය මර්දනය වේ.`,
        ta: `அதிக மழை அல்லது தீவிர வெப்பம் இந்த பூஞ்சையை அழிக்கிறது.`
      },
      action: {
        en: 'Ensure good air circulation. Spray wettable sulfur in early morning.',
        si: 'වැල් අතර හොඳින් සුළං වදින සේ තබන්න. උදෑසන සල්ෆර් යොදන්න.',
        ta: 'காற்றோட்டத்தை உறுதி செய்து அதிகாலையில் சல்பர் மருந்து தெளிக்கவும்.'
      },
      weatherDriver: {
        tempText: { en: `${t}°C`, si: `${t}°C`, ta: `${t}°C` },
        humidityText: { en: `${h}%`, si: `${h}%`, ta: `${h}%` },
        windText: { en: `${w} km/h`, si: `${w} km/h`, ta: `${w} கி.மீ/மணி` }
      }
    },
    {
      id: 'gummy-stem-blight',
      name: {
        en: 'Gummy Stem Blight',
        si: 'ගම් සහිත කඳ කුණුවීම',
        ta: 'பிசின் தண்டு அழுகல்'
      },
      pathogen: 'Didymella bryoniae',
      trend: gummyComing ? 'coming' : 'going',
      riskScore: gummyScore,
      whyComing: {
        en: `Prolonged moisture (${h}%) makes lower stems crack and rot.`,
        si: `පත්‍ර සහ කඳේ පවතින තෙතමනය (${h}%) කඳ පුපුරා කුණුවීමට මග පාදයි.`,
        ta: `நீடித்த ஈரப்பதம் (${h}%) தண்டு வெடித்து அழுக காரணமாகிறது.`
      },
      whyGoing: {
        en: `Dry conditions dry up stem wounds and prevent new infections.`,
        si: `වියළි කාලගුණය නිසා කඳේ තුවාල වේලී ගොස් ආසාදනය වීම නවතී.`,
        ta: `வறண்ட வானிலை தண்டு புண்களை உலர்த்தி நோய் வராமல் தடுக்கிறது.`
      },
      action: {
        en: 'Avoid wounding stems when weeding. Apply Chlorothalonil to stem base.',
        si: 'වල් නෙලීමේදී කඳට හානි නොකරන්න. කඳ පාමුලට ක්ලෝරොතැලෝනිල් යොදන්න.',
        ta: 'களை எடுக்கும் போது தண்டுகளை சேதப்படுத்தாதீர்கள். தண்டு பகுதியில் மருந்து தெளிக்கவும்.'
      },
      weatherDriver: {
        tempText: { en: `${t}°C`, si: `${t}°C`, ta: `${t}°C` },
        humidityText: { en: `${h}%`, si: `${h}%`, ta: `${h}%` },
        windText: { en: `${w} km/h`, si: `${w} km/h`, ta: `${w} கி.மீ/மணி` }
      }
    },
    {
      id: 'bacterial-fruit-blotch',
      name: {
        en: 'Bacterial Fruit Blotch',
        si: 'බැක්ටීරියා ඵල ලප රෝගය',
        ta: 'பாக்டீரியா பழ கறை நோய்'
      },
      pathogen: 'Acidovorax citrulli',
      trend: bfbComing ? 'coming' : 'going',
      riskScore: bfbScore,
      whyComing: {
        en: `Hot temperature (${t}°C) with wind (${w} km/h) injures leaves and lets bacteria enter.`,
        si: `තද රස්නය (${t}°C) සහ තද සුළඟ (${w} km/h) පත්‍ර සූරා බැක්ටීරියාව ඇතුළු කරයි.`,
        ta: `அதிக வெப்பம் (${t}°C) மற்றும் காற்று (${w} கி.மீ/மணி) இலைகளை காயப்படுத்தி பாக்டீரியாவை பரப்புகிறது.`
      },
      whyGoing: {
        en: `Cooler temperature or dry air stops bacterial multiplication.`,
        si: `සිසිල් සහ වියළි වාතාවරණය බැක්ටීරියා බෝවීම නවත්වයි.`,
        ta: `குளிர்ந்த மற்றும் வறண்ட நிலை பாக்டீரியா வளர்ச்சியை தடுக்கிறது.`
      },
      action: {
        en: 'Spray copper bactericide. Avoid walking in rows while vines are wet.',
        si: 'කොපර් බැක්ටීරියා නාශකයක් යොදන්න. පත්‍ර තෙත්ව ඇති විට ඇවිදීමෙන් වළකින්න.',
        ta: 'காப்பர் மருந்து தெளிக்கவும். இலைகள் ஈரமாக இருக்கும் போது பயிரில் நடமாட வேண்டாம்.'
      },
      weatherDriver: {
        tempText: { en: `${t}°C`, si: `${t}°C`, ta: `${t}°C` },
        humidityText: { en: `${h}%`, si: `${h}%`, ta: `${h}%` },
        windText: { en: `${w} km/h`, si: `${w} km/h`, ta: `${w} கி.மீ/மணி` }
      }
    }
  ];
}

export function WeatherRiskWidget() {
  const { currentLanguage } = useTranslation();
  const lang = (currentLanguage === 'si' ? 'si' : currentLanguage === 'ta' ? 'ta' : 'en') as 'en' | 'si' | 'ta';

  const [weather, setWeather] = useState<WeatherData>({
    temp: null,
    humidity: null,
    windSpeed: null,
    weatherCode: null,
    locationName: null,
    coordinates: null,
    isFallback: false,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const fetchWeatherData = async (lat: number, lng: number, fallbackName?: string, isFallbackFlag: boolean = false) => {
    try {
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`;
      const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`;

      const [weatherResponse, geoResponse] = await Promise.allSettled([fetch(weatherUrl), fetch(geoUrl)]);

      if (weatherResponse.status === 'fulfilled' && weatherResponse.value.ok) {
        const data = await weatherResponse.value.json();
        let locName = fallbackName || "Field Location";
        if (geoResponse.status === 'fulfilled' && geoResponse.value.ok) {
          const geoData = await geoResponse.value.json();
          locName = geoData.city || geoData.locality || geoData.principalSubdivision || locName;
        }
        const current = data.current || {};
        setWeather({
          temp: current.temperature_2m !== undefined ? Math.round(current.temperature_2m) : null,
          humidity: current.relative_humidity_2m !== undefined ? Math.round(current.relative_humidity_2m) : null,
          windSpeed: current.wind_speed_10m !== undefined ? Math.round(current.wind_speed_10m) : null,
          weatherCode: current.weather_code !== undefined ? current.weather_code : null,
          locationName: locName,
          coordinates: { lat, lng },
          isFallback: isFallbackFlag,
        });
      }
    } catch (err: any) {
      if (!isFallbackFlag) {
        await fetchWeatherData(FALLBACK_LOCATION.lat, FALLBACK_LOCATION.lng, FALLBACK_LOCATION.name, true);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadLocationAndWeather = () => {
    setLoading(true);
    if (!navigator.geolocation) {
      fetchWeatherData(FALLBACK_LOCATION.lat, FALLBACK_LOCATION.lng, FALLBACK_LOCATION.name, true);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        fetchWeatherData(position.coords.latitude, position.coords.longitude, undefined, false);
      },
      () => {
        fetchWeatherData(FALLBACK_LOCATION.lat, FALLBACK_LOCATION.lng, FALLBACK_LOCATION.name, true);
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  };

  useEffect(() => {
    loadLocationAndWeather();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    if (weather.coordinates) {
      fetchWeatherData(weather.coordinates.lat, weather.coordinates.lng, weather.locationName || undefined, weather.isFallback);
    } else {
      loadLocationAndWeather();
    }
  };

  const allDiseases = useMemo(() => {
    return evaluateDiseases(weather.temp, weather.humidity, weather.windSpeed);
  }, [weather.temp, weather.humidity, weather.windSpeed]);

  const comingDiseases = useMemo(() => allDiseases.filter(d => d.trend === 'coming'), [allDiseases]);
  const goingDiseases = useMemo(() => allDiseases.filter(d => d.trend === 'going'), [allDiseases]);

  const condition = getWeatherCondition(weather.weatherCode, lang);
  const WeatherIcon = condition.icon;

  return (
    <Card className="p-5 md:p-6 bg-white dark:bg-gray-800/95 shadow-sm border border-gray-200 dark:border-gray-700/60 rounded-2xl">
      {/* 1. Header with Location & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              {UI_TEXT.title[lang]}
            </h3>
            {weather.locationName && (
              <span className="inline-flex items-center text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                <MapPin className="w-3 h-3 mr-1" />
                {weather.locationName}
                {weather.isFallback && ` (${UI_TEXT.agHub[lang]})`}
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {UI_TEXT.subtitle[lang]}
          </p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing || loading ? "animate-spin text-emerald-600" : ""}`} />
          {UI_TEXT.refresh[lang]}
        </button>
      </div>

      {/* 2. Simple Weather Snapshot Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200/80 dark:border-gray-700/60 mb-5">
        {/* Temperature */}
        <div className="flex items-center gap-2.5 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
            <Thermometer className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400">{UI_TEXT.temp[lang]}</div>
            <div className="text-base font-bold text-gray-900 dark:text-white">
              {loading ? "..." : weather.temp !== null ? `${weather.temp}°C` : "N/A"}
            </div>
          </div>
        </div>

        {/* Humidity */}
        <div className="flex items-center gap-2.5 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
          <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400">{UI_TEXT.humidity[lang]}</div>
            <div className="text-base font-bold text-blue-600 dark:text-blue-400">
              {loading ? "..." : weather.humidity !== null ? `${weather.humidity}%` : "N/A"}
            </div>
          </div>
        </div>

        {/* Wind */}
        <div className="flex items-center gap-2.5 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
          <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
            <Wind className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400">{UI_TEXT.wind[lang]}</div>
            <div className="text-base font-bold text-teal-600 dark:text-teal-400">
              {loading ? "..." : weather.windSpeed !== null ? `${weather.windSpeed} km/h` : "N/A"}
            </div>
          </div>
        </div>

        {/* Sky */}
        <div className="flex items-center gap-2.5 p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
          <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
            <WeatherIcon className="w-4 h-4" />
          </div>
          <div className="truncate">
            <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">{condition.label}</div>
            <div className="text-xs font-bold text-purple-900 dark:text-purple-200">
              {weather.humidity !== null && weather.humidity >= 75 ? "High Moisture" : "Dry Air"}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Main Diseases Section: Coming (Alert) vs Going (Safe) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* SECTION A: ABOUT TO COME (HIGH ALERT) */}
        <div className="rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/40 dark:bg-red-950/20 p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1 rounded-md bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400">
              <TriangleAlert className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-red-900 dark:text-red-300 flex items-center gap-1.5">
              {UI_TEXT.comingTitle[lang]}
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-red-600 text-white">
                {comingDiseases.length}
              </span>
            </h4>
          </div>
          <p className="text-xs text-red-700/80 dark:text-red-400/80 mb-3">
            {UI_TEXT.comingDesc[lang]}
          </p>

          <div className="space-y-3">
            {comingDiseases.length === 0 ? (
              <div className="p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg text-xs text-gray-600 dark:text-gray-300">
                {UI_TEXT.noDiseasesComing[lang]}
              </div>
            ) : (
              comingDiseases.map((d) => (
                <div
                  key={d.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-3.5 shadow-xs border border-red-200/70 dark:border-red-900/40 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-sm text-gray-900 dark:text-white">
                        {d.name[lang]}
                      </h5>
                      <span className="text-[10px] text-gray-400 italic font-mono">
                        {d.pathogen}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-md">
                      <ArrowUpRight className="w-3.5 h-3.5 text-red-600" />
                      {d.riskScore}%
                    </span>
                  </div>

                  {/* Why it is coming */}
                  <div className="text-xs text-gray-700 dark:text-gray-300 bg-red-50/60 dark:bg-red-950/30 p-2 rounded-lg">
                    <span className="font-semibold text-red-800 dark:text-red-400 mr-1">
                      {UI_TEXT.whyLabel[lang]}
                    </span>
                    {d.whyComing[lang]}
                  </div>

                  {/* Action Pill */}
                  <div className="text-xs text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40 flex items-start gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold mr-1">{UI_TEXT.actionLabel[lang]}</span>
                      {d.action[lang]}
                    </div>
                  </div>

                  {/* Scientific Details (If toggled) */}
                  {showDetails && (
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700 text-[11px] grid grid-cols-3 gap-1 text-gray-500 dark:text-gray-400">
                      <div>🌡️ {d.weatherDriver.tempText[lang]}</div>
                      <div>💧 {d.weatherDriver.humidityText[lang]}</div>
                      <div>💨 {d.weatherDriver.windText[lang]}</div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* SECTION B: ABOUT TO GO (SAFE / FADING) */}
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/40 dark:bg-emerald-950/20 p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1 rounded-md bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
              {UI_TEXT.goingTitle[lang]}
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                {goingDiseases.length}
              </span>
            </h4>
          </div>
          <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mb-3">
            {UI_TEXT.goingDesc[lang]}
          </p>

          <div className="space-y-3">
            {goingDiseases.length === 0 ? (
              <div className="p-3 bg-white/70 dark:bg-gray-800/70 rounded-lg text-xs text-gray-600 dark:text-gray-300">
                All monitored diseases have some active risk today.
              </div>
            ) : (
              goingDiseases.map((d) => (
                <div
                  key={d.id}
                  className="bg-white dark:bg-gray-800 rounded-xl p-3.5 shadow-xs border border-emerald-200/70 dark:border-emerald-900/40 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-sm text-gray-900 dark:text-white">
                        {d.name[lang]}
                      </h5>
                      <span className="text-[10px] text-gray-400 italic font-mono">
                        {d.pathogen}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-md">
                      <ArrowDownRight className="w-3.5 h-3.5 text-emerald-600" />
                      Low Risk ({d.riskScore}%)
                    </span>
                  </div>

                  <div className="text-xs text-gray-700 dark:text-gray-300 bg-emerald-50/60 dark:bg-emerald-950/30 p-2 rounded-lg">
                    <span className="font-semibold text-emerald-800 dark:text-emerald-400 mr-1">
                      {UI_TEXT.whyLabel[lang]}
                    </span>
                    {d.whyGoing[lang]}
                  </div>

                  {showDetails && (
                    <div className="pt-2 border-t border-gray-100 dark:border-gray-700 text-[11px] grid grid-cols-3 gap-1 text-gray-500 dark:text-gray-400">
                      <div>🌡️ {d.weatherDriver.tempText[lang]}</div>
                      <div>💧 {d.weatherDriver.humidityText[lang]}</div>
                      <div>💨 {d.weatherDriver.windText[lang]}</div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Bottom Detail Toggle */}
      <div className="pt-2 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white cursor-pointer transition-colors"
        >
          {showDetails ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              {UI_TEXT.hideDetails[lang]}
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              {UI_TEXT.showDetails[lang]}
            </>
          )}
        </button>

        <span className="text-[11px] text-gray-400 dark:text-gray-500">
          Open-Meteo • Live
        </span>
      </div>
    </Card>
  );
}