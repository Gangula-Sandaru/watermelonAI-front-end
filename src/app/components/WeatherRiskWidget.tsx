"use client";

import { Cloud, Droplets, TriangleAlert, TrendingUp, MapPin } from 'lucide-react';
import { Card } from './ui/card';
import { useEffect, useState } from 'react';

interface WeatherData {
  temp: number | null;
  humidity: number | null;
  locationName: string | null;
}

export function WeatherRiskWidget() {
  const [weather, setWeather] = useState<WeatherData>({
    temp: null,
    humidity: null,
    locationName: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&current=relative_humidity_2m`;
          const geoUrl = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;

          const [weatherResponse, geoResponse] = await Promise.all([
            fetch(weatherUrl),
            fetch(geoUrl)
          ]);

          if (weatherResponse.ok) {
            const data = await weatherResponse.json();
            const geoData = geoResponse.ok ? await geoResponse.json() : null;
            const locationName = geoData ? (geoData.city || geoData.locality || geoData.principalSubdivision || "Current Location") : "Current Location";
            
            setWeather({ 
              temp: data.current_weather ? Math.round(data.current_weather.temperature) : null,
              humidity: data.current ? Math.round(data.current.relative_humidity_2m) : null,
              locationName
            });
          } else {
            setError("Failed to fetch weather data");
          }
        } catch (err) {
          setError("Failed to fetch weather data");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setError("Unable to retrieve your location");
        setLoading(false);
      }
    );
  }, []);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            Weather Risk Prediction
            {weather.locationName && (
              <span className="text-sm font-normal text-gray-500 dark:text-gray-400 flex items-center">
                <MapPin className="w-3 h-3 mr-1" />
                {weather.locationName}
              </span>
            )}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">කාලගුණ අවදානම් පුරෝකථනය</p>
        </div>
        <Cloud className="w-8 h-8 text-[#2E7D32]" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Temperature */}
        <div className="bg-muted dark:bg-gray-900/50 rounded-lg p-4 border dark:border-gray-700/50">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Temperature</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {loading ? "..." : weather.temp !== null ? `${weather.temp}°C` : "N/A"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">උෂ්ණත්වය</p>
        </div>
        {/* Humidity */}
        <div className="bg-muted dark:bg-gray-900/50 rounded-lg p-4 border dark:border-gray-700/50">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Humidity</span>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {loading ? "..." : weather.humidity !== null ? `${weather.humidity}%` : "N/A"}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">ආර්ද්‍රතාවය</p>
        </div>
      </div>

      {/* Outbreak Probability */}
      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <TriangleAlert className="w-6 h-6 text-amber-600 dark:text-amber-500" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-amber-900 dark:text-amber-500">Disease Outbreak Risk</span>
              <span className="font-bold text-amber-600 dark:text-amber-500">HIGH</span>
            </div>
            <div className="w-full bg-amber-200 dark:bg-amber-900/30 rounded-full h-2 mb-2">
              <div className="bg-amber-600 dark:bg-amber-500 h-2 rounded-full" style={{ width: '73%' }}></div>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-600">73% probability of Anthracnose outbreak</p>
            <p className="text-xs text-amber-600 dark:text-amber-700">ඇන්ත්‍රක්නෝස් රෝගය ඇතිවීමේ සම්භාවිතාව 73%</p>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs flex items-center justify-between">
        <div className="text-gray-500 dark:text-gray-400">
          <p>Data source: Open-Meteo API</p>
          <p>Last updated: {loading ? "Updating..." : "Just now"}</p>
        </div>
        {error && <p className="text-red-500 text-right max-w-[50%]">{error}</p>}
      </div>
    </Card>
  );
}