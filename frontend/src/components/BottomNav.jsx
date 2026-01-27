import React from 'react';
import { Home, User, PlusCircle, Play } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

const BottomNav = ({ currentPage, onNavigate }) => {
  const { t } = useLanguage();

  // أيقونات التنقل الأساسية فقط: الرئيسية، المعلن، الملف الشخصي، الإعلانات
  const navItems = [
    { id: 'home', label: t('home'), icon: Home },
    { id: 'advertiser', label: t('advertiseNow'), icon: PlusCircle },
    { id: 'profile', label: t('profile'), icon: User },
    { id: 'ads', label: 'إعلانات', icon: Play, highlight: true },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40">
      <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-xl transition-all duration-200 ${
                item.highlight 
                  ? 'text-white bg-gradient-to-r from-red-500 to-pink-500 shadow-lg hover:shadow-xl transform hover:scale-105' 
                  : isActive
                    ? 'text-indigo-600 bg-indigo-50'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
              data-testid={`nav-${item.id}`}
            >
              <Icon size={item.highlight ? 24 : 22} className={isActive || item.highlight ? 'stroke-[2.5]' : 'stroke-2'} />
              <span className={`text-[10px] ${isActive || item.highlight ? 'font-semibold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
