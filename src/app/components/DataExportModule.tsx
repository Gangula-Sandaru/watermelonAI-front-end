import React, { useState } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Download, FileText, Calendar, Filter, Database, FileSpreadsheet, CheckCircle2, Loader2, History, Trash2 } from 'lucide-react';

export const DataExportModule = () => {
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'pdf' | 'excel'>('csv');
  const [selectedDataType, setSelectedDataType] = useState<'all' | 'disease' | 'satellite' | 'yield'>('all');
  const [dateRange, setDateRange] = useState<'7days' | '30days' | 'thisYear' | 'custom'>('30days');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportHistory, setExportHistory] = useState<any[]>([]);

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

  React.useEffect(() => {
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
          data_type: selectedDataType,
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

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-semibold text-gray-900">Data Export Center</h3>
          <p className="text-sm text-gray-500">දත්ත අපනයන මධ්‍යස්ථානය</p>
        </div>
        <Database className="w-8 h-8 text-[#2E7D32]" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Configuration Area */}
        <div className="space-y-6">
          {/* Data Type */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Filter size={16} className="text-[#2E7D32]" /> Select Data Type
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'all', label: 'All Farm Data' },
                { id: 'disease', label: 'Disease Scans' },
                { id: 'satellite', label: 'Satellite Data' },
                { id: 'yield', label: 'Yield Predictions' }
              ].map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedDataType(type.id as any)}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium transition-all ${
                    selectedDataType === type.id
                      ? 'border-[#2E7D32] bg-green-50 text-[#2E7D32] ring-1 ring-[#2E7D32]'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Calendar size={16} className="text-[#2E7D32]" /> Date Range
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
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Formats */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Download size={16} className="text-[#2E7D32]" /> Export Format
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
                      ? 'border-[#2E7D32] bg-green-50'
                      : 'border-gray-100 bg-white hover:border-gray-200'
                  }`}
                >
                  <format.icon size={24} className={selectedFormat === format.id ? 'text-[#2E7D32]' : 'text-gray-400'} />
                  <span className={`text-xs font-bold ${selectedFormat === format.id ? 'text-[#2E7D32]' : 'text-gray-500'}`}>{format.label}</span>
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
            <History className="w-5 h-5 text-gray-500" />
            <h4 className="font-bold text-gray-800">Export History</h4>
          </div>

          <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-4 flex-1">
            <div className="space-y-3">
              {exportHistory.length === 0 ? (
                <div className="text-center py-10">
                  <Database className="w-10 h-10 text-gray-300 mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-gray-500">No export history found</p>
                </div>
              ) : (
                exportHistory.map((item) => (
                  <div key={item.id} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-md ${item.format === 'pdf' ? 'bg-red-50 text-red-600' : item.format === 'csv' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                        <FileText size={16} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-gray-900">{item.export_id}</p>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${item.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                            {item.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500">
                          {item.data_type.toUpperCase()} • {new Date(item.created_at).toLocaleDateString()} • {item.format.toUpperCase()} • {item.file_size || '0 KB'}
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
                          className="p-1 hover:bg-gray-100 rounded text-gray-500 transition-colors" 
                          title="Download"
                        >
                          <Download size={14} />
                        </a>
                      )}
                      <button onClick={() => deleteHistoryItem(item.id)} className="p-1 hover:bg-red-50 rounded text-red-500 transition-colors" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex items-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
            <p className="text-[10px] font-bold text-blue-800 uppercase tracking-tight">
              Cloud Storage: 84% Free • Auto-Cleanup: Enabled
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
