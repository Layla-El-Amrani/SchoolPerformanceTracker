import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";
import { Search, Filter, ArrowUpDown } from "lucide-react";
import { School, SchoolPerformanceSummary } from "@/types";
import { getColorByScore } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export default function SchoolsPage() {
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [selectedTermId, setSelectedTermId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch schools
  const { data: schools, isLoading: schoolsLoading } = useQuery<School[]>({
    queryKey: ["/api/schools"],
  });
  
  // Fetch school performance summaries
  const { 
    data: schoolSummaries,
    isLoading: summariesLoading
  } = useQuery<SchoolPerformanceSummary[]>({
    queryKey: ["/api/school-performance", { academicYearId: selectedYearId, termId: selectedTermId === "all" ? undefined : selectedTermId }],
    enabled: !!selectedYearId,
  });
  
  const isLoading = schoolsLoading || summariesLoading || !selectedYearId;
  
  // Combine schools with their performance data
  const schoolsWithPerformance = !isLoading 
    ? schools?.map(school => {
        const performance = schoolSummaries?.find(s => s.schoolId === school.id);
        return {
          ...school,
          performance: performance || null
        };
      }) || []
    : [];
  
  // Filter schools by search query
  const filteredSchools = schoolsWithPerformance.filter(school => 
    school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (school.location && school.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  
  // Prepare chart data
  const chartData = filteredSchools
    .filter(school => school.performance)
    .map(school => ({
      name: school.name,
      average: school.performance?.overallAverage || 0,
      success: school.performance?.successRate || 0,
      attendance: school.performance?.attendanceRate || 0
    }))
    .slice(0, 10); // Limit to top 10 for better visualization
  
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
            <h1 className="text-2xl font-bold text-foreground">School Analysis</h1>
            <p className="text-muted-foreground">Compare performance metrics across different schools</p>
          </div>
          
          {/* Search and filter */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="relative flex-1 min-w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search schools..." 
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
            <Tabs defaultValue="table">
              <TabsList className="mb-6">
                <TabsTrigger value="table">Table View</TabsTrigger>
                <TabsTrigger value="chart">Chart View</TabsTrigger>
              </TabsList>
              
              <TabsContent value="table">
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">#</TableHead>
                            <TableHead>
                              <div className="flex items-center">
                                School Name
                                <ArrowUpDown className="ml-2 h-4 w-4" />
                              </div>
                            </TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead className="text-right">Overall Average</TableHead>
                            <TableHead className="text-right">Success Rate</TableHead>
                            <TableHead className="text-right">Attendance Rate</TableHead>
                            <TableHead className="text-right">Ranking</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredSchools.length > 0 ? (
                            filteredSchools.map((school, index) => (
                              <TableRow key={school.id}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell className="font-medium">{school.name}</TableCell>
                                <TableCell>{school.location || '-'}</TableCell>
                                <TableCell className="text-right">
                                  {school.performance?.overallAverage 
                                    ? `${school.performance.overallAverage.toFixed(1)}%` 
                                    : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                  {school.performance?.successRate 
                                    ? `${school.performance.successRate.toFixed(1)}%` 
                                    : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                  {school.performance?.attendanceRate 
                                    ? `${school.performance.attendanceRate.toFixed(1)}%` 
                                    : '-'}
                                </TableCell>
                                <TableCell className="text-right">
                                  {school.performance?.ranking || '-'}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                                No schools found
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="chart">
                <Card>
                  <CardContent className="pt-6">
                    {chartData.length > 0 ? (
                      <div className="h-[500px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={chartData}
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
                            <Bar dataKey="average" name="Overall Average" fill="#1565C0" />
                            <Bar dataKey="success" name="Success Rate" fill="#2E7D32" />
                            <Bar dataKey="attendance" name="Attendance Rate" fill="#FF6D00" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        No school performance data available
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
