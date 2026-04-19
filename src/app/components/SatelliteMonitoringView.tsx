import { Card } from './ui/card';
import { Satellite, Layers, ZoomIn, Download } from 'lucide-react';
import { Button } from './ui/button';

export function SatelliteMonitoringView() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Satellite Crop Monitoring</h3>
          <p className="text-sm text-gray-500">චන්ද්‍රිකා භෝග අධීක්ෂණය</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <ZoomIn className="w-4 h-4 mr-2" />
            Zoom
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ height: '400px' }}>
        {/* Simulated NDVI Heatmap */}
        <img
          src="https://images.unsplash.com/photo-1701390544948-f88cadb4aa73?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzYXRlbGxpdGUlMjBtYXAlMjB2ZWdldGF0aW9ufGVufDF8fHx8MTc2NzQzMzc0Nnww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Satellite view"
          className="w-full h-full object-cover opacity-60"
        />
        
        {/* Overlay with NDVI visualization */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/30 via-yellow-500/30 to-red-500/20"></div>

        {/* Field Markers */}
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div className="w-4 h-4 bg-[#2E7D32] rounded-full border-4 border-white shadow-lg animate-pulse"></div>
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded shadow-lg whitespace-nowrap">
              <p className="text-xs font-semibold">Field A-1</p>
              <p className="text-xs text-green-600">NDVI: 0.72 (Healthy)</p>
            </div>
          </div>
        </div>

        <div className="absolute top-2/3 left-2/3">
          <div className="relative">
            <div className="w-4 h-4 bg-amber-500 rounded-full border-4 border-white shadow-lg animate-pulse"></div>
            <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded shadow-lg whitespace-nowrap">
              <p className="text-xs font-semibold">Field B-3</p>
              <p className="text-xs text-amber-600">NDVI: 0.45 (Alert)</p>
            </div>
          </div>
        </div>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2">
          <div className="flex flex-col gap-2">
            <button className="p-2 hover:bg-gray-100 rounded">
              <Layers className="w-4 h-4 text-gray-700" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded">
              <Satellite className="w-4 h-4 text-gray-700" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
          <p className="text-xs font-semibold mb-2">Vegetation Health Index (NDVI)</p>
          <div className="flex items-center gap-2">
            <div className="w-32 h-3 rounded-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"></div>
            <div className="flex justify-between w-full text-xs">
              <span>0.0</span>
              <span>0.5</span>
              <span>1.0</span>
            </div>
          </div>
          <div className="flex justify-between text-xs mt-1 text-gray-600">
            <span>Stressed</span>
            <span>Moderate</span>
            <span>Healthy</span>
          </div>
        </div>

        {/* Coordinates */}
        <div className="absolute bottom-4 right-4 bg-black/70 text-white text-xs px-3 py-1 rounded">
          7.8731° N, 80.7718° E
        </div>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>Data source: Google Earth Engine API • Sentinel-2 Imagery</p>
        <p>Last updated: January 3, 2026 - 10:30 AM</p>
      </div>
    </Card>
  );
}
