// Support Screen - شاشة الدعم الفني
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import storage from '../services/storage';

const API_URL = 'https://mobile-verify-9.preview.emergentagent.com';

const CATEGORIES = [
  { id: 'general', label: 'استفسار عام', icon: 'help-circle-outline' },
  { id: 'technical', label: 'مشكلة تقنية', icon: 'bug-outline' },
  { id: 'payment', label: 'المدفوعات', icon: 'card-outline' },
  { id: 'account', label: 'الحساب', icon: 'person-outline' },
];

const SupportScreen = ({ navigation }) => {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showNewTicket, setShowNewTicket] = useState(false);
  const [showTicketDetail, setShowTicketDetail] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newTicket, setNewTicket] = useState({
    subject: '',
    message: '',
    category: 'general',
  });
  
  const [replyMessage, setReplyMessage] = useState('');

  useEffect(() => {
    fetchTickets();
  }, []);

  const getAuthToken = async () => {
    return await storage.get('token');
  };

  const fetchTickets = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/api/support/tickets`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTickets(data);
      }
    } catch (error) {
      console.error('Error fetching tickets:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const createTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim()) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/api/support/tickets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newTicket),
      });

      if (response.ok) {
        const data = await response.json();
        Alert.alert('تم بنجاح', data.message || 'تم إنشاء التذكرة بنجاح');
        setShowNewTicket(false);
        setNewTicket({ subject: '', message: '', category: 'general' });
        fetchTickets();
      } else {
        const error = await response.json();
        Alert.alert('خطأ', error.detail || 'فشل إنشاء التذكرة');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setIsSubmitting(false);
    }
  };

  const replyToTicket = async (ticketId) => {
    if (!replyMessage.trim()) {
      Alert.alert('خطأ', 'يرجى كتابة الرسالة');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/api/support/tickets/${ticketId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: replyMessage }),
      });

      if (response.ok) {
        Alert.alert('تم بنجاح', 'تم إرسال ردك بنجاح');
        setReplyMessage('');
        fetchTickets();
        // Refresh ticket detail
        const updatedTicket = tickets.find(t => t.ticket_id === ticketId);
        if (updatedTicket) {
          fetchTicketDetail(ticketId);
        }
      } else {
        const error = await response.json();
        Alert.alert('خطأ', error.detail || 'فشل إرسال الرد');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ في الاتصال');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchTicketDetail = async (ticketId) => {
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_URL}/api/support/tickets/${ticketId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setShowTicketDetail(data);
      }
    } catch (error) {
      console.error('Error fetching ticket:', error);
    }
  };

  const closeTicket = async (ticketId) => {
    Alert.alert(
      'إغلاق التذكرة',
      'هل أنت متأكد من إغلاق هذه التذكرة؟',
      [
        { text: 'إلغاء', style: 'cancel' },
        {
          text: 'إغلاق',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getAuthToken();
              const response = await fetch(`${API_URL}/api/support/tickets/${ticketId}/close`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                },
              });

              if (response.ok) {
                Alert.alert('تم', 'تم إغلاق التذكرة');
                setShowTicketDetail(null);
                fetchTickets();
              }
            } catch (error) {
              Alert.alert('خطأ', 'فشل إغلاق التذكرة');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#22c55e';
      case 'in_progress': return '#fbbf24';
      case 'resolved': return '#3b82f6';
      case 'closed': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'open': return 'مفتوحة';
      case 'in_progress': return 'قيد المعالجة';
      case 'resolved': return 'تم الحل';
      case 'closed': return 'مغلقة';
      default: return status;
    }
  };

  const getCategoryIcon = (category) => {
    const cat = CATEGORIES.find(c => c.id === category);
    return cat?.icon || 'help-circle-outline';
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTickets();
  };

  // Loading
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>جاري التحميل...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIcon}>
              <Ionicons name="headset" size={32} color="#60a5fa" />
            </View>
            <Text style={styles.headerTitle}>الدعم الفني</Text>
            <Text style={styles.headerSubtitle}>نحن هنا لمساعدتك</Text>
          </View>

          {/* New Ticket Button */}
          <TouchableOpacity
            style={styles.newTicketBtn}
            onPress={() => setShowNewTicket(true)}
          >
            <Ionicons name="add-circle" size={22} color="#FFF" />
            <Text style={styles.newTicketBtnText}>إنشاء تذكرة جديدة</Text>
          </TouchableOpacity>

          {/* Tickets List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>تذاكري ({tickets.length})</Text>

            {tickets.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={48} color="#4b5563" />
                <Text style={styles.emptyText}>لا توجد تذاكر</Text>
                <Text style={styles.emptySubtext}>أنشئ تذكرة جديدة إذا كان لديك أي استفسار</Text>
              </View>
            ) : (
              tickets.map((ticket) => (
                <TouchableOpacity
                  key={ticket.ticket_id}
                  style={styles.ticketCard}
                  onPress={() => fetchTicketDetail(ticket.ticket_id)}
                >
                  <View style={styles.ticketHeader}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>
                        {getStatusText(ticket.status)}
                      </Text>
                    </View>
                    <Ionicons name={getCategoryIcon(ticket.category)} size={20} color="#60a5fa" />
                  </View>
                  
                  <Text style={styles.ticketSubject}>{ticket.subject}</Text>
                  
                  <View style={styles.ticketFooter}>
                    <Text style={styles.ticketId}>#{ticket.ticket_id}</Text>
                    <Text style={styles.ticketDate}>
                      {new Date(ticket.created_at).toLocaleDateString('ar-SA')}
                    </Text>
                  </View>
                  
                  {ticket.messages?.length > 1 && (
                    <View style={styles.messagesCount}>
                      <Ionicons name="chatbubble-outline" size={12} color="#60a5fa" />
                      <Text style={styles.messagesCountText}>{ticket.messages.length} رسائل</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* New Ticket Modal */}
      <Modal
        visible={showNewTicket}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNewTicket(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowNewTicket(false)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>تذكرة جديدة</Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.modalBody}>
              {/* Category Selection */}
              <Text style={styles.inputLabel}>نوع المشكلة</Text>
              <View style={styles.categoryGrid}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryBtn,
                      newTicket.category === cat.id && styles.categoryBtnActive,
                    ]}
                    onPress={() => setNewTicket({ ...newTicket, category: cat.id })}
                  >
                    <Ionicons
                      name={cat.icon}
                      size={20}
                      color={newTicket.category === cat.id ? '#FFF' : '#60a5fa'}
                    />
                    <Text
                      style={[
                        styles.categoryBtnText,
                        newTicket.category === cat.id && styles.categoryBtnTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Subject */}
              <Text style={styles.inputLabel}>الموضوع</Text>
              <TextInput
                style={styles.input}
                placeholder="موضوع التذكرة"
                placeholderTextColor="#6b7280"
                value={newTicket.subject}
                onChangeText={(text) => setNewTicket({ ...newTicket, subject: text })}
              />

              {/* Message */}
              <Text style={styles.inputLabel}>الرسالة</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="اشرح مشكلتك أو استفسارك بالتفصيل..."
                placeholderTextColor="#6b7280"
                value={newTicket.message}
                onChangeText={(text) => setNewTicket({ ...newTicket, message: text })}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />

              <TouchableOpacity
                style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                onPress={createTicket}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="send" size={18} color="#FFF" />
                    <Text style={styles.submitBtnText}>إرسال التذكرة</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Ticket Detail Modal */}
      <Modal
        visible={showTicketDetail !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTicketDetail(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowTicketDetail(null)}>
                <Ionicons name="close" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>تفاصيل التذكرة</Text>
              {showTicketDetail?.status !== 'closed' && (
                <TouchableOpacity onPress={() => closeTicket(showTicketDetail?.ticket_id)}>
                  <Ionicons name="checkmark-done" size={24} color="#22c55e" />
                </TouchableOpacity>
              )}
            </View>

            {showTicketDetail && (
              <ScrollView style={styles.modalBody}>
                {/* Ticket Info */}
                <View style={styles.ticketInfo}>
                  <View style={styles.ticketInfoRow}>
                    <Text style={styles.ticketInfoValue}>{showTicketDetail.subject}</Text>
                    <Text style={styles.ticketInfoLabel}>الموضوع</Text>
                  </View>
                  <View style={styles.ticketInfoRow}>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(showTicketDetail.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(showTicketDetail.status) }]}>
                        {getStatusText(showTicketDetail.status)}
                      </Text>
                    </View>
                    <Text style={styles.ticketInfoLabel}>الحالة</Text>
                  </View>
                </View>

                {/* Messages */}
                <Text style={styles.messagesTitle}>المحادثة</Text>
                {showTicketDetail.messages?.map((msg, index) => (
                  <View
                    key={index}
                    style={[
                      styles.messageCard,
                      msg.sender === 'user' ? styles.messageUser : styles.messageSupport,
                    ]}
                  >
                    <View style={styles.messageHeader}>
                      <Text style={styles.messageTime}>
                        {new Date(msg.timestamp).toLocaleString('ar-SA')}
                      </Text>
                      <Text style={styles.messageSender}>
                        {msg.sender === 'user' ? 'أنت' : 'الدعم الفني'}
                      </Text>
                    </View>
                    <Text style={styles.messageText}>{msg.message}</Text>
                  </View>
                ))}

                {/* Reply Box */}
                {showTicketDetail.status !== 'closed' && (
                  <View style={styles.replyBox}>
                    <TextInput
                      style={[styles.input, styles.replyInput]}
                      placeholder="اكتب ردك..."
                      placeholderTextColor="#6b7280"
                      value={replyMessage}
                      onChangeText={setReplyMessage}
                      multiline
                    />
                    <TouchableOpacity
                      style={[styles.replyBtn, isSubmitting && styles.submitBtnDisabled]}
                      onPress={() => replyToTicket(showTicketDetail.ticket_id)}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <ActivityIndicator color="#FFF" size="small" />
                      ) : (
                        <Ionicons name="send" size={20} color="#FFF" />
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingTop: 50,
    paddingBottom: 100,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.6)',
    marginTop: 16,
    fontSize: 16,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
  },

  // New Ticket Button
  newTicketBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  newTicketBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Section
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'right',
  },

  // Empty State
  emptyState: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    marginTop: 12,
  },
  emptySubtext: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },

  // Ticket Card
  ticketCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  ticketSubject: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'right',
    marginBottom: 10,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketId: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'monospace',
  },
  ticketDate: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
  },
  messagesCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
    justifyContent: 'flex-end',
  },
  messagesCountText: {
    fontSize: 11,
    color: '#60a5fa',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#111118',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFF',
  },
  modalBody: {
    padding: 16,
  },

  // Form
  inputLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 8,
    textAlign: 'right',
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 14,
    color: '#FFF',
    fontSize: 15,
    textAlign: 'right',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  categoryBtnActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  categoryBtnText: {
    color: '#60a5fa',
    fontSize: 13,
  },
  categoryBtnTextActive: {
    color: '#FFF',
  },
  submitBtn: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
    marginBottom: 32,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Ticket Detail
  ticketInfo: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  ticketInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketInfoLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  ticketInfoValue: {
    fontSize: 14,
    color: '#FFF',
    fontWeight: '500',
    flex: 1,
    textAlign: 'left',
    marginRight: 12,
  },
  messagesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    marginBottom: 12,
    textAlign: 'right',
  },
  messageCard: {
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  messageUser: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    marginLeft: 30,
  },
  messageSupport: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    marginRight: 30,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFF',
  },
  messageTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
  },
  messageText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
    textAlign: 'right',
  },
  replyBox: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    marginBottom: 32,
  },
  replyInput: {
    flex: 1,
    marginBottom: 0,
    minHeight: 50,
  },
  replyBtn: {
    backgroundColor: '#3b82f6',
    width: 50,
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SupportScreen;
