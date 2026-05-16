import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
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
          {isAdmin ? 'Accessing admin metrics...' : isOfficer ? 'Loading expert data...' : 'Analyzing farm data...'}
        </p>
      </div>
    );
  }

  const getStats = () => {
    if (isAdmin) {
      return [
        { label: 'Network Users', labelSi: 'ජාල පරිශීලකයින්', value: '1,248', icon: Users, color: 'blue' },
        { label: 'Active Experts', labelSi: 'ක්‍රියාකාරී විශේෂඥයින්', value: officerStats?.active_officers || '42', icon: ShieldCheck, color: 'green' },
        { label: 'Pending Reviews', labelSi: 'පවතින සමාලෝචන', value: officerStats?.pending_reviews || '24', icon: ShieldAlert, color: 'red' },
        { label: 'System Health', labelSi: 'පද්ධති සෞඛ්‍යය', value: '99.9%', icon: Activity, color: 'amber' },
      ];
    }
    if (isOfficer) {
      return [
        { label: 'Assigned Farmers', labelSi: 'අනුයුක්ත ගොවීන්', value: officerStats?.total_farmers || '0', icon: Users, color: 'blue' },
        { label: 'Pending Reviews', labelSi: 'පවතින සමාලෝචන', value: officerStats?.pending_reviews || '0', icon: ShieldAlert, color: 'red' },
        { label: 'Expert Efficiency', labelSi: 'විශේෂඥ කාර්යක්ෂමතාව', value: officerStats?.efficiency || '94%', icon: Activity, color: 'green' },
        { label: 'Cases Resolved', labelSi: 'පියවන ලද නඩු', value: officerStats?.resolved_mtd || '0', icon: CheckCircle2, color: 'amber' },
      ];
    }
    if (isResearcher) {
      return [
        { label: 'Global Data Points', labelSi: 'ගෝලීය දත්ත ලකුණු', value: '12.4k', icon: Activity, color: 'blue' },
        { label: 'Disease Outbreaks', labelSi: 'රෝග පැතිරීම', value: '03', icon: TriangleAlert, color: 'red' },
        { label: 'Research Progress', labelSi: 'පර්යේෂණ ප්‍රගතිය', value: '82%', icon: TrendingUp, color: 'green' },
        { label: 'Peer Reviews', labelSi: 'සමාලෝචන', value: '12', icon: FileText, color: 'amber' },
      ];
    }
    return [
      { label: 'Total Scans', labelSi: 'මුළු පරිලෝකන', value: data?.stats?.total_scans || 0, icon: Activity, color: 'blue' },
      { label: 'Diseases Detected', labelSi: 'හඳුනාගත් රෝග', value: data?.stats?.diseases_detected || 0, icon: TriangleAlert, color: 'red' },
      { label: 'Healthy Crops', labelSi: 'සෞඛ්‍ය භෝග', value: data?.stats?.healthy_crops || 0, icon: CircleCheck, color: 'green' },
      { label: 'Avg Confidence', labelSi: 'සාමාන්‍ය විශ්වාසය', value: data?.stats?.avg_confidence || '0%', icon: TrendingUp, color: 'amber' },
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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const colors = colorMap[stat.color];
          return (
            <Card key={stat.label} className={`p-4 ${colors.bg} border-none shadow-sm`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-0.5">{stat.label}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-500">{stat.labelSi}</p>
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
            {isAdmin ? 'System Activity' : isOfficer ? 'Service Resolution Trends' : isResearcher ? 'Regional Pathogen Spreading' : 'Weekly Scan Activity'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            {isAdmin ? 'Global Performance Overview' : isOfficer ? '7 Day Case Analysis' : isResearcher ? 'Infection Migration Mapping' : 'Scan Volume Comparison'}
          </p>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {isOfficer || isAdmin ? (
                <AreaChart data={weeklyData}>
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
                  <Area type="monotone" dataKey="healthy" stroke="#2E7D32" strokeWidth={3} fillOpacity={1} fill="url(#colorResolve)" name="Completed" />
                </AreaChart>
              ) : (
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8' }} />
                  <Tooltip 
                    cursor={{ fill: '#334155', opacity: 0.1 }} 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="diseases" fill="#EF4444" radius={[4, 4, 0, 0]} name="Diseased" />
                  <Bar dataKey="healthy" fill="#10B981" radius={[4, 4, 0, 0]} name="Healthy" />
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
                Urgent Cases
              </h3>
            </div>
            <div className="space-y-3 flex-1">
              {urgentCases.length > 0 ? (
                urgentCases.map((item, i) => (
                  <div key={i} className="p-3 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm transition-all cursor-pointer">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500">{item.id}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${item.risk === 'High' ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400'}`}>
                        {item.risk} RISK
                      </span>
                    </div>
                    <p className="font-bold text-gray-900 dark:text-white text-sm">{item.farmer}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">Escalated {item.time}</p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
                  <CheckCircle2 className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-xs">No urgent cases</p>
                </div>
              )}
            </div>
          </Card>
        ) : isAdmin ? (
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-6">User Distribution</h3>
            <div className="space-y-4">
              {[
                { label: 'Farmers', val: '85%', color: 'bg-[#2E7D32]' },
                { label: 'Experts', val: '10%', color: 'bg-blue-500' },
                { label: 'Researchers', val: '5%', color: 'bg-purple-500' }
              ].map((group, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-gray-600 dark:text-gray-400">{group.label}</span>
                    <span className="text-gray-900 dark:text-gray-200">{group.val}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full ${group.color}`} style={{ width: group.val }}></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Disease Distribution</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">රෝග ව්‍යාප්තිය</p>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={diseaseDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {diseaseDistribution.map((entry: any, index: number) => (
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