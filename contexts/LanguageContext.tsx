import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { translations } from '../translations';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: keyof typeof translations['en']) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('appLanguage');
    return (saved === 'en' || saved === 'ar') ? saved : 'en';
  });

  const toggleLanguage = () => {
    setLanguage(prev => {
      const newLang = prev === 'en' ? 'ar' : 'en';
      localStorage.setItem('appLanguage', newLang);
      return newLang;
    });
  };

  const t = (key: keyof typeof translations['en']) => {
    return translations[language][key] || key;
  };

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t, isRTL }}>
      <div dir={isRTL ? 'rtl' : 'ltr'} className={isRTL ? 'font-arabic' : ''}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};