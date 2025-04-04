import { InsertStudentPerformance, InsertSchoolPerformanceSummary } from "@shared/schema";
import ExcelJS from 'exceljs';
import { xml2js } from 'xml-js';
import fs from 'fs';
import { storage } from './storage';

// Interface for parsed performance data
interface PerformanceData {
  schoolId: number;
  academicYearId: number;
  termId: number | null;
  subjectId: number;
  averageScore: number;
  passRate: number;
  attendanceRate?: number;
}

// Process Excel files with student performance data
export async function processExcelFile(
  filePath: string, 
  academicYearId: number, 
  termId?: number
): Promise<{ studentPerformances: PerformanceData[], error?: string }> {
  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    const performanceData: PerformanceData[] = [];
    const errors: string[] = [];
    
    // Get schools and subjects from storage for validation
    const schools = await storage.getSchools();
    const subjects = await storage.getSubjects();
    
    // Process the first worksheet (assuming it has the data)
    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      return { studentPerformances: [], error: "No worksheet found in the Excel file" };
    }
    
    // Validate headers (expected columns: School, Subject, Average Score, Pass Rate, Attendance Rate)
    const headerRow = worksheet.getRow(1);
    const headers = headerRow.values as (string | undefined)[];
    
    const requiredHeaders = ["School", "Subject", "Average Score", "Pass Rate"];
    const missingHeaders = requiredHeaders.filter(header => 
      !headers.find(h => h?.toString().toLowerCase() === header.toLowerCase())
    );
    
    if (missingHeaders.length > 0) {
      return { 
        studentPerformances: [], 
        error: `Missing required headers: ${missingHeaders.join(", ")}` 
      };
    }
    
    // Map column indices
    const schoolColIndex = headers.findIndex(h => h?.toString().toLowerCase() === "school");
    const subjectColIndex = headers.findIndex(h => h?.toString().toLowerCase() === "subject");
    const averageScoreColIndex = headers.findIndex(h => h?.toString().toLowerCase() === "average score");
    const passRateColIndex = headers.findIndex(h => h?.toString().toLowerCase() === "pass rate");
    const attendanceRateColIndex = headers.findIndex(h => h?.toString().toLowerCase() === "attendance rate");
    
    // Process data rows
    let rowIndex = 2; // Start from second row (after headers)
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return; // Skip header row
      
      const values = row.values as (string | number | undefined)[];
      
      const schoolName = values[schoolColIndex]?.toString().trim();
      const subjectName = values[subjectColIndex]?.toString().trim();
      const averageScoreStr = values[averageScoreColIndex]?.toString().trim();
      const passRateStr = values[passRateColIndex]?.toString().trim();
      const attendanceRateStr = attendanceRateColIndex >= 0 ? values[attendanceRateColIndex]?.toString().trim() : undefined;
      
      // Validate required fields
      if (!schoolName || !subjectName || !averageScoreStr || !passRateStr) {
        errors.push(`Row ${rowNumber} has missing required data`);
        return;
      }
      
      // Find school by name
      const school = schools.find(s => s.name.toLowerCase() === schoolName.toLowerCase());
      if (!school) {
        errors.push(`Row ${rowNumber}: School "${schoolName}" not found`);
        return;
      }
      
      // Find subject by name
      const subject = subjects.find(s => s.name.toLowerCase() === subjectName.toLowerCase());
      if (!subject) {
        errors.push(`Row ${rowNumber}: Subject "${subjectName}" not found`);
        return;
      }
      
      // Parse scores and rates
      const averageScore = parsePercentage(averageScoreStr);
      const passRate = parsePercentage(passRateStr);
      const attendanceRate = attendanceRateStr ? parsePercentage(attendanceRateStr) : undefined;
      
      if (averageScore === null || passRate === null) {
        errors.push(`Row ${rowNumber}: Invalid score or rate values`);
        return;
      }
      
      // Add to performance data
      performanceData.push({
        schoolId: school.id,
        academicYearId,
        termId: termId || null,
        subjectId: subject.id,
        averageScore,
        passRate,
        attendanceRate: attendanceRate !== null ? attendanceRate : undefined
      });
    });
    
    if (errors.length > 0) {
      return { 
        studentPerformances: [], 
        error: `Errors processing file: ${errors.join("; ")}` 
      };
    }
    
    return { studentPerformances: performanceData };
  } catch (error) {
    console.error("Error processing Excel file:", error);
    return { 
      studentPerformances: [], 
      error: `Error processing file: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

// Process XML files with student performance data
export async function processXmlFile(
  filePath: string, 
  academicYearId: number, 
  termId?: number
): Promise<{ studentPerformances: PerformanceData[], error?: string }> {
  try {
    const xml = fs.readFileSync(filePath, 'utf8');
    const result = xml2js(xml, { compact: true });
    
    // Get schools and subjects from storage for validation
    const schools = await storage.getSchools();
    const subjects = await storage.getSubjects();
    
    const performanceData: PerformanceData[] = [];
    const errors: string[] = [];
    
    // Extract performance data from XML structure
    // This is a generic implementation - adjust based on actual XML structure
    const performanceRecords = result.performances?.performance || [];
    
    if (!Array.isArray(performanceRecords) && performanceRecords._text !== undefined) {
      // Handle case where there's only one record
      const record = performanceRecords;
      processXmlRecord(record, schools, subjects, performanceData, errors, academicYearId, termId);
    } else if (Array.isArray(performanceRecords)) {
      // Handle multiple records
      for (const record of performanceRecords) {
        processXmlRecord(record, schools, subjects, performanceData, errors, academicYearId, termId);
      }
    } else {
      return { 
        studentPerformances: [], 
        error: "No performance data found in XML file" 
      };
    }
    
    if (errors.length > 0) {
      return { 
        studentPerformances: [], 
        error: `Errors processing file: ${errors.join("; ")}` 
      };
    }
    
    return { studentPerformances: performanceData };
  } catch (error) {
    console.error("Error processing XML file:", error);
    return { 
      studentPerformances: [], 
      error: `Error processing file: ${error instanceof Error ? error.message : String(error)}` 
    };
  }
}

// Helper function to process an XML record
function processXmlRecord(
  record: any, 
  schools: any[], 
  subjects: any[], 
  performanceData: PerformanceData[], 
  errors: string[], 
  academicYearId: number, 
  termId?: number
) {
  try {
    const schoolName = record.school?._text;
    const subjectName = record.subject?._text;
    const averageScoreStr = record.averageScore?._text;
    const passRateStr = record.passRate?._text;
    const attendanceRateStr = record.attendanceRate?._text;
    
    if (!schoolName || !subjectName || !averageScoreStr || !passRateStr) {
      errors.push(`XML record has missing required data`);
      return;
    }
    
    // Find school by name
    const school = schools.find((s: any) => s.name.toLowerCase() === schoolName.toLowerCase());
    if (!school) {
      errors.push(`School "${schoolName}" not found`);
      return;
    }
    
    // Find subject by name
    const subject = subjects.find((s: any) => s.name.toLowerCase() === subjectName.toLowerCase());
    if (!subject) {
      errors.push(`Subject "${subjectName}" not found`);
      return;
    }
    
    // Parse scores and rates
    const averageScore = parsePercentage(averageScoreStr);
    const passRate = parsePercentage(passRateStr);
    const attendanceRate = attendanceRateStr ? parsePercentage(attendanceRateStr) : undefined;
    
    if (averageScore === null || passRate === null) {
      errors.push(`Invalid score or rate values`);
      return;
    }
    
    // Add to performance data
    performanceData.push({
      schoolId: school.id,
      academicYearId,
      termId: termId || null,
      subjectId: subject.id,
      averageScore,
      passRate,
      attendanceRate: attendanceRate !== null ? attendanceRate : undefined
    });
  } catch (error) {
    errors.push(`Error processing XML record: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Helper to parse percentage values (handles both "85%" and "85" formats)
function parsePercentage(value: string | undefined): number | null {
  if (!value) return null;
  
  // Remove the percentage sign if present
  const numStr = value.replace('%', '').trim();
  const num = parseFloat(numStr);
  
  if (isNaN(num)) return null;
  
  return num;
}

// Calculate school performance summaries from student performance data
export async function calculateSchoolPerformanceSummaries(
  academicYearId: number,
  termId?: number
): Promise<InsertSchoolPerformanceSummary[]> {
  const schools = await storage.getSchools();
  const summaries: InsertSchoolPerformanceSummary[] = [];
  
  for (const school of schools) {
    // Get all performance records for this school
    const performances = await storage.getStudentPerformancesBySchool(
      school.id, 
      academicYearId, 
      termId || undefined
    );
    
    if (performances.length === 0) continue;
    
    // Calculate overall average
    const overallAverage = Math.round(
      performances.reduce((sum, perf) => sum + perf.averageScore, 0) / performances.length
    );
    
    // Calculate success rate
    const successRate = Math.round(
      performances.reduce((sum, perf) => sum + perf.passRate, 0) / performances.length
    );
    
    // Calculate attendance rate if available
    let attendanceRate;
    const performancesWithAttendance = performances.filter(p => p.attendanceRate !== undefined);
    if (performancesWithAttendance.length > 0) {
      attendanceRate = Math.round(
        performancesWithAttendance.reduce((sum, perf) => sum + (perf.attendanceRate || 0), 0) / 
        performancesWithAttendance.length
      );
    }
    
    // Calculate improvement rate (comparing with previous year)
    // This is a placeholder - actual implementation would compare with historical data
    const improvementRate = undefined;
    
    // Add to summaries
    summaries.push({
      schoolId: school.id,
      academicYearId,
      termId: termId || null,
      overallAverage,
      successRate,
      attendanceRate,
      improvementRate,
      ranking: 0 // Will be set after all schools are processed
    });
  }
  
  // Sort schools by overall average and assign rankings
  summaries.sort((a, b) => b.overallAverage - a.overallAverage);
  summaries.forEach((summary, index) => {
    summary.ranking = index + 1;
  });
  
  return summaries;
}
