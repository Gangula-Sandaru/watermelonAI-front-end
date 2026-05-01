import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Settings, Globe, Bell, MapPin, Database, Shield, Trash2, Save, RefreshCw, Lock, Loader2, Search, Maximize2, Maximize, Minimize, X as CloseIcon } from 'lucide-react';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icons
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 13);
  }, [center, map]);
  return null;
}

function LocationPickerInteraction({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
}

export const SettingsModule = () => {
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dataRetention, setDataRetention] = useState('6months');
  const [location, setLocation] = useState<[number, number]>([7.8731, 80.7718]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [isMapMaximized, setIsMapMaximized] = useState(false);
  
  // Notification states
  const [diseaseAlerts, setDiseaseAlerts] = useState(true);
  const [weatherWarnings, setWeatherWarnings] = useState(true);
  const [systemUpdates, setSystemUpdates] = useState(false);
  const [anonymousSharing, setAnonymousSharing] = useState(true);
  const [language, setLanguage] = useState('English (US)');

  const API_BASE = "http://127.0.0.1:8000/api/settings/";

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        const response = await fetch(API_BASE, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setDataRetention(data.retention_policy);
          setLocation([parseFloat(data.latitude), parseFloat(data.longitude)]);
          setDiseaseAlerts(data.disease_alerts);
          setWeatherWarnings(data.weather_warnings);
          setSystemUpdates(data.system_updates);
          setAnonymousSharing(data.anonymous_data_sharing);
          
          const langMap: Record<string, string> = { 'en': 'English (US)', 'si': 'සිංහල (Sinhala)', 'ta': 'தமிழ் (Tamil)' };
          setLanguage(langMap[data.language] || 'English (US)');
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const langRevMap: Record<string, string> = { 'English (US)': 'en', 'සිංහල (Sinhala)': 'si', 'தமிழ் (Tamil)': 'ta' };
      
      const payload = {
        language: langRevMap[language] || 'en',
        latitude: location[0],
        longitude: location[1],
        disease_alerts: diseaseAlerts,
        weather_warnings: weatherWarnings,
        system_updates: systemUpdates,
        retention_policy: dataRetention,
        anonymous_data_sharing: anonymousSharing
      };

      const response = await fetch(API_BASE, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success("Settings saved successfully");
      } else {
        toast.error("Failed to save settings");
      }
    } catch (err) {
      toast.error("An error occurred while saving");
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearData = async () => {
    if (confirm("Are you sure you want to clear all scan history? This action cannot be undone.")) {
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        const response = await fetch(`${API_BASE}purge-history/`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          toast.success("All scan history has been cleared");
        } else {
          toast.error("Failed to clear scan history");
        }
      } catch (err) {
        toast.error("An error occurred");
      }
    }
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setLocation([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
      } else {
        toast.error('Location not found');
      }
    } catch (e) {
      toast.error('Search failed');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-12 h-12 text-[#2E7D32] animate-spin" />
        <p className="text-gray-500 font-medium animate-pulse">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-semibold text-gray-900">System Settings</h3>
            <p className="text-sm text-gray-500">පද්ධති සැකසීම්</p>
          </div>
          <Settings className="w-8 h-8 text-[#2E7D32]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left Column: General & Localization */}
          <div className="space-y-8">
            {/* Language & Region */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Globe size={18} className="text-[#2E7D32]" /> Language & Region
              </h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Display Language</label>
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-sm"
                  >
                    <option>English (US)</option>
                    <option>සිංහල (Sinhala)</option>
                    <option>தமிழ் (Tamil)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Default Location (GPS)</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        value={`${location[0].toFixed(4)}° N, ${location[1].toFixed(4)}° E`}
                        readOnly
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 cursor-not-allowed"
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowMap(!showMap)}
                      className={`gap-2 ${showMap ? 'bg-green-50 border-[#2E7D32] text-[#2E7D32]' : ''}`}
                    >
                      <Maximize2 size={14} />
                      {showMap ? 'Close Map' : 'Pick on Map'}
                    </Button>
                  </div>
                </div>

                {/* Inline Map Picker */}
                {showMap && (
                  <div className={`${isMapMaximized ? 'fixed inset-0 z-[9999] bg-white p-6 flex flex-col' : 'space-y-3 animate-in zoom-in-95 duration-300'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex gap-2 flex-1 max-w-xl">
                        <input 
                          type="text" 
                          placeholder="Search for your farm area..." 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#2E7D32]"
                        />
                        <Button onClick={handleSearch} size="sm" className="bg-gray-800 hover:bg-gray-700">
                          <Search size={14} />
                        </Button>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <button 
                          onClick={() => setIsMapMaximized(!isMapMaximized)}
                          className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-gray-600"
                          title={isMapMaximized ? "Minimize" : "Maximize"}
                        >
                          {isMapMaximized ? <Minimize size={18} /> : <Maximize size={18} />}
                        </button>
                        {isMapMaximized && (
                          <button 
                            onClick={() => { setIsMapMaximized(false); setShowMap(false); }}
                            className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <CloseIcon size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className={`${isMapMaximized ? 'flex-1' : 'h-64'} rounded-xl overflow-hidden border border-gray-200 relative`}>
                      <MapContainer 
                        center={location} 
                        zoom={13} 
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                          attribution="&copy; Google Maps"
                        />
                        <Marker position={location} />
                        <MapController center={location} />
                        <LocationPickerInteraction onLocationSelect={(lat, lng) => setLocation([lat, lng])} />
                      </MapContainer>
                      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 shadow-md border border-gray-100">
                        {isMapMaximized ? '🎯 Click anywhere on the satellite view to set your farm coordinates' : 'Click on map to select location'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notifications */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Bell size={18} className="text-[#2E7D32]" /> Notifications
              </h4>
              <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <label className="flex items-center justify-between group cursor-pointer">
                  <span className="text-sm text-gray-700 font-medium">Disease detection alerts</span>
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 text-[#2E7D32] focus:ring-[#2E7D32]" 
                    checked={diseaseAlerts}
                    onChange={(e) => setDiseaseAlerts(e.target.checked)}
                  />
                </label>
                <label className="flex items-center justify-between group cursor-pointer">
                  <span className="text-sm text-gray-700 font-medium">Weather risk warnings</span>
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 text-[#2E7D32] focus:ring-[#2E7D32]" 
                    checked={weatherWarnings}
                    onChange={(e) => setWeatherWarnings(e.target.checked)}
                  />
                </label>
                <label className="flex items-center justify-between group cursor-pointer">
                  <span className="text-sm text-gray-700 font-medium">System status updates</span>
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 text-[#2E7D32] focus:ring-[#2E7D32]" 
                    checked={systemUpdates}
                    onChange={(e) => setSystemUpdates(e.target.checked)}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Data Flexibility & Security */}
          <div className="space-y-8">
            {/* Data Management */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Database size={18} className="text-[#2E7D32]" /> Data Management
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">History Retention Policy</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['30days', '6months', '1year', 'forever'].map((policy) => (
                      <button
                        key={policy}
                        onClick={() => setDataRetention(policy)}
                        className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all ${
                          dataRetention === policy
                            ? 'border-[#2E7D32] bg-green-50 text-[#2E7D32]'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {policy === 'forever' ? 'Keep Forever' : policy.replace('days', ' Days').replace('months', ' Months').replace('year', '1 Year')}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 font-medium">Older scans will be automatically archived to optimize system performance.</p>
                </div>
                
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 space-y-3">
                  <label className="flex items-center justify-between group cursor-pointer">
                    <div className="space-y-0.5">
                      <span className="text-sm text-amber-900 font-bold">Anonymous Data Sharing</span>
                      <p className="text-[10px] text-amber-700/70 leading-tight">Help improve our AI models by sharing anonymized disease data.</p>
                    </div>
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500" 
                      checked={anonymousSharing}
                      onChange={(e) => setAnonymousSharing(e.target.checked)}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Privacy & API */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Shield size={18} className="text-[#2E7D32]" /> Privacy & Security
              </h4>
              <div className="grid grid-cols-1 gap-3">
                <Button variant="outline" className="justify-start gap-2 h-auto py-3 px-4 border-gray-200">
                  <Lock size={14} className="text-gray-400" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-gray-900">Change Security Password</p>
                    <p className="text-[10px] text-gray-500">Update your account credentials</p>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start gap-2 h-auto py-3 px-4 border-gray-200">
                  <RefreshCw size={14} className="text-gray-400" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-gray-900">Manage API Tokens</p>
                    <p className="text-[10px] text-gray-500">Integrate with research tools</p>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-red-600">
            <Trash2 size={24} className="opacity-80" />
            <div>
              <p className="text-sm font-black uppercase tracking-wider">Danger Zone</p>
              <p className="text-xs text-gray-500 font-medium">Irreversible actions on your agricultural records</p>
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <Button 
              variant="outline" 
              onClick={handleClearData}
              className="flex-1 md:flex-none text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-bold px-8"
            >
              Purge Scan History
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 md:flex-none bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold px-12 gap-2"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Save All Changes
            </Button>
          </div>
        </div>
      </Card>

      <div className="p-4 bg-[#2E7D32]/5 rounded-xl border border-[#2E7D32]/10 flex items-center justify-center gap-6">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Data Controller: WatermelonAI Core v2.4.1</p>
        <div className="h-4 w-px bg-gray-200"></div>
        <p className="text-[10px] font-bold text-[#2E7D32] uppercase tracking-[0.2em]">Storage Status: 1.2GB / 10GB Used</p>
      </div>
    </div>
  );
};
