import React from 'react';
import { Home, User, PlusCircle } from 'lucide-react';

const BottomNav = ({ currentPage, onNavigate }) => {
  const navItems = [
    { id: 'home', label: 'الرئيسية', icon: Home },
    { id: 'advertiser', label: 'أضف إعلانك', icon: PlusCircle },
    { id: 'profile', label: 'الملف', icon: User },
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
              className={`flex flex-col items-center gap-1 py-2 px-4 rounded-lg transition-all ${
                isActive
                  ? 'text-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon size={item.id === 'advertiser' ? 26 : 24} className={isActive ? 'stroke-[2.5]' : 'stroke-2'} />
              <span className={`text-xs ${ isActive ? 'font-semibold' : 'font-medium'}`}>
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