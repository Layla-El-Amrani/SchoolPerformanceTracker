import { Switch, Route } from "wouter";
import NotFound from "@/pages/not-found";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import SchoolsPage from "@/pages/schools-page";
import SubjectsPage from "@/pages/subjects-page";
import ImportPage from "@/pages/import-page";
import ExportPage from "@/pages/export-page";
import { ProtectedRoute } from "./lib/protected-route";
import { useTranslation } from "react-i18next";
import React, { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/hooks/use-auth";

// Create Settings page component
function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { changePasswordMutation, user } = useAuth();
  
  // Initial theme and language values
  const [theme, setThemeState] = useState(() => localStorage.getItem('theme') || 'system');
  const [language, setLanguageState] = useState(() => localStorage.getItem('language') || 'en');
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  
  // Set theme function
  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    
    applyTheme(newTheme);
  };
  
  // Apply theme based on selection
  const applyTheme = (selectedTheme: string) => {
    const root = window.document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const themeToApply = selectedTheme === 'system' ? systemTheme : selectedTheme;
    
    if (themeToApply === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  };
  
  // Set language function
  const setLanguage = (newLanguage: string) => {
    setLanguageState(newLanguage);
    localStorage.setItem('language', newLanguage);
    
    i18n.changeLanguage(newLanguage);
    applyDirection(newLanguage);
  };
  
  // Apply direction based on language
  const applyDirection = (selectedLanguage: string) => {
    const isRtl = selectedLanguage === 'ar';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    
    if (isRtl) {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
  };
  
  // Handle password change
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    if (newPassword !== confirmPassword) {
      setPasswordError(t('settings.password.passwordsDoNotMatch'));
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordError(t('settings.password.passwordTooShort'));
      return;
    }
    
    // Clear error
    setPasswordError(null);
    
    // Submit change
    changePasswordMutation.mutate({
      currentPassword,
      newPassword
    }, {
      onSuccess: () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    });
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">{t('settings.title')}</h1>
      <p className="text-muted-foreground mb-6">{t('settings.subtitle')}</p>
      
      <div className="grid gap-8">
        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">{t('settings.appearance.title')}</h2>
          <div className="grid gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('settings.appearance.theme')}</label>
              <select 
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="light">{t('settings.appearance.light')}</option>
                <option value="dark">{t('settings.appearance.dark')}</option>
                <option value="system">{t('settings.appearance.system')}</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">{t('settings.language.title')}</h2>
          <div className="grid gap-4">
            <div>
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
              >
                <option value="en">{t('settings.language.english')}</option>
                <option value="fr">{t('settings.language.french')}</option>
                <option value="ar">{t('settings.language.arabic')}</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="bg-card border rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">{t('settings.password.title')}</h2>
          <form onSubmit={handlePasswordChange} className="grid gap-4">
            {passwordError && (
              <div className="rounded bg-destructive/15 p-3 text-destructive text-sm">
                {passwordError}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium mb-2">{t('settings.password.current')}</label>
              <input 
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('settings.password.new')}</label>
              <input 
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">{t('settings.password.confirm')}</label>
              <input 
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 border rounded-md bg-background"
                required
              />
            </div>
            <button 
              type="submit"
              className="bg-primary text-white px-4 py-2 rounded mt-2 hover:bg-primary/90 transition-colors"
              disabled={changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending ? t('common.loading') : t('settings.password.changeButton')}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={DashboardPage} />
      <ProtectedRoute path="/schools" component={SchoolsPage} />
      <ProtectedRoute path="/subjects" component={SubjectsPage} />
      <ProtectedRoute path="/import" component={ImportPage} />
      <ProtectedRoute path="/export" component={ExportPage} />
      <ProtectedRoute path="/settings" component={SettingsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const { i18n } = useTranslation();
  
  // Initialize theme and language on first render
  useEffect(() => {
    // Theme initialization
    const savedTheme = localStorage.getItem('theme') || 'system';
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const themeToApply = savedTheme === 'system' ? systemTheme : savedTheme;
    
    if (themeToApply === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Language and direction initialization
    const savedLanguage = localStorage.getItem('language') || 'en';
    i18n.changeLanguage(savedLanguage);
    
    const isRtl = savedLanguage === 'ar';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    
    if (isRtl) {
      document.body.classList.add('rtl');
    } else {
      document.body.classList.remove('rtl');
    }
    
    // Add listener for system theme changes
    const themeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e: MediaQueryListEvent) => {
      if (savedTheme === 'system') {
        document.documentElement.classList.toggle('dark', e.matches);
      }
    };
    
    themeMediaQuery.addEventListener('change', handleThemeChange);
    
    return () => {
      themeMediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, [i18n]);
  
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}

export default App;
