import React, { useState, useEffect, useCallback } from 'react';
import { Card } from './ui/card';
import {
  Satellite, Download, MapPin, Wifi, WifiOff, RefreshCw, Loader2,
  TriangleAlert, CheckCircle2, TrendingUp, Activity,
  AlertTriangle, Leaf, Eye
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';

// ── Types ────────────────────────────────────────────────────────────────────
interface FarmRow {
  id: string;
  name: string;
  center_lat: number;
  center_lng: number;
  ndvi_score: number | null;
  health_status: string;
  last_scan: string | null;
  patch_count: number;
  scan_count: number;
}
interface Alert {
  farm_id: string;
  farm_name: string;
  ndvi: number;
  status: string;
  last_scan: string;
  days_ago: number;
  patch_count: number;
}
interface InsightsData {
  summary: {
    total_farms: number;
    total_scans: number;
    healthy_farms: number;
    moderate_farms: number;
    stressed_farms: number;
    avg_ndvi: number;
    scanned_farms: number;
  };
  ndvi_trend: { month: string; avg_ndvi: number | null; scan_count: number }[];
  health_dist: { name: string; value: number; color: string }[];
  top_farms: FarmRow[];
  alerts: Alert[];
  scan_activity: { day: string; scans: number }[];
}

// ── NDVI colour helper ────────────────────────────────────────────────────────
const ndviColor = (score: number | null) => {
  if (score == null)  return { bar: '#94a3b8', label: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400', dot: 'bg-gray-400', text: 'No data' };
  if (score >= 0.6)   return { bar: '#10b981', label: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', dot: 'bg-emerald-500', text: 'Healthy' };
  if (score >= 0.4)   return { bar: '#f59e0b', label: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', dot: 'bg-amber-500', text: 'Moderate' };
  return { bar: '#ef4444', label: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', dot: 'bg-red-500', text: 'Stressed' };
};

// ── Tab type ─────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'farms' | 'alerts' | 'export';

export function SatelliteInsightsPanel() {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [farms, setFarms] = useState<any[]>([]);          // raw /api/satellite/farms/ list (for preview)
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [exportFmt, setExportFmt] = useState<'json' | 'csv' | 'geojson'>('json');
  const [exportRange, setExportRange] = useState<'7days' | '30days' | 'thisYear' | 'all'>('all');

  const getToken = () =>
    localStorage.getItem('access_token') || localStorage.getItem('token');

  // ── Fetch insights + raw farms (for export) ──────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const token = getToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [insRes, farmRes] = await Promise.all([
        fetch('http://127.0.0.1:8000/api/satellite/insights/', { headers }),
        fetch('http://127.0.0.1:8000/api/satellite/farms/', { headers }),
      ]);

      if (insRes.ok) {
        setInsights(await insRes.json());
        setLastRefresh(new Date());
      } else {
        setError(true);
      }
      if (farmRes.ok) setFarms(await farmRes.json());
    } catch (_) {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ── Server-side export (researcher — all farms) ───────────────────────────
  const serverDownload = async (fmt: string, range: string) => {
    setDownloading(fmt);
    try {
      const token = getToken();
      const res = await fetch(
        `http://127.0.0.1:8000/api/satellite/export/?fmt=${fmt}&range=${range}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const contentDisposition = res.headers.get('Content-Disposition') || '';
      const match = contentDisposition.match(/filename="([^"]+)"/);
      const filename = match ? match[1] : `satellite_export_${Date.now()}.${fmt}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export error:', e);
    } finally {
      setDownloading(null);
    }
  };

  // ── Derived values ────────────────────────────────────────────────────────
  const s = insights?.summary;
  const kpis = [
    { label: 'Total Farms',    value: s?.total_farms    ?? '—', color: 'text-violet-600',  bg: 'bg-violet-50 dark:bg-violet-900/10',   icon: MapPin },
    { label: 'Total Scans',    value: s?.total_scans    ?? '—', color: 'text-blue-600',     bg: 'bg-blue-50 dark:bg-blue-900/10',       icon: Satellite },
    { label: 'Healthy Fields', value: s?.healthy_farms  ?? '—', color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/10', icon: CheckCircle2 },
    { label: 'Stressed Fields',value: s?.stressed_farms ?? '—', color: 'text-red-500',      bg: 'bg-red-50 dark:bg-red-900/10',         icon: TriangleAlert },
    { label: 'Avg NDVI',       value: s?.avg_ndvi != null ? s.avg_ndvi.toFixed(2) : '—', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/10', icon: TrendingUp },
    { label: 'Alerts',         value: (insights?.alerts ?? []).length, color: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-900/10', icon: AlertTriangle },
  ];

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'farms',    label: 'Farm Health' },
    { id: 'alerts',   label: `Alerts ${(insights?.alerts?.length ?? 0) > 0 ? `(${insights!.alerts.length})` : ''}` },
    { id: 'export',   label: 'Export' },
  ];

  // ── Tooltip formatter ─────────────────────────────────────────────────────
  const ndviTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-[#1e293b] text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-white/10">
        <p className="font-bold mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {p.value != null ? p.value : '—'}
          </p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">

          <div>


          </div>
        </div>


      </div>

      {/* ── KPI Strip ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <Card key={k.label} className={`p-4 border-none shadow-sm ${k.bg}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{k.label}</p>
                <Icon className={`w-3.5 h-3.5 ${k.color} opacity-70`} />
              </div>
              <p className={`text-2xl font-black ${k.color}`}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin opacity-40" /> : String(k.value)}
              </p>
            </Card>
          );
        })}
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
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

      {/* ── Loading skeleton ───────────────────────────────────────────────── */}
      {loading && (
        <div className="flex items-center justify-center h-60 gap-3 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Fetching satellite analytics…</span>
        </div>
      )}

      {/* ══════════════════════ OVERVIEW TAB ══════════════════════════════ */}
      {!loading && activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* NDVI Monthly Trend */}
          <Card className="md:col-span-2 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-0.5 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-violet-500" />
              NDVI Monthly Trend
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
              Average NDVI across all farms · last 7 months
              {insights && <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1"><span className="w-1 h-1 rounded-full bg-emerald-500 inline-block" />live</span>}
            </p>
            <div className="h-[240px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={insights?.ndvi_trend ?? []}>
                  <defs>
                    <linearGradient id="ndviGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#7c3aed" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.08} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis domain={[0, 1]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => v.toFixed(1)} />
                  <Tooltip content={ndviTooltip} />
                  <Area
                    type="monotone" dataKey="avg_ndvi"
                    stroke="#7c3aed" strokeWidth={2.5}
                    fill="url(#ndviGrad)" name="Avg NDVI"
                    connectNulls dot={{ r: 3, fill: '#7c3aed', strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Health Distribution Pie */}
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-0.5 flex items-center gap-2">
              <Leaf className="w-4 h-4 text-emerald-500" />
              Health Distribution
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Farm status breakdown</p>
            <div className="h-[190px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={(insights?.health_dist ?? []).filter(d => d.value > 0)}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={75}
                    paddingAngle={3} dataKey="value"
                  >
                    {(insights?.health_dist ?? []).filter(d => d.value > 0).map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(insights?.health_dist ?? []).map(d => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                  {d.name} <span className="font-bold text-gray-900 dark:text-white">{d.value}</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Daily Scan Activity */}
          <Card className="md:col-span-3 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-0.5 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              Scan Activity — Last 30 Days
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">Daily satellite scan submissions across all farms</p>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={insights?.scan_activity ?? []} barSize={8}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.08} />
                  <XAxis
                    dataKey="day"
                    axisLine={false} tickLine={false}
                    tick={{ fontSize: 9, fill: '#94a3b8' }}
                    interval={6}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: 12 }} />
                  <Bar dataKey="scans" fill="#7c3aed" radius={[3, 3, 0, 0]} name="Scans" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* ══════════════════════ FARMS TAB ═════════════════════════════════ */}
      {!loading && activeTab === 'farms' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-violet-500" />
                Farm Health Overview
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {s?.scanned_farms ?? 0} scanned · {s?.total_farms ?? 0} total · ranked by NDVI
              </p>
            </div>
            {!error && (
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 px-2.5 py-1 rounded-full flex items-center gap-1.5">
                <Wifi className="w-3 h-3" /> Live
              </span>
            )}
          </div>

          {(insights?.top_farms ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
              <WifiOff className="w-10 h-10 opacity-20" />
              <p className="text-sm font-medium">No farms registered yet</p>
              <p className="text-xs text-center max-w-xs">
                Farms appear here once farmers register their field boundaries in the Satellite Monitoring section.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {(insights?.top_farms ?? []).map((farm, idx) => {
                const c = ndviColor(farm.ndvi_score);
                const pct = farm.ndvi_score != null ? Math.round(farm.ndvi_score * 100) : null;
                const scanned = farm.last_scan
                  ? new Date(farm.last_scan).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
                  : 'Not scanned';
                return (
                  <div key={farm.id} className="p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/50 hover:border-violet-200 dark:hover:border-violet-700 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-[10px] font-bold text-gray-400 w-5">#{idx + 1}</span>
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                        <span className="font-semibold text-sm text-gray-900 dark:text-white truncate">{farm.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.label}`}>{c.text}</span>
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                          {pct != null ? `NDVI ${pct}%` : '—'}
                        </span>
                      </div>
                    </div>
                    {pct != null && (
                      <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct}%`, backgroundColor: c.bar }}
                        />
                      </div>
                    )}
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span>Last scan: {scanned}</span>
                      <span>{farm.patch_count} patch(es) · {farm.scan_count} scan(s)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* ══════════════════════ ALERTS TAB ════════════════════════════════ */}
      {!loading && activeTab === 'alerts' && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h3 className="font-bold text-gray-900 dark:text-white">Stressed Farm Alerts</h3>
            {(insights?.alerts?.length ?? 0) > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                {insights!.alerts.length} CRITICAL
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
            Farms with NDVI below 0.4 — immediate attention required
          </p>

          {(insights?.alerts ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-3">
              <CheckCircle2 className="w-12 h-12 opacity-20 text-emerald-500" />
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">All farms healthy!</p>
              <p className="text-xs">No stressed farms detected in the current dataset.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {insights!.alerts.map((alert, i) => (
                <div
                  key={alert.farm_id}
                  className="flex items-start gap-4 p-4 rounded-xl border-2 border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 hover:border-red-200 dark:hover:border-red-800 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                    <TriangleAlert className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{alert.farm_name}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        NDVI {(alert.ndvi * 100).toFixed(0)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Status: <span className="font-semibold text-red-600 capitalize">{alert.status}</span>
                      {' · '}{alert.days_ago === 0 ? 'Scanned today' : `${alert.days_ago}d ago`}
                      {' · '}{alert.patch_count} problem patch(es)
                    </p>
                    {/* Mini NDVI bar */}
                    <div className="w-full h-1.5 bg-red-100 dark:bg-red-900/30 rounded-full overflow-hidden mt-2">
                      <div
                        className="h-full bg-red-500 rounded-full transition-all duration-700"
                        style={{ width: `${alert.ndvi * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* ══════════════════════ EXPORT TAB ════════════════════════════════ */}
      {!loading && activeTab === 'export' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

          {/* Farm preview list */}
          <Card className="md:col-span-2 p-6 flex flex-col">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
              <Eye className="w-4 h-4 text-violet-500" />
              Export Preview
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
              System-wide: {insights?.summary.total_farms ?? '—'} farm(s) with NDVI scores, polygon boundaries &amp; disease patches
            </p>
            {(insights?.top_farms ?? []).length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-gray-400 gap-2">
                <WifiOff className="w-8 h-8 opacity-20" />
                <p className="text-sm">No farm data available to export</p>
              </div>
            ) : (
              <div className="relative flex-1 min-h-0">
                <div
                  className="h-full max-h-[340px] overflow-y-auto space-y-2.5 pr-2"
                  style={{ scrollbarWidth: 'thin', scrollbarColor: '#d1d5db transparent' }}
                >
                  {(insights?.top_farms ?? []).map(farm => {
                    const c = ndviColor(farm.ndvi_score);
                    return (
                      <div key={farm.id} className="p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.dot}`} />
                          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{farm.name}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${c.label}`}>{c.text}</span>
                          <span className="text-xs text-gray-500">{farm.patch_count} patches</span>
                          <span className="text-xs text-gray-500">{farm.scan_count} scans</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Bottom fade hint */}
                <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white dark:from-gray-900 to-transparent rounded-b-xl" />
              </div>
            )}
          </Card>

          {/* Export controls */}
          <Card className="p-6 flex flex-col gap-5">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-violet-500" />
                Export for AI Training
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                Download all system-wide farm &amp; NDVI data in research-ready formats.
              </p>
            </div>

            {/* Format selector */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">Format</p>
              <div className="grid grid-cols-3 gap-2">
                {(['json', 'csv', 'geojson'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setExportFmt(f)}
                    className={`py-2 rounded-lg border text-[11px] font-bold transition-all ${
                      exportFmt === f
                        ? 'border-violet-600 bg-violet-600 text-white'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-violet-900/10'
                    }`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Date range selector */}
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">Date Range</p>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { id: 'all',      label: 'All Time' },
                  { id: '30days',   label: 'Last 30 Days' },
                  { id: '7days',    label: 'Last 7 Days' },
                  { id: 'thisYear', label: 'This Year' },
                ] as const).map(r => (
                  <button
                    key={r.id}
                    onClick={() => setExportRange(r.id)}
                    className={`py-2 rounded-lg border text-[11px] font-bold transition-all ${
                      exportRange === r.id
                        ? 'border-violet-600 bg-violet-600 text-white'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-violet-50 dark:hover:bg-violet-900/10'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Download button */}
            <button
              onClick={() => serverDownload(exportFmt, exportRange)}
              disabled={!!downloading || loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-all shadow hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {downloading === exportFmt
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Download className="w-4 h-4" />}
              Download {exportFmt.toUpperCase()}
            </button>

            {/* Separator: per-format quick download buttons */}
            <div className="pt-1 border-t border-gray-100 dark:border-gray-700">
              <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">Quick Download (All Time)</p>
              <div className="space-y-2">
                {([
                  { key: 'json',    label: 'JSON Dataset',     sub: 'Full metadata · AI-ready',          bg: 'bg-violet-600' },
                  { key: 'csv',     label: 'CSV Spreadsheet',  sub: 'Tabular NDVI · Excel compatible',    bg: 'bg-emerald-600' },
                  { key: 'geojson', label: 'GeoJSON Polygons', sub: 'Farm boundaries · GIS & mapping',    bg: 'bg-amber-500' },
                ] as const).map(btn => (
                  <button
                    key={btn.key}
                    onClick={() => serverDownload(btn.key, 'all')}
                    disabled={!!downloading || loading}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <div className={`w-7 h-7 rounded-md ${btn.bg} flex items-center justify-center flex-shrink-0`}>
                      {downloading === btn.key
                        ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                        : <Download className="w-3.5 h-3.5 text-white" />}
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{btn.label}</p>
                      <p className="text-[10px] text-gray-500 truncate">{btn.sub}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center">
              <p className="text-[10px] text-gray-400 leading-relaxed">
                {loading ? 'Loading data…' : `${insights?.summary.total_farms ?? 0} farms · all registered users · researcher access`}
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
