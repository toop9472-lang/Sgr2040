import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, X } from 'lucide-react';
import AIChatModal from './AIChatModal';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AIFloatingButton = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAvailable, setIsAvailable] = useState(false);
  const [showPulse, setShowPulse] = useState(true);

  useEffect(() => {
    checkAIStatus();
    
    // Stop pulse animation after 10 seconds
    const timer = setTimeout(() => setShowPulse(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  const checkAIStatus = async () => {
    try {
      const response = await fetch(`${API_URL}/api/claude-ai/public/status`);
      const data = await response.json();
      setIsAvailable(data.available && data.available_for_all);
    } catch (error) {
      setIsAvailable(false);
    }
  };

  // Don't show if AI is not available
  if (!isAvailable) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 left-4 z-50 group"
        data-testid="ai-floating-btn"
      >
        <div className="relative">
          {/* Pulse effect */}
          {showPulse && (
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#6366f1] animate-ping opacity-75" />
          )}
          
          {/* Button */}
          <div className="relative w-14 h-14 rounded-full bg-gradient-to-r from-[#3b82f6] to-[#6366f1] shadow-lg shadow-[#3b82f6]/30 flex items-center justify-center hover:scale-110 transition-transform duration-200">
            <Bot className="w-7 h-7 text-white" />
            
            {/* Sparkle decoration */}
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#60a5fa] flex items-center justify-center animate-bounce">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>
          
          {/* Tooltip */}
          <div className="absolute left-16 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="bg-[#111118] border border-white/10 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-lg">
              اسألني أي شيء!
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-8 border-transparent border-r-[#111118]" />
            </div>
          </div>
        </div>
      </button>

      {/* Chat Modal */}
      <AIChatModal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        user={user}
      />
    </>
  );
};

export default AIFloatingButton;
