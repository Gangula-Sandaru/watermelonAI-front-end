import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { Card } from './ui/card';
import { Satellite, Layers, ZoomIn, Download, Plus, Save, X, Search, MapPin, Maximize, Minimize, Trash2, Navigation, Edit2, Check, Loader2, Cloud, CloudRain, AlertTriangle, Info, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap, useMapEvents, CircleMarker, Tooltip, Rectangle } from 'react-leaflet';
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
const MapController = memo(function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom);
  }, [center, zoom, map]);
  return null;
});

// Force Leaflet to update its internal size representation when fullscreen toggles
const MapResizer = memo(function MapResizer({ isFullscreen }: { isFullscreen: boolean }) {
  const map = useMap();
  useEffect(() => {
    const timeout = setTimeout(() => {
      map.invalidateSize();
    }, 300);
    return () => clearTimeout(timeout);
  }, [isFullscreen, map]);
  return null;
});

// Ray-casting algorithm to check if a point is inside a polygon bounding box (fast pre-check)
const isPointInBBox = (lat: number, lng: number, minLat: number, maxLat: number, minLng: number, maxLng: number) => {
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
};

// Full ray-casting polygon test (only called after bbox pre-check passes)
const isPointInPolygon = (point: {lat: number, lng: number}, polygon: {lat: number, lng: number}[]) => {
  const x = point.lng, y = point.lat;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lng, yi = polygon[i].lat;
    const xj = polygon[j].lng, yj = polygon[j].lat;
    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

// Compute polygon bounding box once with safety margin
const getPolygonBBox = (polygon: {lat: number, lng: number}[]) => {
  let minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
  for (const p of polygon) {
    if (p.lat < minLat) minLat = p.lat;
    if (p.lat > maxLat) maxLat = p.lat;
    if (p.lng < minLng) minLng = p.lng;
    if (p.lng > maxLng) maxLng = p.lng;
  }
  const pad = 0.0005; // Safety margin to avoid edge clipping
  return { minLat: minLat - pad, maxLat: maxLat + pad, minLng: minLng - pad, maxLng: maxLng + pad };
};

// Robust pixel color resolver to guarantee every pixel has a color
const resolvePatchColor = (patch: any) => {
  if (patch.is_cloud || patch.status === 'cloud') return '#94a3b8'; // Slate/Cloud
  
  const val = typeof patch.value === 'number' ? patch.value : (typeof patch.ndvi === 'number' ? patch.ndvi : null);
  if (val !== null) {
    if (val < 0.2) return '#ef4444'; // deep red / barren
    if (val < 0.4) return '#ff4b6b'; // red / severe stress
    if (val < 0.6) return '#f59e0b'; // orange / moderate
    if (val < 0.75) return '#84cc16'; // light green / healthy
    return '#2ecc71'; // vibrant green / optimal
  }

  if (patch.color) {
    if (patch.color === 'red') return '#ff4b6b';
    if (patch.color === 'orange') return '#f59e0b';
    if (patch.color === 'green') return '#2ecc71';
    return patch.color;
  }
  
  return '#2ecc71';
};

// Map events to handle drawing
const MapInteraction = memo(function MapInteraction({ isCreating, points, setPoints }: { isCreating: boolean, points: any[], setPoints: any }) {
  useMapEvents({
    click(e) {
      if (isCreating) {
        setPoints((prev: any[]) => [...prev, { lat: e.latlng.lat, lng: e.latlng.lng }]);
      }
    }
  });
  return null;
});

// Helper to guarantee newest scan is always picked
const getLatestScan = (farm: any) => {
  if (!farm?.scans || farm.scans.length === 0) return null;
  return [...farm.scans].sort((a: any, b: any) => {
    const timeA = new Date(a.scan_date).getTime() || 0;
    const timeB = new Date(b.scan_date).getTime() || 0;
    if (timeB !== timeA) return timeB - timeA;
    return (b.id || 0) - (a.id || 0);
  })[0];
};

// Memoized farm overlay (NDVI patches + problem hotspots) — prevents re-render when unrelated state changes
const FarmOverlay = memo(function FarmOverlay({ farm, visibleOverlay, problemHotspots, openCloudWarning, t }: any) {
  const coords = farm.polygon_coordinates || [];
  if (coords.length < 3) return null;

  // Always resolve the absolute latest scan
  const latestScan = useMemo(() => getLatestScan(farm), [farm]);

  const isStressed = latestScan?.status === 'alert' || latestScan?.status === 'stressed';
  let color = '#2ecc71';
  if (isStressed) color = '#ff4b6b';
  else if (latestScan?.status === 'moderate') color = '#f59e0b';

  const polyPositions: [number, number][] = useMemo(
    () => coords.map((p: any) => [p.lat, p.lng]),
    [coords]
  );

  // Bounding box for fast point-in-polygon pre-filtering
  const bbox = useMemo(() => getPolygonBBox(coords), [coords]);

  // Previous scan for change-detection
  const previousScan = farm.scans && farm.scans.length > 1 ? farm.scans[1] : null;
  const isBrandNewScan = !previousScan || (farm.scans && farm.scans.length <= 1);

  const prevPatchMap = useMemo(() => {
    if (!previousScan?.scan_data?.patches) return null;
    const map = new Map<string, { value: number; status: string }>();
    for (const p of previousScan.scan_data.patches) {
      if (typeof p.lat === 'number' && typeof p.lng === 'number') {
        const key = `${p.lat.toFixed(4)}_${p.lng.toFixed(4)}`;
        map.set(key, { value: p.value, status: p.status });
      }
    }
    return map;
  }, [previousScan]);

  // Full NDVI scan overlay from the latest scan
  const ndviRects = useMemo(() => {
    if (!visibleOverlay || !latestScan?.scan_data?.patches) return [];
    return latestScan.scan_data.patches
      .filter((p: any) =>
        isPointInBBox(p.lat, p.lng, bbox.minLat, bbox.maxLat, bbox.minLng, bbox.maxLng) &&
        isPointInPolygon({ lat: p.lat, lng: p.lng }, coords)
      );
  }, [visibleOverlay, latestScan, coords, bbox]);

  // DB problem hotspots - pre-filtered and memoized
  const visibleHotspots = useMemo(() => {
    return problemHotspots.filter((s: any) =>
      isPointInBBox(s.lat, s.lng, bbox.minLat, bbox.maxLat, bbox.minLng, bbox.maxLng) &&
      isPointInPolygon({ lat: s.lat, lng: s.lng }, coords)
    );
  }, [problemHotspots, coords, bbox]);

  const HALF = 0.000045;

  return (
    <React.Fragment>
      <Polygon
        positions={polyPositions}
        pathOptions={{ color, fillColor: color, fillOpacity: 0.15, weight: 2 }}
      >
        <Popup>
          <div className="p-1 min-w-[150px]">
            <h4 className="font-bold text-gray-900 mb-1">{farm.name}</h4>
            {latestScan ? (
              <div>
                <p className="text-sm font-semibold" style={{ color }}>
                  {t('statusLabel')}: {latestScan.status.toUpperCase()}
                </p>
                <p className="text-xs text-gray-600 mt-1">
                  {t('avgNdviIndex')}: {latestScan.ndvi_value.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {t('scannedLabel')}: {new Date(latestScan.scan_date).toLocaleDateString()}
                </p>
                <p className="text-xs mt-2 font-semibold text-gray-700">
                  {t('problemPatches')}: <span className={problemHotspots.length > 0 ? "text-amber-600 font-bold" : "text-green-600 font-bold"}>{problemHotspots.length}</span>
                </p>
                {latestScan?.scan_data?.is_cloudy && (
                  <div
                    onClick={() => openCloudWarning(farm, latestScan)}
                    className="mt-2 p-1.5 bg-amber-50 border border-amber-200 rounded flex items-center gap-1.5 cursor-pointer"
                  >
                    <Cloud className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="text-[10px] font-semibold text-amber-800">
                      {latestScan.scan_data.cloud_coverage_percentage}% {t('cloudCoverLabel')}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500">{t('noScanData')}</p>
            )}
          </div>
        </Popup>
      </Polygon>

      {/* Full NDVI scan overlay with glow-dim pulse on new scans and changed pixels */}
      {ndviRects.map((patch: any, idx: number) => {
        const pixelColor = resolvePatchColor(patch);

        // Condition 1: Brand new scan (first scan on this farm)
        // Condition 2: Re-scan where this specific pixel changed value/status
        let shouldGlow = isBrandNewScan;
        if (!shouldGlow && prevPatchMap) {
          const key = `${patch.lat.toFixed(4)}_${patch.lng.toFixed(4)}`;
          const prev = prevPatchMap.get(key);
          if (prev) {
            const diff = Math.abs(patch.value - prev.value);
            if (diff >= 0.03 || patch.status !== prev.status) {
              shouldGlow = true;
            }
          } else {
            shouldGlow = true;
          }
        }

        return (
          <Rectangle
            key={`ndvi-${farm.id}-${latestScan?.id || 0}-${idx}`}
            bounds={[[patch.lat - HALF, patch.lng - HALF], [patch.lat + HALF, patch.lng + HALF]]}
            pathOptions={{
              color: pixelColor,
              fillColor: pixelColor,
              fillOpacity: shouldGlow ? 0.85 : 0.55,
              weight: shouldGlow ? 1 : 0.5,
              className: shouldGlow ? "ndvi-pixel-glow" : "",
            }}
          >
            <Tooltip direction="top" offset={[0, -10]}>
              <div className="text-xs text-center p-0.5">
                <span className="font-bold" style={{ color: pixelColor }}>
                  NDVI: {typeof patch.value === 'number' ? patch.value.toFixed(4) : patch.value}
                </span>
                <br/>
                <span className="capitalize text-gray-700 dark:text-gray-200">
                  {patch.status || 'Active'}
                </span>
              </div>
            </Tooltip>
          </Rectangle>
        );
      })}

      {/* Active DB problem hotspots (orange/red) */}
      {visibleHotspots.map((spot: any) => (
        <Rectangle
          key={`hs-${spot.id}`}
          bounds={[[spot.lat - HALF, spot.lng - HALF], [spot.lat + HALF, spot.lng + HALF]]}
          pathOptions={{ color: spot.color, fillColor: spot.color, fillOpacity: 0.6, weight: 1 }}
        >
          <Tooltip direction="top" offset={[0, -10]}>
            <div className="text-xs text-center">
              <span className="font-bold" style={{ color: spot.color }}>{spot.name}</span>
              <br />NDVI: {spot.ndvi.toFixed(2)}
            </div>
          </Tooltip>
        </Rectangle>
      ))}
    </React.Fragment>
  );
});

// Memoized Table Row to prevent re-sorting patches and expensive DOM churn
const FarmTableRow = memo(function FarmTableRow({
  farm,
  scanningFarmId,
  openCloudWarning,
  openImageViewer,
  handleRescan,
  t
}: any) {
  const latestScan = useMemo(() => getLatestScan(farm), [farm]);
  const isStressed = latestScan?.status === 'alert' || latestScan?.status === 'stressed';
  const patches = farm.patches || [];

  const activeProblemPatchesCount = useMemo(() => {
    return patches.filter((p: any) => {
      const pScans = p.scans || [];
      const latestPScan = pScans.length > 0 ? pScans[pScans.length - 1] : null;
      return latestPScan ? latestPScan.ndvi_value < 0.6 : false;
    }).length;
  }, [patches]);

  const sortedPatches = useMemo(() => {
    if (!patches.length) return [];
    return [...patches].sort((a, b) => {
      const aLast = a.scans && a.scans.length > 0 ? a.scans[a.scans.length - 1].ndvi_value : 1;
      const bLast = b.scans && b.scans.length > 0 ? b.scans[b.scans.length - 1].ndvi_value : 1;
      return aLast - bLast;
    });
  }, [patches]);

  return (
    <tr className="hover:bg-muted/50 dark:hover:bg-gray-900/50 transition-colors">
      <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">
        {farm.name}
      </td>
      <td className="px-4 py-4">
        {latestScan ? (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${isStressed ? 'text-red-600 bg-red-50 dark:bg-red-900/20' : (latestScan?.status === 'moderate' ? 'text-orange-600 bg-orange-50 dark:bg-orange-900/20' : 'text-green-600 bg-green-50 dark:bg-green-900/20')}`}>
              {latestScan.status.toUpperCase()}
            </span>
            {latestScan?.scan_data && (latestScan.scan_data.is_cloudy || (latestScan.scan_data.cloud_coverage_percentage && latestScan.scan_data.cloud_coverage_percentage >= 20)) && (
              <button 
                onClick={() => openCloudWarning(farm, latestScan)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60 transition-colors border border-amber-300 dark:border-amber-700/50"
                title={t('cloudWarningTitle')}
              >
                <Cloud className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                <span>{latestScan.scan_data.cloud_coverage_percentage}%</span>
              </button>
            )}
          </div>
        ) : <span className="text-gray-400 dark:text-gray-500">-</span>}
      </td>
      <td className="px-4 py-4 font-mono font-medium text-gray-700 dark:text-gray-300">
        {latestScan ? latestScan.ndvi_value.toFixed(2) : '-'}
      </td>
      <td className="px-4 py-4 text-gray-600 dark:text-gray-400">
        {activeProblemPatchesCount > 0 ? (
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 font-bold text-xs">
            {activeProblemPatchesCount}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 font-medium">
            <Check className="w-3.5 h-3.5" /> {t('noneLabel')}
          </span>
        )}
      </td>
      <td className="px-4 py-4">
        {sortedPatches.length > 0 ? (
          <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto pr-2 custom-scrollbar">
            {sortedPatches.map((patch: any) => {
              const history = patch.scans || [];
              const recent = history.slice(-5);
              return (
                <div key={`patch-hist-${patch.id}`} className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-gray-700 dark:text-gray-200 w-16 shrink-0 truncate" title={patch.name}>{patch.name}:</span>
                  <div className="flex items-center gap-1">
                    {recent.map((h: any, i: number) => {
                      const hColor = h.ndvi_value < 0.4 ? 'text-red-600' : (h.ndvi_value < 0.6 ? 'text-orange-500' : 'text-green-600');
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
            className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:text-indigo-400 dark:border-indigo-800 dark:hover:bg-indigo-900/30"
            onClick={() => openImageViewer(farm)}
            title={t('viewSatelliteImage') || "View Satellite Image"}
          >
            <Layers className="w-4 h-4" />
          </Button>
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
});

export function SatelliteMonitoringView() {
  const { t } = useTranslation();
  const [farms, setFarms] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newFarmName, setNewFarmName] = useState('');
  const [points, setPoints] = useState<{lat: number, lng: number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanningFarmId, setScanningFarmId] = useState<string | number | null>(null);
  const [visibleOverlays, setVisibleOverlays] = useState<{[key: string]: boolean}>({});
  
  // UI States
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [editingFarmId, setEditingFarmId] = useState<string | number | null>(null);
  const [editFarmName, setEditFarmName] = useState('');
  const [farmToDelete, setFarmToDelete] = useState<string | number | null>(null);
  const [imageViewerFarm, setImageViewerFarm] = useState<any | null>(null);
  const [farmImages, setFarmImages] = useState<{[key: string]: any}>({});
  const [loadingImage, setLoadingImage] = useState<boolean>(false);
  const [cloudWarningModal, setCloudWarningModal] = useState<{
    isOpen: boolean;
    farmName: string;
    cloudCover: number;
    scanDate?: string;
    warning?: string;
    farmId?: string | number;
    farm?: any;
  } | null>(null);

  const openCloudWarning = useCallback((farm: any, scan?: any) => {
    const latestScan = scan || (farm?.scans && farm.scans.length > 0 ? farm.scans[0] : null);
    setCloudWarningModal({
      isOpen: true,
      farmName: farm?.name || 'Farm',
      cloudCover: latestScan?.scan_data?.cloud_coverage_percentage || 0,
      scanDate: latestScan?.scan_date,
      warning: latestScan?.scan_data?.cloud_warning,
      farmId: farm?.id,
      farm: farm,
    });
  }, []);

  // Map State
  const [mapCenter, setMapCenter] = useState<[number, number]>([7.8731, 80.7718]); // Default to Sri Lanka
  const [mapZoom, setMapZoom] = useState(7);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchFarms = useCallback(async () => {
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
  }, [loading]);

  useEffect(() => {
    fetchFarms();
  }, [fetchFarms]);

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
        polygon_coordinates: points, // array of {lat, lng}
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
        const createdFarm = await response.json();
        setIsCreating(false);
        setPoints([]);
        setNewFarmName('');
        await fetchFarms();
        
        // Auto-center to the new farm on the map
        if (createdFarm && createdFarm.center_lat && createdFarm.center_lng) {
          setMapCenter([createdFarm.center_lat, createdFarm.center_lng]);
          setMapZoom(16);
        }
      } else {
        const errJson = await response.json().catch(() => null);
        const errDetail = errJson ? JSON.stringify(errJson) : await response.text();
        console.error("Failed to save farm:", response.status, errDetail);
        alert(`Failed to save farm (Error ${response.status}): ${errDetail}`);
      }
    } catch (err: any) {
      console.error("Failed to save farm", err);
      alert(`Network error saving farm: ${err?.message || err}`);
    }
  };

  const handleRescan = useCallback(async (id: string | number) => {
    if (scanningFarmId) return; // Prevent multiple scans at once
    setScanningFarmId(id);
    
    // Fly to the farm before scanning
    const farm = farms.find(f => f.id === id);
    if (farm && farm.center_lat && farm.center_lng) {
      setMapCenter([farm.center_lat, farm.center_lng]);
      setMapZoom(18); // Zoom closer to view patches
    }
    
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      
      const response = await fetch(`http://127.0.0.1:8000/api/satellite/farms/${id}/request_scan/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        }
      });
      
      if (response.ok) {
        const scanData = await response.json();
        await fetchFarms();
        // Show the overlay for this farm after scanning
        setVisibleOverlays(prev => ({ ...prev, [id]: true }));

        // Check if the scan result has significant cloud coverage
        const isCloudy = scanData?.scan_data?.is_cloudy || (scanData?.scan_data?.cloud_coverage_percentage && scanData.scan_data.cloud_coverage_percentage >= 20.0);
        if (isCloudy) {
          setCloudWarningModal({
            isOpen: true,
            farmName: farm?.name || 'Farm',
            cloudCover: scanData?.scan_data?.cloud_coverage_percentage || 0,
            scanDate: scanData?.scan_date,
            warning: scanData?.scan_data?.cloud_warning,
            farmId: id,
            farm: farm,
          });
        }
      } else {
        const errorText = await response.text();
        console.error("Scan failed with status:", response.status, errorText);
        alert(`Satellite Scan Failed (Status ${response.status}). Please check the console for details.`);
      }
    } catch (err) {
      console.error("Failed to rescan", err);
    } finally {
      setScanningFarmId(null);
    }
  }, [scanningFarmId, farms, fetchFarms]);

  const handleDeleteFarm = (id: string | number) => {
    setFarmToDelete(id);
  };

  const confirmDeleteFarm = async (id: string | number) => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/satellite/farms/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setFarmToDelete(null);
        fetchFarms();
      }
    } catch (err) {
      console.error("Failed to delete farm", err);
    }
  };

  const handleEditFarmSave = async (id: string | number) => {
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

  const openImageViewer = useCallback(async (farm: any) => {
    setImageViewerFarm(farm);
    
    // If we already fetched it, don't fetch again
    if (farmImages[farm.id]) return;
    
    setLoadingImage(true);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const ndviResponse = await fetch(`http://127.0.0.1:8000/api/satellite/ndvi/`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ polygon_coordinates: farm.polygon_coordinates })
      });
      
      if (ndviResponse.ok) {
        const ndviData = await ndviResponse.json();
        setFarmImages(prev => ({ ...prev, [farm.id]: ndviData }));
      }
    } catch (err) {
      console.error("Failed to fetch satellite image", err);
    } finally {
      setLoadingImage(false);
    }
  }, [farmImages]);

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
                      <div className="flex flex-col min-w-0 pr-2">
                        <h5 className="font-semibold text-sm text-gray-900 dark:text-white truncate cursor-pointer hover:text-[#2ecc71]" onClick={() => handleNavigateToFarm(farm)}>
                          {farm.name}
                        </h5>
                        {(() => {
                          const latestScan = farm.scans && farm.scans.length > 0 ? farm.scans[0] : null;
                          const isCloudy = latestScan?.scan_data?.is_cloudy || (latestScan?.scan_data?.cloud_coverage_percentage && latestScan.scan_data.cloud_coverage_percentage >= 20);
                          if (!isCloudy) return null;
                          return (
                            <button
                              onClick={(e) => { e.stopPropagation(); openCloudWarning(farm, latestScan); }}
                              className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-900/60 w-fit transition-colors border border-amber-200 dark:border-amber-700/50"
                              title={t('cloudWarningTitle')}
                            >
                              <Cloud className="w-2.5 h-2.5 shrink-0" />
                              <span>{latestScan.scan_data.cloud_coverage_percentage}% {t('cloudCoverLabel')}</span>
                            </button>
                          );
                        })()}
                      </div>
                      <div className="flex gap-2 text-gray-400 dark:text-gray-500 shrink-0">
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
        <div className={`relative z-0 rounded-lg overflow-hidden border flex-grow ${isCreating ? 'ring-2 ring-[#ff4b6b]' : ''} ${isFullscreen ? 'h-full' : 'h-[500px]'}`}>
          
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
            <MapResizer isFullscreen={isFullscreen} />
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

            {/* Display all saved farms using memoized FarmOverlay components */}
            {!isCreating && farms.map((farm) => {
              const latestScan = farm.scans && farm.scans.length > 0 ? farm.scans[0] : null;

              // Compute problem hotspots (memoized per farm via FarmOverlay)
              const problemHotspots: any[] = [];
              if (farm.patches && farm.patches.length > 0) {
                for (const patch of farm.patches) {
                  const scans = patch.scans || [];
                  const lastScan = scans.length > 0 ? scans[scans.length - 1] : null;
                  const ndvi = lastScan ? lastScan.ndvi_value : 0.5;
                  if (ndvi >= 0.6) continue; // skip healthy
                  problemHotspots.push({
                    id: patch.id,
                    name: patch.name,
                    lat: patch.center_lat,
                    lng: patch.center_lng,
                    ndvi,
                    color: ndvi < 0.4 ? '#ef4444' : '#f59e0b',
                    category: ndvi < 0.4 ? 'Low (Severe Stress)' : 'Moderate Stress',
                    history: scans,
                  });
                }
              }

              return (
                <FarmOverlay
                  key={farm.id}
                  farm={farm}
                  visibleOverlay={!!visibleOverlays[farm.id]}
                  problemHotspots={problemHotspots}
                  openCloudWarning={openCloudWarning}
                  t={t}
                />
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
                  {farms.map((farm) => (
                    <FarmTableRow
                      key={`table-${farm.id}`}
                      farm={farm}
                      scanningFarmId={scanningFarmId}
                      openCloudWarning={openCloudWarning}
                      openImageViewer={openImageViewer}
                      handleRescan={handleRescan}
                      t={t}
                    />
                  ))}
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

      {/* Satellite Deletion Modal */}
      {farmToDelete !== null && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300 border border-red-100 dark:border-red-900/50 relative">
            {/* Radar/Satellite Header */}
            <div className="h-40 bg-slate-900 relative overflow-hidden flex items-center justify-center">
              {/* Radar sweep effect */}
              <div className="absolute inset-0 border-[50px] border-green-500/10 rounded-full scale-150 animate-[ping_3s_linear_infinite]" />
              <div className="absolute inset-0 border-[25px] border-green-400/20 rounded-full scale-110 animate-[ping_2s_linear_infinite]" />
              
              <Satellite className="w-14 h-14 text-red-500 z-10 animate-pulse" />
              <div className="absolute w-full h-1 bg-red-500/50 blur-[2px] top-1/2 -translate-y-1/2 animate-[spin_4s_linear_infinite] origin-center z-0" />
            </div>

            <div className="p-6 text-center">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('confirmDeleteFarm') || 'Deorbit Farm?'}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Warning: You are about to permanently delete this farm and all its satellite tracking history. This action cannot be reversed.
              </p>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setFarmToDelete(null)}
                >
                  Abort
                </Button>
                <Button 
                  variant="destructive" 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={() => confirmDeleteFarm(farmToDelete)}
                >
                  Confirm Deletion
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Satellite Image Viewer Modal */}
      {imageViewerFarm !== null && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-[95vw] h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200 border border-gray-200 dark:border-gray-800 relative flex flex-col">
            
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Satellite className="w-5 h-5 text-indigo-500" /> 
                  {imageViewerFarm.name} Satellite View
                </h3>
                {farmImages[imageViewerFarm.id] && farmImages[imageViewerFarm.id].datetime && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Captured on: {new Date(farmImages[imageViewerFarm.id].datetime).toLocaleString()}
                  </p>
                )}
                {farmImages[imageViewerFarm.id] && farmImages[imageViewerFarm.id].mean_ndvi !== undefined && (
                  <div className="flex gap-4 mt-2">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded-md">
                      Mean NDVI: {farmImages[imageViewerFarm.id].mean_ndvi.toFixed(4)}
                    </span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded-md">
                      Min NDVI: {farmImages[imageViewerFarm.id].min_ndvi.toFixed(4)}
                    </span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-800 px-2 py-1 rounded-md">
                      Max NDVI: {farmImages[imageViewerFarm.id].max_ndvi.toFixed(4)}
                    </span>
                    {(farmImages[imageViewerFarm.id]?.is_cloudy || (farmImages[imageViewerFarm.id]?.cloud_coverage_percentage && farmImages[imageViewerFarm.id].cloud_coverage_percentage >= 20)) && (
                      <span className="text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 px-2 py-1 rounded-md border border-amber-300 dark:border-amber-700/50 flex items-center gap-1">
                        <Cloud className="w-3.5 h-3.5" />
                        {farmImages[imageViewerFarm.id].cloud_coverage_percentage}% {t('cloudCoverLabel')}
                      </span>
                    )}
                  </div>
                )}
              </div>
              <button onClick={() => setImageViewerFarm(null)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            {/* Cloud Warning Alert Banner in Image Viewer */}
            {(farmImages[imageViewerFarm.id]?.is_cloudy || (farmImages[imageViewerFarm.id]?.cloud_coverage_percentage && farmImages[imageViewerFarm.id].cloud_coverage_percentage >= 20)) && (
              <div className="bg-amber-500/15 dark:bg-amber-900/40 border-b border-amber-200 dark:border-amber-800/60 px-4 py-2.5 flex items-center justify-between text-xs text-amber-900 dark:text-amber-200">
                <div className="flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 animate-pulse" />
                  <span>
                    <strong>{t('cloudWarningTitle')}:</strong> {farmImages[imageViewerFarm.id]?.cloud_coverage_percentage}% {t('cloudCoverLabel').toLowerCase()}. Dense clouds or cloud shadows may obscure vegetation and decrease spectral clarity.
                  </span>
                </div>
              </div>
            )}

            <div className="p-6 bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center flex-grow overflow-hidden">
              {loadingImage ? (
                <div className="flex flex-col items-center justify-center text-indigo-500 h-full">
                  <Loader2 className="w-10 h-10 animate-spin mb-4" />
                  <p className="text-sm font-medium animate-pulse">Establishing uplink to Copernicus Sentinel-2...</p>
                </div>
              ) : (farmImages[imageViewerFarm.id]?.big_image_base64 || farmImages[imageViewerFarm.id]?.latest_image_base64) ? (
                <div className="relative rounded-xl overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl w-full h-full group flex items-center justify-center bg-black/5">
                  <img 
                    src={farmImages[imageViewerFarm.id].big_image_base64 || farmImages[imageViewerFarm.id].latest_image_base64} 
                    alt="Satellite view" 
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs font-mono text-white flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-blue-400" />
                      {farmImages[imageViewerFarm.id].satellite || 'Sentinel-2'} True Color
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center h-full">
                  <Satellite className="w-12 h-12 mb-3 opacity-20" />
                  <p>Could not retrieve satellite imagery for this location.</p>
                  <p className="text-xs mt-1 opacity-70">{farmImages[imageViewerFarm.id]?.image_error || 'No image data available.'}</p>
                </div>
              )}
            </div>
            
          </div>
        </div>
      )}

      {/* Cloud Warning Popup Modal */}
      {cloudWarningModal && cloudWarningModal.isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/75 backdrop-blur-md animate-in fade-in duration-300 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 border border-amber-200 dark:border-amber-900/50 relative flex flex-col">
            
            {/* Atmospheric Cloud Radar Banner Header */}
            <div className="h-44 bg-gradient-to-br from-slate-900 via-sky-950 to-slate-900 relative overflow-hidden flex items-center justify-center">
              {/* Radar rings */}
              <div className="absolute inset-0 border-[40px] border-amber-400/10 rounded-full scale-150 animate-[ping_4s_linear_infinite]" />
              <div className="absolute inset-0 border-[20px] border-sky-400/20 rounded-full scale-110 animate-[ping_3s_linear_infinite]" />
              
              <div className="relative z-10 flex flex-col items-center">
                <div className="p-4 bg-amber-500/20 dark:bg-amber-500/30 rounded-full border border-amber-400/40 backdrop-blur-sm shadow-inner mb-2">
                  <CloudRain className="w-12 h-12 text-amber-400 animate-bounce" />
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 border border-amber-400/40 rounded-full text-amber-300 text-xs font-semibold tracking-wide uppercase">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {t('cloudNoticeModalTitle') || 'Satellite Cloud Advisory'}
                </div>
              </div>

              <button 
                onClick={() => setCloudWarningModal(null)} 
                className="absolute top-3 right-3 p-1.5 bg-black/40 hover:bg-black/60 rounded-full text-gray-300 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <div className="text-center mb-5">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                  {t('cloudWarningTitle')}
                </h3>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
                  {t('cloudWarningSub')}
                </p>
              </div>

              {/* Cloud Cover Metric Card */}
              <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl p-4 mb-4">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-amber-200/60 dark:border-amber-800/40 text-xs">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">{t('farmNamePlaceholder')}:</span>
                  <span className="font-bold text-gray-900 dark:text-white">{cloudWarningModal.farmName}</span>
                </div>
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-amber-200/60 dark:border-amber-800/40 text-xs">
                  <span className="text-gray-600 dark:text-gray-400 font-medium">{t('cloudCoverLabel')}:</span>
                  <span className="font-extrabold text-amber-700 dark:text-amber-400 text-sm flex items-center gap-1.5">
                    <Cloud className="w-4 h-4" /> {cloudWarningModal.cloudCover}%
                  </span>
                </div>
                {cloudWarningModal.scanDate && (
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-600 dark:text-gray-400 font-medium">{t('scannedLabel')}:</span>
                    <span className="text-gray-700 dark:text-gray-300 font-mono">
                      {new Date(cloudWarningModal.scanDate).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Explanation & Advisory */}
              <div className="space-y-2.5 mb-6 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                <p>
                  {cloudWarningModal.warning || t('cloudWarningDesc')}
                </p>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/50 rounded-lg flex items-start gap-2 text-blue-900 dark:text-blue-200">
                  <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <span>{t('cloudWarningAdvice')}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  className="flex-1 bg-[#2ecc71] hover:bg-[#27ae60] text-white font-medium shadow-sm"
                  onClick={() => setCloudWarningModal(null)}
                >
                  <Check className="w-4 h-4 mr-2" />
                  {t('viewResultsAnyway')}
                </Button>
                {cloudWarningModal.farm && (
                  <Button 
                    variant="outline" 
                    className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-900/30"
                    onClick={() => {
                      const farm = cloudWarningModal.farm;
                      setCloudWarningModal(null);
                      openImageViewer(farm);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1.5" />
                    {t('viewSatelliteImage') || "View Satellite Image"}
                  </Button>
                )}
              </div>
            </div>
            
          </div>
        </div>
      )}
    </Card>
  );
}
