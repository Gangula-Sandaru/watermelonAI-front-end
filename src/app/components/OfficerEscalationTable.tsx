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
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

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

export function OfficerEscalationTable({ setActiveSection }: { setActiveSection?: (s: string) => void }) {
  const [data, setData] = useState<EscalationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedRequest, setSelectedRequest] = useState<EscalationData | null>(null);
  const [reviewComments, setReviewComments] = useState('');
  const [finalConclusion, setFinalConclusion] = useState('');

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

  useEffect(() => {
    fetchData();
  }, []);

  const handleResolve = async (id: number) => {
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
          final_conclusion: finalConclusion
        })
      });
      if (response.ok) {
        toast.success("Case marked as resolved");
        setSelectedRequest(null); // Close modal if open
        fetchData(); // Refresh list
      }
    } catch (error) {
      toast.error("Failed to resolve case");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'SENT':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">New Request</Badge>;
      case 'REVIEWING':
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 animate-pulse">In Review</Badge>;
      case 'RESOLVED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Resolved</Badge>;
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
      <Card className="overflow-hidden border-none shadow-lg bg-white rounded-2xl">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Expert Review Queue</h3>
              <p className="text-sm text-gray-500">Manage and respond to farmer escalations</p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search requests..." 
                  className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#2E7D32]/20 focus:border-[#2E7D32] outline-none transition-all w-64"
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
            <TableHeader className="bg-gray-50/30">
              <TableRow>
                <TableHead className="font-bold text-gray-700">Request ID</TableHead>
                <TableHead className="font-bold text-gray-700">Farmer</TableHead>
                <TableHead className="font-bold text-gray-700">Diagnosis</TableHead>
                <TableHead className="font-bold text-gray-700">Status</TableHead>
                <TableHead className="font-bold text-gray-700">Time</TableHead>
                <TableHead className="text-right font-bold text-gray-700">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((row) => (
                  <TableRow key={row.id} className="hover:bg-gray-50/80 transition-colors group">
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
                        <span className="font-semibold text-gray-900">{row.farmer_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-900">{row.scan_details.disease}</span>
                        <span className="text-[10px] text-gray-500">AI Confidence: {row.scan_details.confidence}</span>
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
                          }}
                          className="h-8 gap-1.5 text-[#2E7D32] hover:bg-[#2E7D32]/5 rounded-lg"
                        >
                          <ExternalLink size={14} />
                          View
                        </Button>
                        {row.status !== 'RESOLVED' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleResolve(row.id)}
                            className="h-8 gap-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg"
                          >
                            <CheckCircle2 size={14} />
                            Resolve
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
                      <p>No escalation requests found</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
          <p className="text-xs text-gray-500">
            Showing {filteredData.length} of {data.length} total escalations
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled className="rounded-lg h-8 px-3">Previous</Button>
            <Button variant="outline" size="sm" disabled className="rounded-lg h-8 px-3">Next</Button>
          </div>
        </div>
      </Card>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" onClick={() => setSelectedRequest(null)} />
          <Card className="relative w-full max-w-2xl bg-white shadow-2xl rounded-[2rem] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left Side: Image */}
              <div className="relative h-64 md:h-full bg-gray-100">
                {selectedRequest.scan_details.image ? (
                  <img 
                    src={selectedRequest.scan_details.image} 
                    alt="Plant Issue"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <AlertCircle size={48} className="opacity-20 mb-2" />
                    <p className="text-xs font-bold uppercase tracking-widest">No Image Provided</p>
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
                    <h4 className="text-2xl font-black text-gray-900 leading-tight">Case Details</h4>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                      Request #{selectedRequest.scan_details.uuid}
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    onClick={() => setSelectedRequest(null)}
                    className="rounded-full w-10 h-10 p-0 text-gray-400 hover:text-gray-900"
                  >
                    <AlertCircle className="rotate-45" size={24} />
                  </Button>
                </div>

                <div className="space-y-6 flex-1">
                  <div>
                    <label className="text-[10px] font-black text-[#2E7D32] uppercase tracking-[0.2em] mb-2 block">Farmer Information</label>
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-[#2E7D32]">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{selectedRequest.farmer_name}</p>
                        <p className="text-[10px] text-gray-500 font-medium">Regional Farmer Account</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-[#2E7D32] uppercase tracking-[0.2em] mb-2 block">Officer Review</label>
                    <div className="space-y-3">
                      <textarea 
                        placeholder="Add your review comments here..."
                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-3 text-sm min-h-[80px] focus:ring-2 focus:ring-[#2E7D32]/20 focus:border-[#2E7D32] outline-none transition-all"
                        value={reviewComments}
                        onChange={(e) => setReviewComments(e.target.value)}
                      />
                      <textarea 
                        placeholder="Final Conclusion / Treatment Plan..."
                        className="w-full bg-[#2E7D32]/5 border border-[#2E7D32]/10 rounded-2xl p-3 text-sm font-bold text-gray-900 min-h-[60px] focus:ring-2 focus:ring-[#2E7D32]/20 focus:border-[#2E7D32] outline-none transition-all"
                        value={finalConclusion}
                        onChange={(e) => setFinalConclusion(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-[#2E7D32] uppercase tracking-[0.2em] mb-2 block">Farmer Notes</label>
                    <div className="bg-green-50/50 p-4 rounded-2xl border border-green-100 italic text-sm text-gray-700 leading-relaxed max-h-32 overflow-y-auto">
                      "{selectedRequest.notes || "No additional description provided by the farmer."}"
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
                    Chat
                  </Button>
                  {selectedRequest.status !== 'RESOLVED' && (
                    <Button 
                      variant="outline" 
                      className="flex-1 border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl py-6 font-bold"
                      onClick={() => handleResolve(selectedRequest.id)}
                    >
                      <CheckCircle2 size={18} className="mr-2 text-green-600" />
                      Resolve Case
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
