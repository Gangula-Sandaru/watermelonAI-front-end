import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Database, 
  CheckCircle2, 
  Brain, 
  ArrowRight, 
  Download, 
  Filter, 
  Search,
  Loader2,
  Image as ImageIcon,
  History,
  TrendingUp,
  FileJson
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '../utils/translations';

interface TrainingData {
  id: number;
  correct_label: string;
  correct_recommendation: string;
  case_image: string | null;
  ai_prediction_details: {
    predicted_label: string;
    confidence: number;
    model_version: string;
  } | null;
  expert_decision: {
    officer_name: string;
    comments: string;
    conclusion: string;
  };
  is_verified: boolean;
  created_at: string;
}

export function AITrainingCenter() {
  const { t } = useTranslation();
  const [data, setData] = useState<TrainingData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [downloadingImages, setDownloadingImages] = useState(false);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://127.0.0.1:8000/api/escalation/training-data/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch training data", error);
      toast.error(t('failedLoadTrainingDataset'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = 'watermelon_ai_training_set.json';
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast.success(t('datasetExportedSuccess'));
  };

  const handleDownloadImages = async () => {
    setDownloadingImages(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://127.0.0.1:8000/api/escalation/training-data/images/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const linkElement = document.createElement('a');
        linkElement.href = url;
        linkElement.download = 'training_images.zip';
        linkElement.click();
        window.URL.revokeObjectURL(url);
        toast.success(t('imagesDownloadedSuccess'));
      } else if (response.status === 403) {
        toast.error('Access denied — researcher or admin role required.');
      } else {
        toast.error(t('failedDownloadImages'));
      }
    } catch (error) {
      console.error('Download error', error);
      toast.error(t('failedDownloadImages'));
    } finally {
      setDownloadingImages(false);
    }
  };

  const filteredData = data.filter(item => 
    item.correct_label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.ai_prediction_details?.predicted_label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-12 h-12 text-[#2E7D32] animate-spin mb-4" />
        <p className="text-gray-500 font-medium">{t('preparingFeedbackDataset')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-300 border-none shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-0.5">{t('groundTruthSamples')}</p>
              <h3 className="text-2xl font-bold mt-2">{data.length}</h3>
            </div>
            <Database className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
        </Card>
        
        <Card className="p-4 bg-green-50 dark:bg-green-900/20 text-green-900 dark:text-green-300 border-none shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-0.5">{t('verificationRate')}</p>
              <h3 className="text-2xl font-bold mt-2">100%</h3>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400" />
          </div>
        </Card>

        <Card className="p-4 bg-purple-50 dark:bg-purple-900/20 text-purple-900 dark:text-purple-300 border-none shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-0.5">{t('activeModel')}</p>
              <h3 className="text-xl font-bold mt-2">Watermelon-V1</h3>
            </div>
            <Brain className="w-8 h-8 text-purple-600 dark:text-purple-400" />
          </div>
        </Card>

        <Card className="p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-300 border-none shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-0.5">{t('retrainingStatus')}</p>
              <h3 className="text-2xl font-bold mt-2">{t('readyLabel')}</h3>
            </div>
            <TrendingUp className="w-8 h-8 text-amber-600 dark:text-amber-400" />
          </div>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-gray-100">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('aiFeedbackLoop')}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('feedbackLoopDesc')}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder={t('searchSamplesPlaceholder')} 
                className="pl-10 pr-4 py-2 bg-muted border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-[#2E7D32]/10 focus:border-[#2E7D32] outline-none transition-all w-64 text-gray-900 dark:text-gray-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleExportJSON} className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-xl px-4 py-2 flex items-center gap-2 font-bold shadow-sm">
                <FileJson size={16} />
                {t('jsonBtn')}
              </Button>
              <Button onClick={handleDownloadImages} disabled={downloadingImages} className="bg-[#1976D2] hover:bg-[#1565C0] text-white rounded-xl px-4 py-2 flex items-center gap-2 font-bold shadow-sm disabled:opacity-60">
                {downloadingImages
                  ? <Loader2 size={16} className="animate-spin" />
                  : <Download size={16} />}
                {downloadingImages ? 'Downloading…' : t('imagesZipBtn')}
              </Button>
            </div>
          </div>
        </div>

        <div>
          {filteredData.length > 0 ? (
            <div className="space-y-4">
              {filteredData.map((sample) => (
                <div key={sample.id} className="p-4 bg-muted/30 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-card hover:shadow-md transition-all group">
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Image Section */}
                    <div className="w-full md:w-48 h-32 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                      {sample.case_image ? (
                        <img 
                          src={sample.case_image} 
                          alt={t('sampleLabel')}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-600">
                          <ImageIcon size={32} />
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-[#2E7D32]/10 text-[#2E7D32] border-none font-bold">{t('sampleLabel')} #{sample.id}</Badge>
                        <span className="text-[10px] text-gray-400 font-bold uppercase">{new Date(sample.created_at).toLocaleDateString()}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg border border-red-100 dark:border-red-900/30">
                          <p className="text-[10px] font-bold text-red-600 dark:text-red-400 uppercase mb-1">{t('aiPrediction')}</p>
                          <p className="font-bold text-gray-900 dark:text-white">{sample.ai_prediction_details?.predicted_label || t('failedLabel')}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{t('confidenceLabel')}: {((sample.ai_prediction_details?.confidence || 0) * 100).toFixed(1)}%</p>
                        </div>
                        <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-100 dark:border-green-900/30">
                          <p className="text-[10px] font-bold text-[#2E7D32] dark:text-green-400 uppercase mb-1">{t('expertResolution')}</p>
                          <p className="font-bold text-gray-900 dark:text-white">{sample.correct_label}</p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{t('verifiedBy')}: {sample.expert_decision.officer_name}</p>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600 dark:text-gray-300 italic bg-card p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                        "{sample.expert_decision.comments || t('noExpertComments')}"
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Database className="w-12 h-12 text-gray-200 mb-4" />
              <p className="text-gray-500 font-medium">{t('noVerifiedSamples')}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
