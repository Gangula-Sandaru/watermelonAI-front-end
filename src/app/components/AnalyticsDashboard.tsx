import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { useTranslation } from '../utils/translations';
import { 
  TrendingUp, Activity, TriangleAlert, CircleCheck, Loader2, 
  ShieldAlert, Users, Bell, Map, FileText, CheckCircle2,
  ShieldCheck, Database, Lock, Globe, Settings, ArrowUpRight,
  Microscope, FlaskConical, Dna, Leaf, ArrowUp, ArrowDown, Minus,
  RefreshCw, Satellite
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


// ─────────────────────────────────────────────────────────────────────────────


export function AnalyticsDashboard({ userData }: AnalyticsDashboardProps) {
  const { t, currentLanguage } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [officerStats, setOfficerStats] = useState<any>(null);
  const [officerAnalytics, setOfficerAnalytics] = useState<any>(null);
  const [urgentCases, setUrgentCases] = useState<any[]>([]);
  const [adminUserStats, setAdminUserStats] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<string>('Online');
  const [servicesStatus, setServicesStatus] = useState<any>(null);
  const [researcherData, setResearcherData] = useState<any>(null);
  const [researcherError, setResearcherError] = useState(false);
  const [researcherRefreshing, setResearcherRefreshing] = useState(false);

  const formatRelativeTime = (timeStr: string) => {
    if (!timeStr) return '';
    const match = String(timeStr).match(/^(\d+)([smhd])\s*ago$/i);
    if (!match) return timeStr;
    const num = match[1];
    const unit = match[2].toLowerCase();
    if (currentLanguage === 'si') {
      if (unit === 's') return `තත්පර ${num}කට පෙර`;
      if (unit === 'm') return `මිනිත්තු ${num}කට පෙර`;
      if (unit === 'h') return `පැය ${num}කට පෙර`;
      if (unit === 'd') return `දින ${num}කට පෙර`;
    } else if (currentLanguage === 'ta') {
      if (unit === 's') return `${num} வினாடிகளுக்கு முன்`;
      if (unit === 'm') return `${num} நிமிடங்களுக்கு முன்`;
      if (unit === 'h') return `${num} மணிநேரத்திற்கு முன்`;
      if (unit === 'd') return `${num} நாட்களுக்கு முன்`;
    }
    return timeStr;
  };

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
          const [statsRes, perfRes, usersRes, servicesRes, analyticsRes] = await Promise.all([
            fetch('http://127.0.0.1:8000/api/escalation/dashboard/stats/', { headers }),
            fetch('http://127.0.0.1:8000/api/escalation/dashboard/performance/', { headers }),
            fetch('http://127.0.0.1:8000/api/auth/admin/users/', { headers }),
            fetch('http://127.0.0.1:8000/api/disease/services/status/', { headers }),
            fetch('http://127.0.0.1:8000/api/escalation/dashboard/analytics/', { headers }),
          ]);

          if (statsRes.ok) {
            setOfficerStats(await statsRes.json());
          }
          if (perfRes.ok) {
            setData({ weekly_data: await perfRes.json() });
          }
          if (usersRes.ok) {
            const usersJson = await usersRes.json();
            setAdminUserStats(usersJson.stats || null);
          }
          if (servicesRes.ok) {
            const servicesJson = await servicesRes.json();
            setServicesStatus(servicesJson.services || null);
            setSystemHealth(servicesJson.all_online ? 'Healthy' : 'Degraded');
          }
          if (analyticsRes.ok) {
            setOfficerAnalytics(await analyticsRes.json());
          }
        } else if (isOfficer) {
          const [statsRes, urgentRes, performanceRes, analyticsRes, servicesRes] = await Promise.all([
            fetch('http://127.0.0.1:8000/api/escalation/dashboard/stats/', { headers }),
            fetch('http://127.0.0.1:8000/api/escalation/dashboard/urgent/', { headers }),
            fetch('http://127.0.0.1:8000/api/escalation/dashboard/performance/', { headers }),
            fetch('http://127.0.0.1:8000/api/escalation/dashboard/analytics/', { headers }),
            fetch('http://127.0.0.1:8000/api/disease/services/status/', { headers }),
          ]);
          if (statsRes.ok) setOfficerStats(await statsRes.json());
          if (urgentRes.ok) setUrgentCases(await urgentRes.json());
          if (performanceRes.ok) setData({ weekly_data: await performanceRes.json() });
          if (analyticsRes.ok) setOfficerAnalytics(await analyticsRes.json());
          if (servicesRes.ok) {
            const servicesJson = await servicesRes.json();
            setServicesStatus(servicesJson.services || null);
          }
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

  // ── Researcher Dashboard (100% Real Database Analytics) ──────────────────
  if (isResearcher) {
    const apiStats = researcherData?.stats;
    const pathogens = researcherData?.pathogen_monthly || [];
    const diseaseDistribution = (researcherData?.disease_distribution || []).map((entry: any) => ({
      ...entry,
      displayName: t(entry.name.toLowerCase().replace(/\s+/g, '') as any) || entry.name
    }));
    const recentScans = researcherData?.recent_scans || [];

    const totalScans    = apiStats?.total_scans      ?? '0';
    const diseasedCount = apiStats?.diseases_detected ?? '0';
    const healthyPct    = apiStats?.healthy_crops != null
      ? (String(apiStats.healthy_crops).includes('%') ? apiStats.healthy_crops : `${apiStats.healthy_crops}%`)
      : '0%';
    const avgConfidence = apiStats?.avg_confidence != null
      ? (typeof apiStats.avg_confidence === 'string' && apiStats.avg_confidence.includes('%')
          ? apiStats.avg_confidence
          : `${apiStats.avg_confidence}%`)
      : '0%';

    const researcherStats = [
      {
        label: t('totalScansAnalyzed'),
        value: totalScans,
        sub: t('allTimeSystemWide'),
        icon: Database,
        color: { bg: 'bg-violet-50 dark:bg-violet-900/10', text: 'text-violet-900 dark:text-violet-300', icon: 'text-violet-600' },
      },
      {
        label: t('diseasesDetected'),
        value: diseasedCount,
        sub: t('infectedSamples'),
        icon: TriangleAlert,
        color: { bg: 'bg-red-50 dark:bg-red-900/10', text: 'text-red-900 dark:text-red-300', icon: 'text-red-500' },
      },
      {
        label: t('healthyCrops'),
        value: healthyPct,
        sub: t('diseaseFreeRate'),
        icon: CircleCheck,
        color: { bg: 'bg-emerald-50 dark:bg-emerald-900/10', text: 'text-emerald-900 dark:text-emerald-300', icon: 'text-emerald-600' },
      },
      {
        label: t('avgConfidence'),
        value: avgConfidence,
        sub: t('confidenceLabel'),
        icon: TrendingUp,
        color: { bg: 'bg-amber-50 dark:bg-amber-900/10', text: 'text-amber-900 dark:text-amber-300', icon: 'text-amber-600' },
      },
    ];

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* ── Real KPI Row ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {researcherStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className={`p-4 ${stat.color.bg} border-none shadow-sm`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-0.5">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color.text} mt-2`}>{stat.value}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{stat.sub}</p>
                  </div>
                  <Icon className={`w-8 h-8 ${stat.color.icon}`} />
                </div>
              </Card>
            );
          })}
        </div>

        {/* ── Charts Row: Monthly Trend + Disease Distribution ─────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Monthly Pathogen Spread (Real Database Aggregation) */}
          <Card className="md:col-span-2 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <Microscope className="w-5 h-5 text-violet-500" />
              {t('monthlyPathogenSpread')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              {t('monthlyPathogenSpreadSub')}
            </p>
            <div className="h-[270px]">
              {pathogens.length > 0 ? (
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
                          <stop offset="5%"  stopColor={g.color} stopOpacity={0.2} />
                          <stop offset="95%" stopColor={g.color} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.08} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '10px', color: '#fff', fontSize: 12 }} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="anthracnose" stroke="#7c3aed" strokeWidth={2} fill="url(#anth)" name={t('anthracnose')} />
                    <Area type="monotone" dataKey="downy"       stroke="#10b981" strokeWidth={2} fill="url(#dow)"  name={t('downymildew')} />
                    <Area type="monotone" dataKey="powdery"     stroke="#f59e0b" strokeWidth={2} fill="url(#pow)"  name={t('powderymildew')} />
                    <Area type="monotone" dataKey="fusarium"    stroke="#ef4444" strokeWidth={2} fill="url(#fus)"  name="Fusarium Wilt" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <Microscope className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-xs">No monthly pathogen trends recorded yet</p>
                </div>
              )}
            </div>
          </Card>

          {/* Real Disease Distribution Pie Chart */}
          <Card className="p-6 flex flex-col">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              {t('diseaseDistribution')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{t('diseaseDistributionSub')}</p>
            <div className="h-[260px] flex-1">
              {diseaseDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={diseaseDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="count"
                      nameKey="displayName"
                    >
                      {diseaseDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any, name: any, item: any) => [
                        `${value} (${item.payload.percentage}%)`,
                        name
                      ]}
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: 12 }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <CheckCircle2 className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-xs">No disease detections recorded yet</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* ── Real Field Diagnostic Records from Database ───────────────────── */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              {t('recentDiagnosticRecords')}
            </h3>
            {recentScans.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                {recentScans.length} {t('casesUnit')}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            {t('recentDiagnosticRecordsSub')}
          </p>
          <div className="overflow-x-auto">
            {recentScans.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase pb-2 pr-4">{t('scanId')}</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase pb-2 pr-4">{t('dateTime')}</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase pb-2 pr-4">{t('farmerLabel')}</th>
                    <th className="text-left text-xs font-semibold text-gray-400 uppercase pb-2 pr-4">{t('diseaseDetectedLabel')}</th>
                    <th className="text-center text-xs font-semibold text-gray-400 uppercase pb-2 pr-4">{t('confidenceLabel')}</th>
                    <th className="text-center text-xs font-semibold text-gray-400 uppercase pb-2 pr-4">{t('severity')}</th>
                    <th className="text-center text-xs font-semibold text-gray-400 uppercase pb-2">{t('statusLabel')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {recentScans.map((row: any, i: number) => {
                    const isHealthy = row.disease?.toLowerCase().includes('healthy');
                    const severityBadgeClass =
                      row.severity === 'HIGH'
                        ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                        : row.severity === 'MEDIUM'
                        ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                        : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400';

                    const statusBadgeClass =
                      row.status === 'COMPLETED'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : row.status === 'FAILED'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';

                    return (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
                        <td className="py-3 pr-4 font-mono text-xs font-bold text-gray-900 dark:text-white">{row.id}</td>
                        <td className="py-3 pr-4 text-xs text-gray-500 dark:text-gray-400">{row.date}</td>
                        <td className="py-3 pr-4 text-xs font-medium text-gray-900 dark:text-white">{row.farmer}</td>
                        <td className="py-3 pr-4 text-xs font-bold">
                          <span className={isHealthy ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                            {row.disease}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-center text-xs font-semibold text-gray-700 dark:text-gray-300">{row.confidence}</td>
                        <td className="py-3 pr-4 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${severityBadgeClass}`}>
                            {row.severity}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusBadgeClass}`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <CheckCircle2 className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-xs">{t('noDiagnosticRecords')}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  // ── Non-researcher Dashboards (farmer / officer / admin) ──────────────────

  const getStats = () => {
    if (isAdmin) {
      const totalUsers = adminUserStats?.total ?? 0;
      const activeUsers = adminUserStats?.active ?? 0;
      const totalOfficers = officerStats?.total_officers ?? 0;
      const activeOfficers = officerStats?.active_officers ?? totalOfficers;
      const pendingReviews = officerStats?.pending_reviews ?? '00';
      const resolvedMtd = officerStats?.resolved_mtd ?? '0';

      return [
        { 
          key: 'networkUsers', 
          value: totalUsers.toString(), 
          icon: Users, 
          color: 'blue', 
          sub: `${activeUsers} ${t('activeLabel') || 'Active'}` 
        },
        { 
          key: 'activeExperts', 
          value: activeOfficers.toString(), 
          icon: ShieldCheck, 
          color: 'green', 
          sub: `${totalOfficers} ${t('registeredLabel') || 'Registered'}` 
        },
        { 
          key: 'pendingReviews', 
          value: pendingReviews.toString(), 
          icon: ShieldAlert, 
          color: 'red', 
          sub: `${resolvedMtd} ${t('resolvedThisMonth') || 'Resolved MTD'}` 
        },
        { 
          key: 'systemHealth', 
          value: systemHealth, 
          icon: Activity, 
          color: 'amber', 
          sub: t('systemHealthOnline') || 'AI & Cloud Online' 
        },
      ];
    }
    if (isOfficer) {
      return [
        { key: 'totalCases',      value: officerAnalytics?.total_cases    ?? officerStats?.total_farmers ?? '0', icon: FileText,    color: 'blue',  sub: t('allTimeEscalations') },
        { key: 'openCases',       value: officerAnalytics?.open_cases     ?? officerStats?.pending_reviews ?? '0', icon: ShieldAlert, color: 'red',   sub: t('pendingReviewing') },
        { key: 'casesResolved',   value: officerAnalytics?.resolved_cases ?? officerStats?.resolved_mtd   ?? '0', icon: CheckCircle2,color: 'green', sub: t('resolvedThisMonth') },
        { key: 'responseRate',    value: officerAnalytics?.response_rate  ?? officerStats?.efficiency     ?? '—', icon: TrendingUp,  color: 'amber', sub: t('responseRateSub') },
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

  // Officer weekly trend data (from officerAnalytics or performance chart)
  const officerWeeklyTrend = (officerAnalytics?.weekly_trend || []).map((d: any) => ({
    ...d,
    day: t(d.day.toLowerCase() as any) || d.day
  }));
  const chartWeeklyData = isOfficer ? (officerWeeklyTrend.length > 0 ? officerWeeklyTrend : translatedWeeklyData) : translatedWeeklyData;

  const translatedCaseDistribution = (officerAnalytics?.case_distribution || []).map((entry: any) => {
    let name = entry.name;
    if (entry.name === 'Pending') name = t('statusPending');
    else if (entry.name === 'Reviewing') name = t('statusInReview');
    else if (entry.name === 'Resolved') name = t('statusResolved');
    return { ...entry, name };
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const colors = colorMap[stat.color];
          return (
            <Card key={stat.key} className={`p-4 ${colors.bg} border-none shadow-sm`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-0.5">{t(stat.key as any) || stat.key}</p>
                  <p className={`text-2xl font-bold ${colors.text} mt-2`}>{stat.value}</p>
                  {(stat as any).sub && (
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{(stat as any).sub}</p>
                  )}
                </div>
                <Icon className={`w-8 h-8 ${colors.icon}`} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Weekly Trend Chart */}
        <Card className="md:col-span-2 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
            {isAdmin ? t('systemActivity') : isOfficer ? t('weeklyCaseTrend') : t('weeklyScanActivity')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {isAdmin ? t('globalPerformanceOverview') : isOfficer ? t('newVsResolvedPerDay') : t('scanVolumeComparison')}
          </p>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {isOfficer ? (
                <BarChart data={chartWeeklyData}>
                  <defs>
                    <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.4} />
                    </linearGradient>
                    <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.4} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="new" fill="#f59e0b" radius={[4, 4, 0, 0]} name={t('newCasesLegend')} />
                  <Bar dataKey="resolved" fill="#22c55e" radius={[4, 4, 0, 0]} name={t('resolvedLegend')} />
                </BarChart>
              ) : isAdmin ? (
                <AreaChart data={translatedWeeklyData}>
                  <defs>
                    <linearGradient id="colorResolve" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2E7D32" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="healthy" stroke="#2E7D32" strokeWidth={3} fillOpacity={1} fill="url(#colorResolve)" name={t('completedLegend') || 'Resolved Cases'} />
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

        {/* Side panel: Urgent Cases (officer) / Case Distribution (officer) / User Dist (admin) / Disease dist (farmer) */}
        {isOfficer ? (
          <Card className="p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Bell size={18} className="text-amber-500" />
                {t('urgentCases')}
              </h3>
              {urgentCases.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                  {urgentCases.length} {t('urgentCasesOpen')}
                </span>
              )}
            </div>
            <div className="space-y-2 flex-1 overflow-y-auto max-h-[260px] pr-0.5">
              {urgentCases.length > 0 ? (
                urgentCases.map((item, i) => (
                  <div key={i} className="p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-muted/50 dark:bg-gray-800/50 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition-all">
                    <div className="flex justify-between items-start mb-1">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{item.id}</p>
                        <p className="font-bold text-gray-900 dark:text-white text-sm leading-tight">{item.farmer}</p>
                        {item.district && (
                          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
                            <Map size={9} /> {item.district}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${item.risk === 'High' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                          {item.risk === 'High' ? `🔴 ${t('severityHigh')}` : `🟡 ${t('severityMedium')}`} {t('riskLabel')}
                        </span>
                        <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-0.5">
                          🕐 {formatRelativeTime(item.time)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${item.status === 'SENT' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                        {item.status === 'SENT' ? t('statusPendingBadge') : t('statusReviewingBadge')}
                      </span>
                    </div>
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
          <Card className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white">{t('userDistribution')}</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                  {adminUserStats?.total ?? 0} {t('networkUsers') || 'Users'}
                </span>
              </div>
              {adminUserStats ? (() => {
                const total = adminUserStats.total || 1;
                const roles = adminUserStats.roles || {};
                const farmers = roles.farmer || 0;
                const experts = roles.agri_officer || 0;
                const researchers = roles.researcher || 0;
                const admins = roles.admin || 0;

                const farmersPct = Math.round((farmers / total) * 100);
                const expertsPct = Math.round((experts / total) * 100);
                const researchersPct = Math.round((researchers / total) * 100);
                const adminsPct = Math.round((admins / total) * 100);

                const distributionGroups = [
                  { label: t('farmersLabel') || 'Farmers', count: farmers, pct: `${farmersPct}%`, color: 'bg-[#2E7D32]' },
                  { label: t('expertsLabel') || 'Experts', count: experts, pct: `${expertsPct}%`, color: 'bg-blue-500' },
                  { label: t('researchersLabel') || 'Researchers', count: researchers, pct: `${researchersPct}%`, color: 'bg-purple-500' },
                  { label: t('adminsLabel') || 'Administrators', count: admins, pct: `${adminsPct}%`, color: 'bg-amber-500' }
                ];

                return (
                  <div className="space-y-3">
                    {distributionGroups.map((group, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-gray-600 dark:text-gray-400">{group.label}</span>
                          <span className="text-gray-900 dark:text-gray-200">
                            {group.count} ({group.pct})
                          </span>
                        </div>
                        <div className="w-full h-2 bg-muted dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className={`h-full ${group.color} transition-all duration-500`} style={{ width: group.pct }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })() : (
                <div className="flex items-center justify-center h-32 text-gray-400 text-xs">
                  {t('loading') || 'Loading user stats...'}
                </div>
              )}
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
              <span>{t('activeLabel') || 'Active Accounts'}</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{adminUserStats?.active ?? 0}</span>
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

      {/* Officer & Admin extra analytics row: Case Distribution Pie + District Breakdown */}
      {(isOfficer || isAdmin) && officerAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Case Status Distribution */}
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#2E7D32]" />
              {isAdmin ? (t('systemCaseDistribution') || 'System Escalation Distribution') : t('caseStatusDistribution')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              {isAdmin ? (t('systemCaseDistributionSub') || 'All-time escalation resolution breakdown across districts') : t('caseStatusDistributionSub')}
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={translatedCaseDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {translatedCaseDistribution.map((entry: any, idx: number) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: 12 }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* System Services Status (AI Disease Detection, Satellite Scanning, Authentication) */}
          <Card className="p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#2E7D32]" />
                  {t('systemServicesStatus') || 'System Services Status'}
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                  servicesStatus && Object.values(servicesStatus).every((s: any) => s.status === 'online')
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    servicesStatus && Object.values(servicesStatus).every((s: any) => s.status === 'online')
                      ? 'bg-emerald-500 animate-pulse'
                      : 'bg-amber-500'
                  }`} />
                  {servicesStatus && Object.values(servicesStatus).every((s: any) => s.status === 'online')
                    ? 'All Systems Operational'
                    : 'Service Alert'}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                {t('systemServicesStatusSub') || 'Live operational status of core infrastructure'}
              </p>

              <div className="space-y-3">
                {/* 1. AI Disease Detection */}
                {(() => {
                  const ai = servicesStatus?.ai_disease_detection;
                  const isOnline = ai?.status === 'online';
                  return (
                    <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-muted/40 dark:bg-gray-800/40 hover:bg-muted/70 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isOnline ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                            <Microscope className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900 dark:text-white">
                              {t('aiDiseaseDetectionService') || 'AI Disease Detection'}
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                              {ai?.details || 'Deep Learning Inference Engine'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {ai?.latency_ms ? (
                            <span className="text-[10px] font-mono text-gray-400">{ai.latency_ms}ms</span>
                          ) : null}
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            isOnline
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {isOnline ? (t('serviceOnline') || 'ONLINE') : (t('serviceOffline') || 'OFFLINE')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 2. Satellite Scanning */}
                {(() => {
                  const sat = servicesStatus?.satellite_scanning;
                  const isOnline = sat?.status === 'online';
                  return (
                    <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-muted/40 dark:bg-gray-800/40 hover:bg-muted/70 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isOnline ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                            <Satellite className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900 dark:text-white">
                              {t('satelliteScanningService') || 'Satellite Scanning'}
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                              {sat?.details || 'Copernicus Sentinel-2 STAC API'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {sat?.latency_ms ? (
                            <span className="text-[10px] font-mono text-gray-400">{sat.latency_ms}ms</span>
                          ) : null}
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            isOnline
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {isOnline ? (t('serviceOnline') || 'ONLINE') : (t('serviceOffline') || 'OFFLINE')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* 3. Authentication & Database */}
                {(() => {
                  const auth = servicesStatus?.authentication;
                  const isOnline = auth?.status === 'online';
                  return (
                    <div className="p-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-muted/40 dark:bg-gray-800/40 hover:bg-muted/70 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isOnline ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600'}`}>
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900 dark:text-white">
                              {t('authService') || 'Authentication'}
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400">
                              {auth?.details || 'Django Auth & Database Session'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {auth?.latency_ms ? (
                            <span className="text-[10px] font-mono text-gray-400">{auth.latency_ms}ms</span>
                          ) : null}
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            isOnline
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            {isOnline ? (t('serviceOnline') || 'ONLINE') : (t('serviceOffline') || 'OFFLINE')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-[10px] text-gray-400">
              <span>Auto-health monitor active</span>
              <span className="font-mono">Real-time sync</span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
