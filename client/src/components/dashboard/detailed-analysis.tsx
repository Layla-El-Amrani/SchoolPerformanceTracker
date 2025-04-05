import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { SchoolPerformanceSummary, StudentPerformance, School, Subject } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { getColorByScore, formatPercentage } from "@/lib/utils";
import { AlertCircle, ArrowUpRight, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useTranslation } from "react-i18next";

// Les couleurs pour les graphiques
const COLORS = ['#1565C0', '#2E7D32', '#FF6D00', '#7B1FA2', '#C62828', '#0097A7'];

export function DetailedAnalysis({
  performances,
  summaries,
  academicYearId,
  termId
}: {
  performances: StudentPerformance[] | undefined;
  summaries: SchoolPerformanceSummary[] | undefined;
  academicYearId: number;
  termId?: number;
}) {
  const { t } = useTranslation();
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [analysisTab, setAnalysisTab] = useState("schools");

  // Récupérer la liste des écoles
  const { data: schools } = useQuery<School[]>({
    queryKey: ["/api/schools"],
  });

  // Récupérer la liste des matières
  const { data: subjects } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  // Données traitées pour les analyses par école
  const schoolAnalysisData = useMemo(() => {
    if (!summaries || summaries.length === 0) return [];

    return summaries.map(summary => {
      const schoolName = schools?.find(s => s.id === summary.schoolId)?.name || `School ${summary.schoolId}`;
      
      // Calculer l'évolution par rapport à la moyenne
      const performanceVsAverage = summary.overallAverage - 
        (summaries.reduce((acc, s) => acc + s.overallAverage, 0) / summaries.length);
      
      return {
        id: summary.schoolId,
        name: schoolName,
        overallAverage: summary.overallAverage,
        successRate: summary.successRate,
        ranking: summary.ranking || summaries.length,
        attendanceRate: summary.attendanceRate || 0,
        improvementRate: summary.improvementRate || 0,
        performanceVsAverage: performanceVsAverage
      };
    }).sort((a, b) => b.overallAverage - a.overallAverage);
  }, [summaries, schools]);

  // Données traitées pour les analyses par matière
  const subjectAnalysisData = useMemo(() => {
    if (!performances || performances.length === 0 || !subjects) return [];

    const subjectStats = subjects.map(subject => {
      const subjectPerformances = performances.filter(p => p.subjectId === subject.id);
      
      if (subjectPerformances.length === 0) {
        return {
          id: subject.id,
          name: subject.name,
          code: subject.code,
          averageScore: 0,
          passRate: 0,
          attendanceRate: 0,
          schoolCount: 0,
          minScore: 0,
          maxScore: 0,
          variationScore: 0
        };
      }
      
      const averageScore = subjectPerformances.reduce((acc, p) => acc + p.averageScore, 0) / subjectPerformances.length;
      const passRate = subjectPerformances.reduce((acc, p) => acc + p.passRate, 0) / subjectPerformances.length;
      const attendanceRate = subjectPerformances.reduce((acc, p) => acc + (p.attendanceRate || 0), 0) / subjectPerformances.length;
      
      const scores = subjectPerformances.map(p => p.averageScore);
      const minScore = Math.min(...scores);
      const maxScore = Math.max(...scores);
      
      return {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        averageScore,
        passRate,
        attendanceRate,
        schoolCount: subjectPerformances.length,
        minScore,
        maxScore,
        variationScore: maxScore - minScore
      };
    }).sort((a, b) => b.averageScore - a.averageScore);

    return subjectStats;
  }, [performances, subjects]);

  // Données pour l'analyse spécifique d'une école
  const selectedSchoolData = useMemo(() => {
    if (!selectedSchoolId || !performances || performances.length === 0) return null;
    
    const schoolId = parseInt(selectedSchoolId);
    const schoolPerformances = performances.filter(p => p.schoolId === schoolId);
    
    if (schoolPerformances.length === 0) return null;
    
    const subjectPerformances = schoolPerformances.reduce((acc, performance) => {
      const subject = subjects?.find(s => s.id === performance.subjectId);
      if (!subject) return acc;
      
      acc.push({
        subjectId: subject.id,
        subjectName: subject.name,
        subjectCode: subject.code,
        averageScore: performance.averageScore,
        passRate: performance.passRate,
        attendanceRate: performance.attendanceRate || 0
      });
      
      return acc;
    }, [] as any[]);
    
    return {
      schoolId,
      schoolName: schools?.find(s => s.id === schoolId)?.name || `School ${schoolId}`,
      summary: summaries?.find(s => s.schoolId === schoolId),
      subjectPerformances
    };
  }, [selectedSchoolId, performances, subjects, schools, summaries]);

  // Données pour l'analyse spécifique d'une matière
  const selectedSubjectData = useMemo(() => {
    if (!selectedSubjectId || !performances || performances.length === 0) return null;
    
    const subjectId = parseInt(selectedSubjectId);
    const subjectPerformances = performances.filter(p => p.subjectId === subjectId);
    
    if (subjectPerformances.length === 0) return null;
    
    const schoolPerformances = subjectPerformances.reduce((acc, performance) => {
      const school = schools?.find(s => s.id === performance.schoolId);
      if (!school) return acc;
      
      acc.push({
        schoolId: school.id,
        schoolName: school.name,
        averageScore: performance.averageScore,
        passRate: performance.passRate,
        attendanceRate: performance.attendanceRate || 0
      });
      
      return acc;
    }, [] as any[]).sort((a, b) => b.averageScore - a.averageScore);
    
    return {
      subjectId,
      subjectName: subjects?.find(s => s.id === subjectId)?.name || `Subject ${subjectId}`,
      subjectCode: subjects?.find(s => s.id === subjectId)?.code || "",
      schoolPerformances
    };
  }, [selectedSubjectId, performances, schools, subjects]);

  // Données pour l'analyse des écarts et des relations
  const insightData = useMemo(() => {
    if (!performances || performances.length === 0 || !summaries || summaries.length === 0) return null;
    
    // Trouver la corrélation entre le taux de présence et la réussite
    const attendanceVsSuccessData = summaries
      .filter(s => s.attendanceRate !== null && s.attendanceRate !== undefined)
      .map(s => ({
        schoolId: s.schoolId,
        schoolName: schools?.find(school => school.id === s.schoolId)?.name || `School ${s.schoolId}`,
        attendanceRate: s.attendanceRate || 0,
        successRate: s.successRate
      }));
    
    // Calculer les écarts de performance entre les matières
    const subjectGaps = subjectAnalysisData.map(subject => ({
      subjectId: subject.id,
      subjectName: subject.name,
      subjectCode: subject.code,
      averageScore: subject.averageScore,
      variationScore: subject.variationScore,
      gapFromBest: subjectAnalysisData[0].averageScore - subject.averageScore
    }));
    
    // Identifier les écoles qui s'améliorent le plus
    const improvingSchools = summaries
      .filter(s => s.improvementRate !== null && s.improvementRate !== undefined && s.improvementRate > 0)
      .sort((a, b) => (b.improvementRate || 0) - (a.improvementRate || 0))
      .slice(0, 5)
      .map(s => ({
        schoolId: s.schoolId,
        schoolName: schools?.find(school => school.id === s.schoolId)?.name || `School ${s.schoolId}`,
        improvementRate: s.improvementRate || 0,
        overallAverage: s.overallAverage
      }));
    
    return {
      attendanceVsSuccessData,
      subjectGaps,
      improvingSchools
    };
  }, [performances, summaries, schools, subjectAnalysisData]);

  // Recommandations basées sur les données analysées
  const recommendations = useMemo(() => {
    if (!performances || performances.length === 0 || !summaries || summaries.length === 0) return [];
    
    const recs = [];
    
    // Recommandation sur les matières en difficulté
    const weakSubjects = subjectAnalysisData
      .filter(s => s.averageScore > 0) // Exclure les matières sans données
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, 3);
      
    if (weakSubjects.length > 0) {
      recs.push({
        type: "warning",
        title: t('analysis.recommendations.weakSubjects'),
        description: t('analysis.recommendations.weakSubjectsDesc', {
          subjects: weakSubjects.map(s => s.name).join(', '),
          score: formatPercentage(weakSubjects[0].averageScore)
        }),
        icon: <AlertCircle className="h-5 w-5 text-amber-500" />
      });
    }
    
    // Recommandation sur les écoles performantes
    const topSchools = schoolAnalysisData
      .sort((a, b) => b.overallAverage - a.overallAverage)
      .slice(0, 3);
      
    if (topSchools.length > 0) {
      recs.push({
        type: "success",
        title: t('analysis.recommendations.topSchools'),
        description: t('analysis.recommendations.topSchoolsDesc', {
          schools: topSchools.map(s => s.name).join(', '),
          score: formatPercentage(topSchools[0].overallAverage)
        }),
        icon: <ArrowUpRight className="h-5 w-5 text-emerald-500" />
      });
    }
    
    // Recommandation sur la corrélation présence/réussite
    if (insightData?.attendanceVsSuccessData && insightData.attendanceVsSuccessData.length > 5) {
      const correlation = insightData.attendanceVsSuccessData
        .sort((a, b) => b.attendanceRate - a.attendanceRate);
      
      const highAttendance = correlation.slice(0, 3);
      const lowAttendance = correlation.slice(-3);
      
      const highAttAvg = highAttendance.reduce((acc, item) => acc + item.successRate, 0) / highAttendance.length;
      const lowAttAvg = lowAttendance.reduce((acc, item) => acc + item.successRate, 0) / lowAttendance.length;
      
      if (highAttAvg > lowAttAvg) {
        recs.push({
          type: "info",
          title: t('analysis.recommendations.attendanceCorrelation'),
          description: t('analysis.recommendations.attendanceCorrelationDesc', {
            highScore: formatPercentage(highAttAvg),
            lowScore: formatPercentage(lowAttAvg)
          }),
          icon: <TrendingUp className="h-5 w-5 text-blue-500" />
        });
      }
    }
    
    return recs;
  }, [performances, summaries, subjectAnalysisData, schoolAnalysisData, insightData, t]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('analysis.detailedTitle')}</CardTitle>
          <CardDescription>{t('analysis.detailedSubtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="schools" value={analysisTab} onValueChange={setAnalysisTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="schools">{t('analysis.tabs.schools')}</TabsTrigger>
              <TabsTrigger value="subjects">{t('analysis.tabs.subjects')}</TabsTrigger>
              <TabsTrigger value="insights">{t('analysis.tabs.insights')}</TabsTrigger>
            </TabsList>
            
            {/* Analyse des écoles */}
            <TabsContent value="schools" className="space-y-6">
              <div className="mb-4">
                <Select value={selectedSchoolId} onValueChange={setSelectedSchoolId}>
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue placeholder={t('analysis.selectSchool')} />
                  </SelectTrigger>
                  <SelectContent>
                    {schools?.map(school => (
                      <SelectItem key={school.id} value={school.id.toString()}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedSchoolId && selectedSchoolData ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{selectedSchoolData.schoolName}</CardTitle>
                      <CardDescription>
                        {t('analysis.rankingInfo', { 
                          ranking: selectedSchoolData.summary?.ranking || '—',
                          total: summaries?.length || '—' 
                        })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-muted-foreground">{t('analysis.overallAverage')}</div>
                          <div className="text-2xl font-bold">
                            {formatPercentage(selectedSchoolData.summary?.overallAverage || 0)}
                          </div>
                          <Progress 
                            value={selectedSchoolData.summary?.overallAverage || 0} 
                            className={`h-2 ${getColorByScore(selectedSchoolData.summary?.overallAverage || 0)}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-muted-foreground">{t('analysis.successRate')}</div>
                          <div className="text-2xl font-bold">
                            {formatPercentage(selectedSchoolData.summary?.successRate || 0)}
                          </div>
                          <Progress 
                            value={selectedSchoolData.summary?.successRate || 0} 
                            className={`h-2 ${getColorByScore(selectedSchoolData.summary?.successRate || 0)}`}
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="text-sm font-medium text-muted-foreground">{t('analysis.improvement')}</div>
                          <div className="text-2xl font-bold flex items-center">
                            {formatPercentage(selectedSchoolData.summary?.improvementRate || 0)}
                            {(selectedSchoolData.summary?.improvementRate || 0) > 0 ? (
                              <TrendingUp className="h-5 w-5 ml-2 text-emerald-500" />
                            ) : (selectedSchoolData.summary?.improvementRate || 0) < 0 ? (
                              <TrendingDown className="h-5 w-5 ml-2 text-red-500" />
                            ) : (
                              <Minus className="h-5 w-5 ml-2 text-gray-500" />
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <h4 className="text-sm font-medium mb-3">{t('analysis.subjectPerformance')}</h4>
                        <div className="h-[300px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={selectedSchoolData.subjectPerformances}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="subjectName" />
                              <YAxis domain={[0, 100]} />
                              <Tooltip formatter={(value) => formatPercentage(value as number)} />
                              <Legend />
                              <Bar dataKey="averageScore" name={t('analysis.averageScore')} fill="#1565C0" />
                              <Bar dataKey="passRate" name={t('analysis.passRate')} fill="#2E7D32" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                      
                      <div className="mt-8">
                        <h4 className="text-sm font-medium mb-3">{t('analysis.subjectsTable')}</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t('analysis.subject')}</TableHead>
                              <TableHead className="text-right">{t('analysis.averageScore')}</TableHead>
                              <TableHead className="text-right">{t('analysis.passRate')}</TableHead>
                              <TableHead className="text-right">{t('analysis.attendance')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedSchoolData.subjectPerformances.map((subject) => (
                              <TableRow key={subject.subjectId}>
                                <TableCell>{subject.subjectName}</TableCell>
                                <TableCell className="text-right">
                                  {formatPercentage(subject.averageScore)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatPercentage(subject.passRate)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatPercentage(subject.attendanceRate)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : !selectedSchoolId ? (
                <div className="text-center text-muted-foreground py-8">
                  {t('analysis.selectSchoolPrompt')}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  {t('analysis.noDataForSchool')}
                </div>
              )}
            </TabsContent>
            
            {/* Analyse des matières */}
            <TabsContent value="subjects" className="space-y-6">
              <div className="mb-4">
                <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue placeholder={t('analysis.selectSubject')} />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects?.map(subject => (
                      <SelectItem key={subject.id} value={subject.id.toString()}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedSubjectId && selectedSubjectData ? (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>{selectedSubjectData.subjectName}</CardTitle>
                      <CardDescription>
                        {t('analysis.subjectCode')}: {selectedSubjectData.subjectCode}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div>
                          <h4 className="text-sm font-medium mb-3">{t('analysis.schoolsPerformance')}</h4>
                          <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={selectedSubjectData.schoolPerformances.slice(0, 10)}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" domain={[0, 100]} />
                                <YAxis dataKey="schoolName" type="category" width={120} />
                                <Tooltip formatter={(value) => formatPercentage(value as number)} />
                                <Legend />
                                <Bar dataKey="averageScore" name={t('analysis.averageScore')} fill="#1565C0" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium mb-3">{t('analysis.passRateComparison')}</h4>
                          <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={selectedSubjectData.schoolPerformances.slice(0, 10)}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 50, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" domain={[0, 100]} />
                                <YAxis dataKey="schoolName" type="category" width={120} />
                                <Tooltip formatter={(value) => formatPercentage(value as number)} />
                                <Legend />
                                <Bar dataKey="passRate" name={t('analysis.passRate')} fill="#2E7D32" />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-8">
                        <h4 className="text-sm font-medium mb-3">{t('analysis.schoolsTable')}</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>{t('analysis.school')}</TableHead>
                              <TableHead className="text-right">{t('analysis.averageScore')}</TableHead>
                              <TableHead className="text-right">{t('analysis.passRate')}</TableHead>
                              <TableHead className="text-right">{t('analysis.attendance')}</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedSubjectData.schoolPerformances.map((school) => (
                              <TableRow key={school.schoolId}>
                                <TableCell>{school.schoolName}</TableCell>
                                <TableCell className="text-right">
                                  {formatPercentage(school.averageScore)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatPercentage(school.passRate)}
                                </TableCell>
                                <TableCell className="text-right">
                                  {formatPercentage(school.attendanceRate)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : !selectedSubjectId ? (
                <div className="text-center text-muted-foreground py-8">
                  {t('analysis.selectSubjectPrompt')}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  {t('analysis.noDataForSubject')}
                </div>
              )}
            </TabsContent>
            
            {/* Analyse des tendances et insights */}
            <TabsContent value="insights" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Carte de recommandations */}
                <Card>
                  <CardHeader>
                    <CardTitle>{t('analysis.recommendations.title')}</CardTitle>
                    <CardDescription>{t('analysis.recommendations.subtitle')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recommendations.length > 0 ? (
                        recommendations.map((rec, idx) => (
                          <div key={idx} className="flex items-start space-x-4 p-4 border rounded-lg">
                            <div>{rec.icon}</div>
                            <div>
                              <h4 className="font-medium">{rec.title}</h4>
                              <p className="text-sm text-muted-foreground">{rec.description}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center text-muted-foreground py-4">
                          {t('analysis.recommendations.none')}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Analyse des relations */}
                {insightData && (
                  <Card>
                    <CardHeader>
                      <CardTitle>{t('analysis.correlations.title')}</CardTitle>
                      <CardDescription>{t('analysis.correlations.subtitle')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <h4 className="text-sm font-medium mb-3">
                        {t('analysis.correlations.attendanceVsSuccess')}
                      </h4>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={insightData.attendanceVsSuccessData.slice(0, 15)}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="attendanceRate" 
                              domain={[0, 100]}
                              tickFormatter={(value) => `${value}%`} 
                              label={{ 
                                value: t('analysis.attendance'),
                                position: 'bottom',
                                offset: 0 
                              }} 
                            />
                            <YAxis 
                              domain={[0, 100]}
                              label={{ 
                                value: t('analysis.successRate'),
                                angle: -90,
                                position: 'left',
                                offset: -5
                              }} 
                            />
                            <Tooltip 
                              formatter={(value, name, props) => {
                                if (name === 'successRate') return formatPercentage(value as number);
                                return value;
                              }}
                              labelFormatter={(value) => `${t('analysis.attendance')}: ${formatPercentage(value as number)}`}
                            />
                            <Legend />
                            <Line 
                              type="monotone" 
                              dataKey="successRate" 
                              name={t('analysis.successRate')}
                              stroke="#1565C0" 
                              activeDot={{ r: 8 }} 
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
              
              {/* Distribution des performances */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('analysis.distribution.title')}</CardTitle>
                  <CardDescription>{t('analysis.distribution.subtitle')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium mb-3">
                        {t('analysis.distribution.subjectPerformance')}
                      </h4>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={subjectAnalysisData.filter(s => s.averageScore > 0)}
                              dataKey="averageScore"
                              nameKey="name"
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              label={(entry) => entry.name}
                            >
                              {subjectAnalysisData.filter(s => s.averageScore > 0).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => formatPercentage(value as number)} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-3">
                        {t('analysis.distribution.topVsBottomSchools')}
                      </h4>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              // Top 5 schools
                              ...schoolAnalysisData.slice(0, 5).map(school => ({
                                name: school.name,
                                average: school.overallAverage,
                                group: t('analysis.distribution.topSchools')
                              })),
                              // Bottom 5 schools
                              ...schoolAnalysisData.slice(-5).map(school => ({
                                name: school.name,
                                average: school.overallAverage,
                                group: t('analysis.distribution.bottomSchools')
                              }))
                            ]}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                            <YAxis domain={[0, 100]} />
                            <Tooltip formatter={(value) => formatPercentage(value as number)} />
                            <Legend />
                            <Bar dataKey="average" name={t('analysis.averageScore')} fill="#1565C0" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Écoles qui s'améliorent le plus */}
              {insightData?.improvingSchools && insightData.improvingSchools.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>{t('analysis.improving.title')}</CardTitle>
                    <CardDescription>{t('analysis.improving.subtitle')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={insightData.improvingSchools}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="schoolName" />
                          <YAxis domain={[0, 10]} />
                          <Tooltip formatter={(value) => formatPercentage(value as number)} />
                          <Legend />
                          <Bar dataKey="improvementRate" name={t('analysis.improvementRate')} fill="#2E7D32" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}