import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from './ui/table';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Search,
  Filter,
  ExternalLink,
  MessageSquare,
  Clock,
  User,
  AlertCircle,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '../utils/translations';

interface EscalationData {
  id: number;
  farmer_name: string;
  scan_details: {
    uuid: string;
    disease: string;
    confidence: string;
    image: string | null;
  };
  status: string;
  notes: string;
  created_at: string;
  time_ago: string;
}

export function OfficerEscalationTable({ userData, setActiveSection }: { userData?: any; setActiveSection?: (s: string) => void }) {
  const { t } = useTranslation();
  const [data, setData] = useState<EscalationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedRequest, setSelectedRequest] = useState<EscalationData | null>(null);
  const [reviewComments, setReviewComments] = useState('');
  const [finalConclusion, setFinalConclusion] = useState('');

  const [diseaseTags, setDiseaseTags] = useState<string[]>([]);
  const [diseaseTag, setDiseaseTag] = useState('');

  const [showAddDiseaseModal, setShowAddDiseaseModal] = useState(false);
  const [newDiseaseName, setNewDiseaseName] = useState('');

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://127.0.0.1:8000/api/escalation/dashboard/all-escalations/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error("Failed to fetch escalations", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDiseaseTags = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://127.0.0.1:8000/api/escalation/disease-tags/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setDiseaseTags(await response.json());
      }
    } catch (error) {
      console.error("Failed to fetch disease tags", error);
    }
  };

  useEffect(() => {
    fetchData();
    fetchDiseaseTags();
  }, []);

  const handleResolve = async (id: number) => {
    // Client-side daily review limit check for restricted officers
    if (userData?.is_restricted && (userData?.daily_remaining_reviews ?? 1) <= 0) {
      toast.error(
        `Daily review limit reached (${userData?.daily_review_count ?? 3}/${userData?.daily_review_limit ?? 3} reviews completed today). Your account is restricted to 3 case reviews per day.`,
        { duration: 5000 }
      );
      return;
    }
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://127.0.0.1:8000/api/escalation/requests/${id}/resolve/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          officer_comments: reviewComments,
          final_conclusion: finalConclusion,
          disease_tag: diseaseTag
        })
      });
      if (response.ok) {
        toast.success(t('caseResolvedSuccess'));
        setSelectedRequest(null); // Close modal if open
        fetchData(); // Refresh list
      } else if (response.status === 403) {
        const errorData = await response.json();
        toast.error(
          errorData?.error || `Daily review limit reached. You have completed your 3 allowed case reviews for today.`,
          { duration: 6000 }
        );
      }
    } catch (error) {
      toast.error(t('failedResolveCase'));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">{t('statusPending')}</Badge>;
      case 'SENT':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{t('statusNewRequest')}</Badge>;
      case 'REVIEWING':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 animate-pulse">{t('statusInReview')}</Badge>;
      case 'RESOLVED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{t('statusResolved')}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredData = data.filter(item =>
    item.farmer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.scan_details.disease.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.scan_details.uuid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#2E7D32] animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Restriction Banner for Restricted Officers */}
      {userData?.is_restricted && (
        <div className="mb-4 p-4 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
              Account Restricted — Daily Review Limit Active
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
              Today's Case Reviews:{' '}
              <strong>{userData?.daily_review_count ?? 0} / {userData?.daily_review_limit ?? 3}</strong>
              {' '}({userData?.daily_remaining_reviews ?? 0} remaining today)
              {(userData?.daily_remaining_reviews ?? 1) <= 0 && (
                <span className="ml-2 font-bold text-red-600 dark:text-red-400">
                  — Daily limit reached. Reviews resume tomorrow.
                </span>
              )}
            </p>
            {userData?.restriction_reason && (
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-1 italic">
                Reason: {userData.restriction_reason}
              </p>
            )}
          </div>
          <span className={`shrink-0 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
            (userData?.daily_remaining_reviews ?? 1) <= 0
              ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
              : 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-400'
          }`}>
            {userData?.daily_review_count ?? 0}/{userData?.daily_review_limit ?? 3} Today
          </span>
        </div>
      )}

      <Card className="overflow-hidden border-none shadow-lg bg-card rounded-2xl">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-muted/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('expertReviewQueue')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('manageRespondEscalations')}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('searchRequestsPlaceholder')}
                  className="pl-10 pr-4 py-2 bg-background border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-[#2E7D32]/20 focus:border-[#2E7D32] outline-none transition-all w-64 text-gray-900 dark:text-gray-100"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" className="rounded-xl">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold text-gray-700 dark:text-gray-300">{t('requestId')}</TableHead>
                <TableHead className="font-bold text-gray-700 dark:text-gray-300">{t('farmerLabel')}</TableHead>
                <TableHead className="font-bold text-gray-700 dark:text-gray-300">{t('diagnosisLabel')}</TableHead>
                <TableHead className="font-bold text-gray-700 dark:text-gray-300">{t('statusLabel')}</TableHead>
                <TableHead className="font-bold text-gray-700 dark:text-gray-300">{t('timeLabel')}</TableHead>
                <TableHead className="text-right font-bold text-gray-700 dark:text-gray-300">{t('actionsLabel')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/50 transition-colors group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-gray-400">#{row.scan_details.uuid}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#2E7D32]/10 flex items-center justify-center text-[#2E7D32]">
                          <User size={14} />
                        </div>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{row.farmer_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-200">{row.scan_details.disease}</span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">{t('aiConfidenceLabel')}: {row.scan_details.confidence}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(row.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-gray-500">
                        <Clock size={12} />
                        <span className="text-xs">{row.time_ago}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedRequest(row);
                            setReviewComments(row.officer_comments || '');
                            setFinalConclusion(row.final_conclusion || '');
                            setDiseaseTag(row.scan_details.disease || '');
                          }}
                          className="h-8 gap-1.5 text-[#2E7D32] hover:bg-[#2E7D32]/10 dark:hover:bg-[#2E7D32]/20 rounded-lg"
                        >
                          <ExternalLink size={14} />
                          {t('viewLabel')}
                        </Button>
                        {row.status !== 'RESOLVED' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleResolve(row.id)}
                            className="h-8 gap-1.5 text-green-600 dark:text-green-400 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg"
                          >
                            <CheckCircle2 size={14} />
                            {t('resolveLabel')}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="w-8 h-8 opacity-20" />
                      <p>{t('noEscalationsFound')}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-muted/30 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {t('showingEscalations').replace('{count}', String(filteredData.length)).replace('{total}', String(data.length))}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled className="rounded-lg h-8 px-3">{t('previous')}</Button>
            <Button variant="outline" size="sm" disabled className="rounded-lg h-8 px-3">{t('next')}</Button>
          </div>
        </div>
      </Card>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setSelectedRequest(null)} />
          <Card className="relative w-full max-w-2xl bg-card shadow-2xl rounded-[2rem] overflow-hidden animate-in zoom-in-95 duration-200 border-none">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left Side: Image */}
              <div className="relative h-64 md:h-full bg-muted/50">
                {selectedRequest.scan_details.image ? (
                  <img
                    src={selectedRequest.scan_details.image}
                    alt={t('diagnosisLabel')}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <AlertCircle size={48} className="opacity-20 mb-2" />
                    <p className="text-xs font-bold uppercase tracking-widest">{t('noImageProvided')}</p>
                  </div>
                )}
                <div className="absolute top-4 left-4">
                  {getStatusBadge(selectedRequest.status)}
                </div>
              </div>

              {/* Right Side: Details */}
              <div className="p-8 flex flex-col h-full">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-2xl font-black text-gray-900 dark:text-white leading-tight">{t('caseDetailsTitle')}</h4>
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">
                      {t('requestId')} #{selectedRequest.scan_details.uuid}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => setSelectedRequest(null)}
                    className="rounded-full w-10 h-10 p-0 text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    <AlertCircle className="rotate-45" size={24} />
                  </Button>
                </div>

                <div className="space-y-6 flex-1">
                  <div>
                    <label className="text-[10px] font-black text-[#2E7D32] uppercase tracking-[0.2em] mb-2 block">{t('farmerInformation')}</label>
                    <div className="flex items-center gap-3 bg-muted/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700">
                      <div className="w-10 h-10 rounded-xl bg-card shadow-sm flex items-center justify-center text-[#2E7D32] border border-gray-100 dark:border-gray-700">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">{selectedRequest.farmer_name}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">{t('regionalFarmerAccount')}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-[#2E7D32] uppercase tracking-[0.2em] mb-2 block">{t('officerReviewLabel')}</label>
                    <div className="space-y-3">
                      <div className="flex gap-2 items-center mb-1">
                        <div className="flex-1">
                          <select
                             value={diseaseTag}
                             onChange={(e) => setDiseaseTag(e.target.value)}
                             className="w-full bg-muted/50 border border-gray-100 dark:border-gray-700 rounded-2xl p-3 text-sm focus:ring-2 focus:ring-[#2E7D32]/20 focus:border-[#2E7D32] outline-none transition-all text-gray-900 dark:text-gray-100 appearance-none"
                             style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23131313%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right .7rem top 50%', backgroundSize: '.65rem auto' }}
                          >
                            <option value="" disabled>{t('selectVerifiedDisease')}</option>
                            {diseaseTags.map(tag => (
                              <option key={tag} value={tag}>{tag}</option>
                            ))}
                            {diseaseTag && !diseaseTags.includes(diseaseTag) && (
                              <option value={diseaseTag}>{diseaseTag}</option>
                            )}
                          </select>
                        </div>
                        <Button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setShowAddDiseaseModal(true);
                          }}
                          className="bg-[#2E7D32]/10 hover:bg-[#2E7D32]/20 text-[#2E7D32] rounded-xl h-[46px] w-[46px] p-0 flex items-center justify-center shrink-0 shadow-sm border border-[#2E7D32]/20"
                        >
                          <Plus size={18} />
                        </Button>
                      </div>
                      <textarea
                        placeholder={t('reviewCommentsPlaceholder')}
                        className="w-full bg-muted/50 border border-gray-100 dark:border-gray-700 rounded-2xl p-3 text-sm min-h-[80px] focus:ring-2 focus:ring-[#2E7D32]/20 focus:border-[#2E7D32] outline-none transition-all text-gray-900 dark:text-gray-100"
                        value={reviewComments}
                        onChange={(e) => setReviewComments(e.target.value)}
                      />
                      <textarea
                        placeholder={t('finalConclusionPlaceholder')}
                        className="w-full bg-[#2E7D32]/5 border border-[#2E7D32]/10 rounded-2xl p-3 text-sm font-bold text-gray-900 dark:text-white min-h-[60px] focus:ring-2 focus:ring-[#2E7D32]/20 focus:border-[#2E7D32] outline-none transition-all"
                        value={finalConclusion}
                        onChange={(e) => setFinalConclusion(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-[#2E7D32] uppercase tracking-[0.2em] mb-2 block">{t('farmerNotesLabel')}</label>
                    <div className="bg-green-50/30 dark:bg-[#2E7D32]/10 p-4 rounded-2xl border border-green-100 dark:border-[#2E7D32]/20 italic text-sm text-gray-700 dark:text-gray-300 leading-relaxed max-h-32 overflow-y-auto">
                      "{selectedRequest.notes || t('noFarmerNotes')}"
                    </div>
                  </div>
                </div>

                <div className="pt-8 mt-auto flex gap-3 border-t border-gray-100">
                  <Button
                    className="flex-1 bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-xl py-6 font-bold shadow-lg shadow-green-900/20"
                    onClick={() => {
                      if (setActiveSection) {
                        localStorage.setItem('pending_chat_esc_id', selectedRequest.id.toString());
                        setActiveSection('communications');
                      }
                      setSelectedRequest(null);
                    }}
                  >
                    <MessageSquare size={18} className="mr-2" />
                    {t('chatButtonLabel')}
                  </Button>
                  {selectedRequest.status !== 'RESOLVED' && (
                    <Button
                      variant="outline"
                      className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl py-6 font-bold"
                      onClick={() => handleResolve(selectedRequest.id)}
                    >
                      <CheckCircle2 size={18} className="mr-2 text-green-600" />
                      {t('resolveCaseButton')}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Add New Disease Modal */}
      {showAddDiseaseModal && (
        <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddDiseaseModal(false)} />
          <Card className="relative w-full max-w-sm bg-card shadow-2xl rounded-2xl p-6 border-none animate-in zoom-in-95 duration-200">
            <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t('addNewDiseaseTitle')}</h4>
            <input
              type="text"
              placeholder={t('enterDiseaseNamePlaceholder')}
              value={newDiseaseName}
              onChange={(e) => setNewDiseaseName(e.target.value)}
              autoFocus
              className="w-full bg-muted/50 border border-gray-100 dark:border-gray-700 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#2E7D32]/20 focus:border-[#2E7D32] outline-none transition-all text-gray-900 dark:text-gray-100 mb-4"
            />
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddDiseaseModal(false);
                  setNewDiseaseName('');
                }}
                className="rounded-xl"
              >
                {t('cancel')}
              </Button>
              <Button
                onClick={() => {
                  if (newDiseaseName.trim()) {
                    setDiseaseTags([...diseaseTags, newDiseaseName.trim()]);
                    setDiseaseTag(newDiseaseName.trim());
                    setShowAddDiseaseModal(false);
                    setNewDiseaseName('');
                  }
                }}
                className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white rounded-xl"
              >
                {t('addDiseaseButton')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
