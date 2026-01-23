import React from 'react';
import { Home, User, PlusCircle, Globe, Bell } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const BottomNav = ({ currentPage, onNavigate }) => {
  const { t, language, toggleLanguage, isRTL } = useLanguage();

  const navItems = [
    { id: 'home', label: t('home'), icon: Home },
    { id: 'notifications', label: t('notifications'), icon: Bell },
    { id: 'advertiser', label: t('advertiseNow'), icon: PlusCircle },
    { id: 'profile', label: t('profile'), icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all ${
                isActive
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              data-testid={`nav-${item.id}`}
            >
              <Icon size={item.id === 'advertiser' ? 26 : 22} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
              <span className={`text-[10px] ${ isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
        
        {/* Language Toggle Button */}
        <button
          onClick={toggleLanguage}
          className="flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-all text-gray-500 hover:text-gray-700"
          data-testid="nav-language"
          title={language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
        >
          <Globe size={22} className="stroke-2" />
          <span className="text-[10px] font-medium">
            {language === 'ar' ? 'EN' : 'عربي'}
          </span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;
