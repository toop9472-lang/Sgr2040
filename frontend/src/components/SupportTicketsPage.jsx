import React, { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Send, MessageCircle, Clock, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { toast } from 'sonner';
import { useLanguage } from '../i18n/LanguageContext';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const SupportTicketsPage = ({ user, onBack }) => {
  const { t, isRTL } = useLanguage();
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [newTicket, setNewTicket] = useState({ subject: '', message: '', category: 'general' });
  const [replyMessage, setReplyMessage] = useState('');

  const categories = [
    { id: 'general', label: isRTL ? 'استفسار عام' : 'General Inquiry' },
    { id: 'technical', label: isRTL ? 'مشكلة تقنية' : 'Technical Issue' },
    { id: 'payment', label: isRTL ? 'الدفع والسحب' : 'Payment & Withdrawal' },
    { id: 'account', label: isRTL ? 'حسابي' : 'My Account' },
  ];

  const statusConfig = {
    open: { color: 'text-blue-400', bg: 'bg-blue-500/20', label: isRTL ? 'مفتوحة' : 'Open', icon: MessageCircle },
    in_progress: { color: 'text-yellow-400', bg: 'bg-yellow-500/20', label: isRTL ? 'قيد المعالجة' : 'In Progress', icon: Clock },
    resolved: { color: 'text-green-400', bg: 'bg-green-500/20', label: isRTL ? 'تم الحل' : 'Resolved', icon: CheckCircle },
    closed: { color: 'text-gray-400', bg: 'bg-gray-500/20', label: isRTL ? 'مغلقة' : 'Closed', icon: X },
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('saqr_token');
      const response = await fetch(`${API_URL}/api/support/tickets`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.subject || !newTicket.message) {
      toast.error(isRTL ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return;
    }

    try {
      const token = localStorage.getItem('saqr_token');
      const response = await fetch(`${API_URL}/api/support/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTicket)
      });

      if (response.ok) {
        toast.success(isRTL ? 'تم إنشاء التذكرة بنجاح' : 'Ticket created successfully');
        setShowCreateModal(false);
        setNewTicket({ subject: '', message: '', category: 'general' });
        fetchTickets();
      }
    } catch (error) {
      toast.error(isRTL ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const handleReply = async () => {
    if (!replyMessage.trim()) return;

    try {
      const token = localStorage.getItem('saqr_token');
      const response = await fetch(`${API_URL}/api/support/tickets/${selectedTicket.ticket_id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: replyMessage })
      });

      if (response.ok) {
        toast.success(isRTL ? 'تم إرسال الرد' : 'Reply sent');
        setReplyMessage('');
        // Refresh ticket
        const ticketResponse = await fetch(`${API_URL}/api/support/tickets/${selectedTicket.ticket_id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (ticketResponse.ok) {
          setSelectedTicket(await ticketResponse.json());
        }
        fetchTickets();
      }
    } catch (error) {
      toast.error(isRTL ? 'حدث خطأ' : 'An error occurred');
    }
  };

  const openTicketDetail = async (ticket) => {
    try {
      const token = localStorage.getItem('saqr_token');
      const response = await fetch(`${API_URL}/api/support/tickets/${ticket.ticket_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setSelectedTicket(await response.json());
        setShowTicketModal(true);
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#3b82f6] to-[#6366f1] px-4 pt-8 pb-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="text-white">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-white text-xl font-bold">{isRTL ? 'تذاكر الدعم' : 'Support Tickets'}</h1>
        </div>
      </div>

      <div className="px-4 -mt-4">
        {/* Create Ticket Button */}
        <Button
          onClick={() => setShowCreateModal(true)}
          className="w-full bg-[#3b82f6] hover:bg-[#2563eb] mb-4"
          data-testid="create-ticket-btn"
        >
          <Plus size={18} className="mr-2" />
          {isRTL ? 'إنشاء تذكرة جديدة' : 'Create New Ticket'}
        </Button>

        {/* Tickets List */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-400">
            {isRTL ? 'جاري التحميل...' : 'Loading...'}
          </div>
        ) : tickets.length === 0 ? (
          <Card className="bg-[#111118]/80 border-white/10">
            <CardContent className="py-8 text-center">
              <MessageCircle className="mx-auto mb-3 text-gray-500" size={48} />
              <p className="text-gray-400">{isRTL ? 'لا توجد تذاكر' : 'No tickets yet'}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const status = statusConfig[ticket.status] || statusConfig.open;
              const StatusIcon = status.icon;
              return (
                <Card
                  key={ticket.ticket_id}
                  className="bg-[#111118]/80 border-white/10 cursor-pointer hover:bg-[#111118]"
                  onClick={() => openTicketDetail(ticket)}
                  data-testid={`ticket-${ticket.ticket_id}`}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-white font-medium mb-1">{ticket.subject}</h3>
                        <p className="text-gray-500 text-sm mb-2">#{ticket.ticket_id}</p>
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${status.bg} ${status.color}`}>
                          <StatusIcon size={12} />
                          {status.label}
                        </div>
                      </div>
                      <span className="text-gray-500 text-xs">
                        {new Date(ticket.created_at).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="bg-[#111118] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>{isRTL ? 'إنشاء تذكرة دعم' : 'Create Support Ticket'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-gray-400 mb-1 block">{isRTL ? 'التصنيف' : 'Category'}</label>
              <select
                value={newTicket.category}
                onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white"
              >
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id} className="bg-[#111118]">{cat.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-sm text-gray-400 mb-1 block">{isRTL ? 'الموضوع' : 'Subject'}</label>
              <Input
                value={newTicket.subject}
                onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                className="bg-white/5 border-white/10 text-white"
                placeholder={isRTL ? 'موضوع التذكرة' : 'Ticket subject'}
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-400 mb-1 block">{isRTL ? 'الرسالة' : 'Message'}</label>
              <Textarea
                value={newTicket.message}
                onChange={(e) => setNewTicket({...newTicket, message: e.target.value})}
                className="bg-white/5 border-white/10 text-white min-h-[100px]"
                placeholder={isRTL ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateModal(false)} className="border-white/10">
              {isRTL ? 'إلغاء' : 'Cancel'}
            </Button>
            <Button onClick={handleCreateTicket} className="bg-[#3b82f6]">
              {isRTL ? 'إنشاء' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket Detail Modal */}
      <Dialog open={showTicketModal} onOpenChange={setShowTicketModal}>
        <DialogContent className="bg-[#111118] border-white/10 text-white max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTicket?.subject}</DialogTitle>
          </DialogHeader>
          
          {selectedTicket && (
            <div className="space-y-4 py-4">
              <div className="text-sm text-gray-500">#{selectedTicket.ticket_id}</div>
              
              {/* Messages */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {selectedTicket.messages?.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg ${
                      msg.sender === 'user' 
                        ? 'bg-[#3b82f6]/20 ml-4' 
                        : 'bg-white/5 mr-4'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`text-xs ${msg.sender === 'user' ? 'text-[#60a5fa]' : 'text-gray-400'}`}>
                        {msg.sender === 'user' ? (isRTL ? 'أنت' : 'You') : (isRTL ? 'الدعم' : 'Support')}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(msg.timestamp).toLocaleString(isRTL ? 'ar-SA' : 'en-US')}
                      </span>
                    </div>
                    <p className="text-sm text-white">{msg.message}</p>
                  </div>
                ))}
              </div>
              
              {/* Reply Input */}
              {selectedTicket.status !== 'closed' && (
                <div className="flex gap-2">
                  <Input
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    className="bg-white/5 border-white/10 text-white flex-1"
                    placeholder={isRTL ? 'اكتب ردك...' : 'Type your reply...'}
                    onKeyPress={(e) => e.key === 'Enter' && handleReply()}
                  />
                  <Button onClick={handleReply} className="bg-[#3b82f6]">
                    <Send size={18} />
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SupportTicketsPage;
