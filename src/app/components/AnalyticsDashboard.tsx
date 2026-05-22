import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { useTranslation } from '../utils/translations';
import { 
  TrendingUp, Activity, TriangleAlert, CircleCheck, Loader2, 
  ShieldAlert, Users, Bell, Map, FileText, CheckCircle2,
  ShieldCheck, Database, Lock, Globe, Settings, ArrowUpRight
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, AreaChart, Area 
} from 'recharts';

interface AnalyticsDashboardProps {
  userData: any;
}

export function AnalyticsDashboard({ userData }: AnalyticsDashboardProps) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [officerStats, setOfficerStats] = useState<any>(null);
  const [urgentCases, setUrgentCases] = useState<any[]>([]);

  const role = userData?.role?.toLowerCase() || 'farmer';
  const isAdmin = role === 'admin' || role === 'superadmin' || userData?.is_superuser === true;
  const isOfficer = role.includes('officer');
  const isResearcher = role.includes('researcher');
  const isFarmer = !isOfficer && !isResearcher && !isAdmin;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        if (isAdmin) {
          // Fetch Admin data (using officer stats endpoint as proxy for now)
          const response = await fetch('http://127.0.0.1:8000/api/escalation/dashboard/stats/', { headers });
          if (response.ok) {
            const stats = await response.json();
            // Mocking distribution for display
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
          {isAdmin ? t('accessingAdminMetrics') : isOfficer ? t('loadingExpertData') : t('analyzingFarmData')}
        </p>
      </div>
    );
  }

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
    if (isResearcher) {
      return [
        { key: 'globalDataPoints', value: '12.4k', icon: Activity, color: 'blue' },
        { key: 'diseaseOutbreaks', value: '03', icon: TriangleAlert, color: 'red' },
        { key: 'researchProgress', value: '82%', icon: TrendingUp, color: 'green' },
        { key: 'peerReviews', value: '12', icon: FileText, color: 'amber' },
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
            {isAdmin ? t('systemActivity') : isOfficer ? t('serviceResolutionTrends') : isResearcher ? t('regionalPathogenSpreading') : t('weeklyScanActivity')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {isAdmin ? t('globalPerformanceOverview') : isOfficer ? t('sevenDayCaseAnalysis') : isResearcher ? t('infectionMigrationMapping') : t('scanVolumeComparison')}
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