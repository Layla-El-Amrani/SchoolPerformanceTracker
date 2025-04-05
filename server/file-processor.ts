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
    
    // Validate headers and map standard headers to the custom format headers
    const headerRow = worksheet.getRow(1);
    const headers = headerRow.values as (string | undefined)[];
    
    console.log("Excel headers found:", headers);
    
    // Create a mapping between expected headers and possible custom headers
    const headerMappings = {
      "School": ["School", "NOM_ETABA", "Secteur Scolaire م م", "la_com", "School Name", "Établissement", "Etab", "EtablissementNom", "المدرسة", "المؤسسة"],
      "Subject": ["Subject", "matiere", "matiereAr", "BAPG", "MatiereAr", "Matière", "Sujet", "Subject Name", "المادة", "المواد"],
      "Average Score": ["Average Score", "moyenneSession", "moyenneExam", "prExamen", "moyenneCC", "moyenneNoteCC", "MoyenneSession", "MoyenneExam", "MoynneCC", "MoyenneNoteCC_Note"],
      "Pass Rate": ["Pass Rate", "Note", "Notes", "moyenneNoteCC", "NoteExamen_Note", "MoyenneNoteCC_Note", "MoyenneSession"]
    };
    
    // Helper function to find a header column index based on multiple possible header names
    const findHeaderIndex = (possibleNames: string[]): number => {
      for (const name of possibleNames) {
        const index = headers.findIndex(h => {
          if (!h) return false;
          const headerStr = h.toString().toLowerCase();
          const searchStr = name.toLowerCase();
          return headerStr === searchStr || headerStr.includes(searchStr);
        });
        if (index !== -1) return index;
      }
      return -1;
    };

    // Check if we have all required headers or their alternates
    const missingHeaderTypes: string[] = [];
    
    // For each required header type, check if at least one of its possible names exists
    for (const [headerType, possibleNames] of Object.entries(headerMappings)) {
      if (findHeaderIndex(possibleNames) === -1) {
        missingHeaderTypes.push(headerType);
      }
    }
    
    if (missingHeaderTypes.length > 0) {
      return { 
        studentPerformances: [], 
        error: `Missing required headers: ${missingHeaderTypes.join(", ")}` 
      };
    }
    
    // Map column indices using the first found header for each type
    const schoolColIndex = findHeaderIndex(headerMappings["School"]);
    const subjectColIndex = findHeaderIndex(headerMappings["Subject"]);
    const averageScoreColIndex = findHeaderIndex(headerMappings["Average Score"]);
    const passRateColIndex = findHeaderIndex(headerMappings["Pass Rate"]);
    
    // Optional header
    const attendanceRateColIndex = headers.findIndex(h => 
      h?.toString().toLowerCase() === "attendance rate"
    );
    
    // Create a helper function to find or create a school by name
    const findOrCreateSchool = async (name: string): Promise<any> => {
      let school = schools.find(s => s.name.toLowerCase() === name.toLowerCase());
      if (!school) {
        try {
          // Auto-create school if it doesn't exist
          school = await storage.createSchool({
            name: name,
            location: "",
            type: "Public"
          });
          
          // Add the newly created school to our local array
          schools.push(school);
          console.log(`Created new school: ${name}`);
        } catch (error) {
          throw new Error(`Failed to create school "${name}": ${error}`);
        }
      }
      return school;
    };
    
    // Create a helper function to find or create a subject by name
    const findOrCreateSubject = async (name: string): Promise<any> => {
      let subject = subjects.find(s => s.name.toLowerCase() === name.toLowerCase());
      if (!subject) {
        try {
          // Auto-create subject if it doesn't exist
          const code = name.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');
          subject = await storage.createSubject({
            name: name,
            code: code || "SUBJ"
          });
          
          // Add the newly created subject to our local array
          subjects.push(subject);
          console.log(`Created new subject: ${name}`);
        } catch (error) {
          throw new Error(`Failed to create subject "${name}": ${error}`);
        }
      }
      return subject;
    };
    
    // Process rows sequentially to support async operations
    for (let i = 2; i <= worksheet.rowCount; i++) {
      const row = worksheet.getRow(i);
      const rowNumber = i;
      
      if (!row.values || row.values.length === 0) continue;
      
      const values = row.values as (string | number | undefined)[];
      
      const schoolName = values[schoolColIndex]?.toString().trim();
      const subjectName = values[subjectColIndex]?.toString().trim();
      const averageScoreStr = values[averageScoreColIndex]?.toString().trim();
      const passRateStr = values[passRateColIndex]?.toString().trim();
      const attendanceRateStr = attendanceRateColIndex >= 0 ? values[attendanceRateColIndex]?.toString().trim() : undefined;
      
      // Log the values being processed for debugging
      console.log(`Processing row ${rowNumber}: School=${schoolName}, Subject=${subjectName}, Score=${averageScoreStr}, Rate=${passRateStr}`);
      
      // Validate required fields
      if (!schoolName || !subjectName || !averageScoreStr || !passRateStr) {
        errors.push(`Row ${rowNumber} has missing required data`);
        continue;
      }
      
      try {
        // Find or create school and subject
        const school = await findOrCreateSchool(schoolName);
        const subject = await findOrCreateSubject(subjectName);
      
        // Parse scores and rates
        const averageScore = parsePercentage(averageScoreStr);
        const passRate = parsePercentage(passRateStr);
        const attendanceRate = attendanceRateStr ? parsePercentage(attendanceRateStr) : undefined;
        
        if (averageScore === null || passRate === null) {
          errors.push(`Row ${rowNumber}: Invalid score or rate values`);
          continue;
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
        errors.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
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
    
    // Create a helper function to find or create a school by name
    const findOrCreateSchool = async (name: string): Promise<any> => {
      let school = schools.find(s => s.name.toLowerCase() === name.toLowerCase());
      if (!school) {
        try {
          // Auto-create school if it doesn't exist
          school = await storage.createSchool({
            name: name,
            location: "",
            type: "Public"
          });
          
          // Add the newly created school to our local array
          schools.push(school);
          console.log(`Created new school: ${name}`);
        } catch (error) {
          throw new Error(`Failed to create school "${name}": ${error}`);
        }
      }
      return school;
    };
    
    // Create a helper function to find or create a subject by name
    const findOrCreateSubject = async (name: string): Promise<any> => {
      let subject = subjects.find(s => s.name.toLowerCase() === name.toLowerCase());
      if (!subject) {
        try {
          // Auto-create subject if it doesn't exist
          const code = name.substring(0, 4).toUpperCase().replace(/[^A-Z0-9]/g, '');
          subject = await storage.createSubject({
            name: name,
            code: code || "SUBJ"
          });
          
          // Add the newly created subject to our local array
          subjects.push(subject);
          console.log(`Created new subject: ${name}`);
        } catch (error) {
          throw new Error(`Failed to create subject "${name}": ${error}`);
        }
      }
      return subject;
    };
    
    // Extract performance data from XML structure
    // Handle different possible root element names
    let performanceRecords: any[] = [];
    
    // Cast the result to any to avoid TypeScript errors with dynamic properties
    const resultAny = result as any;
    
    if (resultAny.performances?.performance) {
      performanceRecords = resultAny.performances.performance;
    } else if (resultAny.data?.record) {
      performanceRecords = resultAny.data.record;
    } else {
      // Try to find any element that might contain the data
      for (const key in resultAny) {
        if (resultAny[key] && typeof resultAny[key] === 'object') {
          for (const subKey in resultAny[key]) {
            if (Array.isArray(resultAny[key][subKey])) {
              performanceRecords = resultAny[key][subKey];
              break;
            }
          }
        }
        if (performanceRecords.length > 0) break;
      }
    }
    
    if (!Array.isArray(performanceRecords)) {
      if (performanceRecords._text !== undefined) {
        // Handle case where there's only one record
        const record = performanceRecords;
        await processXmlRecord(record, findOrCreateSchool, findOrCreateSubject, performanceData, errors, academicYearId, termId);
      } else {
        // Convert to array if it's an object but not an array
        performanceRecords = [performanceRecords];
      }
    }
    
    if (Array.isArray(performanceRecords)) {
      // Handle multiple records
      for (const record of performanceRecords) {
        await processXmlRecord(record, findOrCreateSchool, findOrCreateSubject, performanceData, errors, academicYearId, termId);
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
async function processXmlRecord(
  record: any, 
  findOrCreateSchool: (name: string) => Promise<any>,
  findOrCreateSubject: (name: string) => Promise<any>,
  performanceData: PerformanceData[], 
  errors: string[], 
  academicYearId: number, 
  termId?: number
) {
  try {
    // Try multiple possible field names for school and subject
    const schoolFields = ['school', 'schoolName', 'NOM_ETABA', 'etablissement', 'المدرسة', 'المؤسسة'];
    const subjectFields = ['subject', 'subjectName', 'matiere', 'matiereAr', 'BAPG', 'المادة'];
    const scoreFields = ['averageScore', 'score', 'moyenneSession', 'moyenneExam', 'prExamen', 'moyenneCC', 'moyenneNoteCC'];
    const rateFields = ['passRate', 'rate', 'Note', 'Notes', 'moyenneNoteCC'];
    
    // Extract school name
    let schoolName;
    for (const field of schoolFields) {
      if (record[field]?._text) {
        schoolName = record[field]._text;
        break;
      }
    }
    
    // Extract subject name
    let subjectName;
    for (const field of subjectFields) {
      if (record[field]?._text) {
        subjectName = record[field]._text;
        break;
      }
    }
    
    // Extract average score
    let averageScoreStr;
    for (const field of scoreFields) {
      if (record[field]?._text) {
        averageScoreStr = record[field]._text;
        break;
      }
    }
    
    // Extract pass rate
    let passRateStr;
    for (const field of rateFields) {
      if (record[field]?._text) {
        passRateStr = record[field]._text;
        break;
      }
    }
    
    // Extract attendance rate (optional)
    const attendanceRateStr = record.attendanceRate?._text;
    
    if (!schoolName || !subjectName || !averageScoreStr || !passRateStr) {
      errors.push(`XML record has missing required data`);
      return;
    }
    
    // Find or create school and subject
    const school = await findOrCreateSchool(schoolName);
    const subject = await findOrCreateSubject(subjectName);
    
    // Parse scores and rates
    const averageScore = parsePercentage(averageScoreStr);
    const passRate = parsePercentage(passRateStr);
    const attendanceRate = attendanceRateStr ? parsePercentage(attendanceRateStr) : undefined;
    
    if (averageScore === null || passRate === null) {
      errors.push(`Invalid score or rate values in XML record`);
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
  const numStr = value.replace(/%|,/g, '.').trim();
  const num = parseFloat(numStr);
  
  if (isNaN(num)) return null;
  
  // When the value is exceptionally small, it might be that it's already given as a decimal (0.85 instead of 85)
  if (num < 1) {
    return Math.round(num * 100);
  }
  
  return Math.round(num);
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