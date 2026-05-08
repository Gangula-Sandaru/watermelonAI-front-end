import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { MessageSquare, Users, UserCog, Search, Send, FileText, CheckCircle2, Clock, Filter, Phone, Mail, Bell, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export const CommunicationModule = () => {
  const [activeTab, setActiveTab] = useState<'farmers' | 'researchers'>('farmers');
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [loading, setLoading] = useState(true);

  const [contacts, setContacts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

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
            setSelectedContact(contact);
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

  useEffect(() => {
    fetchContacts();
  }, [activeTab]);

  const fetchMessages = async (contact: any) => {
    if (!contact.esc_id) {
      setMessages([]);
      return;
    }
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/escalation/requests/${contact.esc_id}/chat/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setMessages(await response.json());
      }
    } catch (err) {
      console.error("Failed to fetch messages", err);
    }
  };

  useEffect(() => {
    if (selectedContact) {
      fetchMessages(selectedContact);
      // Optional: poll for new messages
      const interval = setInterval(() => fetchMessages(selectedContact), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedContact]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact?.esc_id) return;
    
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch(`http://127.0.0.1:8000/api/escalation/requests/${selectedContact.esc_id}/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ text: newMessage })
      });

      if (response.ok) {
        setNewMessage('');
        fetchMessages(selectedContact);
      }
    } catch (err) {
      toast.error("Failed to send message");
    }
  };

  const handleBroadcast = async () => {
    const msg = prompt("Enter the alert message for your region:");
    if (!msg) return;

    setIsBroadcasting(true);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await fetch('http://127.0.0.1:8000/api/escalation/broadcast/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: msg })
      });

      if (response.ok) {
        toast.success("Regional alert broadcasted successfully");
      }
    } catch (err) {
      toast.error("Failed to broadcast alert");
    } finally {
      setIsBroadcasting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 h-[calc(100vh-180px)]">
      <div className="grid grid-cols-12 gap-6 h-full">
        
        {/* Left Sidebar: Contact List */}
        <Card className="col-span-12 md:col-span-4 flex flex-col overflow-hidden border-none shadow-xl">
          <div className="p-6 border-b border-gray-100 bg-white sticky top-0 z-10">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-xl text-gray-900 flex items-center gap-2">
                <MessageSquare className="text-[#2E7D32]" />
                Comms Hub
              </h3>
              <Button 
                onClick={handleBroadcast}
                className="bg-red-50 text-red-600 hover:bg-red-100 border-none px-3 py-1.5 h-auto text-[10px] font-black uppercase tracking-widest gap-2"
              >
                <Bell size={14} className="animate-bounce" />
                Broadcast
              </Button>
            </div>

            <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
              <button 
                onClick={() => setActiveTab('farmers')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'farmers' ? 'bg-white text-[#2E7D32] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Users size={14} /> Farmers
              </button>
              <button 
                onClick={() => setActiveTab('researchers')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'researchers' ? 'bg-white text-[#2E7D32] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <UserCog size={14} /> Researchers
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search contacts..."
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:border-[#2E7D32] transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-gray-50/50">
            {contacts.map((contact: any) => (
              <div 
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`p-4 rounded-2xl cursor-pointer transition-all border-2 ${
                  selectedContact?.id === contact.id 
                    ? 'bg-white border-[#2E7D32] shadow-md' 
                    : 'border-transparent hover:bg-white hover:border-gray-100'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="font-bold text-gray-900 text-sm">{contact.name}</p>
                  <span className="text-[10px] font-bold text-gray-400">{contact.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500 truncate pr-4 font-medium">{contact.lastMsg}</p>
                  {contact.unread > 0 && (
                    <span className="w-5 h-5 bg-[#2E7D32] text-white text-[10px] font-bold flex items-center justify-center rounded-full">
                      {contact.unread}
                    </span>
                  )}
                  {contact.status === 'urgent' && (
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Right Sidebar: Chat View */}
        <Card className="col-span-12 md:col-span-8 flex flex-col overflow-hidden border-none shadow-xl bg-white">
          {selectedContact ? (
            <>
              {/* Chat Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl ${activeTab === 'farmers' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {selectedContact.name.substring(0, 2)}
                  </div>
                  <div>
                    <h4 className="font-black text-gray-900">{selectedContact.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                        {activeTab === 'farmers' ? selectedContact.location : selectedContact.role}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="p-2 h-auto rounded-xl border-gray-100 text-gray-500 hover:bg-gray-50">
                    <Phone size={18} />
                  </Button>
                  <Button variant="outline" className="p-2 h-auto rounded-xl border-gray-100 text-gray-500 hover:bg-gray-50">
                    <Mail size={18} />
                  </Button>
                </div>
              </div>

              {/* Chat Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[url('https://www.transparenttextures.com/patterns/pinstripe-light.png')]">
                <div className="text-center">
                  <span className="text-[10px] font-black text-gray-400 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100 uppercase tracking-[0.2em]">
                    End-to-End Encrypted Consultation
                  </span>
                </div>

                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender_type === 'officer' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-4 rounded-3xl text-sm shadow-sm ${
                      msg.sender_type === 'officer' 
                        ? 'bg-gray-900 text-white rounded-tr-none' 
                        : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
                    }`}>
                      <p className="leading-relaxed font-medium">{msg.text}</p>
                      <div className={`flex items-center gap-1.5 mt-2 ${msg.sender_type === 'officer' ? 'text-gray-400' : 'text-gray-400'}`}>
                        <Clock size={10} />
                        <span className="text-[10px] font-bold">{msg.time}</span>
                        {msg.sender_type === 'officer' && <CheckCircle2 size={10} className="text-green-500" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input */}
              <div className="p-6 bg-white border-t border-gray-100">
                {!selectedContact.esc_id ? (
                  <div className="flex items-center justify-center p-4 bg-amber-50 rounded-2xl border border-amber-100 gap-3">
                    <AlertTriangle className="text-amber-500" size={20} />
                    <p className="text-sm font-bold text-amber-700">No active escalation case for this farmer.</p>
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
                        placeholder="Type your professional response..."
                        className="w-full pl-6 pr-12 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium outline-none focus:border-[#2E7D32] focus:bg-white transition-all shadow-inner"
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
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-gray-50/30">
              <div className="w-24 h-24 bg-gray-100 rounded-[2.5rem] flex items-center justify-center mb-6 text-gray-400 shadow-inner">
                <MessageSquare size={48} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-black text-gray-900 mb-2">Regional Communication Hub</h3>
              <p className="text-sm text-gray-500 max-w-sm font-medium">
                Select a farmer or researcher from the list to begin a secure consultation or provide diagnostic feedback.
              </p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
