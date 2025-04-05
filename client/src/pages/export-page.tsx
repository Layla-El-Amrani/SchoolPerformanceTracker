import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { 
  FileDown, 
  FileSpreadsheet, 
  FileText, 
  Loader2, 
  BarChart2, 
  PieChart, 
  LineChart 
} from "lucide-react";
import { AcademicYear, Term } from "@/types";

export default function ExportPage() {
  const { t } = useTranslation();
  const [selectedYearId, setSelectedYearId] = useState<number | null>(null);
  const [selectedTermId, setSelectedTermId] = useState<string>("all");
  const [reportType, setReportType] = useState<string>("performance");
  const [fileFormat, setFileFormat] = useState<string>("excel");
  const [includeCharts, setIncludeCharts] = useState<boolean>(true);
  
  // Fetch academic years
  const { data: academicYears, isLoading: yearsLoading } = useQuery<AcademicYear[]>({
    queryKey: ["/api/academic-years"],
  });
  
  // Fetch terms based on selected year
  const { data: terms, isLoading: termsLoading } = useQuery<Term[]>({
    queryKey: ["/api/terms", selectedYearId],
    enabled: !!selectedYearId,
  });
  
  const handleYearChange = (yearId: number) => {
    setSelectedYearId(yearId);
  };
  
  const handleTermChange = (termId: string) => {
    setSelectedTermId(termId);
  };
  
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!selectedYearId) return;
    
    setIsExporting(true);
    
    try {
      // Build the export URL with query parameters
      const exportUrl = `/api/export?` + new URLSearchParams({
        reportType,
        fileFormat,
        includeCharts: includeCharts.toString(),
        academicYearId: selectedYearId.toString(),
        ...(selectedTermId !== "all" && { termId: selectedTermId })
      }).toString();
      
      // Fetch the export
      const response = await fetch(exportUrl);
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      // Get the filename from the Content-Disposition header if available
      let filename = 'report';
      const contentDisposition = response.headers.get('Content-Disposition');
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      // Add appropriate extension based on file format
      if (!filename.includes('.')) {
        filename += fileFormat === 'excel' ? '.xlsx' : '.pdf';
      }
      
      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      // Alert user about the export
      alert(t('export.exportStarted'));
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };
  
  const reportTypeOptions = [
    { value: "performance", label: t('export.reportTypes.performance'), icon: <BarChart2 className="h-4 w-4 mr-2" /> },
    { value: "comparison", label: t('export.reportTypes.comparison'), icon: <LineChart className="h-4 w-4 mr-2" /> },
    { value: "distribution", label: t('export.reportTypes.distribution'), icon: <PieChart className="h-4 w-4 mr-2" /> }
  ];
  
  const fileFormatOptions = [
    { value: "excel", label: "Excel (.xlsx)", icon: <FileSpreadsheet className="h-4 w-4 mr-2" /> },
    { value: "pdf", label: "PDF", icon: <FileText className="h-4 w-4 mr-2" /> }
  ];
  
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header
          onYearChange={handleYearChange}
          onTermChange={handleTermChange}
          selectedYearId={selectedYearId}
          selectedTermId={selectedTermId}
        />
        <main className="flex-1 p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">{t('export.title')}</h1>
            <p className="text-muted-foreground">{t('export.subtitle')}</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t('export.configureReport')}</CardTitle>
                <CardDescription>{t('export.configureDescription')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>{t('export.reportType')}</Label>
                  <Select 
                    value={reportType} 
                    onValueChange={setReportType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('export.selectReportType')} />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypeOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center">
                            {option.icon}
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>{t('export.fileFormat')}</Label>
                  <Select 
                    value={fileFormat} 
                    onValueChange={setFileFormat}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('export.selectFormat')} />
                    </SelectTrigger>
                    <SelectContent>
                      {fileFormatOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center">
                            {option.icon}
                            {option.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="include-charts" 
                    checked={includeCharts} 
                    onCheckedChange={(checked) => setIncludeCharts(checked as boolean)}
                  />
                  <Label htmlFor="include-charts">{t('export.includeCharts')}</Label>
                </div>
                
                <Separator />
                
                <Button 
                  className="w-full" 
                  onClick={handleExport}
                  disabled={!selectedYearId || yearsLoading || isExporting}
                >
                  {isExporting || yearsLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4 mr-2" />
                  )}
                  {isExporting 
                    ? t('common.loading') 
                    : t('export.generateReport')}
                </Button>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>{t('export.recentReports')}</CardTitle>
                <CardDescription>{t('export.recentDescription')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <FileDown className="h-12 w-12 mx-auto mb-2 opacity-30" />
                  <p>{t('export.noReports')}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}