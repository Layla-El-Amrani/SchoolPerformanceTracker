import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { SchoolPerformanceSummary, SchoolRanking } from "@/types";

interface SchoolRankingsProps {
  summaries?: SchoolPerformanceSummary[];
}

export function SchoolRankings({ summaries = [] }: SchoolRankingsProps) {
  const [rankingType, setRankingType] = useState<"average" | "success" | "improvement">("average");
  
  // Process data to get school rankings
  const getRankings = (): SchoolRanking[] => {
    if (!summaries || summaries.length === 0) {
      return [];
    }

    let sortField: keyof SchoolPerformanceSummary;
    
    switch (rankingType) {
      case "success":
        sortField = "successRate";
        break;
      case "improvement":
        sortField = "improvementRate";
        break;
      case "average":
      default:
        sortField = "overallAverage";
        break;
    }

    // Sort summaries based on the selected field
    const sorted = [...summaries]
      .sort((a, b) => {
        const valA = a[sortField] as number || 0;
        const valB = b[sortField] as number || 0;
        return valB - valA;
      });
    
    // Take the top 5 schools
    return sorted.slice(0, 5).map((summary, index) => ({
      id: summary.schoolId,
      name: summary.schoolName || `School ${summary.schoolId}`,
      value: summary[sortField] as number || 0,
      ranking: index + 1
    }));
  };
  
  const rankings = getRankings();
  
  return (
    <Card className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-foreground">Top Performing Schools</h3>
        <Select value={rankingType} onValueChange={(value) => setRankingType(value as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Ranking Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="average">By Average Score</SelectItem>
            <SelectItem value="success">By Success Rate</SelectItem>
            <SelectItem value="improvement">By Improvement</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-4">
        {rankings.length > 0 ? (
          rankings.map((school) => (
            <div key={school.id} className="flex items-center">
              <div className="w-8 h-8 flex-shrink-0 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                {school.ranking}
              </div>
              <div className="ml-3 flex-1">
                <div className="flex justify-between mb-1">
                  <span className="font-medium text-foreground">{school.name}</span>
                  <span className="font-semibold text-primary">{school.value.toFixed(1)}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full">
                  <div 
                    className="h-1.5 bg-primary rounded-full" 
                    style={{ width: `${school.value}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            No school ranking data available
          </div>
        )}
      </div>
      
      <div className="mt-4 text-center">
        <Link href="/schools">
          <Button variant="link" className="text-primary">
            View All Schools
          </Button>
        </Link>
      </div>
    </Card>
  );
}
