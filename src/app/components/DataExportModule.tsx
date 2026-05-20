import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Download, FileText, Calendar, Filter, Database, FileSpreadsheet, CheckCircle2, Loader2, History, Trash2 } from 'lucide-react';
import { useTranslation } from '../utils/translations';

export const DataExportModule = ({ userData }: { userData: any }) => {
  const { t, currentLanguage } = useTranslation();
  const role = userData?.role?.toLowerCase() || 'farmer';
  const isOfficer = role.includes('officer');
  const isResearcher = role.includes('researcher');

  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'pdf' | 'excel'>('csv');
  const [trendsFormat, setTrendsFormat] = useState<'csv' | 'pdf' | 'excel'>('pdf');
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>(['all']);
  const [dateRange, setDateRange] = useState<'7days' | '30days' | 'thisYear' | 'custom'>('30days');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportHistory, setExportHistory] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [trendsData, setTrendsData] = useState<{
    total_scans: number;
    most_common_disease: string;
    healthy_percentage: number;
    mildew_percentage: number;
    anthracnose_percentage: number;
    other_percentage: number;
    warnings: Array<{ type: string; badge: string; text: string }>;
  } | null>(null);

  const toggleCategory = (typeId: string) => {
    setSelectedDataTypes(prev => {
      if (prev.includes(typeId)) {
        if (prev.length === 1) return prev;
        return prev.filter(t => t !== typeId);
      }
      return [...prev, typeId];
    });
  };

  const API_BASE = "http://127.0.0.1:8000/api/management/exports/";

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(API_BASE, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setExportHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const fetchTrendsPreview = async () => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/management/exports/trends-preview/?lang=${currentLanguage}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Accept-Language': currentLanguage
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTrendsData(data);
      }
    } catch (err) {
      console.error("Failed to fetch trends preview", err);
    }
  };

  useEffect(() => {
    fetchHistory();
    if (!isOfficer && !isResearcher) {
      fetchTrendsPreview();
    }
  }, [role, currentLanguage]);

  useEffect(() => {
    const totalPages = Math.ceil(exportHistory.length / itemsPerPage);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [exportHistory, currentPage, itemsPerPage]);

  const handleExport = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          data_types: selectedDataTypes,
          date_range: dateRange,
          format: selectedFormat
        })
      });

      if (response.ok) {
        setExportSuccess(true);
        fetchHistory();
        setTimeout(() => setExportSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  const deleteHistoryItem = async (id: number) => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(`${API_BASE}${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setExportHistory(exportHistory.filter(item => item.id !== id));
      }
    } catch (err) {
      console.error("Delete failed", err);
    }
  };

  // Define data types based on roles
  const getDataTypes = () => {
    if (isOfficer) {
      return [
        { id: 'escalations', label: t('officerActions') },
        { id: 'reviews', label: t('expertReview') },
        { id: 'regional', label: t('regionalAnalytics') },
        { id: 'disease', label: t('diseaseDetections') }
      ];
    }
    if (isResearcher) {
      return [
        { id: 'global', label: t('allFarmData') },
        { id: 'anonymized', label: t('anonymizedScans') },
        { id: 'outbreaks', label: t('outbreakHistory') },
        { id: 'trends', label: t('migrationTrends') }
      ];
    }
    // Farmer
    return [
      { id: 'all', label: t('allFarmData') },
      { id: 'disease', label: t('diseaseDetections') },
      { id: 'satellite', label: t('satelliteScans') },
      { id: 'yield', label: t('yieldPredictions') }
    ];
  };

  const dataTypes = getDataTypes();

  // Set default selection if current one is not valid for role
  useEffect(() => {
    const validTypes = selectedDataTypes.filter(t => dataTypes.find(dt => dt.id === t));
    if (validTypes.length === 0) {
      setSelectedDataTypes([dataTypes[0].id]);
    }
  }, [role]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {isOfficer ? t('adminDataExport') : isResearcher ? t('researchDataCenter') : t('data')}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('dataSubtitle')}
          </p>
        </div>
        <Database className="w-8 h-8 text-[#2E7D32]" />
      </div>

      {/* Premium Full-Length Crop Disease Trends & Advisory Warnings Panel for Farmers */}
      {!isOfficer && !isResearcher && (
        <div className="p-5 rounded-2xl border border-amber-200 dark:border-amber-900/30 bg-amber-50/10 dark:bg-amber-950/10 space-y-4 mb-6 transition-all duration-300">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-amber-100 dark:border-amber-900/20 pb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📊</span>
              <div>
                <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">{t('diseaseTrendsTitle')}</h4>
                <p className="text-[10px] text-gray-500">{t('diseaseTrendsSub')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">{t('realtimeAdvisoryActive')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Dynamic Warnings */}
            <div className="space-y-3">
              <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">{t('dynamicWarningsAlerts')}</h5>
              <div className="space-y-2">
                {trendsData?.warnings && trendsData.warnings.length > 0 ? (
                  trendsData.warnings.map((wrn, i) => (
                    <div 
                      key={i} 
                      className={`p-3 rounded-lg flex gap-2 border transition-all ${
                        wrn.type === 'warning' 
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-900 dark:text-amber-300' 
                          : wrn.type === 'success'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-900 dark:text-emerald-300'
                          : 'bg-blue-500/10 border-blue-500/20 text-blue-900 dark:text-blue-300'
                      }`}
                    >
                      <span className="text-xs">
                        {wrn.type === 'warning' ? '⚠️' : wrn.type === 'success' ? '✨' : '📡'}
                      </span>
                      <p className="text-[11px] leading-normal">
                        <strong>{wrn.badge}:</strong> {wrn.text}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-lg bg-gray-500/10 border border-gray-500/20 text-gray-500 text-[11px]">
                    {t('noTrendsCalculated')}
                  </div>
                )}
              </div>
            </div>

            {/* Column 2: Disease Statistics Graph */}
            <div className="space-y-3">
              <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">{t('activeDiseaseDistribution')}</h5>
              <div className="space-y-2">
                <div className="h-3 w-full bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden flex">
                  <div 
                    className="h-full bg-emerald-500 transition-all duration-500" 
                    style={{ width: `${trendsData?.healthy_percentage ?? 75}%` }} 
                    title={`Healthy Scans: ${trendsData?.healthy_percentage ?? 75}%`}
                  ></div>
                  <div 
                    className="h-full bg-amber-500 transition-all duration-500" 
                    style={{ width: `${trendsData?.mildew_percentage ?? 15}%` }} 
                    title={`Downy Mildew: ${trendsData?.mildew_percentage ?? 15}%`}
                  ></div>
                  <div 
                    className="h-full bg-rose-500 transition-all duration-500" 
                    style={{ width: `${trendsData?.anthracnose_percentage ?? 10}%` }} 
                    title={`Anthracnose: ${trendsData?.anthracnose_percentage ?? 10}%`}
                  ></div>
                  {trendsData?.other_percentage ? (
                    <div 
                      className="h-full bg-gray-500 transition-all duration-500" 
                      style={{ width: `${trendsData.other_percentage}%` }} 
                      title={`Other: ${trendsData.other_percentage}%`}
                    ></div>
                  ) : null}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Healthy', val: `${trendsData?.healthy_percentage ?? 75}%`, col: 'bg-emerald-500' },
                    { label: 'Mildew', val: `${trendsData?.mildew_percentage ?? 15}%`, col: 'bg-amber-500' },
                    { label: 'Anthracnose', val: `${trendsData?.anthracnose_percentage ?? 10}%`, col: 'bg-rose-500' }
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${item.col}`} />
                        <span className="text-[9px] font-medium text-gray-600 dark:text-gray-400 truncate">{item.label}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-900 dark:text-white pl-2.5">{item.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Column 3: Export Advisory PDF/Excel */}
            <div className="flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-amber-100 dark:border-amber-900/20 pt-4 lg:pt-0 lg:pl-6 space-y-3">
              <div>
                <h5 className="text-[11px] font-bold text-gray-400 uppercase tracking-tight">{t('advisoryDocGen')}</h5>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 mb-2">
                  {t('advisoryDocGenSub')}
                </p>
                {/* File Type Selection */}
                <div className="flex gap-2 mb-2">
                  {[
                    { id: 'pdf', label: 'PDF Report' },
                    { id: 'excel', label: 'Excel (XLS)' },
                    { id: 'csv', label: 'CSV Sheet' }
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      onClick={() => setTrendsFormat(fmt.id as any)}
                      className={`flex-1 py-1.5 px-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                        trendsFormat === fmt.id
                          ? 'border-amber-600 bg-amber-600 text-white'
                          : 'border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-400 bg-transparent hover:bg-amber-500/10'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>
              <button 
                onClick={async () => {
                  setIsExporting(true);
                  try {
                    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
                    const response = await fetch(API_BASE, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                      },
                      body: JSON.stringify({
                        data_types: ['trends'],
                        date_range: dateRange,
                        format: trendsFormat
                      })
                    });
                    if (response.ok) {
                      setExportSuccess(true);
                      fetchHistory();
                      setTimeout(() => setExportSuccess(false), 3000);
                    }
                  } catch (err) {
                    console.error("Export failed", err);
                  } finally {
                    setIsExporting(false);
                  }
                }}
                disabled={isExporting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-sm hover:shadow disabled:opacity-50"
              >
                <Download size={14} /> {t('downloadAdvisoryReport')} ({trendsFormat.toUpperCase()})
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Configuration Area */}
        <div className="space-y-6">
          {/* Data Type */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Filter size={16} className="text-[#2E7D32]" /> {t('selectCategories')}
              </h4>
              <button 
                onClick={() => {
                  if (selectedDataTypes.length === dataTypes.length) {
                    setSelectedDataTypes([dataTypes[0].id]);
                  } else {
                    setSelectedDataTypes(dataTypes.map(t => t.id));
                  }
                }}
                className="text-[10px] font-bold text-[#2E7D32] hover:underline uppercase"
              >
                {selectedDataTypes.length === dataTypes.length ? t('reset') : t('selectAll')}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {dataTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => toggleCategory(type.id)}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                    selectedDataTypes.includes(type.id)
                      ? 'border-[#2E7D32] bg-green-50 dark:bg-green-900/20 text-[#2E7D32] dark:text-green-400 ring-1 ring-[#2E7D32]'
                      : 'border-gray-200 dark:border-gray-700 bg-card dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-muted dark:hover:bg-gray-700'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Calendar size={16} className="text-[#2E7D32]" /> {t('selectDateRange')}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: '7days', label: t('last7Days') },
                { id: '30days', label: t('last30Days') },
                { id: 'thisYear', label: t('thisYear') },
                { id: 'custom', label: t('customRange') }
              ].map((range) => (
                <button
                  key={range.id}
                  onClick={() => setDateRange(range.id as any)}
                  className={`px-4 py-2 rounded-lg border text-xs font-medium transition-all ${
                    dateRange === range.id
                      ? 'border-gray-900 dark:border-white bg-gray-900 dark:bg-white text-white dark:text-gray-900'
                      : 'border-gray-200 dark:border-gray-700 bg-card dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-muted dark:hover:bg-gray-700'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Formats */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <Download size={16} className="text-[#2E7D32]" /> {t('selectFormat')}
            </h4>
            <div className="flex gap-4">
              {[
                { id: 'csv', label: 'CSV', icon: FileSpreadsheet },
                { id: 'excel', label: 'Excel', icon: FileSpreadsheet },
                { id: 'pdf', label: 'PDF', icon: FileText }
              ].map((format) => (
                <button
                  key={format.id}
                  onClick={() => setSelectedFormat(format.id as any)}
                  className={`flex-1 flex flex-col items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                    selectedFormat === format.id
                      ? 'border-[#2E7D32] bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-100 dark:border-gray-700 bg-card dark:bg-gray-800 hover:border-gray-200 dark:hover:border-gray-600'
                  }`}
                >
                  <format.icon size={24} className={selectedFormat === format.id ? 'text-[#2E7D32]' : 'text-gray-400 dark:text-gray-500'} />
                  <span className={`text-xs font-bold ${selectedFormat === format.id ? 'text-[#2E7D32]' : 'text-gray-500 dark:text-gray-400'}`}>{format.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold py-6 rounded-lg transition-all"
          >
            {isExporting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> {t('generatingLabel')}
              </span>
            ) : exportSuccess ? (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> {t('exportSuccessLabel')}
              </span>
            ) : (
              t('generateExportFile')
            )}
          </Button>
        </div>

        {/* History Area */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h4 className="font-bold text-gray-800 dark:text-white">{t('exportHistoryTitle')}</h4>
          </div>

          <div className="bg-muted/50 dark:bg-gray-900/50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-4 flex-1">
            {(() => {
              const totalPages = Math.ceil(exportHistory.length / itemsPerPage);
              const paginatedHistory = exportHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
              const getPageNumbers = () => {
                const pages: (number | string)[] = [];
                const range = 1;
                for (let i = 1; i <= totalPages; i++) {
                  if (
                    i === 1 ||
                    i === totalPages ||
                    (i >= currentPage - range && i <= currentPage + range)
                  ) {
                    pages.push(i);
                  } else if (pages[pages.length - 1] !== '...') {
                    pages.push('...');
                  }
                }
                return pages;
              };

              return (
                <>
                  {paginatedHistory.length === 0 ? (
                    <div className="text-center py-10">
                      <Database className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2 opacity-50" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('noExportHistory')}</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {paginatedHistory.map((item) => (
                          <div key={item.id} className="bg-card dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-md ${item.format === 'pdf' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : item.format === 'csv' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'}`}>
                                <FileText size={16} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-bold text-gray-900 dark:text-white">{item.export_id}</p>
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${item.status === 'COMPLETED' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'}`}>
                                    {item.status}
                                  </span>
                                </div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                                  {(item.data_types ? (Array.isArray(item.data_types) ? item.data_types.join(', ') : item.data_types) : (item.data_type || 'Data')).toUpperCase()} • {new Date(item.created_at).toLocaleDateString()} • {(item.format || 'csv').toUpperCase()} • {item.file_size || '0 KB'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              {item.file && (
                                <a 
                                  href={item.file.startsWith('http') ? item.file : `http://127.0.0.1:8000${item.file}`} 
                                  download
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 transition-colors" 
                                  title={t('download')}
                                >
                                  <Download size={14} />
                                </a>
                              )}
                              <button onClick={() => deleteHistoryItem(item.id)} className="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-red-500 dark:text-red-400 transition-colors" title={t('delete')}>
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-150 dark:border-gray-800">
                          <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">
                            {currentLanguage === 'si' ? (
                              `ගොනු ${exportHistory.length} කින් ${Math.min(exportHistory.length, (currentPage - 1) * itemsPerPage + 1)}-${Math.min(exportHistory.length, currentPage * itemsPerPage)} දක්වා පෙන්වයි`
                            ) : currentLanguage === 'ta' ? (
                              `கோப்புகள் ${exportHistory.length} இல் ${Math.min(exportHistory.length, (currentPage - 1) * itemsPerPage + 1)}-${Math.min(exportHistory.length, currentPage * itemsPerPage)} காட்டப்படுகிறது`
                            ) : (
                              `Showing ${Math.min(exportHistory.length, (currentPage - 1) * itemsPerPage + 1)}-${Math.min(exportHistory.length, currentPage * itemsPerPage)} of ${exportHistory.length} files`
                            )}
                          </p>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                              className="px-2.5 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[10px] font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                            >
                              {t('prev')}
                            </button>
                            {getPageNumbers().map((pageNum, idx) => {
                              if (pageNum === '...') {
                                return (
                                  <span key={`ellipsis-${idx}`} className="px-1 text-[10px] font-bold text-gray-400 dark:text-gray-600">
                                    ...
                                  </span>
                                );
                              }
                              return (
                                <button
                                  key={`page-${pageNum}`}
                                  onClick={() => setCurrentPage(pageNum as number)}
                                  className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold transition-all cursor-pointer ${
                                    currentPage === pageNum
                                      ? 'bg-[#2E7D32] text-white'
                                      : 'border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                  }`}
                                >
                                  {pageNum}
                                </button>
                               );
                            })}
                            <button
                              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                              disabled={currentPage === totalPages}
                              className="px-2.5 py-1 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[10px] font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                            >
                              {t('next')}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </>
              );
            })()}
          </div>
          
          <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
            <p className="text-[10px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-tight">
              {t('cloudStorageStatus')}
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
