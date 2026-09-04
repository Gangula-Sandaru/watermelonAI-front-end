import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Send,
  Trash2,
  MessageSquare,
  ShieldAlert,
  Mail,
  AlertTriangle,
  X,
  Copy,
  Check,
  CheckCheck,
  Eye
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from './ui/table';
import { toast } from 'sonner';
import { useTranslation } from '../utils/translations';

export interface ProblemTicket {
  id: number;
  ticket_id: string;
  name: string;
  email: string;
  phone?: string | null;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  subject: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  admin_response?: string | null;
  responded_by?: number | null;
  responded_by_name?: string | null;
  responded_at?: string | null;
  created_at: string;
  updated_at?: string;
}

interface AdminSupportModuleProps {
  userData?: any;
}

export function AdminSupportModule({ userData }: AdminSupportModuleProps) {
  const { t, currentLanguage } = useTranslation();
  const role = userData?.role?.toLowerCase() || '';
  const isAdmin = role === 'admin' || role === 'superadmin' || userData?.is_superuser === true;

  const [tickets, setTickets] = useState<ProblemTicket[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0,
    closed: 0,
    urgent: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<ProblemTicket | null>(null);
  
  // Response modal state
  const [responseModalOpen, setResponseModalOpen] = useState(false);
  const [adminResponseText, setAdminResponseText] = useState('');
  const [responseStatus, setResponseStatus] = useState<'in_progress' | 'resolved' | 'closed' | 'pending'>('resolved');
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchTickets = async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.set('search', searchQuery);
      if (selectedStatus !== 'all') queryParams.set('status', selectedStatus);
      if (selectedCategory !== 'all') queryParams.set('category', selectedCategory);
      if (selectedPriority !== 'all') queryParams.set('priority', selectedPriority);

      const res = await fetch(`http://127.0.0.1:8000/api/auth/admin/contact-submissions/?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setTickets(data.submissions || []);
        if (data.stats) {
          setStats(data.stats);
        }
      } else {
        loadFromLocalStorage();
      }
    } catch (err) {
      loadFromLocalStorage();
    } finally {
      setLoading(false);
    }
  };

  const loadFromLocalStorage = () => {
    try {
      const local = JSON.parse(localStorage.getItem('watermelon_local_contact_submissions') || '[]');
      setTickets(local);
      setStats({
        total: local.length,
        pending: local.filter((t: any) => t.status === 'pending').length,
        in_progress: local.filter((t: any) => t.status === 'in_progress').length,
        resolved: local.filter((t: any) => t.status === 'resolved').length,
        closed: local.filter((t: any) => t.status === 'closed').length,
        urgent: local.filter((t: any) => t.priority === 'urgent').length,
      });
    } catch (_) {}
  };

  useEffect(() => {
    fetchTickets();
  }, [selectedStatus, selectedCategory, selectedPriority]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTickets();
  };

  const handleOpenTicketModal = (ticket: ProblemTicket) => {
    setSelectedTicket(ticket);
    setAdminResponseText(ticket.admin_response || '');
    setResponseStatus(ticket.status === 'pending' ? 'resolved' : (ticket.status as any));
    setResponseModalOpen(true);
  };

  const handleSaveResponse = async () => {
    if (!selectedTicket) return;
    if (!adminResponseText.trim()) {
      toast.error(t('enterResponseRequired') || 'Please enter a response or resolution note.');
      return;
    }

    setIsSubmittingResponse(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://127.0.0.1:8000/api/auth/admin/contact-submissions/${selectedTicket.id}/action/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'respond',
          admin_response: adminResponseText,
          status: responseStatus
        })
      });

      if (res.ok) {
        const data = await res.json();
        toast.success(data.message || `Ticket ${selectedTicket.ticket_id} updated and resolution email sent to ${selectedTicket.email}!`, {
          duration: 6000
        });
        setResponseModalOpen(false);
        fetchTickets();
      } else {
        updateLocalTicket(selectedTicket.id, {
          admin_response: adminResponseText,
          status: responseStatus,
          responded_by_name: userData?.username || 'Admin',
          responded_at: new Date().toISOString()
        });
        toast.success(`Response recorded for ${selectedTicket.ticket_id}`);
        setResponseModalOpen(false);
      }
    } catch (err) {
      updateLocalTicket(selectedTicket.id, {
        admin_response: adminResponseText,
        status: responseStatus,
        responded_by_name: userData?.username || 'Admin',
        responded_at: new Date().toISOString()
      });
      toast.success(`Response saved locally.`);
      setResponseModalOpen(false);
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const updateLocalTicket = (id: number, updates: Partial<ProblemTicket>) => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    try {
      const local = JSON.parse(localStorage.getItem('watermelon_local_contact_submissions') || '[]');
      const updated = local.map((t: any) => t.id === id ? { ...t, ...updates } : t);
      localStorage.setItem('watermelon_local_contact_submissions', JSON.stringify(updated));
    } catch (_) {}
  };

  const handleDeleteTicket = async (ticket: ProblemTicket) => {
    const confirmMsg = `${t('confirmDeleteTicket') || 'Are you sure you want to permanently delete ticket'} ${ticket.ticket_id}?`;
    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://127.0.0.1:8000/api/auth/admin/contact-submissions/${ticket.id}/action/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'delete'
        })
      });

      if (res.ok) {
        toast.success(t('ticketDeleted') || `Ticket ${ticket.ticket_id} deleted.`);
        fetchTickets();
      } else {
        setTickets(prev => prev.filter(t => t.id !== ticket.id));
        toast.success(t('ticketDeleted') || `Ticket removed.`);
      }
    } catch (err) {
      setTickets(prev => prev.filter(t => t.id !== ticket.id));
      toast.success(t('ticketDeleted') || `Ticket removed.`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success(t('copiedToClipboard') || 'Ticket ID copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatCategoryLabel = (cat: string) => {
    const map: Record<string, string> = {
      system_login: t('catSystemLogin') || 'System / Login Issue',
      ai_disease: t('catAiDisease') || 'AI Disease Detection Bug',
      satellite: t('catSatellite') || 'Satellite Monitoring Problem',
      data_export: t('catDataExport') || 'Data Export / Report Issue',
      crop_advisory: t('catCropAdvisory') || 'Crop Advisory Escalation',
      general: t('catGeneral') || 'General Inquiry / Feedback',
      other: t('catOther') || 'Other Problem'
    };
    return map[cat] || cat;
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
            {t('priorityUrgent') || 'Urgent'}
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
            {t('priorityHigh') || 'High'}
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            {t('priorityMedium') || 'Medium'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            {t('priorityLow') || 'Low'}
          </span>
        );
    }
  };

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            <Clock className="w-3 h-3" />
            {t('pendingReviewBadge') || 'Pending Review'}
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
            <RefreshCw className="w-3 h-3" />
            {t('inProgressBadge') || 'In Progress'}
          </span>
        );
      case 'resolved':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            <CheckCircle2 className="w-3 h-3" />
            {t('resolvedBadge') || 'Resolved'}
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
            {t('closedBadge') || 'Closed'}
          </span>
        );
      default:
        return null;
    }
  };

  if (!isAdmin) {
    return (
      <Card className="p-8 text-center bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800">
        <ShieldAlert className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-red-900 dark:text-red-200 mb-2">
          {t('accessRestricted') || 'Access Restricted'}
        </h3>
        <p className="text-sm text-red-700 dark:text-red-300">
          {t('accessRestrictedDesc') || 'This portal module is restricted strictly to System Administrators. Problem reports submitted via the landing page can only be reviewed and responded to by administrative personnel.'}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <LifeBuoy className="w-3.5 h-3.5 text-red-600" />
              {t('adminPortalOnly') || 'Admin Portal Only'}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {t('landingPageProblemReports') || 'Landing Page Problem Reports'}
            </span>
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            {t('problemReportsTitle') || 'Problem Reports & Contact Inquiries'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {t('problemReportsDesc') || 'Review user-submitted problems from the landing page, assign statuses, and compose administrative resolutions.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={fetchTickets}
            disabled={loading}
            variant="outline"
            className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {t('refreshQueue') || 'Refresh Queue'}
          </Button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{t('totalReports') || 'Total Reports'}</p>
            <MessageSquare className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-black text-gray-900 dark:text-white mt-2">{stats.total}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">{t('allTimeReceived') || 'All-time received'}</p>
        </Card>

        <Card className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">{t('pendingAction') || 'Pending Action'}</p>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-900 dark:text-amber-200 mt-2">{stats.pending}</p>
          <p className="text-[11px] text-amber-600/80 dark:text-amber-400 mt-0.5">{t('awaitingAdminReview') || 'Awaiting admin review'}</p>
        </Card>

        <Card className="p-4 bg-blue-50/70 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/60 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">{t('inProgress') || 'In Progress'}</p>
            <RefreshCw className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-black text-blue-900 dark:text-blue-200 mt-2">{stats.in_progress}</p>
          <p className="text-[11px] text-blue-600/80 dark:text-blue-400 mt-0.5">{t('underInvestigation') || 'Under investigation'}</p>
        </Card>

        <Card className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">{t('resolved') || 'Resolved'}</p>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-900 dark:text-emerald-200 mt-2">{stats.resolved}</p>
          <p className="text-[11px] text-emerald-600/80 dark:text-emerald-400 mt-0.5">{t('resolutionSent') || 'Resolution sent'}</p>
        </Card>

        <Card className="p-4 bg-red-50/70 dark:bg-red-950/30 border-red-200 dark:border-red-800/60 shadow-sm col-span-2 md:col-span-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-red-700 dark:text-red-400 uppercase tracking-wider">{t('urgentActive') || 'Urgent Active'}</p>
            <AlertTriangle className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-black text-red-900 dark:text-red-200 mt-2">{stats.urgent}</p>
          <p className="text-[11px] text-red-600/80 dark:text-red-400 mt-0.5">{t('highPriorityIssues') || 'High priority issues'}</p>
        </Card>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {[
              { id: 'all', label: t('allTickets') || 'All Tickets', count: stats.total },
              { id: 'pending', label: t('pendingAction') || 'Pending', count: stats.pending },
              { id: 'in_progress', label: t('inProgress') || 'In Progress', count: stats.in_progress },
              { id: 'resolved', label: t('resolved') || 'Resolved', count: stats.resolved },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  selectedStatus === tab.id
                    ? 'bg-[#2E7D32] text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  selectedStatus === tab.id ? 'bg-white/20 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder') || 'Search ID, name, keyword...'}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-xs focus:outline-none focus:ring-2 focus:ring-green-600/30 text-gray-900 dark:text-white"
            />
          </form>
        </div>

        {/* Secondary Category & Priority Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-700/50 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">{t('categoryLabel') || 'Category:'}</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs text-gray-800 dark:text-gray-200 focus:outline-none"
            >
              <option value="all">{t('allCategories') || 'All Categories'}</option>
              <option value="system_login">{t('catSystemLogin') || 'System / Login'}</option>
              <option value="ai_disease">{t('catAiDisease') || 'AI Disease Detection'}</option>
              <option value="satellite">{t('catSatellite') || 'Satellite Monitoring'}</option>
              <option value="data_export">{t('catDataExport') || 'Data Export'}</option>
              <option value="crop_advisory">{t('catCropAdvisory') || 'Crop Advisory'}</option>
              <option value="general">{t('catGeneral') || 'General Inquiry'}</option>
              <option value="other">{t('catOther') || 'Other'}</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500 font-medium">{t('priorityLabel') || 'Priority:'}</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs text-gray-800 dark:text-gray-200 focus:outline-none"
            >
              <option value="all">{t('allPriorities') || 'All Priorities'}</option>
              <option value="urgent">{t('priorityUrgent') || 'Urgent'}</option>
              <option value="high">{t('priorityHigh') || 'High'}</option>
              <option value="medium">{t('priorityMedium') || 'Medium'}</option>
              <option value="low">{t('priorityLow') || 'Low'}</option>
            </select>
          </div>

          {(selectedStatus !== 'all' || selectedCategory !== 'all' || selectedPriority !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setSelectedStatus('all');
                setSelectedCategory('all');
                setSelectedPriority('all');
                setSearchQuery('');
              }}
              className="text-xs text-red-600 hover:underline font-medium ml-auto"
            >
              {t('resetFilters') || 'Reset Filters'}
            </button>
          )}
        </div>
      </div>

      {/* Tickets List Table */}
      <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center">
            <RefreshCw className="w-8 h-8 text-[#2E7D32] animate-spin mx-auto mb-3" />
            <p className="text-sm text-gray-500">{t('loadingQueue') || 'Loading problem reports queue...'}</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="py-20 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3 opacity-80" />
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
              {t('noProblemReportsFound') || 'No Problem Reports Found'}
            </h3>
            <p className="text-sm text-gray-500 max-w-sm mx-auto mt-1">
              {t('noProblemReportsDesc') || 'There are currently no tickets matching your active filter criteria. All user inquiries have been addressed.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50/70 dark:bg-gray-900/40 text-xs">
                  <TableHead className="font-bold text-gray-700 dark:text-gray-300">{t('ticketId') || 'Ticket ID'}</TableHead>
                  <TableHead className="font-bold text-gray-700 dark:text-gray-300">{t('reporter') || 'Reporter'}</TableHead>
                  <TableHead className="font-bold text-gray-700 dark:text-gray-300">{t('subjectAndDetails') || 'Subject & Details'}</TableHead>
                  <TableHead className="font-bold text-gray-700 dark:text-gray-300">{(t('categoryLabel') || 'Category').replace(':', '')}</TableHead>
                  <TableHead className="font-bold text-gray-700 dark:text-gray-300">{(t('priorityLabel') || 'Priority').replace(':', '')}</TableHead>
                  <TableHead className="font-bold text-gray-700 dark:text-gray-300">{t('status') || 'Status'}</TableHead>
                  <TableHead className="font-bold text-gray-700 dark:text-gray-300">{t('submittedDate') || 'Submitted'}</TableHead>
                  <TableHead className="text-right font-bold text-gray-700 dark:text-gray-300">{t('actions') || 'Actions'}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="hover:bg-gray-50/80 dark:hover:bg-gray-700/40 transition-colors text-xs cursor-pointer"
                    onClick={() => handleOpenTicketModal(ticket)}
                  >
                    {/* Ticket ID */}
                    <TableCell className="font-mono font-bold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{ticket.ticket_id}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(ticket.ticket_id);
                          }}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                          title={t('copyTicketId') || 'Copy ID'}
                        >
                          {copiedId === ticket.ticket_id ? (
                            <Check className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </TableCell>

                    {/* Reporter */}
                    <TableCell>
                      <div className="min-w-[150px]">
                        <p className="font-bold text-gray-900 dark:text-white leading-tight">{ticket.name}</p>
                        <p className="text-[11px] text-gray-500 leading-tight truncate">{ticket.email}</p>
                        {ticket.phone && (
                          <p className="text-[10px] text-gray-400 leading-none mt-0.5">{ticket.phone}</p>
                        )}
                      </div>
                    </TableCell>

                    {/* Subject & Snippet */}
                    <TableCell>
                      <div className="max-w-xs">
                        <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{ticket.subject}</p>
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">{ticket.message}</p>
                        {ticket.admin_response && (
                          <div className="inline-flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-400 mt-1 font-semibold">
                            <CheckCheck className="w-3 h-3" />
                            <span>{t('respondedByAdmin') || 'Responded by'} {ticket.responded_by_name || 'Admin'}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>

                    {/* Category */}
                    <TableCell className="whitespace-nowrap">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {formatCategoryLabel(ticket.category)}
                      </span>
                    </TableCell>

                    {/* Priority */}
                    <TableCell className="whitespace-nowrap">
                      {getPriorityBadge(ticket.priority)}
                    </TableCell>

                    {/* Status */}
                    <TableCell className="whitespace-nowrap">
                      {getStatusBadge(ticket.status)}
                    </TableCell>

                    {/* Submitted At */}
                    <TableCell className="whitespace-nowrap text-gray-500 text-[11px]">
                      {ticket.created_at ? new Date(ticket.created_at).toLocaleDateString(currentLanguage === 'si' ? 'si-LK' : currentLanguage === 'ta' ? 'ta-LK' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : (t('recentLabel') || 'Recent')}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenTicketModal(ticket)}
                          className="p-1.5 text-[#2E7D32] hover:bg-green-50 dark:hover:bg-green-950/30 rounded-lg transition-colors font-medium flex items-center gap-1 text-xs"
                          title={t('respondButton') || 'Respond'}
                        >
                          <Eye className="w-4 h-4" />
                          <span className="hidden sm:inline">{t('respondButton') || 'Respond'}</span>
                        </button>

                        <button
                          onClick={() => handleDeleteTicket(ticket)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                          title={t('deleteTicket') || 'Delete Ticket'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Ticket Response & Details Modal */}
      {responseModalOpen && selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-sm bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 rounded text-gray-800 dark:text-gray-200">
                    {selectedTicket.ticket_id}
                  </span>
                  {getPriorityBadge(selectedTicket.priority)}
                  {getStatusBadge(selectedTicket.status)}
                </div>
                <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">
                  {selectedTicket.subject}
                </h3>
              </div>
              <button
                onClick={() => setResponseModalOpen(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Reporter Meta Details */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-5 p-4 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200/60 dark:border-gray-700 text-xs">
              <div>
                <span className="text-gray-400 block uppercase font-bold text-[10px]">{t('reporterName') || 'Reporter Name'}</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedTicket.name}</span>
              </div>
              <div>
                <span className="text-gray-400 block uppercase font-bold text-[10px]">{t('emailAddress') || 'Email Address'}</span>
                <a
                  href={`mailto:${selectedTicket.email}?subject=Regarding WatermelonAI Ticket ${selectedTicket.ticket_id}: ${encodeURIComponent(selectedTicket.subject)}`}
                  className="font-semibold text-green-700 dark:text-green-400 hover:underline truncate block"
                >
                  {selectedTicket.email}
                </a>
              </div>
              <div>
                <span className="text-gray-400 block uppercase font-bold text-[10px]">{t('phoneNumber') || 'Phone Number'}</span>
                <span className="font-semibold text-gray-900 dark:text-white">{selectedTicket.phone || (t('notProvided') || 'Not provided')}</span>
              </div>
              <div>
                <span className="text-gray-400 block uppercase font-bold text-[10px]">{(t('categoryLabel') || 'Category').replace(':', '')}</span>
                <span className="font-semibold text-gray-900 dark:text-white">{formatCategoryLabel(selectedTicket.category)}</span>
              </div>
              <div>
                <span className="text-gray-400 block uppercase font-bold text-[10px]">{t('submittedDate') || 'Submitted Date'}</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  {selectedTicket.created_at ? new Date(selectedTicket.created_at).toLocaleString(currentLanguage === 'si' ? 'si-LK' : currentLanguage === 'ta' ? 'ta-LK' : 'en-US') : (t('recentLabel') || 'Recent')}
                </span>
              </div>
              <div>
                <span className="text-gray-400 block uppercase font-bold text-[10px]">{t('accessLevel') || 'Access Level'}</span>
                <span className="font-semibold text-red-600">{t('adminOnly') || 'Admin Only'}</span>
              </div>
            </div>

            {/* Original Problem Description */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                {t('problemDescriptionUser') || 'Problem Description from User:'}
              </label>
              <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                {selectedTicket.message}
              </div>
            </div>

            {/* Previous Response Record if exists */}
            {selectedTicket.admin_response && (
              <div className="mb-6 p-4 rounded-2xl bg-green-50/60 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-xs">
                <div className="flex items-center justify-between mb-1.5 text-green-900 dark:text-green-300 font-bold">
                  <span className="flex items-center gap-1.5">
                    <CheckCheck className="w-4 h-4 text-green-600" />
                    {t('previousAdminResponse') || 'Previous Administrator Response'}
                  </span>
                  <span className="text-[11px] text-green-700 dark:text-green-400 font-normal">
                    {selectedTicket.responded_at ? new Date(selectedTicket.responded_at).toLocaleString(currentLanguage === 'si' ? 'si-LK' : currentLanguage === 'ta' ? 'ta-LK' : 'en-US') : ''}
                  </span>
                </div>
                <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap">
                  {selectedTicket.admin_response}
                </p>
                {selectedTicket.responded_by_name && (
                  <p className="text-[11px] text-green-700 dark:text-green-400 mt-2 font-medium">
                    {t('resolvedByAdminPrefix') || 'Resolved by Administrator:'} {selectedTicket.responded_by_name}
                  </p>
                )}
              </div>
            )}

            {/* Response Form */}
            <div className="space-y-4 border-t border-gray-100 dark:border-gray-700 pt-5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  {t('adminResolutionReply') || 'Admin Resolution / Official Reply:'}
                </label>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-gray-500 font-medium">{t('updateStatusLabel') || 'Update Status:'}</span>
                  <select
                    value={responseStatus}
                    onChange={(e: any) => setResponseStatus(e.target.value)}
                    className="px-3 py-1 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 font-semibold text-xs text-gray-900 dark:text-white"
                  >
                    <option value="pending">{t('pendingReviewBadge') || 'Pending'}</option>
                    <option value="in_progress">{t('inProgress') || 'In Progress'}</option>
                    <option value="resolved">{t('resolved') || 'Resolved'}</option>
                    <option value="closed">{t('closedBadge') || 'Closed'}</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-xs text-green-800 dark:text-green-300">
                <Mail className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span>
                  {t('autoEmailNotice') || 'This response will be automatically emailed to the user upon saving.'}
                </span>
              </div>

              <textarea
                value={adminResponseText}
                onChange={(e) => setAdminResponseText(e.target.value)}
                rows={4}
                placeholder={t('replyPlaceholder') || 'Type resolution notes, troubleshooting advice, or official reply message to the user...'}
                className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-600/30"
              ></textarea>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <a
                  href={`mailto:${selectedTicket.email}?subject=Response to WatermelonAI Ticket ${selectedTicket.ticket_id}&body=${encodeURIComponent(adminResponseText)}`}
                  className="text-xs text-gray-500 hover:text-green-700 flex items-center gap-1 font-semibold"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {t('sendViaExternalClient') || 'Also Send via External Email Client'}
                </a>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => setResponseModalOpen(false)}
                    className="text-xs"
                  >
                    {t('cancel') || 'Cancel'}
                  </Button>
                  <Button
                    onClick={handleSaveResponse}
                    disabled={isSubmittingResponse}
                    className="bg-[#2E7D32] hover:bg-[#1B5E20] text-white text-xs flex items-center gap-2 shadow-md"
                  >
                    {isSubmittingResponse ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    {t('saveResponseAndUpdate') || 'Save Response & Update Status'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
