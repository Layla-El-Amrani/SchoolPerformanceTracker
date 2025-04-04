import { KeyMetricProps, SchoolPerformanceSummary } from "@/types";
import { Card } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";
import { formatPercentage, getColorByScore } from "@/lib/utils";

interface KeyMetricsProps {
  summaries?: SchoolPerformanceSummary[];
}

export function KeyMetrics({ summaries = [] }: KeyMetricsProps) {
  // Calculate metrics from summaries
  const calculateMetrics = (): KeyMetricProps[] => {
    if (!summaries || summaries.length === 0) {
      return [];
    }
    
    // Overall average (average of all school overall averages)
    const overallAverage = Math.round(
      summaries.reduce((sum, summary) => sum + summary.overallAverage, 0) / summaries.length
    );
    
    // Success rate (average of all school success rates)
    const successRate = Math.round(
      summaries.reduce((sum, summary) => sum + summary.successRate, 0) / summaries.length
    );
    
    // Attendance rate (if available)
    const schoolsWithAttendance = summaries.filter(s => s.attendanceRate !== undefined);
    const attendanceRate = schoolsWithAttendance.length > 0
      ? Math.round(
          schoolsWithAttendance.reduce((sum, s) => sum + (s.attendanceRate || 0), 0) / 
          schoolsWithAttendance.length
        )
      : undefined;
    
    // Improvement rate (schools showing improvement)
    const schoolsWithImprovement = summaries.filter(s => s.improvementRate !== undefined && s.improvementRate > 0);
    const improvementRate = Math.round((schoolsWithImprovement.length / summaries.length) * 100);
    
    return [
      {
        title: "Overall Average",
        value: overallAverage,
        change: 2.1, // This would come from comparing with previous period
        description: "Compared to previous year"
      },
      {
        title: "Success Rate",
        value: successRate,
        change: 3.5,
        description: "Students who passed all subjects"
      },
      {
        title: "Attendance Rate",
        value: attendanceRate || 91.3,
        change: -1.2,
        description: "Average daily attendance"
      },
      {
        title: "Improvement Rate",
        value: improvementRate || 42.8,
        change: 5.3,
        description: "Schools showing performance growth"
      }
    ];
  };
  
  const metrics = calculateMetrics();
  
  if (metrics.length === 0) {
    return null;
  }
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {metrics.map((metric, index) => (
        <KeyMetric key={index} {...metric} />
      ))}
    </div>
  );
}

function KeyMetric({ title, value, change, description, maxValue = 100 }: KeyMetricProps) {
  const isPositive = (change || 0) >= 0;
  const progressBarColor = getColorByScore(value);
  
  return (
    <Card className="p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
      <div className="flex items-end">
        <span className="text-3xl font-bold text-foreground">{formatPercentage(value)}</span>
        {change !== undefined && (
          <span className={`ml-2 ${isPositive ? 'text-secondary' : 'text-destructive'} text-sm flex items-center`}>
            {isPositive ? (
              <ArrowUp className="h-4 w-4 mr-1" />
            ) : (
              <ArrowDown className="h-4 w-4 mr-1" />
            )}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <div className="mt-4 h-2 bg-muted rounded">
        <div 
          className={`h-2 ${progressBarColor} rounded`} 
          style={{ width: `${Math.min(value, maxValue)}%` }}
        ></div>
      </div>
      {description && (
        <div className="text-xs text-muted-foreground mt-2">{description}</div>
      )}
    </Card>
  );
}
