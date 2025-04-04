import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Bell, HelpCircle, Sun, Moon, LanguagesIcon } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AcademicYear, Term } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onYearChange: (yearId: number) => void;
  onTermChange: (termId: string) => void;
  selectedYearId: number | null;
  selectedTermId: string;
}

export function Header({ 
  onYearChange, 
  onTermChange, 
  selectedYearId, 
  selectedTermId 
}: HeaderProps) {
  const { t, i18n } = useTranslation();
  
  // Fetch academic years
  const { data: academicYears, isLoading: yearsLoading } = useQuery<AcademicYear[]>({
    queryKey: ["/api/academic-years"],
  });
  
  // Fetch terms based on selected year
  const { data: terms, isLoading: termsLoading } = useQuery<Term[]>({
    queryKey: ["/api/terms", selectedYearId],
    enabled: !!selectedYearId,
  });
  
  // Set default year (active year) on initial load
  useEffect(() => {
    if (academicYears && academicYears.length > 0 && !selectedYearId) {
      const activeYear = academicYears.find(year => year.active);
      if (activeYear) {
        onYearChange(activeYear.id);
      } else {
        onYearChange(academicYears[0].id);
      }
    }
  }, [academicYears, selectedYearId, onYearChange]);
  
  const handleYearChange = (yearId: string) => {
    onYearChange(parseInt(yearId));
  };
  
  const handleTermChange = (termId: string) => {
    onTermChange(termId);
  };
  
  return (
    <header className="bg-card shadow-sm sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center space-x-4">
          {/* Year Selector */}
          <div className="relative">
            <Select
              disabled={yearsLoading}
              value={selectedYearId?.toString() || ""}
              onValueChange={handleYearChange}
            >
              <SelectTrigger className="min-w-[200px]">
                <SelectValue placeholder={yearsLoading ? t('common.loading') : t('dashboard.filters.selectYear')} />
              </SelectTrigger>
              <SelectContent>
                {academicYears?.map((year) => (
                  <SelectItem key={year.id} value={year.id.toString()}>
                    {year.name}{year.active ? ` (${t('dashboard.filters.current')})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Term Selector */}
          <div className="relative">
            <Select
              disabled={termsLoading || !selectedYearId}
              value={selectedTermId}
              onValueChange={handleTermChange}
            >
              <SelectTrigger className="min-w-[150px]">
                <SelectValue placeholder={termsLoading ? t('common.loading') : t('dashboard.filters.selectTerm')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('dashboard.filters.allTerms')}</SelectItem>
                {terms?.map((term) => (
                  <SelectItem key={term.id} value={term.id.toString()}>
                    {term.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Theme Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                const settingsEvent = new CustomEvent('theme-change', { detail: 'light' });
                window.dispatchEvent(settingsEvent);
              }}>
                <Sun className="mr-2 h-4 w-4" />
                <span>{t('settings.appearance.light')}</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const settingsEvent = new CustomEvent('theme-change', { detail: 'dark' });
                window.dispatchEvent(settingsEvent);
              }}>
                <Moon className="mr-2 h-4 w-4" />
                <span>{t('settings.appearance.dark')}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* Language Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <LanguagesIcon className="h-5 w-5 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                const settingsEvent = new CustomEvent('language-change', { detail: 'en' });
                window.dispatchEvent(settingsEvent);
              }}>
                {t('settings.language.english')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const settingsEvent = new CustomEvent('language-change', { detail: 'fr' });
                window.dispatchEvent(settingsEvent);
              }}>
                {t('settings.language.french')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                const settingsEvent = new CustomEvent('language-change', { detail: 'ar' });
                window.dispatchEvent(settingsEvent);
              }}>
                {t('settings.language.arabic')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button variant="ghost" size="icon">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </header>
  );
}
