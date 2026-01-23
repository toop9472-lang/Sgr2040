/**
 * Language Switcher Component
 * Toggle between Arabic and English
 */
import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

const LanguageSwitcher = ({ className = '' }) => {
  const { language, toggleLanguage } = useLanguage();
  
  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 transition-all ${className}`}
      title={language === 'ar' ? 'Switch to English' : 'التحويل للعربية'}
      data-testid="language-switcher"
    >
      <span className="text-lg">
        {language === 'ar' ? '🇬🇧' : '🇸🇦'}
      </span>
      <span className="text-sm font-medium text-white">
        {language === 'ar' ? 'EN' : 'عربي'}
      </span>
    </button>
  );
};

export default LanguageSwitcher;
