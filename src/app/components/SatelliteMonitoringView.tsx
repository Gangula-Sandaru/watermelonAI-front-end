import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Satellite, Layers, ZoomIn, Download, Plus, Save, X, Search, MapPin, Maximize, Minimize, Trash2, Navigation, Edit2, Check, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap, useMapEvents, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useTranslation } from '../utils/translations';

// Fix for default marker icons in react-leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Map controller to handle flying to search results
function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// Map events to handle drawing
function MapInteraction({ isCreating, points, setPoints }: { isCreating: boolean, points: any[], setPoints: any }) {
  useMapEvents({
    click(e) {
      if (isCreating) {
        setPoints([...points, { lat: e.latlng.lat, lng: e.latlng.lng }]);
      }
    }
  });
  return null;
}

export function SatelliteMonitoringView() {
  const { t } = useTranslation();
  const [farms, setFarms] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newFarmName, setNewFarmName] = useState('');
  const [points, setPoints] = useState<{lat: number, lng: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanningFarmId, setScanningFarmId] = useState<number | null>(null);
  
  // UI States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editingFarmId, setEditingFarmId] = useState<number | null>(null);
  const [editFarmName, setEditFarmName] = useState('');

  // Map State
  const [mapCenter, setMapCenter] = useState<[number, number]>([7.8731, 80.7718]); // Default to Sri Lanka
  const [mapZoom, setMapZoom] = useState(7);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFarms = async () => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/satellite/farms/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('watermelon-auth-error'));
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setFarms(data);
        
        // Auto-center to the first farm if exists and we're just loading
        if (loading && data.length > 0 && data[0].center_lat) {
          setMapCenter([data[0].center_lat, data[0].center_lng]);
          setMapZoom(14);
        }
      }
    } catch (err) {
      console.error("Failed to fetch farms", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Prevent scroll when fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [isFullscreen]);

  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        setMapZoom(15);
      } else {
        alert(t('locationNotFound'));
      }
    } catch (e) {
      console.error('Search failed', e);
    }
  };

  const handleSaveFarm = async () => {
    if (!newFarmName || points.length < 3) {
      alert(t('drawBoundaryInstructionAlert'));
      return;
    }

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      
      const payload = {
        name: newFarmName,
        polygon_coordinates: points, // now just an array of {lat, lng}
        center_lat: points[0].lat,
        center_lng: points[0].lng
      };

      const response = await fetch('http://127.0.0.1:8000/api/satellite/farms/', {
        method: 'POST',
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
        const newFarm = await response.json();
        
        // Trigger initial scan
        await fetch(`http://127.0.0.1:8000/api/satellite/farms/${newFarm.id}/request_scan/`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        setIsCreating(false);
        setPoints([]);
        setNewFarmName('');
        fetchFarms();
      }
    } catch (err) {
      console.error("Failed to save farm", err);
    }
  };

  const handleRescan = async (id: number) => {
    if (scanningFarmId) return; // Prevent multiple scans at once
    setScanningFarmId(id);
    
    // Fly to the farm before scanning
    const farm = farms.find(f => f.id === id);
    if (farm && farm.center_lat && farm.center_lng) {
      setMapCenter([farm.center_lat, farm.center_lng]);
      setMapZoom(16);
    }
    
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/satellite/farms/${id}/request_scan/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        await fetchFarms();
      }
    } catch (err) {
      console.error("Failed to rescan", err);
    } finally {
      setScanningFarmId(null);
    }
  };

  const handleDeleteFarm = async (id: number) => {
    if (!window.confirm(t('confirmDeleteFarm'))) return;
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/satellite/farms/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        fetchFarms();
      }
    } catch (err) {
      console.error("Failed to delete farm", err);
    }
  };

  const handleEditFarmSave = async (id: number) => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/satellite/farms/${id}/`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: editFarmName })
      });
      if (response.ok) {
        setEditingFarmId(null);
        fetchFarms();
      }
    } catch(err) {
      console.error("Failed to update farm", err);
    }
  };

  const handleNavigateToFarm = (farm: any) => {
    if (farm.center_lat && farm.center_lng) {
      setMapCenter([farm.center_lat, farm.center_lng]);
      setMapZoom(16);
    }
  };

  const cancelCreation = () => {
    setIsCreating(false);
    setPoints([]);
    setNewFarmName('');
  };

  return (
    <Card className={`p-6 bg-card transition-all duration-300 ${isFullscreen ? 'fixed inset-0 z-[9999] rounded-none m-0 h-screen overflow-hidden flex flex-col' : ''}`}>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-4 gap-4 flex-shrink-0">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">{t('satelliteCropMonitoring')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{t('satelliteCropMonitoringSub')}</p>
        </div>
        
        {/* Search Bar */}
        <div className="flex items-center flex-1 max-w-md mx-4">
          <input 
            type="text" 
            placeholder={t('searchLocationPlaceholder')} 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full border dark:border-gray-700 rounded-l-md px-3 py-1.5 text-sm outline-none focus:border-[#2ecc71] bg-card dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          />
          <Button onClick={handleSearch} className="rounded-l-none bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white">
            <Search className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {!isCreating ? (
            <Button onClick={() => setIsCreating(true)} className="bg-[#ff4b6b] hover:bg-[#ff3355] text-white">
              <Plus className="w-4 h-4 mr-2" />
              {t('drawFarmBoundary')}
            </Button>
          ) : (
            <>
              <input 
                type="text" 
                placeholder={t('farmNamePlaceholder')} 
                value={newFarmName}
                onChange={(e) => setNewFarmName(e.target.value)}
                className="border dark:border-gray-700 rounded px-3 py-1.5 text-sm outline-none focus:border-[#2ecc71] bg-card dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
              <Button onClick={handleSaveFarm} className="bg-[#2ecc71] hover:bg-[#27ae60] text-white">
                <Save className="w-4 h-4 mr-2" />
                {t('saveArea')}
              </Button>
              <Button variant="outline" onClick={cancelCreation} className="dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800">
                <X className="w-4 h-4 mr-2" />
                {t('cancel')}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className={`flex flex-col lg:flex-row gap-6 ${isFullscreen ? 'flex-grow min-h-0' : ''}`}>
        
        {/* Farm List Panel */}
        <div className={`flex flex-col bg-card dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm flex-shrink-0 ${isFullscreen ? 'w-80 h-full' : 'w-full lg:w-72 h-[500px]'}`}>
          <div className="p-4 bg-muted/50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#2ecc71]" /> {t('myFarms')}
            </h4>
          </div>
          <div className="overflow-y-auto flex-1 p-3 space-y-3 bg-muted/20 dark:bg-gray-900/30">
            {farms.length === 0 && !loading && (
              <p className="text-sm text-gray-500 p-4 text-center">{t('noFarmsSaved')}</p>
            )}
            {loading && <p className="text-sm text-gray-500 dark:text-gray-400 p-4 text-center">{t('loadingFarms')}</p>}
            {farms.map(farm => (
              <div key={farm.id} className="p-3 border border-gray-200 dark:border-gray-700 bg-card dark:bg-gray-800 rounded-lg hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-3">
                  {editingFarmId === farm.id ? (
                    <div className="flex items-center gap-1 w-full mr-2">
                      <input 
                        autoFocus
                        value={editFarmName} 
                        onChange={(e) => setEditFarmName(e.target.value)}
                        className="text-sm font-semibold border-b border-green-500 outline-none w-full px-1 py-0.5 bg-transparent text-gray-900 dark:text-white"
                      />
                      <button onClick={() => handleEditFarmSave(farm.id)} className="text-green-600 hover:text-green-800 p-1 bg-green-50 dark:bg-green-900/30 rounded">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setEditingFarmId(null)} className="text-gray-400 hover:text-gray-600 p-1">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <h5 className="font-semibold text-sm text-gray-900 dark:text-white truncate pr-2 cursor-pointer hover:text-[#2ecc71]" onClick={() => handleNavigateToFarm(farm)}>
                        {farm.name}
                      </h5>
                      <div className="flex gap-2 text-gray-400 dark:text-gray-500">
                        <button onClick={(e) => { e.stopPropagation(); handleRescan(farm.id); }} disabled={scanningFarmId !== null} className={`${scanningFarmId === farm.id ? 'text-green-500' : 'hover:text-green-500'} p-1 transition-colors`} title={t('requestNewScan')}>
                          {scanningFarmId === farm.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Satellite className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setEditingFarmId(farm.id); setEditFarmName(farm.name); }} className="hover:text-blue-500 p-1 transition-colors" title={t('editFarmName')}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteFarm(farm.id); }} className="hover:text-red-500 p-1 transition-colors" title={t('deleteFarm')}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-xs text-[#2E7D32] dark:text-green-400 bg-green-50/80 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 hover:text-green-800 dark:hover:text-green-300 border border-green-100 dark:border-green-800/50"
                  onClick={() => handleNavigateToFarm(farm)}
                >
                  <Navigation className="w-3.5 h-3.5 mr-1.5" /> {t('navigateToMap')}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Map Area */}
        <div className={`relative rounded-lg overflow-hidden border flex-grow ${isCreating ? 'ring-2 ring-[#ff4b6b]' : ''} ${isFullscreen ? 'h-full' : 'h-[500px]'}`}>
          
          {/* Fullscreen Toggle */}
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="absolute top-4 right-4 z-[1000] p-2 bg-white/95 dark:bg-gray-800/95 backdrop-blur rounded-lg shadow-md hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 transition-all hover:scale-105"
            title={isFullscreen ? t('exitFullscreen') : t('maximizeMap')}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>

          {isCreating && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] p-3 bg-blue-50/95 dark:bg-blue-900/95 backdrop-blur-sm border border-blue-200 dark:border-blue-800 rounded-lg shadow-lg text-blue-800 dark:text-blue-200 text-sm flex items-center">
              <MapPin className="w-4 h-4 mr-2 animate-bounce" />
              <span className="font-medium">{t('clickToDrawBoundary')}</span>
            </div>
          )}

          <MapContainer 
            center={mapCenter} 
            zoom={mapZoom} 
            style={{ height: '100%', width: '100%' }}
            className={isCreating ? "cursor-crosshair" : ""}
          >
            {/* We use Google Satellite Map Tiles */}
            <TileLayer
              url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
              attribution="&copy; Google Maps"
              maxZoom={20}
            />
            
            <MapController center={mapCenter} zoom={mapZoom} />
            <MapInteraction isCreating={isCreating} points={points} setPoints={setPoints} />

                  {/* Display markers for drawing points so user sees feedback immediately */}
            {isCreating && points.map((p, i) => (
              <CircleMarker 
                key={`point-${i}`} 
                center={[p.lat, p.lng]} 
                radius={5} 
                pathOptions={{ color: 'white', fillColor: '#ff4b6b', fillOpacity: 1, weight: 2 }} 
              />
            ))}

            {/* Currently drawing polygon or line */}
            {isCreating && points.length > 1 && (
              <Polygon 
                positions={points.map(p => [p.lat, p.lng])} 
                pathOptions={{ color: '#ff4b6b', fillColor: '#ff4b6b', fillOpacity: 0.3, weight: 3 }} 
              />
            )}

            {/* Display all saved farms */}
            {!isCreating && farms.map((farm) => {
              const coords = farm.polygon_coordinates || [];
              if (coords.length < 3) return null;

              const latestScan = farm.scans && farm.scans.length > 0 ? farm.scans[0] : null;
              let color = '#2ecc71'; // healthy
              const isStressed = latestScan?.status === 'alert' || latestScan?.status === 'stressed';
              
              if (isStressed) color = '#ff4b6b';
              else if (latestScan?.status === 'moderate') color = '#f59e0b';

              const polyPositions = coords.map((p: any) => [p.lat, p.lng]);
              
              // Read circular hotspots directly from the database patches!
              let hotspots: any[] = [];
              if (farm.patches && farm.patches.length > 0) {
                hotspots = farm.patches.map((patch: any) => {
                  // Sort scans by ID (newest last) or assume they are ordered
                  const scans = patch.scans || [];
                  const latestScan = scans.length > 0 ? scans[scans.length - 1] : null;
                  
                  const ndvi = latestScan ? latestScan.ndvi_value : 0.5;
                  
                  return {
                    id: patch.id,
                    name: patch.name,
                    lat: patch.center_lat,
                    lng: patch.center_lng,
                    radius: patch.radius,
                    ndvi: ndvi,
                    category: ndvi < 0.3 ? 'Low (Severe Stress)' : 'Moderate Stress',
                    color: ndvi < 0.3 ? '#ef4444' : '#f59e0b',
                    history: scans
                  };
                });
              }

              return (
                <React.Fragment key={farm.id}>
                  <Polygon 
                    positions={polyPositions}
                    pathOptions={{ color: color, fillColor: color, fillOpacity: 0.15, weight: 2 }}
                  >
                    <Popup>
                      <div className="p-1 min-w-[150px] dark:bg-gray-800 dark:text-white">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-1">{farm.name}</h4>
                        {latestScan ? (
                          <div>
                            <p className="text-sm font-semibold" style={{ color }}>
                              {t('statusLabel')}: {latestScan.status.toUpperCase()}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                              {t('avgNdviIndex')}: {latestScan.ndvi_value.toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {t('scannedLabel')}: {new Date(latestScan.scan_date).toLocaleDateString()}
                            </p>
                            <p className="text-xs mt-2 font-semibold text-gray-700 dark:text-gray-200">{t('problemPatches')}: {hotspots.length}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-500">{t('noScanData')}</p>
                        )}
                      </div>
                    </Popup>
                  </Polygon>
                  
                  {/* Render True Database Circular Hotspots */}
                  {hotspots.map((spot, idx) => (
                    <CircleMarker 
                      key={`hotspot-${farm.id}-${spot.id}`}
                      center={[spot.lat, spot.lng]}
                      radius={spot.radius}
                      pathOptions={{ 
                        color: spot.color, 
                        fillColor: spot.color, 
                        fillOpacity: 0.35, 
                        weight: 2,
                        dashArray: '6, 6'
                      }}
                      className="animate-pulse"
                    >
                      <Popup>
                        <div className="p-1 min-w-[150px] dark:bg-gray-800 dark:text-white">
                          <h4 className="font-bold text-gray-900 dark:text-white mb-1">{spot.name}</h4>
                          <p className="text-sm font-semibold" style={{ color: spot.color }}>
                            {spot.category} (NDVI: {spot.ndvi.toFixed(2)})
                          </p>
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 border-b dark:border-gray-700 pb-1 mb-1">{t('scanHistoryTracker')}</p>
                            <div className="max-h-[100px] overflow-y-auto space-y-1">
                              {spot.history.slice().reverse().map((h: any, i: number) => (
                                <div key={i} className="flex justify-between text-xs">
                                  <span className="text-gray-500 dark:text-gray-400">{t('scanWord')} {spot.history.length - i}</span>
                                  <span className="font-mono font-medium" style={{ color: h.ndvi_value < 0.3 ? '#ef4444' : (h.ndvi_value > 0.6 ? '#2ecc71' : '#f59e0b') }}>
                                    {h.ndvi_value.toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Popup>
                      <Tooltip direction="top" offset={[0, -10]}>
                        <div className="text-xs text-center">
                          <span className="font-bold" style={{ color: spot.color }}>
                            {spot.name}
                          </span>
                          <br/>
                          NDVI: {spot.ndvi.toFixed(2)}
                        </div>
                      </Tooltip>
                    </CircleMarker>
                  ))}
                </React.Fragment>
              );
            })}
          </MapContainer>

          {/* Legend Overlay */}
          <div className="absolute bottom-6 left-6 bg-card/95 dark:bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-lg p-3 z-[1000] border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-semibold mb-2 text-gray-800 dark:text-gray-200">{t('vegetationHealthIndex')}</p>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2.5 rounded-full bg-gradient-to-r from-[#ff4b6b] via-[#f59e0b] to-[#2ecc71]"></div>
            </div>
            <div className="flex justify-between w-32 text-[10px] mt-1 text-gray-600 dark:text-gray-400 font-medium">
              <span>{t('stressed')}</span>
              <span>{t('healthy')}</span>
            </div>
          </div>
        </div>

      </div>

      {!isFullscreen && (
        <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-500" />
              {t('analyticsScanHistory')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('trackPatchRecovery')}</p>
          </div>
          
          <div className="bg-card dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400">
                  <tr>
                    <th className="px-4 py-3 font-semibold">{t('farmNameHeader')}</th>
                    <th className="px-4 py-3 font-semibold">{t('overallStatusHeader')}</th>
                    <th className="px-4 py-3 font-semibold">Avg NDVI</th>
                    <th className="px-4 py-3 font-semibold">{t('identifiedPatchesHeader')}</th>
                    <th className="px-4 py-3 font-semibold">{t('patchHistoryTrackerHeader')}</th>
                    <th className="px-4 py-3 font-semibold">{t('lastScannedHeader')}</th>
                    <th className="px-4 py-3 font-semibold text-right">{t('actionsHeader')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {farms.length === 0 && !loading && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                        {t('noDataDrawBoundary')}
                      </td>
                    </tr>
                  )}
                  {farms.map((farm) => {
                    const latestScan = farm.scans && farm.scans.length > 0 ? farm.scans[0] : null;
                    const isStressed = latestScan?.status === 'alert' || latestScan?.status === 'stressed';
                    const statusColor = isStressed ? 'text-red-600 bg-red-50' : (latestScan?.status === 'moderate' ? 'text-orange-600 bg-orange-50' : 'text-green-600 bg-green-50');
                    const patches = farm.patches || [];
                    
                    return (
                      <tr key={`table-${farm.id}`} className="hover:bg-muted/50 dark:hover:bg-gray-900/50 transition-colors">
                        <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">
                          {farm.name}
                        </td>
                        <td className="px-4 py-4">
                          {latestScan ? (
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isStressed ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : (latestScan?.status === 'moderate' ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' : 'text-green-600 bg-green-50 dark:bg-green-900/20')}`}>
                              {latestScan.status.toUpperCase()}
                            </span>
                          ) : <span className="text-gray-400 dark:text-gray-500">-</span>}
                        </td>
                        <td className="px-4 py-4 font-mono font-medium text-gray-700 dark:text-gray-300">
                          {latestScan ? latestScan.ndvi_value.toFixed(2) : '-'}
                        </td>
                        <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
                          {patches.length > 0 ? (
                            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold text-xs">
                              {patches.length}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">{t('noneLabel')}</span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {patches.length > 0 ? (
                            <div className="flex flex-col gap-2">
                              {patches.map((patch: any) => {
                                const history = patch.scans || [];
                                // take last 5 scans
                                const recent = history.slice(-5);
                                return (
                                  <div key={`patch-hist-${patch.id}`} className="flex items-center gap-2 text-xs">
                                    <span className="font-semibold text-gray-700 dark:text-gray-200 w-16 truncate" title={patch.name}>{patch.name}:</span>
                                    <div className="flex items-center gap-1">
                                      {recent.map((h: any, i: number) => {
                                        const hColor = h.ndvi_value < 0.3 ? 'text-red-600' : (h.ndvi_value > 0.6 ? 'text-green-600' : 'text-orange-500');
                                        return (
                                          <React.Fragment key={i}>
                                            <span className={`font-mono ${hColor}`}>{h.ndvi_value.toFixed(2)}</span>
                                            {i < recent.length - 1 && <span className="text-gray-300">→</span>}
                                          </React.Fragment>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">{t('noPatchesTracked')}</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-xs text-gray-500 dark:text-gray-400">
                          {latestScan ? new Date(latestScan.scan_date).toLocaleDateString() : t('neverLabel')}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-3">
                            {scanningFarmId === farm.id && (
                              <div className="flex items-center text-blue-600 text-xs font-mono animate-pulse">
                                <Satellite className="w-4 h-4 mr-1.5" />
                                {t('uplinkActive')}
                              </div>
                            )}
                             <Button 
                              variant="outline" 
                              size="sm" 
                              disabled={scanningFarmId !== null}
                              onClick={() => handleRescan(farm.id)}
                              className="text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                            >
                              {scanningFarmId === farm.id ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Satellite className="w-3.5 h-3.5 mr-1.5" />}
                              {scanningFarmId === farm.id ? t('scanningButton') : t('rescanButton')}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!isFullscreen && (
        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center flex-shrink-0">
          <p>{t('mapCredits')}</p>
        </div>
      )}
    </Card>
  );
}
