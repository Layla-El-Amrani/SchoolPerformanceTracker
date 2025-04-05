import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { KeyMetrics } from "@/components/dashboard/key-metrics";
import { PerformanceTrends } from "@/components/dashboard/performance-trends";
import { SchoolRankings } from "@/components/dashboard/school-rankings";
import { SubjectPerformanceTable } from "@/components/dashboard/subject-performance";
import { DetailedAnalysis } from "@/components/dashboard/detailed-analysis";
import { SchoolPerformanceSummary, StudentPerformance } from "@/types";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function DashboardPage() {
  const { t } = useTranslation();
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [selectedTermId, setSelectedTermId] = useState<string>("all");
  
  // Fetch school performance summaries
  const { 
    data: schoolSummaries,
    isLoading: summariesLoading
  } = useQuery<SchoolPerformanceSummary[]>({
    queryKey: ["/api/school-performance", { academicYearId: selectedYearId, termId: selectedTermId === "all" ? undefined : selectedTermId }],
    enabled: !!selectedYearId,
  });
  
  // Fetch all subjects first
  const {
    data: subjects,
    isLoading: subjectsListLoading
  } = useQuery<any[]>({
    queryKey: ["/api/subjects"],
  });
  
  // Fetch performances for each subject and combine them
  const subjectQueries = useQuery<StudentPerformance[]>({
    queryKey: ["/api/all-performances", { academicYearId: selectedYearId, termId: selectedTermId === "all" ? undefined : selectedTermId }],
    queryFn: async () => {
      if (!subjects || !selectedYearId) return [];
      
      // Fetch performances for each subject
      const allPerformances: StudentPerformance[] = [];
      
      for (const subject of subjects) {
        const response = await fetch(`/api/student-performances?subjectId=${subject.id}&academicYearId=${selectedYearId}${
          selectedTermId !== "all" ? `&termId=${selectedTermId}` : ""
        }`);
        
        if (response.ok) {
          const performances = await response.json();
          allPerformances.push(...performances);
        }
      }
      
      return allPerformances;
    },
    enabled: !!subjects && !!selectedYearId,
  });
  
  const subjectPerformances = subjectQueries.data;
  const subjectsLoading = subjectsListLoading || subjectQueries.isLoading;
  
  const isLoading = summariesLoading || subjectsLoading || !selectedYearId;
  
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
            <h1 className="text-2xl font-bold text-foreground">{t('dashboard.title')}</h1>
            <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-80">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              <KeyMetrics summaries={schoolSummaries} />
              
              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Performance Trends */}
                <PerformanceTrends 
                  performances={subjectPerformances}
                  academicYearId={selectedYearId}
                  termId={selectedTermId === "all" ? undefined : parseInt(selectedTermId)}
                />
                
                {/* School Rankings */}
                <SchoolRankings 
                  summaries={schoolSummaries}
                />
              </div>
              
              {/* Subject Performance */}
              <SubjectPerformanceTable 
                performances={subjectPerformances} 
              />
              
              {/* Detailed Analysis Section */}
              <div className="mt-8">
                <DetailedAnalysis 
                  performances={subjectPerformances}
                  summaries={schoolSummaries}
                  academicYearId={selectedYearId}
                  termId={selectedTermId === "all" ? undefined : parseInt(selectedTermId)}
                />
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
