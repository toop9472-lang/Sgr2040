import React from 'react';
import { Home, User, Megaphone, Play } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const BottomNav = ({ currentPage, onNavigate }) => {
  const { t } = useLanguage();

  const navItems = [
    { id: 'home', label: t('home'), icon: Home },
    { id: 'advertiser', label: t('advertiseNow'), icon: Megaphone },
    { id: 'profile', label: t('profile'), icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-200/80 z-40 shadow-lg">
      <div className="flex items-center justify-around px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-0.5 py-1.5 px-4 rounded-lg transition-all duration-200 min-w-[56px] ${
                isActive
                  ? 'text-black scale-105'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              data-testid={`nav-${item.id}`}
            >
              <Icon 
                size={26} 
                className={`transition-transform ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} 
                fill={isActive ? 'currentColor' : 'none'}
              />
              <span className={`text-[11px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
        
        {/* زر المشاهدة - TikTok Style */}
        <button
          onClick={() => onNavigate('ads')}
          className="flex items-center justify-center mx-1 group"
          data-testid="nav-watch-ads"
        >
          <div className="relative flex items-center">
            {/* Left colored bar */}
            <div className="w-5 h-7 bg-[#25f4ee] rounded-l-md -mr-2 transition-transform group-hover:scale-105" />
            
            {/* Center button */}
            <div className="w-10 h-7 bg-white rounded-md flex items-center justify-center z-10 border border-gray-200 shadow-sm transition-transform group-hover:scale-105">
              <Play size={18} className="text-black fill-black" />
            </div>
            
            {/* Right colored bar */}
            <div className="w-5 h-7 bg-[#fe2c55] rounded-r-md -ml-2 transition-transform group-hover:scale-105" />
          </div>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;
