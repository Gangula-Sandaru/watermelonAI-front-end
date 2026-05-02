import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { TrendingUp, Activity, TriangleAlert, CircleCheck, Loader2 } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function AnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('token');
        const response = await fetch('http://127.0.0.1:8000/api/disease/analytics/', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-12 h-12 text-[#2E7D32] animate-spin" />
        <p className="text-gray-500 font-medium animate-pulse">Analyzing farm data...</p>
      </div>
    );
  }

  if (!data) return null;

  const weeklyData = data.weekly_data;
  const diseaseDistribution = data.disease_distribution;

  const stats = [
    {
      label: 'Total Scans',
      labelSi: 'මුළු පරිලෝකන',
      value: data.stats.total_scans,
      change: data.stats.total_scans_change,
      icon: Activity,
      color: 'blue',
    },
    {
      label: 'Diseases Detected',
      labelSi: 'හඳුනාගත් රෝග',
      value: data.stats.diseases_detected,
      change: data.stats.diseases_detected_change,
      icon: TriangleAlert,
      color: 'red',
    },
    {
      label: 'Healthy Crops',
      labelSi: 'සෞඛ්‍ය භෝග',
      value: data.stats.healthy_crops,
      change: data.stats.healthy_crops_change,
      icon: CircleCheck,
      color: 'green',
    },
    {
      label: 'Avg Confidence',
      labelSi: 'සාමාන්‍ය විශ්වාසය',
      value: data.stats.avg_confidence,
      change: data.stats.avg_confidence_change,
      icon: TrendingUp,
      color: 'amber',
    },
  ];

  const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-900', icon: 'text-blue-600' },
    red: { bg: 'bg-red-50', text: 'text-red-900', icon: 'text-red-600' },
    green: { bg: 'bg-green-50', text: 'text-green-900', icon: 'text-green-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-900', icon: 'text-amber-600' },
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const colors = colorMap[stat.color];
          return (
            <Card key={stat.label} className={`p-4 ${colors.bg}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-xs text-gray-500">{stat.labelSi}</p>
                  <p className={`text-2xl font-bold ${colors.text} mt-2`}>{stat.value}</p>
                  <p className="text-xs text-green-600 mt-1">{stat.change} from last week</p>
                </div>
                <Icon className={`w-8 h-8 ${colors.icon}`} />
              </div>
            </Card>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Weekly Activity Chart */}
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Weekly Scan Activity</h3>
          <p className="text-sm text-gray-500 mb-4">සතිපතා පරිලෝකන ක්‍රියාකාරකම්</p>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="diseases" fill="#EF4444" name="Diseased" />
              <Bar dataKey="healthy" fill="#10B981" name="Healthy" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Disease Distribution */}
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 mb-1">Disease Distribution</h3>
          <p className="text-sm text-gray-500 mb-4">රෝග ව්‍යාප්තිය</p>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={diseaseDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {diseaseDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}