import { useState, useRef, useEffect } from 'react';
import { Card } from './ui/card';
import { Upload, CircleCheck, CircleAlert, Leaf, Loader2, X, History, Calendar, AlertTriangle, Eye, EyeOff, Maximize2, Brain } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { TreatmentRecommendation } from './TreatmentRecommendation';
import { useTranslation } from '../utils/translations';

const getFullUrl = (url: string | null) => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:') || url.startsWith('data:')) {
    return url;
  }
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `http://127.0.0.1:8000${cleanUrl}`;
};

export function AIDiagnosisModule() {
  const { t, currentLanguage } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // New state to control the Unknown Disease popup
  const [showUnknownModal, setShowUnknownModal] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);

  // Active AI Model and Proxy endpoints state
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [modelHealth, setModelHealth] = useState<'online' | 'offline' | 'loading'>('loading');
  const [isSwitchingModel, setIsSwitchingModel] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseRecommendationString = (recStr: any) => {
    if (typeof recStr !== 'string') return recStr;
    try {
      return JSON.parse(recStr);
    } catch {
      try {
        const organicMatch = recStr.match(/'organic':\s*\[(.*?)\]/);
        const chemicalMatch = recStr.match(/'chemical':\s*\[(.*?)\]/);
        const physicalMatch = recStr.match(/'physical':\s*\[(.*?)\]/);
        const guidelinesMatch = recStr.match(/'guidelines':\s*\[(.*?)\]/);

        const extractList = (match: RegExpMatchArray | null) => {
          if (!match || !match[1]) return [];
          const items = [...match[1].matchAll(/'([^']+)'|"([^"]+)"/g)];
          return items.map(m => m[1] || m[2]);
        };

        const result = {
          organic: extractList(organicMatch),
          chemical: extractList(chemicalMatch),
          physical: extractList(physicalMatch),
          guidelines: extractList(guidelinesMatch),
        };

        if (!result.organic.length && !result.chemical.length && !result.physical.length && !result.guidelines.length) {
          return recStr;
        }
        return result;
      } catch (err) {
        return recStr;
      }
    }
  };

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/disease/history/', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setHistory(data);
      }
    } catch (error) {
      console.error("Failed to fetch history", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const fetchModelInfo = async () => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

      // 1. Fetch Health
      const healthRes = await fetch('http://127.0.0.1:8000/api/disease/model/health/', { headers });
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setModelHealth(healthData.status === 'healthy' ? 'online' : 'offline');
      } else {
        setModelHealth('offline');
      }

      // 2. Fetch Info
      const infoRes = await fetch('http://127.0.0.1:8000/api/disease/model/info/', { headers });
      if (infoRes.ok) {
        const infoData = await infoRes.json();
        setModelInfo(infoData);
      }

      // 3. Fetch Available
      const availRes = await fetch('http://127.0.0.1:8000/api/disease/model/available/', { headers });
      if (availRes.ok) {
        const availData = await availRes.json();
        setAvailableModels(availData.available_models || []);
      }
    } catch (err) {
      console.error("Failed to load model details", err);
      setModelHealth('offline');
    }
  };

  const handleModelSwitch = async (modelFilename: string) => {
    if (isSwitchingModel) return;
    setIsSwitchingModel(true);
    const toastId = toast.loading(`${t('switchingModelMsg')}${modelFilename}...`);

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/disease/model/switch/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ model_filename: modelFilename })
      });

      if (response.ok) {
        toast.success(`${t('switchedModelSuccess')}${modelFilename}`, { id: toastId });
        await fetchModelInfo(); // Refresh active model details
      } else {
        const data = await response.json();
        toast.error(data.detail || t('failedSwitchModel'), { id: toastId });
      }
    } catch (err) {
      toast.error(t('failedSwitchModelNetwork'), { id: toastId });
    } finally {
      setIsSwitchingModel(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    fetchModelInfo();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysisResult(null);
      setShowHeatmap(false);
    }
  };

  const handleAnalyzeClick = async () => {
    if (!selectedFile) {
      toast.error(t('selectImageFirst'));
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('image', selectedFile);
    // Add dummy location info
    formData.append('location_name', 'Field Sector A');

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/disease/analyze/', {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData,
      });

      if (response.status === 401) {
        window.dispatchEvent(new CustomEvent('watermelon-auth-error'));
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setAnalysisResult(data);
        fetchHistory(); // Refresh local history

        // Auto-show heatmap if available
        const hasHeatmap = data?.prediction?.heatmap_image || data?.prediction?.raw_response?.predictions?.heatmap_image || data?.prediction?.raw_response?.heatmap_image;
        if (hasHeatmap) {
          setShowHeatmap(true);
        }

        // Notify other components to refresh
        window.dispatchEvent(new CustomEvent('watermelon-new-scan'));

        // CHECK TRIGGER FOR UNKNOWN DISEASE MODAL
        const diseaseName = data.prediction?.disease_name?.toLowerCase() || '';
        if (diseaseName.includes('unknown') || data.prediction?.confidence < 0.3) {
          setShowUnknownModal(true);
        } else {
          toast.success(t('analysisCompleteToast'));
        }
      } else {
        toast.error(data.error || t('failedAnalyzeImage'));
      }
    } catch (err) {
      toast.error(t('networkErrorBackend'));
    } finally {
      setIsLoading(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysisResult(null);
    setShowHeatmap(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const loadHistoryItem = (item: any) => {
    setAnalysisResult(item);
    setPreviewUrl(item.image); // Display remote history image
    setSelectedFile(null); // Since it's from history, no local file

    // Auto-show heatmap if available
    const hasHeatmap = item?.prediction?.heatmap_image || item?.prediction?.raw_response?.predictions?.heatmap_image || item?.prediction?.raw_response?.heatmap_image;
    if (hasHeatmap) {
      setShowHeatmap(true);
    } else {
      setShowHeatmap(false);
    }
  };

  return (
    <>
      <Card className="p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{t('aiDiseaseDiagnosis')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('aiDiseaseDiagnosisSub')}</p>
          </div>
          <Leaf className="w-8 h-8 text-[#2E7D32]" />
        </div>

        {/* 🧠 Full-Width AI Classifier Settings Header 🧠 */}
        <div className="w-full mb-6 p-5 bg-gray-50/70 dark:bg-gray-800/40 rounded-2xl border border-gray-200/60 dark:border-gray-700/50 shadow-sm relative overflow-hidden transition-all duration-300 hover:shadow-md">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400 animate-pulse" />
              </div>
              <div>
                <h4 className="font-extrabold text-gray-900 dark:text-white text-base">{t('classifierModelSettings')}</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('classifierModelSettingsSub')}</p>
              </div>
            </div>

            {/* Health & Switcher controls */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Health status indicator */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-gray-800/80 shadow-sm border border-gray-150 dark:border-gray-700/40 text-xs">
                <span className="relative flex h-2 w-2">
                  {modelHealth === 'online' && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${modelHealth === 'online' ? 'bg-green-500' : modelHealth === 'loading' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`}></span>
                </span>
                <span className="font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400">
                  {t('modelStatusLabel')} <span className={modelHealth === 'online' ? 'text-green-600 dark:text-green-400' : 'text-red-500'}>{modelHealth}</span>
                </span>
              </div>

              {/* Model Switcher Select dropdown */}
              {availableModels.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:inline">{t('switchActiveModel')}</span>
                  <select
                    onChange={(e) => handleModelSwitch(e.target.value)}
                    value={modelInfo?.current_file || ''}
                    disabled={isSwitchingModel}
                    className="px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#2E7D32]/10 focus:border-[#2E7D32] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {availableModels.map((filename) => (
                      <option key={filename} value={filename}>
                        {filename}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Model info labels row */}
          {modelInfo && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
              <div className="bg-white dark:bg-gray-800/60 p-3 rounded-xl border border-gray-100 dark:border-gray-700/40 flex justify-between items-center text-xs">
                <span className="text-gray-500 dark:text-gray-400 font-semibold">{t('activeFile')}</span>
                <span className="font-black text-purple-600 dark:text-purple-400 tracking-wide font-mono truncate max-w-[190px]" title={modelInfo.current_file}>
                  {modelInfo.current_file}
                </span>
              </div>
              <div className="bg-white dark:bg-gray-800/60 p-3 rounded-xl border border-gray-100 dark:border-gray-700/40 flex justify-between items-center text-xs">
                <span className="text-gray-500 dark:text-gray-400 font-semibold">{t('supportedClasses')}</span>
                <span className="font-bold text-gray-900 dark:text-white">{modelInfo.num_classes} {t('categoriesLabel')}</span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload Area */}
          <div className="flex flex-col">
            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer flex-1 flex flex-col items-center justify-center min-h-[250px]"
              >
                <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                <p className="font-medium text-gray-700 dark:text-gray-200 mb-1">{t('uploadLeafImage')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('uploadLeafImageSub')}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                  {t('clickToBrowse')}<br />
                  {t('supportedFormatsDisclaimer')}
                </p>
              </div>
            ) : (
              <div className="relative border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex-1 min-h-[250px]">
                <button
                  onClick={clearSelection}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 z-10 transition-colors animate-in fade-in zoom-in-50"
                  title={t('clearImage')}
                >
                  <X className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setIsMaximized(true)}
                  className="absolute top-2 left-2 p-1.5 bg-black/60 backdrop-blur-md text-white rounded-full hover:bg-black/80 z-10 transition-colors shadow-md flex items-center justify-center animate-in fade-in zoom-in-50"
                  title={t('maximizeImage')}
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
                {(() => {
                  const heatmapImg = analysisResult?.prediction?.heatmap_image || analysisResult?.prediction?.raw_response?.predictions?.heatmap_image || analysisResult?.prediction?.raw_response?.heatmap_image;

                  return (
                    <>
                      <img
                        src={showHeatmap && heatmapImg ? getFullUrl(heatmapImg) : getFullUrl(previewUrl)}
                        alt="Selected leaf"
                        className="w-full h-full object-cover absolute inset-0 transition-all duration-300"
                      />

                      {heatmapImg && (
                        <button
                          onClick={() => setShowHeatmap(!showHeatmap)}
                          className="absolute bottom-2 right-2 px-3 py-1.5 bg-black/60 backdrop-blur-md text-white rounded-full hover:bg-black/80 z-10 transition-colors text-xs font-bold flex items-center gap-2 shadow-lg"
                        >
                          {showHeatmap ? <><EyeOff className="w-3.5 h-3.5" /> {t('hideHeatmap')}</> : <><Eye className="w-3.5 h-3.5" /> {t('showHeatmap')}</>}
                        </button>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/jpeg, image/png"
              className="hidden"
            />

            <Button
              onClick={handleAnalyzeClick}
              disabled={!selectedFile || isLoading}
              className="mt-4 w-full bg-[#2E7D32] hover:bg-[#1B5E20] text-white shadow-md transition-all font-semibold py-6 disabled:opacity-50"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> {t('analyzingImage')}
                </span>
              ) : (
                t('analyzeDisease')
              )}
            </Button>
          </div>

          {/* Analysis Results Area */}
          <div className="flex flex-col h-full">
            {analysisResult ? (
              <div className="bg-green-50/50 dark:bg-green-950/20 border-2 border-green-500 rounded-xl p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
                    <CircleCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-green-900 dark:text-green-300 text-lg">{t('analysisComplete')}</h4>
                    <p className="text-xs font-medium text-green-700 dark:text-green-500">{t('jobId')} {analysisResult.id}</p>
                  </div>
                </div>

                {/* Disease Detection */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-900/50 p-5 mb-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${analysisResult.prediction?.severity === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'}`}>
                      {analysisResult.prediction?.severity || 'UNKNOWN'} {t('severitySuffix')}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase mb-1 block">{t('detectedCondition')}</span>
                  <span className="text-xl font-black text-gray-900 dark:text-white block mb-4">
                    {analysisResult.prediction?.disease_name || 'Processing...'}
                  </span>

                  {/* Confidence Score */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400">{t('aiConfidenceScore')}</span>
                      <span className="text-sm font-black text-[#2E7D32] dark:text-green-400">
                        {((analysisResult.prediction?.confidence || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-green-500 to-[#2E7D32] h-full rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${(analysisResult.prediction?.confidence || 0) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* AI Model Details */}
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">{t('aiPredictionModel')}</span>
                    <span className="font-bold text-green-700 dark:text-green-400">
                      {analysisResult.prediction?.model_version || 'Watermelon-V1 (v1.0.0)'}
                    </span>
                  </div>
                </div>



                <div className="flex gap-3 mt-auto">
                  <Button className="flex-1 bg-white dark:bg-gray-800 text-[#2E7D32] dark:text-green-400 border-2 border-[#2E7D32] dark:border-green-800 hover:bg-green-50 dark:hover:bg-gray-700 shadow-sm font-bold" onClick={() => clearSelection()}>
                    {t('newScanButton')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-gray-50 dark:bg-gray-800/50 flex-1 flex flex-col items-center justify-center text-center">
                <Leaf className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3 animate-pulse" />
                <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">{t('awaitingImage')}</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm max-w-[250px] mt-1">
                  {t('awaitingImageSub')}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30 flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
          </span>
          <p className="text-xs font-semibold text-blue-800 dark:text-blue-400 tracking-wide">
            {t('externalAiModel')} <span className="opacity-60 font-medium px-2">&bull;</span> {t('activeModelLabel')} {analysisResult?.prediction?.model_version || 'Watermelon-V1'} <span className="opacity-60 font-medium px-2">&bull;</span> {t('statusLabelUpper')} ACTIVE <span className="opacity-60 font-medium px-2">&bull;</span> {t('endpointLabel')} /api/disease/analyze/
          </p>
        </div>

        {/* Treatment Recommendation Component */}
        {(() => {
          const recData = analysisResult ? parseRecommendationString((analysisResult.prediction || analysisResult.predictions)?.recommendation) : null;
          if (!recData) return null;

          return (
            <TreatmentRecommendation
              diseaseName={analysisResult.prediction?.disease_name}
              recommendationData={recData}
            />
          );
        })()}


        {/* History Section */}
        <div className="mt-8 border-t border-gray-100 dark:border-gray-700 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h4 className="font-bold text-gray-800 dark:text-white">{t('recentScansHistory')}</h4>
          </div>

          {isLoadingHistory ? (
            <div className="flex justify-center p-4">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-gray-500 text-center p-4">{t('noRecentScans')}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {history.slice(0, 4).map((item: any) => (
                <div
                  key={item.id}
                  className={`bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border transition-all cursor-pointer flex flex-col justify-between ${analysisResult?.id === item.id ? 'border-green-500 ring-2 ring-green-500/20 shadow-md' : 'border-gray-200 dark:border-gray-700 hover:border-green-300 hover:shadow-sm'}`}
                  onClick={() => loadHistoryItem(item)}
                >
                  {item.image && (
                    <div className="relative aspect-[4/3] w-full rounded-lg overflow-hidden mb-3 bg-gray-100 dark:bg-gray-800 border border-gray-200/40 dark:border-gray-700/40">
                      <img
                        src={getFullUrl(item.image)}
                        alt={item.prediction?.disease_name || "Leaf Scan"}
                        className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${item.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400'}`}>
                      {item.status}
                    </span>
                    <div className="flex items-center gap-1 text-[9px] text-gray-500 dark:text-gray-400 font-medium">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="font-bold text-sm text-gray-900 dark:text-white mb-1 truncate" title={item.prediction?.disease_name}>
                    {item.prediction?.disease_name || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-800">
                    <span>{t('confidenceLabel')}</span>
                    <span className="font-bold text-[#2E7D32] dark:text-green-400">
                      {item.prediction?.confidence ? `${(item.prediction.confidence * 100).toFixed(1)}%` : '--'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* 🔴 UNKNOWN DISEASE WARNING MODAL 🔴 */}
      {showUnknownModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <style>{`
            @keyframes shatterLeft {
              0% { transform: rotate(0deg) translate(0, 0); }
              20% { transform: rotate(4deg) translate(2px, 0); }
              40% { transform: rotate(-4deg) translate(-5px, 0); }
              100% { transform: rotate(-12deg) translate(-15px, 5px); }
            }
            @keyframes shatterRight {
              0% { transform: rotate(0deg) translate(0, 0); }
              20% { transform: rotate(-4deg) translate(-2px, 0); }
              40% { transform: rotate(4deg) translate(5px, 0); }
              100% { transform: rotate(12deg) translate(15px, 5px); }
            }
          `}</style>

          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 duration-300 text-center border-t-[6px] border-red-500 relative overflow-hidden">
            {/* Background distress rings */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] aspect-square rounded-full border-[50px] border-red-50 dark:border-red-950/20 opacity-50 pointer-events-none" />

            <div className="mx-auto w-32 h-32 mb-4 relative drop-shadow-2xl">
              <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
                {/* Left Piece */}
                <g style={{ animation: 'shatterLeft 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards', transformOrigin: 'center' }}>
                  <path d="M 50 10 A 40 40 0 0 0 50 90 L 45 70 L 55 50 L 45 30 Z" fill="#2E7D32" stroke="#1B5E20" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M 50 16 A 34 34 0 0 0 50 84 L 46 70 L 54 50 L 46 30 Z" fill="#F44336" />
                  <circle cx="30" cy="40" r="2.5" fill="#111" />
                  <circle cx="28" cy="60" r="2.5" fill="#111" />
                  <circle cx="38" cy="50" r="2.5" fill="#111" />
                </g>
                {/* Right Piece */}
                <g style={{ animation: 'shatterRight 1s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards', transformOrigin: 'center' }}>
                  <path d="M 50 10 A 40 40 0 0 1 50 90 L 45 70 L 55 50 L 45 30 Z" fill="#2E7D32" stroke="#1B5E20" strokeWidth="2" strokeLinejoin="round" />
                  <path d="M 50 16 A 34 34 0 0 1 50 84 L 46 70 L 54 50 L 46 30 Z" fill="#F44336" />
                  <circle cx="70" cy="40" r="2.5" fill="#111" />
                  <circle cx="72" cy="60" r="2.5" fill="#111" />
                  <circle cx="62" cy="50" r="2.5" fill="#111" />
                </g>
              </svg>
            </div>

            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 relative z-10">{t('unknownDiseaseFound')}</h3>

            <p className="text-gray-600 dark:text-gray-400 mb-7 text-sm leading-relaxed relative z-10">
              {t('unknownDiseaseSub')}
            </p>

            <div className="flex flex-col gap-3 relative z-10">
              <Button
                onClick={() => setShowUnknownModal(false)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 rounded-xl shadow-lg shadow-red-600/30 transition-all hover:scale-[1.02]"
              >
                {t('acknowledgeWarning')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowUnknownModal(false)}
                className="w-full font-bold py-6 rounded-xl dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                {t('dismiss')}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* 🔴 MAXIMIZED IMAGE LIGHTBOX MODAL 🔴 */}
      {isMaximized && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative max-w-5xl w-full h-[85vh] flex flex-col items-center justify-center">
            <button
              onClick={() => setIsMaximized(false)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-gray-300 transition-colors flex items-center gap-1.5 font-bold text-sm bg-black/40 backdrop-blur-md rounded-full px-4 py-2"
            >
              <X className="w-5 h-5" /> {t('closeLightbox')}
            </button>
            <div className="bg-white dark:bg-gray-900 p-2 rounded-2xl overflow-hidden w-full h-full flex items-center justify-center shadow-2xl relative border border-gray-200 dark:border-gray-800">
              {(() => {
                const heatmapImg = analysisResult?.prediction?.heatmap_image || analysisResult?.prediction?.raw_response?.predictions?.heatmap_image || analysisResult?.prediction?.raw_response?.heatmap_image;
                const activeImg = showHeatmap && heatmapImg ? getFullUrl(heatmapImg) : getFullUrl(previewUrl);

                return (
                  <img
                    src={activeImg}
                    alt="Maximized leaf"
                    className="max-w-full max-h-full object-contain rounded-lg animate-in zoom-in-95 duration-200"
                  />
                );
              })()}

              {analysisResult && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md text-white px-6 py-3 rounded-full flex items-center gap-4 text-xs sm:text-sm font-semibold shadow-xl border border-white/10">
                  <span>{t('conditionLabel')} <strong className="text-green-400">{analysisResult.prediction?.disease_name || 'Healthy'}</strong></span>
                  <span className="opacity-40">|</span>
                  <span>{t('confidenceLabel')} <strong className="text-green-400">{((analysisResult.prediction?.confidence || 0) * 100).toFixed(1)}%</strong></span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}