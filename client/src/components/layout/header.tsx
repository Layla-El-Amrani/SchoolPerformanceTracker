import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, HelpCircle } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AcademicYear, Term } from "@/types";

interface HeaderProps {
  onYearChange: (yearId: number) => void;
  onTermChange: (termId: string) => void;
  selectedYearId: number | null;
  selectedTermId: string;
}

export function Header({ 
  onYearChange, 
  onTermChange, 
  selectedYearId, 
  selectedTermId 
}: HeaderProps) {
  // Fetch academic years
  const { data: academicYears, isLoading: yearsLoading } = useQuery<AcademicYear[]>({
    queryKey: ["/api/academic-years"],
  });
  
  // Fetch terms based on selected year
  const { data: terms, isLoading: termsLoading } = useQuery<Term[]>({
    queryKey: ["/api/terms", selectedYearId],
    enabled: !!selectedYearId,
  });
  
  // Set default year (active year) on initial load
  useEffect(() => {
    if (academicYears && academicYears.length > 0 && !selectedYearId) {
      const activeYear = academicYears.find(year => year.active);
      if (activeYear) {
        onYearChange(activeYear.id);
      } else {
        onYearChange(academicYears[0].id);
      }
    }
  }, [academicYears, selectedYearId, onYearChange]);
  
  const handleYearChange = (yearId: string) => {
    onYearChange(parseInt(yearId));
  };
  
  const handleTermChange = (termId: string) => {
    onTermChange(termId);
  };
  
  return (
    <header className="bg-card shadow-sm sticky top-0 z-10">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center space-x-4">
          {/* Year Selector */}
          <div className="relative">
            <Select
              disabled={yearsLoading}
              value={selectedYearId?.toString() || ""}
              onValueChange={handleYearChange}
            >
              <SelectTrigger className="min-w-[200px]">
                <SelectValue placeholder={yearsLoading ? "Loading years..." : "Select Academic Year"} />
              </SelectTrigger>
              <SelectContent>
                {academicYears?.map((year) => (
                  <SelectItem key={year.id} value={year.id.toString()}>
                    {year.name}{year.active ? " (Current)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Term Selector */}
          <div className="relative">
            <Select
              disabled={termsLoading || !selectedYearId}
              value={selectedTermId}
              onValueChange={handleTermChange}
            >
              <SelectTrigger className="min-w-[150px]">
                <SelectValue placeholder={termsLoading ? "Loading terms..." : "Select Term"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Terms</SelectItem>
                {terms?.map((term) => (
                  <SelectItem key={term.id} value={term.id.toString()}>
                    {term.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon">
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </header>
  );
}
