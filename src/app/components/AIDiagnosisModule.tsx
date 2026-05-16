import { useState, useRef, useEffect } from 'react';
import { Card } from './ui/card';
import { Upload, CircleCheck, CircleAlert, Leaf, Loader2, X, History, Calendar, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { TreatmentRecommendation } from './TreatmentRecommendation';

export function AIDiagnosisModule() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // New state to control the Unknown Disease popup
  const [showUnknownModal, setShowUnknownModal] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);

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
      const token = localStorage.getItem('access_token');
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

  useEffect(() => {
    fetchHistory();
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
      toast.error("Please select an image first");
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('image', selectedFile);
    // Add dummy location info
    formData.append('location_name', 'Field Sector A');

    try {
      const token = localStorage.getItem('access_token');
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
        
        // Notify other components to refresh
        window.dispatchEvent(new CustomEvent('watermelon-new-scan'));

        // CHECK TRIGGER FOR UNKNOWN DISEASE MODAL
        const diseaseName = data.prediction?.disease_name?.toLowerCase() || '';
        if (diseaseName.includes('unknown') || data.prediction?.confidence < 0.3) {
          setShowUnknownModal(true);
        } else {
          toast.success("Analysis complete");
        }
      } else {
        toast.error(data.error || "Failed to analyze image");
      }
    } catch (err) {
      toast.error("Network error. Ensure backend is running.");
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
  };

  return (
    <>
      <Card className="p-6 relative">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">AI Disease Diagnosis</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">AI රෝග විනිශ්චය පද්ධතිය</p>
          </div>
          <Leaf className="w-8 h-8 text-[#2E7D32]" />
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
                <p className="font-medium text-gray-700 dark:text-gray-200 mb-1">Upload Leaf Image</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">ලීෆ් රූපයක් උඩුගත කරන්න</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                  Click to browse<br />
                  Supported: JPG, PNG (Max 10MB)
                </p>
              </div>
            ) : (
              <div className="relative border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex-1 min-h-[250px]">
                <button
                  onClick={clearSelection}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 z-10 transition-colors"
                  title="Clear image"
                >
                  <X className="w-4 h-4" />
                </button>
                <img
                  src={showHeatmap && analysisResult?.prediction?.heatmap_image 
                    ? analysisResult.prediction.heatmap_image 
                    : (typeof previewUrl === 'string' && previewUrl ? (
                    previewUrl.startsWith('http') || previewUrl.startsWith('blob:') 
                      ? previewUrl 
                      : `http://127.0.0.1:8000${previewUrl.startsWith('/media/') ? '' : previewUrl.startsWith('media/') ? '' : '/media/'}${previewUrl.startsWith('/') ? '' : '/'}${previewUrl}`
                  ) : '')}
                  alt="Selected leaf"
                  className="w-full h-full object-cover absolute inset-0 transition-all duration-300"
                />
                
                {analysisResult?.prediction?.heatmap_image && (
                  <button
                    onClick={() => setShowHeatmap(!showHeatmap)}
                    className="absolute bottom-2 right-2 px-3 py-1.5 bg-black/60 backdrop-blur-md text-white rounded-full hover:bg-black/80 z-10 transition-colors text-xs font-bold flex items-center gap-2 shadow-lg"
                  >
                    {showHeatmap ? <><EyeOff className="w-3.5 h-3.5" /> Hide Heatmap</> : <><Eye className="w-3.5 h-3.5" /> Show AI Heatmap</>}
                  </button>
                )}
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
                  <Loader2 className="w-5 h-5 animate-spin" /> Analyzing Image...
                </span>
              ) : (
                "Analyze Disease"
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
                    <h4 className="font-extrabold text-green-900 dark:text-green-300 text-lg">Analysis Complete</h4>
                    <p className="text-xs font-medium text-green-700 dark:text-green-500">Job ID: {analysisResult.id}</p>
                  </div>
                </div>

                {/* Disease Detection */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-green-100 dark:border-green-900/50 p-5 mb-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${analysisResult.prediction?.severity === 'HIGH' ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400'}`}>
                      {analysisResult.prediction?.severity || 'UNKNOWN'} SEVERITY
                    </span>
                  </div>

                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tracking-wider uppercase mb-1 block">Detected Condition</span>
                  <span className="text-xl font-black text-gray-900 dark:text-white block mb-4">
                    {analysisResult.prediction?.disease_name || 'Processing...'}
                  </span>

                  {/* Confidence Score */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-gray-600 dark:text-gray-400">AI Confidence Score</span>
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
                </div>



                <div className="flex gap-3 mt-auto">
                  <Button className="flex-1 bg-white dark:bg-gray-800 text-[#2E7D32] dark:text-green-400 border-2 border-[#2E7D32] dark:border-green-800 hover:bg-green-50 dark:hover:bg-gray-700 shadow-sm font-bold" onClick={() => clearSelection()}>
                    New Scan
                  </Button>
                </div>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-gray-50 dark:bg-gray-800/50 flex-1 flex flex-col items-center justify-center text-center">
                <Leaf className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3 animate-pulse" />
                <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Awaiting Image</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm max-w-[250px] mt-1">
                  Upload a clear picture of an infected crop leaf to see the AI analysis here
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
            EXTERNAL AI MODEL <span className="opacity-60 font-medium px-2">&bull;</span> STATUS: ACTIVE <span className="opacity-60 font-medium px-2">&bull;</span> ENDPOINT: /api/disease/analyze/
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
            <h4 className="font-bold text-gray-800 dark:text-white">Recent Scans History</h4>
          </div>

          {isLoadingHistory ? (
            <div className="flex justify-center p-4">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : history.length === 0 ? (
            <p className="text-sm text-gray-500 text-center p-4">No recent scans found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {history.slice(0, 4).map((item: any) => (
                <div
                  key={item.id}
                  className={`bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 border transition-all cursor-pointer ${analysisResult?.id === item.id ? 'border-green-500 ring-2 ring-green-500/20' : 'border-gray-200 dark:border-gray-700 hover:border-green-300'}`}
                  onClick={() => loadHistoryItem(item)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.status === 'COMPLETED' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-400'}`}>
                      {item.status}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 font-medium">
                      <Calendar className="w-3 h-3" />
                      {new Date(item.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="font-bold text-sm text-gray-900 dark:text-white mb-1 truncate" title={item.prediction?.disease_name}>
                    {item.prediction?.disease_name || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between items-center mt-2">
                    <span>Confidence:</span>
                    <span className="font-bold text-gray-700 dark:text-gray-200">
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

            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 relative z-10">Unknown Disease Found</h3>

            <p className="text-gray-600 dark:text-gray-400 mb-7 text-sm leading-relaxed relative z-10">
              The AI model could not accurately classify the disease in this picture. Please <strong className="text-gray-900 dark:text-gray-100">contact your supervisor</strong> to perform a manual inspection and for further studying in the lab.
            </p>

            <div className="flex flex-col gap-3 relative z-10">
              <Button
                onClick={() => setShowUnknownModal(false)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-6 rounded-xl shadow-lg shadow-red-600/30 transition-all hover:scale-[1.02]"
              >
                Acknowledge Warning
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowUnknownModal(false)}
                className="w-full font-bold py-6 rounded-xl dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}