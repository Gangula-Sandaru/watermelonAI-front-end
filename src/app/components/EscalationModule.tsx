import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { ShieldAlert, User, MapPin, Phone, MessageSquare, History, CheckCircle2, AlertTriangle, Send, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '../utils/translations';

export const EscalationModule = () => {
  const { t, currentLanguage } = useTranslation();
  const [activeStep, setActiveStep] = useState(1);
  const [selectedScan, setSelectedScan] = useState<any>(null);
  const [selectedOfficer, setSelectedOfficer] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Chat States
  const [activeChat, setActiveChat] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  
  // API Data
  const [recentScans, setRecentScans] = useState<any[]>([]);
  const [officers, setOfficers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);

  const fetchInitialData = async () => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch Scans
      const scanRes = await fetch('http://127.0.0.1:8000/api/disease/history/', { headers });
      if (scanRes.ok) setRecentScans(await scanRes.json());

      // Fetch Officers
      const offRes = await fetch('http://127.0.0.1:8000/api/escalation/officers/', { headers });
      if (offRes.ok) setOfficers(await offRes.json());

      // Fetch Requests
      const reqRes = await fetch('http://127.0.0.1:8000/api/escalation/requests/', { headers });
      if (reqRes.ok) setRequests(await reqRes.json());

    } catch (err) {
      console.error("Failed to fetch escalation data", err);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  const handleSelectScan = (scan: any) => {
    setSelectedScan(scan);
    setActiveStep(2);
  };

  const handleSelectOfficer = (officer: any) => {
    if (officer.is_available) {
      setSelectedOfficer(officer);
      setActiveStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!selectedScan || !selectedOfficer) {
      toast.error(t('completeAllStepsFirst'));
      return;
    }
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/escalation/requests/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          scan_id: selectedScan.id,
          officer_id: selectedOfficer.id,
          notes: notes
        })
      });

      if (response.ok) {
        const newReq = await response.json();
        setRequests([newReq, ...requests]);
        setActiveStep(1);
        setSelectedScan(null);
        setSelectedOfficer(null);
        setNotes('');
        toast.success(t('caseSuccessEscalated'));
      }
    } catch (err) {
      toast.error(t('failedSubmitEscalation'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChat = async (req: any) => {
    setActiveChat(req);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/escalation/requests/${req.id}/chat/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setChatMessages(await response.json());
      }
    } catch (err) {
      console.error("Failed to load chat", err);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeChat) return;
    
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/escalation/requests/${activeChat.id}/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: newMessage })
      });

      if (response.ok) {
        setNewMessage('');
        // Refetch to get the latest messages (including mock officer reply)
        handleOpenChat(activeChat);
      }
    } catch (err) {
      toast.error(t('failedSendMessage'));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-xl flex items-center gap-2">
              <ShieldAlert className="text-red-600" />
              {t('expertConsultation')}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('expertConsultationSub')}</p>
          </div>
          <div className="flex gap-2">
            {[1, 2, 3].map((step) => (
              <button 
                key={step}
                onClick={() => {
                  if (step === 1 || (step === 2 && selectedScan) || (step === 3 && selectedOfficer)) {
                    setActiveStep(step);
                  }
                }}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                  activeStep === step ? 'bg-[#2E7D32] text-white scale-110 shadow-md' : 
                  activeStep > step ? 'bg-green-100 dark:bg-green-900/30 text-[#2E7D32] dark:text-green-400 hover:bg-green-200' : 'bg-muted dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                {step}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 min-h-[400px]">
          
          {/* Step 1: Select Scan */}
          <div className={`space-y-4 transition-all duration-300 ${activeStep !== 1 ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
            <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <History size={18} className="text-[#2E7D32]" />
              1. {t('selectProblemCase')}
            </h4>
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
              {recentScans.map((scan) => (
                <div 
                  key={scan.id}
                  onClick={() => handleSelectScan(scan)}
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer hover:shadow-md ${
                    selectedScan?.id === scan.id ? 'border-[#2E7D32] bg-green-50 dark:bg-green-900/10 shadow-sm' : 'border-gray-100 dark:border-gray-800 bg-card hover:border-gray-200 dark:hover:border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold text-gray-400">{scan.request_uuid.substring(0, 8)}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      (scan.prediction?.confidence || 0) >= 0.8 ? 'bg-green-100 text-green-700' :
                      (scan.prediction?.confidence || 0) >= 0.5 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {(scan.prediction?.confidence || 0) >= 0.8 ? t('highConfidence') :
                       (scan.prediction?.confidence || 0) >= 0.5 ? t('moderateConfidence') :
                       t('lowConfidence')}
                    </span>
                  </div>
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{scan.prediction?.disease_name || 'Processing...'}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">{new Date(scan.created_at).toLocaleDateString()} • AI Match: {scan.prediction ? (scan.prediction.confidence * 100).toFixed(0) + '%' : 'N/A'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Step 2: Select Officer */}
          <div className={`space-y-4 transition-all duration-300 ${activeStep !== 2 ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
            <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <User size={18} className="text-[#2E7D32]" />
              2. {t('chooseAnExpert')}
            </h4>
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input 
                  type="text" 
                  placeholder={t('filterOfficersPlaceholder')}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 bg-background rounded-lg text-xs outline-none focus:border-[#2E7D32] text-gray-900 dark:text-gray-100"
                />
              </div>
              {officers.length > 0 ? (
                officers.map((officer) => (
                  <div 
                    key={officer.id}
                    onClick={() => handleSelectOfficer(officer)}
                    className={`p-3 rounded-xl border-2 transition-all hover:shadow-md ${
                      !officer.is_available ? 'opacity-50 cursor-not-allowed bg-muted' : 'cursor-pointer'
                    } ${
                      selectedOfficer?.id === officer.id ? 'border-[#2E7D32] bg-green-50 dark:bg-green-900/10 shadow-sm' : 'border-gray-100 dark:border-gray-800 bg-card hover:border-gray-200 dark:hover:border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-bold text-gray-900 dark:text-white text-sm">{officer.name}</p>
                      <span className={`text-[10px] font-bold ${officer.is_available ? 'text-green-600' : 'text-gray-400'}`}>
                        {officer.is_available ? t('available') : t('unavailable')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                      <MapPin size={10} /> {officer.district} • {officer.position}
                    </div>
                  </div>
                ))
              ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                  <User size={32} className="mb-2 opacity-20" />
                  <p className="text-xs font-bold">{t('noOfficersFound')}</p>
                  <p className="text-[10px]">{t('tryAgainLater')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Step 3: Notes & Submit */}
          <div className={`space-y-4 transition-all duration-300 ${activeStep !== 3 ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
            <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <MessageSquare size={18} className="text-[#2E7D32]" />
              3. {t('finalizeAndSend')}
            </h4>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">{t('escalationSummary')}</p>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center justify-between">
                    <span>{t('caseLabel')}</span> <span className="text-[#2E7D32]">{selectedScan?.request_uuid?.substring(0, 8)}</span>
                  </p>
                  <p className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center justify-between">
                    <span>{t('officerLabel')}</span> <span className="text-[#2E7D32]">{selectedOfficer?.name}</span>
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">{t('additionalNotes')}</label>
                <textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('notesPlaceholder')}
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 bg-background rounded-xl text-sm min-h-[120px] outline-none focus:border-[#2E7D32] text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="w-full bg-red-600 hover:bg-red-700 text-white gap-2 font-bold py-6 text-lg shadow-lg hover:shadow-red-200 transition-all"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                  {t('escalateNow')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Escalation History */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <History className="text-[#2E7D32]" />
            {t('activeEscalations')}
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400">
              <tr>
                <th className="px-4 py-3 font-semibold">{t('requestId')}</th>
                <th className="px-4 py-3 font-semibold">{t('officerName')}</th>
                <th className="px-4 py-3 font-semibold">{t('caseId')}</th>
                <th className="px-4 py-3 font-semibold">{t('statusLabel')}</th>
                <th className="px-4 py-3 font-semibold">{t('dateSent')}</th>
                <th className="px-4 py-3 font-semibold text-right">{t('actionsLabel')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {requests.length > 0 ? (
                requests.map((req) => (
                  <React.Fragment key={req.id}>
                    <tr className="hover:bg-muted/50 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-4 py-4 font-bold text-gray-900 dark:text-white">REQ-{String(req.id).padStart(3, '0')}</td>
                      <td className="px-4 py-4 text-gray-700 dark:text-gray-300">{req.officer_name}</td>
                      <td className="px-4 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs">{req.scan_id?.substring(0, 8)}</td>
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          req.status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
                          req.status === 'RESOLVED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-gray-500 dark:text-gray-400">{new Date(req.created_at).toLocaleDateString()}</td>
                      <td className="px-4 py-4 text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleOpenChat(req)}
                          className="text-[#2E7D32] dark:text-green-400 border-[#2E7D32] dark:border-green-800 hover:bg-green-50 dark:hover:bg-green-950/30 gap-2"
                        >
                          <MessageSquare size={14} />
                          {t('chatLabel')}
                        </Button>
                      </td>
                    </tr>
                    {req.status === 'RESOLVED' && (req.final_conclusion || req.officer_comments) && (
                      <tr className="bg-green-50/10 dark:bg-green-950/10">
                        <td colSpan={6} className="px-6 py-4">
                          <div className="flex gap-4 items-start border-l-4 border-[#2E7D32] pl-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-[#2E7D32] dark:text-green-400" />
                                <span className="text-xs font-black text-[#2E7D32] dark:text-green-400 uppercase tracking-wider">{t('expertDecision')}</span>
                              </div>
                              {req.final_conclusion && (
                                <p className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
                                  {req.final_conclusion}
                                </p>
                              )}
                              {req.officer_comments && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 italic">
                                  {t('expertNotes')} "{req.officer_comments}"
                                </p>
                              )}
                            </div>
                            <div className="text-[10px] text-[#2E7D32] dark:text-green-400 font-bold bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-[#2E7D32]/20 dark:border-green-800/40">
                              {t('officialResolution')}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400 dark:text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <History size={32} className="opacity-20" />
                      <p className="font-bold text-gray-900 dark:text-white">{t('noActiveEscalations')}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{t('escalateScanInstruction')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Chat Slide-over Interface */}
      {activeChat && (
        <div className="fixed inset-0 z-[1000] flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setActiveChat(null)} />
          <div className="relative w-full max-w-md bg-card h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-[#2E7D32] text-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
                  {activeChat.officer_name?.substring(0, 2)}
                </div>
                <div>
                  <p className="font-bold text-sm">{activeChat.officer_name}</p>
                  <p className="text-[10px] opacity-80 uppercase tracking-tighter">{t('caseLabel')} {activeChat.scan_id?.substring(0, 8)}</p>
                </div>
              </div>
              <Button variant="ghost" onClick={() => setActiveChat(null)} className="text-white hover:bg-white/10">
                <AlertTriangle className="rotate-45" size={20} />
              </Button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/50">
              <div className="text-center mb-6">
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 bg-card px-3 py-1 rounded-full border border-gray-100 dark:border-gray-800 uppercase tracking-widest">
                  {t('secureConsultationChannel')}
                </span>
              </div>
              
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender_type === 'farmer' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.sender_type === 'farmer' 
                      ? 'bg-[#2E7D32] text-white rounded-tr-none shadow-sm' 
                      : 'bg-card text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-800 shadow-sm'
                  }`}>
                    <p>{msg.text}</p>
                    <p className={`text-[9px] mt-1 ${msg.sender_type === 'farmer' ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'}`}>
                      {msg.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Input */}
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-card">
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={t('typeMessagePlaceholder')}
                  className="flex-1 px-4 py-2 bg-muted border border-gray-200 dark:border-gray-700 rounded-full text-sm outline-none focus:border-[#2E7D32] transition-all text-gray-900 dark:text-gray-100"
                />
                <Button 
                  onClick={handleSendMessage}
                  className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-full w-10 h-10 p-0 flex items-center justify-center shrink-0"
                >
                  <Send size={18} />
                </Button>
              </div>
              <p className="text-[10px] text-gray-400 text-center mt-2">
                {t('officerReplyDisclaimer')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
