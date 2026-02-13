import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User, Loader2, Sparkles, Mic, MicOff } from 'lucide-react';
import { Button } from './ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AIChatModal = ({ isOpen, onClose, user }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'مرحباً! أنا مساعدك الذكي في صقر. كيف يمكنني مساعدتك اليوم؟\n\nيمكنني مساعدتك في:\n• معرفة رصيد نقاطك\n• شرح كيفية كسب النقاط\n• طرق السحب المتاحة\n• أي استفسار آخر!'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    checkAIStatus();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const checkAIStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/claude-ai/public/status`);
      const data = await response.json();
      setIsAvailable(data.available && data.available_for_all);
    } catch (error) {
      setIsAvailable(false);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');
    
    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Build context about user
      const userContext = user ? `المستخدم لديه ${user.points || 0} نقطة. اسمه: ${user.name || 'مستخدم'}` : '';
      
      // Get the correct token
      const token = localStorage.getItem('user_token') || localStorage.getItem('token') || localStorage.getItem('saqr_token') || '';
      const isGuest = !token || user?.isGuest;
      
      // Prepare messages for API
      const chatMessages = messages.map(m => ({
        role: m.role,
        content: m.content
      }));
      chatMessages.push({ role: 'user', content: userMessage });

      // Use guest endpoint for users without token
      const endpoint = isGuest 
        ? `${API_URL}/api/claude-ai/chat/guest`
        : `${API_URL}/api/claude-ai/chat`;
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Only add Authorization header if we have a token
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          messages: chatMessages.slice(-10), // Keep last 10 messages for context
          system_message: `أنت مساعد ذكي ودود في تطبيق صقر للإعلانات. ${userContext}

قواعد مهمة:
- أجب بالعربية دائماً
- كن مختصراً ومفيداً
- ساعد المستخدم في فهم كيفية كسب النقاط (1 نقطة لكل دقيقة مشاهدة)
- اشرح أن 500 نقطة = 1 دولار
- طرق السحب: PayPal, STC Pay, تحويل بنكي
- كن إيجابياً وشجع المستخدم`
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        // Show specific error message
        let errorMsg = 'عذراً، حدث خطأ. ';
        if (data.error?.includes('not configured')) {
          errorMsg += 'المساعد الذكي غير مفعّل حالياً. يرجى التواصل مع الدعم.';
        } else if (data.error?.includes('Access denied')) {
          errorMsg += 'يرجى تسجيل الدخول للاستخدام.';
        } else {
          errorMsg += 'يرجى المحاولة مرة أخرى. 🙏';
        }
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: errorMsg
        }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      // More specific error message
      let errorMsg = 'عذراً، ';
      if (!navigator.onLine) {
        errorMsg += 'لا يوجد اتصال بالإنترنت. تأكد من اتصالك وحاول مرة أخرى.';
      } else {
        errorMsg += 'حدث خطأ في الاتصال بالخادم. يرجى المحاولة مرة أخرى.';
      }
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: errorMsg
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickQuestions = [
    'كيف أكسب النقاط؟',
    'كم نقطة أحتاج للسحب؟',
    'ما طرق السحب المتاحة؟',
    'كم رصيدي الحالي؟'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md h-[85vh] sm:h-[600px] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-white font-bold">مساعد صقر الذكي</h3>
              <p className="text-white/70 text-xs">مدعوم بـ Claude AI</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {isAvailable === false && (
            <div className="bg-orange-100 border border-orange-300 rounded-xl p-4 text-center">
              <p className="text-orange-700 text-sm">
                المساعد الذكي غير متاح حالياً. سيتم تفعيله قريباً!
              </p>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div 
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start gap-2 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === 'user' 
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-500' 
                    : 'bg-gradient-to-br from-emerald-400 to-teal-500'
                }`}>
                  {message.role === 'user' 
                    ? <User className="w-4 h-4 text-white" />
                    : <Sparkles className="w-4 h-4 text-white" />
                  }
                </div>
                <div className={`rounded-2xl px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-br-md'
                    : 'bg-white shadow-md text-gray-800 rounded-bl-md'
                }`}>
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-md">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span className="text-sm text-gray-500">جاري الكتابة...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length <= 2 && (
          <div className="px-4 py-2 bg-white border-t flex gap-2 overflow-x-auto">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => setInputValue(q)}
                className="flex-shrink-0 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-medium hover:bg-indigo-100 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-4 bg-white border-t">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="اكتب سؤالك هنا..."
              className="flex-1 px-4 py-3 rounded-full bg-gray-100 border-0 focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              dir="rtl"
              disabled={isLoading || isAvailable === false}
            />
            <Button
              onClick={sendMessage}
              disabled={!inputValue.trim() || isLoading || isAvailable === false}
              className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 p-0"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default AIChatModal;
