import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { Search, Filter } from "lucide-react";
import { Subject, StudentPerformance } from "@/types";
import { Loader2 } from "lucide-react";
import { barColorsBySubject } from "@/lib/chart-config";

export default function SubjectsPage() {
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [selectedTermId, setSelectedTermId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch subjects
  const { data: subjects, isLoading: subjectsLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });
  
  // Fetch performances
  const { 
    data: performances,
    isLoading: performancesLoading
  } = useQuery<StudentPerformance[]>({
    queryKey: ["/api/student-performances", { academicYearId: selectedYearId, termId: selectedTermId === "all" ? undefined : selectedTermId }],
    enabled: !!selectedYearId,
  });
  
  const isLoading = subjectsLoading || performancesLoading || !selectedYearId;
  
  // Process and aggregate subject performance data
  const getSubjectPerformanceData = () => {
    if (!subjects || !performances) return [];
    
    // Group performances by subject
    const subjectGroups: Record<number, StudentPerformance[]> = {};
    
    performances.forEach(perf => {
      if (!subjectGroups[perf.subjectId]) {
        subjectGroups[perf.subjectId] = [];
      }
      subjectGroups[perf.subjectId].push(perf);
    });
    
    // For each subject, calculate averages
    return subjects
      .filter(subject => 
        subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (subject.code && subject.code.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .map(subject => {
        const subjectPerfs = subjectGroups[subject.id] || [];
        
        let averageScore = 0;
        let passRate = 0;
        let attendanceRate = 0;
        
        if (subjectPerfs.length > 0) {
          averageScore = Math.round(
            subjectPerfs.reduce((sum, perf) => sum + perf.averageScore, 0) / subjectPerfs.length
          );
          
          passRate = Math.round(
            subjectPerfs.reduce((sum, perf) => sum + perf.passRate, 0) / subjectPerfs.length
          );
          
          const perfsWithAttendance = subjectPerfs.filter(p => p.attendanceRate !== undefined);
          if (perfsWithAttendance.length > 0) {
            attendanceRate = Math.round(
              perfsWithAttendance.reduce((sum, p) => sum + (p.attendanceRate || 0), 0) / perfsWithAttendance.length
            );
          }
        }
        
        return {
          id: subject.id,
          name: subject.name,
          code: subject.code,
          averageScore,
          passRate,
          attendanceRate,
          hasData: subjectPerfs.length > 0
        };
      })
      .filter(subject => searchQuery === "" || subject.hasData);
  };
  
  const subjectData = getSubjectPerformanceData();
  
  // Prepare chart data for different visualizations
  const barChartData = subjectData
    .filter(subject => subject.hasData)
    .map(subject => ({
      name: subject.name,
      average: subject.averageScore,
      passRate: subject.passRate
    }));
  
  const pieChartData = subjectData
    .filter(subject => subject.hasData)
    .map(subject => ({
      name: subject.name,
      value: subject.averageScore
    }));
  
  // Distribution data for score ranges
  const calculateDistribution = () => {
    const ranges = [
      { name: "90-100%", range: [90, 100], count: 0 },
      { name: "80-89%", range: [80, 89], count: 0 },
      { name: "70-79%", range: [70, 79], count: 0 },
      { name: "60-69%", range: [60, 69], count: 0 },
      { name: "Below 60%", range: [0, 59], count: 0 },
    ];
    
    subjectData.forEach(subject => {
      if (!subject.hasData) return;
      
      const score = subject.averageScore;
      const matchingRange = ranges.find(
        r => score >= r.range[0] && score <= r.range[1]
      );
      
      if (matchingRange) {
        matchingRange.count++;
      }
    });
    
    return ranges.filter(r => r.count > 0);
  };
  
  const distributionData = calculateDistribution();
  
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
            <h1 className="text-2xl font-bold text-foreground">Subject Performance</h1>
            <p className="text-muted-foreground">Analyze performance across different academic subjects</p>
          </div>
          
          {/* Search and filter */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search subjects..." 
                className="pl-9"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center h-80">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          ) : (
            <Tabs defaultValue="bar">
              <TabsList className="mb-6">
                <TabsTrigger value="bar">Bar Chart</TabsTrigger>
                <TabsTrigger value="pie">Pie Chart</TabsTrigger>
                <TabsTrigger value="distribution">Score Distribution</TabsTrigger>
              </TabsList>
              
              <TabsContent value="bar">
                <Card>
                  <CardContent className="pt-6">
                    {barChartData.length > 0 ? (
                      <div className="h-[500px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={barChartData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="name" 
                              angle={-45} 
                              textAnchor="end" 
                              height={70}
                            />
                            <YAxis 
                              label={{ 
                                value: 'Percentage (%)', 
                                angle: -90, 
                                position: 'insideLeft',
                                style: { textAnchor: 'middle' }
                              }}
                            />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="average" name="Average Score" fill="#1565C0" />
                            <Bar dataKey="passRate" name="Pass Rate" fill="#2E7D32" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        No subject performance data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="pie">
                <Card>
                  <CardContent className="pt-6">
                    {pieChartData.length > 0 ? (
                      <div className="h-[500px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={pieChartData}
                              cx="50%"
                              cy="50%"
                              labelLine={true}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={160}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {pieChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={barColorsBySubject[index % barColorsBySubject.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => `${value}%`} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        No subject performance data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="distribution">
                <Card>
                  <CardContent className="pt-6">
                    {distributionData.length > 0 ? (
                      <div className="h-[500px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={distributionData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                            layout="vertical"
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis 
                              dataKey="name" 
                              type="category" 
                              width={100}
                            />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="count" name="Number of Subjects" fill="#FF6D00" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        No subject performance data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </section>
      </main>
    </div>
  );
}
