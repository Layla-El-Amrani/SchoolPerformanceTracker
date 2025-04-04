export interface KeyMetricProps {
  title: string;
  value: number;
  change?: number;
  maxValue?: number;
  color?: string;
  description?: string;
}

export interface SchoolRanking {
  id: number;
  name: string;
  value: number;
  ranking: number;
}

export interface PerformanceTrend {
  label: string;
  average: number;
  passRate: number;
}

export interface SubjectPerformance {
  id: number;
  name: string;
  average: number;
  passRate: number;
  yearChange: number;
  color: string;
}

export interface FileUpload {
  id: number;
  filename: string;
  fileSize: number;
  createdAt: Date;
  status: "processing" | "processed" | "error";
}

export interface AcademicYear {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  active: boolean;
}

export interface Term {
  id: number;
  name: string;
  academicYearId: number;
  startDate: string;
  endDate: string;
}

export interface School {
  id: number;
  name: string;
  location?: string;
  type?: string;
}

export interface Subject {
  id: number;
  name: string;
  code?: string;
}

export interface SchoolPerformanceSummary {
  id: number;
  schoolId: number;
  academicYearId: number;
  termId: number | null;
  overallAverage: number;
  successRate: number;
  attendanceRate?: number;
  improvementRate?: number;
  ranking: number;
  schoolName?: string; // Joined from School
}

export interface StudentPerformance {
  id: number;
  schoolId: number;
  academicYearId: number;
  termId: number | null;
  subjectId: number;
  averageScore: number;
  passRate: number;
  attendanceRate?: number;
  schoolName?: string; // Joined from School
  subjectName?: string; // Joined from Subject
}
