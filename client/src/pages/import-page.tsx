import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { AcademicYear, Term } from "@/types";
import { FileUploader } from "@/components/import/file-uploader";
import { RecentFiles } from "@/components/import/recent-files";
import { Loader2 } from "lucide-react";

export default function ImportPage() {
  const { t } = useTranslation();
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [selectedTermId, setSelectedTermId] = useState<string>("all");
  
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
        setSelectedYearId(activeYear.id);
      } else {
        setSelectedYearId(academicYears[0].id);
      }
    }
  }, [academicYears, selectedYearId]);
  
  const isLoading = yearsLoading || !selectedYearId;
  const parsedTermId = selectedTermId === "all" ? undefined : parseInt(selectedTermId);
  
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <Header 
          onYearChange={setSelectedYearId}
          onTermChange={setSelectedTermId}
          selectedYearId={selectedYearId}
          selectedTermId={selectedTermId}
        />
        
        <section className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground">{t('import.title')}</h1>
            <p className="text-muted-foreground">{t('import.subtitle')}</p>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-80">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-foreground mb-4">{t('import.uploadTitle')}</h3>
              <p className="text-muted-foreground mb-2">
                {t('import.uploadDescription')}
              </p>
              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-4 rounded-md border border-yellow-300 dark:border-yellow-800 mb-6">
                <h4 className="text-yellow-800 dark:text-yellow-400 font-medium mb-2">
                  {t('import.yearSelectionWarning')}
                </h4>
                
                <div className="flex flex-col md:flex-row gap-4 mb-2">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-yellow-800 dark:text-yellow-400 mb-1">
                      {t('import.academicYear')}
                    </label>
                    <select 
                      className="w-full rounded-md border border-yellow-400 dark:border-yellow-700 bg-white dark:bg-yellow-900/50 text-foreground p-2 text-sm"
                      value={selectedYearId || ""}
                      onChange={(e) => setSelectedYearId(parseInt(e.target.value))}
                    >
                      {academicYears?.map((year) => (
                        <option key={year.id} value={year.id}>{year.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-yellow-800 dark:text-yellow-400 mb-1">
                      {t('import.term')}
                    </label>
                    <select 
                      className="w-full rounded-md border border-yellow-400 dark:border-yellow-700 bg-white dark:bg-yellow-900/50 text-foreground p-2 text-sm"
                      value={selectedTermId}
                      onChange={(e) => setSelectedTermId(e.target.value)}
                    >
                      <option value="all">{t('common.allTerms')}</option>
                      {terms?.map((term) => (
                        <option key={term.id} value={term.id}>{term.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="flex-1">
                  <label className="block text-sm font-medium text-yellow-800 dark:text-yellow-400 mb-1">
                    {t('import.customYear')}
                  </label>
                  <input 
                    type="text" 
                    className="w-full rounded-md border border-yellow-400 dark:border-yellow-700 bg-white dark:bg-yellow-900/50 text-foreground p-2 text-sm"
                    placeholder={t('import.customYearPlaceholder')}
                    onChange={(e) => {
                      // Si l'année existe déjà, sélectionnez-la
                      const yearName = e.target.value.trim();
                      const existingYear = academicYears?.find(y => y.name === yearName);
                      if (existingYear) {
                        setSelectedYearId(existingYear.id);
                      }
                      // Sinon, nous utiliserons cette valeur pour créer une nouvelle année
                    }}
                  />
                </div>
              </div>
              
              <FileUploader 
                academicYearId={selectedYearId}
                termId={parsedTermId}
              />
              
              <RecentFiles />
            </Card>
          )}
        </section>
      </main>
    </div>
  );
}
