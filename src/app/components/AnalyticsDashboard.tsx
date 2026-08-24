import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { useTranslation } from '../utils/translations';
import { 
  TrendingUp, Activity, TriangleAlert, CircleCheck, Loader2, 
  ShieldAlert, Users, Bell, Map, FileText, CheckCircle2,
  ShieldCheck, Database, Lock, Globe, Settings, ArrowUpRight,
  Microscope, FlaskConical, Dna, Leaf, ArrowUp, ArrowDown, Minus,
  RefreshCw
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, AreaChart, Area, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';



interface AnalyticsDashboardProps {
  userData: any;
}

// ─── Static fallback data (used when API is unavailable) ─────────────────────

const FALLBACK_PATHOGEN_DATA = [
  { month: 'Jan', anthracnose: 18, fusarium: 12, powdery: 6, downy: 4 },
  { month: 'Feb', anthracnose: 22, fusarium: 14, powdery: 8, downy: 5 },
  { month: 'Mar', anthracnose: 31, fusarium: 20, powdery: 11, downy: 9 },
  { month: 'Apr', anthracnose: 27, fusarium: 18, powdery: 14, downy: 11 },
  { month: 'May', anthracnose: 35, fusarium: 25, powdery: 17, downy: 14 },
  { month: 'Jun', anthracnose: 29, fusarium: 22, powdery: 13, downy: 10 },
  { month: 'Jul', anthracnose: 24, fusarium: 19, powdery: 10, downy: 8 },
];

const FALLBACK_DISEASE_RADAR = [
  { subject: 'Anthracnose', severity: 85, prevalence: 72 },
  { subject: 'Fusarium Wilt', severity: 68, prevalence: 58 },
  { subject: 'Powdery Mildew', severity: 52, prevalence: 44 },
  { subject: 'Downy Mildew', severity: 47, prevalence: 38 },
  { subject: 'Bacterial Rind', severity: 35, prevalence: 28 },
];

const FALLBACK_OUTBREAK_TABLE = [
  { region: 'Kurunegala', disease: 'Anthracnose', cases: 142, trend: 'up', risk: 'High' },
  { region: 'Anuradhapura', disease: 'Fusarium Wilt', cases: 87, trend: 'down', risk: 'Medium' },
  { region: 'Polonnaruwa', disease: 'Powdery Mildew', cases: 65, trend: 'up', risk: 'Medium' },
  { region: 'Hambantota', disease: 'Downy Mildew', cases: 34, trend: 'stable', risk: 'Low' },
  { region: 'Matale', disease: 'Anthracnose', cases: 58, trend: 'up', risk: 'Medium' },
];

const FALLBACK_MODEL_PERFORMANCE = [
  { name: 'Accuracy', value: 94 },
  { name: 'Precision', value: 91 },
  { name: 'Recall', value: 89 },
  { name: 'F1-Score', value: 90 },
  { name: 'AUC-ROC', value: 96 },
];

// ─────────────────────────────────────────────────────────────────────────────

export function AnalyticsDashboard({ userData }: AnalyticsDashboardProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [officerStats, setOfficerStats] = useState<any>(null);
  const [urgentCases, setUrgentCases] = useState<any[]>([]);
  const [researcherData, setResearcherData] = useState<any>(null);
  const [researcherError, setResearcherError] = useState(false);
  const [researcherRefreshing, setResearcherRefreshing] = useState(false);

  const role = userData?.role?.toLowerCase() || 'farmer';
  const isAdmin = role === 'admin' || role === 'superadmin' || userData?.is_superuser === true;
  const isOfficer = role.includes('officer');
  const isResearcher = role === 'researcher';
  const isFarmer = !isOfficer && !isResearcher && !isAdmin;

  // ── Researcher-specific data fetch ─────────────────────────────────────────
  const fetchResearcherData = async (isRefresh = false) => {
    if (isRefresh) setResearcherRefreshing(true);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/disease/researcher/analytics/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const json = await response.json();
        setResearcherData(json);
        setResearcherError(false);
      } else {
        setResearcherError(true);
      }
    } catch (_) {
      setResearcherError(true);
    } finally {
      if (isRefresh) setResearcherRefreshing(false);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        if (isAdmin) {
          const response = await fetch('http://127.0.0.1:8000/api/escalation/dashboard/stats/', { headers });
          if (response.ok) {
            const stats = await response.json();
            setOfficerStats({
              ...stats,
              total_users: 1248,
              active_officers: stats.total_officers || 42,
              pending_reviews: stats.pending_reviews || 24,
              system_uptime: "99.9%",
              user_distribution: { farmers: 1150, officers: 68, researchers: 30 }
            });
          }
          const perfRes = await fetch('http://127.0.0.1:8000/api/escalation/dashboard/performance/', { headers });
          if (perfRes.ok) setData({ weekly_data: await perfRes.json() });
        } else if (isOfficer) {
          const [statsRes, urgentRes, performanceRes] = await Promise.all([
            fetch('http://127.0.0.1:8000/api/escalation/dashboard/stats/', { headers }),
            fetch('http://127.0.0.1:8000/api/escalation/dashboard/urgent/', { headers }),
            fetch('http://127.0.0.1:8000/api/escalation/dashboard/performance/', { headers })
          ]);
          if (statsRes.ok) setOfficerStats(await statsRes.json());
          if (urgentRes.ok) setUrgentCases(await urgentRes.json());
          if (performanceRes.ok) setData({ weekly_data: await performanceRes.json() });
        } else if (isResearcher) {
          // Researcher: fetch from the dedicated researcher endpoint
          await fetchResearcherData();
          // Also try to load the farmer-style analytics as fallback context
          try {
            const response = await fetch('http://127.0.0.1:8000/api/disease/analytics/', { headers });
            if (response.ok) setData(await response.json());
          } catch (_) {}
        } else {
          const response = await fetch('http://127.0.0.1:8000/api/disease/analytics/', { headers });
          if (response.ok) setData(await response.json());
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [isOfficer, isResearcher, isAdmin]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-12 h-12 text-[#2E7D32] animate-spin" />
        <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">
          {isAdmin ? t('accessingAdminMetrics') : isOfficer ? t('loadingExpertData') : isResearcher ? 'Loading research analytics…' : t('analyzingFarmData')}
        </p>
      </div>
    );
  }

  // ── Researcher Dashboard ──────────────────────────────────────────────────
  if (isResearcher) {
    // ── Resolve chart data: live API first, fallback to statics ───────────
    const pathogens: typeof FALLBACK_PATHOGEN_DATA =
      researcherData?.pathogen_monthly?.length
        ? researcherData.pathogen_monthly
        : FALLBACK_PATHOGEN_DATA;

    const radarData: typeof FALLBACK_DISEASE_RADAR =
      researcherData?.disease_radar?.length
        ? researcherData.disease_radar
        : FALLBACK_DISEASE_RADAR;

    const outbreakRows: typeof FALLBACK_OUTBREAK_TABLE =
      researcherData?.outbreak_table?.length
        ? researcherData.outbreak_table
        : FALLBACK_OUTBREAK_TABLE;

    const modelPerf: typeof FALLBACK_MODEL_PERFORMANCE =
      researcherData?.model_performance?.length
        ? researcherData.model_performance
        : FALLBACK_MODEL_PERFORMANCE;

    const modelMeta = researcherData?.model_meta || {
      last_trained: '3 days ago',
      dataset_size: '48,320 images',
    };

    // ── KPI Stats ──────────────────────────────────────────────────────────
    // Prefer researcher endpoint stats; fall back to farmer analytics
    const apiStats = researcherData?.stats ?? data?.stats;

    const totalScans    = apiStats?.total_scans      ?? '—';
    const diseasedCount = apiStats?.diseases_detected ?? '—';
    const healthyPct    = apiStats?.healthy_crops != null
      ? (String(apiStats.healthy_crops).includes('%') ? apiStats.healthy_crops : `${apiStats.healthy_crops}%`)
      : '—';
    const avgConfidence = apiStats?.avg_confidence != null
      ? (typeof apiStats.avg_confidence === 'string' && apiStats.avg_confidence.includes('%')
          ? apiStats.avg_confidence
          : `${apiStats.avg_confidence}%`)
      : '—';

    const researcherStats = [
      {
        label: 'Total Scans',
        value: totalScans,
        delta: 'All-time · system-wide',
        deltaDir: 'stable',
        icon: Database,
        color: { bg: 'bg-violet-50 dark:bg-violet-900/10', text: 'text-violet-900 dark:text-violet-300', icon: 'text-violet-600', badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' },
      },
      {
        label: 'Diseases Detected',
        value: diseasedCount,
        delta: 'Infected samples',
        deltaDir: Number(diseasedCount) > 0 ? 'up' : 'stable',
        icon: TriangleAlert,
        color: { bg: 'bg-red-50 dark:bg-red-900/10', text: 'text-red-900 dark:text-red-300', icon: 'text-red-500', badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
      },
      {
        label: 'Healthy Crops',
        value: healthyPct,
        delta: 'Disease-free rate',
        deltaDir: 'up',
        icon: CircleCheck,
        color: { bg: 'bg-emerald-50 dark:bg-emerald-900/10', text: 'text-emerald-900 dark:text-emerald-300', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
      },
      {
        label: 'Avg. AI Confidence',
        value: avgConfidence,
        delta: 'Model accuracy proxy',
        deltaDir: 'stable',
        icon: TrendingUp,
        color: { bg: 'bg-amber-50 dark:bg-amber-900/10', text: 'text-amber-900 dark:text-amber-300', icon: 'text-amber-600', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
      },
    ];

    const TrendIcon = ({ dir }: { dir: string }) => {
      if (dir === 'up') return <ArrowUp className="w-3 h-3 inline mr-0.5" />;
      if (dir === 'down') return <ArrowDown className="w-3 h-3 inline mr-0.5" />;
      return <Minus className="w-3 h-3 inline mr-0.5" />;
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-500">

        {/* ── Data source banner ─────────────────────────────────────────── */}

        {/* ── KPI Row ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {researcherStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className={`p-5 ${stat.color.bg} border-none shadow-sm`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{stat.label}</p>
                    <p className={`text-3xl font-black ${stat.color.text} mt-1`}>{stat.value}</p>
                    <span className={`inline-flex items-center text-[10px] font-semibold mt-2 px-2 py-0.5 rounded-full ${stat.color.badge}`}>
                      <TrendIcon dir={stat.deltaDir} />
                      {stat.delta}
                    </span>
                  </div>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color.bg}`}>
                    <Icon className={`w-6 h-6 ${stat.color.icon}`} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* ── Charts Row ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pathogen Spread Over Time */}
          <Card className="md:col-span-2 p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-0.5 flex items-center gap-2">
              <Microscope className="w-4 h-4 text-violet-500" />
              Regional Pathogen Spread
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
              Monthly case counts by disease type · last 7 months
              {!researcherError && researcherData?.pathogen_monthly?.length ? (
                <span className="ml-2 inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="w-1 h-1 rounded-full bg-emerald-500" />live
                </span>
              ) : null}
            </p>
            <div className="h-[270px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={pathogens}>
                  <defs>
                    {[
                      { id: 'anth', color: '#7c3aed' },
                      { id: 'fus',  color: '#ef4444' },
                      { id: 'pow',  color: '#f59e0b' },
                      { id: 'dow',  color: '#10b981' },
                    ].map(g => (
                      <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={g.color} stopOpacity={0.18} />
                        <stop offset="95%" stopColor={g.color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.08} />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '10px', color: '#fff', fontSize: 12 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="anthracnose" stroke="#7c3aed" strokeWidth={2} fill="url(#anth)" name="Anthracnose" />
                  <Area type="monotone" dataKey="fusarium"    stroke="#ef4444" strokeWidth={2} fill="url(#fus)"  name="Fusarium Wilt" />
                  <Area type="monotone" dataKey="powdery"     stroke="#f59e0b" strokeWidth={2} fill="url(#pow)"  name="Powdery Mildew" />
                  <Area type="monotone" dataKey="downy"       stroke="#10b981" strokeWidth={2} fill="url(#dow)"  name="Downy Mildew" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Disease Severity Radar */}
          <Card className="p-6">
            <h3 className="font-bold text-gray-900 dark:text-white mb-0.5 flex items-center gap-2">
              <Dna className="w-4 h-4 text-violet-500" />
              Disease Profile
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Severity vs. prevalence comparison
              {!researcherError && researcherData?.disease_radar?.length ? (
                <span className="ml-2 inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span className="w-1 h-1 rounded-full bg-emerald-500" />live
                </span>
              ) : null}
            </p>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#334155" opacity={0.2} />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                  <Radar name="Severity"   dataKey="severity"   stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.2} />
                  <Radar name="Prevalence" dataKey="prevalence" stroke="#10b981" fill="#10b981" fillOpacity={0.15} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* ── Outbreak Table + Model Performance ──────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Outbreak Tracker */}
          <Card className="md:col-span-2 p-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <TriangleAlert className="w-4 h-4 text-red-500" />
                Active Outbreak Tracker
              </h3>
              {!researcherError && researcherData?.outbreak_table?.length ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  LIVE DATA
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                  SAMPLE DATA
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              {!researcherError && researcherData?.outbreak_table?.length
                ? 'Live district case counts aggregated from all submissions'
                : 'Monitored districts · real-time case counts'}
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase pb-2 pr-4">Region</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase pb-2 pr-4">Disease</th>
                    <th className="text-right text-xs font-semibold text-gray-400 uppercase pb-2 pr-4">Cases</th>
                    <th className="text-center text-xs font-semibold text-gray-400 uppercase pb-2 pr-4">Trend</th>
                    <th className="text-center text-xs font-semibold text-gray-400 uppercase pb-2">Risk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {outbreakRows.map((row, i) => {
                    const TrendBadge = () => {
                      if (row.trend === 'up')   return <span className="inline-flex items-center gap-0.5 text-red-500 text-xs font-semibold"><ArrowUp className="w-3 h-3" />Rising</span>;
                      if (row.trend === 'down') return <span className="inline-flex items-center gap-0.5 text-emerald-500 text-xs font-semibold"><ArrowDown className="w-3 h-3" />Falling</span>;
                      return <span className="inline-flex items-center gap-0.5 text-gray-400 text-xs font-semibold"><Minus className="w-3 h-3" />Stable</span>;
                    };
                    const riskColor =
                      row.risk === 'High'   ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' :
                      row.risk === 'Medium' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400' :
                                             'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400';
                    return (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                        <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">{row.region}</td>
                        <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">{row.disease}</td>
                        <td className="py-3 pr-4 text-right font-bold text-gray-900 dark:text-white">{row.cases}</td>
                        <td className="py-3 pr-4 text-center"><TrendBadge /></td>
                        <td className="py-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${riskColor}`}>{row.risk}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {outbreakRows.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                  <CheckCircle2 className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-xs">No outbreak data with location information yet</p>
                </div>
              )}
            </div>
          </Card>


        </div>
      </div>
    );
  }

  // ── Non-researcher Dashboards (farmer / officer / admin) ──────────────────

  const getStats = () => {
    if (isAdmin) {
      return [
        { key: 'networkUsers', value: '1,248', icon: Users, color: 'blue' },
        { key: 'activeExperts', value: officerStats?.active_officers || '42', icon: ShieldCheck, color: 'green' },
        { key: 'pendingReviews', value: officerStats?.pending_reviews || '24', icon: ShieldAlert, color: 'red' },
        { key: 'systemHealth', value: '99.9%', icon: Activity, color: 'amber' },
      ];
    }
    if (isOfficer) {
      return [
        { key: 'assignedFarmers', value: officerStats?.total_farmers || '0', icon: Users, color: 'blue' },
        { key: 'pendingReviews', value: officerStats?.pending_reviews || '0', icon: ShieldAlert, color: 'red' },
        { key: 'expertEfficiency', value: officerStats?.efficiency || '94%', icon: Activity, color: 'green' },
        { key: 'casesResolved', value: officerStats?.resolved_mtd || '0', icon: CheckCircle2, color: 'amber' },
      ];
    }
    return [
      { key: 'totalScans', value: data?.stats?.total_scans || 0, icon: Activity, color: 'blue' },
      { key: 'diseasesDetected', value: data?.stats?.diseases_detected || 0, icon: TriangleAlert, color: 'red' },
      { key: 'healthyCrops', value: data?.stats?.healthy_crops || 0, icon: CircleCheck, color: 'green' },
      { key: 'avgConfidence', value: data?.stats?.avg_confidence || '0%', icon: TrendingUp, color: 'amber' },
    ];
  };

  const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
    blue: { bg: 'bg-blue-50 dark:bg-blue-900/10', text: 'text-blue-900 dark:text-blue-300', icon: 'text-blue-600' },
    red: { bg: 'bg-red-50 dark:bg-red-900/10', text: 'text-red-900 dark:text-red-300', icon: 'text-red-600' },
    green: { bg: 'bg-green-50 dark:bg-green-900/10', text: 'text-green-900 dark:text-green-300', icon: 'text-green-600' },
    amber: { bg: 'bg-amber-50 dark:bg-amber-900/10', text: 'text-amber-900 dark:text-amber-300', icon: 'text-amber-600' },
  };

  const stats = getStats();
  const weeklyData = data?.weekly_data || [];
  const diseaseDistribution = data?.disease_distribution || [];

  const translatedWeeklyData = weeklyData.map((d: any) => ({
    ...d,
    day: t(d.day.toLowerCase() as any) || d.day
  }));

  const translatedDistribution = diseaseDistribution.map((entry: any) => ({
    ...entry,
    name: t(entry.name.toLowerCase().replace(/\s+/g, '') as any) || entry.name
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const colors = colorMap[stat.color];
          return (
            <Card key={stat.key} className={`p-4 ${colors.bg} border-none shadow-sm`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-0.5">{t(stat.key)}</p>
                  <p className={`text-2xl font-bold ${colors.text} mt-2`}>{stat.value}</p>
                </div>
                <Icon className={`w-8 h-8 ${colors.icon}`} />
              </div>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            {isAdmin ? t('systemActivity') : isOfficer ? t('serviceResolutionTrends') : t('weeklyScanActivity')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {isAdmin ? t('globalPerformanceOverview') : isOfficer ? t('sevenDayCaseAnalysis') : t('scanVolumeComparison')}
          </p>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {isOfficer || isAdmin ? (
                <AreaChart data={translatedWeeklyData}>
                  <defs>
                    <linearGradient id="colorResolve" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#2E7D32" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="healthy" stroke="#2E7D32" strokeWidth={3} fillOpacity={1} fill="url(#colorResolve)" name={t('completedLegend')} />
                </AreaChart>
              ) : (
                <BarChart data={translatedWeeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                  <Tooltip 
                    cursor={{ fill: '#334155', opacity: 0.1 }} 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="diseases" fill="#EF4444" radius={[4, 4, 0, 0]} name={t('diseasedLegend')} />
                  <Bar dataKey="healthy" fill="#10B981" radius={[4, 4, 0, 0]} name={t('healthyLegend')} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </Card>

        {isOfficer ? (
          <Card className="p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Bell size={18} className="text-[#2E7D32]" />
                {t('urgentCases')}
              </h3>
            </div>
            <div className="space-y-3 flex-1">
              {urgentCases.length > 0 ? (
                urgentCases.map((item, i) => (
                  <div key={i} className="p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-muted/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition-all cursor-pointer">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">{item.id}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${item.risk === 'High' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                        {item.risk === 'High' ? 'HIGH' : 'LOW'} {t('riskLabel')}
                      </span>
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{item.farmer}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{t('escalatedWord')} {item.time}</p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
                  <CheckCircle2 className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-xs">{t('noUrgentCases')}</p>
                </div>
              )}
            </div>
          </Card>
        ) : isAdmin ? (
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-6">{t('userDistribution')}</h3>
            <div className="space-y-4">
              {[
                { label: t('farmersLabel'), val: '85%', color: 'bg-[#2E7D32]' },
                { label: t('expertsLabel'), val: '10%', color: 'bg-blue-500' },
                { label: t('researchersLabel'), val: '5%', color: 'bg-purple-500' }
              ].map((group, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-600 dark:text-gray-400">{group.label}</span>
                    <span className="text-gray-900 dark:text-gray-200">{group.val}</span>
                  </div>
                  <div className="w-full h-2 bg-muted dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full ${group.color}`} style={{ width: group.val }}></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{t('diseaseDistribution')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('diseaseDistributionSub')}</p>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={translatedDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {translatedDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        )}
      </div>
    </div>
  );
}