import React from 'react';
import { Home, User, Megaphone, PlayCircle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const BottomNav = ({ currentPage, onNavigate }) => {
  const { t } = useLanguage();

  const navItems = [
    { id: 'home', label: t('home'), icon: Home },
    { id: 'advertiser', label: t('advertiseNow'), icon: Megaphone },
    { id: 'profile', label: t('profile'), icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0f]/98 backdrop-blur-xl border-t border-white/10 z-40">
      <div className="flex items-center justify-around px-2 py-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-all duration-200 min-w-[50px] ${
                isActive
                  ? 'text-[#60a5fa]'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
              data-testid={`nav-${item.id}`}
            >
              <Icon size={22} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
              <span className={`text-[10px] ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
        
        {/* Watch Button */}
        <button
          onClick={() => onNavigate('ads')}
          className="flex items-center gap-1 bg-[#ef4444] hover:bg-[#dc2626] px-3.5 py-1.5 rounded-2xl transition-colors"
          data-testid="nav-watch-ads"
        >
          <PlayCircle size={18} className="text-white" />
          <span className="text-white text-xs font-semibold">شاهد</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;
