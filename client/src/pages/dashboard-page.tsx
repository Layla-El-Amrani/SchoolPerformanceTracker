import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { KeyMetrics } from "@/components/dashboard/key-metrics";
import { PerformanceTrends } from "@/components/dashboard/performance-trends";
import { SchoolRankings } from "@/components/dashboard/school-rankings";
import { SubjectPerformanceTable } from "@/components/dashboard/subject-performance";
import { SchoolPerformanceSummary, StudentPerformance } from "@/types";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
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
  
  // Fetch subject performances
  const {
    data: subjectPerformances,
    isLoading: subjectsLoading
  } = useQuery<StudentPerformance[]>({
    queryKey: ["/api/student-performances", { academicYearId: selectedYearId, termId: selectedTermId === "all" ? undefined : selectedTermId }],
    enabled: !!selectedYearId,
  });
  
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
            <h1 className="text-2xl font-bold text-foreground">Academic Performance Dashboard</h1>
            <p className="text-muted-foreground">Provincial overview of student performance metrics</p>
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
            </>
          )}
        </section>
      </main>
    </div>
  );
}
