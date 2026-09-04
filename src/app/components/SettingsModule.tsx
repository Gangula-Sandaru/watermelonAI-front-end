import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Settings, Globe, Bell, MapPin, Database, Shield, Trash2, Save, RefreshCw, Lock, Loader2, Search, Maximize2, Maximize, Minimize, X as CloseIcon, FileText, CheckCircle2, User, Mail, UserCheck } from 'lucide-react';
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

const COUNTRY_LIST = [
  "Sri Lanka",
  "Afghanistan",
  "Australia",
  "Bangladesh",
  "Brazil",
  "Cambodia",
  "Canada",
  "China",
  "Egypt",
  "France",
  "Germany",
  "Ghana",
  "India",
  "Indonesia",
  "Israel",
  "Italy",
  "Japan",
  "Kenya",
  "Malaysia",
  "Maldives",
  "Mexico",
  "Myanmar",
  "Nepal",
  "Netherlands",
  "New Zealand",
  "Nigeria",
  "Pakistan",
  "Philippines",
  "Saudi Arabia",
  "Singapore",
  "South Africa",
  "South Korea",
  "Spain",
  "Taiwan",
  "Tanzania",
  "Thailand",
  "Turkey",
  "Uganda",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "Vietnam"
];

export const SettingsModule = () => {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Profile states
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [country, setCountry] = useState('Sri Lanka');
  const [bio, setBio] = useState('');
  const [username, setUsername] = useState('');
  const [userRole, setUserRole] = useState('farmer');

  const [dataRetention, setDataRetention] = useState('6months');
  const [location, setLocation] = useState<[number, number]>([7.8731, 80.7718]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [isMapMaximized, setIsMapMaximized] = useState(false);
  const [showPurgeWarning, setShowPurgeWarning] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({ old_password: '', new_password: '' });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Notification states
  const [broadcastAlerts, setBroadcastAlerts] = useState(true);
  const [anonymousSharing, setAnonymousSharing] = useState(true);
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const API_BASE = "http://127.0.0.1:8000/api/settings/";

  useEffect(() => {
    const fetchSettingsAndProfile = async () => {
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };
        
        const [settingsRes, profileRes] = await Promise.all([
          fetch(API_BASE, { headers }),
          fetch('http://127.0.0.1:8000/api/auth/profile/', { headers })
        ]);

        if (settingsRes.status === 401 || profileRes.status === 401) {
          window.dispatchEvent(new CustomEvent('watermelon-auth-error'));
          return;
        }

        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setDataRetention(data.retention_policy);
          setLocation([parseFloat(data.latitude), parseFloat(data.longitude)]);
          localStorage.setItem('default_latitude', String(data.latitude));
          localStorage.setItem('default_longitude', String(data.longitude));
          setBroadcastAlerts(data.broadcast_alerts ?? true);
          localStorage.setItem('broadcast_alerts', String(data.broadcast_alerts ?? true));
          setAnonymousSharing(data.anonymous_data_sharing);
          
          setLanguage(data.language || 'en');
          setTheme(data.theme_preference || 'light');

          localStorage.setItem('language_preference', data.language || 'en');
          window.dispatchEvent(new CustomEvent('watermelon-language-change', { detail: data.language || 'en' }));
          
          if (data.theme_preference === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }

        if (profileRes.ok) {
          const prof = await profileRes.json();
          setDisplayName(prof.display_name || prof.username || '');
          setEmail(prof.email || '');
          setCountry(prof.country || 'Sri Lanka');
          setBio(prof.bio || '');
          setUsername(prof.username || '');
          setUserRole(prof.role || 'farmer');
        }
      } catch (err) {
        console.error("Failed to fetch settings", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettingsAndProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) {
        window.dispatchEvent(new CustomEvent('watermelon-auth-error'));
        return;
      }
      const selectedLangCode = language;
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const settingsPayload = {
        language: selectedLangCode,
        latitude: parseFloat(location[0].toFixed(6)),
        longitude: parseFloat(location[1].toFixed(6)),
        broadcast_alerts: broadcastAlerts,
        anonymous_data_sharing: anonymousSharing,
        retention_policy: dataRetention,
        theme_preference: theme
      };

      const profilePayload: Record<string, string> = {
        display_name: displayName,
        country: country,
        bio: bio
      };
      // Only include email if non-empty — Django's EmailField rejects blank strings
      if (email.trim()) {
        profilePayload.email = email.trim();
      }

      const [settingsRes, profileRes] = await Promise.allSettled([
        fetch(API_BASE, { method: 'PATCH', headers, body: JSON.stringify(settingsPayload) }),
        fetch('http://127.0.0.1:8000/api/auth/profile/', { method: 'PATCH', headers, body: JSON.stringify(profilePayload) })
      ]);

      // Unwrap settled results
      const settingsResult = settingsRes.status === 'fulfilled' ? settingsRes.value : null;
      const profileResult = profileRes.status === 'fulfilled' ? profileRes.value : null;

      if (settingsResult?.status === 401 || profileResult?.status === 401) {
        window.dispatchEvent(new CustomEvent('watermelon-auth-error'));
        return;
      }

      const settingsOk = settingsResult?.ok ?? false;
      const profileOk = profileResult?.ok ?? false;

      // Log errors for debugging
      if (!settingsOk) {
        const body = await settingsResult?.text().catch(() => '');
        console.error(`Settings API failed [${settingsResult?.status}]:`, body);
      }
      if (!profileOk) {
        const body = await profileResult?.text().catch(() => '');
        console.error(`Profile API failed [${profileResult?.status}]:`, body);
      }
      if (settingsRes.status === 'rejected') console.error('Settings fetch threw:', settingsRes.reason);
      if (profileRes.status === 'rejected') console.error('Profile fetch threw:', profileRes.reason);

      if (settingsOk || profileOk) {
        // At least one succeeded — apply local state updates
        if (settingsOk) {
          localStorage.setItem('default_latitude', String(location[0]));
          localStorage.setItem('default_longitude', String(location[1]));
          localStorage.setItem('theme_preference', theme);
          localStorage.setItem('language_preference', selectedLangCode);
          localStorage.setItem('broadcast_alerts', String(broadcastAlerts));
          window.dispatchEvent(new CustomEvent('watermelon-language-change', { detail: selectedLangCode }));
          window.dispatchEvent(new CustomEvent('watermelon-new-scan'));
          window.dispatchEvent(new CustomEvent('watermelon-scans-updated'));
        }

        if (settingsOk && profileOk) {
          toast.success(t('settingsSaved'));
        } else if (settingsOk) {
          toast.success('System settings saved. Profile update failed — please try again.');
        } else {
          toast.success('Profile saved. System settings update failed — please try again.');
        }
      } else {
        toast.error(t('settingsSaveError'));
      }
    } catch (err) {
      console.error('Settings save error:', err);
      toast.error(t('settingsSaveError'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.old_password || !passwordData.new_password) return;
    setIsChangingPassword(true);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/auth/password-change/', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(passwordData)
      });
      const data = await response.json();
      if (response.ok) {
        toast.success(data.message || 'Password changed successfully');
        setShowPasswordForm(false);
        setPasswordData({ old_password: '', new_password: '' });
      } else {
        toast.error(data.old_password?.[0] || data.new_password?.[0] || 'Failed to change password');
      }
    } catch (err) {
      toast.error('Network error. Failed to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleClearData = async () => {
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
        window.dispatchEvent(new CustomEvent('watermelon-new-scan'));
        window.dispatchEvent(new CustomEvent('watermelon-scans-updated'));
        toast.success(t('purgeSuccess'));
      } else {
        toast.error(t('purgeError'));
      }
    } catch (err) {
      toast.error(t('purgeError'));
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
      {/* Account Profile Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-green-100 dark:bg-green-900/30 text-[#2E7D32] dark:text-green-400 flex items-center justify-center font-black text-xl shadow-inner">
              {displayName ? displayName.substring(0, 2).toUpperCase() : (username ? username.substring(0, 2).toUpperCase() : 'US')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-gray-900 dark:text-white text-lg">{displayName || username || 'User Profile'}</h3>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400">
                  {userRole === 'agri_officer' ? 'Agri Officer' : userRole === 'researcher' ? 'Researcher' : userRole === 'admin' ? 'Administrator' : 'Farmer'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('accountSettingsSub')}</p>
            </div>
          </div>
          <User className="w-8 h-8 text-[#2E7D32]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Display Name */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2 flex items-center gap-1.5">
              <User size={14} className="text-[#2E7D32]" /> {t('displayName')}
            </label>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. John Doe"
              className="w-full h-11 px-4 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32]"
            />
          </div>

          {/* Registered Email */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2 flex items-center gap-1.5">
              <Mail size={14} className="text-[#2E7D32]" /> {t('registeredEmail')}
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="farmer@watermelon.ai"
              className="w-full h-11 px-4 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32]"
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2 flex items-center gap-1.5">
              <Globe size={14} className="text-[#2E7D32]" /> {t('country')}
            </label>
            <select 
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full h-11 px-4 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] cursor-pointer"
            >
              {COUNTRY_LIST.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Username (Read Only info) */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2 flex items-center gap-1.5">
              <UserCheck size={14} className="text-[#2E7D32]" /> Username
            </label>
            <input 
              type="text" 
              value={username}
              readOnly
              className="w-full h-11 px-4 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-800/60 text-gray-500 dark:text-gray-400 cursor-not-allowed font-mono"
            />
          </div>

          {/* Bio */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase mb-2 flex items-center gap-1.5">
              <FileText size={14} className="text-[#2E7D32]" /> {t('bio')}
            </label>
            <textarea 
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder={t('bioPlaceholder')}
              rows={3}
              className="w-full p-4 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:border-[#2E7D32] focus:ring-1 focus:ring-[#2E7D32] resize-none"
            />
          </div>
        </div>
      </Card>

      {/* System Settings Card */}
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
                    onChange={(e) => {
                      const newLang = e.target.value;
                      setLanguage(newLang);
                      localStorage.setItem('language_preference', newLang);
                      window.dispatchEvent(new CustomEvent('watermelon-language-change', { detail: newLang }));
                    }}
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
                        localStorage.setItem('theme_preference', 'light');
                        window.dispatchEvent(new CustomEvent('watermelon-theme-change', { detail: 'light' }));
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
                        localStorage.setItem('theme_preference', 'dark');
                        window.dispatchEvent(new CustomEvent('watermelon-theme-change', { detail: 'dark' }));
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
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                <label className="flex items-start justify-between gap-4 group cursor-pointer">
                  <div className="space-y-1">
                    <span className="text-sm text-gray-900 dark:text-gray-200 font-bold block">{t('broadcastAlerts')}</span>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-normal">{t('broadcastAlertsSub')}</p>
                  </div>
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-[#2E7D32] focus:ring-[#2E7D32] bg-white dark:bg-gray-800 cursor-pointer flex-shrink-0 mt-0.5" 
                    checked={broadcastAlerts}
                    onChange={(e) => setBroadcastAlerts(e.target.checked)}
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
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden">
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="w-full justify-start gap-2 h-14 py-0 px-4 rounded-none hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Lock size={14} className="text-gray-400 flex-shrink-0" />
                    <div className="text-left min-w-0">
                      <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{t('changePassword')}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{t('changePasswordSub') || 'Update your security credentials'}</p>
                    </div>
                  </Button>
                  {showPasswordForm && (
                    <form onSubmit={handleChangePassword} className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-3 bg-gray-50 dark:bg-gray-800/50">
                      <input 
                        type="password" 
                        placeholder="Current Password" 
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-sm focus:ring-[#2E7D32]"
                        value={passwordData.old_password}
                        onChange={(e) => setPasswordData({...passwordData, old_password: e.target.value})}
                        required
                      />
                      <input 
                        type="password" 
                        placeholder="New Password" 
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-sm focus:ring-[#2E7D32]"
                        value={passwordData.new_password}
                        onChange={(e) => setPasswordData({...passwordData, new_password: e.target.value})}
                        required
                      />
                      <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => setShowPasswordForm(false)}>Cancel</Button>
                        <Button type="submit" size="sm" disabled={isChangingPassword} className="bg-[#2E7D32] text-white hover:bg-[#1B5E20]">
                          {isChangingPassword ? <Loader2 size={14} className="animate-spin" /> : 'Update'}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => setShowTermsModal(true)}
                  className="justify-start gap-3 h-14 py-0 px-4 border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 hover:border-[#2E7D32]/50 transition-all cursor-pointer"
                >
                  <FileText size={18} className="text-[#2E7D32] flex-shrink-0" />
                  <div className="text-left min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">{t('termsConditions')}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">{t('termsConditionsSub')}</p>
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
              onClick={() => setShowPurgeWarning(true)}
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

      {/* Purge Warning Modal */}
      {showPurgeWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full p-8 shadow-2xl border border-red-100 dark:border-red-900/30 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-6 mx-auto">
              <Trash2 size={32} />
            </div>
            <h2 className="text-2xl font-black text-center text-gray-900 dark:text-white mb-4">Are you absolutely sure?</h2>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-8 font-medium leading-relaxed">
              This action cannot be undone. This will permanently delete your entire scan history, including all diagnostic results and satellite data linked to your account.
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => {
                  setShowPurgeWarning(false);
                  handleClearData();
                }}
                className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold text-base"
              >
                Yes, delete everything
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowPurgeWarning(false)}
                className="w-full h-12 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-base"
              >
                Cancel, keep my data
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Terms & Conditions Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 mb-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-green-100 dark:bg-green-900/30 text-[#2E7D32] dark:text-green-400 rounded-2xl">
                  <FileText size={22} />
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900 dark:text-white">Platform Terms & Conditions</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">WatermelonAI Agricultural Service Policies & Disclaimers</p>
                </div>
              </div>
              <button 
                onClick={() => setShowTermsModal(false)}
                className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
              >
                <CloseIcon size={20} />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto space-y-6 pr-2 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
              <div className="space-y-2 bg-green-50/50 dark:bg-green-950/20 p-4 rounded-2xl border border-green-100 dark:border-green-900/30">
                <div className="flex items-center gap-2 text-[#2E7D32] dark:text-green-400 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 size={16} /> Welcome to WatermelonAI
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  By utilizing the WatermelonAI disease detection system, satellite vegetation monitoring, and regional communications hub, you agree to the terms outlined below.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-gray-900 dark:text-white text-sm">1. Agricultural Advisory & Diagnostic Disclaimer</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  All disease diagnosis results, probability scores, and treatment recommendations provided by the platform are algorithmic decision-support aids. While models are verified against standardized field datasets, on-ground confirmation with your regional Agricultural Extension Officer is recommended before administering broad-spectrum treatments.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-gray-900 dark:text-white text-sm">2. Satellite Remote Sensing & GPS Coordinates</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  Farm boundary polygons and GPS coordinates entered into the system are utilized solely to retrieve multispectral satellite data (NDVI, NDWI) and localized microclimate weather risk indices for your plots. Field coordinates are never publicly disclosed.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-gray-900 dark:text-white text-sm">3. Communications & Expert Consultation Queue</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  Conversations and consultation cases submitted to Agriculture Officers and Researchers are encrypted in transit and stored to ensure continuity of agricultural care. You retain the ability to delete conversation histories at any time from the Communications Hub.
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="font-black text-gray-900 dark:text-white text-sm">4. Data Ownership, Retention & Privacy Controls</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  Farmers retain complete ownership of their diagnostic images and farm data. You may customize your data retention window (30 Days, 6 Months, 1 Year, or Keep Forever) or permanently purge all diagnostic records using the Danger Zone in your settings at any time.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-4 flex justify-between items-center flex-shrink-0">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Version 2.4 • Updated September 2026</span>
              <Button 
                onClick={() => setShowTermsModal(false)}
                className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold px-6 rounded-xl"
              >
                I Understand
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
