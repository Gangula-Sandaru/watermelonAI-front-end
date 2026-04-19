import { Card } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { FileText, MapPin, Calendar } from 'lucide-react';
import { Badge } from './ui/badge';

export function RecentScansTable() {
  const scans = [
    {
      id: 'SC-001',
      date: '2026-01-03',
      time: '10:30 AM',
      location: 'Field A-1',
      coordinates: '7.8731° N, 80.7718° E',
      disease: 'Anthracnose',
      diseaseSi: 'ඇන්ත්‍රක්නෝස්',
      confidence: 95.3,
      severity: 'High',
      status: 'Treated',
    },
    {
      id: 'SC-002',
      date: '2026-01-03',
      time: '09:15 AM',
      location: 'Field B-3',
      coordinates: '7.8745° N, 80.7732° E',
      disease: 'Downy Mildew',
      diseaseSi: 'ඩවුනි මිල්ඩිව්',
      confidence: 87.2,
      severity: 'Medium',
      status: 'In Progress',
    },
    {
      id: 'SC-003',
      date: '2026-01-02',
      time: '03:45 PM',
      location: 'Field C-2',
      coordinates: '7.8720° N, 80.7705° E',
      disease: 'Healthy',
      diseaseSi: 'සෞඛ්‍ය සම්පන්න',
      confidence: 98.1,
      severity: 'None',
      status: 'Completed',
    },
    {
      id: 'SC-004',
      date: '2026-01-02',
      time: '02:20 PM',
      location: 'Field A-2',
      coordinates: '7.8738° N, 80.7710° E',
      disease: 'Anthracnose',
      diseaseSi: 'ඇන්ත්‍රක්නෝස්',
      confidence: 91.8,
      severity: 'High',
      status: 'Treated',
    },
    {
      id: 'SC-005',
      date: '2026-01-02',
      time: '11:00 AM',
      location: 'Field D-1',
      coordinates: '7.8750° N, 80.7725° E',
      disease: 'Fusarium Wilt',
      diseaseSi: 'ෆියුසේරියම් වික්',
      confidence: 79.5,
      severity: 'Medium',
      status: 'Pending',
    },
  ];

  const severityColors: Record<string, string> = {
    High: 'bg-red-100 text-red-800 border-red-200',
    Medium: 'bg-amber-100 text-amber-800 border-amber-200',
    None: 'bg-green-100 text-green-800 border-green-200',
  };

  const statusColors: Record<string, string> = {
    Treated: 'bg-green-100 text-green-800',
    'In Progress': 'bg-blue-100 text-blue-800',
    Completed: 'bg-gray-100 text-gray-800',
    Pending: 'bg-amber-100 text-amber-800',
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Recent Scans & Diagnostics</h3>
          <p className="text-sm text-gray-500">මෑත පරිලෝකන සහ විනිශ්චය</p>
        </div>
        <FileText className="w-8 h-8 text-[#2E7D32]" />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">Scan ID</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>GPS Coordinates</TableHead>
              <TableHead>Disease Detected</TableHead>
              <TableHead className="text-center">Confidence</TableHead>
              <TableHead className="text-center">Severity</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scans.map((scan) => (
              <TableRow key={scan.id}>
                <TableCell className="font-medium">{scan.id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="text-sm">{scan.date}</p>
                      <p className="text-xs text-gray-500">{scan.time}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#2E7D32]" />
                    <span>{scan.location}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-gray-600">{scan.coordinates}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{scan.disease}</p>
                    <p className="text-xs text-gray-500">{scan.diseaseSi}</p>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-semibold text-[#2E7D32]">{scan.confidence}%</span>
                </TableCell>
                <TableCell className="text-center">
                  <Badge variant="outline" className={severityColors[scan.severity]}>
                    {scan.severity}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <Badge className={statusColors[scan.status]}>{scan.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        <p>Showing 5 most recent scans</p>
        <button className="text-[#2E7D32] font-medium hover:underline">View All Records →</button>
      </div>
    </Card>
  );
}
