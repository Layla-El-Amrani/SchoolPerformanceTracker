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
              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-3 rounded-md border border-yellow-300 dark:border-yellow-800 mb-6">
                <p className="text-yellow-800 dark:text-yellow-400 text-sm font-medium">
                  {t('import.yearSelectionWarning')}
                </p>
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
