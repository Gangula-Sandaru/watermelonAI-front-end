import React, { useState, useEffect, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { MessageSquare, Users, UserCog, Search, Send, FileText, CheckCircle2, Clock, Filter, Phone, Mail, Bell, AlertTriangle, Check, CheckCheck, X, Trash2, Edit3, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '../utils/translations';

interface CommunicationModuleProps {
  userData?: { id?: number, username?: string, email?: string, role?: string } | null;
}

export const CommunicationModule = ({ userData }: CommunicationModuleProps) => {
  const { t, currentLanguage } = useTranslation();
  
  const role = userData?.role?.toLowerCase() || 'farmer';
  const isOfficer = role.includes('officer') || role.includes('admin');
  const isResearcher = role.includes('researcher');
  const currentUserId = userData?.id;
  const currentUsername = userData?.username;

  const [activeTab, setActiveTab] = useState<'farmers' | 'researchers' | 'officers' | 'broadcasts'>(() => {
    if (isOfficer) return 'farmers';
    if (isResearcher) return 'officers';
    return 'farmers';
  });

  useEffect(() => {
    if (isOfficer) {
      setActiveTab('farmers');
    } else if (isResearcher) {
      setActiveTab('officers');
    } else {
      setActiveTab('farmers');
    }
  }, [role]);

  const availableTabs: { id: 'farmers' | 'researchers' | 'officers' | 'broadcasts', label: string, icon: any }[] = [];
  if (isOfficer) {
    availableTabs.push({ id: 'farmers', label: t('farmersLabel') || 'Farmers', icon: Users });
    availableTabs.push({ id: 'researchers', label: t('researchersLabel') || 'Researchers', icon: UserCog });
    availableTabs.push({ id: 'officers', label: t('agriOfficersLabel') || 'Agri Officers', icon: UserCog });
  } else if (isResearcher) {
    availableTabs.push({ id: 'officers', label: t('agriOfficersLabel') || 'Agri Officers', icon: UserCog });
    availableTabs.push({ id: 'researchers', label: t('researchersLabel') || 'Researchers', icon: Users });
  } else {
    availableTabs.push({ id: 'farmers', label: t('farmersLabel') || 'Farmers', icon: Users });
    availableTabs.push({ id: 'officers', label: t('agriOfficersLabel') || 'Agri Officers', icon: UserCog });
    availableTabs.push({ id: 'broadcasts', label: 'Broadcasts', icon: Bell });
  }

  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chatLoading, setChatLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [contacts, setContacts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesLenRef = useRef(0);

  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastsHistory, setBroadcastsHistory] = useState<any[]>([]);
  const [latestBroadcast, setLatestBroadcast] = useState('No active regional broadcasts at this time.');
  const [editingBroadcastId, setEditingBroadcastId] = useState<number | null>(null);
  const [editBroadcastText, setEditBroadcastText] = useState('');
  const broadcastsLenRef = useRef(0);
  const [unreadBroadcasts, setUnreadBroadcasts] = useState(0);
  const [tabUnread, setTabUnread] = useState<{ farmers: number, researchers: number, officers: number, broadcasts: number }>({
    farmers: 0,
    researchers: 0,
    officers: 0,
    broadcasts: 0
  });
  const activeTabRef = useRef(activeTab);

  // Set of read message identifiers: { [escKey]: last_msg_id or lastMsg text }
  const [readMap, setReadMap] = useState<Record<string, string | number>>(() => {
    try {
      const saved = localStorage.getItem('watermelon_chat_read_ids');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const markContactAsRead = (contact: any) => {
    if (!contact) return;
    const escKey = contact.esc_id?.toString() || contact.id?.toString();
    if (!escKey) return;
    const msgIdentifier = contact.last_msg_id ?? contact.lastMsg ?? 'read';
    
    setReadMap(prev => {
      const updated = { ...prev, [escKey]: msgIdentifier };
      try {
        localStorage.setItem('watermelon_chat_read_ids', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const isContactUnread = (contact: any) => {
    if (!contact) return false;
    const escKey = contact.esc_id?.toString() || contact.id?.toString();
    if (!escKey) return false;
    
    // If contact is currently open and active in view, consider it read
    if (selectedContact && (selectedContact.esc_id?.toString() === escKey || selectedContact.id?.toString() === escKey)) {
      return false;
    }

    // If there is no message, it's not unread
    if (!contact.lastMsg || contact.lastMsg === 'No active cases' || contact.lastMsg === 'No active conversation') {
      return false;
    }

    const currentMsgId = contact.last_msg_id ?? contact.lastMsg;
    const readMsgId = readMap[escKey];

    // If incoming message from other party that has not been opened yet
    if (contact.is_incoming) {
      return readMsgId !== currentMsgId;
    }

    if (contact.unread > 0) {
      return readMsgId !== currentMsgId;
    }

    return false;
  };

  useEffect(() => {
    activeTabRef.current = activeTab;
    if (activeTab === 'broadcasts') {
      setUnreadBroadcasts(0);
    }
  }, [activeTab]);

  const playReceiveSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
      
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch(e) {
      console.error("Audio playback failed", e);
    }
  };

  const fetchBroadcasts = async () => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/escalation/broadcast/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        
        if (broadcastsLenRef.current > 0 && data.length > broadcastsLenRef.current) {
          if (!isOfficer && !isResearcher) {
            if (activeTabRef.current !== 'broadcasts') {
              setUnreadBroadcasts(prev => prev + (data.length - broadcastsLenRef.current));
            }
          }
        }
        broadcastsLenRef.current = data.length;

        setBroadcastsHistory(data);
        if (data.length > 0) {
          setLatestBroadcast(data[0].message);
        } else {
          setLatestBroadcast("No active regional broadcasts at this time.");
        }
      }
    } catch (err) {
      console.error("Failed to fetch broadcasts", err);
    }
  };

  useEffect(() => {
    fetchBroadcasts();
    const interval = setInterval(() => fetchBroadcasts(), 10000);
    return () => clearInterval(interval);
  }, []);

  const deleteBroadcast = async (id: number) => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/escalation/broadcast/${id}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok || response.status === 204) {
        toast.success("Broadcast deleted");
        fetchBroadcasts();
      }
    } catch (err) {
      toast.error("Failed to delete broadcast");
    }
  };

  const saveEditBroadcast = async (id: number) => {
    if (!editBroadcastText.trim()) return;
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/escalation/broadcast/${id}/`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: editBroadcastText })
      });
      if (response.ok) {
        toast.success("Broadcast updated");
        setEditingBroadcastId(null);
        fetchBroadcasts();
      }
    } catch (err) {
      toast.error("Failed to update broadcast");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, selectedContact]);

  const playSendSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch(e) {
      console.error("Audio playback failed", e);
    }
  };

  const checkTabUnreadCounts = async () => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) return;
      const headers = { 'Authorization': `Bearer ${token}` };

      const tabsToCheck: ('farmers' | 'researchers' | 'officers')[] = ['farmers', 'researchers', 'officers'];
      const results = await Promise.all(
        tabsToCheck.map(tab => 
          fetch(`http://127.0.0.1:8000/api/escalation/contacts/?type=${tab}`, { headers })
            .then(res => res.ok ? res.json() : [])
            .catch(() => [])
        )
      );

      const newCounts = {
        farmers: 0,
        researchers: 0,
        officers: 0,
        broadcasts: unreadBroadcasts
      };

      tabsToCheck.forEach((tab, index) => {
        const contactList = results[index] || [];
        if (tab === activeTabRef.current) {
          setContacts(prev => {
            contactList.forEach((c: any) => {
              const prevContact = prev.find(p => p.id === c.id || p.esc_id === c.esc_id);
              if (c.is_incoming && c.last_msg_id) {
                const wasRead = prevContact ? !isContactUnread(prevContact) : true;
                const isNowUnread = isContactUnread(c);
                if (wasRead && isNowUnread && (!selectedContact || (selectedContact.esc_id !== c.esc_id && selectedContact.id !== c.id))) {
                  toast.info(`New message from ${c.name}`, {
                    description: c.lastMsg,
                    duration: 5000
                  });
                  playReceiveSound();
                }
              }
            });
            return contactList;
          });
        }
        
        let unreadCount = 0;
        contactList.forEach((c: any) => {
          if (isContactUnread(c)) {
            unreadCount++;
          }
        });
        newCounts[tab] = unreadCount;
      });

      setTabUnread(prev => ({ ...prev, ...newCounts }));
    } catch (e) {}
  };

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/escalation/contacts/?type=${activeTab}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const fetchedContacts = await response.json();
        setContacts(fetchedContacts);

        // Auto-select if navigating from Expert Review
        const pendingId = localStorage.getItem('pending_chat_esc_id');
        if (pendingId) {
          const contact = fetchedContacts.find((c: any) => c.esc_id?.toString() === pendingId);
          if (contact) {
            handleSelectContact(contact);
            localStorage.removeItem('pending_chat_esc_id');
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch contacts", err);
    } finally {
      setLoading(false);
    }
  };

  // Background polling for new messages across all contacts in active tab
  useEffect(() => {
    if (activeTab === 'broadcasts') return;
    checkTabUnreadCounts();
    const interval = setInterval(checkTabUnreadCounts, 4000);
    return () => clearInterval(interval);
  }, [activeTab, selectedContact?.esc_id, selectedContact?.id]);

  useEffect(() => {
    setSelectedContact(null);
    setMessages([]);
    setSearchQuery('');
    if (activeTab !== 'broadcasts') {
      fetchContacts();
    }
  }, [activeTab]);

  const fetchMessages = async (contact: any) => {
    if (!contact || !contact.esc_id) {
      setMessages([]);
      return;
    }
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/escalation/requests/${contact.esc_id}/chat/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const fetchedMessages = await response.json();
        
        if (messagesLenRef.current > 0 && fetchedMessages.length > messagesLenRef.current) {
          const newMsg = fetchedMessages[fetchedMessages.length - 1];
          const mySenderType = isOfficer ? 'officer' : (isResearcher ? 'researcher' : 'farmer');
          const isMyMsg = (newMsg.sender_id !== undefined && newMsg.sender_id !== null && currentUserId)
            ? (newMsg.sender_id === currentUserId)
            : (newMsg.sender_username && currentUsername ? newMsg.sender_username === currentUsername : (newMsg.sender_type === mySenderType));

          if (!isMyMsg) {
            toast.success(`${contact.name} sent a new message!`);
            playReceiveSound();
          }
        }
        messagesLenRef.current = fetchedMessages.length;

        const mapped = fetchedMessages.map((msg: any, idx: number) => {
          let status = 'read';
          if (idx === fetchedMessages.length - 1) {
            status = 'delivered';
          }
          return { ...msg, status };
        });
        setMessages(mapped);

        // Mark as read in readMap
        markContactAsRead(contact);

        // Update contact lastMsg preview and time in contacts sidebar
        if (fetchedMessages.length > 0) {
          const last = fetchedMessages[fetchedMessages.length - 1];
          const previewText = last.text.length > 30 ? last.text.substring(0, 30) + '...' : last.text;
          const previewTime = last.time || (last.created_at ? new Date(last.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active');

          setContacts(prev => prev.map(c => 
            (c.esc_id === contact.esc_id || (contact.id && c.id === contact.id))
              ? { ...c, lastMsg: previewText, time: previewTime, last_msg_id: last.id }
              : c
          ));
        }
      }
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  const handleSelectContact = (contact: any) => {
    setSelectedContact(contact);
    messagesLenRef.current = 0;

    // Immediately mark as read -> Bell icon disappears!
    markContactAsRead(contact);

    if (contact && !contact.isBroadcast) {
      setChatLoading(true);
      fetchMessages(contact).finally(() => setChatLoading(false));
    }
  };

  useEffect(() => {
    if (selectedContact && !selectedContact.isBroadcast && selectedContact.esc_id) {
      const interval = setInterval(() => fetchMessages(selectedContact), 4000);
      return () => clearInterval(interval);
    }
  }, [selectedContact?.esc_id, selectedContact?.id]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact?.esc_id) return;
    
    playSendSound();
    
    const originalText = newMessage.trim();
    const formattedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const tempId = Date.now();
    const mySenderType = isOfficer ? 'officer' : (isResearcher ? 'researcher' : 'farmer');

    const tempMsg = {
      id: tempId,
      sender_id: currentUserId,
      sender_username: currentUsername,
      sender_type: mySenderType,
      text: originalText,
      time: formattedTime,
      status: 'sending'
    };
    
    setMessages(prev => [...prev, tempMsg]);
    setNewMessage('');
    
    // Update contact preview immediately in sidebar
    const previewText = originalText.length > 30 ? originalText.substring(0, 30) + '...' : originalText;
    
    markContactAsRead({ ...selectedContact, lastMsg: previewText, last_msg_id: tempId });

    setContacts(prev => prev.map(c => 
      (c.esc_id === selectedContact.esc_id || (selectedContact.id && c.id === selectedContact.id))
        ? { ...c, lastMsg: previewText, time: formattedTime, last_msg_id: tempId, is_incoming: false }
        : c
    ));
    setSelectedContact((prev: any) => prev ? { ...prev, lastMsg: previewText, time: formattedTime, last_msg_id: tempId, is_incoming: false } : prev);
    
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/escalation/requests/${selectedContact.esc_id}/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: originalText })
      });

      if (response.ok) {
        setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'sent' } : m));
        
        setTimeout(() => {
          setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'delivered' } : m));
        }, 800);
        
        setTimeout(() => {
          setMessages(prev => prev.map(m => m.id === tempId ? { ...m, status: 'read' } : m));
        }, 1600);
        
        // Refresh messages from server to sync state
        await fetchMessages(selectedContact);

        // Synchronize contact list with backend in background
        checkTabUnreadCounts();
      } else {
        setMessages(prev => prev.filter(m => m.id !== tempId));
        toast.error(t('failedSendMessage'));
      }
    } catch (err) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
      toast.error(t('failedSendMessage'));
    }
  };

  const handleDeleteConversation = async () => {
    if (!selectedContact?.esc_id) return;
    setIsDeleting(true);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/escalation/requests/${selectedContact.esc_id}/chat/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success("Conversation deleted successfully");
        setMessages([]);
        messagesLenRef.current = 0;
        
        // Update contact preview in list
        setContacts(prev => prev.map(c => 
          (c.esc_id === selectedContact.esc_id || (selectedContact.id && c.id === selectedContact.id))
            ? { ...c, lastMsg: "No active conversation", time: "Active", unread: 0 }
            : c
        ));
        setSelectedContact((prev: any) => prev ? { ...prev, lastMsg: "No active conversation", time: "Active", unread: 0 } : prev);
        setShowDeleteConfirm(false);
      } else {
        toast.error("Failed to delete conversation");
      }
    } catch (err) {
      toast.error("Failed to delete conversation");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBroadcast = () => {
    setBroadcastMessage('');
    setShowBroadcastModal(true);
  };

  const submitBroadcast = async () => {
    if (!broadcastMessage.trim()) return;
    
    setIsBroadcasting(true);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      localStorage.setItem('latest_broadcast_msg', broadcastMessage);
      
      const response = await fetch('http://127.0.0.1:8000/api/escalation/broadcast/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: broadcastMessage })
      });

      if (response.ok) {
        toast.success(t('regionalAlertSuccess'));
        fetchBroadcasts();
        setBroadcastMessage('');
      } else {
        toast.success(t('regionalAlertSuccess'));
        fetchBroadcasts();
      }
    } catch (err) {
      toast.error(t('failedBroadcastAlert'));
    } finally {
      setIsBroadcasting(false);
    }
  };

  const filteredContacts = contacts.filter((contact: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (contact.name && contact.name.toLowerCase().includes(q)) ||
      (contact.lastMsg && contact.lastMsg.toLowerCase().includes(q)) ||
      (contact.location && contact.location.toLowerCase().includes(q))
    );
  });

  const filteredBroadcasts = broadcastsHistory.filter((b: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (b.message && b.message.toLowerCase().includes(q)) ||
      (b.officer_name && b.officer_name.toLowerCase().includes(q)) ||
      (b.region && b.region.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 h-[calc(100vh-180px)]">
      <div className="grid grid-cols-12 gap-6 h-full">
        
        {/* Left Sidebar: Contact List */}
        <Card className="col-span-12 md:col-span-4 flex flex-col overflow-hidden border-none shadow-xl">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-card sticky top-0 z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-xl text-gray-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="text-[#2E7D32]" />
                {t('commsHub')}
              </h3>
              {(isOfficer || isResearcher) && (
                <Button 
                  onClick={handleBroadcast}
                  className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 border-none px-3 py-1.5 h-auto text-[10px] font-black uppercase tracking-widest gap-2"
                >
                  <Bell size={14} className="animate-bounce" />
                  {t('broadcast')}
                </Button>
              )}
            </div>



            <div className="flex bg-muted dark:bg-gray-800 p-1 rounded-xl mb-4">
              {availableTabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all relative ${activeTab === tab.id ? 'bg-card text-[#2E7D32] shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                  >
                    <TabIcon size={14} /> {tab.label}
                    {tab.id === 'broadcasts' && unreadBroadcasts > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full animate-bounce shadow-md">
                        {unreadBroadcasts}
                      </span>
                    )}
                    {tab.id !== 'broadcasts' && tabUnread[tab.id] > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-white text-[9px] font-black flex items-center justify-center rounded-full animate-bounce shadow-md">
                        {tabUnread[tab.id]}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchContactsPlaceholder')}
                className="w-full pl-9 pr-4 py-2.5 bg-muted/50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-xs outline-none focus:border-[#2E7D32] transition-all text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-muted/20 dark:bg-gray-900/20">
            {loading ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-2 text-gray-400">
                <Loader2 className="animate-spin text-[#2E7D32]" size={24} />
                <span className="text-xs font-bold">Loading contacts...</span>
              </div>
            ) : activeTab === 'broadcasts' ? (
              filteredBroadcasts.length === 0 ? (
                <p className="text-xs text-gray-400 font-medium text-center p-6">No broadcasts found.</p>
              ) : (
                filteredBroadcasts.map((b, idx) => (
                  <div 
                    key={b.id}
                    onClick={() => setSelectedContact({ isBroadcast: true, ...b })}
                    className={`p-4 cursor-pointer transition-all border border-transparent rounded-2xl mb-2
                      ${selectedContact?.id === b.id 
                        ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' 
                        : 'bg-card hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-amber-100 dark:bg-amber-900/50 p-2 rounded-xl text-amber-600 dark:text-amber-400 flex-shrink-0">
                        <Bell size={18} className={idx === 0 ? "animate-pulse" : ""} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <h4 className="font-bold text-sm text-gray-900 dark:text-white truncate">
                            {idx === 0 ? 'Latest Broadcast' : 'Previous Broadcast'}
                          </h4>
                          <span className="text-[10px] font-bold text-gray-400 whitespace-nowrap">
                            {new Date(b.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                          {b.message}
                        </p>
                        <div className="mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          From: {b.officer_name} ({b.region})
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : filteredContacts.length === 0 ? (
              <p className="text-xs text-gray-400 font-medium text-center p-6">No contacts found.</p>
            ) : (
              filteredContacts.map((contact: any) => {
                const isUnread = isContactUnread(contact);
                const isSelected = selectedContact?.id === contact.id || (selectedContact?.esc_id && selectedContact.esc_id === contact.esc_id);

                return (
                  <div 
                    key={contact.id}
                    onClick={() => handleSelectContact(contact)}
                    className={`p-4 cursor-pointer transition-all border rounded-2xl ${
                      isSelected 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 shadow-md' 
                        : isUnread
                        ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700 hover:bg-amber-100/70 shadow-sm'
                        : 'bg-card border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <p className={`font-bold text-sm truncate ${isUnread ? 'text-amber-950 dark:text-amber-200 font-black' : 'text-gray-900 dark:text-white'}`}>
                          {contact.name}
                        </p>
                        {isUnread && (
                          <span className="flex-shrink-0 flex items-center justify-center p-1.5 bg-amber-500 text-white rounded-full animate-bounce shadow-md" title="New unread message">
                            <Bell size={13} className="stroke-[2.5]" />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 flex-shrink-0">{contact.time}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <p className={`text-xs truncate pr-4 ${isUnread ? 'text-amber-900 dark:text-amber-300 font-bold' : 'text-gray-500 font-medium'}`}>
                        {contact.lastMsg}
                      </p>
                      {isUnread ? (
                        <div className="flex items-center gap-1">
                          <span className="min-w-[20px] h-5 px-1.5 bg-amber-500 text-white text-[10px] font-black flex items-center justify-center rounded-full animate-pulse shadow-md">
                            New
                          </span>
                        </div>
                      ) : (
                        contact.status === 'urgent' && (
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                        )
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-dashed border-gray-100 dark:border-gray-800">
                      <span className={`text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                        contact.role === 'farmer' || activeTab === 'farmers'
                          ? 'text-[#2E7D32] dark:text-green-400 bg-green-50 dark:bg-green-950/30'
                          : contact.role === 'researcher' || activeTab === 'researchers'
                          ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30'
                          : 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30'
                      }`}>
                        {contact.role === 'farmer' || activeTab === 'farmers' ? 'Farmer' : contact.role === 'researcher' || activeTab === 'researchers' ? 'Researcher' : 'Agri Officer'}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_4px_rgba(34,197,94,0.5)]"></span>
                        <span className="text-[9px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest">Online</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Right Sidebar: Chat View */}
        <Card className="col-span-12 md:col-span-8 flex flex-col overflow-hidden border-none shadow-xl bg-card">
          {selectedContact ? (
            selectedContact.isBroadcast ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-amber-50/30 dark:bg-amber-900/10">
                <div className="w-24 h-24 bg-amber-100 dark:bg-amber-900/30 rounded-[2.5rem] flex items-center justify-center mb-6 text-amber-500 shadow-inner">
                  <Bell size={48} strokeWidth={1.5} className="animate-pulse" />
                </div>
                <h3 className="text-xl font-black text-amber-900 dark:text-amber-400 mb-4 uppercase tracking-widest text-[11px]">Regional Alert</h3>
                <div className="bg-card p-8 rounded-3xl shadow-sm border border-amber-100 dark:border-amber-900/50 max-w-xl w-full text-left relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-relaxed mb-6">
                    {selectedContact.message}
                  </p>
                  <div className="flex justify-between items-center border-t border-gray-100 dark:border-gray-800 pt-4">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Sent By: {selectedContact.officer_name}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(selectedContact.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <>
              {/* Chat Header */}
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-card shadow-sm sticky top-0 z-10">
                 <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl ${
                       selectedContact?.role === 'farmer' || activeTab === 'farmers'
                         ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                         : selectedContact?.role === 'researcher' || activeTab === 'researchers'
                         ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                         : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                     }`}>
                       {selectedContact.name ? selectedContact.name.substring(0, 2).toUpperCase() : '??'}
                     </div>
                     <div>
                       <h4 className="font-black text-gray-900 dark:text-white">{selectedContact.name}</h4>
                     <div className="flex items-center gap-2 mt-1">
                       <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(34,197,94,0.5)]"></span>
                       <p className="text-[10px] font-black text-green-600 dark:text-green-400 uppercase tracking-wider">Online</p>
                       <span className="text-gray-300 dark:text-gray-700">•</span>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                         {selectedContact?.role === 'farmer' || activeTab === 'farmers' ? 'Farmer' : selectedContact?.role === 'researcher' || activeTab === 'researchers' ? 'Researcher' : 'Agri Officer'} ({selectedContact.location || 'Active'})
                       </p>
                     </div>
                   </div>
                 </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" className="p-2 h-auto rounded-xl border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-muted">
                    <Phone size={18} />
                  </Button>
                  <Button variant="outline" className="p-2 h-auto rounded-xl border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-muted">
                    <Mail size={18} />
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDeleteConfirm(true)}
                    title="Delete Conversation"
                    className="p-2 h-auto rounded-xl border-red-100 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-all"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
              </div>

              {/* Chat Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/pinstripe-light.png')]">
                <div className="text-center">
                  <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100 uppercase tracking-[0.2em]">
                    {t('encryptedConsultation')}
                  </span>
                </div>

                {chatLoading ? (
                  <div className="flex flex-col items-center justify-center p-12 space-y-2 text-gray-400">
                    <Loader2 className="animate-spin text-[#2E7D32]" size={32} />
                    <span className="text-xs font-bold">Loading chat history...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 space-y-2">
                    <p className="text-xs font-semibold">No messages yet. Send a message to start the consultation.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMyMessage = (msg.sender_id !== undefined && msg.sender_id !== null && currentUserId)
                      ? (msg.sender_id === currentUserId)
                      : (msg.sender_username && currentUsername ? msg.sender_username === currentUsername : (
                          (msg.sender_type === 'officer' && isOfficer) || 
                          (msg.sender_type === 'farmer' && !isOfficer && !isResearcher) || 
                          (msg.sender_type === 'researcher' && isResearcher)
                        ));
                    return (
                      <div key={msg.id} className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] p-4 rounded-3xl text-sm shadow-sm ${
                          isMyMessage 
                            ? 'bg-[#2E7D32] dark:bg-green-700 text-white rounded-tr-none' 
                            : 'bg-card text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700'
                        }`}>
                          <p className="leading-relaxed font-medium">{msg.text}</p>
                          <div className="flex items-center justify-between gap-4 mt-2 border-t border-white/10 dark:border-gray-700/30 pt-1.5">
                            <div className="flex items-center gap-1 opacity-60">
                              <Clock size={10} />
                              <span className="text-[9px] font-bold">{msg.time}</span>
                            </div>
                            {isMyMessage && (
                              <div className="flex items-center">
                                {msg.status === 'sending' && (
                                  <Clock size={10} className="text-white/40 animate-pulse" />
                                )}
                                {msg.status === 'sent' && (
                                  <Check size={12} className="text-white/60 dark:text-gray-400/60" />
                                )}
                                {msg.status === 'delivered' && (
                                  <CheckCheck size={12} className="text-white/60 dark:text-gray-400/60" />
                                )}
                                {msg.status === 'read' && (
                                  <CheckCheck size={12} className="text-sky-300 dark:text-sky-400 font-black" />
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-6 bg-card border-t border-gray-100 dark:border-gray-700">
                {!selectedContact.esc_id ? (
                  <div className="flex items-center justify-center p-4 bg-amber-50 rounded-2xl border border-amber-100 gap-3">
                    <AlertTriangle className="text-amber-500" size={20} />
                    <p className="text-sm font-bold text-amber-700">{t('noActiveEscalationCase')}</p>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    <Button variant="ghost" className="p-2 h-auto rounded-xl text-gray-400 hover:text-[#2E7D32]">
                      <FileText size={20} />
                    </Button>
                    <div className="flex-1 relative">
                      <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder={t('typeProfessionalResponse')}
                        className="w-full pl-6 pr-12 py-4 bg-muted border border-gray-100 dark:border-gray-700 rounded-2xl text-sm font-medium outline-none focus:border-[#2E7D32] focus:bg-card transition-all shadow-inner text-gray-900 dark:text-gray-100"
                      />
                      <Button 
                        onClick={handleSendMessage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#2E7D32] hover:bg-[#1B5E20] text-white w-10 h-10 p-0 rounded-xl shadow-lg shadow-green-900/20 transition-all active:scale-95"
                      >
                        <Send size={18} />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              </>
            )
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-muted/30">
              <div className="w-24 h-24 bg-muted rounded-[2.5rem] flex items-center justify-center mb-6 text-gray-400 shadow-inner">
                <MessageSquare size={48} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{t('regionalCommsHub')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm font-medium">
                {t('selectContactInstruction')}
              </p>
            </div>
          )}
        </Card>
      </div>

      {/* Broadcast Modal Overlay */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400">
                  <Bell size={20} />
                </div>
                <h3 className="font-black text-gray-900 dark:text-white">New Broadcast</h3>
              </div>
              <button 
                onClick={() => setShowBroadcastModal(false)}
                className="p-2 text-gray-400 hover:bg-muted rounded-xl transition-all"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 block">
                Announcement Message
              </label>
              <textarea 
                value={broadcastMessage}
                onChange={(e) => setBroadcastMessage(e.target.value)}
                placeholder="Type the regional alert or instruction here..."
                className="w-full min-h-[120px] p-4 bg-muted/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium outline-none focus:border-[#2E7D32] resize-none text-gray-900 dark:text-gray-100 mb-6"
              ></textarea>
              
              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">
                  Broadcast History
                </label>
                {broadcastsHistory.map((b) => (
                  <div key={b.id} className="bg-muted/30 border border-gray-100 dark:border-gray-800 p-4 rounded-xl">
                    {editingBroadcastId === b.id ? (
                      <div>
                        <textarea 
                          value={editBroadcastText}
                          onChange={(e) => setEditBroadcastText(e.target.value)}
                          className="w-full p-3 text-sm bg-card border border-[#2E7D32] rounded-lg outline-none mb-3"
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setEditingBroadcastId(null)} className="h-8 text-xs font-bold">Cancel</Button>
                          <Button size="sm" onClick={() => saveEditBroadcast(b.id)} className="h-8 bg-[#2E7D32] hover:bg-[#1B5E20] text-xs font-bold text-white">Save</Button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">{b.message}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-gray-400">By {b.officer_name} • {new Date(b.created_at).toLocaleDateString()}</span>
                          <div className="flex gap-2">
                            <button onClick={() => { setEditingBroadcastId(b.id); setEditBroadcastText(b.message); }} className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors">
                              <Edit3 size={14} />
                            </button>
                            <button onClick={() => deleteBroadcast(b.id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {broadcastsHistory.length === 0 && (
                  <p className="text-xs text-gray-400 font-medium text-center p-4">No broadcast history found.</p>
                )}
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-800 bg-muted/30 flex justify-end gap-3">
              <Button 
                variant="outline"
                onClick={() => setShowBroadcastModal(false)}
                className="rounded-xl font-bold"
              >
                Cancel
              </Button>
              <Button 
                onClick={submitBroadcast}
                disabled={isBroadcasting || !broadcastMessage.trim()}
                className="rounded-xl bg-[#2E7D32] hover:bg-[#1B5E20] text-white font-bold px-6 shadow-lg shadow-green-900/20"
              >
                {isBroadcasting ? 'Sending...' : 'Send Broadcast'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Conversation Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-2xl text-red-600 dark:text-red-400">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="font-black text-lg text-gray-900 dark:text-white">Delete Conversation?</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
              Are you sure you want to delete the chat history with <span className="font-bold text-gray-900 dark:text-white">{selectedContact?.name}</span>? All messages in this conversation will be permanently removed.
            </p>

            <div className="flex justify-end gap-3">
              <Button 
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-xl font-bold px-4"
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleDeleteConversation}
                disabled={isDeleting}
                className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold px-5 shadow-lg shadow-red-900/20 gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete Conversation
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
