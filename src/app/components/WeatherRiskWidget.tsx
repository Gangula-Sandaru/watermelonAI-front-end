import { Cloud, Droplets, TriangleAlert, TrendingUp } from 'lucide-react';
import { Card } from './ui/card';

export function WeatherRiskWidget() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Weather Risk Prediction</h3>
          <p className="text-sm text-gray-500">කාලගුණ අවදානම් පුරෝකථනය</p>
        </div>
        <Cloud className="w-8 h-8 text-[#2E7D32]" />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Temperature */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-600">Temperature</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">28°C</p>
          <p className="text-xs text-gray-500">උෂ්ණත්වය</p>
        </div>

        {/* Humidity */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Droplets className="w-4 h-4 text-blue-600" />
            <span className="text-sm text-gray-600">Humidity</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">78%</p>
          <p className="text-xs text-gray-500">ආර්ද්‍රතාවය</p>
        </div>
      </div>

      {/* Outbreak Probability */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <TriangleAlert className="w-6 h-6 text-amber-600" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-amber-900">Disease Outbreak Risk</span>
              <span className="font-bold text-amber-600">HIGH</span>
            </div>
            <div className="w-full bg-amber-200 rounded-full h-2 mb-2">
              <div className="bg-amber-600 h-2 rounded-full" style={{ width: '73%' }}></div>
            </div>
            <p className="text-xs text-amber-700">73% probability of Anthracnose outbreak</p>
            <p className="text-xs text-amber-600">ඇන්ත්‍රක්නෝස් රෝගය ඇතිවීමේ සම්භාවිතාව 73%</p>
          </div>
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>Data source: OpenWeatherMap API</p>
        <p>Last updated: 2 minutes ago</p>
      </div>
    </Card>
  );
}