import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type Theme = 'light' | 'dark' | 'system';
type Language = 'en' | 'fr' | 'ar';

interface SettingsContextType {
  theme: Theme;
  language: Language;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  isRtl: boolean;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { i18n } = useTranslation();
  const [theme, setThemeState] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    return savedTheme || 'system';
  });
  
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem('language') as Language;
    return savedLanguage || 'en';
  });

  const isRtl = language === 'ar';

  useEffect(() => {
    const applyTheme = () => {
      const root = window.document.documentElement;
      
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
        
      const themeToApply = theme === 'system' ? systemTheme : theme;
      
      if (themeToApply === 'dark') {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);
    
    return () => {
      window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', applyTheme);
    };
  }, [theme]);

  useEffect(() => {
    i18n.changeLanguage(language);
    
    // Set the direction based on language
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    
    localStorage.setItem('language', language);
  }, [language, i18n, isRtl]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
  };

  return (
    <SettingsContext.Provider
      value={{
        theme,
        language,
        setTheme,
        setLanguage,
        isRtl
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}