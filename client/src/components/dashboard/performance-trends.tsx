import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StudentPerformance, PerformanceTrend } from "@/types";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";
import { performanceTrendsConfig, averageScoreLineConfig, passRateLineConfig } from "@/lib/chart-config";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PerformanceTrendsProps {
  performances?: StudentPerformance[];
  academicYearId?: number | null;
  termId?: number;
}

export function PerformanceTrends({ performances = [], academicYearId, termId }: PerformanceTrendsProps) {
  const [period, setPeriod] = useState<"quarter" | "year">("quarter");
  const [trends, setTrends] = useState<PerformanceTrend[]>([]);
  
  useEffect(() => {
    if (performances && performances.length > 0) {
      // Process the data to create trends
      // This is a simplified example - in a real app you'd need more complex data processing
      
      // Group by subject
      const subjectGroups: Record<number, StudentPerformance[]> = {};
      
      performances.forEach(perf => {
        if (!subjectGroups[perf.subjectId]) {
          subjectGroups[perf.subjectId] = [];
        }
        subjectGroups[perf.subjectId].push(perf);
      });
      
      // Get top 5 subjects by performance
      const topSubjects = Object.keys(subjectGroups)
        .map(subjectId => ({
          subjectId: parseInt(subjectId),
          performances: subjectGroups[parseInt(subjectId)],
          averageScore: subjectGroups[parseInt(subjectId)]
            .reduce((sum, perf) => sum + perf.averageScore, 0) / subjectGroups[parseInt(subjectId)].length
        }))
        .sort((a, b) => b.averageScore - a.averageScore)
        .slice(0, 5);
      
      // Create trend data points
      // For demo, generate periods (quarters or months)
      const periods = period === "quarter" ? 
        ["Q1", "Q2", "Q3", "Q4"] : 
        ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      
      const trendData: PerformanceTrend[] = periods.map((label) => {
        // In a real app, this would use actual data for each period
        // Here we're generating realistic looking demo data
        const baseAverage = 
          performances.reduce((sum, perf) => sum + perf.averageScore, 0) / performances.length;
        const basePassRate = 
          performances.reduce((sum, perf) => sum + perf.passRate, 0) / performances.length;
        
        // Add some randomness to simulate data variation
        const randomFactor = 0.05; // 5% maximum variation
        const randomVariation = (Math.random() * 2 - 1) * randomFactor;
        
        return {
          label,
          average: Math.min(100, Math.max(50, baseAverage * (1 + randomVariation))),
          passRate: Math.min(100, Math.max(50, basePassRate * (1 + randomVariation))),
        };
      });
      
      setTrends(trendData);
    }
  }, [performances, period]);
  
  const chartData = {
    labels: trends.map(t => t.label),
    datasets: [
      {
        label: 'Average Score',
        data: trends.map(t => t.average),
        ...averageScoreLineConfig
      },
      {
        label: 'Pass Rate',
        data: trends.map(t => t.passRate),
        ...passRateLineConfig
      }
    ],
  };
  
  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-foreground">Performance Trends</h3>
        <div className="flex space-x-2">
          <Button 
            size="sm"
            variant={period === "quarter" ? "default" : "outline"}
            onClick={() => setPeriod("quarter")}
            className={period === "quarter" ? "bg-primary" : ""}
          >
            Quarter
          </Button>
          <Button 
            size="sm"
            variant={period === "year" ? "default" : "outline"}
            onClick={() => setPeriod("year")}
            className={period === "year" ? "bg-primary" : ""}
          >
            Year
          </Button>
        </div>
      </div>
      <div className="h-[300px]">
        {trends.length > 0 ? (
          <Line 
            data={chartData} 
            options={performanceTrendsConfig}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">No trend data available</p>
          </div>
        )}
      </div>
    </Card>
  );
}
