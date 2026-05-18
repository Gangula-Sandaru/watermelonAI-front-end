import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { FileText, MapPin, Calendar, Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { toast } from 'sonner';

export function RecentScansTable() {
  const [scans, setScans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination state (persist on refresh)
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = sessionStorage.getItem('recentScansPage');
    return saved ? parseInt(saved, 10) : 1;
  });
  const itemsPerPage = 25;

  useEffect(() => {
    sessionStorage.setItem('recentScansPage', currentPage.toString());
  }, [currentPage]);

  useEffect(() => {
    const handleNewScan = () => {
      fetchScans();
    };

    window.addEventListener('watermelon-new-scan', handleNewScan);
    return () => {
      window.removeEventListener('watermelon-new-scan', handleNewScan);
    };
  }, []);

  useEffect(() => {
    fetchScans();
  }, []);

  const fetchScans = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://127.0.0.1:8000/api/disease/history/', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('watermelon-auth-error'));
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setScans(data);
      } else {
        toast.error("Failed to fetch recent scans.");
      }
    } catch (error) {
      console.error("Failed to fetch recent scans", error);
    } finally {
      setIsLoading(false);
    }
  };

  const severityColors: Record<string, string> = {
    HIGH: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50',
    MEDIUM: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50',
    LOW: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/50',
    UNKNOWN: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
  };

  const statusColors: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    PROCESSING: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    FAILED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">Recent Scans & Diagnostics</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">මෑත පරිලෝකන සහ විනිශ්චය</p>
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
              <TableHead>Disease Detected</TableHead>
              <TableHead className="text-center">Confidence</TableHead>
              <TableHead className="text-center">Severity</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                  <span className="text-gray-500">Loading recent scans...</span>
                </TableCell>
              </TableRow>
            ) : scans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-gray-500 dark:text-gray-400">
                  No recent scans found. Create a new diagnosis to see records here.
                </TableCell>
              </TableRow>
            ) : scans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((scan) => {
              const dateObj = new Date(scan.created_at);
              const diseaseName = scan.prediction?.disease_name || 'N/A';
              const confidenceStr = scan.prediction?.confidence
                ? `${(scan.prediction.confidence * 100).toFixed(1)}%`
                : '--';
              const severityVal = scan.prediction?.severity || 'UNKNOWN';

              return (
                <TableRow key={scan.id}>
                  <TableCell className="font-medium">SC-{scan.id.toString().padStart(3, '0')}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <div>
                        <p className="text-sm dark:text-gray-200">{dateObj.toLocaleDateString()}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{dateObj.toLocaleTimeString()}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#2E7D32]" />
                      <span className="dark:text-gray-200">{scan.location_name || 'Unknown Field'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium truncate max-w-[200px] dark:text-gray-100" title={diseaseName}>{diseaseName}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-[#2E7D32]">{confidenceStr}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className={severityColors[severityVal] || severityColors.UNKNOWN}>
                      {severityVal}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={statusColors[scan.status] || statusColors.PENDING}>{scan.status}</Badge>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
        {scans.length > 0 ? (
          <p>
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, scans.length)} of {scans.length} recent scans
          </p>
        ) : (
          <p></p>
        )}
        
        {scans.length > itemsPerPage && (
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1 border dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-gray-700 dark:text-gray-300"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <span className="font-semibold text-gray-900 dark:text-gray-100 mx-2">
              Page {currentPage} of {Math.ceil(scans.length / itemsPerPage)}
            </span>
            <button
              className="px-3 py-1 border dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-gray-700 dark:text-gray-300"
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(scans.length / itemsPerPage), p + 1))}
              disabled={currentPage >= Math.ceil(scans.length / itemsPerPage)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
