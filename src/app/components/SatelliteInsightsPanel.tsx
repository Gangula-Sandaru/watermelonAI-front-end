import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card } from './ui/card';
import {
  Satellite, Download, MapPin, Wifi, WifiOff, RefreshCw, Loader2,
  TriangleAlert, CheckCircle2, TrendingUp, Activity,
  Leaf, Search, Filter,
  ChevronLeft, ChevronRight, BarChart3,
  Layers, Compass, FileSpreadsheet, FileCode, Globe,
  Check, Terminal, CheckSquare, Square, Sparkles
} from 'lucide-react';
import {
  ComposedChart, Area, BarChart, Bar,
  PieChart, Pie, Cell, LabelList,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { useTranslation } from '../utils/translations';

// ── Types ────────────────────────────────────────────────────────────────────
interface FarmRow {
  id: string;
  plot_code?: string;
  parcel_id?: string;
  name: string;
  sector?: string;
  center_lat: number;
  center_lng: number;
  ndvi_score: number | null;
  health_status: string;
  last_scan: string | null;
  patch_count: number;
  scan_count: number;
}

interface NdviHistogramTier {
  tier: string;
  count: number;
  color: string;
  pct: number;
}

interface InsightsData {
  summary: {
    total_farms: number;
    total_scans: number;
    healthy_farms: number;
    moderate_farms: number;
    stressed_farms: number;
    avg_ndvi: number;
    median_ndvi?: number;
    min_ndvi?: number;
    max_ndvi?: number;
    scanned_farms: number;
  };
  ndvi_trend: { month: string; avg_ndvi: number | null; scan_count: number }[];
  health_dist: { name: string; value: number; color: string }[];
  ndvi_histogram?: NdviHistogramTier[];
  top_farms: FarmRow[];
  scan_activity: { day: string; scans: number }[];
}

// ── Column Definition for Customizable Export ────────────────────────────────
interface ColumnDefinition {
  id: string;
  name: string;
  category: 'id' | 'feature' | 'target';
  role: 'Identifier' | 'Feature (X)' | 'Target (y)';
  type: string;
  sample: string;
  description: string;
}

const AVAILABLE_COLUMNS: ColumnDefinition[] = [
  { id: 'sample_id', name: 'Sample ID', category: 'id', role: 'Identifier', type: 'String', sample: 'SCN-48B7C212', description: 'Unique anonymized scan ID' },
  { id: 'parcel_id', name: 'Parcel ID', category: 'id', role: 'Identifier', type: 'String', sample: 'PLT-CD5E19DE', description: 'Unique field parcel identifier' },
  { id: 'scan_timestamp', name: 'Timestamp', category: 'id', role: 'Identifier', type: 'ISO 8601', sample: '2026-09-03T19:31:16Z', description: 'Observation capture date and time' },
  { id: 'latitude', name: 'Latitude', category: 'feature', role: 'Feature (X)', type: 'Float', sample: '7.47506', description: 'Parcel centroid latitude' },
  { id: 'longitude', name: 'Longitude', category: 'feature', role: 'Feature (X)', type: 'Float', sample: '80.42956', description: 'Parcel centroid longitude' },
  { id: 'boundary_vertices', name: 'Boundary Vertices', category: 'feature', role: 'Feature (X)', type: 'Integer', sample: '4', description: 'Count of boundary polygon points' },
  { id: 'ndvi_value', name: 'NDVI Score', category: 'feature', role: 'Feature (X)', type: 'Float', sample: '0.5696', description: 'Normalized difference vegetation index (0.0 to 1.0)' },
  { id: 'problem_patches', name: 'Problem Patches', category: 'feature', role: 'Feature (X)', type: 'Integer', sample: '18', description: 'Ground stress anomaly cluster count' },
  { id: 'day_of_year', name: 'Day of Year', category: 'feature', role: 'Feature (X)', type: 'Integer', sample: '246', description: 'Julian day (1-366) for seasonal cycle' },
  { id: 'month', name: 'Month', category: 'feature', role: 'Feature (X)', type: 'Integer', sample: '9', description: 'Calendar month of observation' },
  { id: 'health_status', name: 'Health Status', category: 'target', role: 'Target (y)', type: 'String', sample: 'moderate', description: 'Categorical label: healthy, moderate, stressed' },
  { id: 'target_class_encoded', name: 'Target Encoded', category: 'target', role: 'Target (y)', type: 'Integer', sample: '1', description: 'Numerical: 0 (Healthy), 1 (Moderate), 2 (Stressed)' },
  { id: 'is_stressed', name: 'Is Stressed (Binary)', category: 'target', role: 'Target (y)', type: 'Binary', sample: '0', description: '1 if NDVI < 0.40, else 0 (Binary target)' },
];

// ── NDVI colour helper ────────────────────────────────────────────────────────
const ndviColor = (score: number | null, tFn?: (k: any) => string) => {
  const healthy  = tFn ? tFn('satNdviHealthyLabel')  : 'Healthy';
  const moderate = tFn ? tFn('satNdviModerateLabel') : 'Moderate';
  const stressed = tFn ? tFn('satNdviStressedLabel') : 'Stressed';
  const noData   = tFn ? tFn('satUnscanned')         : 'No data';
  if (score == null)  return { bar: '#94a3b8', label: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400', dot: 'bg-gray-400', text: noData };
  if (score >= 0.6)   return { bar: '#10b981', label: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500', text: healthy };
  if (score >= 0.4)   return { bar: '#f59e0b', label: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500', text: moderate };
  return { bar: '#ef4444', label: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-500', text: stressed };
};

// ── Tabs ─────────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'farms' | 'export';

// ── Custom Tooltip: NDVI + Scan Count ────────────────────────────────────────
const NdviComboTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const ndvi  = payload.find((p: any) => p.dataKey === 'avg_ndvi');
  const scans = payload.find((p: any) => p.dataKey === 'scan_count');
  return (
    <div className="bg-[#1e293b] text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-white/10">
      <p className="font-bold mb-1">{label}</p>
      {ndvi  && <p style={{ color: '#a78bfa' }}>Avg NDVI: <span className="font-bold">{ndvi.value != null ? ndvi.value.toFixed(3) : '—'}</span></p>}
      {scans && <p style={{ color: '#60a5fa' }}>Scans: <span className="font-bold">{scans.value}</span></p>}
    </div>
  );
};

// ── Custom Pie Label (percentage) ─────────────────────────────────────────────
const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ── Scan Activity bar colour by count ───────────────────────────────────────
const scanBarColor = (scans: number) => {
  if (scans === 0) return '#e2e8f0';
  if (scans === 1) return '#818cf8';
  if (scans === 2) return '#6366f1';
  return '#4f46e5';
};

// ── Client-side CSV Download Helpers ─────────────────────────────────────────
const downloadActivityCSV = (data: { day: string; scans: number }[]) => {
  const header = 'Date,Scans\n';
  const rows = data.map(r => `${r.day},${r.scans}`).join('\n');
  const blob = new Blob([header + rows], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `scan_activity_30days_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

const downloadClientFallbackMLCSV = (plots: FarmRow[], columns: string[]) => {
  const selectedDefs = AVAILABLE_COLUMNS.filter(c => columns.includes(c.id));
  const header = selectedDefs.map(c => c.id).join(',') + '\n';
  const rows = plots.map((p, idx) => {
    const rowObj: Record<string, string | number> = {
      sample_id: `SCN-${p.id.slice(0, 8).toUpperCase()}`,
      parcel_id: p.parcel_id || `PLT-${p.id.slice(0, 6).toUpperCase()}`,
      scan_timestamp: p.last_scan ? new Date(p.last_scan).toISOString() : '',
      latitude: Number(p.center_lat.toFixed(5)),
      longitude: Number(p.center_lng.toFixed(5)),
      boundary_vertices: 4,
      ndvi_value: p.ndvi_score != null ? Number(p.ndvi_score.toFixed(4)) : '',
      problem_patches: p.patch_count,
      day_of_year: p.last_scan ? new Date(p.last_scan).getMonth() * 30 + 15 : 180,
      month: p.last_scan ? new Date(p.last_scan).getMonth() + 1 : 6,
      health_status: p.health_status || 'unscanned',
      target_class_encoded: p.health_status === 'healthy' ? 0 : (p.health_status === 'moderate' ? 1 : 2),
      is_stressed: p.ndvi_score != null && p.ndvi_score < 0.40 ? 1 : 0,
    };
    return selectedDefs.map(c => rowObj[c.id] ?? '').join(',');
  }).join('\n');

  const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ml_crop_satellite_custom_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export function SatelliteInsightsPanel() {
  const { t } = useTranslation();
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // ML Export Configuration
  const [exportFmt, setExportFmt] = useState<'csv' | 'json' | 'geojson'>('csv');
  const [exportMode, setExportMode] = useState<'observations' | 'parcels'>('observations');
  const [exportRange, setExportRange] = useState<'all' | '30days' | '7days' | 'thisYear'>('all');

  // Column customization state (ticked columns)
  const [selectedCols, setSelectedCols] = useState<string[]>(AVAILABLE_COLUMNS.map(c => c.id));

  // Search & Filter for Farm Health Table
  const [farmFilter, setFarmFilter] = useState<'all' | 'healthy' | 'moderate' | 'stressed' | 'unscanned'>('all');
  const [farmSearch, setFarmSearch] = useState('');
  const [farmPage, setFarmPage] = useState(1);
  const itemsPerPage = 8;

  const getToken = () =>
    localStorage.getItem('access_token') || localStorage.getItem('token');

  // ── Fetch Insights ───────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const res = await fetch('http://127.0.0.1:8000/api/satellite/insights/', { headers });
      if (res.ok) {
        setInsights(await res.json());
        setLastRefresh(new Date());
      } else {
        setError(true);
      }
    } catch (_) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── ML Dataset Download Handler ──────────────────────────────────────────
  const handleMLDatasetDownload = async (
    fmt: 'csv' | 'json' | 'geojson',
    mode: string,
    range: string,
    colsToExport?: string[]
  ) => {
    setDownloading(fmt);
    setDownloadSuccess(null);
    const activeCols = colsToExport !== undefined ? colsToExport : selectedCols;
    const colsParam = (activeCols && activeCols.length > 0 && activeCols.length < AVAILABLE_COLUMNS.length)
      ? `&columns=${activeCols.join(',')}`
      : '';

    try {
      const token = getToken();
      const res = await fetch(
        `http://127.0.0.1:8000/api/satellite/export/?fmt=${fmt}&range=${range}&mode=${mode}${colsParam}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`Export failed with HTTP ${res.status}`);

      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition') || '';
      const match = disposition.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : `ml_crop_satellite_${mode}_${Date.now()}.${fmt}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      setDownloadSuccess(`Successfully exported ${filename} (${activeCols.length} columns)`);
      setTimeout(() => setDownloadSuccess(null), 4500);
    } catch (e) {
      console.warn('Server export error, fallback to client-side ML dataset generation:', e);
      if (fmt === 'csv' && insights?.top_farms) {
        downloadClientFallbackMLCSV(insights.top_farms, activeCols);
        setDownloadSuccess('Exported ML dataset (client-side generated)');
        setTimeout(() => setDownloadSuccess(null), 4500);
      } else {
        alert('Could not connect to satellite export service. Please check your backend connection.');
      }
    } finally {
      setDownloading(null);
    }
  };

  // Toggle single column checkbox
  const toggleColumn = (colId: string) => {
    setSelectedCols(prev =>
      prev.includes(colId) ? prev.filter(id => id !== colId) : [...prev, colId]
    );
  };

  // ── Derived KPI Values ───────────────────────────────────────────────────
  const s = insights?.summary;
  const kpis = [
    { label: t('satKpiTotalPlots'),    value: s?.total_farms    ?? '—', color: 'text-violet-600',  bg: 'bg-violet-50 dark:bg-violet-900/10',   icon: MapPin },
    { label: t('satKpiTotalScans'),    value: s?.total_scans    ?? '—', color: 'text-blue-600',     bg: 'bg-blue-50 dark:bg-blue-900/10',       icon: Satellite },
    { label: t('satKpiHealthyFields'), value: s?.healthy_farms  ?? '—', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/10', icon: CheckCircle2 },
    { label: t('satKpiStressedFields'),value: s?.stressed_farms ?? '—', color: 'text-red-500',      bg: 'bg-red-50 dark:bg-red-900/10',         icon: TriangleAlert },
    { label: t('satKpiAvgNdvi'),       value: s?.avg_ndvi != null ? s.avg_ndvi.toFixed(2) : '—', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/10', icon: TrendingUp },
  ];

  // 3 Clear Tabs: Overview / Farm Health / Export for ML Training
  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: t('satTabOverview') },
    { id: 'farms',    label: t('satTabFarms') },
    { id: 'export',   label: t('satTabExport') },
  ];

  const activityData = (insights?.scan_activity ?? []).map(d => ({
    ...d,
    fill: scanBarColor(d.scans),
  }));

  // ── Filtered & Paginated Anonymized Plots ────────────────────────────────
  const filteredPlots = useMemo(() => {
    let list = insights?.top_farms ?? [];
    if (farmFilter !== 'all') {
      if (farmFilter === 'unscanned') {
        list = list.filter(p => p.ndvi_score === null);
      } else {
        list = list.filter(p => {
          if (farmFilter === 'healthy') return (p.ndvi_score ?? 0) >= 0.6;
          if (farmFilter === 'moderate') return (p.ndvi_score ?? 0) >= 0.4 && (p.ndvi_score ?? 0) < 0.6;
          if (farmFilter === 'stressed') return p.ndvi_score !== null && (p.ndvi_score ?? 0) < 0.4;
          return true;
        });
      }
    }
    if (farmSearch.trim()) {
      const q = farmSearch.toLowerCase();
      list = list.filter(p =>
        (p.plot_code && p.plot_code.toLowerCase().includes(q)) ||
        (p.parcel_id && p.parcel_id.toLowerCase().includes(q)) ||
        (p.sector && p.sector.toLowerCase().includes(q))
      );
    }
    return list;
  }, [insights?.top_farms, farmFilter, farmSearch]);

  const totalFarmPages = Math.max(1, Math.ceil(filteredPlots.length / itemsPerPage));
  const paginatedPlots = useMemo(() => {
    const start = (farmPage - 1) * itemsPerPage;
    return filteredPlots.slice(start, start + itemsPerPage);
  }, [filteredPlots, farmPage]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Top Bar: Live Status & Refresh Action ───────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          {!loading && insights && (
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
              {t('satInsightsLive')} {lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-800 dark:hover:text-violet-200 bg-violet-50 dark:bg-violet-900/20 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {t('satRefresh')}
        </button>
      </div>

      {/* ── KPI Strip (Clean 5 Cards) ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className={`p-4 border-none shadow-sm ${k.bg}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{k.label}</p>
                <Icon className={`w-3.5 h-3.5 ${k.color} opacity-70`} />
              </div>
              <p className="text-2xl font-black text-gray-900 dark:text-white">
                {loading ? <Loader2 className="w-5 h-5 animate-spin opacity-40" /> : String(k.value)}
              </p>
            </Card>
          );
        })}
      </div>

      {/* ── Tabs (Overview / Farm Health / Export) ───────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-violet-700 dark:text-violet-300 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Loading ─────────────────────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center h-60 gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">{t('satLoading')}</span>
        </div>
      )}

      {/* ── Error ───────────────────────────────────────────────────────────── */}
      {!loading && error && (
        <div className="flex flex-col items-center justify-center h-48 gap-3 text-gray-400">
          <WifiOff className="w-10 h-10 opacity-20" />
          <p className="text-sm font-medium text-red-500">{t('satErrorMsg')}</p>
          <button
            onClick={fetchAll}
            className="text-xs font-semibold text-violet-600 bg-violet-50 dark:bg-violet-900/20 px-3 py-1.5 rounded-lg hover:bg-violet-100 transition-all"
          >
            {t('satRetry')}
          </button>
        </div>
      )}

      {/* ══════════════════════ 1. OVERVIEW TAB ═════════════════════════════ */}
      {!loading && !error && activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* ── NDVI Monthly Trend + Scan Count (ComposedChart) ── */}
          <Card className="md:col-span-2 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-0.5 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-500" />
              {t('satNdviTrendTitle')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
              {t('satNdviTrendSub')}
            </p>
            <div className="flex items-center gap-4 mb-4 text-[10px] font-semibold text-gray-400">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-violet-500 inline-block rounded-full" />{t('satNdviLegendNdvi')}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-400 rounded-sm inline-block" />{t('satNdviLegendScans')}</span>
              <span className="flex items-center gap-1 text-emerald-500">— {t('satNdviHealthy')}</span>
              <span className="flex items-center gap-1 text-amber-500">— {t('satNdviStressed')}</span>
            </div>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={insights?.ndvi_trend ?? []} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="ndviGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.08} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis
                    yAxisId="ndvi"
                    domain={[0, 1]}
                    axisLine={false} tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    tickFormatter={(v) => v.toFixed(1)}
                    width={32}
                  />
                  <YAxis
                    yAxisId="count"
                    orientation="right"
                    axisLine={false} tickLine={false}
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    allowDecimals={false}
                    width={28}
                  />
                  <Tooltip content={<NdviComboTooltip />} />
                  <ReferenceLine yAxisId="ndvi" y={0.6} stroke="#10b981" strokeDasharray="4 3" strokeWidth={1.2} />
                  <ReferenceLine yAxisId="ndvi" y={0.4} stroke="#f59e0b" strokeDasharray="4 3" strokeWidth={1.2} />
                  <Area
                    yAxisId="ndvi"
                    type="monotone" dataKey="avg_ndvi"
                    stroke="#7c3aed" strokeWidth={2.5}
                    fill="url(#ndviGrad)" name="Avg NDVI"
                    connectNulls dot={{ r: 4, fill: '#7c3aed', strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  />
                  <Bar
                    yAxisId="count"
                    dataKey="scan_count" name="Scans"
                    fill="#93c5fd" opacity={0.6}
                    radius={[3, 3, 0, 0]} barSize={16}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* ── Health Distribution Donut with % labels ── */}
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-0.5 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-500" />
              {t('satHealthDistTitle')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{t('satHealthDistSub')} · {s?.total_farms ?? 0} farms</p>
            {(insights?.health_dist ?? []).every(d => d.value === 0) ? (
              <div className="flex flex-col items-center justify-center h-[190px] text-gray-400 gap-2">
                <WifiOff className="w-8 h-8 opacity-20" />
                <p className="text-xs">{t('satNoFarmData')}</p>
              </div>
            ) : (
              <>
                <div className="h-[190px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={(insights?.health_dist ?? []).filter(d => d.value > 0)}
                        cx="50%" cy="50%"
                        innerRadius={46} outerRadius={76}
                        paddingAngle={3} dataKey="value"
                        labelLine={false}
                        label={<PieLabel />}
                      >
                        {(insights?.health_dist ?? []).filter(d => d.value > 0).map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: 12 }}
                        formatter={(val: any, name: any) => [`${val} farm(s)`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-1.5 mt-1">
                  {(insights?.health_dist ?? []).filter(d => d.value > 0).map(d => {
                    const total = (insights?.health_dist ?? []).reduce((a, x) => a + x.value, 0);
                    const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                    return (
                      <div key={d.name} className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                          {d.name}
                        </span>
                        <span className="font-bold text-gray-900 dark:text-white">{d.value} <span className="font-normal text-gray-400">({pct}%)</span></span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </Card>

          {/* ── Scan Activity — intensity-coloured bars + counts + download ── */}
          <Card className="md:col-span-3 p-6">
            <div className="flex items-start justify-between mb-0.5 gap-2">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  {t('satScanActivityTitle')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t('satScanActivitySub')}</p>
              </div>
              <button
                onClick={() => downloadActivityCSV(insights?.scan_activity ?? [])}
                disabled={!insights || (insights.scan_activity ?? []).length === 0}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 px-3 py-1.5 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                title="Download scan activity as CSV"
              >
                <Download className="w-3.5 h-3.5" />
                {t('satDownloadCSV')}
              </button>
            </div>

            {(() => {
              const data = insights?.scan_activity ?? [];
              const totalScans = data.reduce((sum, r) => sum + r.scans, 0);
              const activeDays = data.filter(r => r.scans > 0).length;
              const peak = data.reduce((max, r) => r.scans > max.scans ? r : max, { day: '—', scans: 0 });
              return (
                <div className="flex items-center gap-6 my-3">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('satTotalScans')}</p>
                    <p className="text-lg font-black text-blue-600 dark:text-blue-400">{totalScans}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('satActiveDays')}</p>
                    <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{activeDays} / 30</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('satPeakDay')}</p>
                    <p className="text-lg font-black text-violet-600 dark:text-violet-400">
                      {peak.scans > 0 ? `${peak.day} (${peak.scans})` : '—'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 font-semibold ml-auto">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#e2e8f0] dark:bg-[#334155] inline-block" />{t('satLegendNone')}</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#818cf8] inline-block" />1</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#6366f1] inline-block" />2</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#4f46e5] inline-block" />3+</span>
                  </div>
                </div>
              );
            })()}

            <div className="h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData} barSize={8} margin={{ top: 16, right: 0, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.07} />
                  <XAxis
                    dataKey="day"
                    axisLine={false} tickLine={false}
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    interval={6}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} width={20} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: 12 }}
                    formatter={(val: any) => [`${val} scan(s)`, 'Scans']}
                  />
                  <Bar dataKey="scans" radius={[3, 3, 0, 0]} name="Scans">
                    {activityData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                    <LabelList
                      dataKey="scans"
                      position="top"
                      style={{ fontSize: 9, fontWeight: 700, fill: '#6366f1' }}
                      formatter={(val: number) => val > 0 ? val : ''}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

        </div>
      )}

      {/* ══════════════════════ 2. FARMS TAB (FARM HEALTH) ═════════════════ */}
      {!loading && !error && activeTab === 'farms' && (
        <div className="space-y-6">

          {/* Top header & macro summary */}
          <Card className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-base">
                  <Layers className="w-5 h-5 text-violet-500" />
                  {t('satFarmCanopyTitle')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {t('satFarmCanopySub')} {s?.total_farms ?? 0} {t('satFarmCanopyParcels')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('export')}
                  className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/30 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-all"
                >
                  <Download className="w-3.5 h-3.5" />
                  {t('satExportMLBtn')}
                </button>
                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  <Wifi className="w-3 h-3" /> {t('satLiveBadge')}
                </span>
              </div>
            </div>

            {/* Statistical Canopy Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/40">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('satMedianNdvi')}</p>
                <p className="text-lg font-black text-violet-600 dark:text-violet-400 mt-0.5">
                  {s?.median_ndvi != null ? s.median_ndvi.toFixed(3) : (s?.avg_ndvi != null ? s.avg_ndvi.toFixed(3) : '—')}
                </p>
                <p className="text-[10px] text-gray-400">{t('satCentralVigor')}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/40">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('satObservedRange')}</p>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {s?.min_ndvi != null && s?.max_ndvi != null ? `${s.min_ndvi.toFixed(2)} – ${s.max_ndvi.toFixed(2)}` : '—'}
                </p>
                <p className="text-[10px] text-gray-400">{t('satMinToMax')}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/40">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('satTotalPatches')}</p>
                <p className="text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
                  {(insights?.top_farms ?? []).reduce((acc, f) => acc + (f.patch_count || 0), 0).toLocaleString()}
                </p>
                <p className="text-[10px] text-gray-400">{t('satGroundStress')}</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/40">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{t('satScanCoverage')}</p>
                <p className="text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5">
                  {s?.total_farms ? `${Math.round((s.scanned_farms / s.total_farms) * 100)}%` : '0%'}
                </p>
                <p className="text-[10px] text-gray-400">{s?.scanned_farms ?? 0} {t('satParcelsOf')} {s?.total_farms ?? 0} {t('satParcels')}</p>
              </div>
            </div>

            {/* ── NDVI Tier Histogram Distribution ── */}
            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                  <BarChart3 className="w-4 h-4 text-violet-500" />
                  {t('satNdviTierTitle')}
                </p>
                <span className="text-[11px] text-gray-400">{t('satMacroSpectrum')}</span>
              </div>

              {/* Stacked bar representation */}
              <div className="w-full h-3.5 rounded-full overflow-hidden flex bg-gray-100 dark:bg-gray-800 mb-3 shadow-inner">
                {(insights?.ndvi_histogram ?? []).map((t, idx) => (
                  t.pct > 0 && (
                    <div
                      key={idx}
                      style={{ width: `${t.pct}%`, backgroundColor: t.color }}
                      title={`${t.tier}: ${t.count} plot(s) (${t.pct}%)`}
                      className="h-full transition-all duration-500 hover:opacity-90"
                    />
                  )
                ))}
              </div>

              {/* Tier breakdown grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                {(insights?.ndvi_histogram ?? []).map((t, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-gray-50/70 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/60">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                      <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-300 truncate" title={t.tier}>
                        {t.tier}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">
                      {t.count} <span className="text-[10px] font-normal text-gray-400">({t.pct}%)</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* ── Anonymized Plots Matrix ── */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
              <div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <Compass className="w-4 h-4 text-violet-500" />
                  {t('satPlotMatrixTitle')}
                </h4>
                <p className="text-xs text-gray-400">
                  {t('satPaginationShowing')} {filteredPlots.length} {t('satPlotMatrixSub')}
                </p>
              </div>

              {/* Search & Filter Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={farmSearch}
                    onChange={(e) => { setFarmSearch(e.target.value); setFarmPage(1); }}
                    placeholder={t('satSearchPlaceholder')}
                    className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-800 dark:text-gray-200 focus:outline-none focus:border-violet-500 w-44"
                  />
                </div>

                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                  <Filter className="w-3 h-3 text-gray-400 ml-1 mr-0.5" />
                  {(['all', 'healthy', 'moderate', 'stressed', 'unscanned'] as const).map(f => {
                    const labelKey = f === 'all' ? 'satFilterAll' : f === 'healthy' ? 'satFilterHealthy' : f === 'moderate' ? 'satFilterModerate' : f === 'stressed' ? 'satFilterStressed' : 'satFilterUnscanned';
                    return (
                      <button
                        key={f}
                        onClick={() => { setFarmFilter(f); setFarmPage(1); }}
                        className={`px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wider transition-all ${
                          farmFilter === f
                            ? 'bg-white dark:bg-gray-700 text-violet-700 dark:text-violet-300 shadow-xs'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                        }`}
                      >
                        {t(labelKey as any)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {filteredPlots.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-44 text-gray-400 gap-2">
                <WifiOff className="w-8 h-8 opacity-25" />
                <p className="text-sm font-medium">{t('satNoMatchParcels')}</p>
                <p className="text-xs">{t('satNoMatchSub')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 text-[10px] uppercase font-bold text-gray-400">
                      <th className="pb-3 pl-2">{t('satColPlotId')}</th>
                      <th className="pb-3 px-3">{t('satColGeoSector')}</th>
                      <th className="pb-3 px-3">{t('satColNdvi')}</th>
                      <th className="pb-3 px-3 text-center">{t('satColStatus')}</th>
                      <th className="pb-3 px-3 text-right">{t('satColPatches')}</th>
                      <th className="pb-3 px-3 text-right">{t('satColScans')}</th>
                      <th className="pb-3 pr-2 text-right">{t('satColLastScan')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {paginatedPlots.map((plot, idx) => {
                      const c = ndviColor(plot.ndvi_score, t);
                      const pct = plot.ndvi_score != null ? Math.round(plot.ndvi_score * 100) : null;
                      const scannedDate = plot.last_scan
                        ? new Date(plot.last_scan).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                        : t('satUnscanned');
                      const code = plot.plot_code || `Plot #${((farmPage - 1) * itemsPerPage) + idx + 1}`;
                      const parcel = plot.parcel_id || `PLT-${plot.id.slice(0, 6).toUpperCase()}`;
                      const sector = plot.sector || `${plot.center_lat.toFixed(2)}N, ${plot.center_lng.toFixed(2)}E`;

                      return (
                        <tr key={plot.id} className="hover:bg-gray-50/80 dark:hover:bg-gray-800/50 transition-colors">
                          <td className="py-3 pl-2">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: c.bar }} />
                              <div>
                                <p className="font-bold text-gray-900 dark:text-white">{code}</p>
                                <p className="font-mono text-[9px] text-gray-400">{parcel}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-mono text-gray-500 dark:text-gray-400">
                            {sector}
                          </td>
                          <td className="py-3 px-3 min-w-[140px]">
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                {pct != null && (
                                  <div
                                    className="h-full rounded-full transition-all"
                                    style={{ width: `${pct}%`, backgroundColor: c.bar }}
                                  />
                                )}
                              </div>
                              <span className="font-bold text-gray-700 dark:text-gray-200 w-10 text-right">
                                {plot.ndvi_score != null ? plot.ndvi_score.toFixed(2) : '—'}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.label}`}>
                              {c.text}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right font-medium text-gray-600 dark:text-gray-300">
                            {plot.patch_count.toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-right text-gray-500">
                            {plot.scan_count}
                          </td>
                          <td className="py-3 pr-2 text-right text-gray-400 text-[11px]">
                            {scannedDate}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Pagination footer */}
                <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500">
                  <p>
                    {t('satPaginationShowing')} {((farmPage - 1) * itemsPerPage) + 1} {t('satPaginationTo')} {Math.min(farmPage * itemsPerPage, filteredPlots.length)} {t('satPaginationOf')} {filteredPlots.length} {t('satPaginationPlots')}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setFarmPage(p => Math.max(1, p - 1))}
                      disabled={farmPage === 1}
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                      {t('satPaginationPage')} {farmPage} {t('satPaginationPageOf')} {totalFarmPages}
                    </span>
                    <button
                      onClick={() => setFarmPage(p => Math.min(totalFarmPages, p + 1))}
                      disabled={farmPage >= totalFarmPages}
                      className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-30 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </Card>

        </div>
      )}

      {/* ══════════════════════ 3. EXPORT TAB (CUSTOMIZABLE ML DATASET) ═════ */}
      {!loading && !error && activeTab === 'export' && (
        <div className="space-y-6">

          {/* Top Banner & Quick Actions */}
          <Card className="p-6">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-base">
                  <Download className="w-5 h-5 text-violet-500" />
                  {t('satExportTitle')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  {t('satExportSub')}
                </p>
              </div>

              {/* Status indicator */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-900/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  {s?.total_scans ?? 0} {t('satScanRecordsReady')}
                </span>
              </div>
            </div>

            {/* Notification alert banner */}
            {downloadSuccess && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{downloadSuccess}</span>
              </div>
            )}

            {/* Top Download Action Bar: Full Pack vs Customized Pack */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-gradient-to-r from-violet-50/70 to-indigo-50/70 dark:from-violet-950/20 dark:to-indigo-950/20 border border-violet-100 dark:border-violet-900/40 mb-6">
              {/* Option A: Full Pack */}
              <div className="flex flex-col justify-between p-3.5 rounded-xl bg-white dark:bg-gray-800/80 border border-violet-200/70 dark:border-violet-800/40 shadow-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h4 className="font-bold text-xs text-gray-900 dark:text-white uppercase tracking-wider">
                      {t('satOptionATitle')}
                    </h4>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {t('satOptionASub')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleMLDatasetDownload(exportFmt, exportMode, exportRange, AVAILABLE_COLUMNS.map(c => c.id))}
                  disabled={!!downloading || loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all shadow hover:shadow-md disabled:opacity-40"
                >
                  {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {t('satFullPackBtn')} · {exportFmt.toUpperCase()})
                </button>
              </div>

              {/* Option B: Customized Pack */}
              <div className="flex flex-col justify-between p-3.5 rounded-xl bg-white dark:bg-gray-800/80 border border-violet-200/70 dark:border-violet-800/40 shadow-xs">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <CheckSquare className="w-4 h-4 text-emerald-500" />
                    <h4 className="font-bold text-xs text-gray-900 dark:text-white uppercase tracking-wider">
                      {t('satOptionBTitle')}
                    </h4>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {t('satOptionBSub')}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleMLDatasetDownload(exportFmt, exportMode, exportRange, selectedCols)}
                  disabled={!!downloading || loading || selectedCols.length === 0}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow hover:shadow-md disabled:opacity-40"
                >
                  {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
                  {t('satCustomPackBtn')} ({selectedCols.length} {t('satTickedColsLabel')} · {exportFmt.toUpperCase()})
                </button>
              </div>
            </div>

            {/* Global Filters: Granularity, Format, Date Range */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/60 mb-6">
              {/* 1. Dataset Type */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 block">
                  {t('satGranularityLabel')}
                </label>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setExportMode('observations')}
                    className={`w-full text-left p-2 rounded-lg border text-xs transition-all ${
                      exportMode === 'observations'
                        ? 'border-violet-600 bg-violet-50/70 dark:bg-violet-900/30 text-violet-900 dark:text-violet-200 font-bold shadow-xs'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{t('satAllObservations')}</span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 dark:bg-violet-800 dark:text-violet-200">{t('satMLRecommended')}</span>
                    </div>
                    <p className="text-[10px] font-normal text-gray-500 dark:text-gray-400 mt-0.5">
                      {t('satAllObsSub')}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportMode('parcels')}
                    className={`w-full text-left p-2 rounded-lg border text-xs transition-all ${
                      exportMode === 'parcels'
                        ? 'border-violet-600 bg-violet-50/70 dark:bg-violet-900/30 text-violet-900 dark:text-violet-200 font-bold shadow-xs'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{t('satPerParcel')}</span>
                    </div>
                    <p className="text-[10px] font-normal text-gray-500 dark:text-gray-400 mt-0.5">
                      {t('satPerParcelSub')}
                    </p>
                  </button>
                </div>
              </div>

              {/* 2. Format Selection */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 block">
                  {t('satFormatLabel')}
                </label>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => setExportFmt('csv')}
                    className={`w-full flex items-center justify-between p-2 rounded-lg border text-xs transition-all ${
                      exportFmt === 'csv'
                        ? 'border-violet-600 bg-violet-50/70 dark:bg-violet-900/30 text-violet-900 dark:text-violet-200 font-bold shadow-xs'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                      {t('satCsvLabel')}
                    </span>
                    <span className="text-[10px] text-gray-400">{t('satCsvSub')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFmt('json')}
                    className={`w-full flex items-center justify-between p-2 rounded-lg border text-xs transition-all ${
                      exportFmt === 'json'
                        ? 'border-violet-600 bg-violet-50/70 dark:bg-violet-900/30 text-violet-900 dark:text-violet-200 font-bold shadow-xs'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FileCode className="w-4 h-4 text-violet-500" />
                      {t('satJsonLabel')}
                    </span>
                    <span className="text-[10px] text-gray-400">{t('satJsonSub')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFmt('geojson')}
                    className={`w-full flex items-center justify-between p-2 rounded-lg border text-xs transition-all ${
                      exportFmt === 'geojson'
                        ? 'border-violet-600 bg-violet-50/70 dark:bg-violet-900/30 text-violet-900 dark:text-violet-200 font-bold shadow-xs'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-amber-500" />
                      {t('satGeojsonLabel')}
                    </span>
                    <span className="text-[10px] text-gray-400">{t('satGeojsonSub')}</span>
                  </button>
                </div>
              </div>

              {/* 3. Temporal Range */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 block">
                  {t('satTemporalLabel')}
                </label>
                <div className="grid grid-cols-2 gap-1.5 mb-2">
                  {([
                    { id: 'all',      label: t('satAllTime') },
                    { id: '30days',   label: t('satLast30') },
                    { id: '7days',    label: t('satLast7') },
                    { id: 'thisYear', label: t('satThisYear') },
                  ] as const).map(r => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setExportRange(r.id)}
                      className={`py-1.5 px-2 text-center rounded-lg border text-xs font-semibold transition-all ${
                        exportRange === r.id
                          ? 'border-violet-600 bg-violet-600 text-white shadow-xs'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>

                <div className="mt-2 text-[11px] text-gray-400 flex items-center justify-between">
                  <span>{t('satSelectedFormat')} <strong className="text-gray-700 dark:text-gray-200">{exportFmt.toUpperCase()}</strong></span>
                  <span>{t('satScope')} <strong className="text-gray-700 dark:text-gray-200">{exportRange}</strong></span>
                </div>
              </div>
            </div>
          </Card>

          {/* ── Interactive Column Customizer ("Put Tik" want columns) ── */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h4 className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-violet-500" />
                  {t('satCustomizeTitle')}
                </h4>
                <p className="text-xs text-gray-400 mt-0.5">
                  {t('satCustomizeSub')} ({selectedCols.length} {t('satOf')} {AVAILABLE_COLUMNS.length} {t('satSelected')})
                </p>
              </div>

              {/* Column Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setSelectedCols(AVAILABLE_COLUMNS.map(c => c.id))}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 hover:bg-violet-100 transition-colors"
                >
                  {t('satPresetSelectAll')}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCols(['latitude', 'longitude', 'ndvi_value', 'problem_patches', 'day_of_year', 'target_class_encoded', 'is_stressed'])}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
                >
                  {t('satPresetMLStandard')}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCols(AVAILABLE_COLUMNS.filter(c => c.category === 'feature').map(c => c.id))}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 hover:bg-blue-100 transition-colors"
                >
                  {t('satPresetFeaturesOnly')}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCols([])}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200 transition-colors"
                >
                  {t('satPresetClearAll')}
                </button>
              </div>
            </div>

            {/* Checkbox Grid Grouped by Category */}
            <div className="space-y-4">
              {/* Group 1: Features (X) */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    {t('satFeatureCols')}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {AVAILABLE_COLUMNS.filter(c => c.category === 'feature').map(col => {
                    const isChecked = selectedCols.includes(col.id);
                    return (
                      <label
                        key={col.id}
                        onClick={() => toggleColumn(col.id)}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'border-blue-500/70 bg-blue-50/50 dark:bg-blue-950/20 text-gray-900 dark:text-white'
                            : 'border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400 hover:bg-gray-100/50'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold truncate text-xs">{col.name}</p>
                          <p className="font-mono text-[10px] text-gray-400 truncate">{col.id}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{col.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Group 2: Target Labels (y) */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    {t('satTargetCols')}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {AVAILABLE_COLUMNS.filter(c => c.category === 'target').map(col => {
                    const isChecked = selectedCols.includes(col.id);
                    return (
                      <label
                        key={col.id}
                        onClick={() => toggleColumn(col.id)}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'border-emerald-500/70 bg-emerald-50/50 dark:bg-emerald-950/20 text-gray-900 dark:text-white'
                            : 'border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400 hover:bg-gray-100/50'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold truncate text-xs">{col.name}</p>
                          <p className="font-mono text-[10px] text-gray-400 truncate">{col.id}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{col.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Group 3: Identifiers */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-violet-500" />
                  <p className="text-[11px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-400">
                    {t('satIdentifiers')}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {AVAILABLE_COLUMNS.filter(c => c.category === 'id').map(col => {
                    const isChecked = selectedCols.includes(col.id);
                    return (
                      <label
                        key={col.id}
                        onClick={() => toggleColumn(col.id)}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'border-violet-500/70 bg-violet-50/50 dark:bg-violet-950/20 text-gray-900 dark:text-white'
                            : 'border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400 hover:bg-gray-100/50'
                        }`}
                      >
                        <div className="mt-0.5 shrink-0">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                          ) : (
                            <Square className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold truncate text-xs">{col.name}</p>
                          <p className="font-mono text-[10px] text-gray-400 truncate">{col.id}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{col.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

        </div>
      )}
    </div>
  );
}
