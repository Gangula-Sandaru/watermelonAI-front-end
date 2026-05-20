import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Settings, Globe, Bell, MapPin, Database, Shield, Trash2, Save, RefreshCw, Lock, Loader2, Search, Maximize2, Maximize, Minimize, X as CloseIcon } from 'lucide-react';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTranslation } from '../utils/translations';

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
  const { t } = useTranslation();
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
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const API_BASE = "http://127.0.0.1:8000/api/settings/";

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        const response = await fetch(API_BASE, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.status === 401) {
          window.dispatchEvent(new CustomEvent('watermelon-auth-error'));
          return;
        }
        if (response.ok) {
          const data = await response.json();
          setDataRetention(data.retention_policy);
          setLocation([parseFloat(data.latitude), parseFloat(data.longitude)]);
          setDiseaseAlerts(data.disease_alerts);
          setWeatherWarnings(data.weather_warnings);
          setSystemUpdates(data.system_updates);
          setAnonymousSharing(data.anonymous_data_sharing);
          
          setLanguage(data.language || 'en');
          setTheme(data.theme_preference || 'light');

          // Persist user selected language code locally and dispatch translation update
          localStorage.setItem('language_preference', data.language || 'en');
          window.dispatchEvent(new CustomEvent('watermelon-language-change', { detail: data.language || 'en' }));
          
          // Apply theme immediately
          if (data.theme_preference === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
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
      const selectedLangCode = language;
      
      const payload = {
        language: selectedLangCode,
        latitude: location[0],
        longitude: location[1],
        disease_alerts: diseaseAlerts,
        weather_warnings: weatherWarnings,
        system_updates: systemUpdates,
        retention_policy: dataRetention,
        anonymous_data_sharing: anonymousSharing,
        theme_preference: theme
      };

      const response = await fetch(API_BASE, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('watermelon-auth-error'));
        return;
      }

      if (response.ok) {
        localStorage.setItem('theme_preference', theme);
        localStorage.setItem('language_preference', selectedLangCode);
        
        // Dispatch translation context updates immediately
        window.dispatchEvent(new CustomEvent('watermelon-language-change', { detail: selectedLangCode }));
        
        toast.success(t('settingsSaved'));
      } else {
        toast.error(t('settingsSaveError'));
      }
    } catch (err) {
      toast.error(t('settingsSaveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearData = async () => {
    if (confirm(t('purgeConfirm'))) {
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        const response = await fetch(`${API_BASE}purge-history/`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.status === 401) {
          window.dispatchEvent(new CustomEvent('watermelon-auth-error'));
          return;
        }
        if (response.ok) {
          toast.success(t('purgeSuccess'));
        } else {
          toast.error(t('purgeError'));
        }
      } catch (err) {
        toast.error(t('purgeError'));
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
        toast.error(t('locationNotFound'));
      }
    } catch (e) {
      toast.error(t('searchFailed'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-12 h-12 text-[#2E7D32] animate-spin" />
        <p className="text-gray-500 font-medium animate-pulse">{t('loadingSettings')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('systemSettings')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('settingsSubtitle')}</p>
          </div>
          <Settings className="w-8 h-8 text-[#2E7D32]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Left Column: General & Localization */}
          <div className="space-y-8">
            {/* Language & Region */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Globe size={18} className="text-[#2E7D32]" /> {t('languageRegion')}
              </h4>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('displayLanguage')}</label>
                  <select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm dark:text-gray-200 cursor-pointer"
                  >
                    <option value="en">English (US)</option>
                    <option value="si">සිංහල (Sinhala)</option>
                    <option value="ta">தமிழ் (Tamil)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('displayTheme')}</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setTheme('light');
                        document.documentElement.classList.remove('dark');
                      }}
                      className={`flex-1 h-11 flex items-center justify-center gap-2 rounded-lg border-2 transition-all ${
                        theme === 'light'
                          ? 'border-[#2E7D32] bg-green-50 dark:bg-[#2E7D32]/10 text-[#2E7D32]'
                          : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-white border-2 border-gray-200 shadow-sm flex-shrink-0"></div>
                      <span className="text-xs font-bold truncate">{t('lightMode')}</span>
                    </button>
                    <button
                      onClick={() => {
                        setTheme('dark');
                        document.documentElement.classList.add('dark');
                      }}
                      className={`flex-1 h-11 flex items-center justify-center gap-2 rounded-lg border-2 transition-all ${
                        theme === 'dark'
                          ? 'border-[#2E7D32] bg-green-50 dark:bg-[#2E7D32]/10 text-[#2E7D32]'
                          : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-200 dark:hover:border-gray-600'
                      }`}
                    >
                      <div className="w-4 h-4 rounded-full bg-gray-900 shadow-sm flex-shrink-0"></div>
                      <span className="text-xs font-bold truncate">{t('darkMode')}</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('defaultLocation')}</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        value={`${location[0].toFixed(4)}° N, ${location[1].toFixed(4)}° E`}
                        readOnly
                        className="w-full h-10 pl-10 pr-4 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 cursor-not-allowed font-mono"
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowMap(!showMap)}
                      className={`h-10 gap-2 flex-shrink-0 ${showMap ? 'bg-green-50 border-[#2E7D32] text-[#2E7D32]' : ''}`}
                    >
                      <Maximize2 size={14} className="flex-shrink-0" />
                      <span className="truncate max-w-[120px] text-xs font-bold">{showMap ? t('closeMap') : t('pickOnMap')}</span>
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
                          placeholder={t('searchPlaceholder')}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                          className="flex-1 px-3 py-1.5 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-[#2E7D32] bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                        <Button onClick={handleSearch} size="sm" className="bg-gray-800 hover:bg-gray-700">
                          <Search size={14} />
                        </Button>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <button 
                          onClick={() => setIsMapMaximized(!isMapMaximized)}
                          className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-600 dark:text-gray-300"
                          title={isMapMaximized ? t('minimize') : t('maximize')}
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
                        {isMapMaximized ? t('clickMapHint') : t('clickMapSimple')}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notifications */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Bell size={18} className="text-[#2E7D32]" /> {t('notifications')}
              </h4>
              <div className="space-y-3 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                <label className="flex items-center justify-between group cursor-pointer">
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{t('diseaseDetectionAlerts')}</span>
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#2E7D32] focus:ring-[#2E7D32] bg-white dark:bg-gray-800 cursor-pointer" 
                    checked={diseaseAlerts}
                    onChange={(e) => setDiseaseAlerts(e.target.checked)}
                  />
                </label>
                <label className="flex items-center justify-between group cursor-pointer">
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{t('weatherRiskWarnings')}</span>
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#2E7D32] focus:ring-[#2E7D32] bg-white dark:bg-gray-800 cursor-pointer" 
                    checked={weatherWarnings}
                    onChange={(e) => setWeatherWarnings(e.target.checked)}
                  />
                </label>
                <label className="flex items-center justify-between group cursor-pointer">
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{t('systemStatusUpdates')}</span>
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-[#2E7D32] focus:ring-[#2E7D32] bg-white dark:bg-gray-800 cursor-pointer" 
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
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Database size={18} className="text-[#2E7D32]" /> {t('dataManagement')}
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">{t('historyRetentionPolicy')}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['30days', '6months', '1year', 'forever'].map((policy) => (
                      <button
                        key={policy}
                        onClick={() => setDataRetention(policy)}
                        className={`h-10 px-3 rounded-lg border text-xs font-bold transition-all ${
                          dataRetention === policy
                            ? 'border-[#2E7D32] bg-green-50 dark:bg-[#2E7D32]/10 text-[#2E7D32]'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        {policy === 'forever' ? t('keepForever') : policy === '30days' ? t('policy30Days') : policy === '6months' ? t('policy6Months') : t('policy1Year')}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2 font-medium">{t('archiveDisclaimer')}</p>
                </div>
                
                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30 space-y-3">
                  <label className="flex items-center justify-between group cursor-pointer">
                    <div className="space-y-0.5">
                      <span className="text-sm text-amber-900 dark:text-amber-500 font-bold">{t('anonymousDataSharing')}</span>
                      <p className="text-[10px] text-amber-700/70 dark:text-amber-600/70 leading-tight">{t('anonymousSub')}</p>
                    </div>
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-amber-300 dark:border-amber-800 text-amber-600 focus:ring-amber-500 bg-white dark:bg-gray-900 cursor-pointer" 
                      checked={anonymousSharing}
                      onChange={(e) => setAnonymousSharing(e.target.checked)}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Privacy & API */}
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Shield size={18} className="text-[#2E7D32]" /> {t('privacySecurity')}
              </h4>
              <div className="grid grid-cols-1 gap-3">
                <Button variant="outline" className="justify-start gap-2 h-14 py-0 px-4 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
                  <Lock size={14} className="text-gray-400 flex-shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{t('changePassword')}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{t('changePasswordSub')}</p>
                  </div>
                </Button>
                <Button variant="outline" className="justify-start gap-2 h-14 py-0 px-4 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700">
                  <RefreshCw size={14} className="text-gray-400 flex-shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{t('manageApiTokens')}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{t('manageApiSub')}</p>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-12 pt-8 border-t border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-red-600 dark:text-red-500">
            <Trash2 size={24} className="opacity-80 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-black uppercase tracking-wider">{t('dangerZone')}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">{t('dangerSub')}</p>
            </div>
          </div>
          <div className="flex gap-4 w-full md:w-auto flex-shrink-0">
            <Button 
              variant="outline" 
              onClick={handleClearData}
              className="flex-1 md:flex-none h-12 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 font-bold px-8"
            >
              {t('purgeScanHistory')}
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 md:flex-none h-12 bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold px-12 gap-2"
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {t('saveChanges')}
            </Button>
          </div>
        </div>
      </Card>

      <div className="p-4 bg-[#2E7D32]/5 rounded-xl border border-[#2E7D32]/10 flex items-center justify-center gap-6">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{t('dataController')}: WatermelonAI Core v2.4.1</p>
        <div className="h-4 w-px bg-gray-200"></div>
        <p className="text-[10px] font-bold text-[#2E7D32] uppercase tracking-[0.2em]">{t('storageStatus')}: 1.2GB / 10GB {t('used')}</p>
      </div>
    </div>
  );
};
