// AI Support Page - صفحة الدعم الفني بالذكاء الاصطناعي
import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { GlowCard, FloatingParticles, PageTransition } from './PremiumAnimations';
import { Bot } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL || '';

const SupportPage = ({ user, isRTL = true }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'مرحباً بك في مركز الدعم!\n\nأنا مساعدك الذكي، كيف يمكنني مساعدتك اليوم؟',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Quick action buttons
  const quickActions = [
    { icon: 'help', text: 'كيف أربح نقاط؟', query: 'كيف يمكنني ربح النقاط من التطبيق؟' },
    { icon: 'wallet', text: 'كيف أسحب أرباحي؟', query: 'كيف يمكنني سحب أرباحي من التطبيق؟' },
    { icon: 'phone', text: 'مشكلة تقنية', query: 'أواجه مشكلة تقنية في التطبيق' },
    { icon: 'target', text: 'الإعلانات لا تظهر', query: 'الإعلانات لا تظهر لدي، ما الحل؟' },
    { icon: 'user', text: 'مشكلة في حسابي', query: 'أواجه مشكلة في حسابي' },
    { icon: 'chart', text: 'كيف أصبح معلن؟', query: 'كيف يمكنني الإعلان في التطبيق؟' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const endpoint = user?.token 
        ? `${API_URL}/api/claude-ai/chat`
        : `${API_URL}/api/claude-ai/chat/guest`;
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (user?.token) {
        headers['Authorization'] = `Bearer ${user.token}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      const data = await response.json();

      if (data.success && data.response) {
        const aiMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error('No response from AI');
      }
    } catch (error) {
      console.error('AI Error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.',
        timestamp: new Date(),
        isError: true
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (query) => {
    sendMessage(query);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#0a0a0f] text-white p-4 md:p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <FloatingParticles count={15} color="#FFD700" />
        
        <div className="max-w-4xl mx-auto relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-[#FFD700]/20 to-[#FFD700]/5 border border-[#FFD700]/30 mb-4">
              <span className="text-4xl">🤖</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
              مركز الدعم الذكي
            </h1>
            <p className="text-gray-400 mt-2">نحن هنا لمساعدتك على مدار الساعة</p>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <p className="text-sm text-gray-400 mb-3">أسئلة شائعة:</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, index) => (
                <motion.button
                  key={index}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleQuickAction(action.query)}
                  className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1a2e]/80 border border-white/10 hover:border-[#FFD700]/30 hover:bg-[#FFD700]/10 transition-all text-sm"
                >
                  <span>{action.icon}</span>
                  <span>{action.text}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Chat Container */}
          <GlowCard className="mb-4">
            <div className="h-[400px] md:h-[500px] flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black'
                            : message.isError
                            ? 'bg-red-500/20 border border-red-500/30 text-red-300'
                            : 'bg-[#1a1a2e] border border-white/10'
                        }`}
                      >
                        {message.role === 'assistant' && !message.isError && (
                          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                            <span className="text-lg">🤖</span>
                            <span className="text-xs text-[#FFD700]">المساعد الذكي</span>
                          </div>
                        )}
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {message.content}
                        </p>
                        <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-black/50' : 'text-gray-500'}`}>
                          {message.timestamp.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Loading indicator */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-5 h-5 border-2 border-[#FFD700] border-t-transparent rounded-full"
                        />
                        <span className="text-sm text-gray-400">جاري الكتابة...</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="p-4 border-t border-white/10">
                <div className="flex gap-3">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="اكتب رسالتك هنا..."
                    disabled={isLoading}
                    className="flex-1 bg-[#1a1a2e] border border-white/10 rounded-full px-5 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#FFD700]/50 transition-colors"
                  />
                  <motion.button
                    type="submit"
                    disabled={isLoading || !inputValue.trim()}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-12 h-12 rounded-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5 text-black rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </motion.button>
                </div>
              </form>
            </div>
          </GlowCard>

          {/* Contact Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-sm text-gray-500"
          >
            <p>للمساعدة الفورية، يمكنك أيضاً التواصل معنا عبر:</p>
            <div className="flex items-center justify-center gap-4 mt-2">
              <span>📧 support@saqr.app</span>
              <span>•</span>
              <span>🐦 @SaqrApp</span>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default SupportPage;
