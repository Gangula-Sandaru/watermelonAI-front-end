import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { TrendingUp, Activity, TriangleAlert, CircleCheck, Loader2, ShieldAlert, Users, Bell, Map, FileText, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface AnalyticsDashboardProps {
  userData: any;
}

export function AnalyticsDashboard({ userData }: AnalyticsDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [officerStats, setOfficerStats] = useState<any>(null);
  const [urgentCases, setUrgentCases] = useState<any[]>([]);
  
  const role = userData?.role?.toLowerCase() || 'farmer';
  const isOfficer = role.includes('officer');
  const isResearcher = role.includes('researcher');
  const isFarmer = !isOfficer && !isResearcher;

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        const headers = { 'Authorization': `Bearer ${token}` };

        if (isOfficer) {
          // Fetch Officer specific data
          const [statsRes, urgentRes, analyticsRes] = await Promise.all([
            fetch('http://127.0.0.1:8000/api/escalation/dashboard/stats/', { headers }),
            fetch('http://127.0.0.1:8000/api/escalation/dashboard/urgent/', { headers }),
            fetch('http://127.0.0.1:8000/api/disease/analytics/', { headers })
          ]);

          if (statsRes.ok) setOfficerStats(await statsRes.json());
          if (urgentRes.ok) setUrgentCases(await urgentRes.json());
          if (analyticsRes.ok) setData(await analyticsRes.json());
        } else {
          // Fetch Farmer/Researcher data
          const response = await fetch('http://127.0.0.1:8000/api/disease/analytics/', { headers });
          if (response.ok) {
            const result = await response.json();
            setData(result);
          }
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [isOfficer, isResearcher]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-12 h-12 text-[#2E7D32] animate-spin" />
        <p className="text-gray-500 font-medium animate-pulse">
          {isOfficer ? 'Loading expert oversight data...' : 'Analyzing farm data...'}
        </p>
      </div>
    );
  }

  // Stats Configuration based on Role
  const getStats = () => {
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

    // Default Farmer Stats
    return [
      { label: 'Total Scans', labelSi: 'මුළු පරිලෝකන', value: data?.stats?.total_scans || 0, icon: Activity, color: 'blue' },
      { label: 'Diseases Detected', labelSi: 'හඳුනාගත් රෝග', value: data?.stats?.diseases_detected || 0, icon: TriangleAlert, color: 'red' },
      { label: 'Healthy Crops', labelSi: 'සෞඛ්‍ය භෝග', value: data?.stats?.healthy_crops || 0, icon: CircleCheck, color: 'green' },
      { label: 'Avg Confidence', labelSi: 'සාමාන්‍ය විශ්වාසය', value: data?.stats?.avg_confidence || '0%', icon: TrendingUp, color: 'amber' },
    ];
  };

  const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-900', icon: 'text-blue-600' },
    red: { bg: 'bg-red-50', text: 'text-red-900', icon: 'text-red-600' },
    green: { bg: 'bg-green-50', text: 'text-green-900', icon: 'text-green-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-900', icon: 'text-amber-600' },
  };

  const stats = getStats();
  const weeklyData = data?.weekly_data || [];
  const diseaseDistribution = data?.disease_distribution || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Dynamic Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const colors = colorMap[stat.color];
          return (
            <Card key={stat.label} className={`p-4 ${colors.bg} border-none shadow-sm`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-0.5">{stat.label}</p>
                  <p className="text-[10px] text-gray-500">{stat.labelSi}</p>
                  <p className={`text-2xl font-bold ${colors.text} mt-2`}>{stat.value}</p>
                </div>
                <Icon className={`w-8 h-8 ${colors.icon}`} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Main Insights Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Section: Main Chart (Farmer/Researcher) or Case Trends (Officer) */}
        <Card className="md:col-span-2 p-6">
          <h3 className="font-semibold text-gray-900 mb-1">
            {isOfficer ? 'Service Resolution Trends' : isResearcher ? 'Regional Pathogen Spreading' : 'Weekly Scan Activity'}
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            {isOfficer ? '7 Day Case Analysis • නඩු විශ්ලේෂණය' : isResearcher ? 'Infection Migration Mapping • ව්‍යාප්ති සිතියම්කරණය' : 'Scan Volume Comparison • පරිලෝකන සැසඳීම'}
          </p>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              {isOfficer ? (
                <AreaChart data={weeklyData}>
                  <defs>
                    <linearGradient id="colorResolve" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2E7D32" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#2E7D32" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <YAxis hide />
                  <Tooltip />
                  <Area type="monotone" dataKey="healthy" stroke="#2E7D32" strokeWidth={3} fillOpacity={1} fill="url(#colorResolve)" name="Resolved" />
                </AreaChart>
              ) : (
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Legend iconType="circle" />
                  <Bar dataKey="diseases" fill="#EF4444" radius={[4, 4, 0, 0]} name="Diseased" />
                  <Bar dataKey="healthy" fill="#10B981" radius={[4, 4, 0, 0]} name="Healthy" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Right Section: Urgent Items (Officer) or Distribution (Farmer/Researcher) */}
        {isOfficer ? (
          <Card className="p-6 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Bell size={18} className="text-[#2E7D32]" />
                  Urgent Cases
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">ප්‍රමුඛතා නඩු</p>
              </div>
              <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-1 rounded-full uppercase">Action</span>
            </div>
            
            <div className="space-y-3 flex-1">
              {urgentCases.length > 0 ? (
                urgentCases.map((item, i) => (
                  <div key={i} className="p-3 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all cursor-pointer">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[10px] font-bold text-gray-400">{item.id}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        item.risk === 'High' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                      }`}>
                        {item.risk} RISK
                      </span>
                    </div>
                    <p className="font-bold text-gray-900 text-sm">{item.farmer}</p>
                    <p className="text-[10px] text-gray-500 mt-1">Escalated {item.time}</p>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
                  <CheckCircle2 className="w-8 h-8 mb-2 opacity-20" />
                  <p className="text-xs">No urgent cases</p>
                </div>
              )}
            </div>
            <button className="mt-6 w-full py-2.5 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors">
              Review All Requests
            </button>
          </Card>
        ) : (
          <Card className="p-6">
            <h3 className="font-semibold text-gray-900 mb-1">Disease Distribution</h3>
            <p className="text-sm text-gray-500 mb-4">රෝග ව්‍යාප්තිය</p>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={diseaseDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
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