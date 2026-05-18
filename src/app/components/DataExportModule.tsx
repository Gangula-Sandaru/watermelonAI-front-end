import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Download, FileText, Calendar, Filter, Database, FileSpreadsheet, CheckCircle2, Loader2, History, Trash2 } from 'lucide-react';

export const DataExportModule = ({ userData }: { userData: any }) => {
  const role = userData?.role?.toLowerCase() || 'farmer';
  const isOfficer = role.includes('officer');
  const isResearcher = role.includes('researcher');

  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'pdf' | 'excel'>('csv');
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>(['all']);
  const [dateRange, setDateRange] = useState<'7days' | '30days' | 'thisYear' | 'custom'>('30days');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportHistory, setExportHistory] = useState<any[]>([]);

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

  useEffect(() => {
    fetchHistory();
  }, []);

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
        { id: 'escalations', label: 'Escalation Logs' },
        { id: 'reviews', label: 'Expert Reviews' },
        { id: 'regional', label: 'Regional Analytics' },
        { id: 'disease', label: 'Disease Distribution' }
      ];
    }
    if (isResearcher) {
      return [
        { id: 'global', label: 'Global Disease Data' },
        { id: 'anonymized', label: 'Anonymized Scans' },
        { id: 'outbreaks', label: 'Outbreak History' },
        { id: 'trends', label: 'Migration Trends' }
      ];
    }
    // Farmer
    return [
      { id: 'all', label: 'All Farm Data' },
      { id: 'disease', label: 'My Disease Scans' },
      { id: 'satellite', label: 'My Satellite Data' },
      { id: 'yield', label: 'My Yield Predictions' }
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
            {isOfficer ? 'Administrative Data Export' : isResearcher ? 'Research Data Center' : 'Farm Data Export Center'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isOfficer ? 'නිලධාරි දත්ත අපනයනය' : isResearcher ? 'පර්යේෂණ දත්ත මධ්‍යස්ථානය' : 'ගොවිපල දත්ත අපනයන මධ්‍යස්ථානය'}
          </p>
        </div>
        <Database className="w-8 h-8 text-[#2E7D32]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Configuration Area */}
        <div className="space-y-6">
          {/* Data Type */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Filter size={16} className="text-[#2E7D32]" /> 1. Select Categories
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
                {selectedDataTypes.length === dataTypes.length ? 'Reset' : 'Select All'}
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
              <Calendar size={16} className="text-[#2E7D32]" /> 2. Date Filter
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: '7days', label: 'Last 7 Days' },
                { id: '30days', label: 'Last 30 Days' },
                { id: 'thisYear', label: 'Current Year' },
                { id: 'custom', label: 'Custom Range' }
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
              <Download size={16} className="text-[#2E7D32]" /> 3. Export Format
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
                <Loader2 className="w-5 h-5 animate-spin" /> Generating...
              </span>
            ) : exportSuccess ? (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" /> Export Successful
              </span>
            ) : (
              "Generate Export File"
            )}
          </Button>
        </div>

        {/* History Area */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h4 className="font-bold text-gray-800 dark:text-white">Export History</h4>
          </div>

          <div className="bg-muted/50 dark:bg-gray-900/50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-4 flex-1">
            <div className="space-y-3">
              {exportHistory.length === 0 ? (
                <div className="text-center py-10">
                  <Database className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No export history found</p>
                </div>
              ) : (
                exportHistory.map((item) => (
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
                          title="Download"
                        >
                          <Download size={14} />
                        </a>
                      )}
                      <button onClick={() => deleteHistoryItem(item.id)} className="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-red-500 dark:text-red-400 transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
            <p className="text-[10px] font-bold text-blue-800 dark:text-blue-400 uppercase tracking-tight">
              Cloud Storage: 84% Free • Auto-Cleanup: Enabled
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
