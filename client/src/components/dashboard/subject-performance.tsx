import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StudentPerformance, SubjectPerformance } from "@/types";
import { Download, Filter } from "lucide-react";
import { getColorByScore, getTextColorByScore, getColorForChange } from "@/lib/utils";

interface SubjectPerformanceTableProps {
  performances?: StudentPerformance[];
}

export function SubjectPerformanceTable({ performances = [] }: SubjectPerformanceTableProps) {
  // Process the data to get subject metrics
  const subjectMetrics = useMemo(() => {
    if (!performances || performances.length === 0) {
      return [];
    }

    // Group by subject
    const subjectGroups: Record<number, StudentPerformance[]> = {};
    
    performances.forEach(perf => {
      if (!subjectGroups[perf.subjectId]) {
        subjectGroups[perf.subjectId] = [];
      }
      subjectGroups[perf.subjectId].push(perf);
    });
    
    // Process each subject
    const results: SubjectPerformance[] = Object.keys(subjectGroups).map(subjectId => {
      const subjectPerfs = subjectGroups[parseInt(subjectId)];
      const average = Math.round(
        subjectPerfs.reduce((sum, perf) => sum + perf.averageScore, 0) / subjectPerfs.length
      );
      const passRate = Math.round(
        subjectPerfs.reduce((sum, perf) => sum + perf.passRate, 0) / subjectPerfs.length
      );
      
      // Mock yearly change - in a real app, this would come from historical data
      // Using a spread to create some variation between -5 and +5
      const yearChange = Math.round((Math.random() * 10 - 5) * 10) / 10;
      
      return {
        id: parseInt(subjectId),
        name: subjectPerfs[0].subjectName || `Subject ${subjectId}`,
        average,
        passRate,
        yearChange,
        color: getColorByScore(average)
      };
    });
    
    // Sort by average (highest first)
    return results.sort((a, b) => b.average - a.average);
  }, [performances]);

  return (
    <Card className="p-4 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-foreground">Subject Performance Analysis</h3>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {subjectMetrics.length > 0 ? (
          <table className="w-full data-table">
            <thead>
              <tr className="text-left border-b border-border">
                <th className="pb-3 font-semibold text-muted-foreground text-sm">Subject</th>
                <th className="pb-3 font-semibold text-muted-foreground text-sm text-right">Average</th>
                <th className="pb-3 font-semibold text-muted-foreground text-sm text-right">Pass Rate</th>
                <th className="pb-3 font-semibold text-muted-foreground text-sm text-right">YoY Change</th>
                <th className="pb-3 font-semibold text-muted-foreground text-sm text-right">Performance</th>
              </tr>
            </thead>
            <tbody>
              {subjectMetrics.map((subject) => (
                <tr key={subject.id} className="border-b border-border/50">
                  <td className="py-3 font-medium text-foreground">{subject.name}</td>
                  <td className="py-3 text-right">{subject.average.toFixed(1)}%</td>
                  <td className="py-3 text-right">{subject.passRate.toFixed(1)}%</td>
                  <td className={`py-3 text-right ${getColorForChange(subject.yearChange)}`}>
                    {subject.yearChange > 0 ? "+" : ""}{subject.yearChange}%
                  </td>
                  <td className="py-3 text-right">
                    <div className="h-1.5 bg-muted rounded-full w-24 ml-auto">
                      <div 
                        className={`h-1.5 ${subject.color} rounded-full`} 
                        style={{ width: `${subject.average}%` }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No subject performance data available
          </div>
        )}
      </div>
    </Card>
  );
}
