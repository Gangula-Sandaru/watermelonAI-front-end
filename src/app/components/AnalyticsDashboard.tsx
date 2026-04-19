import { Card } from './ui/card';
import { TrendingUp, Activity, TriangleAlert, CircleCheck } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function AnalyticsDashboard() {
  const weeklyData = [
    { day: 'Mon', scans: 12, diseases: 4, healthy: 8 },
    { day: 'Tue', scans: 15, diseases: 6, healthy: 9 },
    { day: 'Wed', scans: 18, diseases: 5, healthy: 13 },
    { day: 'Thu', scans: 14, diseases: 3, healthy: 11 },
    { day: 'Fri', scans: 20, diseases: 8, healthy: 12 },
    { day: 'Sat', scans: 16, diseases: 5, healthy: 11 },
    { day: 'Sun', scans: 10, diseases: 2, healthy: 8 },
  ];

  const diseaseDistribution = [
    { name: 'Anthracnose', value: 45, color: '#EF4444' },
    { name: 'Downy Mildew', value: 25, color: '#F59E0B' },
    { name: 'Fusarium Wilt', value: 15, color: '#8B5CF6' },
    { name: 'Healthy', value: 15, color: '#10B981' },
  ];

  const stats = [
    {
      label: 'Total Scans',
      labelSi: 'මුළු පරිලෝකන',
      value: '105',
      change: '+12%',
      icon: Activity,
      color: 'blue',
    },
    {
      label: 'Diseases Detected',
      labelSi: 'හඳුනාගත් රෝග',
      value: '33',
      change: '+8%',
      icon: TriangleAlert,
      color: 'red',
    },
    {
      label: 'Healthy Crops',
      labelSi: 'සෞඛ්‍ය භෝග',
      value: '72',
      change: '+5%',
      icon: CircleCheck,
      color: 'green',
    },
    {
      label: 'Avg Confidence',
      labelSi: 'සාමාන්‍ය විශ්වාසය',
      value: '91.2%',
      change: '+2%',
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