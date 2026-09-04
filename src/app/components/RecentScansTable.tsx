import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { FileText, MapPin, Calendar, Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { useTranslation } from '../utils/translations';

export function RecentScansTable() {
  const { t } = useTranslation();
  const [scans, setScans] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [defaultLocation, setDefaultLocation] = useState<[number, number]>(() => {
    const savedLat = localStorage.getItem('default_latitude');
    const savedLng = localStorage.getItem('default_longitude');
    return [
      savedLat ? parseFloat(savedLat) : 7.8731,
      savedLng ? parseFloat(savedLng) : 80.7718,
    ];
  });

  // Pagination state (persist on refresh)
  const [currentPage, setCurrentPage] = useState(() => {
    const saved = sessionStorage.getItem('recentScansPage');
    return saved ? parseInt(saved, 10) : 1;
  });
  const itemsPerPage = 25;

  useEffect(() => {
    sessionStorage.setItem('recentScansPage', currentPage.toString());
  }, [currentPage]);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) return;
      const response = await fetch('http://127.0.0.1:8000/api/settings/', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data.latitude != null && data.longitude != null) {
          const lat = parseFloat(data.latitude);
          const lng = parseFloat(data.longitude);
          setDefaultLocation([lat, lng]);
          localStorage.setItem('default_latitude', String(lat));
          localStorage.setItem('default_longitude', String(lng));
        }
      }
    } catch (error) {
      console.error("Failed to fetch default GPS settings", error);
    }
  };

  useEffect(() => {
    const handleRefresh = () => {
      fetchScans();
      fetchSettings();
    };

    window.addEventListener('watermelon-new-scan', handleRefresh);
    window.addEventListener('watermelon-scans-updated', handleRefresh);
    return () => {
      window.removeEventListener('watermelon-new-scan', handleRefresh);
      window.removeEventListener('watermelon-scans-updated', handleRefresh);
    };
  }, []);

  useEffect(() => {
    fetchScans();
    fetchSettings();
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
        toast.error(t('failedFetchScans'));
      }
    } catch (error) {
      console.error("Failed to fetch recent scans", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity?.toUpperCase()) {
      case 'HIGH': return t('severityHigh');
      case 'MEDIUM': return t('severityMedium');
      case 'LOW': return t('severityLow');
      default: return t('severityUnknown');
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'COMPLETED': return t('statusCompleted');
      case 'PROCESSING': return t('statusProcessing');
      case 'FAILED': return t('statusFailed');
      default: return t('statusPendingLabel');
    }
  };

  const formatGpsCoordinates = (lat: number, lng: number) => {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
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
          <h3 className="font-semibold text-gray-900 dark:text-white">{t('recentScansDiagnostics')}</h3>
        </div>
        <FileText className="w-8 h-8 text-[#2E7D32]" />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-24">{t('scanId')}</TableHead>
              <TableHead>{t('dateTime')}</TableHead>
              <TableHead>{t('defaultLocation') || t('location')}</TableHead>
              <TableHead>{t('diseaseDetectedLabel')}</TableHead>
              <TableHead className="text-center">{t('confidenceLabel')}</TableHead>
              <TableHead className="text-center">{t('severity')}</TableHead>
              <TableHead className="text-center">{t('statusLabel')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
                  <span className="text-gray-500">{t('loadingRecentScans')}</span>
                </TableCell>
              </TableRow>
            ) : scans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-gray-500 dark:text-gray-400">
                  {t('noRecentScansFound')}
                </TableCell>
              </TableRow>
            ) : scans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((scan) => {
              const dateObj = new Date(scan.created_at);
              const diseaseName = scan.prediction?.disease_name || 'N/A';
              const confidenceStr = scan.prediction?.confidence
                ? `${(scan.prediction.confidence * 100).toFixed(1)}%`
                : '--';
              const severityVal = scan.prediction?.severity || 'UNKNOWN';
              const scanLat = scan.latitude != null ? parseFloat(scan.latitude) : defaultLocation[0];
              const scanLng = scan.longitude != null ? parseFloat(scan.longitude) : defaultLocation[1];
              const gpsLocation = formatGpsCoordinates(scanLat, scanLng);

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
                      <MapPin className="w-4 h-4 text-[#2E7D32] shrink-0" />
                      <span className="dark:text-gray-200 font-mono text-sm">{gpsLocation}</span>
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
                      {getSeverityLabel(severityVal)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={statusColors[scan.status] || statusColors.PENDING}>{getStatusLabel(scan.status)}</Badge>
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
            {t('showingRecentScans')
              .replace('{start}', String((currentPage - 1) * itemsPerPage + 1))
              .replace('{end}', String(Math.min(currentPage * itemsPerPage, scans.length)))
              .replace('{total}', String(scans.length))}
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
              {t('previousLabel')}
            </button>
            <span className="font-semibold text-gray-900 dark:text-gray-100 mx-2">
              {t('pageOfLabel')
                .replace('{current}', String(currentPage))
                .replace('{total}', String(Math.ceil(scans.length / itemsPerPage)))}
            </span>
            <button
              className="px-3 py-1 border dark:border-gray-700 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-gray-700 dark:text-gray-300"
              onClick={() => setCurrentPage(p => Math.min(Math.ceil(scans.length / itemsPerPage), p + 1))}
              disabled={currentPage >= Math.ceil(scans.length / itemsPerPage)}
            >
              {t('nextLabel')}
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}
